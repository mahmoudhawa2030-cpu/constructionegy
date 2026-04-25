"use client";

export type Point = { x: number; y: number };
export type FilterType = "original" | "enhanced" | "magicColor" | "magicColorPro" | "grayscale" | "bw" | "light" | "sketch";

/** Sort 4 points into [topLeft, topRight, bottomRight, bottomLeft] order */
export function sortCorners(pts: Point[]): [Point, Point, Point, Point] {
  const sorted = [...pts].sort((a, b) => a.y - b.y);
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sorted.slice(2).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bottom[1], bottom[0]];
}

/**
 * Convert a TFLite segmentation mask (Float32Array 256×256) into a binary
 * canvas mask, then use OpenCV to find the 4 document corners from it.
 */
export function detectCornersFromMask(
  mask: Float32Array,
  originalWidth: number,
  originalHeight: number,
  cv: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Point[] | null {
  try {
    const SIZE = 256;
    const threshold = 0.5;

    // Render mask to a canvas
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = SIZE;
    maskCanvas.height = SIZE;
    const mctx = maskCanvas.getContext("2d")!;
    const imgData = mctx.createImageData(SIZE, SIZE);
    const d = imgData.data;

    for (let i = 0; i < SIZE * SIZE; i++) {
      const val = mask[i] > threshold ? 255 : 0;
      d[i * 4]     = val;
      d[i * 4 + 1] = val;
      d[i * 4 + 2] = val;
      d[i * 4 + 3] = 255;
    }
    mctx.putImageData(imgData, 0, 0);

    // Use OpenCV to find the largest quadrilateral contour
    const src = cv.imread(maskCanvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(gray, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let bestContour: any = null;
    let bestArea = 0;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area < SIZE * SIZE * 0.05) continue;

      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4 && area > bestArea) {
        bestArea = area;
        bestContour?.delete();
        bestContour = approx;
      } else {
        approx.delete();
      }
    }

    let result: Point[] | null = null;
    if (bestContour) {
      // Scale from 256×256 mask back to original image dimensions
      const scaleX = originalWidth / SIZE;
      const scaleY = originalHeight / SIZE;
      result = [];
      for (let i = 0; i < 4; i++) {
        result.push({
          x: bestContour.intAt(i, 0) * scaleX,
          y: bestContour.intAt(i, 1) * scaleY,
        });
      }
      bestContour.delete();
    }

    src.delete(); gray.delete(); contours.delete(); hierarchy.delete();
    return result;
  } catch {
    return null;
  }
}

/** Use OpenCV to auto-detect document corners in an image */
export function detectCornersWithOpenCV(
  imgEl: HTMLImageElement | HTMLCanvasElement,
  cv: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Point[] | null {
  try {
    const src = cv.imread(imgEl);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 75, 200);

    // Dilate to close gaps
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.dilate(edges, edges, kernel);
    kernel.delete();

    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let bestContour: any = null;
    let bestArea = 0;
    const imgArea = src.rows * src.cols;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area < imgArea * 0.05) continue;

      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4 && area > bestArea) {
        bestArea = area;
        bestContour?.delete();
        bestContour = approx;
      } else {
        approx.delete();
      }
    }

    let result: Point[] | null = null;
    if (bestContour) {
      result = [];
      for (let i = 0; i < 4; i++) {
        result.push({
          x: bestContour.intAt(i, 0),
          y: bestContour.intAt(i, 1),
        });
      }
      bestContour.delete();
    }

    src.delete(); gray.delete(); blurred.delete(); edges.delete();
    contours.delete(); hierarchy.delete();

    return result;
  } catch {
    return null;
  }
}

/** Apply perspective warp using OpenCV and return a canvas */
export function perspectiveWarp(
  imgEl: HTMLImageElement | HTMLCanvasElement,
  corners: [Point, Point, Point, Point],
  cv: any // eslint-disable-line @typescript-eslint/no-explicit-any
): HTMLCanvasElement {
  const [tl, tr, br, bl] = corners;

  const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
  const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const maxW = Math.round(Math.max(widthA, widthB));

  const heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
  const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
  const maxH = Math.round(Math.max(heightA, heightB));

  const src = cv.imread(imgEl);
  const dst = new cv.Mat();

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
  ]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, maxW, 0, maxW, maxH, 0, maxH,
  ]);

  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  cv.warpPerspective(src, dst, M, new cv.Size(maxW, maxH));

  const canvas = document.createElement("canvas");
  canvas.width = maxW;
  canvas.height = maxH;
  cv.imshow(canvas, dst);

  src.delete(); dst.delete(); srcPts.delete(); dstPts.delete(); M.delete();
  return canvas;
}

/**
 * Apply a filter asynchronously in a Web Worker — non-blocking, UI stays responsive.
 * Use this for full-size filter application in the filter stage.
 */
export function applyFilterAsync(
  source: HTMLCanvasElement,
  filter: FilterType
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    if (filter === "original") {
      const out = document.createElement("canvas");
      out.width = source.width;
      out.height = source.height;
      out.getContext("2d")!.drawImage(source, 0, 0);
      resolve(out);
      return;
    }

    const ctx = document.createElement("canvas");
    ctx.width = source.width;
    ctx.height = source.height;
    const sctx = ctx.getContext("2d")!;
    sctx.drawImage(source, 0, 0);
    const imgData = sctx.getImageData(0, 0, source.width, source.height);

    // Copy buffer to transfer to worker (transferable = zero-copy)
    const buffer = imgData.data.buffer.slice(0);

    const worker = new Worker("/filter-worker.js");
    worker.onmessage = (ev) => {
      const { buffer: outBuf, width, height } = ev.data;
      const outCanvas = document.createElement("canvas");
      outCanvas.width = width;
      outCanvas.height = height;
      const outCtx = outCanvas.getContext("2d")!;
      const outData = new ImageData(new Uint8ClampedArray(outBuf), width, height);
      outCtx.putImageData(outData, 0, 0);
      worker.terminate();
      resolve(outCanvas);
    };
    worker.onerror = (err) => {
      worker.terminate();
      // Fallback to sync on worker error
      resolve(applyFilter(source, filter));
      console.warn("[FilterWorker] error, fell back to sync:", err);
    };
    worker.postMessage(
      { filter, width: source.width, height: source.height, buffer },
      [buffer]
    );
  });
}

/** Apply a named filter to a canvas and return a new canvas (sync — used for thumbnails) */
export function applyFilter(source: HTMLCanvasElement, filter: FilterType): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(source, 0, 0);

  if (filter === "original") return out;

  const imgData = ctx.getImageData(0, 0, out.width, out.height);
  const d = imgData.data;

  switch (filter) {
    case "grayscale": {
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      break;
    }
    case "bw": {
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const bw = v > 128 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = bw;
      }
      break;
    }
    case "enhanced": {
      // Auto levels per channel + slight sharpen via contrast
      for (let ch = 0; ch < 3; ch++) {
        let min = 255, max = 0;
        for (let i = ch; i < d.length; i += 4) {
          if (d[i] < min) min = d[i];
          if (d[i] > max) max = d[i];
        }
        const range = max - min || 1;
        for (let i = ch; i < d.length; i += 4) {
          d[i] = Math.round(((d[i] - min) / range) * 255);
        }
      }
      break;
    }
    case "magicColor": {
      const W = out.width;
      const H = out.height;
      const N = W * H;

      // ── Step 1: Gentle grey world — only correct strong color casts ────────
      // Cap at 1.15x so we never over-correct and thin out the ink
      let sumR = 0, sumG = 0, sumB = 0;
      for (let i = 0; i < d.length; i += 4) {
        sumR += d[i]; sumG += d[i + 1]; sumB += d[i + 2];
      }
      const meanR = sumR / N, meanG = sumG / N, meanB = sumB / N;
      const meanAll = (meanR + meanG + meanB) / 3;
      const ccR = Math.min(meanAll / (meanR || 1), 1.15);
      const ccG = Math.min(meanAll / (meanG || 1), 1.15);
      const ccB = Math.min(meanAll / (meanB || 1), 1.15);
      for (let i = 0; i < d.length; i += 4) {
        d[i]     = Math.min(255, Math.round(d[i]     * ccR));
        d[i + 1] = Math.min(255, Math.round(d[i + 1] * ccG));
        d[i + 2] = Math.min(255, Math.round(d[i + 2] * ccB));
      }

      // ── Step 2: Luminance map ──────────────────────────────────────────────
      const lum = new Float32Array(N);
      for (let i = 0; i < d.length; i += 4) {
        lum[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // ── Step 3: Adaptive background map (32px tiles, 94th percentile) ─────
      // Smaller tiles catch hand shadows, 94th percentile finds true paper white
      const TILE = 32;
      const tilesX = Math.ceil(W / TILE);
      const tilesY = Math.ceil(H / TILE);
      const bgMap = new Float32Array(tilesX * tilesY);
      for (let tyi = 0; tyi < tilesY; tyi++) {
        for (let txi = 0; txi < tilesX; txi++) {
          const vals: number[] = [];
          const x0 = txi * TILE, x1 = Math.min(x0 + TILE, W);
          const y0 = tyi * TILE, y1 = Math.min(y0 + TILE, H);
          for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) vals.push(lum[py * W + px]);
          }
          vals.sort((a, b) => a - b);
          // 94th percentile: ignores hand shadows, captures true paper brightness
          bgMap[tyi * tilesX + txi] = vals[Math.floor(vals.length * 0.94)] || 220;
        }
      }

      // Bilinear interpolation of background map
      const getBg = (x: number, y: number): number => {
        const fx = (x / TILE) - 0.5;
        const fy = (y / TILE) - 0.5;
        const tx0 = Math.max(0, Math.floor(fx));
        const tx1 = Math.min(tilesX - 1, tx0 + 1);
        const ty0 = Math.max(0, Math.floor(fy));
        const ty1 = Math.min(tilesY - 1, ty0 + 1);
        const wx = fx - Math.floor(fx);
        const wy = fy - Math.floor(fy);
        return (
          bgMap[ty0 * tilesX + tx0] * (1 - wx) * (1 - wy) +
          bgMap[ty0 * tilesX + tx1] * wx        * (1 - wy) +
          bgMap[ty1 * tilesX + tx0] * (1 - wx)  * wy +
          bgMap[ty1 * tilesX + tx1] * wx         * wy
        );
      };

      // ── Step 4: Build normalized luminance for shadow detection ──────────
      const normLum = new Float32Array(N);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          const bg = Math.max(getBg(x, y), 50);
          normLum[idx] = Math.min(1, lum[idx] / bg);
        }
      }

      // ── Step 5: Per-pixel pipeline with shadow removal ────────────────────
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const lumIdx = y * W + x;

          let r = d[idx]     / 255;
          let g = d[idx + 1] / 255;
          let b = d[idx + 2] / 255;
          const lumPx = 0.299 * r + 0.587 * g + 0.114 * b;

          // Adaptive normalization — cap scale at 1.5x so paper stays off-white
          const bg = Math.max(getBg(x, y), 50);
          const scale = Math.min(235 / bg, 1.5); // target 235/255 for brighter paper
          r = Math.min(1, r * scale);
          g = Math.min(1, g * scale);
          b = Math.min(1, b * scale);

          // Hand shadow detection: if pixel is close to but not quite background
          const isShadow = normLum[lumIdx] > 0.85 && normLum[lumIdx] < 0.98;
          if (isShadow) {
            // Force shadow to background brightness
            r = Math.min(1, r * 1.3);
            g = Math.min(1, g * 1.3);
            b = Math.min(1, b * 1.3);
          }

          // Saturation +10% (keeps ink colors vivid)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = Math.min(1, Math.max(0, gray + (r - gray) * 1.10));
          g = Math.min(1, Math.max(0, gray + (g - gray) * 1.10));
          b = Math.min(1, Math.max(0, gray + (b - gray) * 1.10));

          // Ink sharpening — darken pixels that are ink (dark), leave background
          if (lumPx < 0.45) {
            const inkFactor = lumPx < 0.20 ? 0.70 : 0.85;
            r = r * inkFactor;
            g = g * inkFactor;
            b = b * inkFactor;
          }

          d[idx]     = Math.round(Math.min(1, Math.max(0, r)) * 255);
          d[idx + 1] = Math.round(Math.min(1, Math.max(0, g)) * 255);
          d[idx + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
        }
      }
      break;
    }
    case "magicColorPro": {
      // CamScanner Magic Pro style: pure white background (255), crisp black ink (0-20),
      // aggressive hand shadow removal, all color casts removed.
      const W2 = out.width;
      const H2 = out.height;

      // ── Step 1: Build luminance map (grayscale for processing) ───────────────
      const lum2 = new Float32Array(W2 * H2);
      for (let i = 0; i < d.length; i += 4) {
        lum2[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // ── Step 2: Adaptive background map (16px tiles, 97th percentile) ─────
      // Ultra-fine tiles catch hand-sized shadows, 97th percentile = only brightest 3%
      const TILE2 = 16;
      const tX2 = Math.ceil(W2 / TILE2);
      const tY2 = Math.ceil(H2 / TILE2);
      const bgMap2 = new Float32Array(tX2 * tY2);
      for (let tyi = 0; tyi < tY2; tyi++) {
        for (let txi = 0; txi < tX2; txi++) {
          const vals: number[] = [];
          const x0 = txi * TILE2, x1 = Math.min(x0 + TILE2, W2);
          const y0 = tyi * TILE2, y1 = Math.min(y0 + TILE2, H2);
          for (let py = y0; py < y1; py++)
            for (let px = x0; px < x1; px++) vals.push(lum2[py * W2 + px]);
          vals.sort((a, b) => a - b);
          // 97th percentile: only brightest pixels = true paper white, ignores shadows
          bgMap2[tyi * tX2 + txi] = vals[Math.floor(vals.length * 0.97)] || 245;
        }
      }

      // Bilinear interpolation of bg map
      const getBg2 = (x: number, y: number): number => {
        const fx = x / TILE2 - 0.5, fy = y / TILE2 - 0.5;
        const tx0 = Math.max(0, Math.floor(fx)), tx1 = Math.min(tX2 - 1, tx0 + 1);
        const ty0 = Math.max(0, Math.floor(fy)), ty1 = Math.min(tY2 - 1, ty0 + 1);
        const wx = fx - Math.floor(fx), wy = fy - Math.floor(fy);
        return (
          bgMap2[ty0 * tX2 + tx0] * (1 - wx) * (1 - wy) +
          bgMap2[ty0 * tX2 + tx1] * wx        * (1 - wy) +
          bgMap2[ty1 * tX2 + tx0] * (1 - wx)  * wy +
          bgMap2[ty1 * tX2 + tx1] * wx         * wy
        );
      };

      // ── Step 3: Build normalized luminance map for shadow detection ────────
      const normLum = new Float32Array(W2 * H2);
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          const idx = (y * W2 + x);
          const bg = Math.max(getBg2(x, y), 40); // Higher floor = lift shadows more
          const rawLum = lum2[idx];
          normLum[idx] = Math.min(1, rawLum / bg); // 0-1 normalized
        }
      }

      // ── Step 4: Aggressive hard-binarization with shadow removal ────────────
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          const idx = (y * W2 + x) * 4;
          const lumIdx = y * W2 + x;
          const bg = Math.max(getBg2(x, y), 40);

          // Normalize pixel against local background
          const rNorm = Math.min(1, d[idx]     / bg);
          const gNorm = Math.min(1, d[idx + 1] / bg);
          const bNorm = Math.min(1, d[idx + 2] / bg);

          // Convert to grayscale luminance (remove color cast)
          const lumNorm = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm;

          // Shadow detection: if normalized lum > 0.92, it's pure background
          const isShadow = normLum[lumIdx] > 0.88 && normLum[lumIdx] < 0.98;

          // Hard threshold with shadow override
          let outVal: number;
          if (lumNorm > 0.58 || isShadow) {
            // Background or detected shadow → pure white
            outVal = 255;
          } else if (lumNorm < 0.48) {
            // Ink → near black with slight curve for anti-aliasing
            outVal = Math.round(lumNorm * lumNorm * 55); // 0-13 range
          } else {
            // Transition zone (0.48-0.58) for edge smoothing
            const t = (lumNorm - 0.48) / 0.10;
            outVal = Math.round(13 + t * t * (3 - 2 * t) * 242);
          }

          d[idx]     = outVal;
          d[idx + 1] = outVal;
          d[idx + 2] = outVal;
        }
      }
      break;
    }
    case "light": {
      for (let i = 0; i < d.length; i += 4) {
        d[i]     = Math.min(255, d[i]     + 40);
        d[i + 1] = Math.min(255, d[i + 1] + 40);
        d[i + 2] = Math.min(255, d[i + 2] + 40);
      }
      break;
    }
    case "sketch": {
      // Grayscale + invert + dodge with blurred version = sketch effect
      const tmp = ctx.createImageData(out.width, out.height);
      const td = tmp.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        td[i] = td[i + 1] = td[i + 2] = v;
        td[i + 3] = 255;
      }
      // Simple edge via contrast boost
      for (let i = 0; i < td.length; i += 4) {
        const v = td[i] > 160 ? 255 : Math.round(td[i] * 0.5);
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      break;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return out;
}
