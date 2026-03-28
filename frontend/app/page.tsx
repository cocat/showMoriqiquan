'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { withTokenRetry } from '@/lib/session-token'
import { InsightCard, SectionHeader } from './components/HomePrimitives'
import {
  ArrowRight,
  BarChart2,
  Bell,
  History,
  AlertTriangle,
  Sparkles,
  FileText,
  Layers,
} from 'lucide-react'

interface LatestSummary {
  report_id: string
  report_date: string
  title?: string
  generated_at?: string
  push_type?: string
  time_slot?: string
  sentiment_score?: number
  sentiment_level?: string
  red_count?: number
  yellow_count?: number
  item_count?: number
  topic_count?: number
  multi_source_count?: number
}

interface AlertPreview {
  id: number
  level?: string
  title?: string
  zh_title?: string
  ai_summary?: string
}

const levelColor = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '#FF4444'
    case 'alert': return '#D4A55A'
    case 'watch': return '#C19A6B'
    default: return '#4CAF50'
  }
}

const levelLabel = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '危险'
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平静'
  }
}

const valuePoints = [
  {
    title: '多维覆盖',
    description: '宏观、资金、指数、主题、事件、期权六个维度一起看。',
    meta: 'coverage',
    points: ['跨资产横截面监控', '多源信号交叉验证'],
  },
  {
    title: '高频更新',
    description: '每天固定时间更新，内容结构统一，便于快速复盘和决策。',
    meta: 'cadence',
    points: ['每日 08:00 输出', '7 天连续可回溯'],
  },
  {
    title: '专业筛选',
    description: '先按预警级别过滤噪声，再用 AI 提炼重点风险与机会。',
    meta: 'signal quality',
    points: ['红黄双级优先级', '方向建议可直接执行'],
  },
]

const reportModules = [
  {
    title: '情绪仪表盘 + 行情快照',
    description: '量化市场情绪，叠加核心指数与品种表现，一眼判断今日风险等级。',
    icon: BarChart2,
    meta: 'market state',
    points: ['情绪指数 regime 标定', '跨品种同屏对比'],
  },
  {
    title: '红黄两级预警 + 方向建议',
    description: 'AI 挑出重要事件并给出方向提示，决定「需要盯」还是「可忽略」。',
    icon: Bell,
    meta: 'risk radar',
    points: ['重大/重要预警区分', '事件与策略建议绑定'],
  },
  {
    title: '新闻脉络 + 主题热度 + 期权视角',
    description: '新闻按主题归类、热度对比，关键资产补充期权情绪信号。',
    icon: History,
    meta: 'context layer',
    points: ['主题热度日环比', '期权情绪辅助验证'],
  },
]

const coverageTags = [
  '宏观驱动',
  '跨资产资金流',
  '事件风险',
  '主题热度',
  '期权情绪',
  'AI 行动建议',
]

const loginHighlights = [
  '开盘前 10 分钟看完当天风险与机会',
  '红黄预警直接标注优先级，减少筛选成本',
  '关键事件附带方向建议，便于快速制定计划',
]

export default function HomePage() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const { getToken, authProvider, isSignedIn } = useAppAuth()
  const [latest, setLatest] = useState<LatestSummary | null>(null)
  const [overviewExcerpt, setOverviewExcerpt] = useState<string>('')
  const [alerts, setAlerts] = useState<AlertPreview[]>([])
  const [loading, setLoading] = useState(true)
  const alertsFetchedDateRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    withTokenRetry(getToken, (token) => reportsApi.latestSummaryBundle(token))
      .then((d) => {
        if (cancelled) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyD = d as any
        const report = anyD?.report
        const parsed = report && typeof report === 'object' && report.report_date != null ? report : null
        setLatest(parsed)
        setOverviewExcerpt(typeof anyD?.overview_teaser === 'string' ? anyD.overview_teaser : '')
      })
      .catch(() => {
        if (!cancelled) {
          setLatest(null)
          setOverviewExcerpt('')
          setAlerts([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [getToken, authProvider])

  useEffect(() => {
    const reportDate = latest?.report_date
    if (!reportDate) return
    // 已登录（Clerk 或手机号 app_token）即可拉取当日预警预览
    if (!isSignedIn) return
    if (alertsFetchedDateRef.current === reportDate) return
    alertsFetchedDateRef.current = reportDate

    let cancelled = false
    withTokenRetry(getToken, (token) => reportsApi.getByDate(reportDate, token))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((detail: any) => {
        if (cancelled) return
        setAlerts(Array.isArray(detail?.alerts) ? detail.alerts.slice(0, 5) : [])
      })
      .catch(() => {
        if (!cancelled) setAlerts([])
      })

    return () => { cancelled = true }
  }, [latest?.report_date, isSignedIn, getToken])

  const color = levelColor(latest?.sentiment_level)
  const red = latest?.red_count ?? 0
  const yellow = latest?.yellow_count ?? 0
  const items = latest?.item_count ?? 0
  const topics = latest?.topic_count ?? 0
  const sources = latest?.multi_source_count ?? 0
  const totalAlerts = red + yellow
  const criticalShare = totalAlerts > 0 ? `${Math.round((red / totalAlerts) * 100)}%` : '--'
  const alertDensity = items > 0 ? `${Math.round((totalAlerts / items) * 100)}%` : '--'
  const redRatio = totalAlerts > 0 ? `${Math.round((red / totalAlerts) * 100)}%` : '--'
  const yellowRatio = totalAlerts > 0 ? `${Math.round((yellow / totalAlerts) * 100)}%` : '--'
  const signalsPerTopic = topics > 0 ? (items / topics).toFixed(1) : '--'
  const alertsPerTopic = topics > 0 ? (totalAlerts / topics).toFixed(1) : '--'
  const sourceCoverage = items > 0 && sources > 0 ? `${Math.round((sources / items) * 100)}%` : '--'
  const gaugePercent = latest?.sentiment_score != null
    ? Math.min(100, Math.max(0, latest.sentiment_score))
    : null
  const leftAlerts = alerts.filter((_, index) => index % 2 === 0)
  const rightAlerts = alerts.filter((_, index) => index % 2 === 1)
  const detailHref = '/reports/latest'
  const afterSignInUrl = '/reports/latest'
  const generatedTime = latest?.generated_at
    ? new Date(latest.generated_at).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    : '--'
  const reportIdShort = latest?.report_id ? latest.report_id.slice(-8).toUpperCase() : '--'
  const pushLabel = latest?.push_type || latest?.time_slot || 'daily'

  return (
    <div className="min-h-screen bg-mentat-bg-page">
      {/* ===== 首屏：紧凑品牌行 + 日报核心内容 ===== */}
      <section className="relative border-b border-mentat-border-section bg-gradient-to-b from-mentat-bg-gradient-start to-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-5 sm:pt-5 sm:pb-6">
          {/* 品牌行 */}
          <div className="mb-3">
            <div>
              <div className="text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.2em] mb-1">
                market intelligence daily brief
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                市场情报晨报
                {latest?.report_date && (
                  <span className="text-gold font-semibold text-lg sm:text-xl ml-2">
                    {latest.report_date}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* 日报主体：左右两栏 */}
          {loading ? (
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card/40 p-6 animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-3">
                  <div className="h-5 w-2/3 bg-white/5 rounded" />
                  <div className="h-4 w-full bg-white/5 rounded" />
                  <div className="h-4 w-5/6 bg-white/5 rounded" />
                  <div className="h-16 bg-white/5 rounded-lg mt-4" />
                  <div className="h-16 bg-white/5 rounded-lg" />
                </div>
                <div className="lg:col-span-5 space-y-3">
                  <div className="h-24 bg-white/5 rounded-xl" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 bg-white/5 rounded-lg" />
                    <div className="h-16 bg-white/5 rounded-lg" />
                    <div className="h-16 bg-white/5 rounded-lg" />
                    <div className="h-16 bg-white/5 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ) : latest ? (
            <Link href={detailHref} className="block group">
              <div className="rounded-xl border border-mentat-border-card bg-gradient-to-br from-[#0f1116] via-[#141720] to-[#0b0d12] overflow-hidden hover:border-gold/30 transition-colors">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* 左栏：高密度摘要区 */}
                  <div className="lg:col-span-8 p-4 sm:p-4 lg:border-r lg:border-mentat-border-card">
                    <h2 className="text-base sm:text-lg font-semibold text-white leading-snug mb-2 group-hover:text-gold transition-colors">
                      {latest.title || `${latest.report_date} 市场情报日报`}
                    </h2>
                    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.08em] text-mentat-muted-secondary">
                      <span className="rounded border border-mentat-border-card bg-black/20 px-1.5 py-0.5">Updated {generatedTime}</span>
                      <span className="rounded border border-mentat-border-card bg-black/20 px-1.5 py-0.5">Risk {levelLabel(latest?.sentiment_level)}</span>
                      <span className="rounded border border-mentat-border-card bg-black/20 px-1.5 py-0.5">Push {pushLabel}</span>
                      <span className="rounded border border-mentat-border-card bg-black/20 px-1.5 py-0.5">ID {reportIdShort}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Signals</p>
                        <p className="text-sm font-mono font-semibold text-white leading-none mt-0.5">{items || '--'}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Alerts</p>
                        <p className="text-sm font-mono font-semibold text-mentat-warning leading-none mt-0.5">{totalAlerts || '--'}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Critical %</p>
                        <p className="text-sm font-mono font-semibold text-mentat-danger leading-none mt-0.5">{criticalShare}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Density</p>
                        <p className="text-sm font-mono font-semibold text-gold leading-none mt-0.5">{alertDensity}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Red Ratio</p>
                        <p className="text-sm font-mono font-semibold text-mentat-danger leading-none mt-0.5">{redRatio}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Yellow Ratio</p>
                        <p className="text-sm font-mono font-semibold text-mentat-warning leading-none mt-0.5">{yellowRatio}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Sig/Topic</p>
                        <p className="text-sm font-mono font-semibold text-white leading-none mt-0.5">{signalsPerTopic}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/25 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-[0.1em] font-mono text-mentat-muted-tertiary">Src Cover</p>
                        <p className="text-sm font-mono font-semibold text-white leading-none mt-0.5">{sourceCoverage}</p>
                      </div>
                    </div>

                    {overviewExcerpt && (
                      <div className="rounded-lg border border-gold/20 bg-gradient-to-r from-[#2A2115]/60 to-[#1F1A13]/40 p-2.5 mb-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3 h-3 text-gold flex-shrink-0" />
                          <span className="text-[10px] font-medium text-gold uppercase tracking-wider">AI 摘要</span>
                        </div>
                        <p className="text-[12px] text-mentat-text-secondary leading-relaxed line-clamp-2">
                          {overviewExcerpt}
                        </p>
                      </div>
                    )}

                    {alerts.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.12em]">
                            预警速览
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono">
                            <span className="px-1.5 py-0.5 rounded border border-red-900/40 bg-red-950/30 text-mentat-danger">R {red}</span>
                            <span className="px-1.5 py-0.5 rounded border border-amber-900/40 bg-amber-950/20 text-mentat-warning">Y {yellow}</span>
                            <span className="px-1.5 py-0.5 rounded border border-mentat-border-card bg-black/20 text-mentat-muted-secondary">A/T {alertsPerTopic}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {[leftAlerts, rightAlerts].map((columnAlerts, colIndex) => (
                            <div key={colIndex} className="grid gap-1.5">
                              {columnAlerts.map((alert) => {
                                const text = alert.zh_title || alert.title || alert.ai_summary || '未命名预警'
                                const isRed = alert.level === 'red'
                                return (
                                  <div
                                    key={alert.id}
                                    className={`flex items-start gap-2 rounded-md px-2 py-1 text-sm ${
                                      isRed
                                        ? 'bg-red-950/30 border border-red-900/30'
                                        : 'bg-amber-950/20 border border-amber-900/20'
                                    }`}
                                  >
                                    <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isRed ? 'text-mentat-danger' : 'text-mentat-warning'}`} />
                                    <span className="text-mentat-text-secondary leading-snug line-clamp-1 text-[12px]">
                                      {text}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="text-[9px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.08em] mt-1.5">
                          total {totalAlerts} · critical {criticalShare} · density {alertDensity}
                        </div>
                        {(red + yellow > alerts.length) && (
                          <p className="text-[10px] text-mentat-muted-tertiary mt-1">
                            共 {red + yellow} 条预警，点击卡片继续阅读 →
                          </p>
                        )}
                      </div>
                    )}

                    {!overviewExcerpt && alerts.length === 0 && (
                      <p className="text-sm text-mentat-text-secondary">
                        当日核心信号已压缩在本篇，点击查看完整报告。
                      </p>
                    )}
                    <p className="text-[11px] text-mentat-muted-secondary mt-2">
                      今日结论速览：{levelLabel(latest?.sentiment_level)}情绪，{totalAlerts} 条重点预警，覆盖 {topics || '--'} 个主题 / {sources || '--'} 个多源信号。
                    </p>
                  </div>

                  {/* 右栏：情绪指数 + 数据矩阵 */}
                  <div className="lg:col-span-4 p-3.5 sm:p-4 bg-black/20">
                    {/* 情绪指数 */}
                    <div className="rounded-lg bg-white/[0.03] p-3 mb-2.5">
                      <div className="text-[9px] text-mentat-muted-tertiary font-mono uppercase tracking-wider mb-1">
                        Sentiment Index
                      </div>
                      {latest.sentiment_score != null ? (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[38px] font-bold font-mono leading-none" style={{ color }}>
                              {latest.sentiment_score}
                            </span>
                            <span
                              className="text-xs font-semibold px-1.5 py-0.5 rounded"
                              style={{ color, backgroundColor: `${color}20` }}
                            >
                              {levelLabel(latest.sentiment_level)}
                            </span>
                          </div>
                          {gaugePercent != null && (
                            <div className="mt-2">
                              <div
                                className="h-2 rounded-full overflow-hidden relative"
                                style={{
                                  background:
                                    'linear-gradient(to right, #4CAF50 0%, #4CAF50 35%, #C19A6B 35%, #C19A6B 68%, #D4A55A 68%, #D4A55A 88%, #8A5A36 88%, #8A5A36 100%)',
                                }}
                              >
                                <div
                                  className="absolute w-3 h-3 rounded-full bg-white shadow-lg transition-all duration-700"
                                  style={{
                                    left: `${gaugePercent}%`,
                                    top: '50%',
                                    transform: 'translateX(-50%) translateY(-50%)',
                                    boxShadow: '0 0 0 2px #0b0d12',
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-[8px] text-mentat-muted-tertiary font-mono mt-1">
                                <span>0 平静</span>
                                <span>50 警戒</span>
                                <span>100 危险</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-2xl font-mono text-mentat-muted-secondary">--</div>
                      )}
                    </div>

                    {/* 关键数据矩阵 */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="rounded-md border border-mentat-border-card bg-black/30 px-2 py-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <FileText className="w-3 h-3 text-mentat-muted-secondary" />
                          <span className="text-[9px] text-mentat-muted-tertiary font-mono uppercase">Signals</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-white leading-none">{items || '--'}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/30 px-2 py-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <AlertTriangle className="w-3 h-3 text-mentat-danger" />
                          <span className="text-[9px] text-mentat-muted-tertiary font-mono uppercase">Red</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-mentat-danger leading-none">{red || '--'}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/30 px-2 py-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Bell className="w-3 h-3 text-mentat-warning" />
                          <span className="text-[9px] text-mentat-muted-tertiary font-mono uppercase">Yellow</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-mentat-warning leading-none">{yellow || '--'}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/30 px-2 py-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Layers className="w-3 h-3 text-mentat-muted-secondary" />
                          <span className="text-[9px] text-mentat-muted-tertiary font-mono uppercase">Topics</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-white leading-none">{topics || '--'}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/30 px-2 py-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Layers className="w-3 h-3 text-mentat-muted-secondary" />
                          <span className="text-[9px] text-mentat-muted-tertiary font-mono uppercase">Sources</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-white leading-none">{sources || '--'}</p>
                      </div>
                      <div className="rounded-md border border-mentat-border-card bg-black/30 px-2 py-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <AlertTriangle className="w-3 h-3 text-gold" />
                          <span className="text-[9px] text-mentat-muted-tertiary font-mono uppercase">Alert%</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-gold leading-none">{alertDensity}</p>
                      </div>
                    </div>

                    {/* 覆盖范围标签 */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {coverageTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded border border-mentat-border-weak bg-white/[0.02] text-[9px] uppercase tracking-[0.06em] text-mentat-muted-secondary font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-mentat-muted-tertiary mt-2">点击卡片查看完整报告与历史上下文</p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-8 text-center">
              <Sparkles className="w-8 h-8 text-gold mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">今日日报已生成</h3>
              <p className="text-mentat-text-secondary text-sm max-w-sm mx-auto mb-5">
                {isSignedIn
                  ? '今日内容已就绪，点击下方进入报告页查看完整内容（含情绪、预警、新闻与策略）。'
                  : '今日内容已就绪，登录后即可查看完整报告（含情绪、预警、新闻与策略）。'}
              </p>
              {isSignedIn ? (
                <Link
                  href={detailHref}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                >
                  查看今日报告
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : skipClerk ? (
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent(afterSignInUrl)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                >
                  登录后查看今日报告
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl={afterSignInUrl}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                  >
                    登录后查看今日报告
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </SignInButton>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== 登录 CTA 横幅（未登录时展示） ===== */}
      {!isSignedIn && (
        <section className="border-b border-mentat-border-section bg-gradient-to-r from-[#181c26] via-[#12161e] to-[#0f1218]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                登录后即可查看完整日报与往期内容
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                {loginHighlights.map((item) => (
                  <span key={item} className="text-[11px] text-mentat-text-secondary">
                    · {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {skipClerk ? (
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent(afterSignInUrl)}`}
                  className="px-4 py-2 bg-gold text-mentat-bg-page rounded-lg font-semibold text-sm hover:bg-gold-hover transition-colors inline-flex items-center gap-1.5"
                >
                  立即登录查看
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl={afterSignInUrl}>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gold text-mentat-bg-page rounded-lg font-semibold text-sm hover:bg-gold-hover transition-colors inline-flex items-center gap-1.5"
                  >
                    立即登录查看
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 三卖点 */}
      <section className="border-t border-mentat-border-section py-10 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="核心价值" title="信息要全，也要快、准、好执行" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            {valuePoints.map((item) => (
              <InsightCard
                key={item.title}
                title={item.title}
                description={item.description}
                meta={item.meta}
                points={item.points}
                align="center"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 报告内容模块说明 */}
      <section className="border-t border-mentat-border-section py-10 sm:py-12 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="报告内容" title="每天一份，固定包含这些模块" />
          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {reportModules.map((module) => {
              return (
                <InsightCard
                  key={module.title}
                  title={module.title}
                  description={module.description}
                  meta={module.meta}
                  points={module.points}
                  icon={module.icon}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* 使用方式 */}
      <section id="pricing" className="border-t border-mentat-border-section py-10 sm:py-12 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="使用方式" title="简单三步，快速阅读日报" />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5 flex flex-col">
              <div className="text-[10px] text-mentat-muted-secondary font-mono uppercase tracking-[0.12em] mb-2">step 1</div>
              <h3 className="text-sm font-semibold text-mentat-text mb-2">先看今日重点</h3>
              <p className="text-xs text-mentat-text-secondary mb-3 flex-1">首页首屏直接看到情绪、预警与摘要，先把当天重点抓住。</p>
              <ul className="text-[11px] text-mentat-muted-secondary space-y-1 mb-4">
                <li>· 今日摘要</li>
                <li>· 预警速览</li>
              </ul>
              <div className="text-xs text-mentat-muted-tertiary mt-auto">打开即可阅读</div>
            </div>
            <div className="rounded-xl border-2 border-gold bg-mentat-bg-elevated p-5 flex flex-col relative">
              <div className="absolute -top-px right-4 px-2 py-0.5 rounded-b-md bg-gold text-[10px] font-semibold text-mentat-bg-page uppercase tracking-wider">推荐</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] mb-2 text-[#9FB9E5]">step 2</div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {isSignedIn ? '查看完整日报' : '登录后继续阅读'}
              </h3>
              <p className="text-xs text-mentat-text-secondary mb-3 flex-1">
                {isSignedIn
                  ? '你已登录，可直接打开完整模块与历史报告。'
                  : '只需登录即可查看完整模块，不用额外操作。'}
              </p>
              <ul className="text-[11px] text-mentat-text-secondary space-y-1 mb-4">
                <li>· 完整日报模块</li>
                <li>· 历史报告回看</li>
              </ul>
              <div className="mt-auto">
                {isSignedIn ? (
                  <Link
                    href={detailHref}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                  >
                    查看今日报告
                  </Link>
                ) : skipClerk ? (
                  <Link
                    href={`/sign-in?redirect_url=${encodeURIComponent(afterSignInUrl)}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                  >
                    去登录查看
                  </Link>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl={afterSignInUrl}>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                    >
                      去登录查看
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5 flex flex-col opacity-95">
              <div className="text-[10px] text-mentat-text font-mono uppercase tracking-[0.12em] mb-2" style={{ color: '#9B8DC4' }}>step 3</div>
              <h3 className="text-sm font-semibold text-mentat-text mb-2">按需回看历史</h3>
              <p className="text-xs text-mentat-text-secondary mb-3 flex-1">在历史报告中按日期快速回看，和今天的判断形成对照。</p>
              <ul className="text-[11px] text-mentat-muted-secondary space-y-1 mb-4">
                <li>· 列表与日历视图</li>
                <li>· 重点信号对比</li>
              </ul>
              <div className="mt-auto">
                <Link
                  href="/reports"
                  className="inline-flex items-center justify-center w-full px-4 py-2 border border-mentat-border text-mentat-text rounded-lg text-sm hover:bg-mentat-bg-page transition-colors"
                >
                  查看历史报告
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
