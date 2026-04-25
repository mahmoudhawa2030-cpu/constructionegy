# YOLO12n Model for Object Counter

This folder should contain the YOLO12n TensorFlow Lite model for the Things Counter feature.

## Model Download

The model file `yolo12n_float16.tflite` needs to be downloaded and placed in this folder.

### Option 1: Download from Ultralytics (Recommended)

```bash
# Using Python with Ultralytics
pip install ultralytics
python -c "from ultralytics import YOLO; model = YOLO('yolo12n'); model.export(format='tflite')"

# The model will be saved as yolo12n_float16.tflite in the current directory
# Move it to: public/models/yolo12n/yolo12n_float16.tflite
```

### Option 2: Download Pre-converted Model

Download from the official Ultralytics releases:
- URL: https://github.com/ultralytics/assets/releases
- Look for: `yolo12n_float16.tflite`
- Place in: `public/models/yolo12n/yolo12n_float16.tflite`

### Option 3: Using Hugging Face

```bash
# Install huggingface_hub
pip install huggingface-hub

# Download model
huggingface-cli download ultralytics/YOLO12 yolo12n_float16.tflite --local-dir .
```

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
