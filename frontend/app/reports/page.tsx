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
  Bell,
  FileText,
  TrendingUp,
  BarChart2,
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

/* ── Subscription strip（信息密度增强）─────────────────────────── */

function SubscriptionStrip() {
  return (
    <div className="mb-8 rounded-2xl border border-gold/30 bg-gradient-to-br from-mentat-bg-gradient-start via-mentat-bg-elevated to-mentat-bg-section overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gold/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-mentat-blue/5 blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>
      <div className="relative p-6">
        <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-gold" />
              </div>
              <h3 className="text-base font-semibold text-white">完整日报 · 每日早 8 点送达</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-mentat-text-secondary">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-gold/70" />
                情绪仪表盘 + 行情快照
              </span>
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-mentat-warning/70" />
                红黄两级预警 + 方向建议
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-mentat-blue/70" />
                新闻脉络 + 主题热度 + 期权
              </span>
            </div>
            <p className="text-[11px] text-mentat-muted-secondary">订阅后第一时间推送 · 内测免费 · 随时可停</p>
          </div>
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-mentat-bg-page rounded-xl text-sm font-semibold hover:bg-gold-hover transition-colors shadow-[0_4px_20px_rgba(193,154,107,0.25)] flex-shrink-0"
          >
            <Bell className="w-4 h-4" />
            免费订阅
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
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

  return (
    <Link href={`/reports/${report.report_date}`} className="block group">
      <div
        className={`rounded-2xl border overflow-hidden transition-all duration-200 group-hover:border-gold/40 group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${
          isFeatured
            ? 'border-gold/30 bg-gradient-to-b from-mentat-bg-elevated to-mentat-bg-gradient-start'
            : 'border-mentat-border-card bg-mentat-bg-card'
        }`}
      >
        {/* 头部：日期 + 情绪 + 统计 */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-mentat-border-card/80">
          <span className="font-mono text-sm text-mentat-text-secondary">{report.report_date}</span>
          <span
            className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md"
            style={{
              color: c,
              background: `${c}15`,
              border: `1px solid ${c}40`,
            }}
          >
            {levelLabel(report.sentiment_level)}
            {report.sentiment_score != null ? ` ${report.sentiment_score}` : ''}
          </span>
          {(report.red_count ?? 0) > 0 && (
            <span className="text-xs font-mono text-mentat-danger">🔴 重大 {report.red_count}</span>
          )}
          {(report.yellow_count ?? 0) > 0 && (
            <span className="text-xs font-mono text-mentat-warning">🟡 重要 {report.yellow_count}</span>
          )}
          <span className="text-[11px] text-mentat-muted-tertiary ml-auto">
            {report.item_count ?? 0} 条信号
          </span>
        </div>

        {/* 信息预览区 */}
        <div className="px-4 py-3 space-y-3">
          {overviewText && (
            <p className="text-[13px] text-mentat-text-faint leading-relaxed line-clamp-2">
              {excerpt(overviewText, isFeatured ? 120 : 80)}
            </p>
          )}
          {alertPreview.length > 0 && (
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
                    {excerpt(a.text || a.summary, isFeatured ? 70 : 50)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {topics.length > 0 && (
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
          )}
          {!overviewText && alertPreview.length === 0 && (
            <p className="text-xs text-mentat-muted-tertiary">
              含市场综述、核心预警、新闻简报、期权策略等 · 订阅查看完整内容
            </p>
          )}
        </div>

        {/* 底部 CTA */}
        <div className="px-4 py-2.5 border-t border-mentat-border-card/80 flex items-center justify-between bg-mentat-bg-page/50">
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
}: {
  reports: ReportItem[]
  details: Record<string, ReportDetail>
  loading: boolean
  error: boolean
  page: number
  hasMore: boolean
  onLoadMore: () => void
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
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[11px] text-mentat-muted-tertiary font-mono uppercase tracking-wider">
                {month.replace('-', ' 年 ')} 月
              </h3>
              <span className="text-[10px] text-mentat-muted-tertiary">{items.length} 份报告</span>
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
          href="/subscribe"
          className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:underline"
        >
          免费订阅
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
  const { getToken } = useAppAuth()
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
      const data = await reportsApi.list(p, PAGE_SIZE, token)
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

  return (
    <div className="min-h-screen bg-mentat-bg-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <SubscriptionStrip />

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-mentat-text mb-0.5">报告归档</h1>
            <p className="text-mentat-muted-secondary text-sm">浏览往期日报，预览核心信息</p>
          </div>

          <div className="flex rounded-xl overflow-hidden border border-mentat-border-card bg-mentat-bg-card p-0.5">
            <button
              onClick={() => setMode('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                mode === 'list' ? 'bg-mentat-border-card text-mentat-text' : 'text-mentat-muted-secondary hover:text-mentat-text-secondary'
              }`}
            >
              <List className="w-4 h-4" />
              列表
            </button>
            <button
              onClick={() => setMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                mode === 'calendar' ? 'bg-mentat-border-card text-mentat-text' : 'text-mentat-muted-secondary hover:text-mentat-text-secondary'
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
          />
        )}
      </div>
    </div>
  )
}
