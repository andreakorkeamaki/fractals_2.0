import React from 'react';
import * as THREE from 'three';
import { Settings, Palette } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"

interface CustomColors {
  start: string;
  middle: string;
  end: string;
}

interface FractalControlsProps {
  blendFactors: THREE.Vector3;
  updateBlendFactor: (index: number, value: number) => void;
  blendMethod: number;
  setBlendMethod: (method: number) => void;
  colorSet: number;
  handleColorSchemeChange: (scheme: number) => void;
  useCustomColors: boolean;
  setUseCustomColors: (use: boolean) => void;
  customColors: CustomColors;
  handleCustomColorChange: (key: keyof CustomColors, value: string) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  elementSize: number;
  setElementSize: (size: number) => void;
  depth: number;
  setDepth: (depth: number) => void;
  planeSpacing: number;
  setPlaneSpacing: (spacing: number) => void;
  shapeWarp: number;
  setShapeWarp: (warp: number) => void;
  colorAnimationSpeed: number;
  setColorAnimationSpeed: (speed: number) => void;
  colorInterpolationMethod: number;
  setColorInterpolationMethod: (method: number) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

export function FractalControls({
  blendFactors,
  updateBlendFactor,
  blendMethod,
  setBlendMethod,
  colorSet,
  handleColorSchemeChange,
  useCustomColors,
  setUseCustomColors,
  customColors,
  handleCustomColorChange,
  animationSpeed,
  setAnimationSpeed,
  elementSize,
  setElementSize,
  depth,
  setDepth,
  planeSpacing,
  setPlaneSpacing,
  shapeWarp,
  setShapeWarp,
  colorAnimationSpeed,
  setColorAnimationSpeed,
  colorInterpolationMethod,
  setColorInterpolationMethod,
  backgroundColor,
  setBackgroundColor,
}: FractalControlsProps) {
  return (
    <div className="fixed right-4 top-4 w-80 bg-white dark:bg-slate-900 shadow-lg rounded-lg overflow-hidden z-10">
      <Tabs defaultValue="settings">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Blend Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="block">Spiral ({Math.round(blendFactors.x * 100)}%)</Label>
                <Slider
                  value={[blendFactors.x * 100]}
                  onValueChange={(value) => updateBlendFactor(0, value[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label className="block">Möbius ({Math.round(blendFactors.y * 100)}%)</Label>
                <Slider
                  value={[blendFactors.y * 100]}
                  onValueChange={(value) => updateBlendFactor(1, value[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label className="block">Trefoil ({Math.round(blendFactors.z * 100)}%)</Label>
                <Slider
                  value={[blendFactors.z * 100]}
                  onValueChange={(value) => updateBlendFactor(2, value[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label className="block mb-2">Blend Method</Label>
                <RadioGroup
                  value={blendMethod.toString()}
                  onValueChange={(value) => setBlendMethod(parseInt(value))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="method-linear" />
                    <Label htmlFor="method-linear">Linear</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="method-smooth" />
                    <Label htmlFor="method-smooth">Smooth Step</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="method-radial" />
                    <Label htmlFor="method-radial">Radial</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Animation Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="block">Animation Speed ({animationSpeed.toFixed(2)})</Label>
                <Slider
                  value={[animationSpeed]}
                  onValueChange={(value) => setAnimationSpeed(value[0])}
                  min={0}
                  max={3}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label className="block">Element Size ({elementSize.toFixed(3)})</Label>
                <Slider
                  value={[elementSize]}
                  onValueChange={(value) => setElementSize(value[0])}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                />
              </div>

              <div className="space-y-2">
                <Label className="block">Plane Spacing ({planeSpacing.toFixed(2)}×)</Label>
                <Slider
                  value={[planeSpacing]}
                  onValueChange={(value) => setPlaneSpacing(value[0])}
                  min={0.5}
                  max={5}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label className="block">Shape Warp ({shapeWarp.toFixed(2)})</Label>
                <Slider
                  value={[shapeWarp]}
                  onValueChange={(value) => setShapeWarp(value[0])}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <div className="space-y-2">
                <Label className="block">Depth ({depth.toFixed(2)})</Label>
                <Slider
                  value={[depth]}
                  onValueChange={(value) => setDepth(value[0])}
                  min={0.1}
                  max={2}
                  step={0.1}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Color Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="block mb-2">Color Scheme</Label>
                <RadioGroup
                  value={colorSet.toString()}
                  onValueChange={(value) => handleColorSchemeChange(parseInt(value))}
                  className="space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="color-rainbow" />
                    <Label htmlFor="color-rainbow">Rainbow</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="color-electric" />
                    <Label htmlFor="color-electric">Electric</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="color-pastel" />
                    <Label htmlFor="color-pastel">Pastel</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="custom-colors"
                  checked={useCustomColors}
                  onCheckedChange={setUseCustomColors}
                />
                <Label htmlFor="custom-colors">Use Custom Colors</Label>
              </div>

              {useCustomColors && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="block mb-2">Custom Colors</Label>
                    {["start", "middle", "end"].map((key) => (
                      <div key={key} className="flex items-center mb-2">
                        <Label className="w-16 capitalize">{key}</Label>
                        <Input
                          type="color"
                          value={customColors[key as keyof CustomColors]}
                          onChange={(e) => handleCustomColorChange(key as keyof CustomColors, e.target.value)}
                          className="w-8 h-8 p-0 border-none"
                        />
                        <span className="ml-2 text-sm">{customColors[key as keyof CustomColors]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label className="block mb-2">Color Interpolation</Label>
                    <RadioGroup
                      value={colorInterpolationMethod.toString()}
                      onValueChange={(value) => setColorInterpolationMethod(parseInt(value))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="interpolation-linear" />
                        <Label htmlFor="interpolation-linear">Linear</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="interpolation-smooth" />
                        <Label htmlFor="interpolation-smooth">Smooth</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {!useCustomColors && (
                <div className="space-y-2">
                  <Label className="block">Color Animation Speed ({colorAnimationSpeed.toFixed(2)})</Label>
                  <Slider
                    value={[colorAnimationSpeed]}
                    onValueChange={(value) => setColorAnimationSpeed(value[0])}
                    min={0}
                    max={3}
                    step={0.1}
                  />
                </div>
              )}

              <div>
                <h4 className="mb-2 font-semibold">Background Color</h4>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-8 h-8 p-0 border-none"
                  />
                  <span className="text-sm">{backgroundColor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FractalControls;
