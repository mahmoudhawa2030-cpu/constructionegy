"use client";

export type Point = { x: number; y: number };
export type FilterType = "original" | "enhanced" | "magicColor" | "grayscale" | "bw" | "light" | "sketch";

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

/** Apply a named filter to a canvas and return a new canvas */
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

      // ── Step 1: Build luminance map ──────────────────────────────────────
      const lum = new Float32Array(W * H);
      for (let i = 0; i < d.length; i += 4) {
        lum[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // ── Step 2: Adaptive background estimation (tile-based) ──────────────
      // Divide into tiles, estimate background brightness as the 90th
      // percentile brightness in each tile (background = bright area).
      const TILE = 32;
      const tilesX = Math.ceil(W / TILE);
      const tilesY = Math.ceil(H / TILE);
      const bgMap = new Float32Array(tilesX * tilesY);

      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          const vals: number[] = [];
          const x0 = tx * TILE, x1 = Math.min(x0 + TILE, W);
          const y0 = ty * TILE, y1 = Math.min(y0 + TILE, H);
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              vals.push(lum[y * W + x]);
            }
          }
          vals.sort((a, b) => a - b);
          // 90th percentile = paper background brightness for this tile
          bgMap[ty * tilesX + tx] = vals[Math.floor(vals.length * 0.90)] || 255;
        }
      }

      // ── Step 3: Bilinear interpolation of background map ─────────────────
      // For each pixel interpolate its estimated background value smoothly
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
          bgMap[ty0 * tilesX + tx1] * wx       * (1 - wy) +
          bgMap[ty1 * tilesX + tx0] * (1 - wx) * wy       +
          bgMap[ty1 * tilesX + tx1] * wx       * wy
        );
      };

      // ── Step 4: Apply per-pixel: normalize to white + boost + saturation ─
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          const bg = Math.max(getBg(x, y), 30); // avoid div by 0

          let r = d[idx]     / 255;
          let g = d[idx + 1] / 255;
          let b = d[idx + 2] / 255;

          // Normalize each channel relative to local background
          // bg is luminance-based, apply same scale to each channel
          const scale = 255 / bg;
          r = Math.min(1, r * scale);
          g = Math.min(1, g * scale);
          b = Math.min(1, b * scale);

          // White boost +10%: push bright pixels harder toward 1.0
          r = Math.min(1, r + (1 - r) * 0.10);
          g = Math.min(1, g + (1 - g) * 0.10);
          b = Math.min(1, b + (1 - b) * 0.10);

          // Saturation boost +10%
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const SAT = 1.10;
          r = Math.min(1, Math.max(0, gray + (r - gray) * SAT));
          g = Math.min(1, Math.max(0, gray + (g - gray) * SAT));
          b = Math.min(1, Math.max(0, gray + (b - gray) * SAT));

          // Ink sharpening: pixels darker than 55% get pushed darker (text stays crisp)
          const lumPx = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lumPx < 0.55) {
            const inkFactor = 0.75;
            r = r * inkFactor;
            g = g * inkFactor;
            b = b * inkFactor;
          }

          d[idx]     = Math.round(r * 255);
          d[idx + 1] = Math.round(g * 255);
          d[idx + 2] = Math.round(b * 255);
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
