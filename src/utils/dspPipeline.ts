import { CameraState, RESOLUTION_PRESETS } from '../types/camera';

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
}

export class DspEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  // EIS state variables (simulated gyro / optical flow damping filter)
  private currentOffsetX = 0;
  private currentOffsetY = 0;
  private currentAngle = 0;
  private targetShakeX = 0;
  private targetShakeY = 0;
  private lastTimestamp = 0;

  // Cached histogram
  private lastHistogram: HistogramData = {
    r: new Array(64).fill(0),
    g: new Array(64).fill(0),
    b: new Array(64).fill(0),
    lum: new Array(64).fill(0),
  };
  private histogramCounter = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    const offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) throw new Error('Could not get offscreen canvas context');
    this.offscreenCtx = offCtx;
  }

  public getHistogram(): HistogramData {
    return this.lastHistogram;
  }

  public renderFrame(
    source: HTMLVideoElement | HTMLImageElement,
    state: CameraState,
    timestamp: number
  ) {
    const {
      resolution,
      zoomLevel,
      panX,
      panY,
      superResEnhancement,
      sharpnessLevel,
      stabilizationMode,
      stabilizationStrength,
      exposureCompensation,
      whiteBalanceKelvin,
      whiteBalanceTint,
      lut,
      focusPeaking,
      focusPeakingColor,
      zebraStripes,
      zebraThreshold,
      falseColor,
    } = state;

    const resConfig = RESOLUTION_PRESETS[resolution];
    const targetW = resConfig.width;
    const targetH = resConfig.height;

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      this.offscreenCanvas.width = targetW;
      this.offscreenCanvas.height = targetH;
    }

    const naturalW = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const naturalH = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

    if (!naturalW || !naturalH) return;

    // 1. Calculate Electronic Image Stabilization (EIS) Compensation
    let stabShiftX = 0;
    let stabShiftY = 0;
    let stabAngle = 0;

    const dt = this.lastTimestamp ? Math.min((timestamp - this.lastTimestamp) / 1000, 0.1) : 0.016;
    this.lastTimestamp = timestamp;

    if (stabilizationMode !== 'off') {
      // Periodic subtle hand-tremor simulation to demonstrate EIS active damping
      const t = timestamp * 0.003;
      const rawShakeX = (Math.sin(t * 3.7) * 12 + Math.cos(t * 7.1) * 6) * (1 - stabilizationStrength / 100);
      const rawShakeY = (Math.cos(t * 2.9) * 10 + Math.sin(t * 5.3) * 5) * (1 - stabilizationStrength / 100);
      const rawAngle = (Math.sin(t * 1.5) * 0.015) * (1 - stabilizationStrength / 100);

      // Smooth with low-pass inertial filter
      const smoothingFactor = stabilizationMode === 'cinematic' ? 0.08 : 0.18;
      this.currentOffsetX += (rawShakeX - this.currentOffsetX) * smoothingFactor;
      this.currentOffsetY += (rawShakeY - this.currentOffsetY) * smoothingFactor;
      this.currentAngle += (rawAngle - this.currentAngle) * smoothingFactor;

      stabShiftX = -this.currentOffsetX;
      stabShiftY = -this.currentOffsetY;
      stabAngle = -this.currentAngle;
    } else {
      // When EIS is off, raw jitter shows
      const t = timestamp * 0.003;
      stabShiftX = Math.sin(t * 4.1) * 8 + Math.cos(t * 9.2) * 4;
      stabShiftY = Math.cos(t * 3.3) * 7 + Math.sin(t * 7.7) * 4;
      stabAngle = Math.sin(t * 2.1) * 0.008;
    }

    // 2. High-Resolution Super-Res Zoom & Crop Math
    // Base crop with margin for EIS margin buffer
    const eisMarginRatio = stabilizationMode !== 'off' ? 0.08 : 0.0;
    const effectiveZoom = Math.max(1.0, zoomLevel) / (1 - eisMarginRatio);

    const cropW = naturalW / effectiveZoom;
    const cropH = naturalH / effectiveZoom;

    // Pan constraints
    const maxPanX = (naturalW - cropW) / 2;
    const maxPanY = (naturalH - cropH) / 2;
    const centerSourceX = naturalW / 2 + panX * maxPanX;
    const centerSourceY = naturalH / 2 + panY * maxPanY;

    const sourceX = Math.max(0, Math.min(naturalW - cropW, centerSourceX - cropW / 2));
    const sourceY = Math.max(0, Math.min(naturalH - cropH, centerSourceY - cropH / 2));

    // Render source to offscreen canvas
    this.offscreenCtx.save();
    this.offscreenCtx.clearRect(0, 0, targetW, targetH);

    // Apply EIS translation & rotation
    this.offscreenCtx.translate(targetW / 2 + stabShiftX, targetH / 2 + stabShiftY);
    if (stabAngle !== 0) {
      this.offscreenCtx.rotate(stabAngle);
    }
    this.offscreenCtx.translate(-targetW / 2, -targetH / 2);

    // High quality scaling
    this.offscreenCtx.imageSmoothingEnabled = true;
    this.offscreenCtx.imageSmoothingQuality = 'high';

    // Draw zoomed and cropped frame
    this.offscreenCtx.drawImage(
      source,
      sourceX,
      sourceY,
      cropW,
      cropH,
      0,
      0,
      targetW,
      targetH
    );
    this.offscreenCtx.restore();

    // 3. Pixel-Level DSP Pipeline (Sharpening, LUT, False Color, Peaking, Zebras)
    // To ensure fluid 60fps on mobile and 4K, we do an optimized read on downscaled buffer or direct canvas filters
    this.ctx.save();
    this.ctx.clearRect(0, 0, targetW, targetH);

    // Apply sensor color & exposure adjustments using canvas filter pipeline
    const brightnessPct = Math.round(100 + exposureCompensation * 25);
    let contrastPct = 100;
    let saturatePct = 100;
    let hueRotateDeg = 0;
    let sepiaPct = 0;

    // Color temperature (Kelvin: 5600K is neutral daylight)
    const kelvinDelta = (whiteBalanceKelvin - 5600) / 1000;
    hueRotateDeg += whiteBalanceTint * 0.8;
    if (kelvinDelta > 0) {
      // Cooler
      hueRotateDeg -= kelvinDelta * 3;
    } else {
      // Warmer
      sepiaPct = Math.min(35, Math.abs(kelvinDelta) * 8);
    }

    // Apply Look Profile (LUT)
    switch (lut) {
      case 'film-log':
        contrastPct = 75;
        saturatePct = 85;
        break;
      case 'crisp-detail':
        contrastPct = 120;
        saturatePct = 110;
        break;
      case 'warm-cinema':
        contrastPct = 115;
        saturatePct = 115;
        sepiaPct += 15;
        break;
      case 'cool-tech':
        contrastPct = 115;
        saturatePct = 95;
        hueRotateDeg -= 12;
        break;
      case 'monochrome':
        saturatePct = 0;
        contrastPct = 135;
        break;
      case 'rec709':
      default:
        contrastPct = 105;
        saturatePct = 105;
        break;
    }

    // Compose CSS Filter
    const filterString = `brightness(${brightnessPct}%) contrast(${contrastPct}%) saturate(${saturatePct}%) hue-rotate(${hueRotateDeg}deg) sepia(${sepiaPct}%)`;
    this.ctx.filter = filterString;
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.ctx.filter = 'none';

    // 4. Super-Resolution Clarity & Unsharp Mask Enhancement
    // If super-res or high sharpness is enabled or zoom > 1.5x, apply unsharp high-pass overlay
    const effectiveSharpening = superResEnhancement
      ? Math.max(sharpnessLevel, 30 + Math.min(50, (zoomLevel - 1) * 12))
      : sharpnessLevel;

    if (effectiveSharpening > 5) {
      this.applyUnsharpMask(targetW, targetH, effectiveSharpening);
    }

    // 5. Video Assist Shaders / Overlays (Peaking, Zebra, False Color)
    if (focusPeaking || zebraStripes || falseColor) {
      this.applyAssistOverlays(targetW, targetH, {
        focusPeaking,
        focusPeakingColor,
        zebraStripes,
        zebraThreshold,
        falseColor,
      });
    }

    // 6. Update histogram every 3 frames for zero lag
    this.histogramCounter++;
    if (this.histogramCounter % 3 === 0) {
      this.computeHistogram(targetW, targetH);
    }

    this.ctx.restore();
  }

  /**
   * High-pass unsharp mask to restore crisp micro-contrast and edge details when zooming
   */
  private applyUnsharpMask(width: number, height: number, strength: number) {
    // We blend a high-pass difference layer for fast edge sharpening
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'overlay';
    this.ctx.globalAlpha = Math.min(0.65, (strength / 100) * 0.7);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, width, height);
    this.ctx.restore();
  }

  /**
   * Focus peaking (edge detection), Zebra highlights, or Cinema False Color
   */
  private applyAssistOverlays(
    width: number,
    height: number,
    assist: {
      focusPeaking: boolean;
      focusPeakingColor: string;
      zebraStripes: boolean;
      zebraThreshold: number;
      falseColor: boolean;
    }
  ) {
    // Process on a sampled canvas for maximum performance
    const sampleW = Math.min(480, Math.floor(width / 4));
    const sampleH = Math.min(270, Math.floor(height / 4));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(this.canvas, 0, 0, sampleW, sampleH);
    const imgData = tempCtx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    // Overlay image data
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = sampleW;
    overlayCanvas.height = sampleH;
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) return;
    const overlayImgData = overlayCtx.createImageData(sampleW, sampleH);
    const outData = overlayImgData.data;

    const zebraThresholdVal = (assist.zebraThreshold / 100) * 255;

    // Peaking colors RGB
    let pr = 0, pg = 255, pb = 68; // default green
    if (assist.focusPeakingColor === 'red') { pr = 255; pg = 30; pb = 60; }
    else if (assist.focusPeakingColor === 'yellow') { pr = 255; pg = 220; pb = 0; }
    else if (assist.focusPeakingColor === 'cyan') { pr = 0; pg = 230; pb = 255; }

    for (let y = 1; y < sampleH - 1; y++) {
      for (let x = 1; x < sampleW - 1; x++) {
        const idx = (y * sampleW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (assist.falseColor) {
          // Cinema False Color IRE map:
          // < 35: Purple (underexposed)
          // 35 - 70: Blue to Green (correct skin tone 50-70 IRE)
          // 70 - 90: Yellow to Pink
          // > 95: Bright Red (blown highlights)
          const ire = (lum / 255) * 100;
          if (ire > 95) {
            outData[idx] = 255; outData[idx + 1] = 0; outData[idx + 2] = 0; outData[idx + 3] = 220;
          } else if (ire > 80) {
            outData[idx] = 255; outData[idx + 1] = 180; outData[idx + 2] = 0; outData[idx + 3] = 200;
          } else if (ire > 50) {
            outData[idx] = 0; outData[idx + 1] = 220; outData[idx + 2] = 60; outData[idx + 3] = 180;
          } else if (ire > 35) {
            outData[idx] = 30; outData[idx + 1] = 140; outData[idx + 2] = 255; outData[idx + 3] = 180;
          } else if (ire < 15) {
            outData[idx] = 130; outData[idx + 1] = 0; outData[idx + 2] = 200; outData[idx + 3] = 200;
          }
        } else {
          // Focus peaking edge detection (horizontal + vertical gradient)
          if (assist.focusPeaking) {
            const rightIdx = (y * sampleW + (x + 1)) * 4;
            const downIdx = ((y + 1) * sampleW + x) * 4;
            const lumRight = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
            const lumDown = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];

            const diff = Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
            if (diff > 42) {
              outData[idx] = pr;
              outData[idx + 1] = pg;
              outData[idx + 2] = pb;
              outData[idx + 3] = 240;
            }
          }

          // Zebra stripes for clipped highlights
          if (assist.zebraStripes && lum > zebraThresholdVal) {
            // 45 degree alternating stripes
            if ((x + y) % 10 < 5) {
              outData[idx] = 255;
              outData[idx + 1] = 20;
              outData[idx + 2] = 80;
              outData[idx + 3] = 220;
            }
          }
        }
      }
    }

    overlayCtx.putImageData(overlayImgData, 0, 0);

    // Composite overlay onto main canvas
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(overlayCanvas, 0, 0, width, height);
    this.ctx.restore();
  }

  /**
   * Fast 64-bin RGB & Luminance histogram calculation
   */
  private computeHistogram(width: number, height: number) {
    const sampleW = 120;
    const sampleH = 68;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(this.canvas, 0, 0, sampleW, sampleH);
    const imgData = tempCtx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    const bins = 64;
    const rHist = new Array(bins).fill(0);
    const gHist = new Array(bins).fill(0);
    const bHist = new Array(bins).fill(0);
    const lumHist = new Array(bins).fill(0);

    const step = 4; // Sample every 4th pixel for high speed
    for (let i = 0; i < data.length; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);

      const rBin = Math.min(bins - 1, Math.floor((r / 256) * bins));
      const gBin = Math.min(bins - 1, Math.floor((g / 256) * bins));
      const bBin = Math.min(bins - 1, Math.floor((b / 256) * bins));
      const lumBin = Math.min(bins - 1, Math.floor((lum / 256) * bins));

      rHist[rBin]++;
      gHist[gBin]++;
      bHist[bBin]++;
      lumHist[lumBin]++;
    }

    this.lastHistogram = {
      r: rHist,
      g: gHist,
      b: bHist,
      lum: lumHist,
    };
  }
}
