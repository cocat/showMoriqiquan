import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'
import GoogleAnalytics from './components/GoogleAnalytics'
import { Providers } from './providers'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mentat.hk'),
  title: 'Mentat Vision - 美股与国际金融中文前瞻',
  description: '面向海外华人的美股与国际金融中文前瞻平台，聚焦盘前风险、宏观驱动、美元与美债、科技股与主题板块。',
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
          <footer className="border-t border-mentat-border/70 bg-[#111214] py-5 text-center text-mentat-muted text-sm">
            北京优斯莱斯科技有限公司 · mentat vision
          </footer>
        </Providers>
      </body>
    </html>
  )
}
