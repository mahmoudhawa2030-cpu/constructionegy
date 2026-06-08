import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { randomSuffix, slugify } from "@/lib/seo/slugs";

type FetchBody = {
  query: string;
  source?: "unsplash" | "pexels";
  altText?: string;
};

// Unsplash Source API (no key required)
async function fetchFromUnsplash(query: string): Promise<string | null> {
  try {
    // Use Unsplash Source with random sig to get different images
    const sig = Math.random().toString(36).substring(7);
    const url = `https://source.unsplash.com/featured/1200x630/?${encodeURIComponent(query)}&sig=${sig}`;
    
    // Fetch to get the actual image URL (follows redirects)
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!response.ok) return null;
    
    // Get the final URL after redirects
    const finalUrl = response.url;
    return finalUrl;
  } catch {
    return null;
  }
}

// Pexels API (requires key, better quality)
async function fetchFromPexels(query: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.photos?.[0]?.src?.large) return null;
    
    return data.photos[0].src.large;
  } catch {
    return null;
  }
}

async function downloadImage(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: FetchBody;
  try {
    body = (await req.json()) as FetchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = (body.query ?? "").trim();
  const source = body.source ?? "unsplash";
  const altText = (body.altText ?? query).trim();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Fetch image URL from source
  let imageUrl: string | null = null;
  
  if (source === "pexels") {
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (!pexelsKey) {
      return NextResponse.json(
        { error: "PEXELS_API_KEY not configured" },
        { status: 500 }
      );
    }
    imageUrl = await fetchFromPexels(query, pexelsKey);
  } else {
    imageUrl = await fetchFromUnsplash(query);
  }

  if (!imageUrl) {
    return NextResponse.json(
      { error: `No images found for "${query}" from ${source}` },
      { status: 404 }
    );
  }

  // Download the image
  const imageBytes = await downloadImage(imageUrl);
  if (!imageBytes) {
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 502 }
    );
  }

  // Determine content type from URL
  const ext = imageUrl.split(".").pop()?.toLowerCase().split("?")[0] || "jpg";
  const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  // Upload to Supabase Storage
  const baseName = slugify(query) || "image";
  const path = `${baseName}-${randomSuffix()}.${ext === "png" ? "png" : ext === "webp" ? "webp" : "jpg"}`;

  const { error: uploadError } = await supabase.storage
    .from("seo-images")
    .upload(path, imageBytes, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("seo-images").getPublicUrl(path);

  return NextResponse.json({
    url: publicUrl,
    alt: altText || baseName.replace(/-/g, " "),
    source,
    query,
  });
}
