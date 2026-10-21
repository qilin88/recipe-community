import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'食光 · 把热爱做成一道好菜',description:'发现创意美食，分享完整食谱与厨房日常，与同样热爱美食的人相遇。',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
