import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraState, RESOLUTION_PRESETS } from '../types/camera';
import { DspEngine } from '../utils/dspPipeline';
import { 
  Camera, 
  Video, 
  Disc, 
  Volume2, 
  VolumeX, 
  Activity, 
  Maximize2, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  SlidersHorizontal,
  Compass,
  Tv
} from 'lucide-react';

interface ViewfinderProps {
  state: CameraState;
  setState: React.Dispatch<React.SetStateAction<CameraState>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cineImgObjRef: React.RefObject<HTMLImageElement>;
  macroImgObjRef: React.RefObject<HTMLImageElement>;
  isLiveCameraActive: boolean;
  cameraError: string | null;
  isRecording: boolean;
  recordingDuration: number;
  vuLevelL: number;
  vuLevelR: number;
  vuPeak: number;
  isClipping: boolean;
  onCaptureSnapshot: (canvas: HTMLCanvasElement) => void;
  onToggleRecording: (canvas: HTMLCanvasElement) => void;
  onOpenTetherModal: () => void;
  onOpenHardwareGuide: () => void;
}

export const Viewfinder: React.FC<ViewfinderProps> = ({
  state,
  setState,
  videoRef,
  cineImgObjRef,
  macroImgObjRef,
  isLiveCameraActive,
  cameraError,
  isRecording,
  recordingDuration,
  vuLevelL,
  vuLevelR,
  vuPeak,
  isClipping,
  onCaptureSnapshot,
  onToggleRecording,
  onOpenTetherModal,
  onOpenHardwareGuide,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dspEngineRef = useRef<DspEngine | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Drag-to-pan state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number }>({
    x: 0,
    y: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize DSP engine
  useEffect(() => {
    if (canvasRef.current) {
      dspEngineRef.current = new DspEngine(canvasRef.current);
    }
  }, []);

  // Main rendering loop
  const renderLoop = useCallback(
    (timestamp: number) => {
      if (dspEngineRef.current && canvasRef.current) {
        let activeSource: HTMLVideoElement | HTMLImageElement | null = null;

        if (state.sourceMode === 'device' && videoRef.current && isLiveCameraActive) {
          activeSource = videoRef.current;
        } else if (state.sourceMode === 'simulated-city' && cineImgObjRef.current.complete) {
          activeSource = cineImgObjRef.current;
        } else if (state.sourceMode === 'simulated-macro' && macroImgObjRef.current.complete) {
          activeSource = macroImgObjRef.current;
        } else if (cineImgObjRef.current.complete) {
          activeSource = cineImgObjRef.current;
        }

        if (activeSource) {
          dspEngineRef.current.renderFrame(activeSource, state, timestamp);
        }
      }
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    },
    [state, isLiveCameraActive, videoRef, cineImgObjRef, macroImgObjRef]
  );

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [renderLoop]);

  // Touch and Mouse Drag-to-Pan handlers for high-magnification navigation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (state.zoomLevel <= 1.05) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: state.panX,
      initialPanY: state.panY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || state.zoomLevel <= 1.05) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const sensitivity = 0.003 / state.zoomLevel;
    const newPanX = Math.max(-1, Math.min(1, dragStartRef.current.initialPanX - dx * sensitivity));
    const newPanY = Math.max(-1, Math.min(1, dragStartRef.current.initialPanY - dy * sensitivity));

    setState((prev) => ({
      ...prev,
      panX: newPanX,
      panY: newPanY,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setState((prev) => ({
      ...prev,
      zoomLevel: Math.max(1.0, Math.min(10.0, Number((prev.zoomLevel + delta).toFixed(1)))),
    }));
  };

  // Format recording timer: HH:MM:SS
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const currentRes = RESOLUTION_PRESETS[state.resolution];

  // Helper for VU bar height/width percentage (-60 to 0 dBFS)
  const dbToPercent = (db: number) => {
    const clamped = Math.max(-60, Math.min(0, db));
    return ((clamped + 60) / 60) * 100;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none group touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Hidden Hardware Camera Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Main Processed 4K Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain cursor-crosshair transition-transform duration-75"
        style={{
          filter: state.sharpnessLevel > 0 && !state.superResEnhancement ? `contrast(${100 + state.sharpnessLevel * 0.15}%)` : undefined
        }}
      />

      {/* Grid Guide Overlay */}
      {state.gridGuide && (
        <div className="absolute inset-0 pointer-events-none rule-of-thirds" />
      )}

      {/* Center Reticle Crosshair */}
      {state.centerMark && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 relative">
            <div className="absolute top-1/2 left-0 w-8 h-[1px] -translate-y-1/2 bg-amber-400/80 shadow-sm" />
            <div className="absolute left-1/2 top-0 w-[1px] h-8 -translate-x-1/2 bg-amber-400/80 shadow-sm" />
            <div className="absolute inset-1.5 border border-amber-400/60 rounded-full" />
          </div>
        </div>
      )}

      {/* Aspect Ratio Framing Masks */}
      {state.aspectRatioGuide === '2.39:1' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
          <div className="w-full h-[12.5%] bg-black/75 border-b border-amber-400/40" />
          <div className="w-full h-[12.5%] bg-black/75 border-t border-amber-400/40" />
        </div>
      )}
      {state.aspectRatioGuide === '9:16' && (
        <div className="absolute inset-0 pointer-events-none flex justify-between">
          <div className="h-full w-[35.5%] bg-black/80 border-r border-amber-400/40" />
          <div className="h-full w-[35.5%] bg-black/80 border-l border-amber-400/40" />
        </div>
      )}
      {state.aspectRatioGuide === '4:3' && (
        <div className="absolute inset-0 pointer-events-none flex justify-between">
          <div className="h-full w-[12.5%] bg-black/75 border-r border-amber-400/40" />
          <div className="h-full w-[12.5%] bg-black/75 border-l border-amber-400/40" />
        </div>
      )}

      {/* Top Professional HUD Bar */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between pointer-events-none text-xs font-mono">
        {/* Left: Recording & Timecode & Resolution */}
        <div className="flex items-center gap-3">
          {/* Recording Badge */}
          {isRecording ? (
            <div className="flex items-center gap-2 bg-red-600/90 text-white font-bold px-2.5 py-1 rounded shadow-lg animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span>REC</span>
              <span className="tabular-nums font-semibold tracking-wider">{formatTimer(recordingDuration)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 border border-slate-700/60 px-2 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold tracking-wide">STBY</span>
            </div>
          )}

          {/* Resolution & FPS */}
          <div className="flex items-center gap-2 text-slate-200">
            <span className="font-bold text-amber-400 tracking-wider bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
              {currentRes.badge}
            </span>
            <span className="font-semibold text-slate-300">
              {state.fps}P
            </span>
            <span className="hidden md:inline text-slate-400 font-normal">
              PRORES HQ / H.265
            </span>
          </div>
        </div>

        {/* Center: Exposure & Optics Telemetry */}
        <div className="hidden sm:flex items-center gap-3 text-slate-300 bg-black/60 border border-slate-800/80 px-3 py-1 rounded-md backdrop-blur-md">
          <div>
            <span className="text-slate-500 text-[10px] mr-1">SHUTTER</span>
            <span className="text-amber-300 font-semibold">1/{state.fps * 2}s · {state.shutterAngle.toFixed(0)}°</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-slate-500 text-[10px] mr-1">ISO</span>
            <span className="text-emerald-400 font-semibold">{state.iso}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-slate-500 text-[10px] mr-1">WB</span>
            <span className="text-sky-300 font-semibold">{state.whiteBalanceKelvin}K</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-slate-500 text-[10px] mr-1">LUT</span>
            <span className="text-amber-200 font-semibold uppercase">{state.lut}</span>
          </div>
        </div>

        {/* Right: Tether Status & Fullscreen toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Cable Tether Pill */}
          <button
            onClick={onOpenTetherModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors border ${
              state.tetherActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-800'
            }`}
            title="USB Cable Live Streaming & PC Monitor Setup"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">USB CABLE TETHER</span>
            <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400">4K UVC</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded transition-colors"
            title="Toggle Viewfinder Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Left: Audio VU Meter (dBFS scale) */}
      <div className="absolute left-3 bottom-14 sm:bottom-16 bg-black/80 border border-slate-800/90 rounded-lg p-2 backdrop-blur-md flex flex-col gap-1.5 pointer-events-none shadow-xl z-10 w-24 sm:w-28 font-mono">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            {state.audioEnabled ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-rose-500" />}
            <span className="font-semibold text-slate-300">AUDIO</span>
          </div>
          <span className={`text-[9px] font-bold ${isClipping ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
            {isClipping ? 'CLIP' : `${vuPeak.toFixed(0)}dB`}
          </span>
        </div>

        {/* Channel L */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[8px] text-slate-500">
            <span>L</span>
            <span className="tabular-nums">{vuLevelL.toFixed(0)}</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-sm overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 ${
                vuLevelL > -6 ? 'bg-red-500' : vuLevelL > -18 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${dbToPercent(vuLevelL)}%` }}
            />
          </div>
        </div>

        {/* Channel R */}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[8px] text-slate-500">
            <span>R</span>
            <span className="tabular-nums">{vuLevelR.toFixed(0)}</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-sm overflow-hidden flex">
            <div
              className={`h-full transition-all duration-75 ${
                vuLevelR > -6 ? 'bg-red-500' : vuLevelR > -18 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${dbToPercent(vuLevelR)}%` }}
            />
          </div>
        </div>

        {state.windNoiseFilter && (
          <div className="text-[9px] text-sky-400 border-t border-slate-800/80 pt-0.5 text-center">
            WIND CUT 80Hz
          </div>
        )}
      </div>

      {/* Floating Center-Right: Super-Res Zoom & EIS HUD Status */}
      <div className="absolute right-3 top-14 sm:top-16 flex flex-col items-end gap-2 pointer-events-none font-mono text-[11px]">
        {/* Zoom Level Indicator */}
        <div className="bg-black/75 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-md backdrop-blur-md shadow-lg flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          <span className="font-bold tabular-nums">{state.zoomLevel.toFixed(1)}×</span>
          {state.superResEnhancement && (
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded uppercase tracking-wider font-semibold">
              SUPER-RES
            </span>
          )}
        </div>

        {/* Stabilization Status */}
        <div className="bg-black/75 border border-slate-700/60 text-slate-300 px-2.5 py-1 rounded-md backdrop-blur-md shadow-lg flex items-center gap-1.5">
          <ShieldCheck className={`w-3.5 h-3.5 ${state.stabilizationMode !== 'off' ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="uppercase text-[10px] font-semibold">
            {state.stabilizationMode === 'off' ? 'EIS OFF' : `${state.stabilizationMode.toUpperCase()} EIS`}
          </span>
          {state.stabilizationMode !== 'off' && (
            <span className="text-emerald-400 font-bold tabular-nums text-[10px]">
              {state.stabilizationStrength}%
            </span>
          )}
        </div>

        {/* Focus Peaking / Zebras active badges */}
        {state.focusPeaking && (
          <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase">
            PEAKING {state.focusPeakingColor}
          </div>
        )}
        {state.zebraStripes && (
          <div className="bg-rose-950/80 border border-rose-500/60 text-rose-300 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase">
            ZEBRA {state.zebraThreshold}%
          </div>
        )}
        {state.falseColor && (
          <div className="bg-purple-950/80 border border-purple-500/60 text-purple-300 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase">
            FALSE COLOR IRE
          </div>
        )}
      </div>

      {/* Floating Drag-Pan Hint when zoomed in */}
      {state.zoomLevel > 1.2 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md text-white/70 text-xs pointer-events-none flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Drag to pan 4K frame</span>
        </div>
      )}

      {/* Bottom Floating Quick Actions Bar (Photo, Video Record, Source Switch) */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 flex items-center justify-between pointer-events-auto">
        {/* Source Switcher Pills */}
        <div className="flex items-center gap-1 p-1 bg-black/85 border border-slate-800 rounded-xl backdrop-blur-md shadow-2xl">
          <button
            onClick={() => setState((p) => ({ ...p, sourceMode: 'device' }))}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              state.sourceMode === 'device'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Use device camera or Raspberry Pi USB capture card"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hardware/Webcam</span>
            <span className="sm:hidden">Live</span>
          </button>

          <button
            onClick={() => setState((p) => ({ ...p, sourceMode: 'simulated-city' }))}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              state.sourceMode === 'simulated-city'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="4K Ultra-Sharp Golden Hour Cityscape Feed"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4K City Skyline</span>
            <span className="sm:hidden">4K City</span>
          </button>

          <button
            onClick={() => setState((p) => ({ ...p, sourceMode: 'simulated-macro' }))}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              state.sourceMode === 'simulated-macro'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="4K Macro Tourbillon Precision Movement Feed"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4K Macro Movement</span>
            <span className="sm:hidden">4K Macro</span>
          </button>
        </div>

        {/* Center Primary Capture Buttons: Shutter Still & Video REC */}
        <div className="flex items-center gap-3">
          {/* Still Photo Snapshot Button */}
          <button
            onClick={() => {
              if (canvasRef.current) onCaptureSnapshot(canvasRef.current);
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900 border-2 border-slate-300 hover:border-white text-white flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-slate-800"
            title="Capture 4K Full Resolution Still (JPEG/PNG)"
          >
            <div className="w-7 h-7 rounded-full bg-white transition-transform active:scale-90" />
          </button>

          {/* Video Record Shutter Button */}
          <button
            onClick={() => {
              if (canvasRef.current) onToggleRecording(canvasRef.current);
            }}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-xl active:scale-95 transition-all ${
              isRecording
                ? 'bg-red-950 border-red-500 shadow-red-900/50'
                : 'bg-slate-900 border-red-600 hover:border-red-500'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start 4K Video Recording with Audio'}
          >
            <div
              className={`transition-all duration-150 ${
                isRecording
                  ? 'w-4 h-4 bg-red-500 rounded-sm'
                  : 'w-6 h-6 bg-red-600 rounded-full hover:bg-red-500'
              }`}
            />
          </button>
        </div>

        {/* Right: Hardware Blueprint Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHardwareGuide}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition-colors shadow-lg"
            title="Raspberry Pi 4/5 hardware assembly & python daemon script"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Pi 4K Daemon & Wiring</span>
          </button>
        </div>
      </div>
    </div>
  );
};
