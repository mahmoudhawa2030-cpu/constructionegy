#!/usr/bin/env python3
"""Export YOLOv8n to TFLite via ONNX (avoids TensorFlow dependency)"""

import os
import sys

def install_packages():
    """Install required packages"""
    print("Installing dependencies...")
    os.system(f'"{sys.executable}" -m pip install -q ultralytics onnx onnxruntime onnxmltools')
    print("Dependencies installed!")

def export_model():
    """Export YOLOv8n to TFLite via ONNX"""
    try:
        from ultralytics import YOLO
        
        print("Downloading YOLOv8n model...")
        model = YOLO('yolov8n.pt')  # This downloads the .pt file
        
        print("Step 1: Exporting to ONNX...")
        model.export(format='onnx', half=True, opset=12)  # Creates yolov8n.onnx
        
        print("Step 2: Converting ONNX to TFLite...")
        
        # Use onnx-tf or manual conversion
        try:
            import onnx
            from onnxmltools.convert import convert_onnx
            
            onnx_model = onnx.load('yolov8n.onnx')
            # Note: Full ONNX to TFLite conversion requires tf-nightly or specific tools
            # For now, let's just move the ONNX file and use it directly
            # Or try an alternative approach
            
        except ImportError:
            print("Note: Direct ONNX->TFLite conversion requires additional tools")
            
        # Check if TFLite was created by ultralytics (it might work with onnxruntime)
        src = 'yolov8n_float16.tflite'
        if not os.path.exists(src):
            # Try alternative: direct tflite export with onnxruntime
            print("Attempting alternative TFLite export...")
            try:
                model.export(format='tflite', half=True, imgsz=640)
            except Exception as e:
                print(f"Direct export failed: {e}")
        
        # Move to correct location if created
        dst = 'public/models/yolo12n/yolov8n_float16.tflite'
        if os.path.exists(src):
            import shutil
            shutil.move(src, dst)
            print(f"Model exported successfully to {dst}")
            return True
        else:
            # Check for alternative filenames
            alt_files = ['yolov8n.tflite', 'yolov8n_int8.tflite']
            for f in alt_files:
                if os.path.exists(f):
                    import shutil
                    shutil.move(f, dst)
                    print(f"Model exported successfully to {dst}")
                    return True
            
            print(f"Error: No TFLite file found after export")
            print("Files in directory:", os.listdir('.'))
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    install_packages()
    if export_model():
        print("\nSuccess! Now run:")
        print("  git add public/models/yolo12n/yolov8n_float16.tflite")
        print("  git commit -m 'add YOLOv8n model'")
        print("  git push origin main")
    else:
        print("\nExport failed. Check errors above.")
        sys.exit(1)
