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
  const { getToken, isSignedIn } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [archiveNavigating, setArchiveNavigating] = useState(false)
  const [latest, setLatest] = useState<LatestSummary | null>(null)
  const [overviewExcerpt, setOverviewExcerpt] = useState('')
  const [previewMessage, setPreviewMessage] = useState('')
  const [previewAlerts, setPreviewAlerts] = useState<Array<{ id: number; level?: string; title?: string; zh_title?: string; ai_summary?: string }>>([])
  const [previewBrief, setPreviewBrief] = useState<{ topic_name?: string; body?: string; impact?: string; source_count?: number } | null>(null)

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
          if (!next?.report_date) {
            setPreviewMessage('')
            setPreviewAlerts([])
            setPreviewBrief(null)
            return
          }
          reportsApi
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .getByDate(next.report_date, token).then((detail: any) => {
              if (cancelled) return
              setPreviewMessage(typeof detail?.message === 'string' ? detail.message : '')
              setPreviewAlerts(Array.isArray(detail?.alerts) ? detail.alerts.slice(0, 3) : [])
              const firstBrief = Array.isArray(detail?.news_briefs) ? detail.news_briefs[0] : null
              setPreviewBrief(firstBrief && typeof firstBrief === 'object' ? firstBrief : null)
            })
            .catch(() => {
              if (cancelled) return
              setPreviewMessage('')
              setPreviewAlerts([])
              setPreviewBrief(null)
            })
        })
        .catch(() => {
          if (cancelled) {
            return
          }
          setLatest(null)
          setOverviewExcerpt('')
          setPreviewMessage('')
          setPreviewAlerts([])
          setPreviewBrief(null)
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
  const isPreviewMode = previewMessage.length > 0

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
              className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                archiveNavigating
                  ? 'border-mentat-border text-mentat-muted-secondary pointer-events-none opacity-80'
                  : 'border-mentat-border text-mentat-text hover:bg-mentat-bg-card'
              }`}
              onClick={() => setArchiveNavigating(true)}
            >
              {archiveNavigating ? '正在打开归档...' : '去报告归档'}
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

            {isPreviewMode && (
              <div className="px-6 pb-5">
                {previewAlerts.length > 0 && (
                  <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/40 p-4 mb-3">
                    <div className="text-[11px] text-mentat-muted-secondary font-medium uppercase tracking-[0.12em] mb-2">预览预警（部分）</div>
                    <div className="space-y-2">
                      {previewAlerts.map((alert) => {
                        const alertText = alert.zh_title || alert.title || alert.ai_summary || '未命名预警'
                        const dotClass = alert.level === 'red' ? 'bg-mentat-danger' : 'bg-mentat-warning'
                        return (
                          <div key={alert.id} className="flex items-start gap-2.5">
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${dotClass}`} />
                            <p className="text-sm text-mentat-text-secondary leading-relaxed line-clamp-1">{alertText}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {previewBrief && (
                  <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-page/40 p-4">
                    <div className="text-[11px] text-mentat-muted-secondary font-medium uppercase tracking-[0.12em] mb-1.5">新闻简报预览（1 条）</div>
                    <p className="text-sm text-mentat-text leading-relaxed line-clamp-2">
                      {previewBrief.body || previewBrief.impact || '暂无新闻摘要'}
                    </p>
                    <p className="text-[11px] text-mentat-muted-secondary mt-2">
                      {previewBrief.topic_name || '未分类主题'}
                      {previewBrief.source_count != null ? ` · ${previewBrief.source_count} 个来源` : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isPreviewMode && (
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gold font-medium">{previewMessage}</p>
                    <p className="text-xs text-mentat-text-secondary mt-1">完整模块包含市场综述、行情快照、新闻脉络、期权策略等。</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isSignedIn ? (
                      <>
                        <Link
                          href="/sign-up?redirect_url=/reports/latest"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                        >
                          免费注册查看完整
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href="/sign-in?redirect_url=/reports/latest"
                          className="inline-flex items-center gap-2 px-4 py-2.5 border border-mentat-border text-mentat-text rounded-lg text-sm hover:bg-mentat-bg-card transition-colors"
                        >
                          已有账号登录
                        </Link>
                      </>
                    ) : (
                      <Link
                        href="/subscribe"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                      >
                        订阅解锁完整日报
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
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
                className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                  archiveNavigating
                    ? 'border-mentat-border text-mentat-muted-secondary pointer-events-none opacity-80'
                    : 'border-mentat-border text-mentat-text hover:bg-mentat-bg-page'
                }`}
                onClick={() => setArchiveNavigating(true)}
              >
                {archiveNavigating ? '正在打开归档...' : '查看归档'}
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
