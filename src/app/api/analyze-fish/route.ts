import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: '请提供图像' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      {
        role: 'system' as const,
        content: '你是一个图像识别专家。请分析用户上传的图像，判断它是否是一条鱼。如果是一条鱼，请返回 JSON 格式：{"isFish": true, "reason": "为什么这是一条鱼"}。如果不是鱼，请返回：{"isFish": false, "reason": "为什么不是鱼"}。只返回 JSON，不要其他内容。',
      },
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: '请分析这张图，判断它是否是一条鱼。' },
          {
            type: 'image_url' as const,
            image_url: {
              url: image,
              detail: 'high' as const,
            },
          },
        ],
      },
    ];

    const response = await client.invoke(
      messages,
      {
        model: 'doubao-seed-1-6-vision-250815',
        temperature: 0.3,
      },
      undefined,
      customHeaders
    );

    // 解析响应
    let result;
    try {
      const cleanedContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
      result = JSON.parse(cleanedContent);
    } catch (error) {
      // 如果解析失败，使用简单的关键词匹配
      const content = response.content.toLowerCase();
      result = {
        isFish: content.includes('是鱼') || content.includes('fish'),
        reason: response.content,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('分析图像失败:', error);
    return NextResponse.json(
      { error: '分析失败，请重试', isFish: false },
      { status: 500 }
    );
  }
}
