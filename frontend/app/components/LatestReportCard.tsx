'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { ArrowRight, Bell, Mail, Sparkles, FileText, AlertTriangle, Layers, Radio } from 'lucide-react'

interface Summary {
  report_id: string
  report_date: string
  title?: string
  sentiment_score?: number
  sentiment_level?: string
  red_count?: number
  yellow_count?: number
  item_count?: number
  topic_count?: number
  multi_source_count?: number
}

interface LatestReportCardProps {
  data?: Summary | null
  /** AI 解析摘要（overview 前几段），用于吸引点击完整报告 */
  aiTeaser?: string | null
}

const levelColor = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '#FF4444'
    case 'alert': return '#D4A55A'
    case 'watch': return '#C19A6B'
    default: return '#4CAF50'
  }
}

function EmptyStateSubscriptionFirst() {
  return (
    <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-elevated p-8 sm:p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold/15 mb-4">
        <Sparkles className="w-6 h-6 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">今日报告即将生成</h3>
      <p className="text-mentat-text-secondary text-sm max-w-sm mx-auto mb-6 leading-relaxed">
        每日早 8 点送达，一份报告覆盖情绪、预警、新闻与策略。订阅后第一时间推送，内测免费。
      </p>
      <Link
        href="/subscribe"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
      >
        <Mail className="w-4 h-4" />
        免费订阅，抢先接收
      </Link>
    </div>
  )
}

function StatPill({
  icon: Icon,
  value,
  label,
  highlight,
}: {
  icon: React.ElementType
  value: number | string
  label: string
  highlight?: 'danger' | 'warning' | 'normal'
}) {
  const valueClass =
    highlight === 'danger'
      ? 'text-mentat-danger font-semibold'
      : highlight === 'warning'
        ? 'text-mentat-warning font-semibold'
        : 'text-mentat-text font-medium'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <Icon className="w-3.5 h-3.5 text-mentat-muted flex-shrink-0" />
      <span className={valueClass}>{value}</span>
      <span className="text-mentat-muted">{label}</span>
    </span>
  )
}

export default function LatestReportCard({ data: dataProp, aiTeaser }: LatestReportCardProps) {
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
      <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-elevated p-6 animate-pulse">
        <div className="h-3 w-28 bg-mentat-border rounded mb-3" />
        <div className="h-5 w-72 bg-mentat-border rounded mb-4" />
        <div className="flex gap-4 mb-4">
          <div className="h-6 w-20 bg-mentat-border rounded" />
          <div className="h-6 w-16 bg-mentat-border rounded" />
          <div className="h-6 w-16 bg-mentat-border rounded" />
        </div>
        <div className="h-1.5 bg-mentat-border rounded mb-2" />
        <div className="h-14 bg-mentat-border rounded mt-4" />
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
  const red = data.red_count ?? 0
  const yellow = data.yellow_count ?? 0
  const items = data.item_count ?? 0
  const topics = data.topic_count ?? 0
  const sources = data.multi_source_count ?? 0
  const hasStats = items > 0 || red > 0 || yellow > 0 || topics > 0 || sources > 0
  const teaserText = (aiTeaser || '').trim()

  return (
    <div
      className="rounded-xl border border-mentat-border-card bg-mentat-bg-elevated overflow-hidden hover:border-mentat-border transition-colors"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <Link href={`/reports/${data.report_date}`} className="block p-6 pb-0 group/link">
        {/* 标题行 */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-mentat-muted font-mono mb-1 uppercase tracking-wider">
              {data.report_date} · 最新报告
            </div>
            <h3 className="text-mentat-text font-semibold text-base leading-snug">
              {data.title || `${data.report_date} 市场情报日报`}
            </h3>
          </div>
          {data.sentiment_score != null && (
            <div className="text-right flex-shrink-0">
              <div className="text-3xl sm:text-4xl font-bold font-mono leading-none" style={{ color }}>
                {data.sentiment_score}
              </div>
              <div className="text-[10px] text-mentat-muted mt-0.5 uppercase tracking-wider">情绪指数</div>
            </div>
          )}
        </div>

        {/* 数据一览 */}
        {hasStats && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 py-2.5 px-3 rounded-lg bg-mentat-bg-page/50 border border-mentat-border-card">
            {items > 0 && <StatPill icon={FileText} value={items} label="条信号" />}
            {red > 0 && <StatPill icon={AlertTriangle} value={red} label="重大预警" highlight="danger" />}
            {yellow > 0 && <StatPill icon={AlertTriangle} value={yellow} label="重要预警" highlight="warning" />}
            {topics > 0 && <StatPill icon={Layers} value={topics} label="个主题" />}
            {sources > 0 && <StatPill icon={Radio} value={sources} label="多源汇总" />}
          </div>
        )}

        {/* 情绪条 */}
        {gaugePercent != null && (
          <div className="mb-4">
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

        {/* AI 解析摘要 */}
        {teaserText && (
          <div className="mb-4 p-3.5 rounded-lg bg-gold/10 border border-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
              <span className="text-[11px] font-medium text-gold uppercase tracking-wider">AI 解析摘要</span>
            </div>
            <p className="text-sm text-mentat-text-secondary leading-relaxed line-clamp-3">
              {teaserText}
            </p>
            <p className="text-[11px] text-mentat-muted mt-2">完整解读与方向建议见报告内</p>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2 pb-4">
          <span className="inline-flex items-center gap-2 text-gold text-sm font-medium group-hover/link:gap-3 transition-all">
            查看完整报告
            <ArrowRight className="w-4 h-4" />
          </span>
          <p className="text-[11px] text-mentat-muted-tertiary mt-1.5">
            含情绪仪表盘、红黄预警、新闻脉络与期权视角
          </p>
        </div>
      </Link>

      <div className="px-6 py-4 border-t border-mentat-border-card flex items-center justify-between gap-3 bg-mentat-bg-page/30">
        <span className="text-xs text-mentat-text-secondary">每日早 8 点送达 · 内测免费</span>
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/15 text-gold text-sm font-medium hover:bg-gold/25 transition-colors"
        >
          <Bell className="w-4 h-4" />
          订阅每日报告
        </Link>
      </div>
    </div>
  )
}
