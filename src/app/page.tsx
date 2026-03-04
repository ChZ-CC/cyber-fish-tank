'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

import {
  Lightbulb,
  Fish,
  Plus,
  Palette,
  Menu,
  X,
  Trash2,
  Sparkles,
  Download,
  Upload,
  Pizza,
  LucideEdit
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FishTank from '@/components/FishTank';
import FishImage from '@/components/FishImage';
import { initDB, saveImage, getImage, getImages, deleteImage, clearAllImages } from '@/lib/imageStore';

// 动态导入 DrawingBoard 和 ImageGenerator 组件
const DrawingBoard = dynamic(() => import('@/components/DrawingBoard'), { ssr: false });
const ImageGenerator = dynamic(() => import('@/components/ImageGenerator'), { ssr: false });

// 图片缓存（内存中的快速访问）
const imageCache = new Map<string, string>();

// 防抖函数
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

import { MyFish, FishPersistData, Food } from '@/lib/types';

export default function Home() {
  const [fishes, setFishes] = useState<MyFish[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [backgroundColor, setBackgroundColor] = useState('linear-gradient(180deg, #E0F0FF 0%, #B8E0F5 100%)');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [backgroundExpanded, setBackgroundExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const [fishEditDialogOpen, setFishEditDialogOpen] = useState(false);
  const [aiServiceEnabled] = useState(false);
  const [redrawingFishId, setRedrawingFishId] = useState<string | null>(null);
  const [redrawingImage, setRedrawingImage] = useState<string | null>(null);
  const [isEditingFishName, setIsEditingFishName] = useState(false);
  const [editingFishData, setEditingFishData] = useState<{ name: string; size: number; speedMultiplier: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderedFishCount, setRenderedFishCount] = useState(0);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [feedingMode, setFeedingMode] = useState(false);
  const [selectedFoodType, setSelectedFoodType] = useState<string>('鱼食');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const fishTankRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const backgroundColors = [
    { name: '海洋蓝', value: 'linear-gradient(180deg, #E0F0FF 0%, #B8E0F5 100%)', color: '#B8E0F5' },
    { name: '深海蓝', value: 'linear-gradient(135deg, #051937 0%, #0A2463 100%)', color: '#0A2463' },
    { name: '珊瑚橙', value: 'linear-gradient(180deg, #483024ff 0%, #4a2a1a 100%)', color: '#4a2a1a' },
    { name: '海草绿', value: 'linear-gradient(180deg, #274a33ff 0%, #1a4a2a 100%)', color: '#1a4a2a' },
    { name: '沙滩黄', value: 'linear-gradient(180deg, #4f432cff 0%, #4a3a1a 100%)', color: '#4a3a1a' },
  ];

  const foodTypes = [
    { name: '鱼食', color: '#FF6B6B' },
    { name: '虫子', color: '#4ECDC4' },
    { name: '虾米', color: '#FFE66D' },
  ];

  // 获取鱼的图片（带缓存）
  const getFishImage = useCallback(async (imageId: string): Promise<string | null> => {
    if (imageCache.has(imageId)) {
      return imageCache.get(imageId)!;
    }
    const image = await getImage(imageId);
    if (image) {
      imageCache.set(imageId, image);
    }
    return image;
  }, []);

  // 数据迁移函数
  const migrateFishData = (fish: any): FishPersistData & { x?: number; y?: number; image?: string } => {
    if ('imageId' in fish) {
      return {
        ...fish,
        baseSpeedX: typeof fish.baseSpeedX === 'number' ? fish.baseSpeedX : (Math.random() - 0.5) * 4,
        baseSpeedY: typeof fish.baseSpeedY === 'number' ? fish.baseSpeedY : (Math.random() - 0.5) * 2,
        speedMultiplier: typeof fish.speedMultiplier === 'number' ? fish.speedMultiplier : 1,
        name: typeof fish.name === 'string' ? fish.name : '',
      };
    }
    return {
      id: fish.id,
      imageId: '',
      image: fish.image,
      size: fish.size || 60,
      baseSpeedX: fish.baseSpeedX || fish.speedX || (Math.random() - 0.5) * 4,
      baseSpeedY: fish.baseSpeedY || fish.speedY || (Math.random() - 0.5) * 2,
      speedMultiplier: fish.speedMultiplier || 1,
      name: fish.name || '',
      x: fish.x,
      y: fish.y,
    };
  };

  // 初始化 IndexedDB 并加载数据
  useEffect(() => {
    const loadData = async () => {
      console.log('开始加载数据...');
      try {
        await initDB();
        console.log('IndexedDB 初始化完成');

        const savedFishes = localStorage.getItem('fishtank-fishes');
        const savedBackgroundColor = localStorage.getItem('fishtank-background');

        console.log('localStorage 数据:', {
          hasFishes: !!savedFishes,
          hasBackground: !!savedBackgroundColor,
          savedFishes: savedFishes ? JSON.parse(savedFishes) : null,
        });

        if (savedFishes) {
          const parsedFishes = JSON.parse(savedFishes);
          console.log('解析的鱼数据:', parsedFishes.length, '条');
          const migratedFishes: MyFish[] = [];

          for (const fish of parsedFishes.map(migrateFishData)) {
            if ((fish as any).image && !fish.imageId) {
              // 迁移旧数据：将 base64 图片存储到 IndexedDB
              const imageId = `img-${fish.id}-${Date.now()}`;
              await saveImage(imageId, (fish as any).image);
              imageCache.set(imageId, (fish as any).image);
              fish.imageId = imageId;
            } else if (fish.imageId) {
              // 新数据：从 IndexedDB 加载图片到缓存
              const image = await getImage(fish.imageId);
              if (image) {
                imageCache.set(fish.imageId, image);
              } else {
                console.warn(`图片 ${fish.imageId} 未在 IndexedDB 中找到`);
              }
            }

            const size = fish.size || 60;

            migratedFishes.push({
              ...fish,
              x: (fish as any).x ?? Math.random() * (800 - size),
              y: (fish as any).y ?? Math.random() * (600 - size),
            });
          }

          console.log(`加载了 ${migratedFishes.length} 条鱼`);
          setFishes(migratedFishes);
        }

        if (savedBackgroundColor) {
          setBackgroundColor(savedBackgroundColor);
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        console.log('数据加载完成，设置 isLoading = false');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 防抖保存鱼数据
  const saveFishesToStorage = useCallback(
    debounce((fishes: MyFish[]) => {
      const persistData: FishPersistData[] = fishes.map(f => ({
        id: f.id,
        imageId: f.imageId,
        size: f.size,
        baseSpeedX: f.baseSpeedX,
        baseSpeedY: f.baseSpeedY,
        speedMultiplier: f.speedMultiplier,
        name: f.name,
      }));
      localStorage.setItem('fishtank-fishes', JSON.stringify(persistData));
    }, 1000),
    []
  );

  // 立即保存鱼数据
  const saveFishesImmediately = useCallback((fishes: MyFish[]) => {
    const persistData: FishPersistData[] = fishes.map(f => ({
      id: f.id,
      imageId: f.imageId,
      size: f.size,
      baseSpeedX: f.baseSpeedX,
      baseSpeedY: f.baseSpeedY,
      speedMultiplier: f.speedMultiplier,
      name: f.name,
    }));
    localStorage.setItem('fishtank-fishes', JSON.stringify(persistData));
    console.log(`立即保存了 ${persistData.length} 条鱼到 localStorage`);
  }, []);

  // 防抖保存暂存区数据
  // 监听鱼数据变化
  useEffect(() => {
    if (!isLoading) {
      saveFishesToStorage(fishes);
    }
  }, [fishes, isLoading, saveFishesToStorage]);

  // 保存背景色
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('fishtank-background', backgroundColor);
    }
  }, [backgroundColor, isLoading]);

  const handleBackgroundChange = (color: string) => {
    setBackgroundColor(color);
  };

  // 喂食逻辑（保留用于兼容性）
  const handleAddFood = (foodType: string) => {
    if (!fishTankRef.current) return;

    const rect = fishTankRef.current.getBoundingClientRect();
    const numFood = Math.floor(Math.random() * 3) + 3;

    const newFoods: Array<{ id: string; x: number; y: number; startY: number; eaten: boolean; foodType: string; createdAt: number }> = [];
    for (let i = 0; i < numFood; i++) {
      const y = Math.random() * (rect.height - 50) + 25;
      newFoods.push({
        id: `${Date.now()}-${i}`,
        x: Math.random() * (rect.width - 50) + 25,
        y,
        startY: y,
        eaten: false,
        foodType,
        createdAt: Date.now()
      });
    }

    setFoods(prev => [...prev, ...newFoods]);
  };

  // 添加新鱼
  const handleAddFish = async (image: string): Promise<MyFish> => {
    const size = 60;
    const container = fishTankRef.current;
    const rect = container?.getBoundingClientRect();

    const x = Math.random() * ((rect?.width || 800) - size);
    const y = Math.random() * ((rect?.height || 600) - size);
    const baseSpeedX = (Math.random() - 0.5) * 4;
    const baseSpeedY = (Math.random() - 0.5) * 2;
    const id = Date.now().toString();
    const imageId = `img-${id}`;

    await saveImage(imageId, image);
    imageCache.set(imageId, image);

    const generateUniqueName = (baseName: string): string => {
      const existingNames = new Set(fishes.map(f => f.name));
      if (!existingNames.has(baseName)) return baseName;

      let counter = 1;
      while (existingNames.has(`${baseName}_${counter}`)) {
        counter++;
      }
      return `${baseName}_${counter}`;
    };

    const newFish: MyFish = {
      id,
      x,
      y,
      size,
      imageId,
      baseSpeedX,
      baseSpeedY,
      speedMultiplier: 1,
      name: generateUniqueName(`${fishes.length + 1}号鱼`)
    };

    const updatedFishes = [...fishes, newFish];
    setFishes(updatedFishes);
    saveFishesImmediately(updatedFishes);
    return newFish;
  };

  // 批量导入鱼图片
  const handleImportFishes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const container = fishTankRef.current;
    const rect = container?.getBoundingClientRect();
    const size = 60;

    const existingNames = new Set(fishes.map(f => f.name));
    const newFishes: MyFish[] = [];
    const skippedNames: string[] = [];
    const baseTime = Date.now();
    let globalFishIndex = 0;

    const processFile = async (file: File, fileIndex: number) => {
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const zip = await JSZip.loadAsync(arrayBuffer);

          for (const [filename, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir && (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
              const fishName = filename.replace(/\.[^/.]+$/, '');

              if (existingNames.has(fishName)) {
                skippedNames.push(fishName);
                continue;
              }

              const blob = await zipEntry.async('blob');
              const imageData = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(blob);
              });

              const id = `import-${baseTime}-${globalFishIndex}`;
              const imageId = `img-${id}`;

              await saveImage(imageId, imageData);
              imageCache.set(imageId, imageData);

              const newFish: MyFish = {
                id,
                x: Math.random() * ((rect?.width || 800) - size),
                y: Math.random() * ((rect?.height || 600) - size),
                size,
                imageId,
                baseSpeedX: (Math.random() - 0.5) * 4,
                baseSpeedY: (Math.random() - 0.5) * 2,
                speedMultiplier: 1,
                name: fishName
              };
              newFishes.push(newFish);
              existingNames.add(fishName);
              globalFishIndex++;
            }
          }
        } catch (error) {
          console.error('解压 zip 文件失败:', error);
          alert('解压 zip 文件失败，请检查文件格式');
        }
      } else {
        const fishName = file.name.replace(/\.[^/.]+$/, '');

        if (existingNames.has(fishName)) {
          skippedNames.push(fishName);
          return;
        }

        const imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const id = `import-${baseTime}-${globalFishIndex}`;
        const imageId = `img-${id}`;

        await saveImage(imageId, imageData);
        imageCache.set(imageId, imageData);

        const newFish: MyFish = {
          id,
          x: Math.random() * ((rect?.width || 800) - size),
          y: Math.random() * ((rect?.height || 600) - size),
          size,
          imageId,
          baseSpeedX: (Math.random() - 0.5) * 4,
          baseSpeedY: (Math.random() - 0.5) * 2,
          speedMultiplier: 1,
          name: fishName
        };
        newFishes.push(newFish);
        existingNames.add(fishName);
        globalFishIndex++;
      }
    };

    // 串行处理文件以避免竞态条件
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i], i);
    }

    if (newFishes.length > 0) {
      const updatedFishes = [...fishes, ...newFishes];
      setFishes(updatedFishes);
      saveFishesImmediately(updatedFishes);

      let message = `成功导入 ${newFishes.length} 条鱼！`;
      if (skippedNames.length > 0) {
        message += `\n跳过 ${skippedNames.length} 条重名鱼：${skippedNames.slice(0, 5).join('、')}${skippedNames.length > 5 ? '...' : ''}`;
      }
      alert(message);
    } else if (skippedNames.length > 0) {
      alert(`所有导入的鱼名称都已存在，共跳过 ${skippedNames.length} 条鱼。`);
    } else {
      alert('未找到有效的图片文件');
    }

    event.target.value = '';
  };

  // 更新鱼的图片
  const updateFishImage = async (fishId: string, newImage: string) => {
    const fish = fishes.find(f => f.id === fishId);
    if (!fish) return;

    await saveImage(fish.imageId, newImage);
    imageCache.set(fish.imageId, newImage);

    setFishes(prev => prev.map(f =>
      f.id === fishId ? { ...f } : f
    ));
  };

  // 导出单个鱼
  const exportSingleFish = async (fishId: string) => {
    const fish = fishes.find(f => f.id === fishId);
    if (!fish) return;

    try {
      const image = await getFishImage(fish.imageId);
      if (!image) {
        alert('图片不存在');
        return;
      }

      const response = await fetch(image);
      const blob = await response.blob();

      const fileName = `${fish.name || fish.id}.png`;
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

      for (const fish of fishes) {
        const image = await getFishImage(fish.imageId);
        if (image) {
          const response = await fetch(image);
          const blob = await response.blob();
          zip.file(`${fish.name || fish.id}.png`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `我的鱼缸_${new Date().toLocaleDateString()}.zip`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 点击鱼缸中的鱼
  const handleFishClick = (fishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const fish = fishes.find(f => f.id === fishId);
    if (fish) {
      setEditingFishData({
        name: fish.name || '',
        size: fish.size,
        speedMultiplier: fish.speedMultiplier,
      });
    }
    setSelectedFishId(fishId);
    setFishEditDialogOpen(true);
  };

  // 获取选中的鱼
  const selectedFish = fishes.find(f => f.id === selectedFishId);

  // 编辑鱼信息 更新数据
  const updateFish = useCallback(async () => {
    if (selectedFish && editingFishData) {
      const updatedFishes = fishes.map(f =>
        f.id === selectedFishId
          ? { ...f, name: editingFishData.name, size: editingFishData.size, speedMultiplier: editingFishData.speedMultiplier }
          : f
      );
      setFishes(updatedFishes);
      saveFishesImmediately(updatedFishes);
    }
    setIsEditingFishName(false);
    setEditingFishData(null);
    setFishEditDialogOpen(false);
  }, [fishes, selectedFishId, editingFishData, saveFishesImmediately]);

  // 更新一条鱼的信息
  const updateOneFish = useCallback(async (fish: MyFish) => {
    if (fish) {
      const updatedFishes = fishes.map(f =>
        f.id === fish.id
          ? { ...f, name: fish.name, size: fish.size, speedMultiplier: fish.speedMultiplier }
          : f
      );
      setFishes(updatedFishes);
      saveFishesImmediately(updatedFishes);
    }
    setIsEditingFishName(false);
    setEditingFishData(null);
    setFishEditDialogOpen(false);
  }, [fishes]);

  // 删除鱼
  const deleteFish = useCallback(async (fishId: string) => {
    const fish = fishes.find(f => f.id === fishId);
    if (!fish) return;

    await deleteImage(fish.imageId);
    imageCache.delete(fish.imageId);

    const updatedFishes = fishes.filter(f => f.id !== fishId);
    setFishes(updatedFishes);
    saveFishesImmediately(updatedFishes);

    setSelectedFishId(null);
    setEditingFishData(null);
    setFishEditDialogOpen(false);
  }, [fishes, imageCache]);

  // 重新绘制鱼
  const redrawFish = useCallback(async (fishId: string) => {
    const fish = fishes.find(f => f.id === fishId);
    if (!fish) return;

    const image = await getFishImage(fish.imageId);
    if (image) {
      setRedrawingImage(image);
      setRedrawingFishId(fish.id);
      setIsEditingFishName(false);
      setEditingFishData(null);
      setFishEditDialogOpen(false);
      setIsDrawing(true);
    }
  }, [fishes, getFishImage]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 如果点击的是菜单，处理菜单关闭
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
        setBackgroundExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 如果正在加载，显示加载界面
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 全屏鱼缸 */}
      <div className="absolute inset-0">
        <FishTank
          ref={fishTankRef}
          fishes={fishes}
          setFishes={setFishes}
          foods={foods}
          setFoods={setFoods}
          backgroundColor={backgroundColor}
          onFishClick={handleFishClick}
          imageCache={imageCache}
          getFishImage={getFishImage}
          onRenderedFishCountChange={setRenderedFishCount}
          feedingMode={feedingMode}
          onTankClick={(x, y) => {
            if (feedingMode) {
              const newFood = {
                id: `${Date.now()}-${Math.random()}`,
                x,
                y,
                startY: y,
                eaten: false,
                foodType: selectedFoodType,
                createdAt: Date.now()
              };
              setFoods(prev => [...prev, newFood]);
            }
          }}
        />
      </div>

      {/* 左上角标题 */}
      <div className="absolute top-4 left-4 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl px-4 py-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),0_4px_4px_2px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <Fish className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold text-white tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)' }}>我的鱼缸</h1>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 px-4 py-3">
        <p className="text-sm text-white tracking-wide" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)' }}>当前鱼数量：<span className="font-bold text-purple-400">{renderedFishCount}</span></p>
      </div>

      {/* 右上角功能区域 */}
      <div className="absolute top-4 right-4 flex flex-col items-end" ref={menuRef}>
        {/* 遮罩层 - 仅覆盖四个图标区域 */}
        <div className="absolute -top-4 -right-4 -bottom-4 w-[60px] bg-transparent z-10" />

        {/* 菜单按钮和下拉列表容器 - 层级最高 */}
        <div className="relative z-30">
          {/* 功能菜单按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
            onClick={() => {
              setBackgroundExpanded(false);
              setFeedingMode(false);
              setMenuOpen(!menuOpen);
            }}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* 功能菜单下拉列表 - 放在这里确保层级最高 */}
          {menuOpen && (
            <div className="absolute top-14 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-fit min-w-[180px] max-h-[80vh] overflow-y-auto">
              <div className="space-y-3">
                {/* AI 服务开关 */}
                <div className="flex items-center justify-between gap-4 px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">AI 服务</span>
                  </div>
                  <div className="opacity-50" title="AI 服务已禁用">
                    <Switch
                      checked={false}
                      disabled
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>

                {/* 分隔线 - AI 服务下方 */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-2" />

                {/* 添加鱼 */}
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      setBackgroundExpanded(false);
                      setFeedingMode(false);
                      setIsGenerating(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Plus className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">AI 生成鱼</span>
                  </button>
                </div>

                {/* 导入导出 */}
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      // 先关闭菜单，再触发点击
                      setMenuOpen(false);
                      // 延迟一点时间确保菜单关闭后再触发
                      setTimeout(() => {
                        importInputRef.current?.click();
                      }, 100);
                    }}
                  >
                    <Upload className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">导入鱼鱼</span>
                  </button>
                  <button
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${fishes.length > 0 ? '' : 'opacity-50'}`}
                    onClick={() => {
                      setExportDialogOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Download className={`w-5 h-5 ${fishes.length > 0 ? 'text-green-500' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium">导出鱼鱼</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 独立功能按钮 - 竖排 - 层级较低 */}
        <div className="flex flex-col items-end gap-2 mt-2 relative z-20">
          {/* 背景灯 - 向左展开 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
              onClick={() => {
                setMenuOpen(false);
                setFeedingMode(false);
                setBackgroundExpanded(!backgroundExpanded);
              }}
            >
              <Lightbulb className="w-5 h-5 text-cyan-500" />
            </Button>
            {/* 背景灯展开面板 - 向左 */}
            {backgroundExpanded && (
              <div className="absolute right-14 top-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2">
                <div className="flex flex-wrap gap-2 w-fit">
                  {backgroundColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        handleBackgroundChange(color.value);
                        setBackgroundExpanded(false);
                      }}
                      onMouseEnter={() => setHoveredColor(color.name)}
                      onMouseLeave={() => setHoveredColor(null)}
                      className="relative group"
                    >
                      <div
                        className="w-8 h-8 rounded-2xl border-2 border-slate-300 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform"
                        style={{ background: color.value }}
                      />
                      {/* 颜色名称提示 */}
                      {(hoveredColor === color.name) && (
                        <div className="absolute top-1/2 -translate-y-1/2 -left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 -translate-x-full">
                          {color.name}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 喂食模式 - 切换喂食模式 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 backdrop-blur-sm rounded-2xl shadow-lg border transition-all ${feedingMode
                ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400 dark:border-yellow-600'
                : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800'
                }`}
              onClick={() => {
                setMenuOpen(false);
                setBackgroundExpanded(false);
                if (!feedingMode) {
                  // 随机选择食料类型
                  const randomFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
                  setSelectedFoodType(randomFood.name);
                  setFeedingMode(true);
                } else {
                  setFeedingMode(false);
                }
              }}
            >
              <Pizza className={`w-5 h-5 ${feedingMode ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500'}`} />
            </Button>
            {/* 喂食模式提示 */}
            {feedingMode && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-3 py-2 whitespace-nowrap">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">喂食模式，再次点击退出</p>
              </div>
            )}
          </div>

          {/* 画一条鱼 */}
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800"
            onClick={() => {
              setMenuOpen(false);
              setBackgroundExpanded(false);
              setFeedingMode(false);
              setIsDrawing(true);
            }}
          >
            <Palette className="w-5 h-5 text-purple-500" />
          </Button>
        </div>
      </div>

      {/* 绘画板弹窗 */}
      <Dialog open={isDrawing} onOpenChange={(open) => {
        setIsDrawing(open);
        if (!open) {
          setRedrawingFishId(null);
          setRedrawingImage(null);
        }
      }}>
        <DialogContent className="w-[90vw] !max-w-[90vw] h-[85vh] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="text-xl">{redrawingFishId ? '重新绘制鱼' : '画一条鱼'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <DrawingBoard
              onFishCreated={handleAddFish}
              onFishUpdated={redrawingFishId ? (image) => updateFishImage(redrawingFishId, image) : undefined}
              onClose={() => {
                setIsDrawing(false);
                setRedrawingFishId(null);
                setRedrawingImage(null);
              }}
              aiServiceEnabled={aiServiceEnabled}
              initialImage={redrawingImage || undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 文生图弹窗 */}
      <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
        <DialogContent className="w-[90vw] !max-w-[90vw] h-[85vh] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="text-xl">AI 生成鱼</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ImageGenerator
              onFishCreated={handleAddFish}
              onClose={() => setIsGenerating(false)}
              aiServiceEnabled={aiServiceEnabled}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 鱼编辑弹窗 */}
      <Dialog open={fishEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingFishData(null);
          setIsEditingFishName(false);
          setFishEditDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-md flex flex-col p-0 gap-0 overflow-hidden">
          {/* 固定标题栏 */}
          <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle>鱼的信息</DialogTitle>
          </DialogHeader>

          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedFish && editingFishData && (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <FishImage
                    imageId={selectedFish.imageId}
                    alt={selectedFish.name || '鱼'}
                    className="w-32 h-32 object-contain"
                    imageCache={imageCache}
                    getFishImage={getFishImage}
                  />
                </div>

                {/* 名称编辑 - 名称前缀，笔图标上标 */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-slate-500">名称</span>
                  {isEditingFishName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingFishData.name}
                        onChange={(e) => {
                          setEditingFishData(prev => prev ? { ...prev, name: e.target.value } : null);
                        }}
                        placeholder="未命名鱼"
                        autoFocus
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingFishName(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{editingFishData.name || '未命名鱼'}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 -mt-2"
                        onClick={() => setIsEditingFishName(true)}
                      >
                        <LucideEdit className="w-3 h-3 text-slate-500" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">大小</span>
                    <span className="text-sm">{Math.round(editingFishData.size)}px</span>
                  </div>
                  <Slider
                    value={[editingFishData.size]}
                    min={30}
                    max={150}
                    step={5}
                    onValueChange={(value) => {
                      setEditingFishData(prev => prev ? { ...prev, size: value[0] } : null);
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">游动速度</span>
                    <span className="text-sm">{editingFishData.speedMultiplier.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[editingFishData.speedMultiplier]}
                    min={0.2}
                    max={3}
                    step={0.1}
                    onValueChange={(value) => {
                      setEditingFishData(prev => prev ? { ...prev, speedMultiplier: value[0] } : null);
                    }}
                  />
                </div>

                <div className="space-y-2 flex flex-row gap-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => deleteFish(selectedFish.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    删除鱼
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => redrawFish(selectedFish.id)}
                  >
                    <Palette className="w-4 h-4" />
                    重新绘制
                  </Button>
                  <Button
                    className="flex-1 bg-black hover:bg-slate-800 text-white"
                    onClick={() => updateFish()}
                  >
                    确定
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 导出确认弹窗 */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fishes.length > 0 ? '确认导出' : '没有鱼可以导出'}</AlertDialogTitle>
            <AlertDialogDescription>
              {fishes.length > 0 ? `确定要导出所有 ${fishes.length} 条鱼吗？将生成一个包含所有鱼图片的 ZIP 文件。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fishes.length > 0 ? '取消' : '关闭'}</AlertDialogCancel>
            <AlertDialogAction hidden={!fishes.length} onClick={() => {
              exportAllFishes();
              setExportDialogOpen(false);
            }}>
              确认导出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 隐藏的文件输入 - 放在这里避免层级问题 */}
      <input
        ref={importInputRef}
        type="file"
        id="fish-import-new"
        multiple
        accept="image/*,.zip"
        className="hidden"
        onChange={handleImportFishes}
      />
    </div>
  );
}