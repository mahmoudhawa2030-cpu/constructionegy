"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useOpenCV } from "./use-opencv";
import { useTFLite, runSegmentation } from "./use-tflite";
import { useMIRNet, runMIRNet } from "./use-mirnet";
import {
  applyFilter,
  detectCornersFromMask,
  detectCornersWithOpenCV,
  perspectiveWarp,
  sortCorners,
  type FilterType,
  type Point,
} from "./image-utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = "capture" | "crop" | "filter" | "pages";

interface ScannedPage {
  id: string;
  warpedCanvas: HTMLCanvasElement;
  filteredCanvas: HTMLCanvasElement;
  filter: FilterType;
}

interface SavedScan {
  id: string;
  thumb: string;    // small JPEG data URL for thumbnail
  dataUrl: string;  // full JPEG data URL
  label: string;    // filename-style label
  createdAt: number;
}

const LS_KEY = "construction-egy:scanner:saved-scans";

const FILTERS: FilterType[] = ["original", "enhanced", "magicColor", "magicColorPro", "grayscale", "bw", "light", "sketch"];

const FILTER_LABEL_KEYS: Record<FilterType, string> = {
  original: "filterOriginal",
  enhanced: "filterEnhanced",
  magicColor: "filterMagicColor",
  magicColorPro: "filterMagicColorPro",
  grayscale: "filterGrayscale",
  bw: "filterBW",
  light: "filterLight",
  sketch: "filterSketch",
};

// ─── Corner drag handle size ──────────────────────────────────────────────────
const HANDLE_R = 22; // px, touch-friendly

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentScanner() {
  const t = useTranslations("scanner");
  const router = useRouter();
  const cvStatus = useOpenCV();
  const { status: tfliteStatus, model: tfliteModel } = useTFLite();
  const { status: mirnetStatus, model: mirnetModel } = useMIRNet();

  // Stage
  const [stage, setStage] = useState<Stage>("capture");

  // Raw captured image
  const [rawImage, setRawImage] = useState<HTMLImageElement | null>(null);
  const [rawDataUrl, setRawDataUrl] = useState<string>("");

  // Crop corners (in image coordinate space)
  const [corners, setCorners] = useState<[Point, Point, Point, Point] | null>(null);
  const [autoDetectMsg, setAutoDetectMsg] = useState<string>("");

  // Filter stage
  const [warpedCanvas, setWarpedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("magicColor");
  const [filteredCanvas, setFilteredCanvas] = useState<HTMLCanvasElement | null>(null);
  const [mirnetProcessing, setMirnetProcessing] = useState(false);

  // Pages
  const [pages, setPages] = useState<ScannedPage[]>([]);

  // Export
  const [exporting, setExporting] = useState(false);

  // Saved scans (persisted in localStorage)
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);

  // Full-screen viewer
  const [viewingScan, setViewingScan] = useState<SavedScan | null>(null);

  // Intercept device back button while viewer is open
  useEffect(() => {
    if (!viewingScan) return;
    // Push a dummy history entry so back button hits it first
    window.history.pushState({ scanViewer: true }, "");
    const onPop = () => setViewingScan(null);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // If viewer was closed programmatically (not via back), clean up the extra entry
      if (window.history.state?.scanViewer) window.history.back();
    };
  }, [viewingScan]);

  // Load saved scans from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSavedScans(JSON.parse(raw) as SavedScan[]);
    } catch { /* ignore */ }
  }, []);

  // Canvas/overlay refs
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropOverlayRef = useRef<HTMLCanvasElement>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const draggingIdx = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Load image from file input ──────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setRawImage(img);
      setRawDataUrl(url);
      setStage("crop");
    };
    img.src = url;
    // reset so same file can be re-selected
    e.target.value = "";
  }, []);

  // ── Auto-detect corners when entering crop stage ────────────────────────────
  useEffect(() => {
    if (stage !== "crop" || !rawImage) return;

    const w = rawImage.naturalWidth;
    const h = rawImage.naturalHeight;
    const inset = 0.05;
    const defaultCorners: [Point, Point, Point, Point] = [
      { x: w * inset,       y: h * inset },
      { x: w * (1 - inset), y: h * inset },
      { x: w * (1 - inset), y: h * (1 - inset) },
      { x: w * inset,       y: h * (1 - inset) },
    ];

    // Need at least OpenCV ready to do anything
    if (cvStatus !== "ready" || !window.cv) {
      setCorners(defaultCorners);
      return;
    }

    setAutoDetectMsg(t("autoDetecting"));

    setTimeout(() => {
      try {
        let detected: Point[] | null = null;

        // ── Path 1: TFLite AI model (best quality) ──────────────────────────
        if (tfliteStatus === "ready" && tfliteModel) {
          const mask = runSegmentation(tfliteModel, rawImage);
          if (mask) {
            detected = detectCornersFromMask(mask, w, h, window.cv);
          }
        }

        // ── Path 2: OpenCV Canny fallback ───────────────────────────────────
        if (!detected || detected.length !== 4) {
          detected = detectCornersWithOpenCV(rawImage, window.cv);
        }

        if (detected && detected.length === 4) {
          setCorners(sortCorners(detected));
          setAutoDetectMsg("");
        } else {
          setCorners(defaultCorners);
          setAutoDetectMsg(t("autoDetectFailed"));
        }
      } catch {
        setCorners(defaultCorners);
        setAutoDetectMsg(t("autoDetectFailed"));
      }
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, rawImage, cvStatus, tfliteStatus, tfliteModel]);

  // ── Draw crop overlay ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = cropCanvasRef.current;
    const overlay = cropOverlayRef.current;
    if (!canvas || !overlay || !rawImage || !corners) return;

    const container = containerRef.current;
    if (!container) return;

    const maxW = container.clientWidth;
    const maxH = container.clientHeight - 80; // leave room for bottom bar
    const scale = Math.min(maxW / rawImage.naturalWidth, maxH / rawImage.naturalHeight, 1);
    const dw = rawImage.naturalWidth * scale;
    const dh = rawImage.naturalHeight * scale;

    canvas.width = dw;
    canvas.height = dh;
    overlay.width = dw;
    overlay.height = dh;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(rawImage, 0, 0, dw, dh);

    // Draw crop overlay
    const octx = overlay.getContext("2d")!;
    octx.clearRect(0, 0, dw, dh);

    // Semi-transparent outside mask
    octx.fillStyle = "rgba(0,0,0,0.45)";
    octx.fillRect(0, 0, dw, dh);

    // Cut out the selected polygon
    octx.globalCompositeOperation = "destination-out";
    octx.beginPath();
    corners.forEach((c, i) => {
      const sx = c.x * scale;
      const sy = c.y * scale;
      i === 0 ? octx.moveTo(sx, sy) : octx.lineTo(sx, sy);
    });
    octx.closePath();
    octx.fill();
    octx.globalCompositeOperation = "source-over";

    // Draw polygon border
    octx.strokeStyle = "#f59e0b";
    octx.lineWidth = 2;
    octx.beginPath();
    corners.forEach((c, i) => {
      const sx = c.x * scale;
      const sy = c.y * scale;
      i === 0 ? octx.moveTo(sx, sy) : octx.lineTo(sx, sy);
    });
    octx.closePath();
    octx.stroke();

    // Draw corner handles
    corners.forEach((c) => {
      const sx = c.x * scale;
      const sy = c.y * scale;
      octx.beginPath();
      octx.arc(sx, sy, HANDLE_R / 2, 0, Math.PI * 2);
      octx.fillStyle = "#f59e0b";
      octx.fill();
      octx.strokeStyle = "#fff";
      octx.lineWidth = 2;
      octx.stroke();
    });
  }, [rawImage, corners]);

  // ── Touch/mouse drag on overlay ─────────────────────────────────────────────
  const getScaleAndCornerIdx = useCallback(
    (clientX: number, clientY: number): number => {
      const overlay = cropOverlayRef.current;
      const img = rawImage;
      if (!overlay || !img || !corners) return -1;
      const rect = overlay.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const scale = overlay.width / img.naturalWidth;

      let closest = -1;
      let minDist = HANDLE_R * 1.5;
      corners.forEach((c, i) => {
        const dist = Math.hypot(c.x * scale - px, c.y * scale - py);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      return closest;
    },
    [corners, rawImage]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const idx = getScaleAndCornerIdx(e.clientX, e.clientY);
      if (idx === -1) return;
      draggingIdx.current = idx;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getScaleAndCornerIdx]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingIdx.current === null) return;
      const overlay = cropOverlayRef.current;
      const img = rawImage;
      if (!overlay || !img || !corners) return;
      const rect = overlay.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const scale = overlay.width / img.naturalWidth;
      const imgX = Math.max(0, Math.min(img.naturalWidth,  px / scale));
      const imgY = Math.max(0, Math.min(img.naturalHeight, py / scale));
      const newCorners = [...corners] as [Point, Point, Point, Point];
      newCorners[draggingIdx.current] = { x: imgX, y: imgY };
      setCorners(newCorners);
    },
    [corners, rawImage]
  );

  const onPointerUp = useCallback(() => {
    draggingIdx.current = null;
  }, []);

  // ── Apply warp when moving to filter stage ──────────────────────────────────
  const handleApplyCrop = useCallback(() => {
    if (!rawImage || !corners || !window.cv) return;
    const sorted = sortCorners(corners);
    const warped = perspectiveWarp(rawImage, sorted, window.cv);
    setWarpedCanvas(warped);
    setActiveFilter("magicColor");
    const filtered = applyFilter(warped, "magicColor");
    setFilteredCanvas(filtered);
    setStage("filter");
  }, [rawImage, corners]);

  // ── Apply filter (with MIRNet support for magicColorPro) ────────────────────
  const applyFilterWithMIRNet = useCallback(async (f: FilterType, src: HTMLCanvasElement) => {
    if (f === "magicColorPro") {
      if (mirnetStatus !== "ready" || !mirnetModel) {
        // Fallback to magicColor if model not ready
        return applyFilter(src, "magicColor");
      }
      setMirnetProcessing(true);
      try {
        const enhanced = await runMIRNet(mirnetModel, src);
        if (!enhanced) return applyFilter(src, "magicColor");
        // Apply canvas post-processing on top of MIRNet output
        return applyFilter(enhanced, "magicColorPro");
      } finally {
        setMirnetProcessing(false);
      }
    }
    return applyFilter(src, f);
  }, [mirnetStatus, mirnetModel]);

  // ── Filter selection ────────────────────────────────────────────────────────
  const handleFilterSelect = useCallback(
    async (f: FilterType) => {
      if (!warpedCanvas) return;
      setActiveFilter(f);
      const result = await applyFilterWithMIRNet(f, warpedCanvas);
      setFilteredCanvas(result);
    },
    [warpedCanvas, applyFilterWithMIRNet]
  );

  // ── Draw filtered canvas ────────────────────────────────────────────────────
  useEffect(() => {
    const el = filterCanvasRef.current;
    if (!el || !filteredCanvas) return;
    el.width = filteredCanvas.width;
    el.height = filteredCanvas.height;
    el.getContext("2d")!.drawImage(filteredCanvas, 0, 0);
  }, [filteredCanvas]);

  // ── Add page ────────────────────────────────────────────────────────────────
  const handleAddPage = useCallback(() => {
    if (!warpedCanvas || !filteredCanvas) return;
    const page: ScannedPage = {
      id: `page-${Date.now()}`,
      warpedCanvas,
      filteredCanvas,
      filter: activeFilter,
    };
    setPages((prev) => [...prev, page]);
    // Go back to capture for next page
    setRawImage(null);
    setRawDataUrl("");
    setCorners(null);
    setWarpedCanvas(null);
    setFilteredCanvas(null);
    setStage("pages");
  }, [warpedCanvas, filteredCanvas, activeFilter]);

  const handleDeletePage = useCallback((id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Save scan to localStorage ────────────────────────────────────────────────
  const persistScan = useCallback((canvas: HTMLCanvasElement) => {
    try {
      const id = `scan-${Date.now()}`;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

      // Build 120px thumbnail
      const tc = document.createElement("canvas");
      const THUMB = 120;
      const ratio = canvas.width / canvas.height;
      tc.width = ratio >= 1 ? THUMB : Math.round(THUMB * ratio);
      tc.height = ratio >= 1 ? Math.round(THUMB / ratio) : THUMB;
      tc.getContext("2d")!.drawImage(canvas, 0, 0, tc.width, tc.height);
      const thumb = tc.toDataURL("image/jpeg", 0.7);

      const scan: SavedScan = {
        id,
        dataUrl,
        thumb,
        label: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        createdAt: Date.now(),
      };

      setSavedScans((prev) => {
        const next = [scan, ...prev];
        try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* storage full */ }
        return next;
      });
    } catch { /* ignore */ }
  }, []);

  const handleDeleteSavedScan = useCallback((id: string) => {
    setSavedScans((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleDownloadSavedScan = useCallback((scan: SavedScan) => {
    const a = document.createElement("a");
    a.href = scan.dataUrl;
    a.download = `${scan.id}.jpg`;
    a.click();
  }, []);

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportJpg = useCallback(async () => {
    if (pages.length === 0 && !filteredCanvas) return;
    setExporting(true);
    try {
      const canvas = pages.length > 0 ? pages[pages.length - 1].filteredCanvas : filteredCanvas!;
      const url = canvas.toDataURL("image/jpeg", 0.92);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scan-${Date.now()}.jpg`;
      a.click();
      persistScan(canvas);
    } finally {
      setExporting(false);
    }
  }, [pages, filteredCanvas, persistScan]);

  const exportPdf = useCallback(async () => {
    const allPages = pages.length > 0
      ? pages
      : filteredCanvas
      ? [{ id: "tmp", warpedCanvas: warpedCanvas!, filteredCanvas: filteredCanvas!, filter: activeFilter }]
      : [];
    if (allPages.length === 0) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const first = allPages[0].filteredCanvas;
      const orientation = first.width > first.height ? "l" : "p";
      const pdf = new jsPDF({ orientation, unit: "px", format: [first.width, first.height], compress: true });

      allPages.forEach((pg, idx) => {
        if (idx > 0) pdf.addPage([pg.filteredCanvas.width, pg.filteredCanvas.height], pg.filteredCanvas.width > pg.filteredCanvas.height ? "l" : "p");
        const imgData = pg.filteredCanvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(imgData, "JPEG", 0, 0, pg.filteredCanvas.width, pg.filteredCanvas.height);
      });

      pdf.save(`scan-${Date.now()}.pdf`);
      // Persist each page to saved scans
      allPages.forEach((pg) => persistScan(pg.filteredCanvas));
    } finally {
      setExporting(false);
    }
  }, [pages, filteredCanvas, warpedCanvas, activeFilter, persistScan]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col bg-[var(--bina-steel)]">
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-2"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <button
          type="button"
          aria-label={t("backAria")}
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[var(--bina-text)] active:opacity-70"
        >
          ←
        </button>
        <h1 className="font-bina-display flex-1 text-[15px] font-bold text-[var(--bina-text)]">
          {t("title")}
        </h1>
        {pages.length > 0 && (
          <span className="font-bina-display rounded-full bg-[var(--bina-or)] px-2 py-0.5 text-[11px] font-bold text-white">
            {t("pageCount", { count: pages.length })}
          </span>
        )}
      </div>

      {/* Loading status — show while either engine is loading */}
      {(cvStatus === "loading" || tfliteStatus === "loading") && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 dark:bg-amber-900/20">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="font-bina-display text-[12px] text-amber-700 dark:text-amber-400">
            {t("loadingOpenCV")}
            {tfliteStatus === "ready" ? " · AI ✓" : ""}
          </span>
        </div>
      )}

      {/* ── STAGE: capture ── */}
      {stage === "capture" && (
        <div
          className="flex flex-1 flex-col overflow-y-auto"
          style={{ paddingBottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
        >
          {/* Done button — only shown when pages exist */}
          {pages.length > 0 && (
            <div className="flex justify-center px-6 pt-4">
              <button
                type="button"
                onClick={() => setStage("pages")}
                className="font-bina-display rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-5 py-2 text-[13px] font-semibold text-[var(--bina-text)] active:opacity-80"
              >
                {t("done")} ({pages.length})
              </button>
            </div>
          )}

          {/* Saved scans gallery */}
          <div className="border-t border-[var(--bina-border)] px-4 pt-3">
            <p className="font-bina-display mb-2 text-[12px] font-bold uppercase tracking-wide text-[var(--bina-muted)]">
              {t("savedScans")}
            </p>
            {savedScans.length === 0 ? (
              <p className="font-bina-display py-6 text-center text-[12px] text-[var(--bina-muted)]">
                {t("noScans")}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 pb-2 sm:grid-cols-4">
                {savedScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="group relative overflow-hidden rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel2)] shadow"
                  >
                    {/* Tap thumbnail to open viewer */}
                    <button
                      type="button"
                      className="block w-full"
                      onClick={() => setViewingScan(scan)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={scan.thumb}
                        alt={scan.label}
                        className="block w-full object-cover"
                        style={{ aspectRatio: "3/4" }}
                      />
                    </button>
                    {/* Delete button only in corner */}
                    <button
                      type="button"
                      aria-label={t("deleteScan")}
                      onClick={() => handleDeleteSavedScan(scan.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[11px] text-red-300 active:opacity-70"
                    >
                      🗑
                    </button>
                    {/* Date label */}
                    <div className="bg-black/50 px-1.5 py-0.5">
                      <p className="font-bina-display truncate text-[8px] text-white">{scan.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── STAGE: crop ── */}
      {stage === "crop" && rawImage && corners && (
        <div ref={containerRef} className="relative flex flex-1 flex-col items-center overflow-hidden">
          <div className="relative flex-1 overflow-hidden">
            <canvas ref={cropCanvasRef} className="block max-h-full max-w-full" />
            <canvas
              ref={cropOverlayRef}
              className="absolute inset-0 touch-none"
              style={{ cursor: "crosshair" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </div>

          {autoDetectMsg ? (
            <p className="font-bina-display px-4 py-1 text-center text-[11px] text-amber-600 dark:text-amber-400">
              {autoDetectMsg}
            </p>
          ) : (
            <p className="font-bina-display px-4 py-1 text-center text-[11px] text-[var(--bina-muted)]">
              {t("adjustCorners")}
            </p>
          )}

          <div className="flex w-full gap-3 border-t border-[var(--bina-border)] bg-[var(--bina-steel2)] px-4 pt-3" style={{ paddingBottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}>
            <button
              type="button"
              onClick={() => { setStage("capture"); setRawImage(null); }}
              className="font-bina-display flex-1 rounded-xl border border-[var(--bina-border)] py-2.5 text-[13px] font-semibold text-[var(--bina-text)] active:opacity-70"
            >
              {t("retake")}
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={cvStatus === "loading"}
              className="font-bina-display flex-1 rounded-xl bg-[var(--bina-or)] py-2.5 text-[13px] font-bold text-white disabled:opacity-50 active:opacity-80"
            >
              {t("apply")}
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: filter ── */}
      {stage === "filter" && filteredCanvas && (
        <div className="flex flex-1 flex-col">
          {/* Preview */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black/80 px-2 py-2">
            <canvas
              ref={filterCanvasRef}
              className="max-h-full max-w-full rounded-lg shadow-2xl"
            />
            {mirnetProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-lg">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <p className="font-bina-display text-[12px] font-semibold text-white">{t("magicProProcessing")}</p>
              </div>
            )}
          </div>

          {/* Filter strip */}
          <div className="border-t border-[var(--bina-border)] bg-[var(--bina-steel2)]" style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}>
            <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-label={t(FILTER_LABEL_KEYS[f] as any)}
                  onClick={() => handleFilterSelect(f)}
                  className={`font-bina-display flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors ${
                    activeFilter === f
                      ? "bg-[var(--bina-or)] text-white"
                      : "bg-[var(--bina-steel3)] text-[var(--bina-text)]"
                  }`}
                >
                  <FilterThumb canvas={warpedCanvas} filter={f} />
                  {t(FILTER_LABEL_KEYS[f] as any)}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-3 pb-3">
              <button
                type="button"
                onClick={handleAddPage}
                className="font-bina-display flex-1 rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel3)] py-2.5 text-[12px] font-semibold text-[var(--bina-text)] active:opacity-70"
              >
                + {t("addPage")}
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={exportJpg}
                className="font-bina-display flex-1 rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel3)] py-2.5 text-[12px] font-semibold text-[var(--bina-text)] disabled:opacity-50 active:opacity-70"
              >
                {exporting ? t("exporting") : t("exportJpg")}
              </button>
              <button
                type="button"
                disabled={exporting}
                onClick={exportPdf}
                className="font-bina-display flex-1 rounded-xl bg-[var(--bina-or)] py-2.5 text-[12px] font-bold text-white disabled:opacity-50 active:opacity-80"
              >
                {exporting ? t("exporting") : t("exportPdf")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE: pages ── */}
      {stage === "pages" && (
        <div className="flex flex-1 flex-col">
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3">
            {pages.map((pg, idx) => (
              <div key={pg.id} className="relative overflow-hidden rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel2)] shadow">
                <CanvasImage canvas={pg.filteredCanvas} />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/50 px-2 py-1">
                  <span className="font-bina-display text-[10px] text-white">{idx + 1}</span>
                  <button
                    type="button"
                    aria-label={t("deletePage")}
                    onClick={() => handleDeletePage(pg.id)}
                    className="text-[14px] text-red-300 active:opacity-70"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
            <button
              type="button"
              onClick={() => setStage("capture")}
              className="font-bina-display flex-1 rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel3)] py-2.5 text-[12px] font-semibold text-[var(--bina-text)] active:opacity-70"
            >
              + {t("addPage")}
            </button>
            <button
              type="button"
              disabled={exporting || pages.length === 0}
              onClick={exportPdf}
              className="font-bina-display flex-1 rounded-xl bg-[var(--bina-or)] py-2.5 text-[12px] font-bold text-white disabled:opacity-50 active:opacity-80"
            >
              {exporting ? t("exporting") : t("exportPdf")}
            </button>
          </div>
        </div>
      )}
      {/* ── Floating capture button (bottom-right FAB) ── */}
      {stage === "capture" && (
        <button
          type="button"
          aria-label={t("captureAria")}
          onClick={() => fileInputRef.current?.click()}
          className="fixed bottom-0 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bina-or)] shadow-xl transition-transform active:scale-90 active:opacity-80"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-6 w-6">
            <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
            <path fillRule="evenodd" d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9Zm3 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* ── Full-screen image viewer ── */}
      {viewingScan && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
            <button
              type="button"
              onClick={() => setViewingScan(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white active:opacity-70"
            >
              ✕
            </button>
            <span className="font-bina-display flex-1 truncate text-[13px] text-white/80">
              {viewingScan.label}
            </span>
            <button
              type="button"
              onClick={() => handleDownloadSavedScan(viewingScan)}
              className="font-bina-display flex items-center gap-1.5 rounded-xl bg-[var(--bina-or)] px-4 py-2 text-[12px] font-bold text-white active:opacity-80"
            >
              ⬇ {t("exportJpg")}
            </button>
          </div>

          {/* Full image */}
          <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewingScan.dataUrl}
              alt={viewingScan.label}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>

          {/* Delete from viewer */}
          <div className="flex justify-center px-4 py-3">
            <button
              type="button"
              onClick={() => { handleDeleteSavedScan(viewingScan.id); setViewingScan(null); }}
              className="font-bina-display rounded-xl border border-red-500/40 px-6 py-2 text-[12px] font-semibold text-red-400 active:opacity-70"
            >
              🗑 {t("deleteScan")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FilterThumb({ canvas, filter }: { canvas: HTMLCanvasElement | null; filter: FilterType }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canvas) return;
    const size = 44;
    el.width = size;
    el.height = size;
    const ctx = el.getContext("2d")!;
    // Draw source scaled
    const tmpFull = applyFilter(canvas, filter);
    // Crop center square
    const s = Math.min(tmpFull.width, tmpFull.height);
    const sx = (tmpFull.width - s) / 2;
    const sy = (tmpFull.height - s) / 2;
    ctx.drawImage(tmpFull, sx, sy, s, s, 0, 0, size, size);
  }, [canvas, filter]);

  return <canvas ref={ref} className="h-11 w-11 rounded-md object-cover" />;
}

function CanvasImage({ canvas }: { canvas: HTMLCanvasElement }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.width = canvas.width;
    el.height = canvas.height;
    el.getContext("2d")!.drawImage(canvas, 0, 0);
  }, [canvas]);

  return <canvas ref={ref} className="block w-full" />;
}
