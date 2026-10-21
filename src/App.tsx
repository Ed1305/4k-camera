import React, { useState } from 'react';
import { CameraState } from './types/camera';
import { useCameraStream } from './hooks/useCameraStream';
import { Viewfinder } from './components/Viewfinder';
import { CameraControls } from './components/CameraControls';
import { CableTetherModal } from './components/CableTetherModal';
import { PiHardwareGuideModal } from './components/PiHardwareGuideModal';
import { RecordingsGalleryModal } from './components/RecordingsGalleryModal';
import { 
  Tv, 
  Film, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Volume2, 
  Info,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

const initialCameraState: CameraState = {
  sourceMode: 'simulated-city',
  availableDevices: [],
  selectedDeviceId: '',
  resolution: '4k-uhd',
  fps: 60,
  zoomLevel: 1.0,
  panX: 0,
  panY: 0,
  superResEnhancement: true,
  sharpnessLevel: 45,
  stabilizationMode: 'cinematic',
  stabilizationStrength: 85,
  horizonLeveling: true,
  iso: 400,
  shutterAngle: 180,
  exposureCompensation: 0.0,
  whiteBalanceKelvin: 5600,
  whiteBalanceTint: 0,
  lut: 'rec709',
  focusPeaking: false,
  focusPeakingColor: 'green',
  zebraStripes: false,
  zebraThreshold: 90,
  falseColor: false,
  gridGuide: false,
  aspectRatioGuide: 'none',
  centerMark: true,
  histogram: false,
  audioEnabled: true,
  audioGain: 1.2,
  windNoiseFilter: true,
  audioInputDevice: '',
  tetherActive: true,
  tetherMode: 'uvc-gadget',
  pcStreamFps: 60,
  pcStreamBitrateMbps: 32.5,
};

export default function App() {
  const {
    state,
    setState,
    videoRef,
    cineImgObjRef,
    macroImgObjRef,
    isLiveCameraActive,
    cameraError,
    isRecording,
    recordingDuration,
    capturedMediaList,
    setCapturedMediaList,
    vuLevelL,
    vuLevelR,
    vuPeak,
    isClipping,
    captureSnapshot,
    startRecording,
    stopRecording,
  } = useCameraStream(initialCameraState);

  // Modals state
  const [isTetherModalOpen, setIsTetherModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  const handleToggleRecording = (canvas: HTMLCanvasElement) => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(canvas);
    }
  };

  const handleDeleteMedia = (id: string) => {
    setCapturedMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar Contract: 3 zones (Brand wordmark — Nav links — Primary action) */}
      <header className="flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-[#0d0f17]/95 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            PiCam 4K Studio
          </span>
          <span className="hidden lg:inline text-xs text-slate-500 font-mono">
            Raspberry Pi 5 · 4K UHD 60P · EIS
          </span>
        </div>

        {/* Zone 2: Single-line Text Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Live Monitor
          </button>
          <button
            onClick={() => setIsTetherModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cable Tether to PC</span>
          </button>
          <button
            onClick={() => setIsHardwareModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Raspberry Pi Hardware</span>
          </button>
          <button
            onClick={() => setIsGalleryModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5 text-sky-400" />
            <span>Media Vault ({capturedMediaList.length})</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsTetherModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Cable Stream to PC</span>
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Subtle Sub-header Metadata Bar (No pill boxes!) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pb-1">
          <div className="flex items-center gap-2 font-mono">
            <span>Raspberry Pi 5 / 4B</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Sony IMX477 4K Sensor</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400 font-semibold">Active Gyro EIS</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-amber-400 font-semibold">10× Super-Res Clarity</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span>USB 3.0 UVC Gadget</span>
            <span aria-hidden="true">·</span>
            <span>48kHz Stereo I2S Audio</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">iOS & Android Ready</span>
          </div>
        </div>

        {/* Camera Permission Alert Banner (if physical device access was requested and denied) */}
        {cameraError && state.sourceMode === 'device' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{cameraError}</span>
            </div>
            <button
              onClick={() => setState((p) => ({ ...p, sourceMode: 'simulated-city' }))}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded text-xs whitespace-nowrap"
            >
              Use 4K Test Sensor
            </button>
          </div>
        )}

        {/* 4K Viewfinder & Live Monitor Canvas */}
        <Viewfinder
          state={state}
          setState={setState}
          videoRef={videoRef}
          cineImgObjRef={cineImgObjRef}
          macroImgObjRef={macroImgObjRef}
          isLiveCameraActive={isLiveCameraActive}
          cameraError={cameraError}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          vuLevelL={vuLevelL}
          vuLevelR={vuLevelR}
          vuPeak={vuPeak}
          isClipping={isClipping}
          onCaptureSnapshot={captureSnapshot}
          onToggleRecording={handleToggleRecording}
          onOpenTetherModal={() => setIsTetherModalOpen(true)}
          onOpenHardwareGuide={() => setIsHardwareModalOpen(true)}
        />

        {/* Real-time DSP Camera Controls */}
        <CameraControls
          state={state}
          setState={setState}
          onOpenTetherModal={() => setIsTetherModalOpen(true)}
          onOpenHardwareGuide={() => setIsHardwareModalOpen(true)}
        />

        {/* Architecture & Capabilities Bento Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Card 1: 4K Super-Res Zoom */}
          <div className="p-5 bg-[#0d0f17] border border-slate-800/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Super-Resolution Clarity Zoom</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Achieve up to 10× digital magnification without the blurry softness of typical digital zooms. Our adaptive unsharp masking and bicubic sub-pixel interpolation preserve sharp architectural edges, watch gear micro-teeth, and fine typography.
            </p>
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <span>Kernel: Adaptive Laplacian High-Pass</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400">Up to 10×</span>
            </div>
          </div>

          {/* Card 2: Sharpened Gyro EIS */}
          <div className="p-5 bg-[#0d0f17] border border-slate-800/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Electronic Image Stabilization</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hardware-synchronized gyro motion estimation cancels high-frequency handheld tremor and walking bounce. Damped with an inertial Kalman filter and auto-crop buffer, giving professional cinematic dolly smoothness without a motorized gimbal.
            </p>
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <span>Sensor: MPU-6050 / BNO085</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">Sub-4ms Latency</span>
            </div>
          </div>

          {/* Card 3: Plugged-in Cable Tether */}
          <div className="p-5 bg-[#0d0f17] border border-slate-800/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400">
              <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                <Tv className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Plugged-in Cable Streaming</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your Raspberry Pi directly to your PC or Mac via USB-C OTG. The Linux UVC kernel gadget transmits real-time 4K 60FPS video and 48kHz stereo sound directly into OBS Studio, Zoom, Premiere, and Discord with zero driver installation.
            </p>
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <span>Protocol: USB 3.0 UVC + UAC</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-400">Zero-Driver Host</span>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0b0d14] px-4 sm:px-8 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">PiCam 4K Cinema Studio</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Image Processing for Raspberry Pi 5 & 4B</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <button
              onClick={() => setIsHardwareModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Hardware Daemon & Wiring
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsTetherModalOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              USB Cable Tether Guide
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsGalleryModalOpen(true)}
              className="hover:text-sky-400 transition-colors"
            >
              Media Vault
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CableTetherModal
        isOpen={isTetherModalOpen}
        onClose={() => setIsTetherModalOpen(false)}
        state={state}
        setState={setState}
      />

      <PiHardwareGuideModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

      <RecordingsGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        mediaList={capturedMediaList}
        onDeleteMedia={handleDeleteMedia}
      />
    </div>
  );
}
