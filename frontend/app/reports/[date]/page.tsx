'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'

import { AlertCircle, ChevronLeft, ChevronRight, BarChart2, LineChart, FileText, AlertTriangle, Newspaper, Layers } from 'lucide-react'
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
  const [activeSection, setActiveSection] = useState('sec-header')
  const navScrollLockRef = useRef(false)
  const navScrollTimerRef = useRef<number | null>(null)
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

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const offsetTop = window.matchMedia('(min-width: 1280px)').matches ? 76 : 108
    const y = el.getBoundingClientRect().top + window.scrollY - offsetTop

    navScrollLockRef.current = true
    setActiveSection(id)
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })

    if (navScrollTimerRef.current) {
      window.clearTimeout(navScrollTimerRef.current)
    }
    navScrollTimerRef.current = window.setTimeout(() => {
      navScrollLockRef.current = false
    }, 480)
  }, [])

  useEffect(() => {
    loadReport()
    window.scrollTo({ top: 0 })
  }, [loadReport])
  const report = data?.report
  const sentiment = data?.sentiment
  const market_snapshots = data?.market_snapshots
  const overview = data?.overview
  const alerts = data?.alerts
  const news_briefs = data?.news_briefs
  const options = data?.options
  const topic_comparisons = data?.topic_comparisons
  const message = data?.message

  const levelColor = (level?: string) => {
    switch ((level || '').toLowerCase()) {
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

  const sentimentData = sentiment ?? (report?.sentiment_score != null || report?.sentiment_level
    ? {
        score: report?.sentiment_score ?? 0,
        level: report?.sentiment_level || 'calm',
        label: levelLabel(report?.sentiment_level),
        description: '当日市场情绪综合评估',
        red_count: report?.red_count,
        yellow_count: report?.yellow_count,
        signal_count: report?.item_count,
      }
    : null)

  const hasSentiment = Boolean(sentimentData)
  const hasMarket = Boolean(market_snapshots && market_snapshots.length > 0)
  const hasOverview = Boolean(overview?.content)
  const hasAlerts = Boolean(alerts && alerts.length > 0)
  const hasBriefs = Boolean(news_briefs && news_briefs.length > 0)
  const hasOptions = Boolean(options?.body_text || (options?.candidates && (options.candidates as unknown[]).length > 0))
  const hasTopics = Boolean(topic_comparisons && topic_comparisons.length > 0)

  const sectionItems = [
    { id: 'sec-header', label: '报告标题', available: true, icon: FileText },
    { id: 'sentiment', label: '情绪仪表盘', available: hasSentiment, icon: BarChart2 },
    { id: 'market', label: '市场行情', available: hasMarket, icon: LineChart },
    { id: 'overview', label: '市场综述', available: hasOverview, icon: FileText },
    { id: 'alerts', label: '核心预警', available: hasAlerts, icon: AlertTriangle },
    { id: 'briefs', label: '新闻简报', available: hasBriefs, icon: Newspaper },
    { id: 'options', label: '期权策略', available: hasOptions, icon: Layers },
    { id: 'topics', label: '热点主题', available: hasTopics, icon: Layers },
  ]
  const contentSections = sectionItems.filter((s) => s.id !== 'sec-header')
  const sidebarSections = contentSections
  const availableCount = contentSections.filter((s) => s.available).length
  const readyRatio = contentSections.length > 0 ? Math.round((availableCount / contentSections.length) * 100) : 0
  const alertCount = alerts?.length ?? 0
  const briefCount = news_briefs?.length ?? 0
  const snapshotCount = market_snapshots?.length ?? 0

  useEffect(() => {
    if (!data) {
      setActiveSection('sec-header')
      return
    }
    const ids = sectionItems.map((s) => s.id)
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (navScrollLockRef.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0.2, 0.45, 0.7],
      }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [data, date, hasSentiment, hasMarket, hasOverview, hasAlerts, hasBriefs, hasOptions, hasTopics])

  useEffect(() => {
    return () => {
      if (navScrollTimerRef.current) {
        window.clearTimeout(navScrollTimerRef.current)
      }
    }
  }, [])

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

  if (!data || !report) {
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
            scrollToSection(id)
          }}
          defaultValue=""
        >
          <option value="" disabled>跳转至…</option>
          {sectionItems.map(({ id, label, available }) => (
            <option key={id} value={id}>{`${label}${available ? '' : '（暂无）'}`}</option>
          ))}
        </select>
      </nav>

      {/* ── Main layout ── */}
      <div className="flex gap-0 xl:gap-6 max-w-[1720px] mx-auto px-3 xl:px-6 py-3">

        {/* ── Sidebar: xl screens only ── */}
        <aside className="hidden xl:flex flex-col w-44 flex-shrink-0">
          <div className="sticky top-[72px] space-y-3 pt-2">
            <Link
              href="/reports"
              className="flex items-center gap-1.5 text-xs text-mentat-muted hover:text-gold transition-colors mb-3 px-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              报告归档
            </Link>

            <div className="rounded-2xl bg-gradient-to-b from-[#1a202a] to-[#11151c] shadow-[0_14px_28px_-18px_rgba(0,0,0,0.9)] p-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-mentat-muted-tertiary mb-2">
                report panel
              </div>
              <div className="text-xs text-mentat-text mb-1">{report.report_date}</div>
              <div className="text-[11px] text-mentat-muted-secondary mb-2 line-clamp-2">{report.title}</div>
              <div className="h-1.5 rounded-full bg-black/35 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#A7763D] to-[#D4A55A]" style={{ width: `${readyRatio}%` }} />
              </div>
              <div className="mt-1.5 text-[10px] text-mentat-muted-secondary">
                模块就绪度 {availableCount}/{contentSections.length}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-md bg-black/25 py-1">
                  <div className="text-[11px] text-mentat-text font-mono">{alertCount}</div>
                  <div className="text-[9px] text-mentat-muted-tertiary">预警</div>
                </div>
                <div className="rounded-md bg-black/25 py-1">
                  <div className="text-[11px] text-mentat-text font-mono">{briefCount}</div>
                  <div className="text-[9px] text-mentat-muted-tertiary">简报</div>
                </div>
                <div className="rounded-md bg-black/25 py-1">
                  <div className="text-[11px] text-mentat-text font-mono">{snapshotCount}</div>
                  <div className="text-[9px] text-mentat-muted-tertiary">行情</div>
                </div>
              </div>
            </div>

            {/* Prev / Next date */}
            <div className="flex gap-1 mb-3 px-1">
              <Link
                href={prev ? `/reports/${prev}` : '#'}
                aria-disabled={!prev}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${
                  prev
                    ? 'text-mentat-muted hover:text-gold hover:bg-gold/10'
                    : 'text-[#333] cursor-not-allowed pointer-events-none'
                }`}
              >
                <ChevronLeft className="w-3 h-3" />
                前一天
              </Link>
              <Link
                href={next ? `/reports/${next}` : '#'}
                aria-disabled={!next}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${
                  next
                    ? 'text-mentat-muted hover:text-gold hover:bg-gold/10'
                    : 'text-[#333] cursor-not-allowed pointer-events-none'
                }`}
              >
                后一天
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="rounded-2xl bg-gradient-to-b from-mentat-bg-card/80 to-mentat-bg-card/55 p-2.5 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between px-1 mb-2.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-mentat-muted-tertiary">模块导航</span>
                <span className="text-[10px] text-mentat-muted-secondary">{availableCount}/{contentSections.length}</span>
              </div>

              <div className="space-y-1">
                {sidebarSections.map(({ id, label, available, icon: Icon }) => {
                  const isActive = activeSection === id
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => scrollToSection(id)}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-gold/18 to-gold/8 text-gold shadow-[inset_0_0_0_1px_rgba(212,165,90,0.35)]'
                          : 'text-mentat-muted hover:text-mentat-text hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{label}</span>
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          available
                            ? 'text-gold/90 bg-gold/12'
                            : 'text-mentat-muted-tertiary bg-black/25'
                        }`}
                      >
                        {available ? '' : '空'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
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
                    color: levelColor(report.sentiment_level),
                    background: `${levelColor(report.sentiment_level)}18`,
                    border: `1px solid ${levelColor(report.sentiment_level)}40`,
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

          <div className="mb-3 overflow-x-auto">
            <div className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-mentat-bg-card/90 to-mentat-bg-card/60 p-1.5 min-w-full xl:min-w-0 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.85)]">
              {contentSections.map(({ id, label, available, icon: Icon }) => {
                const isActive = activeSection === id
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                      isActive
                        ? 'text-gold bg-gold/12 shadow-[inset_0_0_0_1px_rgba(212,165,90,0.35)]'
                        : available
                          ? 'text-mentat-text-secondary hover:bg-white/[0.04]'
                          : 'text-mentat-muted-tertiary'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                )
              })}
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

          {sentimentData ? (
            <SentimentDashboard data={sentimentData} />
          ) : (
            <section id="sentiment" className="scroll-mt-28 xl:scroll-mt-20">
              <SectionPlaceholder title="情绪仪表盘" message="暂无情绪数据" />
            </section>
          )}
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
