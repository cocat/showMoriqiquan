'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  CalendarRange,
  CircleAlert,
  Layers3,
  Newspaper,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { withTokenRetry } from '@/lib/session-token'
import type { NewReportData } from '@/app/components/NewReportDetailView'

interface LatestSummaryBundle {
  report?: {
    report_date?: string
  }
}

function riskLabel(level?: string) {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '高风险'
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平稳'
  }
}

function riskClass(level?: string) {
  switch ((level || '').toLowerCase()) {
    case 'danger': return 'new-report-level-danger'
    case 'alert': return 'new-report-level-alert'
    case 'watch': return 'new-report-level-watch'
    default: return 'new-report-level-calm'
  }
}

function shortText(text?: string | null, max = 88) {
  if (!text) return ''
  const clean = text.trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}…`
}

export default function ReportsHorizontalPage() {
  const { getToken } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<NewReportData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeHighlight, setActiveHighlight] = useState(0)
  const [activeBrief, setActiveBrief] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage('')
      try {
        const latest = await withTokenRetry(getToken, (token) => reportsApi.latestSummaryBundle(token))
        const date = (latest as LatestSummaryBundle)?.report?.report_date
        if (!date) throw new Error('最新报告日期不存在')
        const detail = await withTokenRetry(getToken, (token) => reportsApi.getByDate(date, token))
        if (!cancelled) setData(detail as NewReportData)
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : '加载横向日报失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [getToken])

  useEffect(() => {
    setActiveHighlight(0)
    setActiveBrief(0)
  }, [data?.report?.report_id])

  if (loading) {
    return (
      <div className="new-home-shell">
        <section className="new-home-section !pt-10">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="new-report-skeleton h-[104px]" />
            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
              <div className="new-report-skeleton h-[420px]" />
              <div className="new-report-skeleton h-[420px]" />
              <div className="new-report-skeleton h-[420px]" />
            </div>
            <div className="new-report-skeleton h-[240px]" />
          </div>
        </section>
      </div>
    )
  }

  if (!data?.report) {
    return (
      <div className="new-home-shell">
        <section className="new-home-section !pt-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="new-home-cta-panel">
              <p className="new-home-kicker">Horizontal report</p>
              <h1 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                横向日报原型暂时没有加载出来。
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {errorMessage || '请稍后再试。'}
              </p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const { report, overview, alerts = [], market_snapshots = [], news_briefs = [], topic_comparisons = [] } = data
  const totalAlerts = (report.red_count ?? 0) + (report.yellow_count ?? 0)
  const redAlerts = alerts.filter((item) => item.level === 'red')
  const yellowAlerts = alerts.filter((item) => item.level === 'yellow')
  const leadAlerts = alerts.slice(0, 6)
  const leadTopics = topic_comparisons.slice(0, 6)
  const leadBriefs = news_briefs.slice(0, 5)
  const leadSnapshots = market_snapshots.slice(0, 10)
  const currentHighlight = leadAlerts[activeHighlight] ?? leadAlerts[0] ?? null
  const currentBrief = leadBriefs[activeBrief] ?? leadBriefs[0] ?? null
  const currentAssets = Array.isArray(currentHighlight?.assets)
    ? currentHighlight?.assets.map((item) => typeof item === 'string' ? item : item?.name).filter(Boolean).slice(0, 6)
    : []

  return (
    <div className="new-home-shell">
      <section className="new-home-section !pt-8 !pb-6">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="horizontal-report-topbar">
            <div className="horizontal-report-topbar-main">
              <div>
                <p className="new-home-kicker">Horizontal daily report</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                  {report.title || `${report.report_date} 市场情报日报`}
                </h1>
              </div>
              <span className={`new-report-level-chip ${riskClass(report.sentiment_level)}`}>
                {riskLabel(report.sentiment_level)}
              </span>
            </div>

            <div className="horizontal-report-summary-row">
              <div className="horizontal-report-summary-chip">
                <CalendarRange className="h-4 w-4" />
                <span>{report.report_date}</span>
              </div>
              <div className="horizontal-report-summary-chip">
                <TrendingUp className="h-4 w-4" />
                <span>情绪 {report.sentiment_score ?? '--'}</span>
              </div>
              <div className="horizontal-report-summary-chip">
                <BellRing className="h-4 w-4" />
                <span>预警 {totalAlerts}</span>
              </div>
              <div className="horizontal-report-summary-chip">
                <Layers3 className="h-4 w-4" />
                <span>信号 {report.item_count ?? 0}</span>
              </div>
              <span className="horizontal-report-inline-link">双栏原型 · 4 / 8</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[4fr_8fr]">
            <aside className="horizontal-report-side-card">
              <p className="horizontal-report-panel-label">今日判断 + 热点主题</p>
              <div className="mt-5 space-y-4">
                <div className="horizontal-report-side-stat">
                  <span>总体风险</span>
                  <strong>{riskLabel(report.sentiment_level)}</strong>
                </div>
                <div className="horizontal-report-side-stat">
                  <span>红色预警</span>
                  <strong>{redAlerts.length}</strong>
                </div>
                <div className="horizontal-report-side-stat">
                  <span>黄色预警</span>
                  <strong>{yellowAlerts.length}</strong>
                </div>
                <div className="horizontal-report-side-stat">
                  <span>重点主题</span>
                  <strong>{leadTopics.length}</strong>
                </div>
              </div>

              <div className="horizontal-report-side-note">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <p>{shortText(overview?.content, 130) || '这里应该是一句先给结论的晨报摘要，而不是从长文章开读。'}</p>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="horizontal-report-panel-label">热点主题</p>
                  <span className="text-xs text-slate-400">{leadTopics.length} 个</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {leadTopics.map((topic, index) => (
                    <article key={`${topic.topic_name}-${index}`} className="horizontal-report-topic-stack-item">
                      <div className="flex items-center justify-between gap-3">
                        <span className="horizontal-report-topic-name">{topic.topic_name || '未命名主题'}</span>
                        <span className="horizontal-report-topic-delta">{topic.delta != null ? `${topic.delta > 0 ? '+' : ''}${topic.delta}` : '--'}</span>
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <strong>{topic.score ?? '--'}</strong>
                        <span>{topic.today_count ?? '--'} 条</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </aside>

            <main className="space-y-4 min-w-0">
              <section className="horizontal-report-lead-card">
                <div className="horizontal-report-section-head">
                  <div>
                    <p className="horizontal-report-panel-label">今日看点</p>
                    <h2 className="horizontal-report-section-title">本页内切换浏览，不再跳到别的页面</h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    {leadAlerts.length > 0 ? leadAlerts.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveHighlight(index)}
                        className={`horizontal-report-selector ${activeHighlight === index ? 'active' : ''}`}
                      >
                        <span className={`new-report-level-chip ${item.level === 'red' ? 'new-report-level-danger' : 'new-report-level-alert'}`}>
                          {item.level === 'red' ? '红色预警' : '黄色预警'}
                        </span>
                        <strong>{item.zh_title || item.title}</strong>
                        <p>{shortText(item.ai_summary || item.direction_note || item.topic_name || '重点事件摘要', 64)}</p>
                      </button>
                    )) : (
                      <div className="horizontal-report-selector active">
                        <span className="new-report-level-chip new-report-level-calm">暂无强风险</span>
                        <strong>今天更适合观察主题扩散与资产轮动</strong>
                        <p>如果当天没有明显红黄预警，这里也应该保留三条关键观察。</p>
                      </div>
                    )}
                  </div>

                  <article className="horizontal-report-detail-panel">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`new-report-level-chip ${currentHighlight?.level === 'red' ? 'new-report-level-danger' : currentHighlight?.level === 'yellow' ? 'new-report-level-alert' : 'new-report-level-calm'}`}>
                        {currentHighlight?.level === 'red' ? '今日主看点' : currentHighlight?.level === 'yellow' ? '重点跟踪' : '今日观察'}
                      </span>
                      {currentHighlight?.topic_name ? <span className="horizontal-report-mainline-topic">{currentHighlight.topic_name}</span> : null}
                    </div>
                    <h3>{currentHighlight?.zh_title || currentHighlight?.title || '今天更适合观察主题扩散与资产轮动'}</h3>
                    <p>{currentHighlight?.ai_summary || currentHighlight?.direction_note || overview?.content || '这里应该显示选中看点的完整摘要、方向判断和影响范围。'}</p>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="horizontal-report-mini-block">
                        <span>方向判断</span>
                        <strong>{currentHighlight?.direction_note ? shortText(currentHighlight.direction_note, 28) : '偏谨慎'}</strong>
                      </div>
                      <div className="horizontal-report-mini-block">
                        <span>相关标的</span>
                        <strong>{currentAssets.length > 0 ? currentAssets[0] : '纳指 / 黄金 / 美元'}</strong>
                      </div>
                      <div className="horizontal-report-mini-block">
                        <span>来源密度</span>
                        <strong>{currentHighlight?.source_name || '多源交叉'}</strong>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="horizontal-report-panel-label">市场联动</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {leadSnapshots.slice(0, 6).map((item, index) => (
                          <article key={`${item.symbol}-${index}`} className="horizontal-report-market-cell">
                            <div>
                              <p>{item.name || item.symbol}</p>
                              <span>{item.symbol}</span>
                            </div>
                            <div className="text-right">
                              <strong>{item.price ?? '--'}</strong>
                              <em className={item.pct_change != null && item.pct_change < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                {item.pct_change != null ? `${item.pct_change > 0 ? '+' : ''}${item.pct_change.toFixed(2)}%` : '--'}
                              </em>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>
              </section>

              <section className="horizontal-report-lead-card">
                <div className="horizontal-report-section-head">
                  <div>
                    <p className="horizontal-report-panel-label">新闻脉络</p>
                    <h2 className="horizontal-report-section-title">同样留在本页内切换阅读，承担背景解释层</h2>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    {leadBriefs.map((brief, index) => (
                      <button
                        key={`${brief.topic_name}-${index}`}
                        type="button"
                        onClick={() => setActiveBrief(index)}
                        className={`horizontal-report-selector ${activeBrief === index ? 'active' : ''}`}
                      >
                        <span className="horizontal-report-brief-head">
                          <Newspaper className="h-4 w-4 text-slate-400" />
                          {brief.topic_name || '新闻简报'}
                        </span>
                        <p>{shortText(brief.body, 68)}</p>
                      </button>
                    ))}
                  </div>

                  <article className="horizontal-report-detail-panel">
                    <div className="horizontal-report-brief-head">
                      <Newspaper className="h-4 w-4 text-slate-400" />
                      <span>{currentBrief?.topic_name || '新闻脉络'}</span>
                    </div>
                    <h3>{currentBrief?.topic_name || '新闻背景展开'}</h3>
                    <p>{currentBrief?.body || '这里应该显示该主题下更完整的背景脉络、新闻归因和上下文说明。'}</p>
                    {currentBrief?.impact ? (
                      <div className="horizontal-report-side-note !mt-5">
                        <CircleAlert className="h-4 w-4 text-sky-600" />
                        <p>{currentBrief.impact}</p>
                      </div>
                    ) : null}
                  </article>
                </div>
              </section>

              <section className="horizontal-report-lead-card">
                <div className="horizontal-report-section-head">
                  <div>
                    <p className="horizontal-report-panel-label">今日主线</p>
                    <h2 className="horizontal-report-section-title">主线内容改成从上往下浏览，承担“深读”角色</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {leadAlerts.length > 0 ? leadAlerts.map((item, index) => (
                    <article key={`${item.id}-${index}`} className="horizontal-report-mainline-item">
                      <div className="horizontal-report-mainline-meta">
                        <span className={`new-report-level-chip ${item.level === 'red' ? 'new-report-level-danger' : 'new-report-level-alert'}`}>
                          {item.level === 'red' ? '红色预警' : '黄色预警'}
                        </span>
                        {item.topic_name ? <span className="horizontal-report-mainline-topic">{item.topic_name}</span> : null}
                      </div>
                      <h3>{item.zh_title || item.title}</h3>
                      <p>{item.ai_summary || item.direction_note || '这里承接的是更完整的主线描述，用户会从上往下连续浏览。'}</p>
                    </article>
                  )) : (
                    <article className="horizontal-report-mainline-item">
                      <div className="horizontal-report-mainline-meta">
                        <span className="new-report-level-chip new-report-level-calm">主线观察</span>
                      </div>
                      <h3>今天没有显著预警时，这里依然应该保留主线叙事</h3>
                      <p>例如宏观流动性、主题轮动、风险偏好变化，这些都更适合放在主线区做纵向阅读。</p>
                    </article>
                  )}
                </div>
              </section>
            </main>

          </div>
        </div>
      </section>
    </div>
  )
}
