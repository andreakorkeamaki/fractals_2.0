import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AudioBands = {
  overall: number;
  bass: number;
  mid: number;
  treble: number;
};

type AnalyzerState = {
  fileName: string | null;
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bands: AudioBands;
  error: string | null;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function useAudioAnalyzer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<AnalyzerState>({
    fileName: null,
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    bands: { overall: 0, bass: 0, mid: 0, treble: 0 },
    error: null,
  });
  const [mode, setMode] = useState<"file" | "mic">("file");

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopLoop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
    }
    sourceRef.current = null;
    if (micSourceRef.current) {
      try {
        micSourceRef.current.disconnect();
      } catch {}
    }
    micSourceRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    analyserRef.current = null;
    dataRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setState((s) => ({
      ...s,
      isReady: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      bands: { overall: 0, bass: 0, mid: 0, treble: 0 },
    }));
  }, [stopLoop]);

  useEffect(() => cleanup, [cleanup]);

  const ensureAnalyser = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeDataRef.current = new Uint8Array(analyser.fftSize);
    }
  }, []);

  const computeBands = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    const timeData = timeDataRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !data || !ctx) return { overall: 0, bass: 0, mid: 0, treble: 0 };

    analyser.getByteFrequencyData(data);
    if (timeData) analyser.getByteTimeDomainData(timeData);
    const nyquist = ctx.sampleRate / 2;
    const binHz = nyquist / data.length;

    let overallSum = 0;
    let bassSum = 0, bassN = 0;
    let midSum = 0, midN = 0;
    let trebleSum = 0, trebleN = 0;

    for (let i = 0; i < data.length; i++) {
      const hz = i * binHz;
      const v = data[i];
      overallSum += v;
      if (hz >= 20 && hz < 250) { bassSum += v; bassN++; }
      else if (hz >= 250 && hz < 2000) { midSum += v; midN++; }
      else if (hz >= 2000 && hz < 8000) { trebleSum += v; trebleN++; }
    }

    const overall = clamp01(overallSum / data.length / 255);
    const bass = clamp01((bassN ? bassSum / bassN : 0) / 255);
    const mid = clamp01((midN ? midSum / midN : 0) / 255);
    const treble = clamp01((trebleN ? trebleSum / trebleN : 0) / 255);

    // Fallback RMS from time-domain (helps mic streams that report low freq bins)
    let rms = 0;
    if (timeData) {
      let acc = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        acc += v * v;
      }
      rms = clamp01(Math.sqrt(acc / timeData.length));
    }

    const boostedOverall = Math.max(overall, rms);
    if (boostedOverall < 0.02) {
      return { overall: boostedOverall, bass: rms, mid: rms, treble: rms };
    }

    return { overall: boostedOverall, bass, mid, treble };
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();
    const tick = () => {
      const bands = computeBands();
      const audio = audioRef.current;
      setState((s) => ({
        ...s,
        bands,
        currentTime: audio?.currentTime ?? 0,
        duration: audio?.duration ?? s.duration,
      }));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [computeBands, stopLoop]);

  const setFile = useCallback((file: File | null) => {
    setMode("file");
    if (!file) {
      cleanup();
      setState((s) => ({ ...s, fileName: null, error: null }));
      return;
    }

    cleanup();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const audio = new Audio(url);
    audio.loop = true;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setState((s) => ({
        ...s,
        fileName: file.name,
        isReady: true,
        duration: audio.duration || 0,
        error: null,
      }));
    };
    audio.onerror = () => {
      setState((s) => ({ ...s, error: "Failed to load audio." }));
    };
  }, [cleanup]);

  const play = useCallback(async () => {
    if (mode === "mic") {
      ensureAnalyser();
      const ctx = ctxRef.current;
      if (ctx?.state === "suspended") await ctx.resume();
      setState((s) => ({ ...s, isPlaying: true, isReady: true }));
      startLoop();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    try {
      ensureAnalyser();
      const ctx = ctxRef.current;
      if (ctx && !sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current!);
        analyserRef.current!.connect(ctx.destination);
      }
      if (ctx?.state === "suspended") await ctx.resume();
      await audio.play();
      setState((s) => ({ ...s, isPlaying: true }));
      startLoop();
    } catch (err) {
      setState((s) => ({ ...s, error: "Playback failed (browser blocked autoplay). Click play again." }));
    }
  }, [ensureAnalyser, mode, startLoop]);

  const pause = useCallback(() => {
    if (mode === "mic") {
      setState((s) => ({ ...s, isPlaying: false }));
      stopLoop();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setState((s) => ({ ...s, isPlaying: false }));
    stopLoop();
  }, [stopLoop]);

  const seek = useCallback((time: number) => {
    if (mode === "mic") return;
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;
    audio.currentTime = Math.min(Math.max(0, time), audio.duration || time);
    setState((s) => ({ ...s, currentTime: audio.currentTime }));
  }, []);

  const startMic = useCallback(async () => {
    cleanup();
    setMode("mic");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current!;
      micSourceRef.current = ctx.createMediaStreamSource(stream);
      ensureAnalyser();
      micSourceRef.current.connect(analyserRef.current!);
      if (ctx.state === "suspended") await ctx.resume();
      setState((s) => ({
        ...s,
        fileName: "Microphone",
        isReady: true,
        isPlaying: true,
        error: null,
        duration: 0,
        currentTime: 0,
      }));
      startLoop();
    } catch (err) {
      setState((s) => ({
        ...s,
        error: "Microphone permission denied or unavailable.",
        isReady: false,
        isPlaying: false,
      }));
      cleanup();
    }
  }, [cleanup, ensureAnalyser, startLoop]);

  const stopMic = useCallback(() => {
    if (mode !== "mic") return;
    cleanup();
    setMode("file");
  }, [cleanup, mode]);

  const api = useMemo(() => ({
    ...state,
    mode,
    setFile,
    play,
    pause,
    seek,
    startMic,
    stopMic,
    cleanup,
  }), [state, mode, setFile, play, pause, seek, startMic, stopMic, cleanup]);

  return api;
}
