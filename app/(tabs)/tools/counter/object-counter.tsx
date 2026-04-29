"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Camera, Upload, RotateCcw, Flashlight } from "lucide-react";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";
import { detectObjects, type BoundingBox } from "@/lib/tools/roboflow-detect";

type DetectionMode = "pipes";

export default function ObjectCounter() {
  const t = useTranslations("counter");

  const [mode, setMode] = useState<DetectionMode | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<BoundingBox[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [confidence, setConfidence] = useState(40);

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
    if (mode) { startCamera(); return () => stopCamera(); }
  }, [mode, startCamera, stopCamera]);

  // Capture from camera
  const captureImage = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
  }, [stopCamera]);

  // Upload from gallery via Capacitor
  const handleUpload = useCallback(async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });
      if (image.dataUrl) { setCapturedImage(image.dataUrl); stopCamera(); }
    } catch (err) {
      console.log("[Upload] Cancelled or error:", err);
    }
  }, [stopCamera]);

  // Retake
  const retake = useCallback(() => {
    setCapturedImage(null);
    setPredictions([]);
    setErrorMsg(null);
    startCamera();
  }, [startCamera]);

  // Draw bounding boxes on canvas
  const drawPredictions = useCallback(
    (img: HTMLImageElement, preds: BoundingBox[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      preds.forEach((p, i) => {
        const x = p.x - p.width / 2;
        const y = p.y - p.height / 2;

        // Bounding box
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, p.width, p.height);

        // Number label
        const label = String(i + 1);
        ctx.font = "bold 16px Arial";
        const tm = ctx.measureText(label);
        const lw = tm.width + 10;
        const lh = 22;
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(x, y - lh, lw, lh);
        ctx.fillStyle = "#000";
        ctx.textAlign = "start";
        ctx.textBaseline = "top";
        ctx.fillText(label, x + 5, y - lh + 3);
      });
    },
    [],
  );

  // Run Roboflow detection
  const runDetection = useCallback(async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    setErrorMsg(null);

    const result = await detectObjects(capturedImage, confidence);

    if (!result.ok) {
      setErrorMsg(result.error);
      setIsProcessing(false);
      return;
    }

    setPredictions(result.predictions);

    // Draw results on canvas
    const img = new Image();
    img.onload = () => {
      drawPredictions(img, result.predictions);
      setIsProcessing(false);
    };
    img.onerror = () => setIsProcessing(false);
    img.src = capturedImage;
  }, [capturedImage, confidence, drawPredictions]);

  // Auto-detect as soon as an image is captured or uploaded
  useEffect(() => {
    if (!capturedImage) return;
    void runDetection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage]);

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
        <button onClick={() => { setMode(null); setCapturedImage(null); setPredictions([]); setErrorMsg(null); stopCamera(); }}
          className="text-sm font-medium text-[var(--bina-primary)]">← {t("selectMode")}</button>
        {capturedImage && (
          <button onClick={retake} className="flex items-center gap-1 text-sm font-medium text-[var(--bina-primary)]">
            <RotateCcw className="h-4 w-4" />{t("retake")}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {!capturedImage ? (
          /* Camera view */
          <div className="relative flex flex-1 flex-col">
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/70 to-transparent px-6 pb-20 pt-8">
              <button onClick={handleUpload} className="flex flex-col items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/30 text-white">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-xs text-white/80">{t("upload")}</span>
              </button>
              <button onClick={captureImage}
                className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--bina-primary)]">
                <Camera className="h-8 w-8 text-white" />
              </button>
              <button onClick={() => {
                if (streamRef.current) {
                  const track = streamRef.current.getVideoTracks()[0];
                  const next = !torchOn;
                  (track as any).applyConstraints({ advanced: [{ torch: next }] }).catch(() => {});
                  setTorchOn(next);
                }
              }} className={`flex h-12 w-12 items-center justify-center rounded-full ${torchOn ? "bg-yellow-500" : "bg-white/30"} text-white`}>
                <Flashlight className="h-6 w-6" />
              </button>
            </div>
          </div>
        ) : (
          /* Result view */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Canvas */}
            <div className="relative min-h-0 flex-1 bg-black">
              <canvas ref={canvasRef} className="h-full w-full object-contain" style={{ maxHeight: "55vh" }} />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                </div>
              )}
            </div>

            {/* Result panel */}
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
