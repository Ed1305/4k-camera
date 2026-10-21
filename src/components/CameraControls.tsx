import React, { useState } from 'react';
import { CameraState, RESOLUTION_PRESETS, ResolutionPreset, StabilizationMode, LutPreset, AspectRatioGuide } from '../types/camera';
import { 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Volume2, 
  Eye, 
  RotateCcw, 
  Cpu, 
  Sparkles, 
  SlidersHorizontal,
  Compass,
  Tv,
  CheckCircle2,
  Mic,
  Wind
} from 'lucide-react';

interface CameraControlsProps {
  state: CameraState;
  setState: React.Dispatch<React.SetStateAction<CameraState>>;
  onOpenTetherModal: () => void;
  onOpenHardwareGuide: () => void;
}

type ControlTab = 'zoom-optics' | 'stabilization' | 'audio' | 'assist-color' | 'tether-pi';

export const CameraControls: React.FC<CameraControlsProps> = ({
  state,
  setState,
  onOpenTetherModal,
  onOpenHardwareGuide,
}) => {
  const [activeTab, setActiveTab] = useState<ControlTab>('zoom-optics');

  const updateState = <K extends keyof CameraState>(key: K, value: CameraState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const resetPanAndZoom = () => {
    setState((prev) => ({
      ...prev,
      zoomLevel: 1.0,
      panX: 0,
      panY: 0,
    }));
  };

  return (
    <div className="w-full bg-[#0d0f17] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      {/* Tab Navigation Header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('zoom-optics')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'zoom-optics'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Super-Res Zoom & Optics</span>
        </button>

        <button
          onClick={() => setActiveTab('stabilization')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'stabilization'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sharpened EIS Stabilization</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'audio'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Audio Capture & VU Preamp</span>
        </button>

        <button
          onClick={() => setActiveTab('assist-color')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'assist-color'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Cinema Assist & LUTs</span>
        </button>

        <button
          onClick={() => setActiveTab('tether-pi')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'tether-pi'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Cable Tether & Pi Setup</span>
        </button>
      </div>

      {/* Tab 1: Super-Resolution Zoom & Optics */}
      {activeTab === 'zoom-optics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zoom Control Group */}
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-slate-200">Super-Resolution Clarity Zoom</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono font-bold text-sm tabular-nums">
                  {state.zoomLevel.toFixed(1)}×
                </span>
                <button
                  onClick={resetPanAndZoom}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Reset Zoom & Pan to 1.0x"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Range slider */}
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.1"
              value={state.zoomLevel}
              onChange={(e) => updateState('zoomLevel', parseFloat(e.target.value))}
              className="w-full cinema-slider"
            />

            {/* Quick jump presets */}
            <div className="flex items-center justify-between gap-2">
              {[1.0, 1.5, 2.0, 3.0, 5.0, 8.0, 10.0].map((zoom) => (
                <button
                  key={zoom}
                  onClick={() => updateState('zoomLevel', zoom)}
                  className={`flex-1 py-1 text-xs font-mono rounded font-medium transition-colors ${
                    Math.abs(state.zoomLevel - zoom) < 0.05
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {zoom}×
                </button>
              ))}
            </div>

            {/* Super-Resolution clarity toggle & Sharpening amount */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Adaptive Super-Res Unsharp Masking</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Restores edge micro-contrast and suppresses digital blur when magnified
                  </p>
                </div>
                <button
                  onClick={() => updateState('superResEnhancement', !state.superResEnhancement)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    state.superResEnhancement ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      state.superResEnhancement ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sharpening Strength */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Edge Acutance / Sharpening</span>
                  <span className="font-mono text-amber-300 tabular-nums">{state.sharpnessLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={state.sharpnessLevel}
                  onChange={(e) => updateState('sharpnessLevel', parseInt(e.target.value, 10))}
                  className="w-full cinema-slider"
                />
              </div>
            </div>
          </div>

          {/* Sensor & Exposure Controls */}
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Camera Resolution & Exposure Pipeline</span>
            </h4>

            {/* Resolution selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Recording & Stream Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                {(['4k-uhd', '4k-dci', '1080p', '720p'] as ResolutionPreset[]).map((resKey) => {
                  const cfg = RESOLUTION_PRESETS[resKey];
                  const isSel = state.resolution === resKey;
                  return (
                    <button
                      key={resKey}
                      onClick={() => updateState('resolution', resKey)}
                      className={`p-2 rounded-lg text-left transition-all border ${
                        isSel
                          ? 'bg-amber-500/15 border-amber-500/60 text-white'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold">{cfg.label}</div>
                      <div className="text-[10px] font-mono text-slate-400">{cfg.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame rate (FPS) */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Sensor Frame Rate</label>
              <div className="flex items-center gap-2">
                {[
                  { fps: 24, label: '24 FPS (Cinema Standard)' },
                  { fps: 30, label: '30 FPS (Broadcast)' },
                  { fps: 60, label: '60 FPS (Ultra Fluid)' },
                ].map((item) => (
                  <button
                    key={item.fps}
                    onClick={() => updateState('fps', item.fps as 24 | 30 | 60)}
                    className={`flex-1 py-1.5 px-2 text-xs rounded-lg font-medium transition-colors ${
                      state.fps === item.fps
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.fps} fps
                  </button>
                ))}
              </div>
            </div>

            {/* Exposure Compensation EV */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Exposure Compensation (EV)</span>
                <span className="font-mono text-amber-300 tabular-nums">
                  {state.exposureCompensation > 0 ? `+${state.exposureCompensation.toFixed(1)}` : state.exposureCompensation.toFixed(1)} EV
                </span>
              </div>
              <input
                type="range"
                min="-3.0"
                max="3.0"
                step="0.2"
                value={state.exposureCompensation}
                onChange={(e) => updateState('exposureCompensation', parseFloat(e.target.value))}
                className="w-full cinema-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Electronic Image Stabilization (EIS) */}
      {activeTab === 'stabilization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-slate-200">Electronic Image Stabilization (EIS)</h4>
              </div>
              <span className="text-emerald-400 font-mono text-xs font-bold uppercase">
                {state.stabilizationMode}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-axis gyro damping and inertial motion tracking algorithm for Raspberry Pi hardware.
              Eliminates handheld jitter and high-frequency vibrations while preserving deliberate camera pans.
            </p>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'off', label: 'Off', desc: 'Raw handheld motion' },
                { id: 'standard', label: 'Standard EIS', desc: 'Walking & handheld' },
                { id: 'cinematic', label: 'Ultra Cinematic', desc: 'Smooth dolly glide' },
                { id: 'horizon-lock', label: 'Horizon Level', desc: 'Roll angle lock' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => updateState('stabilizationMode', mode.id as StabilizationMode)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    state.stabilizationMode === mode.id
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{mode.label}</span>
                    {state.stabilizationMode === mode.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</div>
                </button>
              ))}
            </div>

            {/* Strength slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Damping / Smoothing Strength</span>
                <span className="font-mono text-emerald-400 font-semibold tabular-nums">{state.stabilizationStrength}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={state.stabilizationStrength}
                disabled={state.stabilizationMode === 'off'}
                onChange={(e) => updateState('stabilizationStrength', parseInt(e.target.value, 10))}
                className="w-full cinema-slider disabled:opacity-40"
              />
            </div>
          </div>

          {/* Stabilization Architecture Specs */}
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Raspberry Pi Hardware EIS Pipeline</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">IMU Gyro Sensor Support</span>
                <span className="font-mono text-slate-200">MPU-6050 / BNO085 I2C</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Motion Estimation Kernel</span>
                <span className="font-mono text-slate-200">Kalman Filter + Optical Flow</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Auto-Crop Buffer Margin</span>
                <span className="font-mono text-slate-200">8.0% Dynamic Border</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Video Latency Overhead</span>
                <span className="font-mono text-emerald-400">{'< 4.2 ms (Zero Lag)'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Platform Compatibility</span>
                <span className="font-mono text-slate-200">iOS, Android, macOS, Linux, PC</span>
              </div>
            </div>

            <div className="mt-3 p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold">Pro Tip: </span>
              In high-zoom mode (4x–10x), pair Cinematic EIS with Super-Resolution sharpening to get ultra-stable tripod-like telephoto shots without heavy motorized gimbals.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audio Capture & VU Preamp */}
      {activeTab === 'audio' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-slate-200">Stereo Audio Preamp & Capture</h4>
              </div>
              <button
                onClick={() => updateState('audioEnabled', !state.audioEnabled)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  state.audioEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {state.audioEnabled ? 'MIC ACTIVE' : 'MUTED'}
              </button>
            </div>

            {/* Digital Gain Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Microphone Gain (Preamp Boost)</span>
                <span className="font-mono text-amber-300 tabular-nums font-semibold">
                  {((state.audioGain - 1.0) * 12).toFixed(1)} dB ({state.audioGain.toFixed(1)}×)
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.1"
                value={state.audioGain}
                disabled={!state.audioEnabled}
                onChange={(e) => updateState('audioGain', parseFloat(e.target.value))}
                className="w-full cinema-slider disabled:opacity-40"
              />
            </div>

            {/* High-Pass Wind Noise Filter (80Hz) */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span>80Hz High-Pass Wind Filter</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cuts low-frequency wind rumble, HVAC hum, and handling noise
                </p>
              </div>
              <button
                onClick={() => updateState('windNoiseFilter', !state.windNoiseFilter)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  state.windNoiseFilter ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    state.windNoiseFilter ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Audio Hardware & Standards */}
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-400" />
              <span>Raspberry Pi Audio Hardware Specs</span>
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Sampling Rate</span>
                <span className="font-mono text-slate-200">48.0 kHz / 24-bit Broadcast PCM</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Microphone Interface</span>
                <span className="font-mono text-slate-200">I2S Digital (INMP441 / SPH0645) or USB UAC</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">USB Audio Class (UAC)</span>
                <span className="font-mono text-emerald-400">Plug & Play to PC / Mac over Cable</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">A/V Sync Offset</span>
                <span className="font-mono text-slate-200">0 ms Hardware Timestamp Locked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Cinema Assist & LUTs */}
      {activeTab === 'assist-color' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assist Tools (Peaking, Zebra, False Color) */}
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Broadcast Video Assist Tools</span>
            </h4>

            {/* Focus Peaking */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-slate-200">Focus Peaking Highlight</div>
                <div className="text-[11px] text-slate-400">Highlights high-frequency sharp contrast edges</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                  {(['green', 'red', 'yellow', 'cyan'] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => updateState('focusPeakingColor', color)}
                      className={`w-4 h-4 rounded-full border ${
                        state.focusPeakingColor === color ? 'border-white scale-110 shadow' : 'border-transparent opacity-60'
                      }`}
                      style={{
                        backgroundColor:
                          color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : color === 'yellow' ? '#f59e0b' : '#06b6d4',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => updateState('focusPeaking', !state.focusPeaking)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    state.focusPeaking ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      state.focusPeaking ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Zebra Stripes */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-slate-200">Zebra Highlight Warning</div>
                <div className="text-[11px] text-slate-400">Diagonal stripes over clipped highlights ({state.zebraThreshold}%)</div>
              </div>
              <button
                onClick={() => updateState('zebraStripes', !state.zebraStripes)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  state.zebraStripes ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    state.zebraStripes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* False Color IRE */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-slate-200">Cinema False Color IRE Map</div>
                <div className="text-[11px] text-slate-400">Professional luminance false-color exposure exposure grading</div>
              </div>
              <button
                onClick={() => updateState('falseColor', !state.falseColor)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  state.falseColor ? 'bg-purple-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    state.falseColor ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Framing Guides */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Aspect Ratio Framing Guides</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['none', '16:9', '2.39:1', '9:16'] as AspectRatioGuide[]).map((guide) => (
                  <button
                    key={guide}
                    onClick={() => updateState('aspectRatioGuide', guide)}
                    className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      state.aspectRatioGuide === guide
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {guide === 'none' ? 'Full' : guide}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LUTs & Color Grading Profiles */}
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Color Science & Cinema Look Profiles (LUT)</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'rec709', name: 'Rec.709 Standard', desc: 'Accurate natural broadcast' },
                { id: 'film-log', name: 'Cinematic Film Log', desc: 'Flat gamma, maximum latitude' },
                { id: 'crisp-detail', name: 'Crisp Pro Detail', desc: 'Enhanced micro-contrast' },
                { id: 'warm-cinema', name: 'Warm 3200K Cine', desc: 'Golden hour skin tones' },
                { id: 'cool-tech', name: 'Cool Titanium Tech', desc: 'Modern teal & clean whites' },
                { id: 'monochrome', name: 'Monochrome Silver', desc: 'High dynamic range B&W' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateState('lut', item.id as LutPreset)}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    state.lut === item.id
                      ? 'bg-amber-500/15 border-amber-500/60 text-white'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-semibold">{item.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>

            {/* White Balance Kelvin */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Color Temperature (Kelvin)</span>
                <span className="font-mono text-sky-300 font-semibold tabular-nums">{state.whiteBalanceKelvin}K</span>
              </div>
              <input
                type="range"
                min="2800"
                max="8500"
                step="100"
                value={state.whiteBalanceKelvin}
                onChange={(e) => updateState('whiteBalanceKelvin', parseInt(e.target.value, 10))}
                className="w-full cinema-slider"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>3200K Tungsten</span>
                <span>5600K Daylight</span>
                <span>7500K Shade</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Cable Tether & Raspberry Pi Bridge */}
      {activeTab === 'tether-pi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>Live Streaming via Plugged-In Cable to PC</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Plug your Raspberry Pi directly into your PC or Mac using a USB-C cable. Through the Linux UVC Gadget driver, the PC instantly detects your 4K camera as a native high-speed plug-and-play webcam!
            </p>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cable Link Status:</span>
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  UVC Gadget Active (USB 3.0 / 5Gbps)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Stream Protocol:</span>
                <span className="font-mono text-slate-200">UVC Video Class + UAC Stereo Audio</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">PC Software Support:</span>
                <span className="font-mono text-amber-300">OBS Studio, Zoom, Discord, Premiere, Teams</span>
              </div>
            </div>

            <button
              onClick={onOpenTetherModal}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <Tv className="w-4 h-4" />
              <span>Open USB Cable Tether Monitor & PC Setup Wizard</span>
            </button>
          </div>

          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/70">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Raspberry Pi Hardware Deployment Suite</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Export production-ready setup scripts for Raspberry Pi 5 / 4B including the Python 3 Picamera2 daemon, hardware H.264/H.265 encoder, and Linux kernel gadget config.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Picamera2 4K 60FPS Low-Latency Pipeline</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hardware Gyro Electronic Image Stabilization (EIS)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Latency UVC Gadget over USB-C OTG cable</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mobile iOS & Android Companion WebRTC bridge</span>
              </div>
            </div>

            <button
              onClick={onOpenHardwareGuide}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700 shadow-md"
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>View Hardware Specs, Wiring & Copyable Daemon Code</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
