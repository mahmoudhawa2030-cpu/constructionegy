# DWG Viewer Module

A DWG file viewer that converts AutoCAD DWG files to PDF for viewing in the browser.

## Features

- Drag & drop DWG file upload
- File validation (max 50MB)
- DWG to PDF conversion using LibreCAD
- PDF preview in iframe
- Download converted PDF
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

### System Requirements
- **LibreCAD** installed on the server for DWG conversion
- OR **Docker** with the `construction-egy/dwg-converter` image
- **Node.js runtime** (not Edge runtime)

### Environment Variables
```env
# Cloudflare R2 for file storage (optional but recommended)
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=construction-egy-dwg
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## Installation

1. Copy the module files to your app:
   ```
   cp -r modules/dwg-viewer/components/your-app/components/dwg-viewer
   cp -r modules/dwg-viewer/app/api/your-app/api/dwg
   ```

2. Install LibreCAD on your server:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install librecad
   
   # Or use Docker
   docker pull construction-egy/dwg-converter
   ```

3. Add i18n keys to your messages files (see messages/ folder in this module)

4. Add to your app routing:
   ```tsx
   // app/tools/dwg-viewer/page.tsx
   import DWGViewerPage from "@/components/dwg-viewer/components/dwg-viewer/page";
   
   export default function DwgViewerPage() {
     return <DWGViewerPage />;
   }
   ```

5. Add CSS variables (if using custom theme):
   ```css
   :root {
     --bina-primary: #f97316;
     --bina-bg: #ffffff;
     --bina-text: #000000;
     --bina-border: #e5e7eb;
     --bina-muted: #6b7280;
   }
   ```

## API Route Setup

The module requires an API route at `/api/dwg/convert` for DWG conversion. The route is included in `app/api/dwg/convert/route.ts`.

Make sure to:
1. Set the runtime to `nodejs` in your Next.js config
2. Configure environment variables for file storage
3. Install LibreCAD or set up Docker

## File Storage Options

### Option 1: Cloudflare R2 (Recommended)
- Configure R2 credentials in environment variables
- Files are stored permanently with CDN access
- Supports large files and high traffic

### Option 2: Direct Response (Fallback)
- If R2 upload fails, PDF is returned directly
- No permanent storage
- Suitable for development or low traffic

## File Structure

```
dwg-viewer/
├── components/
│   └── dwg-viewer/
│       ├── dwg-viewer.tsx         # Main viewer component
│       └── page.tsx               # Route wrapper
├── app/
│   └── api/
│       └── dwg/
│           └── convert/
│               └── route.ts       # Conversion API
└── messages/
    ├── en.json                    # English translations
    └── ar.json                    # Arabic translations
```

## Configuration

### Changing File Size Limit
Edit `app/api/dwg/convert/route.ts`:
```typescript
if (file.size > 50 * 1024 * 1024) { // Change 50 to desired MB
```

### Custom Storage Provider
Replace the `uploadToR2` function in the API route with your preferred storage solution.

### Alternative Conversion Tools
The module uses LibreCAD by default. You can replace `convertWithLibreCAD` to use:
- AnyDWG SDK
- Teigha Converter
- Online conversion APIs

## Performance Notes

- Conversion takes 10-30 seconds per file
- Large files (>20MB) may timeout on some servers
- Consider queue system for production use
- PDFs are cached for 1 week in R2
