require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // For communicating with ML service
const FormData = require('form-data');

const User = require('./models/User');
const Report = require('./models/Report');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());

// Setup Multer for image uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });
// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/waste-management')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));


// --- API Endpoints ---

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    user = new User({ username, email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id, role: user.role, username: user.username } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload.user });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid Credentials' });

    const payload = { user: { id: user.id, role: user.role, username: user.username } };
    jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: payload.user });
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get all reports (for map/dashboard)
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().populate('userId', 'username');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new report (receives image + coords)
app.post('/api/reports', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.id;
    if (!req.file || !lat || !lng) {
      return res.status(400).json({ error: 'Image and location are required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const absoluteImagePath = req.file.path;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_NEW_API_KEY_HERE';

    let prediction = { wasteType: 'unknown', confidence: 0 };
    try {
      const mimeType = req.file.mimetype;
      const base64Image = fs.readFileSync(absoluteImagePath).toString('base64');

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [{
          parts: [
            { text: "Analyze the image and determine if there is any visible waste or garbage. If there is strictly no waste (e.g., a normal room, landscape, person, etc.), set 'waste_type' to 'none'. If there is waste, identify the primary type from this list: plastic, organic, paper, metal, glass, mixed. Respond ONLY with a valid JSON object: {\"waste_type\": \"...\", \"confidence\": 0.95}. Do not use markdown backticks or any other text." },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }]
      };

      const geminiResp = await axios.post(geminiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      try {
        const outputText = geminiResp.data.candidates[0].content.parts[0].text.trim();
        // Remove markdown formatting if Gemini still adds it
        const cleanJson = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        prediction.wasteType = parsed.waste_type ? parsed.waste_type.toLowerCase() : 'none';
        prediction.confidence = parsed.confidence || 0;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', geminiResp.data.candidates?.[0]?.content?.parts?.[0]);
      }
    } catch (apiError) {
      console.error('Gemini API Error:', apiError.response?.data || apiError.message);
      return res.status(502).json({ error: 'Failed to detect with Gemini key: ' + (apiError.response?.data?.error?.message || apiError.message) });
    }

    if (prediction.wasteType === 'none' || prediction.wasteType === 'unknown') {
      return res.status(400).json({ error: 'No waste material spotted, please try again.' });
    }

    const newReport = new Report({
      userId: userId || null,
      imageUrl,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      wasteType: prediction.wasteType,
      confidence: prediction.confidence,
      status: 'pending',
      pointsAwarded: 10
    });

    await newReport.save();

    // Award points to user if logged in
    if (userId) {
      await User.findByIdAndUpdate(
        userId, 
        { 
          $inc: { points: 10 },
          $setOnInsert: { username: 'Local Citizen' }
        }, 
        { upsert: true, new: true }
      );
    }

    res.status(201).json(newReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Assign task to collector
app.post('/api/reports/:id/assign', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'collector') return res.status(403).json({ error: 'Only collectors can accept tasks' });
    
    let report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.status !== 'pending') return res.status(400).json({ error: 'Task is no longer pending' });

    report.status = 'assigned';
    report.assignedTo = req.user.id;
    await report.save();

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete cleaning task
app.post('/api/reports/:id/complete', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'collector') return res.status(403).json({ error: 'Only collectors can complete tasks' });
    if (!req.file) return res.status(400).json({ error: 'Proof image is required' });

    let report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.assignedTo.toString() !== req.user.id) return res.status(403).json({ error: 'Task not assigned to you' });
    if (report.status !== 'assigned') return res.status(400).json({ error: 'Task is not in assigned state' });

    // AI Verification step
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_NEW_API_KEY_HERE';
    const mimeType = req.file.mimetype;
    const base64Image = fs.readFileSync(req.file.path).toString('base64');
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = {
      contents: [{
        parts: [
          { text: "Analyze this image. Does this physical area look clean and mostly free of large visible trash/garbage? If there is still noticeable waste lying around, or if the image is completely irrelevant (e.g. a selfie, random object indoors), return {\"is_clean\": false}. If the area looks cleared up, return {\"is_clean\": true}. Respond ONLY with a valid JSON object. Do not use markdown." },
          { inlineData: { mimeType: mimeType, data: base64Image } }
        ]
      }]
    };
    
    try {
      const geminiResp = await axios.post(geminiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
      const outputText = geminiResp.data.candidates[0].content.parts[0].text.trim();
      const cleanJson = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (!parsed.is_clean) {
        fs.unlinkSync(req.file.path); // Remove failed proof image
        return res.status(400).json({ error: 'AI Verification Failed: The system still detects waste or an invalid image in your proof.' });
      }
    } catch (apiError) {
      console.error('Gemini API Error details:', apiError.response?.data || apiError.message);
      return res.status(400).json({ error: 'Failed to verify image using AI.' });
    }

    report.status = 'completed';
    report.completionProofUrl = `/uploads/${req.file.filename}`;
    await report.save();

    // Reward collector
    await User.findByIdAndUpdate(req.user.id, { $inc: { points: 20 } });
    
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Gamification: Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 }).limit(10).select('username points badges');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
