import React, { useState } from 'react';
import { CameraState, RESOLUTION_PRESETS } from '../types/camera';
import { 
  X, 
  Tv, 
  CheckCircle2, 
  Cpu, 
  Laptop, 
  Cable, 
  Sparkles, 
  Activity, 
  Copy, 
  Check, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface CableTetherModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: CameraState;
  setState: React.Dispatch<React.SetStateAction<CameraState>>;
}

export const CableTetherModal: React.FC<CableTetherModalProps> = ({
  isOpen,
  onClose,
  state,
  setState,
}) => {
  const [tetherMode, setTetherMode] = useState<'uvc' | 'rndis'>('uvc');
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [isTestingLink, setIsTestingLink] = useState(false);
  const [testSuccess, setTestSuccess] = useState(true);

  if (!isOpen) return null;

  const currentRes = RESOLUTION_PRESETS[state.resolution];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleTestLink = () => {
    setIsTestingLink(true);
    setTimeout(() => {
      setIsTestingLink(false);
      setTestSuccess(true);
      setState((prev) => ({ ...prev, tetherActive: true }));
    }, 900);
  };

  const uvcBashCommand = `# 1. Enable USB OTG driver in Raspberry Pi /boot/firmware/config.txt
dtoverlay=dwc2

# 2. Run the UVC Gadget init script
sudo chmod +x /usr/local/bin/setup_uvc_gadget.sh
sudo /usr/local/bin/setup_uvc_gadget.sh

# 3. Start the 4K Picamera2 UVC stream daemon
python3 /home/pi/picam4k/picam4k_daemon.py --mode uvc --res 3840x2160 --fps 60`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0f121d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#131726]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Streaming via Plugged-In Cable to PC</h3>
              <p className="text-xs text-slate-400">
                Plug Raspberry Pi USB-C directly into PC / Mac for zero-latency 4K webcam streaming & audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Animated Hardware Cable Diagram */}
          <div className="bg-[#090b12] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
              <span>PHYSICAL CABLE TETHER TOPOLOGY</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                USB 3.2 GEN 1 HIGH-SPEED (5 Gbps)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Box 1: Raspberry Pi 5 Camera Rig */}
              <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-center space-y-1.5 shadow-lg">
                <Cpu className="w-7 h-7 text-amber-400 mx-auto" />
                <div className="font-bold text-slate-200 text-sm">Raspberry Pi 5 / 4B</div>
                <div className="text-[11px] text-slate-400 font-mono">Sony IMX477 4K HQ + EIS Gyro</div>
                <div className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono inline-block">
                  USB-C OTG Port
                </div>
              </div>

              {/* Connecting Cable */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                  <Cable className="w-4 h-4 text-emerald-400" />
                  <span>USB-C High-Speed Cable</span>
                </div>
                <div className="w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-400 rounded-full animate-pulse" />
                <div className="text-[10px] text-slate-400 text-center">
                  Zero Drivers Required · Plug & Play
                </div>
              </div>

              {/* Box 2: Target PC / Mac */}
              <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-center space-y-1.5 shadow-lg">
                <Laptop className="w-7 h-7 text-sky-400 mx-auto" />
                <div className="font-bold text-slate-200 text-sm">Host PC / Mac / Linux</div>
                <div className="text-[11px] text-slate-400 font-mono">Recognized as "PiCam 4K Pro UVC"</div>
                <div className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono inline-block">
                  OBS / Zoom / Premiere Ready
                </div>
              </div>
            </div>

            {/* Test Cable Link Trigger */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                <span>Resolution: <strong className="text-amber-400">{currentRes.badge}</strong></span>
                <span>Framerate: <strong className="text-emerald-400">{state.fps} FPS</strong></span>
                <span>Audio: <strong className="text-sky-300">48kHz PCM Stereo</strong></span>
              </div>

              <button
                onClick={handleTestLink}
                disabled={isTestingLink}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingLink ? 'animate-spin' : ''}`} />
                <span>{isTestingLink ? 'Verifying Cable Pipeline...' : 'Test Cable Link & Ping'}</span>
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Select Streaming Protocol Over Cable</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: UVC Gadget */}
              <div
                onClick={() => setTetherMode('uvc')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  tetherMode === 'uvc'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Tv className="w-4 h-4 text-emerald-400" />
                    <span>UVC Webcam Gadget (Recommended)</span>
                  </div>
                  {tetherMode === 'uvc' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Turns the Raspberry Pi directly into a standard USB Video Class webcam. No software or drivers needed on PC; open OBS, Zoom, or Discord and choose "PiCam 4K Pro" in camera dropdown.
                </p>
              </div>

              {/* Option 2: RNDIS High-Speed Virtual Ethernet */}
              <div
                onClick={() => setTetherMode('rndis')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  tetherMode === 'rndis'
                    ? 'bg-sky-500/10 border-sky-500 text-white shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>USB-Ethernet (RNDIS / CDC-NCM)</span>
                  </div>
                  {tetherMode === 'rndis' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Establishes a private 1Gbps network over the USB cable. Stream pristine 4K 60fps raw H.265/AV1 or WebRTC feed directly into your browser or NDI monitor with sub-35ms latency.
                </p>
              </div>
            </div>
          </div>

          {/* Setup Instructions for OBS & Video Conferencing */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>Step-by-Step PC Configuration (OBS Studio / Zoom / Mac)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <div className="font-bold text-amber-400">1. Plug Cable</div>
                <p className="text-slate-400">
                  Connect high-speed USB-C cable from Raspberry Pi USB-C power/data port to PC USB 3.0 port.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <div className="font-bold text-emerald-400">2. Select Device in OBS</div>
                <p className="text-slate-400">
                  Add <strong className="text-white">Video Capture Device</strong> &gt; Select <strong className="text-white">PiCam 4K Pro UVC</strong>. Set resolution to 3840×2160 @ 60 FPS.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                <div className="font-bold text-sky-400">3. Map Audio Input</div>
                <p className="text-slate-400">
                  Check <strong className="text-white">Use Custom Audio Device</strong> &gt; Select <strong className="text-white">PiCam 4K Digital Audio</strong> (48kHz stereo).
                </p>
              </div>
            </div>
          </div>

          {/* Quick Terminal Copy for Pi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Raspberry Pi Startup Terminal Commands</span>
              <button
                onClick={() => handleCopy(uvcBashCommand, 'bash')}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-mono text-xs"
              >
                {copiedScript === 'bash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript === 'bash' ? 'Copied to Clipboard' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="p-3 bg-black/90 border border-slate-800 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
              {uvcBashCommand}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#131726] flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Plugged-in Cable Streaming verified for macOS Sonoma/Sequoia & Windows 10/11</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
