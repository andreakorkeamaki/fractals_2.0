// Aggiungere dichiarazioni di tipo per i moduli mancanti all'inizio del file
"use client"

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

// Import componenti personalizzati
import { FractalCurves } from "./components/FractalCurves";
import { FractalControls } from "./components/FractalControls";
import AudioBar from "./components/AudioBar";
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";

// Interfacce
interface CustomColors {
  start: string;
  middle: string;
  end: string;
}

// Componente principale
export function FractalGenerator() {
  // Impostazioni di blend
  const [blendFactors, setBlendFactors] = useState(new THREE.Vector3(0.33, 0.33, 0.34));
  const [blendMethod, setBlendMethod] = useState(0);
  
  // Impostazioni di colore
  const [colorSet, setColorSet] = useState(0);
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>({
    start: "#ff0000",
    middle: "#00ff00",
    end: "#0000ff",
  });
  const [colorAnimationSpeed, setColorAnimationSpeed] = useState(1.0);
  const [colorInterpolationMethod, setColorInterpolationMethod] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  
  // Impostazioni di animazione
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [elementSize, setElementSize] = useState(0.04);
  const [depth, setDepth] = useState(1.0);
  const [planeSpacing, setPlaneSpacing] = useState(1.0);
  const [shapeWarp, setShapeWarp] = useState(0.0);

  const audio = useAudioAnalyzer();
  type TargetKey =
    | "elementSize"
    | "depth"
    | "animationSpeed"
    | "planeSpacing"
    | "colorAnimationSpeed"
    | "shapeWarp";

  const [bandTargets, setBandTargets] = useState<Record<"bass" | "mid" | "treble", TargetKey>>({
    bass: "elementSize",
    mid: "depth",
    treble: "colorAnimationSpeed",
  });
  const [bandGain, setBandGain] = useState({ bass: 1, mid: 1, treble: 1 });

  const drivenBands = useMemo(() => {
    return {
      bass: (audio.bands.bass ?? 0) * (bandGain.bass ?? 1),
      mid: (audio.bands.mid ?? 0) * (bandGain.mid ?? 1),
      treble: (audio.bands.treble ?? 0) * (bandGain.treble ?? 1),
    };
  }, [audio.bands, bandGain]);

  const contributions = useMemo<Record<TargetKey, number>>(() => {
    const c: Record<TargetKey, number> = {
      elementSize: 0,
      depth: 0,
      animationSpeed: 0,
      planeSpacing: 0,
      colorAnimationSpeed: 0,
      shapeWarp: 0,
    };
    (["bass", "mid", "treble"] as const).forEach((band) => {
      const target = bandTargets[band];
      c[target] += drivenBands[band];
    });
    return c;
  }, [bandTargets, drivenBands]);

  const audioDriven = useMemo(() => {
    return {
      elementSize: elementSize * (1 + contributions.elementSize * 0.6),
      depth: depth * (1 + contributions.depth * 0.8),
      animationSpeed: animationSpeed * (1 + contributions.animationSpeed * 1.5),
      planeSpacing: planeSpacing * (1 + contributions.planeSpacing * 1.2),
      colorAnimationSpeed:
        colorAnimationSpeed * (1 + contributions.colorAnimationSpeed * 1.2),
      shapeWarp: Math.min(
        1,
        Math.max(0, shapeWarp + contributions.shapeWarp * 0.8)
      ),
    };
  }, [
    contributions,
    elementSize,
    depth,
    animationSpeed,
    planeSpacing,
    colorAnimationSpeed,
    shapeWarp,
  ]);

  const overallAvg = useMemo(() => {
    const sum =
      drivenBands.bass + drivenBands.mid + drivenBands.treble;
    return sum / 3;
  }, [drivenBands]);
  
  /**
   * Gestisce il cambio di colore personalizzato
   */
  const handleCustomColorChange = (key: keyof CustomColors, value: string) => {
    setCustomColors({
      ...customColors,
      [key]: value
    });
  };

  /**
   * Aggiorna i fattori di blend mantenendoli normalizzati
   */
  const updateBlendFactor = (index: number, value: number) => {
    const newFactors = blendFactors.clone();
    newFactors.setComponent(index, value);
    const sum = newFactors.x + newFactors.y + newFactors.z;
    newFactors.divideScalar(sum);
    setBlendFactors(newFactors);
  };

  /**
   * Gestisce il cambiamento dello schema di colori
   */
  const handleColorSchemeChange = (scheme: number) => {
    setColorSet(scheme);
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <FractalControls
        blendFactors={blendFactors}
        updateBlendFactor={updateBlendFactor}
        blendMethod={blendMethod}
        setBlendMethod={setBlendMethod}
        colorSet={colorSet}
        handleColorSchemeChange={handleColorSchemeChange}
        useCustomColors={useCustomColors}
        setUseCustomColors={setUseCustomColors}
        customColors={customColors}
        handleCustomColorChange={handleCustomColorChange}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        elementSize={elementSize}
        setElementSize={setElementSize}
        depth={depth}
        setDepth={setDepth}
        planeSpacing={planeSpacing}
        setPlaneSpacing={setPlaneSpacing}
        shapeWarp={shapeWarp}
        setShapeWarp={setShapeWarp}
        colorAnimationSpeed={colorAnimationSpeed}
        setColorAnimationSpeed={setColorAnimationSpeed}
        colorInterpolationMethod={colorInterpolationMethod}
        setColorInterpolationMethod={setColorInterpolationMethod}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
      />

      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: backgroundColor }}
      >
        <FractalCurves
          blendFactors={blendFactors}
          blendMethod={blendMethod}
          colorSet={colorSet}
          useCustomColors={useCustomColors}
          customColors={customColors}
          animationSpeed={audioDriven.animationSpeed}
          elementSize={audioDriven.elementSize}
          depth={audioDriven.depth}
          planeSpacing={audioDriven.planeSpacing}
          audioLevel={contributions.elementSize > 0 ? 0 : overallAvg}
          colorAnimationSpeed={audioDriven.colorAnimationSpeed}
          shapeWarp={audioDriven.shapeWarp}
          colorInterpolationMethod={colorInterpolationMethod}
        />
        
        <OrbitControls enableDamping rotateSpeed={0.5} />
      </Canvas>

      <AudioBar
        fileName={audio.fileName}
        isReady={audio.isReady}
        isPlaying={audio.isPlaying}
        currentTime={audio.currentTime}
        duration={audio.duration}
        bands={audio.bands}
        error={audio.error}
        onPickFile={audio.setFile}
        onPlay={audio.play}
        onPause={audio.pause}
        onSeek={audio.seek}
        mode={audio.mode}
        onStartMic={audio.startMic}
        onStopMic={audio.stopMic}
        bandGain={bandGain}
        setBandGain={setBandGain}
        bandTargets={bandTargets}
        setBandTargets={setBandTargets}
      />
    </div>
  );
}

export default FractalGenerator;
