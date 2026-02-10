'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, Eraser, Palette, RefreshCw, Droplet } from 'lucide-react';

interface DrawingBoardProps {
  onFishCreated: (image: string) => void;
  onClose: () => void;
  aiServiceEnabled: boolean;
}

export default function DrawingBoard({ onFishCreated, onClose, aiServiceEnabled }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([5]);
  const [brushColor, setBrushColor] = useState('#FF6B6B');
  const [customColor, setCustomColor] = useState('#FF6B6B');
  const [isEraser, setIsEraser] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const commonColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#FF5733', '#C70039', '#900C3F', '#581845'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

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
    ctx.strokeStyle = isEraser ? 'white' : brushColor;

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

    ctx.fillStyle = 'white';
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

  const analyzeDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 如果 AI 服务关闭，直接允许添加鱼
    if (!aiServiceEnabled) {
      setAlertType('success');
      setAlertMessage('绘制完成！是否加入鱼缸？');
      setShowAlert(true);
      return;
    }

    setIsAnalyzing(true);

    try {
      // 将 canvas 转换为 base64
      const imageData = canvas.toDataURL('image/png');

      // 调用后端 API 进行分析
      const response = await fetch('/api/analyze-fish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();

      if (result.isFish) {
        setAlertType('success');
        setAlertMessage('检测到这是一条鱼！是否加入鱼缸？');
        setShowAlert(true);
      } else {
        setAlertType('error');
        setAlertMessage('这看起来不是一条鱼，请重新绘制！');
        setShowAlert(true);
      }
    } catch (error) {
      setAlertType('error');
      setAlertMessage('分析失败，请重试');
      setShowAlert(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 获取图像数据并转换为背景透明的格式
    const imageData = canvas.toDataURL('image/png');
    onFishCreated(imageData);
    setShowAlert(false);
    onClose();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        {/* 画笔粗细 */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">粗细</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={brushSize}
              onValueChange={setBrushSize}
              min={1}
              max={50}
              step={1}
              className="w-32"
            />
            <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded w-10 text-center">{brushSize[0]}</span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600" />

        {/* 颜色选择 */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">颜色</Label>
          <div className="flex gap-2 flex-wrap">
            {commonColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setBrushColor(color);
                  setCustomColor(color);
                  setIsEraser(false);
                }}
                className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${
                  brushColor === color && !isEraser
                    ? 'border-blue-500 scale-110 ring-2 ring-blue-500 ring-offset-2'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`w-9 h-9 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-700 hover:scale-110 transition-all shadow-sm ${
                    !commonColors.includes(brushColor) && !isEraser ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: !isEraser && !commonColors.includes(brushColor) ? brushColor : undefined }}
                >
                  <Droplet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">选择颜色</Label>
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
                  <button
                    onClick={(e) => pickColor(e as any)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    从画布吸取颜色
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600" />

        {/* 工具按钮 */}
        <div className="flex gap-2">
          <Button
            variant={isEraser ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEraser(!isEraser)}
            className="gap-2"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">橡皮擦</span>
          </Button>
          <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">清空</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEraser(false)}
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">画笔</span>
          </Button>
        </div>
      </div>

      {/* 画布 */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden relative shadow-inner">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="bg-white cursor-crosshair w-full h-full touch-none"
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

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="min-w-[100px]">
          取消
        </Button>
        <Button
          onClick={analyzeDrawing}
          disabled={isAnalyzing}
          className="min-w-[120px] gap-2"
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
              {alertType === 'success' ? '识别成功' : '识别失败'}
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
