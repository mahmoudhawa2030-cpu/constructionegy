"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useOpenCV } from "./use-opencv";
import {
  applyFilter,
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

const FILTERS: FilterType[] = ["original", "enhanced", "magicColor", "grayscale", "bw", "light", "sketch"];

const FILTER_LABEL_KEYS: Record<FilterType, string> = {
  original: "filterOriginal",
  enhanced: "filterEnhanced",
  magicColor: "filterMagicColor",
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

  // Pages
  const [pages, setPages] = useState<ScannedPage[]>([]);

  // Export
  const [exporting, setExporting] = useState(false);

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

    // Default corners = full image with 5% inset
    const w = rawImage.naturalWidth;
    const h = rawImage.naturalHeight;
    const inset = 0.05;
    const defaultCorners: [Point, Point, Point, Point] = [
      { x: w * inset,       y: h * inset },
      { x: w * (1 - inset), y: h * inset },
      { x: w * (1 - inset), y: h * (1 - inset) },
      { x: w * inset,       y: h * (1 - inset) },
    ];

    if (cvStatus === "ready" && window.cv) {
      setAutoDetectMsg(t("autoDetecting"));
      setTimeout(() => {
        try {
          const detected = detectCornersWithOpenCV(rawImage, window.cv);
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
    } else {
      setCorners(defaultCorners);
      setAutoDetectMsg("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, rawImage, cvStatus]);

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

  // ── Filter selection ────────────────────────────────────────────────────────
  const handleFilterSelect = useCallback(
    (f: FilterType) => {
      if (!warpedCanvas) return;
      setActiveFilter(f);
      setFilteredCanvas(applyFilter(warpedCanvas, f));
    },
    [warpedCanvas]
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
    } finally {
      setExporting(false);
    }
  }, [pages, filteredCanvas]);

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
    } finally {
      setExporting(false);
    }
  }, [pages, filteredCanvas, warpedCanvas, activeFilter]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--bina-steel)]">
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

      {/* Loading OpenCV */}
      {cvStatus === "loading" && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 dark:bg-amber-900/20">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="font-bina-display text-[12px] text-amber-700 dark:text-amber-400">
            {t("loadingOpenCV")}
          </span>
        </div>
      )}

      {/* ── STAGE: capture ── */}
      {stage === "capture" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
          <span className="text-7xl">📄</span>
          <p className="font-bina-display text-center text-[13px] text-[var(--bina-muted)]">
            {t("adjustCorners")}
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              aria-label={t("captureAria")}
              onClick={() => fileInputRef.current?.click()}
              className="font-bina-display flex items-center gap-2 rounded-2xl bg-[var(--bina-or)] px-6 py-3 text-[14px] font-bold text-white shadow-lg active:opacity-80"
            >
              📷 {t("capture")}
            </button>
            {pages.length > 0 && (
              <button
                type="button"
                onClick={() => setStage("pages")}
                className="font-bina-display flex items-center gap-2 rounded-2xl border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-6 py-3 text-[14px] font-bold text-[var(--bina-text)] active:opacity-80"
              >
                {t("done")}
              </button>
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

          <div className="flex w-full gap-3 border-t border-[var(--bina-border)] bg-[var(--bina-steel2)] px-4 py-3">
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
          </div>

          {/* Filter strip */}
          <div className="border-t border-[var(--bina-border)] bg-[var(--bina-steel2)]">
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

          <div className="flex gap-2 border-t border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-3">
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
