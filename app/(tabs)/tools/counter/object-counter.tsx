"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Camera, Upload, RotateCcw, Flashlight, Check } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { detectObjects, type BoundingBox } from "@/lib/tools/roboflow-detect";

type DetectionMode = "pipes";
type Stage = "camera" | "cropping" | "result";

type CropRect = { x: number; y: number; w: number; h: number };

export default function ObjectCounter() {
  const t = useTranslations("counter");

  const [mode, setMode] = useState<DetectionMode | null>(null);
  const [stage, setStage] = useState<Stage>("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<BoundingBox[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const confidence = 40;

  // Crop state — box starts at 10%/10% → 90%/90% of image
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const dragInfo = useRef<{ handle: string; startX: number; startY: number; rect: CropRect } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera management
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      try {
        const track = stream.getVideoTracks()[0];
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        setTorchOn(true);
      } catch { setTorchOn(false); }
    } catch (err) {
      console.warn("[Camera] Failed:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (mode && stage === "camera") { startCamera(); return () => stopCamera(); }
  }, [mode, stage, startCamera, stopCamera]);

  // Reset crop box when new image is captured
  const captureImage = useCallback((src: string) => {
    setCapturedImage(src);
    setCropRect({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setStage("cropping");
    stopCamera();
  }, [stopCamera]);

  // Capture from camera
  const captureFromCamera = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    captureImage(canvas.toDataURL("image/jpeg", 0.9));
  }, [captureImage]);

  // Upload from gallery via Capacitor
  const handleUpload = useCallback(async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      if (image.dataUrl) captureImage(image.dataUrl);
    } catch (err) {
      console.log("[Upload] Cancelled or error:", err);
    }
  }, [captureImage]);

  // Retake
  const retake = useCallback(() => {
    setCapturedImage(null);
    setCroppedImage(null);
    setCropRect({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setPredictions([]);
    setErrorMsg(null);
    setStage("camera");
    startCamera();
  }, [startCamera]);

  // ── Crop handle drag handlers ──────────────────────────────────────────────
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const MIN_SIZE = 0.05;

  const onHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, handle: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = cropContainerRef.current!;
    const br = el.getBoundingClientRect();
    dragInfo.current = {
      handle,
      startX: (e.clientX - br.left) / br.width,
      startY: (e.clientY - br.top) / br.height,
      rect: { ...cropRect },
    };
  }, [cropRect]);

  const onContainerPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfo.current) return;
    const el = cropContainerRef.current!;
    const br = el.getBoundingClientRect();
    const cx = (e.clientX - br.left) / br.width;
    const cy = (e.clientY - br.top) / br.height;
    const dx = cx - dragInfo.current.startX;
    const dy = cy - dragInfo.current.startY;
    const r = { ...dragInfo.current.rect };
    const h = dragInfo.current.handle;

    if (h === "move") {
      r.x = clamp(r.x + dx, 0, 1 - r.w);
      r.y = clamp(r.y + dy, 0, 1 - r.h);
      dragInfo.current.startX = cx;
      dragInfo.current.startY = cy;
      dragInfo.current.rect = { ...r };
    } else {
      if (h.includes("e")) { r.w = clamp(r.w + dx, MIN_SIZE, 1 - r.x); dragInfo.current.startX = cx; }
      if (h.includes("s")) { r.h = clamp(r.h + dy, MIN_SIZE, 1 - r.y); dragInfo.current.startY = cy; }
      if (h.includes("w")) {
        const newX = clamp(r.x + dx, 0, r.x + r.w - MIN_SIZE);
        r.w = r.w + (r.x - newX); r.x = newX; dragInfo.current.startX = cx;
        dragInfo.current.rect.x = r.x; dragInfo.current.rect.w = r.w;
      }
      if (h.includes("n")) {
        const newY = clamp(r.y + dy, 0, r.y + r.h - MIN_SIZE);
        r.h = r.h + (r.y - newY); r.y = newY; dragInfo.current.startY = cy;
        dragInfo.current.rect.y = r.y; dragInfo.current.rect.h = r.h;
      }
    }
    setCropRect({ x: r.x, y: r.y, w: r.w, h: r.h });
  }, []);

  const onContainerPointerUp = useCallback(() => {
    dragInfo.current = null;
  }, []);

  // ── Crop and detect ────────────────────────────────────────────────────────
  const cropAndDetect = useCallback(async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setStage("result");

    let imageToSend = capturedImage;

    if (cropRect && cropRect.w > 0.01 && cropRect.h > 0.01) {
      const img = new Image();
      await new Promise<void>((res) => { img.onload = () => res(); img.src = capturedImage; });
      const cropCanvas = document.createElement("canvas");
      const cw = Math.round(cropRect.w * img.width);
      const ch = Math.round(cropRect.h * img.height);
      cropCanvas.width = cw;
      cropCanvas.height = ch;
      cropCanvas.getContext("2d")!.drawImage(
        img,
        Math.round(cropRect.x * img.width),
        Math.round(cropRect.y * img.height),
        cw, ch, 0, 0, cw, ch,
      );
      imageToSend = cropCanvas.toDataURL("image/jpeg", 0.92);
    }

    setCroppedImage(imageToSend);
    const result = await detectObjects(imageToSend, confidence);

    if (!result.ok) {
      setErrorMsg(result.error);
      setIsProcessing(false);
      return;
    }

    setPredictions(result.predictions);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) { setIsProcessing(false); return; }
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      result.predictions.forEach((p, i) => {
        const x = p.x - p.width / 2;
        const y = p.y - p.height / 2;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, p.width, p.height);
        const label = String(i + 1);
        ctx.font = "bold 16px Arial";
        const lw = ctx.measureText(label).width + 10;
        const lh = 22;
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(x, y - lh, lw, lh);
        ctx.fillStyle = "#000";
        ctx.textAlign = "start";
        ctx.textBaseline = "top";
        ctx.fillText(label, x + 5, y - lh + 3);
      });
      setIsProcessing(false);
    };
    img.onerror = () => setIsProcessing(false);
    img.src = imageToSend;
  }, [capturedImage, cropRect, confidence]);

  // Mode selection screen
  if (!mode) {
    return (
      <div className="flex flex-1 flex-col bg-[var(--bina-bg)]">
        <div className="border-b border-[var(--bina-border)] px-4 py-3">
          <h1 className="font-bina-display text-lg font-bold text-[var(--bina-text)]">{t("title")}</h1>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="text-sm text-[var(--bina-muted)]">{t("selectMode")}</p>

          {/* Pipes mode */}
          <button
            onClick={() => setMode("pipes")}
            className="flex items-center gap-4 rounded-xl border-2 border-[var(--bina-primary)] bg-[var(--bina-primary)]/5 p-4 text-start active:scale-95 transition-transform"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--bina-primary)]/10 text-[var(--bina-primary)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--bina-text)]">{t("modePipes")}</p>
              <p className="text-xs text-[var(--bina-muted)]">{t("modePipesDesc")}</p>
            </div>
          </button>

          {/* Coming soon placeholder */}
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-[var(--bina-border)] p-4 opacity-50">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--bina-border)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--bina-text)]">{t("modeMore")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--bina-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--bina-border)] px-4 py-3">
        <button
          onClick={() => { setMode(null); setCapturedImage(null); setCroppedImage(null); setCropRect(null); setPredictions([]); setErrorMsg(null); setStage("camera"); stopCamera(); }}
          className="text-sm font-medium text-[var(--bina-primary)]"
        >← {t("selectMode")}</button>
        {stage !== "camera" && (
          <button onClick={retake} className="flex items-center gap-1 text-sm font-medium text-[var(--bina-primary)]">
            <RotateCcw className="h-4 w-4" />{t("retake")}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {/* ── Camera ── */}
        {stage === "camera" && (
          <div className="relative flex flex-1 flex-col">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/70 to-transparent px-6 pb-20 pt-8">
              <button onClick={handleUpload} className="flex flex-col items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 text-white">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-xs text-white/80">{t("upload")}</span>
              </button>
              <button
                onClick={captureFromCamera}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--bina-primary)]"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
              <button
                onClick={() => {
                  if (streamRef.current) {
                    const track = streamRef.current.getVideoTracks()[0];
                    const next = !torchOn;
                    (track as any).applyConstraints({ advanced: [{ torch: next }] }).catch(() => {});
                    setTorchOn(next);
                  }
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full ${torchOn ? "bg-yellow-500" : "bg-white/30"} text-white`}
              >
                <Flashlight className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* ── Crop ── */}
        {stage === "cropping" && capturedImage && (
          <div className="flex flex-1 flex-col overflow-hidden bg-black">
            {/* Image + crop overlay */}
            <div
              ref={cropContainerRef}
              className="relative flex-1 select-none overflow-hidden"
              style={{ touchAction: "none" }}
              onPointerMove={onContainerPointerMove}
              onPointerUp={onContainerPointerUp}
              onPointerCancel={onContainerPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt=""
                className="h-full w-full object-contain pointer-events-none"
                draggable={false}
              />

              {/* Dark mask — 4 rectangles around the selection */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.55)",
                clipPath: `polygon(0% 0%, 0% 100%, ${cropRect.x*100}% 100%, ${cropRect.x*100}% ${cropRect.y*100}%, ${(cropRect.x+cropRect.w)*100}% ${cropRect.y*100}%, ${(cropRect.x+cropRect.w)*100}% ${(cropRect.y+cropRect.h)*100}%, ${cropRect.x*100}% ${(cropRect.y+cropRect.h)*100}%, ${cropRect.x*100}% 100%, 100% 100%, 100% 0%)`
              }} />

              {/* Selection box border */}
              <div className="absolute border-2 border-white pointer-events-none" style={{
                left: `${cropRect.x*100}%`, top: `${cropRect.y*100}%`,
                width: `${cropRect.w*100}%`, height: `${cropRect.h*100}%`,
              }} />

              {/* Move handle — drag entire box */}
              <div className="absolute" style={{
                left: `${cropRect.x*100}%`, top: `${cropRect.y*100}%`,
                width: `${cropRect.w*100}%`, height: `${cropRect.h*100}%`,
                cursor: "move",
              }} onPointerDown={(e) => onHandlePointerDown(e, "move")} />

              {/* 8 resize handles */}
              {(["nw","n","ne","e","se","s","sw","w"] as const).map((dir) => {
                const isV = dir === "n" || dir === "s";
                const isH = dir === "e" || dir === "w";
                const left = dir.includes("w") ? cropRect.x*100 - 2
                  : dir.includes("e") ? (cropRect.x+cropRect.w)*100 - 2
                  : cropRect.x*100 + cropRect.w*50 - 2;
                const top  = dir.includes("n") ? cropRect.y*100 - 2
                  : dir.includes("s") ? (cropRect.y+cropRect.h)*100 - 2
                  : cropRect.y*100 + cropRect.h*50 - 2;
                return (
                  <div key={dir}
                    className="absolute bg-white rounded-full shadow-md z-10"
                    style={{ left: `${left}%`, top: `${top}%`, width: 20, height: 20,
                      transform: "translate(-50%,-50%)",
                      cursor: isV ? "ns-resize" : isH ? "ew-resize" : "nwse-resize",
                    }}
                    onPointerDown={(e) => onHandlePointerDown(e, dir)}
                  />
                );
              })}
            </div>

            {/* Bottom bar with hint + Count button */}
            <div className="shrink-0 flex items-center justify-between bg-[var(--bina-bg)] border-t border-[var(--bina-border)] px-4 py-3">
              <p className="text-xs text-[var(--bina-muted)] flex-1 me-3">{t("cropHint")}</p>
              <button
                onClick={cropAndDetect}
                className="flex items-center gap-2 rounded-xl bg-[var(--bina-primary)] px-6 py-3 text-sm font-bold text-white active:opacity-80 shrink-0"
              >
                <Check className="h-4 w-4" />
                {t("count")}
              </button>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {stage === "result" && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="relative min-h-0 flex-1 bg-black">
              <canvas ref={canvasRef} className="h-full w-full object-contain" style={{ maxHeight: "55vh" }} />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <div className="shrink-0 border-t border-[var(--bina-border)] bg-[var(--bina-bg)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--bina-muted)]">{t("totalObjects")}</p>
                  <p className="text-3xl font-bold text-[var(--bina-primary)]">
                    {isProcessing ? "…" : predictions.length}
                  </p>
                </div>
                {isProcessing && (
                  <p className="text-sm text-[var(--bina-muted)]">{t("detecting")}</p>
                )}
              </div>
              {errorMsg && (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {errorMsg}
                </p>
              )}
              {predictions.length === 0 && !isProcessing && !errorMsg && (
                <p className="mt-1 text-xs text-[var(--bina-muted)]">{t("noPipesFound")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
