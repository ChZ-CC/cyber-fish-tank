// 鱼的持久化数据结构（不包含位置和速度等动画数据）
export interface FishPersistData {
  id: string;
  imageId: string;
  size: number;
  baseSpeedX: number;
  baseSpeedY: number;
  speedMultiplier: number;
  name: string;
}

// 鱼的运行时数据结构（包含动画状态）
export interface MyFish extends FishPersistData {
  x: number;
  y: number;
}

// 食物数据结构
export interface Food {
  id: string;
  x: number;
  y: number;
  eaten: boolean;
  foodType: string;
  createdAt: number;
  startY?: number;
}
