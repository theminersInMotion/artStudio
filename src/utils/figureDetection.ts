/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImageCropBox } from '../types/anatomy.ts';

export interface DetectedFigure {
  id: string;
  label: string;
  cropBox: ImageCropBox;
  confidence?: number;
}

/**
 * Detects distinct drawing clusters/figures on an anatomical drawing plate
 * using client-side canvas pixel density analysis and connected component clustering.
 */
export async function detectFiguresFromImage(
  img: HTMLImageElement
): Promise<DetectedFigure[]> {
  try {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return [];

    // Scale down for fast processing (approx 300-400px wide)
    const sampleWidth = 320;
    const sampleHeight = Math.round((height / width) * sampleWidth);

    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const data = imageData.data;

    // Grid cell size for density estimation (e.g. 10x10 pixels in sampled canvas)
    const cellSize = 8;
    const gridCols = Math.ceil(sampleWidth / cellSize);
    const gridRows = Math.ceil(sampleHeight / cellSize);
    const grid: number[][] = Array.from({ length: gridRows }, () =>
      new Array(gridCols).fill(0)
    );

    // Identify ink pixels: non-white (brightness < 232 or noticeable color saturation)
    for (let r = 0; r < sampleHeight; r++) {
      const gRow = Math.floor(r / cellSize);
      for (let c = 0; c < sampleWidth; c++) {
        const gCol = Math.floor(c / cellSize);
        const idx = (r * sampleWidth + c) * 4;
        const red = data[idx];
        const green = data[idx + 1];
        const blue = data[idx + 2];
        const alpha = data[idx + 3];

        if (alpha < 50) continue; // transparent

        const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
        // Non-white paper threshold
        if (brightness < 232) {
          // More weight for darker strokes
          const weight = (240 - brightness) / 240;
          grid[gRow][gCol] += weight;
        }
      }
    }

    // Binary active cells (cells with enough ink density)
    const activeGrid: boolean[][] = Array.from({ length: gridRows }, () =>
      new Array(gridCols).fill(false)
    );
    const minCellWeight = 3.0; // at least some dark lines in this 8x8 cell
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        activeGrid[r][c] = grid[r][c] >= minCellWeight;
      }
    }

    // Dilate/smooth active cells to connect strokes of the same figure
    const dilatedGrid: boolean[][] = Array.from({ length: gridRows }, () =>
      new Array(gridCols).fill(false)
    );
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (activeGrid[r][c]) {
          dilatedGrid[r][c] = true;
          // Connect to adjacent cells within distance 2
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols) {
                if (Math.abs(dr) + Math.abs(dc) <= 3) {
                  dilatedGrid[nr][nc] = true;
                }
              }
            }
          }
        }
      }
    }

    // Connected Component Labeling on dilated grid
    const visited: boolean[][] = Array.from({ length: gridRows }, () =>
      new Array(gridCols).fill(false)
    );
    interface BBox {
      minR: number;
      maxR: number;
      minC: number;
      maxC: number;
      count: number;
    }
    const clusters: BBox[] = [];

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (dilatedGrid[r][c] && !visited[r][c]) {
          // BFS
          const queue: [number, number][] = [[r, c]];
          visited[r][c] = true;
          let minR = r;
          let maxR = r;
          let minC = c;
          let maxC = c;
          let count = 0;

          while (queue.length > 0) {
            const [cr, cc] = queue.shift()!;
            count++;
            minR = Math.min(minR, cr);
            maxR = Math.max(maxR, cr);
            minC = Math.min(minC, cc);
            maxC = Math.max(maxC, cc);

            const neighbors = [
              [cr - 1, cc],
              [cr + 1, cc],
              [cr, cc - 1],
              [cr, cc + 1],
            ];
            for (const [nr, nc] of neighbors) {
              if (
                nr >= 0 &&
                nr < gridRows &&
                nc >= 0 &&
                nc < gridCols &&
                dilatedGrid[nr][nc] &&
                !visited[nr][nc]
              ) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
              }
            }
          }

          // Filter out tiny noise clusters (< 1.5% of total grid cells)
          const totalCells = gridRows * gridCols;
          if (count >= Math.max(8, Math.round(totalCells * 0.012))) {
            clusters.push({ minR, maxR, minC, maxC, count });
          }
        }
      }
    }

    // Merge overlapping or heavily nested bounding boxes
    const merged: BBox[] = [];
    for (const c of clusters) {
      let absorbed = false;
      for (const m of merged) {
        // Check if overlaps or close
        const overlapX = !(c.maxC + 1 < m.minC || c.minC > m.maxC + 1);
        const overlapY = !(c.maxR + 1 < m.minR || c.minR > m.maxR + 1);
        if (overlapX && overlapY) {
          m.minR = Math.min(m.minR, c.minR);
          m.maxR = Math.max(m.maxR, c.maxR);
          m.minC = Math.min(m.minC, c.minC);
          m.maxC = Math.max(m.maxC, c.maxC);
          m.count += c.count;
          absorbed = true;
          break;
        }
      }
      if (!absorbed) {
        merged.push({ ...c });
      }
    }

    // Convert to percentage coordinates with margin padding
    const detected: DetectedFigure[] = [];
    for (let i = 0; i < merged.length; i++) {
      const b = merged[i];
      // Raw percentage
      const rawX = (b.minC * cellSize) / sampleWidth;
      const rawY = (b.minR * cellSize) / sampleHeight;
      const rawW = ((b.maxC - b.minC + 1) * cellSize) / sampleWidth;
      const rawH = ((b.maxR - b.minR + 1) * cellSize) / sampleHeight;

      // Filter out huge box that spans whole page (> 88% width and > 88% height)
      if (rawW > 0.9 && rawH > 0.9) continue;

      // Add 2% padding
      const padX = 0.02;
      const padY = 0.02;
      const x = Math.max(0, Math.round((rawX - padX) * 1000) / 10);
      const y = Math.max(0, Math.round((rawY - padY) * 1000) / 10);
      const w = Math.min(100 - x, Math.round((rawW + padX * 2) * 1000) / 10);
      const h = Math.min(100 - y, Math.round((rawH + padY * 2) * 1000) / 10);

      // Only accept reasonable figure dimensions
      if (w >= 10 && h >= 10) {
        detected.push({
          id: `det_fig_${i + 1}`,
          label: `Figura ${i + 1}`,
          cropBox: { x, y, width: w, height: h },
          confidence: Math.min(1.0, b.count / 100),
        });
      }
    }

    // Sort detected figures reading order: top-to-bottom, then left-to-right
    detected.sort((a, b) => {
      const rowA = Math.floor(a.cropBox.y / 25);
      const rowB = Math.floor(b.cropBox.y / 25);
      if (rowA !== rowB) return rowA - rowB;
      return a.cropBox.x - b.cropBox.x;
    });

    // Rename with positional descriptors for clarity (e.g. Figura 1 (Topo), Figura 2...)
    return detected.map((fig, idx) => {
      let loc = '';
      if (fig.cropBox.y < 35) loc = 'Superior';
      else if (fig.cropBox.y > 60) loc = 'Inferior';
      else loc = 'Centro';

      if (fig.cropBox.x < 35) loc += ' Esquerda';
      else if (fig.cropBox.x > 60) loc += ' Direita';

      return {
        ...fig,
        id: `detected_fig_${idx + 1}`,
        label: `Figura ${idx + 1} (${loc})`,
      };
    });
  } catch (err) {
    console.warn('Auto figure detection failed, fallback to defaults:', err);
    return [];
  }
}
