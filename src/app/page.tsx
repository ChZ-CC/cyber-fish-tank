'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Lightbulb, Fish, Plus, Palette, Type } from 'lucide-react';
import FishTank from '@/components/FishTank';
import DrawingBoard from '@/components/DrawingBoard';
import ImageGenerator from '@/components/ImageGenerator';

export default function Home() {
  const [fishes, setFishes] = useState<Array<{ id: string; x: number; y: number; size: number; image: string; speedX: number; speedY: number }>>([]);
  const [foods, setFoods] = useState<Array<{ id: string; x: number; y: number; eaten: boolean; foodType: string; createdAt: number }>>([]);
  const [backgroundColor, setBackgroundColor] = useState('#1a3a4a');
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundExpanded, setBackgroundExpanded] = useState(false);
  const fishTankRef = useRef<HTMLDivElement>(null);

  const backgroundColors = [
    { name: '海洋蓝', value: '#1a3a4a' },
    { name: '深海紫', value: '#2a1a4a' },
    { name: '珊瑚橙', value: '#4a2a1a' },
    { name: '海草绿', value: '#1a4a2a' },
    { name: '沙滩黄', value: '#4a3a1a' },
  ];

  const foodTypes = [
    { name: '鱼食', color: '#FF6B6B' },
    { name: '虫子', color: '#4ECDC4' },
    { name: '虾米', color: '#FFE66D' },
  ];

  const handleBackgroundChange = (color: string) => {
    setBackgroundColor(color);
  };

  const handleAddFood = (food: string, e: React.MouseEvent) => {
    if (!fishTankRef.current) return;
    
    const rect = fishTankRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setFoods([...foods, { 
      id: Date.now().toString(), 
      x, 
      y, 
      eaten: false,
      foodType: food,
      createdAt: Date.now()
    }]);
    setSelectedFood(null);
  };

  const handleAddFish = (image: string) => {
    const size = 60;
    const container = fishTankRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.random() * (rect.width - size);
    const y = Math.random() * (rect.height - size);
    const speedX = (Math.random() - 0.5) * 4;
    const speedY = (Math.random() - 0.5) * 2;

    setFishes([...fishes, {
      id: Date.now().toString(),
      x,
      y,
      size,
      image,
      speedX,
      speedY
    }]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* 侧边栏 */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Fish className="text-blue-500" />
            虚拟鱼缸
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 背景灯 */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setBackgroundExpanded(!backgroundExpanded)}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              背景灯
              <span className="ml-auto">{backgroundExpanded ? '▼' : '▶'}</span>
            </Button>
            {backgroundExpanded && (
              <div className="pl-6 space-y-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleBackgroundChange(color.value)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    style={{ backgroundColor: backgroundColor === color.value ? `${color.value}33` : 'transparent' }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 喂食 */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setSelectedFood(foodTypes[0].name)}
            >
              <Type className="mr-2 h-4 w-4" />
              喂食
            </Button>
            {selectedFood && (
              <div className="pl-6 space-y-2">
                {foodTypes.map((food) => (
                  <button
                    key={food.name}
                    onClick={(e) => handleAddFood(food.name, e)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-grab active:cursor-grabbing"
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: food.color }}
                    />
                    <span className="text-sm">{food.name}</span>
                  </button>
                ))}
                <p className="text-xs text-gray-500 dark:text-gray-400">点击食料并拖动到鱼缸</p>
              </div>
            )}
          </div>

          {/* 添加鱼 - 画板 */}
          <Sheet open={isDrawing} onOpenChange={setIsDrawing}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Palette className="mr-2 h-4 w-4" />
                画一条鱼
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[900px] sm:w-[900px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>画一条鱼</SheetTitle>
              </SheetHeader>
              <DrawingBoard onFishCreated={handleAddFish} onClose={() => setIsDrawing(false)} />
            </SheetContent>
          </Sheet>

          {/* 添加鱼 - 文生图 */}
          <Sheet open={isGenerating} onOpenChange={setIsGenerating}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                文生图生成鱼
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[800px] sm:w-[800px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>文生图生成鱼</SheetTitle>
              </SheetHeader>
              <ImageGenerator onFishCreated={handleAddFish} onClose={() => setIsGenerating(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            当前鱼数量: {fishes.length}
          </p>
        </div>
      </div>

      {/* 鱼缸 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full h-full max-w-6xl max-h-[800px]">
          <FishTank
            ref={fishTankRef}
            fishes={fishes}
            setFishes={setFishes}
            foods={foods}
            setFoods={setFoods}
            backgroundColor={backgroundColor}
          />
        </div>
      </div>
    </div>
  );
}
