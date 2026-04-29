"use server";

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
};

export type DetectionResult =
  | { ok: true; predictions: BoundingBox[]; imageWidth: number; imageHeight: number }
  | { ok: false; error: string };

const ROBOFLOW_MODEL = "pipes-counting-ivtyd/1";
const ROBOFLOW_URL = "https://detect.roboflow.com";

/**
 * Sends a base64-encoded image to the Roboflow hosted inference API
 * and returns bounding-box predictions.
 */
export async function detectObjects(
  base64Image: string,
  confidence: number = 40,
): Promise<DetectionResult> {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ROBOFLOW_API_KEY not configured" };
  }

  // Strip the data-url prefix if present
  const raw = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  try {
    const res = await fetch(
      `${ROBOFLOW_URL}/${ROBOFLOW_MODEL}?api_key=${apiKey}&confidence=${confidence}&overlap=30`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: raw,
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Roboflow ${res.status}: ${text}` };
    }

    const json = await res.json();

    const predictions: BoundingBox[] = (json.predictions ?? []).map(
      (p: any) => ({
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        confidence: p.confidence,
        class: p.class,
        class_id: p.class_id ?? 0,
      }),
    );

    return {
      ok: true,
      predictions,
      imageWidth: json.image?.width ?? 0,
      imageHeight: json.image?.height ?? 0,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
}
