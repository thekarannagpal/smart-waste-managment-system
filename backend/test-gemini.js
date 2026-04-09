const axios = require('axios');
const key = process.env.GEMINI_API_KEY || 'YOUR_NEW_API_KEY_HERE';
axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => console.log(res.data.models.map(m => m.name).join(', ')))
  .catch(err => console.error(err.message));
