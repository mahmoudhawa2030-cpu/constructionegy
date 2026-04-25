# YOLO12n Model for Object Counter

## Auto-Download (Default Behavior)

**The app now automatically downloads the model from CDN on first use!**

When a user opens the Things Counter for the first time:
1. The app checks for a local model file
2. If not found, it automatically downloads from jsDelivr CDN
3. The model is cached in the browser for subsequent uses
4. Download size: ~5-6MB (one-time)

**No manual setup required!**

## Manual Download (Optional)

If you prefer to include the model in your deployment (faster first load), download it manually:

### Option 1: Using Python with Ultralytics

```bash
pip install ultralytics
python -c "from ultralytics import YOLO; model = YOLO('yolo12n'); model.export(format='tflite')"

# Move to app directory
mv yolo12n_float16.tflite public/models/yolo12n/
```

### Option 2: Download from GitHub Releases

- URL: https://github.com/ultralytics/assets/releases
- Look for: `yolo12n_float16.tflite`
- Place in: `public/models/yolo12n/yolo12n_float16.tflite`

## Model Specifications

- **Model**: YOLO12n (Nano)
- **Format**: TensorFlow Lite (Float16)
- **Input Size**: 640x640
- **Classes**: 80 (COCO dataset)
- **File Size**: ~5-6 MB
- **Speed**: ~50-200ms per image on mobile CPU

## Alternative: YOLOv8n

If YOLO12n is not available, you can use YOLOv8n which is widely available:

```bash
python -c "from ultralytics import YOLO; model = YOLO('yolov8n'); model.export(format='tflite')"
```

Then rename the file to `yolo12n_float16.tflite` or update the path in `use-yolo12n.ts`.

## COCO Classes

The model can detect 80 common object classes including:
- person, car, bicycle, motorcycle, bus, truck
- bird, cat, dog, horse, sheep, cow
- bottle, cup, fork, knife, spoon, bowl
- chair, couch, bed, dining table, toilet
- laptop, mouse, remote, keyboard, cell phone
- book, clock, vase, scissors, teddy bear

## Troubleshooting

### Model not loading
- Check that the file exists at `public/models/yolo12n/yolo12n_float16.tflite`
- Verify the file size is approximately 5-6 MB
- Check browser console for error messages

### Slow performance
- The model runs on CPU via WebAssembly
- For better performance, use smaller input images
- Consider using YOLOv8n instead if YOLO12n is too slow

### Out of memory errors
- Close other browser tabs
- Restart the browser
- Use a device with more RAM
