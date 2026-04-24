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
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const bw = v > 128 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = bw;
      }
      break;
    }
    case "enhanced": {
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
    case "magicColor": {
      const W = width, H = height, N = W * H;

      // Grey world correction capped at 1.15x
      let sumR = 0, sumG = 0, sumB = 0;
      for (let i = 0; i < d.length; i += 4) { sumR += d[i]; sumG += d[i + 1]; sumB += d[i + 2]; }
      const mR = sumR / N, mG = sumG / N, mB = sumB / N;
      const mAll = (mR + mG + mB) / 3;
      const ccR = Math.min(mAll / (mR || 1), 1.15);
      const ccG = Math.min(mAll / (mG || 1), 1.15);
      const ccB = Math.min(mAll / (mB || 1), 1.15);
      for (let i = 0; i < d.length; i += 4) {
        d[i]     = Math.min(255, Math.round(d[i]     * ccR));
        d[i + 1] = Math.min(255, Math.round(d[i + 1] * ccG));
        d[i + 2] = Math.min(255, Math.round(d[i + 2] * ccB));
      }

      // Luminance map
      const lum = new Float32Array(N);
      for (let i = 0; i < d.length; i += 4) {
        lum[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // Adaptive background map — 64px tiles, 88th percentile
      const TILE = 64;
      const tilesX = Math.ceil(W / TILE);
      const tilesY = Math.ceil(H / TILE);
      const bgMap = new Float32Array(tilesX * tilesY);
      for (let tyi = 0; tyi < tilesY; tyi++) {
        for (let txi = 0; txi < tilesX; txi++) {
          const vals = [];
          const x0 = txi * TILE, x1 = Math.min(x0 + TILE, W);
          const y0 = tyi * TILE, y1 = Math.min(y0 + TILE, H);
          for (let py = y0; py < y1; py++)
            for (let px = x0; px < x1; px++) vals.push(lum[py * W + px]);
          vals.sort((a, b) => a - b);
          bgMap[tyi * tilesX + txi] = vals[Math.floor(vals.length * 0.88)] || 200;
        }
      }

      const getBg = (x, y) => {
        const fx = x / TILE - 0.5, fy = y / TILE - 0.5;
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

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = (y * W + x) * 4;
          let r = d[idx] / 255, g = d[idx + 1] / 255, b = d[idx + 2] / 255;
          const lumPx = 0.299 * r + 0.587 * g + 0.114 * b;

          const bg = Math.max(getBg(x, y), 40);
          const scale = Math.min(220 / bg, 1.5);
          r = Math.min(1, r * scale);
          g = Math.min(1, g * scale);
          b = Math.min(1, b * scale);

          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = Math.min(1, Math.max(0, gray + (r - gray) * 1.10));
          g = Math.min(1, Math.max(0, gray + (g - gray) * 1.10));
          b = Math.min(1, Math.max(0, gray + (b - gray) * 1.10));

          if (lumPx < 0.45) {
            const inkFactor = lumPx < 0.20 ? 0.70 : 0.85;
            r *= inkFactor; g *= inkFactor; b *= inkFactor;
          }

          d[idx]     = Math.round(Math.min(1, Math.max(0, r)) * 255);
          d[idx + 1] = Math.round(Math.min(1, Math.max(0, g)) * 255);
          d[idx + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
        }
      }
      break;
    }
    case "magicColorPro": {
      const W2 = width, H2 = height;

      // Luminance map
      const lum2 = new Float32Array(W2 * H2);
      for (let i = 0; i < d.length; i += 4) {
        lum2[i >> 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      }

      // Adaptive background map — 64px tiles, 92nd percentile
      const TILE2 = 64;
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
          bgMap2[tyi * tX2 + txi] = vals[Math.floor(vals.length * 0.92)] || 240;
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

      for (let y = 0; y < H2; y++) {
        for (let x = 0; x < W2; x++) {
          const idx = (y * W2 + x) * 4;
          const bg = Math.max(getBg2(x, y), 30);

          let r = Math.min(1, d[idx]     / bg);
          let g = Math.min(1, d[idx + 1] / bg);
          let b = Math.min(1, d[idx + 2] / bg);

          const lp = 0.299 * r + 0.587 * g + 0.114 * b;

          let out2;
          if (lp > 0.72) {
            out2 = Math.min(1, lp + (1 - lp) * 0.99);
          } else if (lp < 0.50) {
            out2 = lp * lp * (lp < 0.18 ? 0.20 : 0.40);
          } else {
            const t = (lp - 0.50) / 0.22;
            const bright = Math.min(1, lp + (1 - lp) * 0.99);
            const dark = lp * lp * 0.40;
            out2 = dark + t * t * (3 - 2 * t) * (bright - dark);
          }

          const inkness = Math.max(0, 1 - lp / 0.50);
          const desat = inkness * 0.85;
          const lumOut = 0.299 * r + 0.587 * g + 0.114 * b;
          r = r + (lumOut - r) * desat;
          g = g + (lumOut - g) * desat;
          b = b + (lumOut - b) * desat;

          const scl = lp > 0.01 ? out2 / lp : 0;
          r = Math.min(1, Math.max(0, r * scl));
          g = Math.min(1, Math.max(0, g * scl));
          b = Math.min(1, Math.max(0, b * scl));

          d[idx]     = Math.round(r * 255);
          d[idx + 1] = Math.round(g * 255);
          d[idx + 2] = Math.round(b * 255);
        }
      }
      break;
    }
  }

  // Transfer the buffer back (zero-copy)
  self.postMessage({ buffer: d.buffer, width, height }, [d.buffer]);
};
