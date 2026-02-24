import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '赛博养鱼',
    template: '%s | 赛博养鱼',
  },
  description: '打造你的专属虚拟鱼缸，体验赛博风格的养鱼乐趣。',
  keywords: [
    '赛博养鱼',
    '虚拟鱼缸',
    '养鱼游戏',
    '鱼缸模拟',
  ],
  authors: [{ name: 'Coze Code Team', url: 'https://code.coze.cn' }],
  generator: 'Coze Code',
  icons: {
    icon: '/fish-icon.svg',
    apple: '/fish-icon.svg',
  },
  openGraph: {
    title: '赛博养鱼 | 打造你的专属虚拟鱼缸',
    description: '体验赛博风格的养鱼乐趣，打造你的专属虚拟鱼缸。',
    url: 'https://code.coze.cn',
    siteName: '赛博养鱼',
    locale: 'zh_CN',
    type: 'website',
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Coze Code | Your AI Engineer is Here',
  //   description:
  //     'Build and deploy full-stack applications through AI conversation. No env setup, just flow.',
  //   // images: [''],
  // },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
