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
export interface DetectionResult {
  results: Detection[];
  debug: string;
}

export async function runObjectDetection(
  model: ort.InferenceSession,
  imgEl: HTMLImageElement | HTMLCanvasElement,
  confidenceThreshold: number = 0.3
): Promise<DetectionResult> {
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

    // Convert to Float32 RGB normalized [0, 1] in CHW format (channels first)
    // YOLOv8 expects [1, 3, 640, 640] = all R values, then all G, then all B
    const input = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
    const planeSize = INPUT_SIZE * INPUT_SIZE;
    
    for (let y = 0; y < INPUT_SIZE; y++) {
      for (let x = 0; x < INPUT_SIZE; x++) {
        const srcIdx = (y * INPUT_SIZE + x) * 4; // RGBA in pixel data
        const dstIdx = y * INPUT_SIZE + x; // Index within each plane
        
        input[dstIdx] = pixels[srcIdx] / 255.0;           // R plane
        input[dstIdx + planeSize] = pixels[srcIdx + 1] / 255.0;  // G plane
        input[dstIdx + planeSize * 2] = pixels[srcIdx + 2] / 255.0; // B plane
      }
    }

    // Run inference with ONNX Runtime Web
    const inputTensor = new ort.Tensor("float32", input, [1, 3, INPUT_SIZE, INPUT_SIZE]);
    
    // Use correct input name - YOLOv8 uses 'images'
    const feeds: Record<string, ort.Tensor> = { images: inputTensor };
    
    console.log("[YOLO] Running inference...");
    const outputMap = await model.run(feeds);
    
    // Get output tensor - YOLOv8 outputs [1, 84, 8400]
    const outputTensor = outputMap.output0 || outputMap[model.outputNames[0]] || Object.values(outputMap)[0];
    const outputData = outputTensor.data as Float32Array;
    
    console.log("[YOLO] Input shape:", [1, 3, INPUT_SIZE, INPUT_SIZE]);
    console.log("[YOLO] Output shape:", outputTensor.dims);
    console.log("[YOLO] Output length:", outputData.length);
    
    // Check output format - could be [1, 84, 8400] or [84, 8400]
    const dims = outputTensor.dims;
    const hasBatch = dims.length === 3;
    const numAnchors = hasBatch ? dims[2] : dims[1];
    const numClasses = 80;
    
    console.log("[YOLO] Detected format:", hasBatch ? "[batch, 84, 8400]" : "[84, 8400]", "anchors:", numAnchors);
    console.log("[YOLO] First 20 values:", Array.from(outputData.slice(0, 20)));
    
    // Find max confidence for debugging
    let maxConf = 0;
    let maxConfAnchor = 0;
    let maxConfClass = 0;
    for (let i = 0; i < Math.min(1000, numAnchors); i++) {
      for (let c = 0; c < numClasses; c++) {
        const score = outputData[(4 + c) * numAnchors + i];
        if (score > maxConf) {
          maxConf = score;
          maxConfAnchor = i;
          maxConfClass = c;
        }
      }
    }
    console.log("[YOLO] Max confidence found:", maxConf, "at anchor", maxConfAnchor, "class", COCO_CLASSES[maxConfClass]);

    const detections: Detection[] = [];
    
    // YOLOv8 output format: 84 channels × 8400 anchors
    // Channels 0-3: bbox (cx, cy, w, h), Channels 4-83: class scores
    // Index = channel * numAnchors + anchor
    
    for (let i = 0; i < numAnchors; i++) {
      // Get bbox (center_x, center_y, width, height)
      const cx = outputData[i];                    // channel 0
      const cy = outputData[numAnchors + i];       // channel 1
      const w = outputData[2 * numAnchors + i];    // channel 2
      const h = outputData[3 * numAnchors + i];    // channel 3
      
      // Find best class (channels 4-83)
      let bestClass = -1;
      let bestScore = 0;
      
      for (let c = 0; c < numClasses; c++) {
        const score = outputData[(4 + c) * numAnchors + i];
        if (score > bestScore) {
          bestScore = score;
          bestClass = c;
        }
      }
      
      if (bestScore > confidenceThreshold && bestClass >= 0) {
        // Convert to normalized bbox [x1, y1, x2, y2]
        const scale = Math.min(INPUT_SIZE / imgEl.width, INPUT_SIZE / imgEl.height);
        const padX = (INPUT_SIZE - imgEl.width * scale) / 2;
        const padY = (INPUT_SIZE - imgEl.height * scale) / 2;
        
        const x1 = (cx - w / 2 - padX) / scale;
        const y1 = (cy - h / 2 - padY) / scale;
        const x2 = (cx + w / 2 - padX) / scale;
        const y2 = (cy + h / 2 - padY) / scale;
        
        detections.push({
          class: COCO_CLASSES[bestClass],
          classId: bestClass,
          confidence: bestScore,
          bbox: [
            Math.max(0, x1 / imgEl.width), 
            Math.max(0, y1 / imgEl.height), 
            Math.min(1, (x2 - x1) / imgEl.width), 
            Math.min(1, (y2 - y1) / imgEl.height)
          ]
        });
      }
    }

    // Apply Non-Maximum Suppression (NMS) to remove overlapping boxes
    const filtered = applyNMS(detections, 0.45);
    console.log(`[YOLO] Found ${detections.length} raw detections, ${filtered.length} after NMS`);
    
    const debugInfo = `Shape: ${dims.join('x')}\nMaxConf: ${maxConf.toFixed(3)}\nRaw: ${detections.length} | NMS: ${filtered.length}`;
    
    return { results: filtered, debug: debugInfo };
  } catch (err) {
    console.warn("[YOLO] Inference error:", err);
    return { results: [], debug: `Error: ${err}` };
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
