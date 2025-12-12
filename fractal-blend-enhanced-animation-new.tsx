// Aggiungere dichiarazioni di tipo per i moduli mancanti all'inizio del file
"use client"

import React, { useState } from 'react';
import * as THREE from 'three';
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

// Import componenti personalizzati
import { FractalCurves } from "./components/FractalCurves";
import { FractalControls } from "./components/FractalControls";

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
          animationSpeed={animationSpeed}
          elementSize={elementSize}
          depth={depth}
          planeSpacing={planeSpacing}
          colorAnimationSpeed={colorAnimationSpeed}
          colorInterpolationMethod={colorInterpolationMethod}
        />
        
        <OrbitControls enableDamping rotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}

export default FractalGenerator;
