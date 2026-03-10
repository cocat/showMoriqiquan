import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'mentat vision - 市场情报日报',
  description: 'mentat vision 市场情报日报展示系统 · 北京优斯莱斯科技有限公司',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#1A1A1B] text-[#E5E5E5] antialiased flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#3A3A3A] py-4 text-center text-[#666] text-sm">
          北京优斯莱斯科技有限公司 · mentat vision
        </footer>
      </body>
    </html>
  )
}
