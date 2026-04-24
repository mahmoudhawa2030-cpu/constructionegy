"use client";

import { useEffect, useState } from "react";

export type OpenCVStatus = "idle" | "loading" | "ready" | "error";

declare global {
  interface Window {
    cv: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    Module: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

let globalStatus: OpenCVStatus = "idle";
const listeners: Set<(s: OpenCVStatus) => void> = new Set();

function notify(s: OpenCVStatus) {
  globalStatus = s;
  listeners.forEach((fn) => fn(s));
}

function loadOpenCV() {
  if (globalStatus !== "idle") return;
  notify("loading");

  const script = document.createElement("script");
  script.src = "https://docs.opencv.org/4.8.0/opencv.js";
  script.async = true;
  script.onload = () => {
    // OpenCV.js calls Module.onRuntimeInitialized when WASM is ready
    if (window.cv && window.cv.getBuildInformation) {
      notify("ready");
    } else {
      const prev = window.Module?.onRuntimeInitialized;
      window.Module = window.Module ?? {};
      window.Module.onRuntimeInitialized = () => {
        prev?.();
        notify("ready");
      };
    }
  };
  script.onerror = () => notify("error");
  document.head.appendChild(script);
}

export function useOpenCV(): OpenCVStatus {
  const [status, setStatus] = useState<OpenCVStatus>(globalStatus);

  useEffect(() => {
    listeners.add(setStatus);
    if (globalStatus === "idle") loadOpenCV();
    else setStatus(globalStatus);
    return () => { listeners.delete(setStatus); };
  }, []);

  return status;
}
