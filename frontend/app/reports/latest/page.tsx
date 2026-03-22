'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SignInButton } from '@clerk/nextjs'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { ArrowRight, Bell, CalendarDays, AlertTriangle, BarChart2, Lock } from 'lucide-react'
import { SectionPlaceholder } from '@/app/components/SectionPlaceholder'
import type { SnapshotItem } from '@/app/components/report/MarketSnapshot'
import type { OptionsData } from '@/app/components/report/OptionsPanel'

const SentimentDashboard = dynamic(
  () => import('@/app/components/report/SentimentDashboard').then((m) => m.SentimentDashboard),
  { ssr: false }
)
const MarketSnapshot = dynamic(
  () => import('@/app/components/report/MarketSnapshot').then((m) => m.MarketSnapshot),
  { ssr: false }
)
const AlertsList = dynamic(
  () => import('@/app/components/report/AlertsList').then((m) => m.AlertsList),
  { ssr: false }
)
const NewsBriefs = dynamic(
  () => import('@/app/components/report/NewsBriefs').then((m) => m.NewsBriefs),
  { ssr: false }
)
const OptionsPanel = dynamic(
  () => import('@/app/components/report/OptionsPanel').then((m) => m.OptionsPanel),
  { ssr: false }
)
const TopicComparison = dynamic(
  () => import('@/app/components/report/TopicComparison').then((m) => m.TopicComparison),
  { ssr: false }
)

interface LatestSummary {
  report_id: string
  report_date: string
  title?: string
  generated_at?: string
  sentiment_score?: number
  sentiment_level?: string
  red_count?: number
  yellow_count?: number
  item_count?: number
}

interface FullReport {
  report: LatestSummary & { message?: string }
  sentiment?: { score: number; level: string; label?: string; description?: string } | null
  market_snapshots?: SnapshotItem[]
  overview?: { content: string } | null
  alerts?: Array<{
    id: number
    level: string
    title: string
    zh_title?: string
    ai_summary?: string
    source_name?: string
    published_at?: string
    link?: string
    topic_name?: string
    direction?: string
    direction_note?: string
  }>
  news_briefs?: Array<{
    topic_name?: string
    body?: string
    impact?: string
    source_count?: number
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

const levelLabel = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '危险'
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平静'
  }
}

export default function LatestReportPage() {
  const { getToken, isSignedIn } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [latest, setLatest] = useState<LatestSummary | null>(null)
  const [overviewExcerpt, setOverviewExcerpt] = useState('')
  const [detail, setDetail] = useState<FullReport | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')
  const [isRestricted, setIsRestricted] = useState(false)

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
          if (cancelled) return
          setLatest(null)
          setOverviewExcerpt('')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    })
    return () => { cancelled = true }
  }, [getToken])

  useEffect(() => {
    setDetail(null)
    setAccessMessage('')
    setIsRestricted(false)
  }, [latest?.report_date])

  useEffect(() => {
    if (!latest?.report_date) return
    let cancelled = false
    setDetailLoading(true)
    // 这里直接走 reportsApi 的持久缓存（默认 5 分钟）。
    getToken()
      .then((token) => reportsApi.getByDate(latest.report_date, token))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        if (cancelled) return
        setDetail(res as FullReport)
        const msg = typeof res?.message === 'string' ? res.message : ''
        // 已登录用户按产品策略展示完整模块，不再套用访客/角色的摘要锁定提示
        if (isSignedIn) {
          setAccessMessage('')
          setIsRestricted(false)
        } else {
          setAccessMessage(msg)
          setIsRestricted(Boolean(msg))
        }
      })
      .catch((error) => {
        if (cancelled) return
        const msg = (error as Error)?.message ?? ''
        if (msg.includes('401') || msg.includes('403')) {
          setIsRestricted(true)
          setAccessMessage(
            isSignedIn
              ? '完整报告加载失败，请刷新页面或重新登录后再试。'
              : '当前角色仅开放摘要与部分模块，登录并开通权限后可查看完整信息。',
          )
          return
        }
        setAccessMessage('加载完整报告失败，请稍后重试。')
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => { cancelled = true }
  }, [latest?.report_date, getToken, isSignedIn])

  const sentimentData = detail?.sentiment ?? (
    latest?.sentiment_score != null || latest?.sentiment_level
      ? {
        score: latest?.sentiment_score ?? 0,
        level: latest?.sentiment_level || 'calm',
        label: levelLabel(latest?.sentiment_level),
        description: '当日市场情绪综合评估',
      }
      : null
  )
  const alerts = detail?.alerts ?? []
  const briefs = detail?.news_briefs ?? []
  const snapshots = detail?.market_snapshots ?? []
  const options = detail?.options
  const topics = detail?.topic_comparisons ?? []
  const overviewContent = detail?.overview?.content || overviewExcerpt
  const effectiveRestricted = isRestricted && !isSignedIn

  return (
    <div className="min-h-screen bg-mentat-bg-page">
      <section className="border-b border-mentat-border-section bg-gradient-to-b from-mentat-bg-gradient-start to-mentat-bg-page">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-[11px] text-gold font-mono uppercase tracking-[0.15em]">
            <CalendarDays className="w-3.5 h-3.5" />
            每日市场摘要
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            今日市场摘要：3 分钟看懂风险与机会
          </h1>
          <p className="mt-2 text-sm text-mentat-text-secondary max-w-2xl">
            {isSignedIn
              ? '最新报告直接在本页展开，登录状态下可查看完整模块。'
              : '最新报告直接在本页展开；登录后可查看完整模块，未登录时部分内容为摘要预览。'}
          </p>
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
          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/35 bg-gradient-to-b from-mentat-bg-elevated to-mentat-bg-card overflow-hidden">
              <div className="px-6 py-5 border-b border-mentat-border-card">
                <div className="text-[11px] text-mentat-muted-secondary font-mono uppercase tracking-[0.12em]">
                  {latest.report_date}
                </div>
                <h2 className="text-xl font-semibold text-white mt-1">
                  {latest.title || `${latest.report_date} 市场摘要：风险与机会速览`}
                </h2>
                <p className="text-sm text-mentat-text-secondary mt-2">
                  当前页面已进入“最新报告详情模式”，无需再跳转其他页面查看完整版。
                </p>
              </div>

              <div className="px-6 py-5 grid sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                  <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">市场情绪</div>
                  <div className="text-lg font-mono text-gold">{latest.sentiment_score ?? '--'}</div>
                  <div className="text-xs text-mentat-muted-secondary">{levelLabel(latest.sentiment_level)}</div>
                </div>
                <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                  <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">信号数量</div>
                  <div className="text-lg font-mono text-white">{latest.item_count ?? 0}</div>
                  <div className="text-xs text-mentat-muted-secondary inline-flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" />
                    当日信号数
                  </div>
                </div>
                <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                  <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">重大预警</div>
                  <div className="text-lg font-mono text-mentat-danger">{latest.red_count ?? 0}</div>
                  <div className="text-xs text-mentat-muted-secondary inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    重大预警
                  </div>
                </div>
                <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/60 p-3">
                  <div className="text-[10px] text-mentat-muted-tertiary uppercase tracking-wider mb-1">重要预警</div>
                  <div className="text-lg font-mono text-mentat-warning">{latest.yellow_count ?? 0}</div>
                  <div className="text-xs text-mentat-muted-secondary inline-flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    重要预警
                  </div>
                </div>
              </div>
            </div>

            {accessMessage && (
              <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
                {accessMessage}
              </div>
            )}

            {detailLoading ? (
              <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5 animate-pulse">
                <div className="h-4 w-40 rounded bg-mentat-border-card mb-3" />
                <div className="h-24 w-full rounded bg-mentat-border-card mb-2" />
                <div className="h-24 w-full rounded bg-mentat-border-card" />
              </div>
            ) : (
              <>
                {sentimentData ? (
                  <SentimentDashboard data={sentimentData} />
                ) : (
                  <section id="sentiment" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="情绪仪表盘" message="暂无情绪数据" />
                  </section>
                )}

                {effectiveRestricted ? (
                  <section id="market" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="市场行情快照" message="当前角色未开放该模块" />
                  </section>
                ) : snapshots.length > 0 ? (
                  <MarketSnapshot items={snapshots as SnapshotItem[]} />
                ) : (
                  <section id="market" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="市场行情快照" message="暂无行情数据" />
                  </section>
                )}

                {overviewContent ? (
                  <section id="overview" className="scroll-mt-28 xl:scroll-mt-20">
                    <div className="report-card">
                      <div className="report-card-header blue">市场综述</div>
                      <div className="overview-body">{overviewContent}</div>
                    </div>
                  </section>
                ) : (
                  <section id="overview" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="市场综述" message="暂无综述内容" />
                  </section>
                )}

                {effectiveRestricted ? (
                  <section id="alerts" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="核心预警" message="当前角色仅开放摘要，预警详情已锁定" />
                  </section>
                ) : alerts.length > 0 ? (
                  <AlertsList items={alerts} />
                ) : (
                  <section id="alerts" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="核心预警" message="暂无预警数据" />
                  </section>
                )}

                {effectiveRestricted ? (
                  <section id="briefs" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="新闻简报" message="当前角色未开放该模块" />
                  </section>
                ) : briefs.length > 0 ? (
                  <NewsBriefs items={briefs} />
                ) : (
                  <section id="briefs" className="scroll-mt-28 xl:scroll-mt-20">
                    <SectionPlaceholder title="新闻简报" message="暂无新闻简报" />
                  </section>
                )}

                {effectiveRestricted ? (
                  <>
                    <section id="options" className="scroll-mt-28 xl:scroll-mt-20">
                      <SectionPlaceholder title="期权策略" message="当前角色未开放该模块" />
                    </section>
                    <section id="topics" className="scroll-mt-28 xl:scroll-mt-20">
                      <SectionPlaceholder title="热点主题" message="当前角色未开放该模块" />
                    </section>
                  </>
                ) : (
                  <>
                    {(options?.body_text || (options?.candidates && (options.candidates as unknown[]).length > 0)) ? (
                      <OptionsPanel data={options as OptionsData} />
                    ) : (
                      <section id="options" className="scroll-mt-28 xl:scroll-mt-20">
                        <SectionPlaceholder title="期权策略" message="暂无期权策略" />
                      </section>
                    )}
                    {topics.length > 0 ? (
                      <TopicComparison items={topics} />
                    ) : (
                      <section id="topics" className="scroll-mt-28 xl:scroll-mt-20">
                        <SectionPlaceholder title="热点主题" message="暂无热点主题数据" />
                      </section>
                    )}
                  </>
                )}
              </>
            )}

            {!isSignedIn && (
              <div className="rounded-xl border border-mentat-border-card bg-black/35 p-4">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-gold mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-gold font-medium">登录后可解锁完整报告模块</p>
                    <p className="text-xs text-mentat-text-secondary mt-1">
                      当前按角色展示内容，登录后会自动按你的权限加载可查看的完整信息。
                    </p>
                    <SignInButton mode="modal" forceRedirectUrl="/reports/latest">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                      >
                        去登录
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-mentat-border-card bg-mentat-bg-card p-8 text-center">
            <p className="text-mentat-text-secondary mb-4">当前还没有可展示的最新报告</p>
            <div className="px-6 py-5 border-b border-mentat-border-card">
              {isSignedIn ? (
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                >
                  浏览历史报告
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl="/reports/latest">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                  >
                    登录后继续查看
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
