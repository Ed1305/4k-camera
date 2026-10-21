export type ResolutionPreset = '4k-uhd' | '4k-dci' | '1080p' | '720p';

export interface ResolutionConfig {
  id: ResolutionPreset;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  badge: string;
}

export const RESOLUTION_PRESETS: Record<ResolutionPreset, ResolutionConfig> = {
  '4k-uhd': {
    id: '4k-uhd',
    label: '4K Ultra HD (16:9)',
    width: 3840,
    height: 2160,
    aspectRatio: '16:9',
    badge: '3840×2160',
  },
  '4k-dci': {
    id: '4k-dci',
    label: '4K Cinema DCI (1.9:1)',
    width: 4096,
    height: 2160,
    aspectRatio: '1.9:1',
    badge: '4096×2160',
  },
  '1080p': {
    id: '1080p',
    label: '1080p Full HD',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    badge: '1920×1080',
  },
  '720p': {
    id: '720p',
    label: '720p HD Ready',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    badge: '1280×720',
  },
};

export type StabilizationMode = 'off' | 'standard' | 'cinematic' | 'horizon-lock';

export type LutPreset = 'rec709' | 'film-log' | 'crisp-detail' | 'warm-cinema' | 'cool-tech' | 'monochrome';

export type AspectRatioGuide = 'none' | '16:9' | '2.39:1' | '9:16' | '4:3';

export type VideoSourceMode = 'device' | 'simulated-city' | 'simulated-macro';

export interface CameraState {
  // Video Source
  sourceMode: VideoSourceMode;
  availableDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  
  // Resolution & FPS
  resolution: ResolutionPreset;
  fps: 24 | 30 | 60;
  
  // Zoom & Pan
  zoomLevel: number; // 1.0 to 10.0
  panX: number; // -1 to 1
  panY: number; // -1 to 1
  superResEnhancement: boolean;
  sharpnessLevel: number; // 0 to 100
  
  // Stabilization
  stabilizationMode: StabilizationMode;
  stabilizationStrength: number; // 0 to 100
  horizonLeveling: boolean;
  
  // Exposure & Sensor
  iso: number; // 100 to 6400
  shutterAngle: number; // 45 to 360 deg
  exposureCompensation: number; // -3.0 to +3.0 EV
  whiteBalanceKelvin: number; // 2500K to 10000K
  whiteBalanceTint: number; // -50 to +50
  lut: LutPreset;
  
  // Video Assist Overlays
  focusPeaking: boolean;
  focusPeakingColor: 'red' | 'green' | 'yellow' | 'cyan';
  zebraStripes: boolean;
  zebraThreshold: number; // 70 to 100%
  falseColor: boolean;
  gridGuide: boolean;
  aspectRatioGuide: AspectRatioGuide;
  centerMark: boolean;
  histogram: boolean;
  
  // Audio
  audioEnabled: boolean;
  audioGain: number; // 0.0 to 3.0 (1.0 = normal)
  windNoiseFilter: boolean; // 80Hz high pass
  audioInputDevice: string;
  
  // Tether & Cable
  tetherActive: boolean;
  tetherMode: 'uvc-gadget' | 'usb-ethernet' | 'webrtc-stream';
  pcStreamFps: number;
  pcStreamBitrateMbps: number;
}

export interface CapturedMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  blob: Blob;
  name: string;
  timestamp: number;
  resolution: string;
  fileSizeBytes: number;
  durationSec?: number;
}
