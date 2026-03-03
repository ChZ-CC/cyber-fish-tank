'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, Eraser, RefreshCw, Droplet, Pipette, Paintbrush } from 'lucide-react';

// 画布固定尺寸，宽高比 200:125 = 8:5
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

interface DrawingBoardProps {
  onFishCreated: (image: string) => void;
  onFishUpdated?: (image: string) => void;
  onClose: () => void;
  aiServiceEnabled: boolean;
  initialImage?: string;
}

export default function DrawingBoard({ onFishCreated, onFishUpdated, onClose, aiServiceEnabled, initialImage }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([5]);
  const [brushColor, setBrushColor] = useState('#FF6B6B');
  const [customColor, setCustomColor] = useState('#FF6B6B');
  const [isEraser, setIsEraser] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const commonColors = [
    '#FFFFFF', // 纯白色
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#FF5733', '#C70039', '#900C3F', '#581845'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置透明背景（不填充任何颜色）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 如果有初始图片，加载它（重新绘制场景）
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        // 将图片绘制铺满画布，保持比例
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      };
      img.src = initialImage;
    }
  }, [initialImage]);

  // 获取坐标的共享函数
  const getCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  // 开始绘制（共享逻辑）
  const startDrawingAt = (x: number, y: number) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // 绘制（共享逻辑）
  const drawAt = (x: number, y: number) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = brushSize[0];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraser) {
      // 橡皮擦：使用 destination-out 模式擦除为透明
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // 鼠标事件处理
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e.clientX, e.clientY);
    startDrawingAt(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e.clientX, e.clientY);
    drawAt(x, y);
  };

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch.clientX, touch.clientY);
    startDrawingAt(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch.clientX, touch.clientY);
    drawAt(x, y);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleTouchCancel = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布为透明背景
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 填充整个画布背景
  const fillBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 使用当前选中的颜色填充整个画布
    ctx.fillStyle = brushColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const pickColor = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e.clientX, e.clientY);
    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    setCustomColor(hex);
    setBrushColor(hex);
    setIsEraser(false);
  };

  // 开始取色模式
  const startPickColor = () => {
    setIsPickingColor(true);
  };

  // 结束取色模式
  const stopPickColor = () => {
    setIsPickingColor(false);
    setCursorPosition({ x: 0, y: 0 });
  };

  // 辅助函数：RGB 转 HEX
  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  };

  // 辅助函数：获取元素的计算颜色
  const getElementColor = (element: HTMLElement): string | null => {
    const computedStyle = window.getComputedStyle(element);
    const bgColor = computedStyle.backgroundColor;
    const color = computedStyle.color;

    // 优先使用背景色
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      // 支持 rgb() 和 rgba()
      const rgbMatch = bgColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        return rgbToHex(r, g, b);
      }
    }

    // 如果背景色不可用，使用文字颜色
    if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
      const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        return rgbToHex(r, g, b);
      }
    }

    return null;
  };

  // 使用 Canvas 获取颜色
  const getColorFromCanvas = (x: number, y: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const a = pixel[3];

      // 如果像素完全透明，返回 null
      if (a === 0) return null;

      return rgbToHex(r, g, b);
    } catch (e) {
      console.error('Error getting color from canvas:', e);
      return null;
    }
  };

  // 处理全局鼠标移动和点击
  useEffect(() => {
    if (!isPickingColor) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e: MouseEvent) => {
      if (!isPickingColor) return;

      e.preventDefault();
      e.stopPropagation();

      // 检查点击的元素是否在画布上
      const target = e.target as HTMLElement;
      const canvas = canvasRef.current;

      if (canvas && canvas.contains(target)) {
        // 从画布取色
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const color = getColorFromCanvas(x, y);
        if (color) {
          setCustomColor(color);
          setBrushColor(color);
          setIsEraser(false);
        }
      } else {
        // 从其他元素取色
        const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        if (element) {
          const color = getElementColor(element);
          if (color) {
            setCustomColor(color);
            setBrushColor(color);
            setIsEraser(false);
          }
        }
      }

      // 取色完成后结束取色模式
      stopPickColor();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        stopPickColor();
      }
    };

    // 在捕获阶段监听事件，确保能捕获所有点击
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true); // 使用捕获阶段
    document.addEventListener('keydown', handleEscape, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isPickingColor]);

  const analyzeDrawing = async () => {
    // 直接允许添加鱼，不再进行 AI 分析
    setAlertType('success');
    setAlertMessage('是否加入鱼缸？');
    setShowAlert(true);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 获取图像数据并转换为背景透明的格式
    const imageData = canvas.toDataURL('image/png');

    if (onFishUpdated) {
      // 更新现有鱼
      onFishUpdated(imageData);
    } else {
      // 添加新鱼
      onFishCreated(imageData);
    }

    setShowAlert(false);
    onClose();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-auto">
      {/* 左侧工具栏（宽屏）或顶部工具栏（移动端） */}
      <div className="lg:w-[240px] lg:min-w-[240px] flex-shrink-0 flex flex-col border-r border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate dark:from-slate-800 dark:to-slate-800/50">
        {/* 工具面板 - 可滚动区域 */}
        <div className="flex-1 overflow-auto flex flex-wrap lg:flex-col gap-4 p-5 flex-shrink-0">
          {/* 颜色选择 */}
          <div className="flex flex-col items-start gap-3 w-full">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">颜色</Label>
            <div className="flex gap-2 flex-wrap">
              {commonColors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setBrushColor(color);
                    setCustomColor(color);
                    setIsEraser(false);
                  }}
                  disabled={isPickingColor}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${brushColor === color && !isEraser
                      ? 'border-blue-500 scale-110 ring-2 ring-blue-500 ring-offset-2'
                      : color === '#FFFFFF'
                        ? 'border-slate-400 dark:border-slate-500 hover:border-slate-500'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    } ${isPickingColor ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}

              {/* 自定义颜色选择器 */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    disabled={isPickingColor}
                    className={`w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-700 hover:scale-110 transition-all shadow-sm ${!commonColors.includes(brushColor) && !isEraser ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      } ${isPickingColor ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: !isEraser && !commonColors.includes(brushColor) ? brushColor : undefined }}
                  >
                    <Droplet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="flex flex-col gap-3">
                    <Label className="text-sm font-semibold">选择颜色</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          setBrushColor(e.target.value);
                          setIsEraser(false);
                        }}
                        className="w-16 h-16 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-600"
                      />
                      <Input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          setBrushColor(e.target.value);
                          setIsEraser(false);
                        }}
                        placeholder="#FF6B6B"
                        className="w-28 font-mono uppercase"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* 取色器按钮 */}
              <button
                onClick={startPickColor}
                className={`w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-700 hover:scale-110 transition-all shadow-sm ${isPickingColor ? 'ring-2 ring-blue-500 scale-110 ring-offset-2' : ''
                  }`}
                title="取色器（点击后可在任意位置取色）"
              >
                <Pipette className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* 画笔粗细 */}
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-3 w-full">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">粗细</Label>
            <div className="flex items-center gap-2 flex-1 w-full">
              <Slider
                value={brushSize}
                onValueChange={setBrushSize}
                min={1}
                max={100}
                step={1}
                disabled={isPickingColor}
              />
              <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded w-10 text-center">{brushSize[0]}</span>
            </div>
          </div>

          <div className="block h-px w-full bg-slate-100 dark:bg-slate-600 my-1" />

          {/* 工具按钮 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={isEraser ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEraser(!isEraser)}
              className="gap-2 h-9 px-3"
              disabled={isPickingColor}
            >
              <Eraser className="w-4 h-4" />
              <span className="inline lg:hidden xl:inline text-sm">橡皮擦</span>
            </Button>
            <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-2 h-9 px-3" disabled={isPickingColor}>
              <RefreshCw className="w-4 h-4" />
              <span className="inline lg:hidden xl:inline text-sm">清空</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fillBackground}
              className="gap-2 h-9 px-3"
              disabled={isPickingColor}
              title="用当前颜色填充整个画布"
            >
              <Paintbrush className="w-4 h-4" />
              <span className="inline lg:hidden xl:inline text-sm">填充</span>
            </Button>
          </div>
        </div>

        {/* 底部固定按钮区域 */}
        <div className="flex-shrink-0 flex gap-3 p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10" disabled={isPickingColor}>
            取消
          </Button>
          <Button
            onClick={analyzeDrawing}
            disabled={isAnalyzing || isPickingColor}
            className="flex-1 gap-2 h-10"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {aiServiceEnabled ? '分析绘画' : '完成绘制'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 右侧画布区域 */}
      <div className="lg:flex-1 flex flex-col min-h-0 min-w-0 gap-4 items-center justify-center p-5 bg-slate dark:bg-slate-800/30 flex-shrink-0 mb-5">
        <div
          ref={canvasContainerRef}
          className="rounded-xl overflow-hidden relative shadow-inner flex items-center justify-center w-full max-w-full flex-shrink-0"
          style={{
            // 始终以 8:5 宽高比呈现，宽度不超出，高度可超出
            aspectRatio: '8 / 5',
            // 棋盘格背景表示透明区域
            backgroundImage: `
              linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
              linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
              linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            backgroundColor: '#f5f5f5'
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={`w-full h-full touch-none ${isPickingColor ? '' : 'cursor-crosshair'}`}
            onMouseDown={isPickingColor ? undefined : startDrawing}
            onMouseMove={isPickingColor ? undefined : draw}
            onMouseUp={isPickingColor ? undefined : stopDrawing}
            onMouseLeave={isPickingColor ? undefined : stopDrawing}
            onTouchStart={isPickingColor ? undefined : handleTouchStart}
            onTouchMove={isPickingColor ? undefined : handleTouchMove}
            onTouchEnd={isPickingColor ? undefined : handleTouchEnd}
            onTouchCancel={isPickingColor ? undefined : handleTouchCancel}
          />

          {/* 全屏遮罩层 - 取色模式 */}
          {isPickingColor && (
            <div
              className="fixed inset-0 bg-transparent cursor-none z-40"
              onMouseMove={(e) => {
                setCursorPosition({ x: e.clientX, y: e.clientY });
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                // 检查点击的元素是否在画布上
                const target = e.target as HTMLElement;
                const canvas = canvasRef.current;

                if (canvas && canvas.contains(target)) {
                  // 从画布取色
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;
                  const x = (e.clientX - rect.left) * scaleX;
                  const y = (e.clientY - rect.top) * scaleY;

                  const color = getColorFromCanvas(x, y);
                  if (color) {
                    setCustomColor(color);
                    setBrushColor(color);
                    setIsEraser(false);
                  }
                } else {
                  // 从其他元素取色
                  const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                  if (element) {
                    const color = getElementColor(element);
                    if (color) {
                      setCustomColor(color);
                      setBrushColor(color);
                      setIsEraser(false);
                    }
                  }
                }

                // 取色完成后结束取色模式
                stopPickColor();
              }}
            />
          )}

          {/* 虚线十字形光标 */}
          {isPickingColor && (
            <>
              {/* 水平线 */}
              <div
                className="fixed top-0 left-0 right-0 h-0 border-t-2 border-dashed border-slate-600 dark:border-slate-300 pointer-events-none z-50"
                style={{ top: cursorPosition.y }}
              />
              {/* 垂直线 */}
              <div
                className="fixed top-0 left-0 bottom-0 w-0 border-l-2 border-dashed border-slate-600 dark:border-slate-300 pointer-events-none z-50"
                style={{ left: cursorPosition.x }}
              />
              {/* 中心点 */}
              <div
                className="fixed w-4 h-4 border-2 border-slate-600 dark:border-slate-300 rounded-full pointer-events-none z-50"
                style={{
                  left: cursorPosition.x - 8,
                  top: cursorPosition.y - 8,
                }}
              />
              {/* 放大镜效果 - 显示当前位置的颜色预览 */}
              <div
                className="fixed w-24 h-24 rounded-full border-2 border-white shadow-lg overflow-hidden pointer-events-none z-50"
                style={{
                  left: cursorPosition.x + 16,
                  top: cursorPosition.y + 16,
                  backgroundColor: 'white',
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: customColor,
                  }}
                />
                {/* 放大镜中心标记 */}
                <div className="absolute top-1/2 left-1/2 w-2 h-2 border-2 border-black rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>
              {/* 提示文本 */}
              <div
                className="fixed px-2 py-1 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs rounded pointer-events-none z-50"
                style={{
                  left: cursorPosition.x + 12,
                  top: cursorPosition.y - 28,
                }}
              >
                点击取色 (ESC取消)
              </div>
            </>
          )}
        </div>
      </div>

      {/* 提示对话框 */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertType === 'success' ? (
                <span className="text-2xl">✨</span>
              ) : (
                <span className="text-2xl">🤔</span>
              )}
              {alertType === 'success' ? '绘制完成' : '识别失败'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertType === 'success' ? (
              <>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>
                  确定加入
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => setShowAlert(false)}>
                重新绘制
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
