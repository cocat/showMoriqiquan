'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'

import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { SentimentDashboard } from '@/app/components/report/SentimentDashboard'
import { SectionPlaceholder } from '@/app/components/SectionPlaceholder'
import { MarketSnapshot, SnapshotItem } from '@/app/components/report/MarketSnapshot'
import { AlertsList } from '@/app/components/report/AlertsList'
import { NewsBriefs } from '@/app/components/report/NewsBriefs'
import { OptionsPanel, type OptionsData } from '@/app/components/report/OptionsPanel'
import { TopicComparison } from '@/app/components/report/TopicComparison'

interface FullReport {
  report: {
    report_id: string
    report_date: string
    title: string
    generated_at?: string
    sentiment_score?: number
    sentiment_level?: string
    item_count?: number
    red_count?: number
    yellow_count?: number
    message?: string
  }
  sentiment?: { score: number; level: string; label?: string; description?: string } | null
  market_snapshots?: SnapshotItem[]
  overview?: { content: string } | null
  alerts?: Array<{
    id: number
    level: string
    score?: number
    title: string
    zh_title?: string
    ai_summary?: string
    ai_summary_en?: string
    source_name?: string
    published_at?: string
    link?: string
    topic_name?: string
    direction?: string
    direction_note?: string
    assets?: string[] | { name?: string }[]
  }>
  news_briefs?: Array<{
    topic_name?: string
    body?: string
    impact?: string
    source_count?: number
    sources?: Array<{ url: string; title: string }>
  }>
  options?: { body_text?: string; candidates?: unknown[] } | null
  topic_comparisons?: Array<{
    topic_name?: string
    topic_id?: string
    score?: number
    today_count?: number
    yesterday_count?: number
    delta?: number
    level?: string
  }>
  message?: string
}

function useAdjacentDates(date: string, getToken: () => Promise<string | null>) {
  const [prev, setPrev] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    const [year, month] = date.split('-').map(Number)

    const fetchMonth = async (y: number, m: number) => {
      const token = await getToken()
      return reportsApi.getCalendar(y, m, token).then((d) => (d.dates as string[]) || [])
    }

    const find = async () => {
      try {
        const currentDates = await fetchMonth(year, month)
        const idx = currentDates.indexOf(date)

        let prevDate: string | null = null
        let nextDate: string | null = null

        if (idx > 0) prevDate = currentDates[idx - 1]
        if (idx < currentDates.length - 1) nextDate = currentDates[idx + 1]

        // Look into adjacent months if at boundary
        if (!prevDate && month > 1) {
          const prevMonthDates = await fetchMonth(year, month - 1)
          if (prevMonthDates.length > 0) prevDate = prevMonthDates[prevMonthDates.length - 1]
        } else if (!prevDate) {
          const prevMonthDates = await fetchMonth(year - 1, 12)
          if (prevMonthDates.length > 0) prevDate = prevMonthDates[prevMonthDates.length - 1]
        }

        if (!nextDate) {
          const nextM = month === 12 ? 1 : month + 1
          const nextY = month === 12 ? year + 1 : year
          const nextMonthDates = await fetchMonth(nextY, nextM)
          if (nextMonthDates.length > 0) nextDate = nextMonthDates[0]
        }

        setPrev(prevDate)
        setNext(nextDate)
      } catch {
        // silently ignore navigation errors
      }
    }

    find()
  }, [date, getToken])

  return { prev, next }
}

export default function ReportDetailPage() {
  const params = useParams()
  const date = params.date as string
  const { getToken } = useAppAuth()
  const [data, setData] = useState<FullReport | null>(null)
  const [loading, setLoading] = useState(true)
  const { prev, next } = useAdjacentDates(date, getToken)

  const loadReport = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await reportsApi.getByDate(date, token)
      setData(res)
    } catch (error) {
      console.error('加载报告失败:', error)
    } finally {
      setLoading(false)
    }
  }, [date, getToken])

  useEffect(() => {
    loadReport()
    window.scrollTo({ top: 0 })
  }, [loadReport])

  if (loading) {
    return (
      <div className="report-detail-wrapper min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
          <p className="text-mentat-text-secondary text-sm">加载报告中…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="report-detail-wrapper min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle className="w-12 h-12 text-mentat-muted-tertiary" />
          <p className="text-mentat-text-secondary">报告不存在或加载失败</p>
          <Link
            href="/reports"
            className="px-4 py-2 border border-mentat-border text-gold rounded-lg text-sm hover:border-gold hover:bg-gold-dim transition-colors"
          >
            ← 返回报告归档
          </Link>
        </div>
      </div>
    )
  }

  const { report, sentiment, market_snapshots, overview, alerts, news_briefs, options, topic_comparisons, message } = data

  const levelColor = () => {
    switch ((report.sentiment_level || '').toLowerCase()) {
      case 'danger': return '#FF4444'
      case 'alert':  return '#D4A55A'
      case 'watch':  return '#C19A6B'
      default:       return '#4CAF50'
    }
  }

  const levelLabel = (level?: string) => {
    switch ((level || '').toLowerCase()) {
      case 'danger': return '危险'
      case 'alert':  return '警戒'
      case 'watch':  return '关注'
      default:       return '平静'
    }
  }

  const sentimentData = sentiment ?? (report.sentiment_score != null || report.sentiment_level
    ? {
        score: report.sentiment_score ?? 0,
        level: report.sentiment_level || 'calm',
        label: levelLabel(report.sentiment_level),
        description: '当日市场情绪综合评估',
        red_count: report.red_count,
        yellow_count: report.yellow_count,
        signal_count: report.item_count,
      }
    : null)

  // 所有模块（有内容或占位）均可跳转
  const contentSections = [
    sentimentData && { id: 'sentiment', label: '情绪仪表盘' },
    { id: 'market', label: '市场行情' },
    { id: 'overview', label: '市场综述' },
    alerts && { id: 'alerts', label: '核心预警' },
    { id: 'briefs', label: '新闻简报' },
    { id: 'options', label: '期权策略' },
    { id: 'topics', label: '热点主题' },
  ].filter(Boolean) as { id: string; label: string }[]
  const visibleSections = [
    { id: 'sec-header', label: '报告标题' },
    ...contentSections,
  ]

  return (
    <div className="report-detail-wrapper">
      {/* ── Secondary section nav: shown on small/medium screens only ── */}
      <nav className="report-sticky-nav xl:hidden">
        <Link href="/reports" className="report-nav-item flex-shrink-0">
          ← 返回
        </Link>
        <span className="report-nav-sep" />

        {/* Prev / Next on mobile */}
        {prev && (
          <Link href={`/reports/${prev}`} className="report-nav-item flex-shrink-0 !px-3">
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
        {next && (
          <Link href={`/reports/${next}`} className="report-nav-item flex-shrink-0 !px-3">
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        <span className="report-nav-sep" />

        {/* Section dropdown */}
        <select
          className="flex-shrink-0 bg-transparent border border-mentat-border text-mentat-muted text-xs rounded px-2 py-1 mx-2 cursor-pointer hover:border-gold transition-colors"
          onChange={(e) => {
            const id = e.target.value
            const el = document.getElementById(id)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          defaultValue=""
        >
          <option value="" disabled>跳转至…</option>
          {visibleSections.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </nav>

      {/* ── Main layout ── */}
      <div className="flex gap-0 xl:gap-6 max-w-[1720px] mx-auto px-3 xl:px-6 py-3">

        {/* ── Sidebar: xl screens only ── */}
        <aside className="hidden xl:flex flex-col w-44 flex-shrink-0">
          <div className="sticky top-[72px] space-y-0.5 pt-2">
            <Link
              href="/reports"
              className="flex items-center gap-1.5 text-xs text-mentat-muted hover:text-gold transition-colors mb-4 pb-3 border-b border-mentat-border-weak px-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              报告归档
            </Link>

            {/* Prev / Next date */}
            <div className="flex gap-1 mb-3 px-1">
              <Link
                href={prev ? `/reports/${prev}` : '#'}
                aria-disabled={!prev}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs border transition-colors ${
                  prev
                    ? 'border-mentat-border text-mentat-muted hover:border-gold hover:text-gold'
                    : 'border-[#222] text-[#333] cursor-not-allowed pointer-events-none'
                }`}
              >
                <ChevronLeft className="w-3 h-3" />
                前一天
              </Link>
              <Link
                href={next ? `/reports/${next}` : '#'}
                aria-disabled={!next}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs border transition-colors ${
                  next
                    ? 'border-mentat-border text-mentat-muted hover:border-gold hover:text-gold'
                    : 'border-[#222] text-[#333] cursor-not-allowed pointer-events-none'
                }`}
              >
                后一天
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="border-b border-mentat-border-weak mb-2" />

            {/* Section links - 仅展示有内容的模块 */}
            {visibleSections.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center px-2 py-2 rounded text-xs text-mentat-muted hover:text-gold hover:bg-gold-dim transition-colors border-l-2 border-transparent hover:border-gold leading-none"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>

        {/* ── Report content ── */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="report-page-header" id="sec-header">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h1>{report.title}</h1>
              {report.sentiment_level && (
                <span
                  className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded uppercase tracking-wider"
                  style={{
                    color: levelColor(),
                    background: `${levelColor()}18`,
                    border: `1px solid ${levelColor()}40`,
                  }}
                >
                  {levelLabel(report.sentiment_level)}
                </span>
              )}
            </div>
            <div className="meta">
              <span>{report.report_date}</span>
              {report.generated_at && (
                <span>{new Date(report.generated_at).toLocaleString('zh-CN')}</span>
              )}
              {report.item_count != null && <span>{report.item_count} 条</span>}
              {(report.red_count ?? 0) > 0 && (
                <span className="text-mentat-danger">🔴 {report.red_count} 重大</span>
              )}
              {(report.yellow_count ?? 0) > 0 && (
                <span className="text-mentat-warning">🟡 {report.yellow_count} 重要</span>
              )}
            </div>
          </div>

          {message && (
            <div
              className="mb-3 p-4 flex items-start gap-3 rounded border border-gold/30 border-l-4 border-l-gold"
              style={{ background: 'rgba(193,154,107,0.08)' }}
            >
              <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-gold text-sm">{message}</p>
            </div>
          )}

          {sentimentData && <SentimentDashboard data={sentimentData} />}
          {market_snapshots && market_snapshots.length > 0 ? (
            <MarketSnapshot items={market_snapshots as SnapshotItem[]} />
          ) : (
            <section id="market" className="scroll-mt-28 xl:scroll-mt-20">
              <SectionPlaceholder title="市场行情快照" message="暂无行情数据" />
            </section>
          )}
          {overview?.content ? (
            <section id="overview" className="scroll-mt-28 xl:scroll-mt-20">
              <div className="report-card">
                <div className="report-card-header blue">市场综述</div>
                <div className="overview-body">{overview.content}</div>
              </div>
            </section>
          ) : (
            <section id="overview" className="scroll-mt-28 xl:scroll-mt-20">
              <SectionPlaceholder title="市场综述" message="暂无综述内容" />
            </section>
          )}
          {alerts && <AlertsList items={alerts} />}
          {news_briefs && news_briefs.length > 0 ? (
            <NewsBriefs items={news_briefs} />
          ) : (
            <section id="briefs" className="scroll-mt-28 xl:scroll-mt-20">
              <SectionPlaceholder title="新闻简报" message="暂无新闻简报" />
            </section>
          )}
          {(options?.body_text || (options?.candidates && (options.candidates as unknown[]).length > 0)) ? (
            <OptionsPanel data={options as OptionsData} />
          ) : (
            <section id="options" className="scroll-mt-28 xl:scroll-mt-20">
              <SectionPlaceholder title="期权策略" message="暂无期权策略" />
            </section>
          )}
          {topic_comparisons && topic_comparisons.length > 0 ? (
            <TopicComparison items={topic_comparisons} />
          ) : (
            <section id="topics" className="scroll-mt-28 xl:scroll-mt-20">
              <SectionPlaceholder title="热点主题" message="暂无热点主题数据" />
            </section>
          )}

          {/* Bottom prev/next navigation */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-mentat-border-weak">
            {prev ? (
              <Link
                href={`/reports/${prev}`}
                className="flex items-center gap-2 px-4 py-2 border border-mentat-border text-mentat-muted rounded hover:border-gold hover:text-gold transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                {prev}
              </Link>
            ) : (
              <div />
            )}
            <div className="flex-1" />
            {next && (
              <Link
                href={`/reports/${next}`}
                className="flex items-center gap-2 px-4 py-2 border border-mentat-border text-mentat-muted rounded hover:border-gold hover:text-gold transition-colors text-sm"
              >
                {next}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
