import Link from 'next/link'
import { TrendingUp, Shield, Zap } from 'lucide-react'
import { NavAuthButtons, HeroAuthButtons, ObserverCardButton } from './components/AuthButtons'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#1A1A1B' }}>
      <nav className="border-b border-[#3A3A3A] bg-[#1A1A1B]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-[#C19A6B]" />
              <span className="text-lg font-bold text-[#E5E5E5]">mentat vision</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/reports" className="text-[#999] hover:text-[#E5E5E5]">报告</Link>
              <NavAuthButtons />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#E5E5E5] mb-4">市场情报，触手可及</h1>
          <p className="text-[#999] mb-8 max-w-xl mx-auto">
            按日期浏览日报，情绪仪表盘、市场行情、核心预警、新闻简报，一站式展示
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <HeroAuthButtons />
            <Link href="/reports" className="px-8 py-3 border-2 border-[#3A3A3A] text-[#E5E5E5] rounded hover:border-[#C19A6B] transition font-medium">
              浏览报告
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg">
            <div className="w-12 h-12 bg-[#C19A6B]/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[#C19A6B]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[#E5E5E5]">按日浏览</h3>
            <p className="text-[#999] text-sm">月历视图高亮有报告的日期，点击即可查看当日报告</p>
          </div>
          <div className="p-6 bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg">
            <div className="w-12 h-12 bg-[#C19A6B]/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#C19A6B]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[#E5E5E5]">分级权限</h3>
            <p className="text-[#999] text-sm">访客看最新1篇，注册用户看7天，付费用户看全部历史</p>
          </div>
          <div className="p-6 bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg">
            <div className="w-12 h-12 bg-[#C19A6B]/20 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-[#C19A6B]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[#E5E5E5]">Mentat 设计</h3>
            <p className="text-[#999] text-sm">深色主题 + 金色强调，复现 HTML 报告视觉体验</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-[#E5E5E5]">选择方案</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-[#E5E5E5]">访客</h3>
              <p className="text-[#999] mb-4 text-sm">免费浏览</p>
              <ul className="space-y-2 text-sm text-[#999]">
                <li>✓ 最新 1 篇报告</li>
                <li>✓ 标题 + 情绪 + 前 5 条预警</li>
                <li>✗ 无历史记录</li>
              </ul>
            </div>
            <div className="p-6 bg-[#1E1E1F] border-l-4 border-[#C19A6B] border border-[#3A3A3A] rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-[#E5E5E5]">观察者</h3>
                <span className="px-2 py-0.5 bg-[#C19A6B]/20 text-[#C19A6B] text-xs rounded">推荐</span>
              </div>
              <p className="text-[#999] mb-4 text-sm">免费注册</p>
              <ul className="space-y-2 text-sm text-[#999]">
                <li>✓ 完整报告内容</li>
                <li>✓ 最近 7 天历史</li>
                <li>✗ 无推送通知</li>
              </ul>
              <ObserverCardButton />
            </div>
            <div className="p-6 bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-[#E5E5E5]">追踪者</h3>
              <p className="text-[#999] mb-4 text-sm">订阅制</p>
              <ul className="space-y-2 text-sm text-[#999]">
                <li>✓ 全部历史报告</li>
                <li>✓ 紧急推送通知</li>
                <li>✓ 防刷保护</li>
              </ul>
              <button className="w-full mt-4 px-4 py-2 border border-[#3A3A3A] text-[#999] rounded hover:border-[#C19A6B] transition text-sm">
                即将开放
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
