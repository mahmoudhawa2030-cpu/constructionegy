"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useYOLO12n, runObjectDetection, Detection, countByClass, loadYOLOModel } from "./use-yolo12n";
import { Camera, Upload, RotateCcw, X, Check, ChevronDown, ChevronUp, Flashlight } from "lucide-react";

export default function ObjectCounter() {
  const t = useTranslations("counter");
  const { status, model } = useYOLO12n();
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClassList, setShowClassList] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.001);
  const [torchOn, setTorchOn] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera with flashlight
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Try to enable torch
      try {
        const track = stream.getVideoTracks()[0];
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        setTorchOn(true);
      } catch {
        setTorchOn(false);
      }
    } catch (err) {
      console.warn("[Camera] Failed to start:", err);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Capture image from camera
  const captureImage = useCallback(() => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  }, [stopCamera]);

  // Reset and retake
  const retake = useCallback(() => {
    setCapturedImage(null);
    setDetections([]);
    setSelectedClasses(new Set());
    startCamera();
  }, [startCamera]);

  // Run object detection
  const runDetection = useCallback(async () => {
    if (!model || !capturedImage) return;
    
    setIsProcessing(true);
    setDebugInfo("Running inference...");
    
    try {
      const img = new Image();
      img.src = capturedImage;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const { results, debug } = await runObjectDetection(model, img, confidenceThreshold);
      setDetections(results);
      setDebugInfo(debug);
      
      // Auto-select all detected classes
      const classes = new Set(results.map(d => d.class));
      setSelectedClasses(classes);
    } catch (err) {
      console.warn("[Detection] Failed:", err);
      setDebugInfo(`Error: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  }, [model, capturedImage, confidenceThreshold]);

  // Draw detections on canvas
  useEffect(() => {
    if (!capturedImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.src = capturedImage;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Draw detection boxes
      for (const det of detections) {
        if (selectedClasses.size > 0 && !selectedClasses.has(det.class)) continue;
        
        const [x, y, w, h] = det.bbox;
        const px = x * canvas.width;
        const py = y * canvas.height;
        const pw = w * canvas.width;
        const ph = h * canvas.height;
        
        // Draw box
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(px, py, pw, ph);
        
        // Draw label background
        const label = `${det.class} ${Math.round(det.confidence * 100)}%`;
        ctx.font = "bold 16px Arial";
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(px, py - 24, textWidth + 10, 24);
        
        // Draw label text
        ctx.fillStyle = "#000000";
        ctx.fillText(label, px + 5, py - 6);
      }
    };
  }, [capturedImage, detections, selectedClasses]);

  // Toggle class selection
  const toggleClass = useCallback((className: string) => {
    setSelectedClasses(prev => {
      const next = new Set(prev);
      if (next.has(className)) {
        next.delete(className);
      } else {
        next.add(className);
      }
      return next;
    });
  }, []);

  // Get count summary
  const classCounts = countByClass(detections);
  const totalCount = selectedClasses.size > 0 
    ? Array.from(classCounts).filter(([cls]) => selectedClasses.has(cls)).reduce((sum, [, count]) => sum + count, 0)
    : detections.length;

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--bina-primary)] border-t-transparent" />
        <p className="font-bina-display text-sm text-[var(--bina-muted)]">{t("loadingModel")}</p>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="text-4xl">⚠️</span>
        <p className="font-bina-display text-sm text-[var(--bina-muted)]">{t("modelError")}</p>
        <p className="text-xs text-[var(--bina-muted)]">{t("modelErrorDesc")}</p>
        <button
          onClick={() => loadYOLOModel()}
          className="mt-4 rounded-lg bg-[var(--bina-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bina-primary)]/90"
        >
          {t("retry") || "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--bina-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--bina-border)] px-4 py-3">
        <h1 className="font-bina-display text-lg font-bold text-[var(--bina-text)]">{t("title")}</h1>
        {capturedImage && (
          <button
            onClick={retake}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--bina-primary)] hover:bg-[var(--bina-primary)]/10"
          >
            <RotateCcw className="h-4 w-4" />
            {t("retake")}
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {!capturedImage ? (
          /* Camera view */
          <div className="relative flex flex-1 flex-col">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            
            {/* Capture button - with safe area padding for mobile */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/60 to-transparent px-6 pb-20 pt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                aria-label={t("upload")}
              >
                <Upload className="h-6 w-6" />
              </button>
              
              <button
                onClick={captureImage}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--bina-primary)] hover:scale-105 transition-transform"
                aria-label={t("capture")}
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
              
              <button
                onClick={() => {
                  if (streamRef.current) {
                    const track = streamRef.current.getVideoTracks()[0];
                    const newState = !torchOn;
                    (track as any).applyConstraints({ advanced: [{ torch: newState }] }).catch(() => {});
                    setTorchOn(newState);
                  }
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full ${torchOn ? 'bg-yellow-500' : 'bg-white/20'} text-white hover:bg-white/30`}
                aria-label={t("flashlight")}
              >
                <Flashlight className="h-6 w-6" />
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          /* Preview with detection */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Debug Panel - fixed at top */}
            <div className="z-10 rounded border border-yellow-500/30 bg-yellow-500/10 p-2 m-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-yellow-600">Debug:</p>
                {model && !isProcessing && (
                  <button
                    onClick={runDetection}
                    className="rounded bg-yellow-600 px-2 py-0.5 text-xs text-white"
                  >
                    Test
                  </button>
                )}
              </div>
              <pre className="mt-1 whitespace-pre-wrap text-xs text-yellow-800">{debugInfo || "Tap Test after taking photo"}</pre>
            </div>

            {/* Image canvas - constrained height so controls are visible */}
            <div className="relative flex-1 min-h-0 bg-black">
              <canvas
                ref={canvasRef}
                className="h-full w-full max-h-[60vh] object-contain"
              />
              
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                    <span className="text-sm text-white">{t("detecting")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls - always visible, scrollable if needed */}
            <div className="border-t border-[var(--bina-border)] bg-[var(--bina-bg)] p-4 shrink-0 max-h-[40vh] overflow-y-auto">
              {/* Count summary */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--bina-muted)]">{t("totalObjects")}</p>
                  <p className="text-2xl font-bold text-[var(--bina-text)]">{totalCount}</p>
                </div>
                
                {!isProcessing && detections.length === 0 && (
                  <button
                    onClick={runDetection}
                    className="flex items-center gap-2 rounded-lg bg-[var(--bina-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bina-primary)]/90"
                  >
                    <Check className="h-4 w-4" />
                    {t("count")}
                  </button>
                )}
              </div>

              {/* Confidence threshold */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-[var(--bina-muted)]">{t("confidence")}</label>
                  <span className="text-sm font-medium">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={confidenceThreshold * 100}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                  className="w-full"
                />
              </div>

              {/* Class filter */}
              {detections.length > 0 && (
                <div className="border-t border-[var(--bina-border)] pt-4">
                  <button
                    onClick={() => setShowClassList(!showClassList)}
                    className="flex w-full items-center justify-between py-2"
                  >
                    <span className="text-sm font-medium">{t("filterByClass")}</span>
                    {showClassList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showClassList && (
                    <div className="mt-2 space-y-2">
                      {Array.from(classCounts).map(([cls, count]) => (
                        <label key={cls} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedClasses.has(cls)}
                            onChange={() => toggleClass(cls)}
                            className="h-4 w-4 rounded border-[var(--bina-border)]"
                          />
                          <span className="flex-1 text-sm capitalize">{cls}</span>
                          <span className="text-sm text-[var(--bina-muted)]">{count}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
