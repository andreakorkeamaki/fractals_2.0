import React from "react";
import type { AudioBands } from "@/hooks/useAudioAnalyzer";

type TargetKey = "elementSize" | "depth" | "animationSpeed" | "planeSpacing" | "colorAnimationSpeed" | "shapeWarp";

interface AudioBarProps {
  fileName: string | null;
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bands: AudioBands;
  error: string | null;
  onPickFile: (file: File | null) => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  mode: "file" | "mic";
  onStartMic: () => void;
  onStopMic: () => void;
  bandTargets: { bass: TargetKey; mid: TargetKey; treble: TargetKey };
  setBandTargets: (t: { bass: TargetKey; mid: TargetKey; treble: TargetKey }) => void;
  bandGain: { bass: number; mid: number; treble: number };
  setBandGain: (g: { bass: number; mid: number; treble: number }) => void;
}

const formatTime = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function AudioBar({
  fileName,
  isReady,
  isPlaying,
  currentTime,
  duration,
  bands,
  error,
  onPickFile,
  onPlay,
  onPause,
  onSeek,
  mode,
  onStartMic,
  onStopMic,
  bandTargets,
  setBandTargets,
  bandGain,
  setBandGain,
}: AudioBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-1 rounded-md border text-sm"
            disabled={!isReady}
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            className="px-3 py-1 rounded-md border text-sm"
            onClick={mode === "mic" ? onStopMic : onStartMic}
          >
            {mode === "mic" ? "Stop Mic" : "Use Mic"}
          </button>

          {mode === "file" && (
            <input
              type="file"
              accept="audio/*"
              className="text-sm"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          )}

          <div className="text-sm truncate flex-1">
            {fileName ?? "No audio loaded"}
          </div>

          <div className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            disabled={!isReady || mode === "mic"}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {(["bass", "mid", "treble"] as const).map((band) => (
            <div key={band} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{band.toUpperCase()}</div>
                <select
                  className="border rounded-md px-2 py-1 bg-background text-xs"
                  value={bandTargets[band]}
                  onChange={(e) =>
                    setBandTargets({ ...bandTargets, [band]: e.target.value as TargetKey })
                  }
                >
                  <option value="elementSize">Element Size</option>
                  <option value="depth">Depth</option>
                  <option value="animationSpeed">Animation Speed</option>
                  <option value="planeSpacing">Plane Spacing</option>
                  <option value="colorAnimationSpeed">Color Speed</option>
                  <option value="shapeWarp">Shape Warp</option>
                </select>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Gain</span>
                <span>{bandGain[band].toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.1}
                value={bandGain[band]}
                onChange={(e) =>
                  setBandGain({ ...bandGain, [band]: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <div className="h-1.5 rounded bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round(bands[band] * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                {Math.round(bands[band] * 100)}%
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-xs text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
}
