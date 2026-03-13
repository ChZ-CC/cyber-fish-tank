'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, Eraser, RefreshCw, Droplet, Paintbrush, Pipette } from 'lucide-react';

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
  const [isEraser, setIsEraser] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    setBrushColor(hex);
    setIsEraser(false);
  };

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
        <div className="flex-1 overflow-auto flex flex-col gap-5 p-5 flex-shrink-0">
          {/* 颜色选择 */}
          <div className="flex flex-col items-start gap-3 w-full">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">颜色</Label>
            <div className="flex lg:flex-col flex-row gap-3 w-full">
              {/* 色块和颜色代码输入框 */}
              <div className="flex flex-col lg:flex-row items-center gap-3 flex-1 pb-3">
                <div className="relative group">
                  {/* 系统颜色选择器 */}
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => {
                      setBrushColor(e.target.value);
                      setIsEraser(false);
                    }}
                    className="w-16 h-16 rounded-lg cursor-pointer opacity-0 absolute inset-0 z-10"
                    title="打开系统颜色选择器"
                  />
                  {/* 颜色色块 */}
                  <div
                    className={`w-16 h-16 rounded-lg border-2 border-slate-300 dark:border-slate-600 shadow-sm transition-all group-hover:scale-105 ${!commonColors.includes(brushColor) && !isEraser ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                      }`}
                    style={{ backgroundColor: !isEraser ? brushColor : '#FFFFFF' }}
                  />
                </div>
                {/* 颜色代码输入框 */}
                <Input
                  type="text"
                  value={brushColor}
                  onChange={(e) => {
                    setBrushColor(e.target.value);
                    setIsEraser(false);
                  }}
                  placeholder="#FF6B6B"
                  className="fg:flex-1 font-mono text-sm text-slate-500 uppercase min-w-[80px] "
                />
              </div>
              {/* 颜色列表 */}
              <div className="flex gap-2 flex-wrap fg:flex-1">
                {commonColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setBrushColor(color);
                      setIsEraser(false);
                    }}

                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${brushColor === color && !isEraser
                      ? 'border-blue-400 scale-110 ring-2 ring-blue-400 ring-offset-2'
                      : color === '#FFFFFF'
                        ? 'border-slate-400 dark:border-slate-500 hover:border-slate-500'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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

              />
              <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded w-10 text-center">{brushSize[0]}</span>
            </div>
          </div>

          {/* <div className="block h-px w-full bg-slate-100 dark:bg-slate-600 my-1" /> */}

          {/* 工具按钮 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={isEraser ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEraser(!isEraser)}
              className="gap-2 h-9 px-3"
              title="切换到橡皮擦工具"
            >
              <Eraser className="w-4 h-4" />
              <span className="inline text-sm">橡皮擦</span>
            </Button>
            <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-2 h-9 px-3" >
              <RefreshCw className="w-4 h-4" />
              <span className="inline text-sm">清空</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fillBackground}
              className="gap-2 h-9 px-3"
              title="用当前颜色填充整个画布"
            >
              <Paintbrush className="w-4 h-4" />
              <span className="inline text-sm">填充</span>
            </Button>
          </div>
        </div>

        {/* 底部固定按钮区域 */}
        <div className="flex-shrink-0 flex gap-3 p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10" >
            取消
          </Button>
          <Button
            onClick={analyzeDrawing}
            disabled={isAnalyzing}
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
      <div className="lg:flex-1 flex flex-col min-h-0 min-w-0 gap-4 items-center justify-start p-5 bg-slate dark:bg-slate-800/30 flex-shrink-0 mb-5 overflow-y-auto">
        <div className="w-full max-w-full">
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
              className="w-full h-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
            />

          </div>
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