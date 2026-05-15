"use client";

import { useEffect, useState } from "react";

export type OpenCVStatus = "idle" | "loading" | "ready" | "error";

declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let globalStatus: OpenCVStatus = "idle";
let globalCV: any = null;
const listeners: Set<(s: OpenCVStatus) => void> = new Set();

function notify(s: OpenCVStatus) {
  globalStatus = s;
  listeners.forEach((fn) => fn(s));
}

export function loadOpenCV() {
  if (globalStatus === "ready" || globalStatus === "loading") return;
  notify("loading");

  const script = document.createElement("script");
  script.src = "https://docs.opencv.org/4.8.0/opencv.js";
  script.async = true;
  script.onload = () => {
    const checkReady = setInterval(() => {
      if (window.cv && window.cv.HoughCircles) {
        clearInterval(checkReady);
        globalCV = window.cv;
        notify("ready");
      }
    }, 100);
    setTimeout(() => {
      clearInterval(checkReady);
      if (globalStatus !== "ready") notify("error");
    }, 15000);
  };
  script.onerror = () => notify("error");
  document.head.appendChild(script);
}

export function useOpenCV() {
  const [status, setStatus] = useState<OpenCVStatus>(globalStatus);

  useEffect(() => {
    const fn = (s: OpenCVStatus) => setStatus(s);
    listeners.add(fn);
    if (globalStatus === "idle") loadOpenCV();
    else setStatus(globalStatus);
    return () => { listeners.delete(fn); };
  }, []);

  return { status, cv: globalCV };
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface PipeDetectionResult {
  circles: Circle[];
  count: number;
  debug: string;
}

export function detectPipes(
  cv: any,
  imgEl: HTMLImageElement | HTMLCanvasElement,
  options: {
    minRadius: number;
    maxRadius: number;
    sensitivity: number; // 1-100, higher = more detections
  }
): PipeDetectionResult {
  try {
    const src = cv.imread(imgEl);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();

    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Blur to reduce noise
    const blurSize = new cv.Size(9, 9);
    cv.GaussianBlur(gray, blurred, blurSize, 2, 2);

    // Hough Circle parameters
    const dp = 1;
    const minDist = options.minRadius * 1.5; // min distance between circle centers
    const param1 = Math.round(100 - options.sensitivity * 0.7); // edge detection threshold
    const param2 = Math.round(40 - options.sensitivity * 0.3);  // accumulator threshold
    const minR = options.minRadius;
    const maxR = options.maxRadius;

    const circles = new cv.Mat();
    cv.HoughCircles(
      blurred,
      circles,
      cv.HOUGH_GRADIENT,
      dp,
      minDist,
      Math.max(param1, 10),
      Math.max(param2, 5),
      minR,
      maxR
    );

    const detected: Circle[] = [];
    for (let i = 0; i < circles.cols; i++) {
      const x = circles.data32F[i * 3];
      const y = circles.data32F[i * 3 + 1];
      const r = circles.data32F[i * 3 + 2];
      detected.push({ x, y, radius: r });
    }

    const debug = `Circles: ${detected.length}\nParam1: ${param1} Param2: ${param2}\nMinR: ${minR} MaxR: ${maxR}`;

    src.delete(); gray.delete(); blurred.delete(); circles.delete();

    return { circles: detected, count: detected.length, debug };
  } catch (err) {
    console.error("[OpenCV] Detection error:", err);
    return { circles: [], count: 0, debug: `Error: ${err}` };
  }
}
