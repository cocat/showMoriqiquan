'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { ArrowRight, BellRing, CalendarRange, CircleAlert, Layers3, Sparkles, TrendingUp } from 'lucide-react'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { formatApiErrorForUser } from '@/lib/api-error-ui'
import { withTokenRetry } from '@/lib/session-token'

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

interface ReportDetailPreview {
  overview?: { content?: string } | null
  alerts?: Array<{
    id: number
    level?: string
    title?: string
    zh_title?: string
    ai_summary?: string
  }>
}

const PREVIEW_SIZE = 6

const levelText = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '高风险'
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平稳'
  }
}

const levelClass = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return 'new-report-level-danger'
    case 'alert': return 'new-report-level-alert'
    case 'watch': return 'new-report-level-watch'
    default: return 'new-report-level-calm'
  }
}

function cut(text?: string | null, max = 72) {
  if (!text) return ''
  const cleaned = text.trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max).trim()}…`
}

export default function ReportsV2Page() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const { isLoaded, getToken, isSignedIn } = useAppAuth()
  const [reports, setReports] = useState<ReportItem[]>([])
  const [details, setDetails] = useState<Record<string, ReportDetailPreview>>({})
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isLoaded) return
      setLoading(true)
      setError(false)
      setErrorMessage('')
      if (!isSignedIn) {
        setUnauthorized(true)
        setReports([])
        setDetails({})
        setLoading(false)
        return
      }
      try {
        const data = await withTokenRetry(getToken, (token) => reportsApi.list(1, PREVIEW_SIZE, token, 'archive'))
        if (cancelled) return

        const items: ReportItem[] =
          data?.reports ?? data?.items ?? data?.data ?? (Array.isArray(data) ? data : [])

        setReports(items)
        setUnauthorized(false)

        const previewResults = await Promise.allSettled(
          items.slice(0, 4).map((item) =>
            withTokenRetry(getToken, (token) => reportsApi.getByDate(item.report_date, token)).then((res) => ({
              date: item.report_date,
              detail: res as ReportDetailPreview,
            })),
          ),
        )

        if (cancelled) return

        const nextDetails: Record<string, ReportDetailPreview> = {}
        previewResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            nextDetails[result.value.date] = result.value.detail
          }
        })
        setDetails(nextDetails)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : ''
        if (message.includes('401') || message.includes('403')) {
          setUnauthorized(true)
          setReports([])
          setDetails({})
        } else {
          setError(true)
          setErrorMessage(formatApiErrorForUser(err, '历史简报暂时无法加载，请稍后再试。'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn])

  const featured = reports[0]
  const rest = reports.slice(1)

  return (
    <div className="new-home-shell">
      <section className="new-home-section !pt-10 sm:!pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Brief archive</p>
              <h1
                className="new-home-section-title"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                历史简报按研究产品的方式归档。
              </h1>
            </div>
            <p className="new-home-section-copy">
              这里保留美股与国际金融简报的时间序列感，让用户可以按日期回看盘前判断、风险提示和主题脉络，而不是只看到一串普通列表。
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="new-home-secondary-btn">
              返回首页
            </Link>
            <Link href="/subscribe" className="new-home-ghost-btn">
              查看会员权益
            </Link>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="new-report-skeleton h-[360px]" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="new-report-skeleton h-[172px]" />
                <div className="new-report-skeleton h-[172px]" />
                <div className="new-report-skeleton h-[172px]" />
                <div className="new-report-skeleton h-[172px]" />
              </div>
            </div>
          ) : unauthorized && !isSignedIn ? (
            <div className="new-home-cta-panel">
              <p className="new-home-kicker">Members only</p>
              <h2
                className="new-home-section-title mb-3"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                登录后查看完整历史简报。
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                历史简报需要登录权限。登录后会显示每日报告卡片、AI 摘要预览和风险提示摘要。
              </p>
              <div className="mt-6">
                {skipClerk ? (
                  <Link href="/sign-in?redirect_url=/reports" className="new-home-primary-btn">
                    去登录
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl="/reports">
                    <button type="button" className="new-home-primary-btn">
                      去登录
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          ) : error ? (
            <div className="new-home-cta-panel">
              <div className="new-home-cta-note">
                <CircleAlert className="h-4 w-4 text-rose-600" />
                {errorMessage || '当前无法加载历史简报，请稍后再试。'}
              </div>
            </div>
          ) : featured ? (
            <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <Link href={`/reports/${featured.report_date}`} className="new-report-feature-card group">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="new-home-kicker">Featured report</span>
                  <span className={`new-report-level-chip ${levelClass(featured.sentiment_level)}`}>
                    {levelText(featured.sentiment_level)}
                  </span>
                </div>

                <h2
                  className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {featured.title || `${featured.report_date} 美股与国际金融前瞻`}
                </h2>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="new-report-metric-card">
                    <CalendarRange className="h-4 w-4 text-sky-600" />
                    <div>
                      <p>报告日期</p>
                      <strong>{featured.report_date}</strong>
                    </div>
                  </div>
                  <div className="new-report-metric-card">
                    <BellRing className="h-4 w-4 text-rose-500" />
                    <div>
                      <p>重点预警</p>
                      <strong>{(featured.red_count ?? 0) + (featured.yellow_count ?? 0)} 条</strong>
                    </div>
                  </div>
                  <div className="new-report-metric-card">
                    <Layers3 className="h-4 w-4 text-amber-600" />
                    <div>
                      <p>核心信号</p>
                      <strong>{featured.item_count ?? 0} 条</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-7 new-report-feature-summary">
                  <p className="new-home-panel-kicker">Overview teaser</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {cut(details[featured.report_date]?.overview?.content, 150) || '进入报告后可查看完整市场概览、情绪评估、预警和主题脉络。'}
                  </p>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition-transform group-hover:translate-x-1">
                  打开完整报告
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>

              <div className="grid gap-4 sm:grid-cols-2">
                {rest.map((report) => {
                  const detail = details[report.report_date]
                  const firstAlert = detail?.alerts?.[0]

                  return (
                    <Link key={report.report_id} href={`/reports/${report.report_date}`} className="new-report-archive-card group">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-500">{report.report_date}</span>
                        <span className={`new-report-level-chip ${levelClass(report.sentiment_level)}`}>
                          {levelText(report.sentiment_level)}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-semibold text-slate-950">
                        {report.title || `${report.report_date} 报告`}
                      </h3>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="new-report-data-pill">
                          <TrendingUp className="h-3.5 w-3.5" />
                          情绪 {report.sentiment_score ?? '--'}
                        </span>
                        <span className="new-report-data-pill">
                          <BellRing className="h-3.5 w-3.5" />
                          预警 {(report.red_count ?? 0) + (report.yellow_count ?? 0)}
                        </span>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-slate-600">
                        {cut(detail?.overview?.content, 82) || cut(firstAlert?.zh_title || firstAlert?.title || firstAlert?.ai_summary, 82) || '含市场综述、预警提要、主题热度与报告详情入口。'}
                      </p>

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-transform group-hover:translate-x-1">
                        查看详情
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="new-home-cta-panel">
              <div className="new-home-cta-note">
                <Sparkles className="h-4 w-4 text-amber-600" />
                暂无可展示的历史报告数据。
              </div>
            </div>
          )}

          <div className="mt-8 new-home-cta-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="new-home-kicker">Next step</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">从历史简报继续回看判断，也可以回到首页了解产品结构。</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/" className="new-home-secondary-btn">
                  返回首页
                </Link>
                <Link href="/subscribe" className="new-home-primary-btn">
                  查看会员权益
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
