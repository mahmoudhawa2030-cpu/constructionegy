# Document Scanner Module

A full-featured document scanner with AI-powered edge detection and multiple filter options.

## Features

- Automatic document edge detection using ML models
- Manual corner adjustment
- 8 filter options including AI enhancement
- Multi-page document support
- Export to JPEG
- Bilingual UI (Arabic/English)
- Camera capture with flashlight
- Image upload support

## Dependencies

### Required Packages
```json
{
  "dependencies": {
    "@capacitor/camera": "^6.0.0",
    "lucide-react": "^0.400.0",
    "next-intl": "^3.0.0"
  }
}
```

### External Scripts (loaded automatically)
- OpenCV.js (v4.8.0) - for image processing
- TensorFlow.js - for document segmentation
- MIRNet model - for AI enhancement

## Installation

1. Copy the module files to your app:
   ```
   cp -r modules/scanner/components/your-app/components/scanner
   ```

2. Add i18n keys to your messages files (see messages/en.json and ar.json in this module)

3. Add to your app routing:
   ```tsx
   // app/tools/scanner/page.tsx
   import { DocumentScanner } from "@/components/scanner/document-scanner";
   
   export default function ScannerPage() {
     return <DocumentScanner />;
   }
   ```

4. Import CSS variables (if using custom theme):
   ```css
   :root {
     --bina-primary: #f97316;
     --bina-bg: #ffffff;
     --bina-text: #000000;
     --bina-border: #e5e7eb;
     --bina-muted: #6b7280;
   }
   ```

## File Structure

```
scanner/
├── components/
│   └── scanner/
│       ├── document-scanner.tsx    # Main scanner component
│       ├── image-utils.ts          # Image processing utilities
│       ├── use-opencv.ts           # OpenCV loading hook
│       ├── use-tflite.ts           # TensorFlow model loading
│       └── use-mirnet.ts           # AI enhancement model
└── messages/
    ├── en.json                     # English translations
    └── ar.json                     # Arabic translations
```

## Configuration

### Custom Filters
Add new filters in `image-utils.ts` by extending the `FilterType` type and adding logic to `applyFilter()`.

### Model URLs
The TensorFlow and MIRNet models are loaded from CDN. Update URLs in `use-tflite.ts` and `use-mirnet.ts` if needed.

## Performance Notes

- OpenCV.js is ~3MB and loads on first use
- TensorFlow models are cached after first load
- AI enhancement (MIRNet) processes images at 256x256 resolution
