# Installation Guide - Portable Modules

This guide explains how to install the Things Counter and Document Scanner modules in your Next.js application.

## Prerequisites

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS (optional, but recommended)
- next-intl for internationalization (optional, modules work without it)

## Quick Install

### 1. Copy Modules to Your App

```bash
# Copy all modules
cp -r modules/* your-app/

# Or copy individual modules
cp -r modules/counter your-app/components/
cp -r modules/scanner your-app/components/
```

### 2. Install Dependencies

```bash
npm install @capacitor/camera lucide-react next-intl
```

### 3. Add Environment Variables

Create `.env.local`:
```env
ROBOFLOW_API_KEY=your_api_key_here  # Required for Things Counter
```

### 4. Add Routes

Create route files:
```tsx
// app/tools/counter/page.tsx
import ObjectCounter from "@/components/counter/components/counter/page";

export default function CounterPage() {
  return <ObjectCounter />;
}

// app/tools/scanner/page.tsx
import ScannerPage from "@/components/scanner/components/scanner/page";

export default function ScannerPage() {
  return <ScannerPage />;
}

// app/tools/dwg-viewer/page.tsx
import DwgViewerPage from "@/components/dwg-viewer/components/dwg-viewer/page";

export default function DwgViewerPage() {
  return <DwgViewerPage />;
}
```

### 5. Add Translations (Optional)

Merge the JSON files from `modules/*/messages/` into your `messages/en.json` and `messages/ar.json`.

### 6. Add CSS Variables (Optional)

Add to your global CSS:
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

## Module-Specific Setup

### Things Counter

1. **Roboflow API Key**: Get a free key from https://roboflow.com
2. **Model Configuration**: Edit `lib/tools/roboflow-detect.ts` to change models
3. **Camera Permissions**: Ensure your app requests camera permissions

### Document Scanner

1. **No API Keys Required**: Works completely offline
2. **Model Loading**: OpenCV.js (~3MB) loads on first use
3. **Performance**: Consider lazy loading the scanner component

### DWG Viewer

1. **LibreCAD Required**: Install LibreCAD on server for DWG conversion
2. **Docker Alternative**: Use `construction-egy/dwg-converter` Docker image
3. **Node.js Runtime**: Must use Node.js runtime, not Edge
4. **File Storage**: Configure Cloudflare R2 or use direct response

## Capacitor Setup (for Mobile Apps)

If using Capacitor:

1. Install camera plugin:
```bash
npm install @capacitor/camera
npx cap sync
```

2. Add permissions to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

3. Add to `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan documents and count objects</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to import images</string>
```

## Customization

### Changing Detection Models

For Things Counter, edit `lib/tools/roboflow-detect.ts`:
```typescript
const ROBOFLOW_MODEL = "your-model/version";
const ROBOFLOW_URL = "https://your-server.com"; // for self-hosted
```

### Adding New Filters

For Document Scanner, edit `image-utils.ts`:
1. Add to `FilterType` union
2. Add logic to `applyFilter()` function
3. Add translation keys

### Styling

All components use CSS variables. Override them in your global CSS or use CSS modules for component-specific styles.

## Troubleshooting

### Camera Not Working
- Check HTTPS requirement (camera requires secure context)
- Verify Capacitor permissions on mobile
- Ensure `@capacitor/camera` is installed

### Roboflow API Errors
- Verify API key is correct
- Check model name and version
- Monitor API quota limits

### OpenCV Loading Issues
- Clear browser cache
- Check network connectivity
- Ensure no CSP blocks external scripts

## Support

Each module includes its own README with more detailed information. Check the individual module directories for:
- File structure
- Advanced configuration
- Performance notes
