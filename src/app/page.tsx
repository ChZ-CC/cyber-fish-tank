'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Lightbulb, Fish, Plus, Palette, Type, Menu, X, Archive, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import FishTank from '@/components/FishTank';
import DrawingBoard from '@/components/DrawingBoard';
import ImageGenerator from '@/components/ImageGenerator';

export default function Home() {
  const [fishes, setFishes] = useState<Array<{ id: string; x: number; y: number; size: number; image: string; speedX: number; speedY: number }>>([]);
  const [foods, setFoods] = useState<Array<{ id: string; x: number; y: number; eaten: boolean; foodType: string; createdAt: number }>>([]);
  const [stagingFishes, setStagingFishes] = useState<Array<{ id: string; size: number; image: string; speedX: number; speedY: number }>>([]);
  const [backgroundColor, setBackgroundColor] = useState('#1a3a4a');
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundExpanded, setBackgroundExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stagingExpanded, setStagingExpanded] = useState(false);
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [fishEditDialogOpen, setFishEditDialogOpen] = useState(false);
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

  // 持久化存储
  useEffect(() => {
    const savedFishes = localStorage.getItem('fishtank-fishes');
    const savedStagingFishes = localStorage.getItem('fishtank-staging');
    const savedBackgroundColor = localStorage.getItem('fishtank-background');

    if (savedFishes) {
      try {
        setFishes(JSON.parse(savedFishes));
      } catch (e) {
        console.error('Failed to load fishes:', e);
      }
    }
    if (savedStagingFishes) {
      try {
        setStagingFishes(JSON.parse(savedStagingFishes));
      } catch (e) {
        console.error('Failed to load staging fishes:', e);
      }
    }
    if (savedBackgroundColor) {
      setBackgroundColor(savedBackgroundColor);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fishtank-fishes', JSON.stringify(fishes));
  }, [fishes]);

  useEffect(() => {
    localStorage.setItem('fishtank-staging', JSON.stringify(stagingFishes));
  }, [stagingFishes]);

  useEffect(() => {
    localStorage.setItem('fishtank-background', backgroundColor);
  }, [backgroundColor]);

  const handleBackgroundChange = (color: string) => {
    setBackgroundColor(color);
    setBackgroundExpanded(false);
  };

  // 修复喂食逻辑 - 撒入3-5颗鱼食
  const handleAddFood = (foodType: string) => {
    if (!fishTankRef.current) return;

    const rect = fishTankRef.current.getBoundingClientRect();
    const numFood = Math.floor(Math.random() * 3) + 3; // 3-5颗鱼食

    const newFoods = [];
    for (let i = 0; i < numFood; i++) {
      newFoods.push({
        id: `${Date.now()}-${i}`,
        x: Math.random() * (rect.width - 50) + 25,
        y: Math.random() * (rect.height - 50) + 25,
        eaten: false,
        foodType,
        createdAt: Date.now()
      });
    }

    setFoods([...foods, ...newFoods]);
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

    const newFish = {
      id: Date.now().toString(),
      x,
      y,
      size,
      image,
      speedX,
      speedY
    };

    setFishes([...fishes, newFish]);
    return newFish;
  };

  // 移动鱼到暂存区
  const moveToStaging = (fishId: string) => {
    const fish = fishes.find(f => f.id === fishId);
    if (!fish) return;

    const stagingFish = {
      id: fish.id,
      size: fish.size,
      image: fish.image,
      speedX: fish.speedX,
      speedY: fish.speedY
    };

    setStagingFishes([...stagingFishes, stagingFish]);
    setFishes(fishes.filter(f => f.id !== fishId));
    setSelectedFishId(null);
    setFishEditDialogOpen(false);
  };

  // 从暂存区添加到鱼缸
  const moveToTank = (stagingFishId: string) => {
    const stagingFish = stagingFishes.find(f => f.id === stagingFishId);
    if (!stagingFish || !fishTankRef.current) return;

    const rect = fishTankRef.current.getBoundingClientRect();
    const size = stagingFish.size;

    const newFish = {
      id: stagingFish.id,
      x: Math.random() * (rect.width - size),
      y: Math.random() * (rect.height - size),
      size,
      image: stagingFish.image,
      speedX: stagingFish.speedX,
      speedY: stagingFish.speedY
    };

    setFishes([...fishes, newFish]);
    setStagingFishes(stagingFishes.filter(f => f.id !== stagingFishId));
  };

  // 点击鱼缸中的鱼
  const handleFishClick = (fishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFishId(fishId);
    setFishEditDialogOpen(true);
  };

  // 更新鱼的属性
  const updateFishProperties = (fishId: string, properties: Partial<{ size: number; speedX: number; speedY: number }>) => {
    setFishes(fishes.map(fish =>
      fish.id === fishId ? { ...fish, ...properties } : fish
    ));
  };

  // 删除暂存区的鱼
  const deleteStagingFish = (fishId: string) => {
    setStagingFishes(stagingFishes.filter(f => f.id !== fishId));
  };

  // 获取选中的鱼
  const selectedFish = fishes.find(f => f.id === selectedFishId);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      {/* 移动端顶部栏 */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 shadow-lg">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Fish className="text-blue-500" />
          虚拟鱼缸
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* 移动端侧边栏（底部抽屉） */}
      <div className={`md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Fish className="text-blue-500" />
                功能菜单
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
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
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                      style={{ backgroundColor: backgroundColor === color.value ? `${color.value}22` : 'transparent' }}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"
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
                onClick={() => setSelectedFood(selectedFood ? null : '鱼食')}
              >
                <Type className="mr-2 h-4 w-4" />
                喂食
                <span className="ml-auto">{selectedFood ? '✕' : '▶'}</span>
              </Button>
              {selectedFood && (
                <div className="pl-6 space-y-2">
                  {foodTypes.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => handleAddFood(food.name)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"
                        style={{ backgroundColor: food.color }}
                      />
                      <span className="text-sm">{food.name}</span>
                    </button>
                  ))}
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-2">点击食料撒入3-5颗鱼食</p>
                </div>
              )}
            </div>

            {/* 暂存区 */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setStagingExpanded(!stagingExpanded)}
              >
                <Archive className="mr-2 h-4 w-4" />
                暂存区
                <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">{stagingFishes.length}</span>
              </Button>
              {stagingExpanded && (
                <div className="pl-6 space-y-2">
                  {stagingFishes.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-2">暂存区为空</p>
                  ) : (
                    stagingFishes.map((fish) => (
                      <div key={fish.id} className="flex items-center gap-2">
                        <img
                          src={fish.image}
                          alt="fish"
                          className="w-10 h-10 object-contain"
                        />
                        <div className="flex-1">
                          <button
                            onClick={() => moveToTank(fish.id)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            放入鱼缸
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteStagingFish(fish.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 添加鱼按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <Dialog open={isDrawing} onOpenChange={setIsDrawing}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Palette className="mr-2 h-4 w-4" />
                    画一条鱼
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>画一条鱼</DialogTitle>
                  </DialogHeader>
                  <DrawingBoard onFishCreated={handleAddFish} onClose={() => setIsDrawing(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    文生图
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>文生图生成鱼</DialogTitle>
                  </DialogHeader>
                  <ImageGenerator onFishCreated={handleAddFish} onClose={() => setIsGenerating(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Fish className="text-blue-500" />
            虚拟鱼缸
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            打造你的专属鱼缸
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 背景灯 */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-11"
              onClick={() => setBackgroundExpanded(!backgroundExpanded)}
            >
              <Lightbulb className="mr-2 h-4 w-4 text-amber-500" />
              背景灯
              <span className="ml-auto text-slate-400">{backgroundExpanded ? '▼' : '▶'}</span>
            </Button>
            {backgroundExpanded && (
              <div className="pl-6 space-y-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleBackgroundChange(color.value)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      backgroundColor: backgroundColor === color.value ? `${color.value}22` : 'transparent',
                      border: backgroundColor === color.value ? `2px solid ${color.value}` : '2px solid transparent'
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-sm"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-sm font-medium">{color.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 喂食 */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-11"
              onClick={() => setSelectedFood(selectedFood ? null : '鱼食')}
            >
              <Type className="mr-2 h-4 w-4 text-cyan-500" />
              喂食
              <span className="ml-auto text-slate-400">{selectedFood ? '✕' : '▶'}</span>
            </Button>
            {selectedFood && (
              <div className="pl-6 space-y-2">
                {foodTypes.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => handleAddFood(food.name)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-sm"
                      style={{ backgroundColor: food.color }}
                    />
                    <span className="text-sm font-medium">{food.name}</span>
                  </button>
                ))}
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-2">点击食料撒入3-5颗鱼食</p>
              </div>
            )}
          </div>

          {/* 暂存区 */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-11"
              onClick={() => setStagingExpanded(!stagingExpanded)}
            >
              <Archive className="mr-2 h-4 w-4 text-purple-500" />
              暂存区
              <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">{stagingFishes.length}</span>
            </Button>
            {stagingExpanded && (
              <div className="pl-6 space-y-2">
                {stagingFishes.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-2">暂存区为空</p>
                ) : (
                  stagingFishes.map((fish) => (
                    <div key={fish.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <img
                        src={fish.image}
                        alt="fish"
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex-1">
                        <button
                          onClick={() => moveToTank(fish.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          放入鱼缸
                        </button>
                        <p className="text-xs text-slate-500">大小: {Math.round(fish.size)}px</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteStagingFish(fish.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 添加鱼 - 画板 */}
          <Dialog open={isDrawing} onOpenChange={setIsDrawing}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-11">
                <Palette className="mr-2 h-4 w-4 text-purple-500" />
                画一条鱼
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <DialogTitle>画一条鱼</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <DrawingBoard onFishCreated={handleAddFish} onClose={() => setIsDrawing(false)} />
              </div>
            </DialogContent>
          </Dialog>

          {/* 添加鱼 - 文生图 */}
          <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-11">
                <Plus className="mr-2 h-4 w-4 text-green-500" />
                文生图生成鱼
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <DialogTitle>文生图生成鱼</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <ImageGenerator onFishCreated={handleAddFish} onClose={() => setIsGenerating(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">当前鱼数量</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{fishes.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-600 dark:text-slate-400">暂存区数量</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{stagingFishes.length}</span>
          </div>
        </div>
      </div>

      {/* 鱼缸区域 */}
      <div className="flex-1 p-4 md:p-8 overflow-hidden">
        <FishTank
          ref={fishTankRef}
          fishes={fishes}
          setFishes={setFishes}
          foods={foods}
          setFoods={setFoods}
          backgroundColor={backgroundColor}
          onFishClick={handleFishClick}
        />
      </div>

      {/* 鱼编辑对话框 */}
      <Dialog open={fishEditDialogOpen} onOpenChange={setFishEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑鱼</DialogTitle>
          </DialogHeader>
          {selectedFish && (
            <div className="space-y-6">
              {/* 鱼的预览 */}
              <div className="flex justify-center">
                <img
                  src={selectedFish.image}
                  alt="fish"
                  className="max-w-[150px] max-h-[150px] object-contain"
                />
              </div>

              {/* 大小控制 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">大小</label>
                  <span className="text-sm text-slate-500">{Math.round(selectedFish.size)}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { size: Math.max(30, selectedFish.size - 10) })}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[selectedFish.size]}
                    min={30}
                    max={150}
                    step={10}
                    onValueChange={([value]) => updateFishProperties(selectedFish.id, { size: value })}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { size: Math.min(150, selectedFish.size + 10) })}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 水平速度控制 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">水平速度</label>
                  <span className="text-sm text-slate-500">{selectedFish.speedX.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { speedX: Math.max(-10, selectedFish.speedX - 0.5) })}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[selectedFish.speedX]}
                    min={-10}
                    max={10}
                    step={0.5}
                    onValueChange={([value]) => updateFishProperties(selectedFish.id, { speedX: value })}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { speedX: Math.min(10, selectedFish.speedX + 0.5) })}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 垂直速度控制 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">垂直速度</label>
                  <span className="text-sm text-slate-500">{selectedFish.speedY.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { speedY: Math.max(-10, selectedFish.speedY - 0.5) })}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[selectedFish.speedY]}
                    min={-10}
                    max={10}
                    step={0.5}
                    onValueChange={([value]) => updateFishProperties(selectedFish.id, { speedY: value })}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { speedY: Math.min(10, selectedFish.speedY + 0.5) })}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => moveToStaging(selectedFish.id)}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  移到暂存区
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFishEditDialogOpen(false);
                    setSelectedFishId(null);
                  }}
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
