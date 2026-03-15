'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { ArrowRight, Bell, CalendarDays, AlertTriangle, BarChart2, History } from 'lucide-react'

interface LatestSummary {
  report_id: string
  report_date: string
  title?: string
  sentiment_score?: number
  sentiment_level?: string
  red_count?: number
  yellow_count?: number
  item_count?: number
}

const levelLabel = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '危险'
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平静'
  }
}

export default function LatestReportPage() {
  const { getToken } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState<LatestSummary | null>(null)
  const [overviewExcerpt, setOverviewExcerpt] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getToken().then((token) => {
      if (cancelled) return
      reportsApi
        .latestSummaryBundle(token)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((d: any) => {
          if (cancelled) return
          const report = d?.report
          const next = report && typeof report === 'object' && report.report_date != null ? report as LatestSummary : null
          setLatest(next)
          setOverviewExcerpt(typeof d?.overview_teaser === 'string' ? d.overview_teaser : '')
        })
        .catch(() => {
          if (cancelled) {
            return
          }
          setLatest(null)
          setOverviewExcerpt('')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    })
    return () => { cancelled = true }
  }, [getToken])

  const detailHref = useMemo(() => {
    if (!latest?.report_date) return '/reports'
    return `/reports/${latest.report_date}`
  }, [latest])

  return (
    <div className="min-h-screen bg-mentat-bg-page">
      <section className="border-b border-mentat-border-section bg-gradient-to-b from-mentat-bg-gradient-start to-mentat-bg-page">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-[11px] text-gold font-mono uppercase tracking-[0.15em]">
            <CalendarDays className="w-3.5 h-3.5" />
            latest module
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            最新报告
          </h1>
          <p className="mt-2 text-sm text-mentat-text-secondary max-w-2xl">
            只看今天这份，面向当日判断。历史检索请进入报告归档模块。
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Link
              href={detailHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
            >
              阅读最新完整版
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-mentat-border text-mentat-text rounded-lg text-sm hover:bg-mentat-bg-card transition-colors"
            >
              去报告归档
              <History className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="rounded-2xl border border-mentat-border-card bg-mentat-bg-card p-6 animate-pulse">
            <div className="h-3 w-32 rounded bg-mentat-border-card mb-3" />
            <div className="h-8 w-2/3 rounded bg-mentat-border-card mb-5" />
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="h-20 rounded-xl bg-mentat-border-card" />
              <div className="h-20 rounded-xl bg-mentat-border-card" />
              <div className="h-20 rounded-xl bg-mentat-border-card" />
              <div className="h-20 rounded-xl bg-mentat-border-card" />
            </div>
          </div>
        ) : latest ? (
          <div className="rounded-2xl border border-gold/35 bg-gradient-to-b from-mentat-bg-elevated to-mentat-bg-card overflow-hidden">
            <div className="px-6 py-5 border-b border-mentat-border-card">
              <div className="text-[11px] text-mentat-muted-secondary font-mono uppercase tracking-[0.12em]">
                {latest.report_date}
              </div>
              <h2 className="text-xl font-semibold text-white mt-1">
                {latest.title || `${latest.report_date} 市场情报日报`}
              </h2>
              <p className="text-sm text-mentat-text-secondary mt-2">
                当日核心信号已压缩在本篇，建议先看最新，再决定是否回看归档。
              </p>
            </div>

            <div className="px-6 py-5 grid sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">Sentiment</div>
                <div className="text-lg font-mono text-gold">{latest.sentiment_score ?? '--'}</div>
                <div className="text-xs text-mentat-muted-secondary">{levelLabel(latest.sentiment_level)}</div>
              </div>
              <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">Signals</div>
                <div className="text-lg font-mono text-white">{latest.item_count ?? 0}</div>
                <div className="text-xs text-mentat-muted-secondary inline-flex items-center gap-1">
                  <BarChart2 className="w-3 h-3" />
                  当日信号数
                </div>
              </div>
              <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">Red Alerts</div>
                <div className="text-lg font-mono text-mentat-danger">{latest.red_count ?? 0}</div>
                <div className="text-xs text-mentat-muted-secondary inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  重大预警
                </div>
              </div>
              <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">Yellow Alerts</div>
                <div className="text-lg font-mono text-mentat-warning">{latest.yellow_count ?? 0}</div>
                <div className="text-xs text-mentat-muted-secondary inline-flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  重要预警
                </div>
              </div>
            </div>

            {overviewExcerpt && (
              <div className="px-6 pb-5">
                <div className="rounded-xl border border-gold/20 bg-gold/10 p-4">
                  <div className="text-[11px] text-gold font-medium uppercase tracking-[0.12em] mb-1">AI 摘要</div>
                  <p className="text-sm text-mentat-text-secondary leading-relaxed">{overviewExcerpt}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-mentat-border-card bg-mentat-bg-card p-8 text-center">
            <p className="text-mentat-text-secondary mb-4">当前还没有可展示的最新报告</p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-mentat-border text-mentat-text rounded-lg text-sm hover:bg-mentat-bg-page transition-colors"
              >
                查看归档
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
              >
                免费订阅
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
