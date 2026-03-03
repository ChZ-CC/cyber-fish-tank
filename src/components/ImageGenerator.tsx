'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Wand2, Lock } from 'lucide-react';

interface ImageGeneratorProps {
  onFishCreated: (image: string) => void;
  onClose: () => void;
  aiServiceEnabled: boolean;
}

export default function ImageGenerator({ onFishCreated, onClose, aiServiceEnabled }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    '一条橙色的小金鱼，圆滚滚的，游动',
    '红色的热带鱼，有美丽的花纹',
    '蓝色的鱼，尾巴像扇子一样',
    '色彩斑斓的鱼，在海里游泳',
  ];

  const generateImage = async () => {
    if (!prompt.trim()) return;
    if (!aiServiceEnabled) {
      setError('请先开启 AI 服务');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const response = await fetch('/api/generate-fish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();

      if (result.imageUrls && result.imageUrls.length > 0) {
        setGeneratedImage(result.imageUrls[0]);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('生成失败:', err);
      setError('生成图片失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (generatedImage) {
      onFishCreated(generatedImage);
      onClose();
    }
  };

  const selectExample = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-6 overflow-y-auto min-h-0">
      {/* AI 服务禁用提示 */}
      {!aiServiceEnabled && (
        <Alert className="lg:hidden bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 mb-4">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            AI 服务未开启。请在侧边栏开启"AI 服务"开关以使用文生图功能。
          </AlertDescription>
        </Alert>
      )}
      
      {/* 左侧：输入区域 */}
      <div className={`lg:w-[320px] lg:min-w-[320px] lg:flex-shrink-0 flex flex-col gap-5 ${!aiServiceEnabled ? 'opacity-50 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''}`}>
        {/* 宽屏下的AI服务禁用提示 */}
        {!aiServiceEnabled && (
          <Alert className="hidden lg:flex bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              AI 服务未开启。请在侧边栏开启开关。
            </AlertDescription>
          </Alert>
        )}
        
        <div>
          <Label htmlFor="prompt" className="text-base font-semibold mb-3 block text-slate-700 dark:text-slate-300">
            描述你想要的鱼
          </Label>
          <Textarea
            id="prompt"
            placeholder="例如：一条橙色的小金鱼，圆滚滚的，游动..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] text-base resize-none focus:ring-2 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
          />
        </div>

        {/* 示例提示 */}
        <div className="flex flex-col flex-1">
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
            示例提示（点击快速填入）：
          </Label>
          <div className="flex flex-col gap-2">
            {examplePrompts.map((example) => (
              <button
                key={example}
                onClick={() => selectExample(example)}
                className="text-left px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm border border-slate-200 dark:border-slate-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* 按钮区域 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12"
            size="lg"
          >
            取消
          </Button>
          <Button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim() || !aiServiceEnabled}
            className="flex-1 h-12 text-base gap-2"
            size="lg"
          >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              生成一条鱼
            </>
          )}
        </Button>
        </div>

        {/* 宽屏下的确认按钮 */}
        <div className="hidden lg:flex gap-3">
          {generatedImage && (
            <Button onClick={handleConfirm} className="flex-1 gap-2 h-10">
              <Sparkles className="w-4 h-4" />
              确认添加
            </Button>
          )}
        </div>
      </div>

      {/* 右侧：生成结果展示区域 */}
      <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0">
        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {generatedImage ? (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <Label className="text-base font-semibold hidden lg:block text-slate-700 dark:text-slate-300">生成结果</Label>
            <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center p-4">
              <img
                src={generatedImage}
                alt="生成的鱼"
                className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
              />
            </div>
            {/* 移动端确认按钮 */}
            <div className="flex lg:hidden justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="min-w-[100px]">
                取消
              </Button>
              <Button onClick={handleConfirm} className="min-w-[120px] gap-2">
                <Sparkles className="w-4 h-4" />
                确认添加
              </Button>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
              <div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  正在生成...
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  请稍候，这可能需要几秒钟
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-center space-y-4 p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto flex items-center justify-center shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  准备生成一条鱼
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {aiServiceEnabled ? '输入描述并点击生成按钮' : '请先开启 AI 服务'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
