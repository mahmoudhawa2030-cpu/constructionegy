"""
FairScan TFLite -> TF.js conversion script
Downloads the latest FairScan segmentation model and converts it to TF.js format.
Output: public/models/document-scanner/
"""

import subprocess
import sys
import os
import urllib.request
import zipfile
import json

# ── Config ────────────────────────────────────────────────────────────────────
TFLITE_URL = "https://github.com/pynicolas/fairscan-segmentation-model/releases/download/v1.2.0/model.tflite"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "models", "document-scanner")
TFLITE_PATH = os.path.join(OUTPUT_DIR, "model.tflite")

# ── Step 1: Install dependencies ──────────────────────────────────────────────
def install_deps():
    print("\n[1/4] Installing tensorflowjs...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflowjs", "requests", "--quiet"])
    print("      Done.")

# ── Step 2: Download model ────────────────────────────────────────────────────
def download_model():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    if os.path.exists(TFLITE_PATH):
        print(f"\n[2/4] model.tflite already exists, skipping download.")
        return
    print(f"\n[2/4] Downloading FairScan model from GitHub...")
    print(f"      URL: {TFLITE_URL}")

    def progress(block, block_size, total):
        done = block * block_size
        pct = min(100, int(done * 100 / total)) if total > 0 else 0
        print(f"\r      {pct}% ({done // 1024} KB / {total // 1024} KB)", end="", flush=True)

    urllib.request.urlretrieve(TFLITE_URL, TFLITE_PATH, reporthook=progress)
    print(f"\n      Saved to {TFLITE_PATH}")

# ── Step 3: Convert to TF.js ──────────────────────────────────────────────────
def convert_model():
    print(f"\n[3/4] Converting TFLite -> TF.js...")
    cmd = [
        sys.executable, "-m", "tensorflowjs.converters.converter",
        "--input_format=tflite",
        TFLITE_PATH,
        OUTPUT_DIR,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("      ERROR during conversion:")
        print(result.stderr)
        # Try alternative converter invocation
        print("      Retrying with tensorflowjs_converter command...")
        cmd2 = [
            "tensorflowjs_converter",
            "--input_format=tflite",
            TFLITE_PATH,
            OUTPUT_DIR,
        ]
        result2 = subprocess.run(cmd2, capture_output=True, text=True)
        if result2.returncode != 0:
            print("      ERROR:")
            print(result2.stderr)
            sys.exit(1)
    print("      Conversion successful.")

# ── Step 4: Write metadata ────────────────────────────────────────────────────
def write_metadata():
    meta_path = os.path.join(OUTPUT_DIR, "meta.json")
    meta = {
        "source": "FairScan v1.2.0",
        "architecture": "DeepLabV3Plus + MobileNetV2",
        "input_size": 256,
        "input_format": "float32 normalized [0,1]",
        "output": "segmentation mask",
        "license": "GPL-3.0",
        "converted_by": "convert-fairscan-model.py"
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\n[4/4] Metadata written to {meta_path}")

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  FairScan Model Converter")
    print("=" * 55)
    install_deps()
    download_model()
    convert_model()
    write_metadata()

    print("\n" + "=" * 55)
    print("  SUCCESS!")
    print(f"  Model files saved to:")
    print(f"  {os.path.abspath(OUTPUT_DIR)}")
    files = os.listdir(OUTPUT_DIR)
    for f in files:
        size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
        print(f"    {f}  ({size // 1024} KB)")
    print("=" * 55)
    print("\nNext: the scanner will automatically use the model.")
