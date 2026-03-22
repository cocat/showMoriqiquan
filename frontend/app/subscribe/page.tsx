'use client'

import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { ArrowRight, Check } from 'lucide-react'

function PageSkeleton() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-mentat-border bg-mentat-card p-8 space-y-4 animate-pulse">
        <div className="h-6 w-36 rounded bg-mentat-border" />
        <div className="h-4 w-56 rounded bg-mentat-border" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-mentat-border" />
          ))}
        </div>
        <div className="h-12 w-full rounded-lg bg-mentat-border" />
      </div>
    </div>
  )
}

export default function SubscribePage() {
  const { isLoaded, isSignedIn } = useAppAuth()

  if (!isLoaded) {
    return <PageSkeleton />
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-mentat-text mb-4">登录后继续阅读</h2>
          <p className="text-mentat-muted text-sm mb-6">登录后即可查看今日完整报告和历史内容</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-in?redirect_url=/reports/latest"
              className="inline-flex items-center justify-center px-6 py-3 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-mentat-border bg-mentat-card p-8">
        <h2 className="text-xl font-semibold text-mentat-text mb-2">继续阅读完整内容</h2>
        <p className="text-mentat-muted text-sm mb-6">你已登录，选择查看今日报告或历史报告。</p>
        <ul className="space-y-3 mb-8">
          {['完整日报所有模块', '历史报告回看', '情绪仪表盘 + 行情快照', '红黄预警 + 新闻简报'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-mentat-text-secondary text-sm">
              <Check className="w-4 h-4 text-mentat-success flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/reports/latest"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition"
        >
          查看今日报告
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/reports"
          className="block mt-4 text-center text-sm text-mentat-muted hover:text-mentat-text transition"
        >
          查看历史报告
        </Link>
      </div>
    </div>
  )
}
