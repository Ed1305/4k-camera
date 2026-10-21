import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraState, CapturedMedia, RESOLUTION_PRESETS } from '../types/camera';

// Exact generated high-fidelity asset paths
import CINE_4K_IMG from '../assets/images/cine_4k_test_scene_1792587030482.jpg';
import MACRO_4K_IMG from '../assets/images/macro_detail_4k_1792587030344.jpg';

export function useCameraStream(initialState: CameraState) {
  const [state, setState] = useState<CameraState>(initialState);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [capturedMediaList, setCapturedMediaList] = useState<CapturedMedia[]>([]);

  // Audio measurement state
  const [vuLevelL, setVuLevelL] = useState(-60); // dBFS (-60 to 0)
  const [vuLevelR, setVuLevelR] = useState(-60);
  const [vuPeak, setVuPeak] = useState(-60);
  const [isClipping, setIsClipping] = useState(false);

  // HTML Video / Image elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const simImageRef = useRef<HTMLImageElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Audio Context & nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const audioDestNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const animFrameAudioRef = useRef<number | null>(null);

  // MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Preload test images
  const cineImgObjRef = useRef<HTMLImageElement>(new Image());
  const macroImgObjRef = useRef<HTMLImageElement>(new Image());

  useEffect(() => {
    cineImgObjRef.current.src = CINE_4K_IMG;
    macroImgObjRef.current.src = MACRO_4K_IMG;
  }, []);

  // Enumerate camera and audio devices
  const refreshDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setState((prev) => ({
          ...prev,
          availableDevices: videoDevices,
          selectedDeviceId: prev.selectedDeviceId || (videoDevices[0]?.deviceId ?? ''),
        }));
      }
    } catch (err) {
      console.warn('Could not enumerate media devices:', err);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Audio metering loop
  const updateAudioMeter = useCallback(() => {
    if (!analyserNodeRef.current) return;

    const analyser = analyserNodeRef.current;
    const bufferLength = analyser.fftSize;
    const timeData = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(timeData);

    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < bufferLength; i++) {
      const val = timeData[i];
      const absVal = Math.abs(val);
      if (absVal > peak) peak = absVal;
      sumSquares += val * val;
    }

    const rms = Math.sqrt(sumSquares / bufferLength);

    // Convert to dBFS (0 is digital full scale clipping)
    const rmsDb = rms > 0.0001 ? Math.max(-60, 20 * Math.log10(rms)) : -60;
    const peakDb = peak > 0.0001 ? Math.max(-60, 20 * Math.log10(peak)) : -60;

    // Slight stereo variation simulation if mono source
    const offsetR = Math.sin(Date.now() * 0.005) * 1.5;

    setVuLevelL(rmsDb);
    setVuLevelR(Math.max(-60, Math.min(0, rmsDb + offsetR)));
    setVuPeak(peakDb);
    setIsClipping(peakDb >= -0.3);

    animFrameAudioRef.current = requestAnimationFrame(updateAudioMeter);
  }, []);

  // Setup Web Audio graph
  const setupAudioGraph = useCallback(
    async (stream: MediaStream) => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        audioSourceNodeRef.current = source;

        // Gain node (digital preamp)
        const gain = ctx.createGain();
        gain.gain.value = state.audioGain;
        gainNodeRef.current = gain;

        // Biquad filter (80Hz high-pass wind noise filter)
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = state.windNoiseFilter ? 80 : 10;
        filterNodeRef.current = filter;

        // Analyser node for VU meter
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.6;
        analyserNodeRef.current = analyser;

        // Destination node for recording mixed audio
        const dest = ctx.createMediaStreamDestination();
        audioDestNodeRef.current = dest;

        // Connect graph: Source -> Filter -> Gain -> Analyser & Dest
        source.connect(filter);
        filter.connect(gain);
        gain.connect(analyser);
        gain.connect(dest);

        if (animFrameAudioRef.current) cancelAnimationFrame(animFrameAudioRef.current);
        animFrameAudioRef.current = requestAnimationFrame(updateAudioMeter);
      } catch (err) {
        console.warn('Error setting up Web Audio graph:', err);
      }
    },
    [state.audioGain, state.windNoiseFilter, updateAudioMeter]
  );

  // Start hardware/webcam stream
  const startHardwareCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const res = RESOLUTION_PRESETS[state.resolution];
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: state.selectedDeviceId ? { exact: state.selectedDeviceId } : undefined,
          width: { ideal: res.width },
          height: { ideal: res.height },
          frameRate: { ideal: state.fps },
        },
        audio: state.audioEnabled,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLiveCameraActive(true);

      if (state.audioEnabled && stream.getAudioTracks().length > 0) {
        await setupAudioGraph(stream);
      }
    } catch (err) {
      console.warn('Hardware camera access unavailable or denied:', err);
      setCameraError(
        'Physical camera device not permitted or unavailable in current context. Seamlessly falling back to 4K DSP Cinema Test Sensor.'
      );
      setIsLiveCameraActive(false);
      setState((prev) => ({ ...prev, sourceMode: 'simulated-city' }));
    }
  }, [state.resolution, state.selectedDeviceId, state.fps, state.audioEnabled, setupAudioGraph]);

  // Handle source switching
  useEffect(() => {
    if (state.sourceMode === 'device') {
      startHardwareCamera();
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (animFrameAudioRef.current) {
        cancelAnimationFrame(animFrameAudioRef.current);
      }
      setIsLiveCameraActive(false);

      // Simulate subtle ambient audio VU activity when in simulated mode
      const simTimer = setInterval(() => {
        if (state.audioEnabled) {
          const randDb = -38 + Math.sin(Date.now() * 0.003) * 6 + Math.random() * 4;
          setVuLevelL(randDb);
          setVuLevelR(randDb - 1.5);
          setVuPeak(randDb + 4);
          setIsClipping(false);
        } else {
          setVuLevelL(-60);
          setVuLevelR(-60);
          setVuPeak(-60);
        }
      }, 100);

      return () => clearInterval(simTimer);
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameAudioRef.current) {
        cancelAnimationFrame(animFrameAudioRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [state.sourceMode, startHardwareCamera, state.audioEnabled]);

  // Update audio gain dynamically
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = state.audioGain;
    }
  }, [state.audioGain]);

  // Update audio wind noise filter
  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.value = state.windNoiseFilter ? 80 : 10;
    }
  }, [state.windNoiseFilter]);

  // Capture still 4K snapshot
  const captureSnapshot = useCallback(
    (canvas: HTMLCanvasElement) => {
      const resConfig = RESOLUTION_PRESETS[state.resolution];
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const timestamp = Date.now();
          const filename = `PiCam_4K_${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}.jpg`;

          const newMedia: CapturedMedia = {
            id: `photo-${timestamp}`,
            type: 'photo',
            url,
            blob,
            name: filename,
            timestamp,
            resolution: `${canvas.width}×${canvas.height}`,
            fileSizeBytes: blob.size,
          };

          setCapturedMediaList((prev) => [newMedia, ...prev]);

          // Automatic download trigger
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
        'image/jpeg',
        0.98
      );
    },
    [state.resolution]
  );

  // Start video recording
  const startRecording = useCallback(
    (canvas: HTMLCanvasElement) => {
      try {
        const stream = canvas.captureStream(state.fps);

        // Mix in audio track if available
        if (state.audioEnabled && audioDestNodeRef.current) {
          const audioTracks = audioDestNodeRef.current.stream.getAudioTracks();
          if (audioTracks.length > 0) {
            stream.addTrack(audioTracks[0]);
          }
        }

        const mimeTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ];
        const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

        const recorder = new MediaRecorder(stream, {
          mimeType: selectedMime,
          videoBitsPerSecond: 28_000_000, // 28 Mbps cinema bitrate for high quality
        });

        recordedChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const fullBlob = new Blob(recordedChunksRef.current, { type: selectedMime });
          const url = URL.createObjectURL(fullBlob);
          const timestamp = Date.now();
          const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
          const filename = `PiCam_4K_Rec_${new Date(timestamp).toISOString().replace(/[:.]/g, '-')}.${ext}`;

          const newMedia: CapturedMedia = {
            id: `video-${timestamp}`,
            type: 'video',
            url,
            blob: fullBlob,
            name: filename,
            timestamp,
            resolution: `${canvas.width}×${canvas.height}`,
            fileSizeBytes: fullBlob.size,
            durationSec: recordingDuration,
          };

          setCapturedMediaList((prev) => [newMedia, ...prev]);

          // Trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordingDuration(0);

        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        recordTimerRef.current = window.setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Failed to start video recording:', err);
      }
    },
    [state.fps, state.audioEnabled, recordingDuration]
  );

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
  }, [isRecording]);

  return {
    state,
    setState,
    videoRef,
    simImageRef,
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
    refreshDevices,
  };
}
