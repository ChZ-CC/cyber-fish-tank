'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

interface ImageGeneratorProps {
  onFishCreated: (image: string) => void;
  onClose: () => void;
}

export default function ImageGenerator({ onFishCreated, onClose }: ImageGeneratorProps) {
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

  return (
    <div className="flex flex-col h-full gap-4">
      {/* 输入区域 */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="prompt">描述你想要的鱼</Label>
          <Textarea
            id="prompt"
            placeholder="例如：一条橙色的小金鱼，圆滚滚的，游动..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] mt-2"
          />
        </div>

        {/* 示例提示 */}
        <div>
          <Label className="text-sm text-gray-500 dark:text-gray-400">示例：</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {examplePrompts.map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              生成鱼
            </>
          )}
        </Button>
      </div>

      {/* 生成结果 */}
      {generatedImage && (
        <div className="flex-1 flex flex-col gap-4">
          <Label>生成结果</Label>
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={generatedImage}
              alt="生成的鱼"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleConfirm}>
              确认添加
            </Button>
          </div>
        </div>
      )}

      {!generatedImage && !isGenerating && (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-2" />
            <p>输入描述并点击生成</p>
          </div>
        </div>
      )}
    </div>
  );
}
