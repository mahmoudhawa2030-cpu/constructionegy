"use client";

import { useEffect, useState } from "react";

export type TFLiteStatus = "idle" | "loading" | "ready" | "error";

declare global {
  interface Window {
    tflite: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

let globalStatus: TFLiteStatus = "idle";
let globalModel: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
const listeners: Set<(s: TFLiteStatus) => void> = new Set();

function notify(s: TFLiteStatus) {
  globalStatus = s;
  listeners.forEach((fn) => fn(s));
}

/** Load TFLite WASM runtime + FairScan model from /public */
async function loadTFLite() {
  if (globalStatus !== "idle") return;
  notify("loading");

  try {
    // Load TFLite WASM runtime from CDN
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load TFLite runtime"));
      document.head.appendChild(script);
    });

    // Wait for tflite to be available on window
    await new Promise<void>((resolve, reject) => {
      let tries = 0;
      const check = () => {
        if (window.tflite) { resolve(); return; }
        if (++tries > 50) { reject(new Error("tflite not initialized")); return; }
        setTimeout(check, 100);
      };
      check();
    });

    // Set WASM path for TFLite runtime
    window.tflite.setWasmPath(
      "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/wasm/"
    );

    // Load FairScan model from public folder
    globalModel = await window.tflite.loadTFLiteModel(
      "/models/document-scanner/fairscan-segmentation-model.tflite"
    );

    notify("ready");
  } catch (err) {
    console.warn("[TFLite] Failed to load:", err);
    notify("error");
  }
}

export function useTFLite(): { status: TFLiteStatus; model: any } {
  const [status, setStatus] = useState<TFLiteStatus>(globalStatus);

  useEffect(() => {
    listeners.add(setStatus);
    if (globalStatus === "idle") loadTFLite();
    else setStatus(globalStatus);
    return () => { listeners.delete(setStatus); };
  }, []);

  return { status, model: globalModel };
}

/**
 * Run FairScan segmentation model on an image element.
 * Returns a Float32Array mask (256×256) where values near 1.0 = document area.
 */
export function runSegmentation(
  model: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  imgEl: HTMLImageElement | HTMLCanvasElement
): Float32Array | null {
  try {
    const INPUT_SIZE = 256;

    // Draw image into a 256×256 canvas for model input
    const canvas = document.createElement("canvas");
    canvas.width = INPUT_SIZE;
    canvas.height = INPUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(imgEl, 0, 0, INPUT_SIZE, INPUT_SIZE);

    const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
    const pixels = imageData.data; // Uint8ClampedArray RGBA

    // Convert to Float32 RGB normalized [0, 1]
    const input = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
    for (let i = 0, j = 0; i < pixels.length; i += 4, j += 3) {
      input[j]     = pixels[i]     / 255.0; // R
      input[j + 1] = pixels[i + 1] / 255.0; // G
      input[j + 2] = pixels[i + 2] / 255.0; // B
    }

    // Run inference
    const outputTensor = model.predict(
      { input_1: { data: input, shape: [1, INPUT_SIZE, INPUT_SIZE, 3] } }
    );

    // Get mask data — output shape is [1, 256, 256, 1]
    const maskData = outputTensor instanceof Float32Array
      ? outputTensor
      : Object.values(outputTensor)[0] as Float32Array;

    return maskData;
  } catch (err) {
    console.warn("[TFLite] Inference error:", err);
    return null;
  }
}
