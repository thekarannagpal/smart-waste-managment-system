# Smart Waste Management System

This is a comprehensive hackathon starter project featuring a React Frontend, Node.js Backend, and a Python Machine Learning service for AI garbage detection and hotspot prediction.

## Prerequisites
- **Node.js** (v18+)
- **Python** (3.8+)
- **MongoDB Atlas URI** (Already configured in `backend/.env`)

---

## 🚀 How to Run the Complete Stack Locally

You will need to run the three different services (Frontend, Backend, and ML Service) side-by-side. The easiest way is to open **Three separate Terminal/PowerShell windows**.

### 1. Run the Frontend (React + Vite)
In the **First Terminal Window**, run:
```bash
cd frontend
npm install   # If you haven't installed packages yet
npm run dev
```
> **Note:** This starts the Vite development server. You can view the UI by opening your browser to `http://localhost:5173`.

### 2. Run the Node.js Backend (Express)
In the **Second Terminal Window**, run:
```bash
cd backend
npm install   # If you haven't installed packages yet
node src/index.js
```
> **Note:** The backend API will start on port `5000` and will automatically connect to your MongoDB Atlas database.

### 3. Run the ML Service (Python + FastAPI)
In the **Third Terminal Window**, run:
```bash
cd ml-service

# Activate the virtual environment
.\venv\Scripts\activate

# Install requirements (if not done)
# pip install fastapi uvicorn python-multipart scikit-learn ultralytics requests

# 🚀 Start the Service
uvicorn main:app --reload
```
> **Note:** The Machine Learning Service will run on port `8000` (`http://localhost:8000`). It exposes the `/detect` endpoint for the YOLOv8 model inference.

---

### What's Next for the Hackathon?
- The backend `index.js` currently mocks the call to the Python ML Service for the MVP presentation. You can update the `app.post('/api/reports')` route in `backend/src/index.js` to send real API requests to `http://localhost:8000/detect`.
- Navigate to the frontend dashboard and try uploading waste photos!
