from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import shutil
import os
import random

# For YOLOv8
try:
    from ultralytics import YOLO
    # Since we are creating a generic MVP, we use the default YOLOv8 object detection model
    # It might detect 'bottle', 'cup', etc. 
    model = YOLO('yolov8n.pt') 
    YOLO_AVAILABLE = True
except ImportError:
    print("Ultralytics not installed. Falling back to mock detection.")
    YOLO_AVAILABLE = False


app = FastAPI(title="Waste Management ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs('temp_uploads', exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Waste Management ML Service is running"}

@app.post("/detect")
async def detect_garbage(file: UploadFile = File(...)):
    file_path = f"temp_uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    predictions = []
    
    if YOLO_AVAILABLE:
        try:
            results = model(file_path)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = model.names[cls]
                    
                    # Map COCO classes to waste types roughly
                    waste_category = "mixed"
                    if label in ['bottle', 'cup', 'wine glass']:
                        waste_category = 'plastic'
                    elif label in ['apple', 'orange', 'broccoli', 'carrot']:
                        waste_category = 'organic'
                    elif label in ['paper', 'book']:
                        waste_category = 'paper'
                    
                    # We log the detection
                    predictions.append({
                        "label": label,
                        "waste_type": waste_category,
                        "confidence": conf,
                        "bbox": box.xyxy[0].tolist() 
                    })
        except Exception as e:
            print(f"Prediction failed: {e}")
    
    # If YOLO didn't find anything or wasn't available
    if not predictions:
        predictions.append({
             "label": "none",
             "waste_type": "No waste detected",
             "confidence": 0.0,
             "bbox": [0, 0, 0, 0]
        })

    # Find the prediction with highest confidence to return a single primary result
    best_pred = max(predictions, key=lambda x: x["confidence"])

    # Clean up file
    os.remove(file_path)

    return {
        "success": True,
        "primary_detection": best_pred,
        "all_detections": predictions
    }

# Scikit-learn for Hotspot Prediction
@app.post("/predict_hotspots")
async def predict_hotspots(data: dict):
    # Dummy logic: Return predefined cluster centers near some coords
    reports = data.get('reports', [])
    if not reports:
        return {"hotspots": []}
        
    # In a real app, we'd use sklearn.cluster.KMeans here
    # Mocking K-means for rapid prototyping
    hotspots = []
    for _ in range(3):  # find 3 hotspots
        random_report = random.choice(reports)
        lat, lng = random_report['location']['coordinates'][1], random_report['location']['coordinates'][0]
        hotspots.append({
            "lat": lat + (random.random() - 0.5) * 0.01,
            "lng": lng + (random.random() - 0.5) * 0.01,
            "weight": random.randint(5, 50)
        })

    return {"hotspots": hotspots}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
