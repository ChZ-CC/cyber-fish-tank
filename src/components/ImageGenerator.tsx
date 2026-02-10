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

  const examplePrompts = [
    '一条橙色的小金鱼，圆滚滚的，游动',
    '红色的热带鱼，有美丽的花纹',
    '蓝色的鱼，尾巴像扇子一样',
    '色彩斑斓的鱼，在海里游泳',
  ];

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImage(null);

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
      }
    } catch (error) {
      console.error('生成失败:', error);
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
    <div className="flex flex-col h-full gap-6">
      {/* AI 服务禁用提示 */}
      {!aiServiceEnabled && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            AI 服务未开启。请在右上角开启"AI 服务"开关以使用文生图功能。
          </AlertDescription>
        </Alert>
      )}
      {/* 输入区域 */}
      <div className={`space-y-4 ${!aiServiceEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <Label htmlFor="prompt" className="text-base font-medium mb-2 block">
            描述你想要的鱼
          </Label>
          <Textarea
            id="prompt"
            placeholder="例如：一条橙色的小金鱼，圆滚滚的，游动..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] text-base resize-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 示例提示 */}
        <div>
          <Label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
            示例提示（点击快速填入）：
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

        {/* 生成按钮 */}
        <Button
          onClick={generateImage}
          disabled={isGenerating || !prompt.trim()}
          className="w-full h-12 text-base gap-2"
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
              生成鱼的图像
            </>
          )}
        </Button>
      </div>

      {/* 生成结果 */}
      {generatedImage && (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <Label className="text-base font-medium">生成结果</Label>
          <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center p-4 min-h-[300px]">
            <img
              src={generatedImage}
              alt="生成的鱼"
              className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              取消
            </Button>
            <Button onClick={handleConfirm} className="min-w-[120px] gap-2">
              <Sparkles className="w-4 h-4" />
              确认添加
            </Button>
          </div>
        </div>
      )}

      {!generatedImage && !isGenerating && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                准备生成一条鱼
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                输入描述并点击生成按钮
              </p>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex-1 flex items-center justify-center">
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
      )}
    </div>
  );
}
