"use client";

import { useEffect, useState } from "react";

export type MIRNetStatus = "idle" | "loading" | "ready" | "error";

declare global {
  interface Window {
    tflite: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

let globalStatus: MIRNetStatus = "idle";
let globalModel: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
const listeners: Set<(s: MIRNetStatus) => void> = new Set();

function notify(s: MIRNetStatus) {
  globalStatus = s;
  listeners.forEach((fn) => fn(s));
}

/** Load MIRNet enhancement model — requires TFLite runtime already on window */
async function loadMIRNet() {
  if (globalStatus !== "idle") return;
  notify("loading");

  try {
    // Wait for tflite runtime (loaded by use-tflite.ts)
    await new Promise<void>((resolve, reject) => {
      let tries = 0;
      const check = () => {
        if (window.tflite) { resolve(); return; }
        if (++tries > 100) { reject(new Error("tflite runtime not available")); return; }
        setTimeout(check, 200);
      };
      check();
    });

    globalModel = await window.tflite.loadTFLiteModel(
      "/models/document-scanner/mirnet.tflite"
    );

    notify("ready");
  } catch (err) {
    console.warn("[MIRNet] Failed to load:", err);
    notify("error");
  }
}

export function useMIRNet(): { status: MIRNetStatus; model: any } {
  const [status, setStatus] = useState<MIRNetStatus>(globalStatus);

  useEffect(() => {
    listeners.add(setStatus);
    if (globalStatus === "idle") loadMIRNet();
    else setStatus(globalStatus);
    return () => { listeners.delete(setStatus); };
  }, []);

  return { status, model: globalModel };
}

/**
 * Run MIRNet enhancement on a canvas.
 * Resizes input to 400×400 (model input), runs inference,
 * then scales output back to original canvas size.
 * Returns a new enhanced HTMLCanvasElement.
 */
export async function runMIRNet(
  model: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  srcCanvas: HTMLCanvasElement
): Promise<HTMLCanvasElement | null> {
  try {
    const INPUT_SIZE = 400;

    // ── Resize input to model size ────────────────────────────────────────
    const inCanvas = document.createElement("canvas");
    inCanvas.width = INPUT_SIZE;
    inCanvas.height = INPUT_SIZE;
    const inCtx = inCanvas.getContext("2d")!;
    inCtx.drawImage(srcCanvas, 0, 0, INPUT_SIZE, INPUT_SIZE);
    const imgData = inCtx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
    const pixels = imgData.data;

    // Convert RGBA → Float32 RGB [0, 1]
    const input = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
    for (let i = 0, j = 0; i < pixels.length; i += 4, j += 3) {
      input[j]     = pixels[i]     / 255.0;
      input[j + 1] = pixels[i + 1] / 255.0;
      input[j + 2] = pixels[i + 2] / 255.0;
    }

    // ── Run inference ─────────────────────────────────────────────────────
    const outputTensor = model.predict(
      { input_1: { data: input, shape: [1, INPUT_SIZE, INPUT_SIZE, 3] } }
    );

    const outData: Float32Array = outputTensor instanceof Float32Array
      ? outputTensor
      : (Object.values(outputTensor)[0] as Float32Array);

    // ── Write output to 400×400 canvas ────────────────────────────────────
    const outSmall = document.createElement("canvas");
    outSmall.width = INPUT_SIZE;
    outSmall.height = INPUT_SIZE;
    const outCtx = outSmall.getContext("2d")!;
    const outImgData = outCtx.createImageData(INPUT_SIZE, INPUT_SIZE);
    const outPixels = outImgData.data;

    for (let i = 0, j = 0; i < outPixels.length; i += 4, j += 3) {
      outPixels[i]     = Math.min(255, Math.max(0, Math.round(outData[j]     * 255)));
      outPixels[i + 1] = Math.min(255, Math.max(0, Math.round(outData[j + 1] * 255)));
      outPixels[i + 2] = Math.min(255, Math.max(0, Math.round(outData[j + 2] * 255)));
      outPixels[i + 3] = 255;
    }
    outCtx.putImageData(outImgData, 0, 0);

    // ── Scale back to original size ───────────────────────────────────────
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = srcCanvas.width;
    finalCanvas.height = srcCanvas.height;
    finalCanvas.getContext("2d")!.drawImage(outSmall, 0, 0, srcCanvas.width, srcCanvas.height);

    return finalCanvas;
  } catch (err) {
    console.warn("[MIRNet] Inference error:", err);
    return null;
  }
}
