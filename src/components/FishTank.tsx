'use client';

import { forwardRef, useEffect, useState, Dispatch, SetStateAction } from 'react';

interface Fish {
  id: string;
  x: number;
  y: number;
  size: number;
  image: string;
  baseSpeedX: number;
  baseSpeedY: number;
  speedMultiplier: number;
}

interface Food {
  id: string;
  x: number;
  y: number;
  eaten: boolean;
  foodType: string;
  createdAt: number;
}

interface FishTankProps {
  fishes: Fish[];
  setFishes: Dispatch<SetStateAction<Fish[]>>;
  foods: Food[];
  setFoods: Dispatch<SetStateAction<Food[]>>;
  backgroundColor: string;
  onFishClick?: (fishId: string, e: React.MouseEvent) => void;
}

const FishTank = forwardRef<HTMLDivElement, FishTankProps>(
  ({ fishes, setFishes, foods, setFoods, backgroundColor, onFishClick }, ref) => {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = (ref as React.RefObject<HTMLDivElement>) || null;

    useEffect(() => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }, [containerRef]);

    useEffect(() => {
      const interval = setInterval(() => {
        // 清理超过3秒的食料
        const now = Date.now();
        setFoods((prevFoods) =>
          prevFoods.filter((food) => now - food.createdAt < 3000 && !food.eaten)
        );

        setFishes((prevFishes) => {
          const uneatenFoods = foods.filter((f) => !f.eaten);

          return prevFishes.map((fish) => {
            // 计算实际速度：基础速度 * 速度倍率
            const actualSpeedX = fish.baseSpeedX * fish.speedMultiplier;
            const actualSpeedY = fish.baseSpeedY * fish.speedMultiplier;

            let newX = fish.x + actualSpeedX;
            let newY = fish.y + actualSpeedY;
            let newBaseSpeedX = fish.baseSpeedX;
            let newBaseSpeedY = fish.baseSpeedY;
            let newSize = fish.size;

            // 边界碰撞检测
            if (newX <= 0 || newX + fish.size >= containerSize.width) {
              newBaseSpeedX = -newBaseSpeedX;
              newX = Math.max(0, Math.min(newX, containerSize.width - fish.size));
            }
            if (newY <= 0 || newY + fish.size >= containerSize.height) {
              newBaseSpeedY = -newBaseSpeedY;
              newY = Math.max(0, Math.min(newY, containerSize.height - fish.size));
            }

            // 食料吸引逻辑
            if (uneatenFoods.length > 0) {
              let nearestFood = uneatenFoods[0];
              let minDistance = Infinity;

              for (const food of uneatenFoods) {
                const dist = Math.sqrt(
                  Math.pow(food.x - (fish.x + fish.size / 2), 2) +
                    Math.pow(food.y - (fish.y + fish.size / 2), 2)
                );
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestFood = food;
                }
              }

              const angle = Math.atan2(
                nearestFood.y - (fish.y + fish.size / 2),
                nearestFood.x - (fish.x + fish.size / 2)
              );

              newBaseSpeedX += Math.cos(angle) * 0.3;
              newBaseSpeedY += Math.sin(angle) * 0.3;

              // 限制基础速度
              const maxBaseSpeed = 5;
              const baseSpeed = Math.sqrt(newBaseSpeedX ** 2 + newBaseSpeedY ** 2);
              if (baseSpeed > maxBaseSpeed) {
                newBaseSpeedX = (newBaseSpeedX / baseSpeed) * maxBaseSpeed;
                newBaseSpeedY = (newBaseSpeedY / baseSpeed) * maxBaseSpeed;
              }

              // 检测是否吃到食料
              const distanceToFood = Math.sqrt(
                Math.pow(nearestFood.x - (fish.x + fish.size / 2), 2) +
                  Math.pow(nearestFood.y - (fish.y + fish.size / 2), 2)
              );

              if (distanceToFood < fish.size / 2 + 10) {
                // 标记食料为已吃掉
                setFoods((prevFoods) =>
                  prevFoods.map((f) =>
                    f.id === nearestFood.id ? { ...f, eaten: true } : f
                  )
                );
                // 鱼的体积增加
                newSize = Math.min(fish.size * 1.1, 150); // 最大150px
              }
            }

            return {
              ...fish,
              x: newX,
              y: newY,
              baseSpeedX: newBaseSpeedX,
              baseSpeedY: newBaseSpeedY,
              size: newSize,
            };
          });
        });
      }, 50);

      return () => clearInterval(interval);
    }, [fishes, foods, containerSize, setFishes, setFoods]);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full rounded-3xl overflow-hidden border-8 border-gray-700 shadow-2xl"
        style={{ backgroundColor, transition: 'background-color 0.5s ease' }}
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
        <div className="absolute bottom-0 left-10 w-3 h-3 bg-white/30 rounded-full animate-bubble" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bubble" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 right-1/4 w-4 h-4 bg-white/30 rounded-full animate-bubble" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-10 w-3 h-3 bg-white/30 rounded-full animate-bubble" style={{ animationDelay: '3s' }} />

        {/* 食料 */}
        {foods.map((food) => {
          const foodColors: Record<string, string> = {
            '鱼食': '#FF6B6B',
            '虫子': '#4ECDC4',
            '虾米': '#FFE66D',
          };
          const foodColor = foodColors[food.foodType] || '#FF6B6B';

          return (
            <div
              key={food.id}
              className="absolute w-6 h-6 rounded-full shadow-lg animate-float z-10"
              style={{
                left: food.x - 12,
                top: food.y - 12,
                backgroundColor: foodColor,
                transform: `translateY(${Math.sin(Date.now() / 500 + food.x) * 5}px)`,
              }}
            />
          );
        })}

        {/* 鱼 */}
        {fishes.map((fish) => {
          const actualSpeedX = fish.baseSpeedX * fish.speedMultiplier;
          return (
            <div
              key={fish.id}
              className="absolute transition-transform duration-100 cursor-pointer hover:scale-110"
              onClick={(e) => onFishClick?.(fish.id, e)}
              style={{
                left: fish.x,
                top: fish.y,
                width: fish.size,
                height: fish.size * 0.6,
                transform: `scaleX(${actualSpeedX > 0 ? 1 : -1})`,
              }}
            >
              <img
                src={fish.image}
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
