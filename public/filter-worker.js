/**
 * Filter Web Worker
 * Receives: { filter, imageData: { data: Uint8ClampedArray, width, height } }
 * Posts back: { data: Uint8ClampedArray, width, height }
 */
self.onmessage = function (e) {
  const { filter, width, height, buffer } = e.data;
  const d = new Uint8ClampedArray(buffer);

  switch (filter) {
    case "grayscale": {
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      break;
    }
    case "bw": {
      // CamScanner B&W: adaptive (local-mean) threshold for clean text on white.
      const Wb = width, Hb = height;
      const g = new Float32Array(Wb * Hb);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        g[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }
      const R = Math.max(8, Math.round(Math.min(Wb, Hb) * 0.02));
      const mean = new Float32Array(Wb * Hb);
      const tmpH = new Float32Array(Wb * Hb);
      // Horizontal box pass
      for (let y = 0; y < Hb; y++) {
        let acc = 0;
        const row = y * Wb;
        for (let x = 0; x < Math.min(R, Wb); x++) acc += g[row + x];
        for (let x = 0; x < Wb; x++) {
          const xr = x + R, xl = x - R - 1;
          if (xr < Wb) acc += g[row + xr];
          if (xl >= 0) acc -= g[row + xl];
          const cnt = Math.min(xr, Wb - 1) - Math.max(xl + 1, 0) + 1;
          tmpH[row + x] = acc / cnt;
        }
      }
      // Vertical box pass
      for (let x = 0; x < Wb; x++) {
        let acc = 0;
        for (let y = 0; y < Math.min(R, Hb); y++) acc += tmpH[y * Wb + x];
        for (let y = 0; y < Hb; y++) {
          const yr = y + R, yl = y - R - 1;
          if (yr < Hb) acc += tmpH[yr * Wb + x];
          if (yl >= 0) acc -= tmpH[yl * Wb + x];
          const cnt = Math.min(yr, Hb - 1) - Math.max(yl + 1, 0) + 1;
          mean[y * Wb + x] = acc / cnt;
        }
      }
      const bias = 10;
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const bw = g[p] < mean[p] - bias ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = bw;
      }
      break;
    }
    case "enhanced":
    case "magicColor": {
      // CamScanner "Enhance": adaptive shadow removal (whiten paper) + darken &
      // sharpen text via contrast curve, while PRESERVING color (blue stamps/ink).
      // Smooth tones, NOT binarized. (Magic Color uses the same look per user request.)
      const W = width, H = height, N = W * H;

      // Store originals
      const oR = new Uint8Array(N), oG = new Uint8Array(N), oB = new Uint8Array(N);
      for (let i = 0, p = 0; i < d.length; i += 4, p++) { oR[p] = d[i]; oG[p] = d[i + 1]; oB[p] = d[i + 2]; }

      // Luminance
      const lum = new Float32Array(N);
      for (let i = 0; i < d.length; i += 4) lum[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

      // Adaptive background map — 32px tiles, 90th percentile (paper, not text)
      const TILE = 32;
      const tX = Math.ceil(W / TILE), tY = Math.ceil(H / TILE);
      const bgMap = new Float32Array(tX * tY);
      for (let tyi = 0; tyi < tY; tyi++) {
        for (let txi = 0; txi < tX; txi++) {
          const vals = [];
          const x0 = txi * TILE, x1 = Math.min(x0 + TILE, W);
          const y0 = tyi * TILE, y1 = Math.min(y0 + TILE, H);
          for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) vals.push(lum[py * W + px]);
          vals.sort((a, b) => a - b);
          bgMap[tyi * tX + txi] = vals[Math.floor(vals.length * 0.90)] || 210;
        }
      }
      const getBg = (x, y) => {
        const fx = x / TILE - 0.5, fy = y / TILE - 0.5;
        const tx0 = Math.max(0, Math.floor(fx)), tx1 = Math.min(tX - 1, tx0 + 1);
        const ty0 = Math.max(0, Math.floor(fy)), ty1 = Math.min(tY - 1, ty0 + 1);
        const wx = fx - Math.floor(fx), wy = fy - Math.floor(fy);
        return (
          bgMap[ty0 * tX + tx0] * (1 - wx) * (1 - wy) +
          bgMap[ty0 * tX + tx1] * wx        * (1 - wy) +
          bgMap[ty1 * tX + tx0] * (1 - wx)  * wy +
          bgMap[ty1 * tX + tx1] * wx         * wy
        );
      };

      // Contrast curve: whitens bright (paper) toward 1, darkens mid/low (text).
      const curve = (v) => {
        if (v >= 0.92) return 1;            // soft white clip for paper
        let n = (v - 0.46) * 1.45 + 0.52;   // contrast around mid
        n = n + (1 - n) * 0.05;             // tiny lift
        return n < 0 ? 0 : n > 1 ? 1 : n;
      };

      const TARGET = 235; // paper white target after normalization
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          const idx = p * 4;
          const bg = Math.max(getBg(x, y), 70);
          const norm = Math.min(TARGET / bg, 1.8); // scale to whiten paper (capped)

          let r = Math.min(1, (oR[p] * norm) / 255);
          let g = Math.min(1, (oG[p] * norm) / 255);
          let b = Math.min(1, (oB[p] * norm) / 255);

          // Apply contrast on luminance, keep color via ratio (preserves hue)
          const lN = 0.299 * r + 0.587 * g + 0.114 * b;
          const lO = curve(lN);
          const ratio = lN > 0.001 ? lO / lN : 0;
          r = Math.min(1, r * ratio);
          g = Math.min(1, g * ratio);
          b = Math.min(1, b * ratio);

          // Saturation boost so blue stamps/ink stay vivid (stronger on darker ink)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const sat = 1.18 + (1 - gray) * 0.22; // 1.18–1.40
          r = Math.min(1, Math.max(0, gray + (r - gray) * sat));
          g = Math.min(1, Math.max(0, gray + (g - gray) * sat));
          b = Math.min(1, Math.max(0, gray + (b - gray) * sat));

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
      const td = new Uint8ClampedArray(d.length);
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        td[i] = td[i + 1] = td[i + 2] = v;
        td[i + 3] = 255;
      }
      for (let i = 0; i < td.length; i += 4) {
        const v = td[i] > 160 ? 255 : Math.round(td[i] * 0.5);
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      break;
    }
    case "magicColorPro": {
      // CamScanner "Magic Pro" / B&W document: pure white background (255),
      // crisp near-black ink (0-7), aggressive shadow removal, no color cast.
      // Matches image-utils.ts exactly so thumbnail == final result.
      const W2 = width, H2 = height;

      const lum2 = new Float32Array(W2 * H2);
      for (let i = 0; i < d.length; i += 4) {
        lum2[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // Ultra-fine 16px tiles, 98th percentile = true paper white
      const TILE2 = 16;
      const tX2 = Math.ceil(W2 / TILE2);
      const tY2 = Math.ceil(H2 / TILE2);
      const bgMap2 = new Float32Array(tX2 * tY2);
      for (let tyi = 0; tyi < tY2; tyi++) {
        for (let txi = 0; txi < tX2; txi++) {
          const vals = [];
          const x0 = txi * TILE2, x1 = Math.min(x0 + TILE2, W2);
          const y0 = tyi * TILE2, y1 = Math.min(y0 + TILE2, H2);
          for (let py = y0; py < y1; py++)
            for (let px = x0; px < x1; px++) vals.push(lum2[py * W2 + px]);
          vals.sort((a, b) => a - b);
          bgMap2[tyi * tX2 + txi] = vals[Math.floor(vals.length * 0.98)] || 250;
        }
      }

      const getBg2 = (x, y) => {
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

      const normLum2 = new Float32Array(W2 * H2);
      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          const idx = y * W2 + x;
          const bg = Math.max(getBg2(x, y), 60);
          normLum2[idx] = Math.min(1, lum2[idx] / bg);
        }
      }

      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          const idx = (y * W2 + x) * 4;
          const lumIdx = y * W2 + x;
          const bg = Math.max(getBg2(x, y), 60);

          const rNorm = Math.min(1, d[idx]     / bg);
          const gNorm = Math.min(1, d[idx + 1] / bg);
          const bNorm = Math.min(1, d[idx + 2] / bg);
          const lumNorm = 0.299 * rNorm + 0.587 * gNorm + 0.114 * bNorm;

          const isShadowOrBg = normLum2[lumIdx] > 0.75 && normLum2[lumIdx] < 0.995;

          let outVal;
          if (lumNorm > 0.60 || isShadowOrBg) {
            outVal = 255;
          } else if (lumNorm < 0.35) {
            outVal = Math.round(lumNorm * lumNorm * 55);
          } else {
            const t = (lumNorm - 0.35) / 0.25;
            outVal = Math.round(7 + t * t * (3 - 2 * t) * 248);
          }

          d[idx] = outVal; d[idx + 1] = outVal; d[idx + 2] = outVal;
        }
      }
      break;
    }
  }

  // Transfer the buffer back (zero-copy)
  self.postMessage({ buffer: d.buffer, width, height }, [d.buffer]);
};
