'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Lightbulb, Fish, Plus, Palette, Type, Menu, X, Archive, Trash2, ZoomIn, ZoomOut, Sparkles, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FishTank from '@/components/FishTank';
import DrawingBoard from '@/components/DrawingBoard';
import ImageGenerator from '@/components/ImageGenerator';

export default function Home() {
  const [fishes, setFishes] = useState<Array<{ id: string; x: number; y: number; size: number; image: string; baseSpeedX: number; baseSpeedY: number; speedMultiplier: number; name: string }>>([]);
  const [foods, setFoods] = useState<Array<{ id: string; x: number; y: number; eaten: boolean; foodType: string; createdAt: number }>>([]);
  const [stagingFishes, setStagingFishes] = useState<Array<{ id: string; size: number; image: string; baseSpeedX: number; baseSpeedY: number; speedMultiplier: number; name: string }>>([]);
  const [backgroundColor, setBackgroundColor] = useState('linear-gradient(180deg, #E0F0FF 0%, #B8E0F5 100%)');
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundExpanded, setBackgroundExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stagingExpanded, setStagingExpanded] = useState(false);
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [fishEditDialogOpen, setFishEditDialogOpen] = useState(false);
  const [aiServiceEnabled, setAiServiceEnabled] = useState(false);
  const [redrawingFishId, setRedrawingFishId] = useState<string | null>(null);
  const [editingFishName, setEditingFishName] = useState(false);
  const fishTankRef = useRef<HTMLDivElement>(null);

  const backgroundColors = [
    { name: '海洋蓝', value: 'linear-gradient(180deg, #E0F0FF 0%, #B8E0F5 100%)', color: '#B8E0F5' },
    { name: '深海蓝', value: 'linear-gradient(135deg, #051937 0%, #0A2463 100%)', color: '#0A2463' },
    { name: '珊瑚橙', value: '#4a2a1a', color: '#4a2a1a' },
    { name: '海草绿', value: '#1a4a2a', color: '#1a4a2a' },
    { name: '沙滩黄', value: '#4a3a1a', color: '#4a3a1a' },
  ];

  const foodTypes = [
    { name: '鱼食', color: '#FF6B6B' },
    { name: '虫子', color: '#4ECDC4' },
    { name: '虾米', color: '#FFE66D' },
  ];

  // 数据迁移函数：将旧数据结构转换为新数据结构
  const migrateFishData = (fish: any) => {
    // 检查是否是新数据结构（有 speedMultiplier 和 name 属性）
    if ('speedMultiplier' in fish && 'name' in fish) {
      // 确保所有必需的属性都有有效的值
      return {
        ...fish,
        baseSpeedX: typeof fish.baseSpeedX === 'number' ? fish.baseSpeedX : (Math.random() - 0.5) * 4,
        baseSpeedY: typeof fish.baseSpeedY === 'number' ? fish.baseSpeedY : (Math.random() - 0.5) * 2,
        speedMultiplier: typeof fish.speedMultiplier === 'number' ? fish.speedMultiplier : 1,
        name: typeof fish.name === 'string' ? fish.name : '',
        x: typeof fish.x === 'number' && !isNaN(fish.x) ? fish.x : 0,
        y: typeof fish.y === 'number' && !isNaN(fish.y) ? fish.y : 0,
      };
    }

    // 旧数据结构，需要迁移
    return {
      ...fish,
      baseSpeedX: fish.speedX || (Math.random() - 0.5) * 4,
      baseSpeedY: fish.speedY || (Math.random() - 0.5) * 2,
      speedMultiplier: 1,
      name: fish.name || '',
      x: typeof fish.x === 'number' && !isNaN(fish.x) ? fish.x : 0,
      y: typeof fish.y === 'number' && !isNaN(fish.y) ? fish.y : 0,
    };
  };

  // 持久化存储
  useEffect(() => {
    const savedFishes = localStorage.getItem('fishtank-fishes');
    const savedStagingFishes = localStorage.getItem('fishtank-staging');
    const savedBackgroundColor = localStorage.getItem('fishtank-background');

    if (savedFishes) {
      try {
        const parsedFishes = JSON.parse(savedFishes);
        const migratedFishes = parsedFishes.map(migrateFishData);
        setFishes(migratedFishes);
      } catch (e) {
        console.error('Failed to load fishes:', e);
      }
    }
    if (savedStagingFishes) {
      try {
        const parsedStagingFishes = JSON.parse(savedStagingFishes);
        const migratedStagingFishes = parsedStagingFishes.map(migrateFishData);
        setStagingFishes(migratedStagingFishes);
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
    const baseSpeedX = (Math.random() - 0.5) * 4;
    const baseSpeedY = (Math.random() - 0.5) * 2;

    const newFish = {
      id: Date.now().toString(),
      x,
      y,
      size,
      image,
      baseSpeedX,
      baseSpeedY,
      speedMultiplier: 1, // 默认速度倍率为 1
      name: `${fishes.length + 1}号鱼` // 自动生成名称
    };

    setFishes([...fishes, newFish]);
    return newFish;
  };

  // 批量导入鱼图片（支持图片和 zip 格式）
  const handleImportFishes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const container = fishTankRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const size = 60;

    const newFishes: Array<{ id: string; x: number; y: number; size: number; image: string; baseSpeedX: number; baseSpeedY: number; speedMultiplier: number; name: string }> = [];
    let importedCount = 0;

    const processFile = async (file: File, index: number) => {
      // 检查是否是 zip 文件
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);
          
          // 遍历 zip 中的所有文件
          for (const [filename, zipEntry] of Object.entries(zip.files)) {
            // 只处理图片文件
            if (!zipEntry.dir && (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
              const blob = await zipEntry.async('blob');
              const reader = new FileReader();
              await new Promise<void>((resolve) => {
                reader.onload = (e) => {
                  const image = e.target?.result as string;
                  const newFish = {
                    id: `import-${Date.now()}-${importedCount}`,
                    x: Math.random() * (rect.width - size),
                    y: Math.random() * (rect.height - size),
                    size,
                    image,
                    baseSpeedX: (Math.random() - 0.5) * 4,
                    baseSpeedY: (Math.random() - 0.5) * 2,
                    speedMultiplier: 1,
                    name: filename.replace(/\.[^/.]+$/, '') // 使用文件名（不带扩展名）作为鱼名
                  };
                  newFishes.push(newFish);
                  importedCount++;
                  resolve();
                };
                reader.readAsDataURL(blob);
              });
            }
          }
        } catch (error) {
          console.error('解压 zip 文件失败:', error);
          alert('解压 zip 文件失败，请检查文件格式');
        }
      } else {
        // 处理普通图片文件
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const image = e.target?.result as string;
            const newFish = {
              id: `import-${Date.now()}-${importedCount}`,
              x: Math.random() * (rect.width - size),
              y: Math.random() * (rect.height - size),
              size,
              image,
              baseSpeedX: (Math.random() - 0.5) * 4,
              baseSpeedY: (Math.random() - 0.5) * 2,
              speedMultiplier: 1,
              name: file.name.replace(/\.[^/.]+$/, '') // 使用文件名（不带扩展名）作为鱼名
            };
            newFishes.push(newFish);
            importedCount++;
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    };

    // 处理所有文件
    await Promise.all(Array.from(files).map((file, index) => processFile(file, index)));

    // 添加到鱼缸
    if (newFishes.length > 0) {
      setFishes([...fishes, ...newFishes]);
      alert(`成功导入 ${newFishes.length} 条鱼！`);
    } else {
      alert('未找到有效的图片文件');
    }
  };

  // 更新鱼的图片（用于重新绘制）
  const updateFishImage = (fishId: string, newImage: string) => {
    setFishes(fishes.map(fish =>
      fish.id === fishId ? { ...fish, image: newImage } : fish
    ));
  };

  // 开始重新绘制鱼
  const handleRedrawFish = (fishId: string) => {
    setRedrawingFishId(fishId);
    setIsDrawing(true);
    setFishEditDialogOpen(false);
  };

  // 导出单个鱼
  const exportSingleFish = async (fishId: string) => {
    const fish = fishes.find(f => f.id === fishId);
    if (!fish) return;

    try {
      // 将 base64 图片转换为 blob
      const response = await fetch(fish.image);
      const blob = await response.blob();
      
      // 使用鱼的名称作为文件名，如果名称为空则使用 ID
      const fileName = `${fish.name || fish.id}.png`;
      
      // 下载文件
      saveAs(blob, fileName);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 导出所有鱼
  const exportAllFishes = async () => {
    if (fishes.length === 0) {
      alert('没有鱼可以导出');
      return;
    }

    try {
      const zip = new JSZip();
      
      // 添加每条鱼的图片到 ZIP
      for (const fish of fishes) {
        const response = await fetch(fish.image);
        const blob = await response.blob();
        
        // 使用鱼的名称作为文件名，如果名称为空则使用 ID
        const fileName = `${fish.name || fish.id}.png`;
        zip.file(fileName, blob);
      }
      
      // 生成 ZIP 文件
      const content = await zip.generateAsync({ type: 'blob' });
      
      // 下载 ZIP 文件
      saveAs(content, 'fishes.zip');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 移动鱼到暂存区
  const moveToStaging = (fishId: string) => {
    const fish = fishes.find(f => f.id === fishId);
    if (!fish) return;

    const stagingFish = {
      id: fish.id,
      size: fish.size,
      image: fish.image,
      baseSpeedX: fish.baseSpeedX,
      baseSpeedY: fish.baseSpeedY,
      speedMultiplier: fish.speedMultiplier,
      name: fish.name
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
      baseSpeedX: stagingFish.baseSpeedX,
      baseSpeedY: stagingFish.baseSpeedY,
      speedMultiplier: stagingFish.speedMultiplier,
      name: stagingFish.name || `${fishes.length + 1}号鱼`
    };

    setFishes([...fishes, newFish]);
    setStagingFishes(stagingFishes.filter(f => f.id !== stagingFishId));
  };

  // 点击鱼缸中的鱼
  const handleFishClick = (fishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFishId(fishId);
    setFishEditDialogOpen(true);
    setEditingFishName(false);
  };

  // 更新鱼的属性
  const updateFishProperties = (fishId: string, properties: Partial<{ size: number; speedMultiplier: number; name: string }>) => {
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
          赛博养鱼
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 opacity-50" title="AI 服务已禁用">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <Switch
              checked={aiServiceEnabled}
              disabled
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
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
                  {backgroundColors.map((color) => {
                    const isGradient = color.value.includes('gradient');
                    return (
                      <button
                        key={color.value}
                        onClick={() => handleBackgroundChange(color.value)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                        style={isGradient ? { background: backgroundColor === color.value ? `${color.value}22` : 'transparent' } : { backgroundColor: backgroundColor === color.value ? `${color.value}22` : 'transparent' }}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"
                          style={{ background: color.value }}
                        />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    );
                  })}
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
                          alt={fish.name || '鱼'}
                          className="w-10 h-10 object-contain"
                        />
                        <div className="flex-1">
                          <button
                            onClick={() => moveToTank(fish.id)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {fish.name || '未命名鱼'}
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

            {/* 添加鱼 */}
            <div className="space-y-2">
              <Dialog open={isDrawing} onOpenChange={setIsDrawing}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Palette className="mr-2 h-4 w-4" />
                    画一条鱼
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" closeOnOutsideClick={false}>
                  <DialogHeader className="sr-only">
                    <DialogTitle>画一条鱼</DialogTitle>
                  </DialogHeader>
                  <DrawingBoard 
                    onFishCreated={handleAddFish} 
                    onFishUpdated={redrawingFishId ? (image) => updateFishImage(redrawingFishId, image) : undefined}
                    onClose={() => {
                      setIsDrawing(false);
                      setRedrawingFishId(null);
                    }} 
                    aiServiceEnabled={aiServiceEnabled}
                    initialImage={redrawingFishId ? fishes.find(f => f.id === redrawingFishId)?.image : undefined}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    文生图
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0" closeOnOutsideClick={false}>
                  <DialogHeader className="sr-only">
                    <DialogTitle>文生图生成鱼</DialogTitle>
                  </DialogHeader>
                  <ImageGenerator onFishCreated={handleAddFish} onClose={() => setIsGenerating(false)} aiServiceEnabled={aiServiceEnabled} />
                </DialogContent>
              </Dialog>
            </div>

            {/* 导入导出 */}
            <div className="space-y-2">
              <input
                type="file"
                id="fish-import-mobile"
                multiple
                accept="image/*,.zip"
                className="hidden"
                onChange={handleImportFishes}
              />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => document.getElementById('fish-import-mobile')?.click()}
              >
                <Download className="mr-2 h-4 w-4 text-blue-500" />
                批量导入（支持ZIP）
              </Button>
              {fishes.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={exportAllFishes}
                >
                  <Download className="mr-2 h-4 w-4 text-green-500" />
                  导出所有鱼（ZIP）
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Fish className="text-blue-500" />
            赛博养鱼
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            打造你的专属鱼缸
          </p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AI 服务</span>
            </div>
            <div className="flex items-center gap-2 opacity-50" title="AI 服务已禁用">
              <Switch
                checked={aiServiceEnabled}
                disabled
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>
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
                {backgroundColors.map((color) => {
                  const isGradient = color.value.includes('gradient');
                  return (
                    <button
                      key={color.value}
                      onClick={() => handleBackgroundChange(color.value)}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        ...isGradient 
                          ? { background: backgroundColor === color.value ? `${color.value}22` : 'transparent' } 
                          : { backgroundColor: backgroundColor === color.value ? `${color.value}22` : 'transparent' },
                        border: backgroundColor === color.value ? `2px solid ${color.color}` : '2px solid transparent'
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-sm"
                        style={{ background: color.value }}
                      />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  );
                })}
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
                        alt={fish.name || '鱼'}
                        className="w-12 h-12 object-contain"
                      />
                      <div className="flex-1">
                        <button
                          onClick={() => moveToTank(fish.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {fish.name || '未命名鱼'}
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

          {/* 添加鱼 */}
          <div className="space-y-2">
            <Dialog open={isDrawing} onOpenChange={setIsDrawing}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-11">
                  <Palette className="mr-2 h-4 w-4 text-purple-500" />
                  画一条鱼
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" closeOnOutsideClick={false}>
                <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <DialogTitle>画一条鱼</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <DrawingBoard 
                    onFishCreated={handleAddFish}
                    onFishUpdated={redrawingFishId ? (image) => updateFishImage(redrawingFishId, image) : undefined}
                    onClose={() => {
                      setIsDrawing(false);
                      setRedrawingFishId(null);
                    }} 
                    aiServiceEnabled={aiServiceEnabled}
                    initialImage={redrawingFishId ? fishes.find(f => f.id === redrawingFishId)?.image : undefined}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-11">
                  <Plus className="mr-2 h-4 w-4 text-green-500" />
                  文生图生成鱼
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0" closeOnOutsideClick={false}>
                <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <DialogTitle>文生图生成鱼</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <ImageGenerator onFishCreated={handleAddFish} onClose={() => setIsGenerating(false)} aiServiceEnabled={aiServiceEnabled} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* 导入导出 */}
          <div className="space-y-2">
            <input
              type="file"
              id="fish-import"
              multiple
              accept="image/*,.zip"
              className="hidden"
              onChange={handleImportFishes}
            />
            <Button
              variant="outline"
              className="w-full justify-start h-11"
              onClick={() => document.getElementById('fish-import')?.click()}
            >
              <Download className="mr-2 h-4 w-4 text-blue-500" />
              批量导入（支持ZIP）
            </Button>
            {fishes.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full justify-start h-11"
                onClick={exportAllFishes}
              >
                <Download className="mr-2 h-4 w-4 text-green-500" />
                导出所有鱼（ZIP）
              </Button>
            )}
          </div>
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
      <Dialog open={fishEditDialogOpen} onOpenChange={(open) => {
        setFishEditDialogOpen(open);
        if (!open) {
          setEditingFishName(false);
        }
      }}>
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

              {/* 名称显示和编辑 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">名称</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingFishName(!editingFishName)}
                    className="h-7 px-2"
                  >
                    {editingFishName ? (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        取消
                      </>
                    ) : (
                      <>
                        <Type className="h-3 w-3 mr-1" />
                        编辑
                      </>
                    )}
                  </Button>
                </div>
                {editingFishName ? (
                  <Input
                    value={selectedFish.name}
                    onChange={(e) => updateFishProperties(selectedFish.id, { name: e.target.value })}
                    placeholder="输入鱼的名称"
                    className="w-full"
                    autoFocus
                  />
                ) : (
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                    <span className="text-sm">{selectedFish.name || '未命名'}</span>
                  </div>
                )}
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

              {/* 速度倍率控制 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">速度倍率</label>
                  <span className="text-sm text-slate-500">{selectedFish.speedMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { speedMultiplier: Math.max(0.5, selectedFish.speedMultiplier - 0.1) })}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Slider
                    value={[selectedFish.speedMultiplier]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => updateFishProperties(selectedFish.id, { speedMultiplier: value })}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateFishProperties(selectedFish.id, { speedMultiplier: Math.min(2, selectedFish.speedMultiplier + 0.1) })}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">调整鱼移动速度的倍率，范围：0.5x - 2x</p>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleRedrawFish(selectedFish.id)}
                  className="flex-1"
                >
                  <Palette className="mr-2 h-4 w-4" />
                  重新绘制
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportSingleFish(selectedFish.id)}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => moveToStaging(selectedFish.id)}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  移到暂存区
                </Button>
                <Button
                  onClick={() => {
                    setFishEditDialogOpen(false);
                    setSelectedFishId(null);
                    setEditingFishName(false);
                  }}
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                >
                  确定
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
