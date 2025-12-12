import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, extend } from "@react-three/fiber"
import { shaderMaterial } from "@react-three/drei"

interface FractalCurvesProps {
  blendFactors: THREE.Vector3;
  blendMethod: number;
  colorSet: number;
  useCustomColors: boolean;
  customColors: {
    start: string;
    middle: string;
    end: string;
  };
  animationSpeed: number;
  elementSize: number;
  depth: number;
  planeSpacing: number;
  audioLevel: number;
  shapeWarp: number;
  colorAnimationSpeed: number;
  colorInterpolationMethod: number;
}

const FractalMaterial = shaderMaterial(
  {
    time: 0,
    blendFactors: new THREE.Vector3(0.33, 0.33, 0.34),
    blendMethod: 0,
    colorSet: 0,
    useCustomColors: false,
    customColorStart: new THREE.Color(0x000000),
    customColorMiddle: new THREE.Color(0x7f7f7f),
    customColorEnd: new THREE.Color(0xffffff),
    animationSpeed: 1,
    elementSize: 0.04,
    depth: 1,
    planeSpacing: 1,
    audioLevel: 0,
    shapeWarp: 0,
    colorAnimationSpeed: 1,
    colorInterpolationMethod: 0,
  },
  // Vertex Shader
  `
  attribute float instanceIndex;
  uniform float time;
  uniform vec3 blendFactors;
  uniform int blendMethod;
  uniform float animationSpeed;
  uniform float elementSize;
  uniform float depth;
  uniform float planeSpacing;
  uniform float audioLevel;
  uniform float shapeWarp;
  
  varying vec3 vColor;
  varying float vT;
  varying float vVisible;
  
  vec3 spiral(float t, float angle) {
    return vec3(
      sin(angle) * (0.5 + t * 0.5),
      cos(angle) * (0.5 + t * 0.5),
      t * 2.0 - 1.0
    );
  }
  
  vec3 mobius(float t, float angle) {
    return vec3(
      sin(angle) * (0.5 + t * 0.5),
      cos(angle) * (0.5 + t * 0.5),
      sin(angle * 2.0) * 0.2
    );
  }
  
  vec3 trefoil(float t, float angle) {
    float p = 2.0, q = 3.0;
    return vec3(
      (2.0 + cos(q * angle)) * cos(p * angle),
      (2.0 + cos(q * angle)) * sin(p * angle),
      sin(q * angle)
    ) * 0.3;
  }
  
  float linearStep(float edge0, float edge1, float x) {
    return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  }
  
  vec3 blendFractals(vec3 a, vec3 b, vec3 c, vec3 factors, int method, vec2 uv) {
    if (method == 0) {
      // Linear interpolation
      return a * factors.x + b * factors.y + c * factors.z;
    } else if (method == 1) {
      // Smooth step interpolation
      float t = smoothstep(0.0, 1.0, uv.x);
      vec3 ab = mix(a, b, t);
      return mix(ab, c, smoothstep(0.0, 1.0, uv.y));
    } else {
      // Radial blend
      float dist = length(uv - 0.5);
      float t = linearStep(0.0, 0.5, dist);
      vec3 ab = mix(a, b, t);
      return mix(ab, c, smoothstep(0.0, 1.0, dist * 2.0));
    }
  }
  
  void main() {
    float total = 5000.0;
    float effectiveTotal = total / planeSpacing;
    float t = instanceIndex / effectiveTotal;
    float visible = step(t, 1.0);
    float clampedT = clamp(t, 0.0, 1.0);
    float baseTurns = 8.0;
    float warpTurns = baseTurns + shapeWarp * 8.0;
    float turnMod = mix(baseTurns, warpTurns, 0.5 + 0.5 * sin(time * 0.6));
    float angle = clampedT * 2.0 * 3.14159 * turnMod + time * animationSpeed;
    
    vec3 pos1 = spiral(clampedT, angle);
    vec3 pos2 = mobius(clampedT, angle);
    vec3 pos3 = trefoil(clampedT, angle);
    
    vec3 pos = blendFractals(pos1, pos2, pos3, blendFactors, blendMethod, vec2(clampedT, 0.5));

    // Global warp/breathing without changing default look (shapeWarp=0)
    float breath = 1.0 + shapeWarp * 0.35 * sin(time * 1.2 + clampedT * 12.0);
    pos *= breath;
    
    vec3 nextPos = blendFractals(
      spiral(clamp(clampedT + 1.0/total, 0.0, 1.0), angle),
      mobius(clamp(clampedT + 1.0/total, 0.0, 1.0), angle),
      trefoil(clamp(clampedT + 1.0/total, 0.0, 1.0), angle),
      blendFactors, blendMethod, vec2(clampedT + 1.0/total, 0.5)
    );
    
    vec3 dir = normalize(nextPos - pos);
    vec3 up = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
    vec3 right = normalize(cross(up, dir));
    
    pos *= depth;
    
    // Implementazione del billboarding
    vec3 cameraRight = normalize(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]));
    vec3 cameraUp = normalize(vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]));
    
    float audioScale = 1.0 + audioLevel * 0.6;
    float size = elementSize * audioScale;
    pos += (position.x * cameraRight + position.y * cameraUp) * size;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    
    vColor = vec3(clampedT, clampedT, clampedT);
    vT = clampedT;
    vVisible = visible;
  }
  `,
  // Fragment Shader 
  `
  uniform float time;
  uniform int colorSet;
  uniform bool useCustomColors;
  uniform vec3 customColorStart;
  uniform vec3 customColorMiddle;
  uniform vec3 customColorEnd;
  uniform float colorAnimationSpeed;
  uniform int colorInterpolationMethod;
  
  varying vec3 vColor;
  varying float vT;
  varying float vVisible;
  
  vec3 palette(float t) {
    vec3 a, b, c, d;
    
    if (colorSet == 0) {
      // Rainbow palette
      a = vec3(0.5, 0.5, 0.5);
      b = vec3(0.5, 0.5, 0.5);
      c = vec3(1.0, 1.0, 1.0);
      d = vec3(0.0, 0.33, 0.67);
    } else if (colorSet == 1) {
      // Electric palette
      a = vec3(0.5, 0.5, 0.5);
      b = vec3(0.5, 0.5, 0.5);
      c = vec3(1.0, 1.0, 1.0);
      d = vec3(0.1, 0.4, 0.8);
    } else {
      // Pastel palette
      a = vec3(0.5, 0.5, 0.5);
      b = vec3(0.5, 0.5, 0.5);
      c = vec3(1.0, 0.7, 0.4);
      d = vec3(0.0, 0.15, 0.2);
    }
    
    if (useCustomColors) {
      // Custom interpolation between three colors
      float adjustedT = t * 2.0;
      if (colorInterpolationMethod == 0) {
        // Linear interpolation
        if (adjustedT < 1.0) {
          return mix(customColorStart, customColorMiddle, adjustedT);
        } else {
          return mix(customColorMiddle, customColorEnd, adjustedT - 1.0);
        }
      } else {
        // Smooth interpolation
        if (adjustedT < 1.0) {
          float smoothT = smoothstep(0.0, 1.0, adjustedT);
          return mix(customColorStart, customColorMiddle, smoothT);
        } else {
          float smoothT = smoothstep(0.0, 1.0, adjustedT - 1.0);
          return mix(customColorMiddle, customColorEnd, smoothT);
        }
      }
    }
    
    return a + b * cos(6.28318 * (c * t + d + time * 0.1 * colorAnimationSpeed));
  }
  
  void main() {
    float alpha = vVisible;
    if (alpha <= 0.0) discard;
    gl_FragColor = vec4(palette(vT), alpha);
  }
  `
);

extend({ FractalMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fractalMaterial: any;
    }
  }
}

export function FractalCurves({
  blendFactors,
  blendMethod,
  colorSet,
  useCustomColors,
  customColors,
  animationSpeed,
  elementSize,
  depth,
  planeSpacing,
  audioLevel,
  shapeWarp,
  colorAnimationSpeed,
  colorInterpolationMethod,
}: FractalCurvesProps) {
  const geom = React.useRef<THREE.PlaneGeometry | null>(null);
  const matRef = React.useRef<any>(null);
  const meshRef = React.useRef<THREE.InstancedMesh | null>(null);
  const numElements = 5000;

  const instanceIndices = useMemo(() => {
    const arr = new Float32Array(numElements);
    for (let i = 0; i < numElements; i++) arr[i] = i;
    return arr;
  }, [numElements]);

  useEffect(() => {
    if (geom.current) {
      geom.current.setAttribute(
        "instanceIndex",
        new THREE.InstancedBufferAttribute(instanceIndices, 1)
      );
    }
  }, [instanceIndices]);

  useEffect(() => {
    if (geom.current && matRef.current) {
      matRef.current.customColorStart = new THREE.Color(customColors.start);
      matRef.current.customColorMiddle = new THREE.Color(customColors.middle);
      matRef.current.customColorEnd = new THREE.Color(customColors.end);
    }
  }, [customColors]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.time = clock.getElapsedTime();
      matRef.current.blendFactors = blendFactors;
      matRef.current.blendMethod = blendMethod;
      matRef.current.colorSet = colorSet;
      matRef.current.useCustomColors = useCustomColors;
      matRef.current.animationSpeed = animationSpeed;
      matRef.current.elementSize = elementSize;
      matRef.current.depth = depth;
      matRef.current.planeSpacing = planeSpacing;
      matRef.current.audioLevel = audioLevel;
      matRef.current.shapeWarp = shapeWarp;
      matRef.current.colorAnimationSpeed = colorAnimationSpeed;
      matRef.current.colorInterpolationMethod = colorInterpolationMethod;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null!, null!, numElements]} frustumCulled={false}>
      <planeGeometry ref={geom} args={[1, 1]} attach="geometry" />
      <fractalMaterial ref={matRef} transparent={true} />
    </instancedMesh>
  );
}

export default FractalCurves;
