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
      // Hybrid: Pure white background + saturated colored ink
      const W = out.width;
      const H = out.height;
      const N = W * H;

      // Store original colors before processing
      const origR = new Uint8Array(N);
      const origG = new Uint8Array(N);
      const origB = new Uint8Array(N);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        origR[p] = d[i];
        origG[p] = d[i + 1];
        origB[p] = d[i + 2];
      }

      // ── Step 1: Luminance map for threshold decisions ────────────────────
      const lum = new Float32Array(N);
      for (let i = 0; i < d.length; i += 4) {
        lum[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // ── Step 2: Adaptive background map (16px tiles, 96th percentile) ─────
      // Aggressive settings to match CamScanner Magic Pro background
      const TILE = 16;
      const tilesX = Math.ceil(W / TILE);
      const tilesY = Math.ceil(H / TILE);
      const bgMap = new Float32Array(tilesX * tilesY);
      for (let tyi = 0; tyi < tilesY; tyi++) {
        for (let txi = 0; txi < tilesX; txi++) {
          const vals: number[] = [];
          const x0 = txi * TILE, x1 = Math.min(x0 + TILE, W);
          const y0 = tyi * TILE, y1 = Math.min(y0 + TILE, H);
          for (let py = y0; py < y1; py++)
            for (let px = x0; px < x1; px++) vals.push(lum[py * W + px]);
          vals.sort((a, b) => a - b);
          bgMap[tyi * tilesX + txi] = vals[Math.floor(vals.length * 0.96)] || 245;
        }
      }

      const getBg = (x: number, y: number): number => {
        const fx = (x / TILE) - 0.5, fy = (y / TILE) - 0.5;
        const tx0 = Math.max(0, Math.floor(fx)), tx1 = Math.min(tilesX - 1, tx0 + 1);
        const ty0 = Math.max(0, Math.floor(fy)), ty1 = Math.min(tilesY - 1, ty0 + 1);
        const wx = fx - Math.floor(fx), wy = fy - Math.floor(fy);
        return (
          bgMap[ty0 * tilesX + tx0] * (1 - wx) * (1 - wy) +
          bgMap[ty0 * tilesX + tx1] * wx        * (1 - wy) +
          bgMap[ty1 * tilesX + tx0] * (1 - wx)  * wy +
          bgMap[ty1 * tilesX + tx1] * wx         * wy
        );
      };

      // ── Step 3: Build normalized luminance for binarization ────────────────
      const normLum = new Float32Array(N);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          const bg = Math.max(getBg(x, y), 60);
          normLum[idx] = Math.min(1, lum[idx] / bg);
        }
      }

      // ── Step 4: Per-pixel binarization with colored ink ────────────────────
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const lumIdx = y * W + x;

          // Get original color
          let rRaw = origR[lumIdx] / 255;
          let gRaw = origG[lumIdx] / 255;
          let bRaw = origB[lumIdx] / 255;

          // Normalize against local background
          const bgVal = Math.max(getBg(x, y), 60);
          const rNorm = Math.min(1, rRaw * 255 / bgVal);
          const gNorm = Math.min(1, gRaw * 255 / bgVal);
          const bNorm = Math.min(1, bRaw * 255 / bgVal);

          // Grayscale luminance for threshold
          const nLum = normLum[lumIdx];

          // Detect background: grayscale OR any color channel is very bright
          // This catches blue-tinted paper that has low luminance but high B value
          const isGrayBackground = nLum > 0.50 || (nLum > 0.65 && nLum < 0.995);
          const isColorBackground = rNorm > 0.78 || gNorm > 0.78 || bNorm > 0.78;

          if (isGrayBackground || isColorBackground) {
            // Background/shadow/color-tint → pure white (CamScanner style)
            d[idx] = 255;
            d[idx + 1] = 255;
            d[idx + 2] = 255;
          } else {
            // Ink pixel → saturate and darken for vivid contrast
            let r = rRaw;
            let g = gRaw;
            let b = bRaw;

            // High saturation boost (40%) to make ink vivid
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = Math.min(1, Math.max(0, gray + (r - gray) * 1.40));
            g = Math.min(1, Math.max(0, gray + (g - gray) * 1.40));
            b = Math.min(1, Math.max(0, gray + (b - gray) * 1.40));

            // Darken ink for crisp contrast against white background
            const inkDarkness = 1 - gray;
            const darkenFactor = 0.75 - (inkDarkness * 0.15); // 0.60 to 0.75
            r = r * darkenFactor;
            g = g * darkenFactor;
            b = b * darkenFactor;

            d[idx]     = Math.round(r * 255);
            d[idx + 1] = Math.round(g * 255);
            d[idx + 2] = Math.round(b * 255);
          }
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
          // 98th percentile: absolute brightest pixels only = true paper white
          bgMap2[tyi * tX2 + txi] = vals[Math.floor(vals.length * 0.98)] || 250;
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
          // Higher floor (60) = aggressively lift all shadows toward white
          const bg = Math.max(getBg2(x, y), 60);
          const rawLum = lum2[idx];
          normLum[idx] = Math.min(1, rawLum / bg); // 0-1 normalized
        }
      }

      // ── Step 4: Ultra-aggressive binarization matching CamScanner exactly ───
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          const idx = (y * W2 + x) * 4;
          const lumIdx = y * W2 + x;
          // High floor forces all non-ink pixels toward white
          const bg = Math.max(getBg2(x, y), 60);

          // Normalize pixel against local background
          const rNorm = Math.min(1, d[idx]     / bg);
          const gNorm = Math.min(1, d[idx + 1] / bg);
          const bNorm = Math.min(1, d[idx + 2] / bg);

          // Convert to grayscale luminance (remove all color cast)
          const lumNorm = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm;

          // WIDE shadow detection: 0.70-0.995 catches ALL shadow gradients
          const isShadowOrBg = normLum[lumIdx] > 0.70 && normLum[lumIdx] < 0.995;

          // Lower threshold = more pixels become pure white
          let outVal: number;
          if (lumNorm > 0.52 || isShadowOrBg) {
            // Background, shadow, or near-background → pure white (255)
            outVal = 255;
          } else if (lumNorm < 0.40) {
            // Dark ink → near black
            outVal = Math.round(lumNorm * lumNorm * 50); // 0-8 range
          } else {
            // Narrow transition (0.40-0.52) for crisp edges
            const t = (lumNorm - 0.40) / 0.12;
            outVal = Math.round(8 + t * t * (3 - 2 * t) * 247);
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
