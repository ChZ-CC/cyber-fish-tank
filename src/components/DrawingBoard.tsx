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
}

export default function DrawingBoard({ onFishCreated, onClose }: DrawingBoardProps) {
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize[0];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? 'white' : brushColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
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

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    setCustomColor(hex);
    setBrushColor(hex);
    setIsEraser(false);
  };

  const analyzeDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {/* 画笔粗细 */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">粗细</Label>
          <Slider
            value={brushSize}
            onValueChange={setBrushSize}
            min={1}
            max={50}
            step={1}
            className="w-24"
          />
          <span className="text-sm w-8">{brushSize[0]}</span>
        </div>

        {/* 颜色选择 */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">颜色</Label>
          <div className="flex gap-1">
            {commonColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setBrushColor(color);
                  setCustomColor(color);
                  setIsEraser(false);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  brushColor === color && !isEraser
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center bg-white dark:bg-gray-700`}
                >
                  <Droplet className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm">选择颜色</Label>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setBrushColor(e.target.value);
                      setIsEraser(false);
                    }}
                    className="w-16 h-16 cursor-pointer"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setBrushColor(e.target.value);
                        setIsEraser(false);
                      }}
                      placeholder="#FF6B6B"
                      className="w-24"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 工具按钮 */}
        <div className="flex gap-2">
          <Button
            variant={isEraser ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEraser(!isEraser)}
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEraser(false);
            }}
          >
            <Palette className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 画布 */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button
          onClick={analyzeDrawing}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? '分析中...' : '完成'}
          <Check className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* 提示对话框 */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertType === 'success' ? '识别成功' : '识别失败'}
            </AlertDialogTitle>
            <AlertDialogDescription>
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
