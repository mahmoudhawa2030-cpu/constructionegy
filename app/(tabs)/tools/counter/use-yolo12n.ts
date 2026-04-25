"use client";

import { useEffect, useState } from "react";
import * as ort from "onnxruntime-web";

export type YOLOStatus = "idle" | "loading" | "ready" | "error";

export interface Detection {
  class: string;
  classId: number;
  confidence: number;
  bbox: [number, number, number, number];
}

// COCO dataset 80 classes
const COCO_CLASSES = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
  "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
  "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
  "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
  "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
  "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
  "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
  "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
  "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
  "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
];

let globalStatus: YOLOStatus = "idle";
let globalModel: ort.InferenceSession | null = null;
const listeners: Set<(s: YOLOStatus) => void> = new Set();

function notify(s: YOLOStatus) {
  globalStatus = s;
  listeners.forEach((fn) => fn(s));
}

export async function loadYOLOModel() {
  console.log("[YOLO] Starting ONNX model load...");
  if (globalStatus !== "idle" && globalStatus !== "error") return;
  notify("loading");

  try {
    // Load ONNX model
    console.log("[YOLO] Loading ONNX model...");
    globalModel = await ort.InferenceSession.create("/models/yolo12n/yolov8n.onnx", {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all"
    });
    
    console.log("[YOLO] ONNX model loaded successfully!");
    notify("ready");
  } catch (err: any) {
    console.error("[YOLO] Failed to load:", err.message || err);
    notify("error");
  }
}

export function useYOLO12n(): { status: YOLOStatus; model: ort.InferenceSession | null } {
  const [status, setStatus] = useState<YOLOStatus>(globalStatus);

  useEffect(() => {
    listeners.add(setStatus);
    if (globalStatus === "idle") loadYOLOModel();
    else setStatus(globalStatus);
    return () => { listeners.delete(setStatus); };
  }, []);

  return { status, model: globalModel };
}

/**
 * Run YOLO object detection on an image.
 * Returns array of detections with class, confidence, and bounding box.
 */
export function runObjectDetection(
  model: any,
  imgEl: HTMLImageElement | HTMLCanvasElement,
  confidenceThreshold: number = 0.3
): Detection[] {
  try {
    const INPUT_SIZE = 640; // YOLO input size

    // Draw image into canvas for model input
    const canvas = document.createElement("canvas");
    canvas.width = INPUT_SIZE;
    canvas.height = INPUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    
    // Maintain aspect ratio with padding
    const imgAspect = imgEl.width / imgEl.height;
    const canvasAspect = 1;
    let drawWidth = INPUT_SIZE;
    let drawHeight = INPUT_SIZE;
    let offsetX = 0;
    let offsetY = 0;
    
    if (imgAspect > canvasAspect) {
      drawHeight = INPUT_SIZE / imgAspect;
      offsetY = (INPUT_SIZE - drawHeight) / 2;
    } else {
      drawWidth = INPUT_SIZE * imgAspect;
      offsetX = (INPUT_SIZE - drawWidth) / 2;
    }
    
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
    ctx.drawImage(imgEl, offsetX, offsetY, drawWidth, drawHeight);

    const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
    const pixels = imageData.data;

    // Convert to Float32 RGB normalized [0, 1]
    const input = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
    for (let i = 0, j = 0; i < pixels.length; i += 4, j += 3) {
      input[j] = pixels[i] / 255.0;
      input[j + 1] = pixels[i + 1] / 255.0;
      input[j + 2] = pixels[i + 2] / 255.0;
    }

    // Run inference
    const outputTensor = model.predict(
      { input: { data: input, shape: [1, INPUT_SIZE, INPUT_SIZE, 3] } }
    );

    // Parse YOLO output format [batch, num_boxes, 6] where 6 = [x, y, w, h, confidence, class]
    const outputData = outputTensor instanceof Float32Array
      ? outputTensor
      : Object.values(outputTensor)[0] as Float32Array;

    // Parse detections
    const detections: Detection[] = [];
    const numDetections = outputData.length / 6;

    for (let i = 0; i < numDetections; i++) {
      const offset = i * 6;
      const x = outputData[offset];
      const y = outputData[offset + 1];
      const w = outputData[offset + 2];
      const h = outputData[offset + 3];
      const confidence = outputData[offset + 4];
      const classId = Math.round(outputData[offset + 5]);

      if (confidence > confidenceThreshold && classId >= 0 && classId < COCO_CLASSES.length) {
        // Adjust bbox coordinates to account for letterboxing
        const scale = Math.min(INPUT_SIZE / imgEl.width, INPUT_SIZE / imgEl.height);
        const padX = (INPUT_SIZE - imgEl.width * scale) / 2;
        const padY = (INPUT_SIZE - imgEl.height * scale) / 2;
        
        const x1 = (x - w / 2 - padX) / scale / imgEl.width;
        const y1 = (y - h / 2 - padY) / scale / imgEl.height;
        const x2 = (x + w / 2 - padX) / scale / imgEl.width;
        const y2 = (y + h / 2 - padY) / scale / imgEl.height;

        detections.push({
          class: COCO_CLASSES[classId],
          classId,
          confidence,
          bbox: [Math.max(0, x1), Math.max(0, y1), Math.min(1, x2 - x1), Math.min(1, y2 - y1)]
        });
      }
    }

    // Apply Non-Maximum Suppression (NMS) to remove overlapping boxes
    return applyNMS(detections, 0.45);
  } catch (err) {
    console.warn("[YOLO] Inference error:", err);
    return [];
  }
}

/** Apply Non-Maximum Suppression to filter overlapping detections */
function applyNMS(detections: Detection[], iouThreshold: number): Detection[] {
  // Sort by confidence descending
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const selected: Detection[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;
    
    selected.push(sorted[i]);
    
    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed.has(j)) continue;
      
      const iou = calculateIoU(sorted[i].bbox, sorted[j].bbox);
      if (iou > iouThreshold) {
        suppressed.add(j);
      }
    }
  }

  return selected;
}

/** Calculate Intersection over Union for two bounding boxes */
function calculateIoU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
  const [x1, y1, w1, h1] = boxA;
  const [x2, y2, w2, h2] = boxB;
  
  const xLeft = Math.max(x1, x2);
  const yTop = Math.max(y1, y2);
  const xRight = Math.min(x1 + w1, x2 + w2);
  const yBottom = Math.min(y1 + h1, y2 + h2);
  
  if (xRight < xLeft || yBottom < yTop) return 0;
  
  const intersection = (xRight - xLeft) * (yBottom - yTop);
  const areaA = w1 * h1;
  const areaB = w2 * h2;
  const union = areaA + areaB - intersection;
  
  return intersection / union;
}

/** Count objects by class */
export function countByClass(detections: Detection[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const det of detections) {
    const current = counts.get(det.class) || 0;
    counts.set(det.class, current + 1);
  }
  return counts;
}
