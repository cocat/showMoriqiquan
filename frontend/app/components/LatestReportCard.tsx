'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { ArrowRight, Bell, Mail, Sparkles } from 'lucide-react'

interface Summary {
  report_id: string
  report_date: string
  title?: string
  sentiment_score?: number
  sentiment_level?: string
  red_count?: number
  yellow_count?: number
  item_count?: number
}

const levelColor = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '#FF4444'
    case 'alert':  return '#D4A55A'
    case 'watch':  return '#C19A6B'
    default:       return '#4CAF50'
  }
}

/** 空状态：纯订阅钩子，不混入归档 */
function EmptyStateSubscriptionFirst() {
  return (
    <div className="rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-mentat-bg-gradient-start via-mentat-bg-elevated to-mentat-bg-section p-8 sm:p-10 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold/15 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold/10 blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>
      <div className="relative">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/20 mb-5">
          <Sparkles className="w-7 h-7 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">今日报告即将生成</h3>
        <p className="text-mentat-text-secondary text-sm max-w-[300px] mx-auto mb-6 leading-relaxed">
          每日早 8 点送达，一份报告覆盖情绪、预警、新闻与策略。订阅后第一时间推送，内测免费。
        </p>
        <Link
          href="/reports/latest"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-mentat-bg-page rounded-xl text-base font-semibold hover:bg-gold-hover transition-colors shadow-[0_4px_20px_rgba(193,154,107,0.3)]"
        >
          <Mail className="w-5 h-5" />
          免费订阅，抢先接收
        </Link>
      </div>
    </div>
  )
}

export default function LatestReportCard({ data: dataProp }: { data?: Summary | null }) {
  const { getToken } = useAppAuth()
  const [data, setData] = useState<Summary | null>(dataProp ?? null)
  const [loading, setLoading] = useState(dataProp === undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (dataProp !== undefined) {
      setData(dataProp ?? null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getToken().then((token) => {
      if (cancelled) return
      reportsApi
        .latestSummary(token)
        .then((d) => { if (!cancelled) setData(d) })
        .catch(() => { if (!cancelled) setError(true) })
        .finally(() => { if (!cancelled) setLoading(false) })
    })
    return () => { cancelled = true }
  }, [dataProp, getToken])

  if (loading) {
    return (
      <div className="rounded-lg border border-mentat-border bg-mentat-card p-6 animate-pulse">
        <div className="h-3 w-28 bg-mentat-border rounded mb-3" />
        <div className="h-5 w-72 bg-mentat-border rounded mb-5" />
        <div className="h-1.5 bg-mentat-border rounded mb-2" />
        <div className="flex gap-4 mt-4">
          <div className="h-4 w-20 bg-mentat-border rounded" />
          <div className="h-4 w-20 bg-mentat-border rounded" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <EmptyStateSubscriptionFirst />
  }

  const color = levelColor(data.sentiment_level)
  const gaugePercent = data.sentiment_score != null
    ? Math.min(100, Math.max(0, data.sentiment_score))
    : null

  return (
    <div
      className="rounded-2xl border-2 border-gold/30 bg-gradient-to-br from-mentat-bg-elevated to-mentat-bg-card overflow-hidden transition-all duration-200 hover:border-gold/50 hover:shadow-[0_8px_32px_rgba(193,154,107,0.15)] group"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <Link href={`/reports/${data.report_date}`} className="block p-6 pb-0 group/link">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-mentat-muted font-mono mb-1.5 uppercase tracking-wider">
              {data.report_date} · 最新报告
            </div>
            <h3 className="text-mentat-text font-semibold text-base leading-snug">
              {data.title || `${data.report_date} 市场情报日报`}
            </h3>
          </div>
          {data.sentiment_score != null && (
            <div className="text-right flex-shrink-0">
              <div className="text-4xl font-bold font-mono leading-none" style={{ color }}>
                {data.sentiment_score}
              </div>
              <div className="text-[10px] text-mentat-muted mt-1 uppercase tracking-wider">情绪指数</div>
            </div>
          )}
        </div>

        {gaugePercent != null && (
          <div className="mb-5">
            <div
              className="h-1 rounded-full overflow-hidden relative"
              style={{
                background:
                  'linear-gradient(to right, #4CAF50 0%, #4CAF50 30%, #C19A6B 30%, #C19A6B 55%, #D4A55A 55%, #D4A55A 75%, #FF4444 75%, #FF4444 100%)',
              }}
            >
              <div
                className="absolute w-3 h-3 rounded-full bg-white border-2 border-mentat-bg shadow transition-all duration-700"
                style={{
                  left: `${gaugePercent}%`,
                  top: '50%',
                  transform: 'translateX(-50%) translateY(-50%)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-mentat-muted-tertiary font-mono mt-1.5">
              <span>0 平静</span>
              <span>50 警戒</span>
              <span>100 危险</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          {(data.red_count ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-mentat-danger flex-shrink-0" />
              <span className="text-mentat-danger font-medium">{data.red_count}</span>
              <span className="text-mentat-muted">重大预警</span>
            </span>
          )}
          {(data.yellow_count ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-mentat-warning flex-shrink-0" />
              <span className="text-mentat-warning font-medium">{data.yellow_count}</span>
              <span className="text-mentat-muted">重要预警</span>
            </span>
          )}
          {data.item_count != null && (
            <span className="text-sm text-mentat-muted">{data.item_count} 条信号</span>
          )}
          <span className="ml-auto flex items-center gap-1 text-gold text-sm group-hover/link:gap-2 transition-all">
            查看完整报告
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
      <div className="px-6 py-4 border-t border-mentat-border-weak/80 flex items-center justify-between gap-3 bg-mentat-bg-elevated/50">
        <span className="text-xs text-mentat-text-secondary">每日早 8 点送达 · 内测免费</span>
        <Link
          href="/reports/latest"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/15 text-gold text-sm font-medium hover:bg-gold/25 transition-colors"
        >
          <Bell className="w-4 h-4" />
          订阅每日报告
        </Link>
      </div>
    </div>
  )
}
