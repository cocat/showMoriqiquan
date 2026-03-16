'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi, isNetworkError, API_URL } from '@/lib/api'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CalendarDays,
  List,
  ArrowRight,
  Layers,
  Clock3,
} from 'lucide-react'

interface CalendarData {
  year: number
  month: number
  dates: string[]
}

interface ReportItem {
  report_id: string
  report_date: string
  title?: string
  sentiment_score?: number
  sentiment_level?: string
  red_count?: number
  yellow_count?: number
  item_count?: number
}

interface ReportDetail {
  report: ReportItem
  overview?: { content: string } | null
  alerts?: Array<{
    id: number
    level: string
    title: string
    zh_title?: string
    ai_summary?: string
    direction?: string
    topic_name?: string
  }>
  topic_comparisons?: Array<{
    topic_name?: string
    score?: number
    delta?: number
    level?: string
  }>
}

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

function excerpt(text: string | null | undefined, maxLen: number): string {
  if (!text || typeof text !== 'string') return ''
  const t = text.trim()
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen).trim() + '…'
}

/* ── 信息密度高的报告卡片（含预览内容）────────────────────────── */

function ReportRichCard({
  report,
  detail,
  isFeatured,
}: {
  report: ReportItem
  detail: ReportDetail | null
  isFeatured?: boolean
}) {
  const c = levelColor(report.sentiment_level)
  const alerts = detail?.alerts ?? []
  const overviewText = detail?.overview?.content
  const topics = detail?.topic_comparisons?.slice(0, 4) ?? []

  const alertPreview = alerts.slice(0, 3).map((a) => ({
    text: a.zh_title || a.title,
    level: a.level,
    summary: a.ai_summary,
  }))
  const totalAlerts = (report.red_count ?? 0) + (report.yellow_count ?? 0)

  return (
    <Link href={`/reports/${report.report_date}`} className="block group">
      <div
        className={`rounded-2xl border overflow-hidden transition-all duration-250 group-hover:-translate-y-0.5 group-hover:border-gold/40 group-hover:shadow-[0_12px_34px_-16px_rgba(0,0,0,0.65)] ${
          isFeatured
            ? 'border-gold/35 bg-gradient-to-b from-mentat-bg-elevated via-mentat-bg-card to-mentat-bg-page'
            : 'border-mentat-border-card bg-gradient-to-b from-mentat-bg-card to-mentat-bg-page/85'
        }`}
      >
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-mentat-border-card/80 bg-black/10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[11px] tracking-wide text-mentat-muted-secondary">{report.report_date}</span>
            <span
              className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-md"
              style={{
                color: c,
                background: `${c}15`,
                border: `1px solid ${c}45`,
              }}
            >
              情绪 {levelLabel(report.sentiment_level)}
              {report.sentiment_score != null ? ` ${report.sentiment_score}` : ''}
            </span>
            {isFeatured && (
              <span className="px-2 py-1 rounded-md bg-gold/12 border border-gold/35 text-[10px] text-gold font-medium uppercase tracking-[0.08em]">
                featured
              </span>
            )}
            <span className="ml-auto text-[10px] text-mentat-muted-tertiary">{report.item_count ?? 0} 条信号</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded border"
              style={{
                color: c,
                background: `${c}10`,
                borderColor: `${c}35`,
              }}
            >
              regime: {levelLabel(report.sentiment_level)}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-mentat-border-card text-mentat-muted-secondary bg-mentat-bg-page/60">
              alerts: {totalAlerts}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-mentat-border-card text-mentat-muted-secondary bg-mentat-bg-page/60">
              items: {report.item_count ?? 0}
            </span>
          </div>
        </div>

        {/* 信息预览区 */}
        <div className="px-4 py-3 space-y-3.5">
          {(report.title || isFeatured) && (
            <h3 className="text-sm font-semibold text-mentat-text leading-snug line-clamp-1">
              {report.title || `${report.report_date} 市场情报日报`}
            </h3>
          )}

          {overviewText && (
            <div className="rounded-lg border border-mentat-border-card bg-mentat-bg-page/50 px-3 py-2.5">
              <p className="text-[11px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.12em] mb-1.5">overview</p>
              <p className="text-[13px] text-mentat-text-faint leading-relaxed line-clamp-2">
                {excerpt(overviewText, isFeatured ? 140 : 90)}
              </p>
            </div>
          )}

          {alertPreview.length > 0 && (
            <div className="rounded-lg border border-mentat-border-card bg-mentat-bg-page/40 px-3 py-2.5">
              <p className="text-[11px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.12em] mb-1.5">alerts preview</p>
              <div className="space-y-2">
                {alertPreview.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${a.level === 'red' ? 'bg-mentat-danger' : 'bg-mentat-warning'}`}
                    />
                    <span className="text-mentat-text-secondary line-clamp-1">
                      {excerpt(a.text || a.summary, isFeatured ? 80 : 56)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topics.length > 0 && (
            <div>
              <p className="text-[11px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.12em] mb-1.5">topic heat</p>
              <div className="flex flex-wrap gap-1.5">
                {topics.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] font-mono text-mentat-muted-secondary bg-mentat-border-section border border-mentat-border-weak"
                  >
                    {t.topic_name}
                    {t.delta != null && t.delta !== 0 && (
                      <span className={t.delta > 0 ? 'text-mentat-danger' : 'text-mentat-success'}>
                        {' '}{t.delta > 0 ? '+' : ''}{t.delta}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!overviewText && alertPreview.length === 0 && (
            <div className="rounded-lg border border-dashed border-mentat-border-card bg-mentat-bg-page/35 px-3 py-3">
              <p className="text-xs text-mentat-muted-tertiary">
                含市场综述、核心预警、新闻简报、期权策略等 · 订阅查看完整内容
              </p>
            </div>
          )}
        </div>

        {/* 底部 CTA */}
        <div className="px-4 py-2.5 border-t border-mentat-border-card/80 flex items-center justify-between bg-mentat-bg-page/65">
          <span className="text-[11px] text-mentat-muted-tertiary">进入详情查看完整模块</span>
          <span className="inline-flex items-center gap-1 text-gold text-xs font-medium group-hover:gap-2 transition-all">
            查看报告
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Calendar view（接收缓存数据）─────────────────────────────── */

function CalendarView({
  calendar,
  loading,
  message,
  current,
  onPrevMonth,
  onNextMonth,
  onLoadMonth,
}: {
  calendar: CalendarData | null
  loading: boolean
  message: string
  current: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onLoadMonth: (date: Date) => void
}) {
  useEffect(() => {
    onLoadMonth(current)
  }, [current.getFullYear(), current.getMonth(), onLoadMonth])

  const hasReport = (d: Date) =>
    calendar?.dates?.includes(format(d, 'yyyy-MM-dd')) ?? false

  const monthStart = startOfMonth(current)
  const days = eachDayOfInterval({
    start: monthStart,
    end: endOfMonth(current),
  })
  const paddingDays = Array.from({ length: monthStart.getDay() }, (_, i) => i)

  return (
    <div>
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-mentat-error-border/15 border border-mentat-error-border/50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-mentat-danger shrink-0" />
          <p className="text-mentat-danger text-sm">{message}</p>
        </div>
      )}

      <div className="rounded-2xl border border-mentat-border-card bg-mentat-bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-mentat-border-card">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-lg hover:bg-mentat-border-card text-mentat-text-secondary hover:text-mentat-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-mentat-text-faint">
            {format(current, 'yyyy 年 M 月', { locale: zhCN })}
          </span>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg hover:bg-mentat-border-card text-mentat-text-secondary hover:text-mentat-text transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-px bg-mentat-border-section p-4">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-mentat-bg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-mentat-border-section p-4">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="py-2 text-center text-[10px] text-mentat-muted-tertiary font-medium uppercase">
                {d}
              </div>
            ))}
            {paddingDays.map((i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {days.map((d) => {
              const has = hasReport(d)
              const dateStr = format(d, 'yyyy-MM-dd')
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
              return (
                <div key={dateStr} className="aspect-square p-0.5">
                  {has ? (
                    <Link
                      href={`/reports/${dateStr}`}
                      className="w-full h-full flex flex-col items-center justify-center rounded-xl bg-gold/15 text-gold font-semibold hover:bg-gold/25 transition-colors"
                    >
                      <span className="text-sm">{d.getDate()}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1" />
                    </Link>
                  ) : (
                    <span
                      className={`w-full h-full flex items-center justify-center rounded-xl text-sm ${
                        isToday ? 'text-mentat-text bg-mentat-border-card/50' : 'text-mentat-muted-tertiary'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && calendar?.dates?.length === 0 && (
          <p className="text-center text-mentat-muted-tertiary text-sm py-6">该月暂无报告</p>
        )}
      </div>
    </div>
  )
}

/* ── List view（接收缓存数据）────────────────────────────────── */

const PREVIEW_COUNT = 5
const PAGE_SIZE = 20

function ListView({
  reports,
  details,
  loading,
  error,
  page,
  hasMore,
  onLoadMore,
  isSignedIn,
}: {
  reports: ReportItem[]
  details: Record<string, ReportDetail>
  loading: boolean
  error: boolean
  page: number
  hasMore: boolean
  onLoadMore: () => void
  isSignedIn: boolean
}) {
  const grouped = reports.reduce<Record<string, ReportItem[]>>((acc, r) => {
    const month = r.report_date.slice(0, 7)
    if (!acc[month]) acc[month] = []
    acc[month].push(r)
    return acc
  }, {})
  const sortedMonths = Object.keys(grouped).sort().reverse()

  if (error && reports.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-mentat-border-card bg-mentat-bg-card flex items-center gap-3 text-sm text-mentat-text-secondary">
        <AlertCircle className="w-5 h-5 text-mentat-danger shrink-0" />
        无法加载报告列表
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sortedMonths.map((month) => {
        const items = grouped[month]
        return (
          <div key={month}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[11px] text-mentat-muted-tertiary font-mono uppercase tracking-wider inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold/70" />
                {month.replace('-', ' 年 ')} 月
              </h3>
              <span className="text-[10px] text-mentat-muted-tertiary px-2 py-0.5 rounded border border-mentat-border-card bg-mentat-bg-card">
                {items.length} 份报告
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {items.map((r, idx) => {
                const detail = details[r.report_date] ?? null
                const isFeatured = idx === 0 && month === sortedMonths[0]
                return (
                  <ReportRichCard
                    key={r.report_id}
                    report={r}
                    detail={detail}
                    isFeatured={isFeatured}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-mentat-bg-card border border-mentat-border-card animate-pulse" />
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-3.5 rounded-xl border border-mentat-border-card text-mentat-text-secondary text-sm hover:border-gold/40 hover:text-gold transition-colors"
        >
          加载更多
        </button>
      )}

      <div className="pt-4 pb-2 rounded-xl border border-mentat-border-card bg-mentat-bg-page/50 px-4 py-3 text-center">
        <p className="text-[11px] text-mentat-muted-tertiary mb-2">
          订阅后可回溯最近 7 天完整报告，含市场综述、行情快照、新闻脉络、期权策略等
        </p>
        <Link
          href={isSignedIn ? '/subscribe' : '/sign-up?redirect_url=/reports'}
          className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:underline"
        >
          {isSignedIn ? '免费订阅' : '免费注册查看完整'}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

/* ── Page（状态提升，切换视图时复用缓存）───────────────────────── */

type ViewMode = 'calendar' | 'list'

function cacheKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function ReportsPage() {
  const { getToken, isSignedIn } = useAppAuth()
  const [mode, setMode] = useState<ViewMode>('list')

  // 列表数据（切换回列表时复用，不再重新请求）
  const [reports, setReports] = useState<ReportItem[]>([])
  const [details, setDetails] = useState<Record<string, ReportDetail>>({})
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState(false)
  const [listPage, setListPage] = useState(1)
  const [listHasMore, setListHasMore] = useState(false)
  const [listLoaded, setListLoaded] = useState(false)

  // 日历数据（按月份缓存，切换月份时命中缓存则不请求）
  const [calendarCache, setCalendarCache] = useState<Record<string, CalendarData>>({})
  const [calendarCurrent, setCalendarCurrent] = useState(() => new Date())
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarMessage, setCalendarMessage] = useState('')

  const loadReports = useCallback(async (p: number): Promise<ReportItem[]> => {
    setListLoading(true)
    try {
      const token = await getToken()
      const data = await reportsApi.list(p, PAGE_SIZE, token, 'archive')
      const items: ReportItem[] =
        data.reports ?? data.items ?? data.data ?? (Array.isArray(data) ? data : [])
      setReports((prev) => (p === 1 ? items : [...prev, ...items]))
      setListHasMore(items.length === PAGE_SIZE)
      setListError(false)
      setListLoaded(true)
      return items
    } catch {
      setListError(true)
      return []
    } finally {
      setListLoading(false)
    }
  }, [getToken])

  const loadDetails = useCallback(async (toFetch: ReportItem[]) => {
    if (toFetch.length === 0) return
    const token = await getToken()
    const results = await Promise.allSettled(
      toFetch.map((r) =>
        reportsApi.getByDate(r.report_date, token).then((res) => ({
          date: r.report_date,
          res: res as { report?: ReportItem; overview?: { content: string }; alerts?: ReportDetail['alerts']; topic_comparisons?: ReportDetail['topic_comparisons'] },
        }))
      )
    )
    const next: Record<string, ReportDetail> = {}
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) {
        const { date, res: d } = r.value
        const base = toFetch.find((x) => x.report_date === date)!
        next[date] = {
          report: { ...base, ...d.report },
          overview: d.overview,
          alerts: d.alerts,
          topic_comparisons: d.topic_comparisons,
        }
        }
      })
    setDetails((prev) => ({ ...prev, ...next }))
  }, [getToken])

  // 首次加载列表
  useEffect(() => {
    if (!listLoaded && mode === 'list') {
      loadReports(1).then((items) => {
        loadDetails(items.slice(0, PREVIEW_COUNT))
      })
    }
  }, [listLoaded, mode, loadReports, loadDetails])

  const handleLoadMore = useCallback(() => {
    const next = listPage + 1
    setListPage(next)
    loadReports(next)
  }, [listPage, loadReports])

  const calendarCacheRef = useRef(calendarCache)
  calendarCacheRef.current = calendarCache

  const loadCalendarMonth = useCallback(async (date: Date) => {
    const key = cacheKey(date)
    if (calendarCacheRef.current[key]) return // 命中缓存，不请求

    setCalendarLoading(true)
    setCalendarMessage('')
    try {
      const token = await getToken()
      const data = await reportsApi.getCalendar(date.getFullYear(), date.getMonth() + 1, token)
      setCalendarCache((prev) => ({ ...prev, [key]: data }))
    } catch (error: unknown) {
      if (isNetworkError(error)) {
        setCalendarMessage(`无法连接后端；API：${API_URL}`)
      }
      setCalendarCache((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    } finally {
      setCalendarLoading(false)
    }
  }, [getToken])

  const calendar = calendarCache[cacheKey(calendarCurrent)] ?? null
  const archiveMonths = new Set(reports.map((r) => r.report_date.slice(0, 7))).size
  const latestArchiveDate = reports[0]?.report_date ?? '--'

  return (
    <div className="min-h-screen bg-mentat-bg-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-4 rounded-xl border border-mentat-border-card bg-mentat-bg-card/70 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-mentat-muted-secondary">
            归档模块仅展示历史报告；今日最新请从“最新报告”进入。
          </p>
          <Link
            href="/reports/latest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/40 text-gold text-xs hover:bg-gold/10 transition-colors flex-shrink-0"
          >
            前往最新报告
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-mentat-text mb-1">报告归档</h1>
          <p className="text-mentat-muted-secondary text-sm">按列表或日历回看往期日报，不与最新报告重复</p>
        </div>

        <div className="grid gap-5 lg:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] items-start">
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-mentat-border-card bg-gradient-to-b from-mentat-bg-card to-mentat-bg-page px-4 py-4">
                <p className="text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.14em] mb-3">Archive Navigator</p>
                <div className="grid gap-2">
                  <button
                    onClick={() => setMode('list')}
                    className={`w-full rounded-xl border px-3.5 py-3 text-left transition-all ${
                      mode === 'list'
                        ? 'border-gold/45 bg-gold/12 text-mentat-text shadow-[0_8px_20px_-14px_rgba(212,165,90,0.55)]'
                        : 'border-mentat-border-card bg-mentat-bg-page/50 text-mentat-muted-secondary hover:text-mentat-text hover:border-gold/25'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <List className="w-4 h-4" />
                      列表视图
                    </span>
                    <span className="block mt-1 text-[11px] text-mentat-muted-tertiary">
                      按月份浏览每期报告摘要
                    </span>
                  </button>
                  <button
                    onClick={() => setMode('calendar')}
                    className={`w-full rounded-xl border px-3.5 py-3 text-left transition-all ${
                      mode === 'calendar'
                        ? 'border-gold/45 bg-gold/12 text-mentat-text shadow-[0_8px_20px_-14px_rgba(212,165,90,0.55)]'
                        : 'border-mentat-border-card bg-mentat-bg-page/50 text-mentat-muted-secondary hover:text-mentat-text hover:border-gold/25'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="w-4 h-4" />
                      日历视图
                    </span>
                    <span className="block mt-1 text-[11px] text-mentat-muted-tertiary">
                      通过日期快速定位报告
                    </span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-mentat-border-card bg-mentat-bg-card px-4 py-4 space-y-3">
                <p className="text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.14em]">Archive Stats</p>
                <div className="flex items-start gap-2">
                  <Layers className="w-4 h-4 mt-0.5 text-gold shrink-0" />
                  <div>
                    <p className="text-xs text-mentat-muted-secondary">已加载报告</p>
                    <p className="text-sm font-semibold text-mentat-text">{reports.length} 份</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 mt-0.5 text-gold shrink-0" />
                  <div>
                    <p className="text-xs text-mentat-muted-secondary">覆盖月份</p>
                    <p className="text-sm font-semibold text-mentat-text">{archiveMonths} 个月</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock3 className="w-4 h-4 mt-0.5 text-gold shrink-0" />
                  <div>
                    <p className="text-xs text-mentat-muted-secondary">最近归档日期</p>
                    <p className="text-sm font-semibold text-mentat-text">{latestArchiveDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main>
            {/* mobile tab */}
            <div className="mb-4 lg:hidden">
              <div className="grid grid-cols-2 rounded-2xl border border-mentat-border-card bg-mentat-bg-card p-1">
                <button
                  onClick={() => setMode('list')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    mode === 'list'
                      ? 'bg-gold/15 text-gold border border-gold/40'
                      : 'text-mentat-muted-secondary border border-transparent'
                  }`}
                >
                  <List className="w-4 h-4" />
                  列表
                </button>
                <button
                  onClick={() => setMode('calendar')}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    mode === 'calendar'
                      ? 'bg-gold/15 text-gold border border-gold/40'
                      : 'text-mentat-muted-secondary border border-transparent'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  日历
                </button>
              </div>
            </div>

            {mode === 'calendar' ? (
              <CalendarView
                calendar={calendar}
                loading={calendarLoading}
                message={calendarMessage}
                current={calendarCurrent}
                onPrevMonth={() => setCalendarCurrent((d) => subMonths(d, 1))}
                onNextMonth={() => setCalendarCurrent((d) => addMonths(d, 1))}
                onLoadMonth={loadCalendarMonth}
              />
            ) : (
              <ListView
                reports={reports}
                details={details}
                loading={listLoading && !listLoaded}
                error={listError}
                page={listPage}
                hasMore={listHasMore}
                onLoadMore={handleLoadMore}
                isSignedIn={isSignedIn}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
