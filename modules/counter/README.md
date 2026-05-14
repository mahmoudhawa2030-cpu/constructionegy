# Things Counter Module

A reusable React component for counting objects in images using Roboflow API.

## Features

- Camera capture with flashlight support
- Image upload from gallery
- Interactive crop selection with 8-point resize handles
- Real-time object detection
- Bounding box visualization
- Bilingual UI (Arabic/English)

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

### Environment Variables
```env
ROBOFLOW_API_KEY=your_roboflow_api_key
```

## Installation

1. Copy the module files to your app:
   ```
   cp -r modules/counter/components/your-app/components/counter
   cp -r modules/counter/lib/your-app/lib/tools
   ```

2. Add i18n keys to your messages files:
   ```json
   // messages/en.json
   {
     "counter": {
       "title": "Things Counter",
       "retake": "Retake",
       "upload": "Upload from gallery",
       "capture": "Take photo",
       "flashlight": "Flashlight",
       "detecting": "Detecting...",
       "count": "Count",
       "totalObjects": "Total Count",
       "selectMode": "What are you counting?",
       "modePipes": "Pipes",
       "modePipesDesc": "Steel pipes viewed from the end",
       "noPipesFound": "No pipes detected",
       "cropHint": "Drag handles to adjust"
     }
   }
   ```

3. Add to your app routing:
   ```tsx
   // app/tools/counter/page.tsx
   import ObjectCounter from "@/components/counter/object-counter";
   
   export default function CounterPage() {
     return <ObjectCounter />;
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
     --bina-steel2: #f3f4f6;
     --bina-steel3: #e5e7eb;
     --bina-topbar: rgba(255,255,255,0.95);
   }
   ```

## Configuration

### Changing the Detection Model
Edit `lib/tools/roboflow-detect.ts`:
```typescript
const ROBOFLOW_MODEL = "your-model-id/version";
const ROBOFLOW_URL = "https://detect.roboflow.com"; // or your self-hosted URL
```

### Adding New Detection Modes
1. Update the `DetectionMode` type in `object-counter.tsx`
2. Add mode UI in the mode selection screen
3. Update the Roboflow model or add conditional logic

## File Structure

```
counter/
├── components/
│   └── counter/
│       ├── object-counter.tsx    # Main component
│       └── page.tsx              # Route wrapper
├── lib/
│   └── tools/
│       └── roboflow-detect.ts    # API integration
└── messages/
    ├── en.json                   # English translations
    └── ar.json                   # Arabic translations
```
