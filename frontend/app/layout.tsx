import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'
import GoogleAnalytics from './components/GoogleAnalytics'
import { Providers } from './providers'

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
      <body className="min-h-screen bg-mentat-bg text-mentat-text antialiased flex flex-col" suppressHydrationWarning>
        <GoogleAnalytics />
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
        <footer className="border-t border-mentat-border py-4 text-center text-mentat-muted text-sm">
          北京优斯莱斯科技有限公司 · mentat vision
        </footer>
        </Providers>
      </body>
    </html>
  )
}
