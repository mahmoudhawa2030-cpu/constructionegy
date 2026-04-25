# YOLO Model for Object Counter

## Auto-Download (Default Behavior) ✓

**The app automatically downloads YOLOv8n from CDN on first use!**

When a user opens the Things Counter for the first time:
1. The app checks for a local model file
2. If not found, it automatically downloads YOLOv8n from GitHub releases
3. The model is cached in the browser for subsequent uses
4. Download size: ~3.5MB (one-time)

**No manual setup required!**

## Manual Download (Optional)

If you prefer to include the model locally (faster first load):

### Option 1: Direct Download

```bash
cd public/models/yolo12n/
curl -L -o yolov8n_float16.tflite "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n_float16.tflite"
```

### Option 2: Using Python with Ultralytics

```bash
pip install ultralytics
python -c "from ultralytics import YOLO; model = YOLO('yolov8n'); model.export(format='tflite')"
mv yolov8n_float16.tflite public/models/yolo12n/
```

## Model Specifications

- **Model**: YOLOv8n (Nano) 
- **Format**: TensorFlow Lite (Float16)
- **Input Size**: 640x640
- **Classes**: 80 (COCO dataset)
- **File Size**: ~3.5 MB
- **Speed**: ~50-150ms per image on mobile CPU

## Why YOLOv8n instead of YOLO12n?

YOLOv8n is used because:
1. **Proven TFLite export support** - YOLO12 TFLite export is still being stabilized
2. **Widely available** - Available on GitHub releases and CDNs
3. **Fast & accurate** - Excellent speed/accuracy tradeoff for mobile
4. **Same 80 COCO classes** - Detects the same objects as YOLO12

## COCO Classes

The model can detect 80 common object classes including:
- person, car, bicycle, motorcycle, bus, truck
- bird, cat, dog, horse, sheep, cow
- bottle, cup, fork, knife, spoon, bowl
- chair, couch, bed, dining table, toilet
- laptop, mouse, remote, keyboard, cell phone
- book, clock, vase, scissors, teddy bear

## Troubleshooting

### Model not loading / Download fails
- Check internet connection
- The app auto-downloads from: `https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n_float16.tflite`
- Check browser console (F12 → Console) for error messages
- If download fails repeatedly, manually download the model file

### Slow performance
- The model runs on CPU via WebAssembly
- For better performance, use smaller input images
- First detection is slower (model initialization), subsequent ones are faster

### Out of memory errors
- Close other browser tabs
- Restart the browser
- Use a device with more RAM
