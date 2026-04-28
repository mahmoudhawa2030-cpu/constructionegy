import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// Cloudflare R2 credentials from environment
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "construction-egy-dwg";
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL; // e.g., https://pub-xxx.r2.dev

// S3-compatible endpoint for Cloudflare R2
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  // Import AWS SDK v3 for S3-compatible upload
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  
  const s3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Cache for 1 week since PDFs don't change
      CacheControl: "public, max-age=604800",
    })
  );

  // Return public URL
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}

async function convertWithLibreCAD(dwgPath: string, pdfPath: string): Promise<void> {
  try {
    // Try local LibreCAD if available
    await execAsync(`librecad "${dwgPath}" -o "${pdfPath}" -f pdf`);
  } catch {
    // Fallback: Try using LibreCAD in Docker if local not available
    const containerName = `dwg-converter-${Date.now()}`;
    try {
      await execAsync(
        `docker run --rm --name ${containerName} -v "${path.dirname(dwgPath)}:/input" construction-egy/dwg-converter /input/${path.basename(dwgPath)} /input/${path.basename(pdfPath)}`
      );
    } catch (dockerError) {
      console.error("Docker conversion failed:", dockerError);
      throw new Error("DWG conversion failed. LibreCAD not available.");
    }
  }
}

export async function POST(request: NextRequest) {
  let tempDir: string | undefined;

  try {
    // Check environment variables
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: "R2 credentials not configured" },
        { status: 500 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".dwg")) {
      return NextResponse.json(
        { error: "Only .dwg files are supported" },
        { status: 400 }
      );
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 50MB." },
        { status: 400 }
      );
    }

    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dwg-convert-"));
    const dwgPath = path.join(tempDir, file.name);
    const pdfPath = path.join(tempDir, file.name.replace(/\.dwg$/i, ".pdf"));

    // Save DWG file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dwgPath, fileBuffer);

    // Convert DWG to PDF
    try {
      await convertWithLibreCAD(dwgPath, pdfPath);
    } catch (convertError) {
      console.error("Conversion error:", convertError);
      return NextResponse.json(
        { error: "Failed to convert DWG to PDF" },
        { status: 500 }
      );
    }

    // Check PDF was created
    if (!(await fs.stat(pdfPath).catch(() => null))) {
      return NextResponse.json(
        { error: "Conversion failed - PDF not generated" },
        { status: 500 }
      );
    }

    // Read PDF
    const pdfBuffer = await fs.readFile(pdfPath);

    // Upload to Cloudflare R2
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const r2Key = `conversions/${timestamp}-${sanitizedName.replace(/\.dwg$/i, ".pdf")}`;

    let publicUrl: string;
    try {
      publicUrl = await uploadToR2(pdfBuffer, r2Key, "application/pdf");
    } catch (uploadError) {
      console.error("R2 upload error:", uploadError);
      // Fallback: Return PDF directly if upload fails
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${sanitizedName.replace(/\.dwg$/i, ".pdf")}"`,
        },
      });
    }

    // Cleanup temp files
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: sanitizedName.replace(/\.dwg$/i, ".pdf"),
      originalName: file.name,
      size: pdfBuffer.length,
    });

  } catch (error) {
    console.error("DWG conversion error:", error);
    
    // Cleanup on error
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Max file size: 50MB
export const config = {
  api: {
    bodyParser: false,
  },
};
