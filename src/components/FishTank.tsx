'use client';

import { forwardRef, useEffect, useState, Dispatch, SetStateAction, useRef } from 'react';

interface Fish {
  id: string;
  x: number;
  y: number;
  size: number;
  imageId: string;
  baseSpeedX: number;
  baseSpeedY: number;
  speedMultiplier: number;
  name: string;
}

interface Food {
  id: string;
  x: number;
  y: number;
  eaten: boolean;
  foodType: string;
  createdAt: number;
  startY?: number;
}

interface FishTankProps {
  fishes: Fish[];
  setFishes: Dispatch<SetStateAction<Fish[]>>;
  foods: Food[];
  setFoods: Dispatch<SetStateAction<Food[]>>;
  backgroundColor: string;
  onFishClick?: (fishId: string, e: React.MouseEvent) => void;
  imageCache: Map<string, string>;
  getFishImage: (imageId: string) => Promise<string | null>;
  onRenderedFishCountChange?: (count: number) => void;
  feedingMode?: boolean;
  onTankClick?: (x: number, y: number) => void;
}

const FishTank = forwardRef<HTMLDivElement, FishTankProps>(
  ({ fishes, setFishes, foods, setFoods, backgroundColor, onFishClick, imageCache, getFishImage, onRenderedFishCountChange, feedingMode, onTankClick }, ref) => {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [fishImages, setFishImages] = useState<Map<string, string>>(new Map());
    const containerRef = (ref as React.RefObject<HTMLDivElement>) || null;
    const foodsRef = useRef(foods);

    useEffect(() => {
      foodsRef.current = foods;
    }, [foods]);

    // 计算真实渲染的鱼数量
    const renderedFishCount = fishes.filter(fish => fishImages.has(fish.id)).length;
    
    // 当渲染数量变化时通知父组件
    useEffect(() => {
      onRenderedFishCountChange?.(renderedFishCount);
    }, [renderedFishCount, onRenderedFishCountChange]);
    
    // 标记是否是首次加载
    const isFirstLoadRef = useRef(true);
    
    // 当初次获取到容器尺寸时，重新调整鱼的位置
    useEffect(() => {
      if (containerSize.width > 0 && containerSize.height > 0 && isFirstLoadRef.current && fishes.length > 0) {
        // 检查是否有鱼使用了默认尺寸 (800x600)
        const needsReposition = fishes.some(fish => 
          fish.x >= 600 || fish.y >= 400 // 如果位置接近或超过默认尺寸，可能需要重新调整
        );
        
        if (needsReposition) {
          console.log('重新调整鱼的位置以适应容器尺寸');
          setFishes(prevFishes => prevFishes.map(fish => {
            // 检查当前位置是否超出容器
            const newX = Math.min(fish.x, containerSize.width - fish.size);
            const newY = Math.min(fish.y, containerSize.height - fish.size);
            
            if (newX !== fish.x || newY !== fish.y) {
              return { ...fish, x: newX, y: newY };
            }
            return fish;
          }));
        }
        
        isFirstLoadRef.current = false;
      }
    }, [containerSize, fishes, setFishes]);

    useEffect(() => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }, [containerRef]);

    // 加载鱼的图片
    useEffect(() => {
      const loadImages = async () => {
        const newImages = new Map<string, string>();
        for (const fish of fishes) {
          // 优先从缓存获取
          if (imageCache.has(fish.imageId)) {
            newImages.set(fish.id, imageCache.get(fish.imageId)!);
          } else {
            // 从 IndexedDB 加载
            const image = await getFishImage(fish.imageId);
            if (image) {
              newImages.set(fish.id, image);
              imageCache.set(fish.imageId, image); // 同步更新缓存
            }
          }
        }
        setFishImages(newImages);
      };

      if (fishes.length > 0) {
        loadImages();
      } else {
        setFishImages(new Map());
      }
    }, [fishes, imageCache, getFishImage]);

    // 使用 requestAnimationFrame 进行动画
    useEffect(() => {
      if (containerSize.width <= 0 || containerSize.height <= 0) return;

      let lastTime = 0;
      const targetFPS = 60;
      const frameInterval = 1000 / targetFPS;
      let animationFrameId: number;

      const animate = (currentTime: number) => {
        animationFrameId = requestAnimationFrame(animate);

        const deltaTime = currentTime - lastTime;
        if (deltaTime < frameInterval) return;
        lastTime = currentTime - (deltaTime % frameInterval);

        const now = Date.now();

        setFishes(prevFishes => {
          return prevFishes.map(fish => {
            let newX = fish.x;
            let newY = fish.y;
            let newBaseSpeedX = fish.baseSpeedX;
            let newBaseSpeedY = fish.baseSpeedY;

            const currentFoods = foodsRef.current;
            if (currentFoods.length > 0) {
              const nearestFood = currentFoods.reduce((nearest, food) => {
                const distToCurrent = Math.sqrt(
                  Math.pow(food.x - fish.x, 2) +
                  Math.pow(food.y - fish.y, 2)
                );
                const distToNearest = Math.sqrt(
                  Math.pow(nearest.x - fish.x, 2) +
                  Math.pow(nearest.y - fish.y, 2)
                );
                return distToCurrent < distToNearest ? food : nearest;
              }, currentFoods[0]);

              const dx = nearestFood.x - fish.x;
              const dy = nearestFood.y - fish.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist > 0) {
                const attractionSpeed = 4;
                newX = fish.x + (dx / dist) * attractionSpeed;
                newY = fish.y + (dy / dist) * attractionSpeed;
                newBaseSpeedX = dx > 0 ? Math.abs(fish.baseSpeedX) : -Math.abs(fish.baseSpeedX);
                newBaseSpeedY = dy > 0 ? Math.abs(fish.baseSpeedY) : -Math.abs(fish.baseSpeedY);
              } else {
                const actualSpeedX = fish.baseSpeedX * fish.speedMultiplier;
                const actualSpeedY = fish.baseSpeedY * fish.speedMultiplier;
                newX = fish.x + actualSpeedX;
                newY = fish.y + actualSpeedY;
              }
            } else {
              const actualSpeedX = fish.baseSpeedX * fish.speedMultiplier;
              const actualSpeedY = fish.baseSpeedY * fish.speedMultiplier;
              newX = fish.x + actualSpeedX;
              newY = fish.y + actualSpeedY;
            }

            if (newX <= 0 || newX + fish.size >= containerSize.width) {
              newBaseSpeedX = -newBaseSpeedX;
              newX = Math.max(0, Math.min(newX, containerSize.width - fish.size));
            }
            if (newY <= 0 || newY + fish.size >= containerSize.height) {
              newBaseSpeedY = -newBaseSpeedY;
              newY = Math.max(0, Math.min(newY, containerSize.height - fish.size));
            }

            return {
              ...fish,
              x: newX,
              y: newY,
              baseSpeedX: newBaseSpeedX,
              baseSpeedY: newBaseSpeedY,
            };
          });
        });

        setFoods(prevFoods =>
          prevFoods.filter(food => now - food.createdAt < 5000 && !food.eaten)
        );
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [containerSize, setFishes, setFoods]);

    const handleTankClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!feedingMode || !onTankClick || !containerRef?.current) return;
      
      e.stopPropagation();
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      onTankClick(x, y);
    };

    return (
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden relative ${feedingMode ? 'cursor-crosshair' : ''}`}
        style={{ background: backgroundColor, transition: 'background 0.5s ease' }}
        onClick={handleTankClick}
      >
        {/* 水面波纹效果 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/20 to-transparent animate-pulse" />
          <div
            className="absolute top-12 w-64 h-4 bg-white/10 rounded-full"
            style={{ left: '20%', animation: 'wave 3s ease-in-out infinite' }}
          />
          <div
            className="absolute top-20 w-48 h-3 bg-white/10 rounded-full"
            style={{ left: '60%', animation: 'wave 4s ease-in-out infinite 1s' }}
          />
        </div>

        {/* 气泡 */}
        <div className="absolute bottom-0 left-10 w-6 h-6 bg-white/50 rounded-full animate-bubble drop-shadow-lg" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-0 left-1/4 w-4 h-4 bg-white/40 rounded-full animate-bubble drop-shadow-lg" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/4 w-8 h-8 bg-white/45 rounded-full animate-bubble drop-shadow-lg" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-10 w-6 h-6 bg-white/50 rounded-full animate-bubble drop-shadow-lg" style={{ animationDelay: '3s' }} />

        {/* 食料 */}
        {foods.map((food) => {
          const foodColors: Record<string, string> = {
            '鱼食': '#FF6B6B',
            '虫子': '#4ECDC4',
            '虾米': '#FFE66D',
          };
          const foodColor = foodColors[food.foodType] || '#FF6B6B';
          
          // 计算食料存在的时间（毫秒）
          const age = Date.now() - food.createdAt;
          // 食料5秒内从顶部极其缓慢地下沉
          const sinkProgress = Math.min(age / 5000, 1);
          // 计算当前Y位置：从初始位置开始极其缓慢地下沉（从100像素降到20像素）
          const startY = food.startY ?? food.y;
          const currentY = startY + sinkProgress * 20;
          // 透明度逐渐降低
          const opacity = 1 - sinkProgress * 0.8;
          // 大小逐渐缩小
          const scale = 1 - sinkProgress * 0.3;

          return (
            <div
              key={food.id}
              className="absolute w-6 h-6 rounded-full shadow-lg z-10 transition-all"
              style={{
                left: food.x - 12,
                top: currentY - 12,
                backgroundColor: foodColor,
                opacity: opacity,
                transform: `scale(${scale})`,
              }}
            />
          );
        })}

        {/* 鱼 */}
        {fishes.map((fish) => {
          const actualSpeedX = fish.baseSpeedX * fish.speedMultiplier;
          const image = fishImages.get(fish.id);
          
          if (!image) return null;
          
          return (
            <div
              key={fish.id}
              className={`absolute transition-transform duration-100 ${feedingMode ? '' : 'cursor-pointer hover:scale-110'}`}
              onClick={(e) => {
                if (!feedingMode) {
                  e.stopPropagation();
                  onFishClick?.(fish.id, e);
                }
              }}
              style={{
                left: fish.x,
                top: fish.y,
                width: fish.size,
                height: fish.size * 0.6,
                transform: `scaleX(${actualSpeedX > 0 ? 1 : -1})`,
              }}
            >
              <img
                src={image}
                alt="fish"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          );
        })}
      </div>
    );
  }
);

FishTank.displayName = 'FishTank';

export default FishTank;
