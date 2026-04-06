'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { withTokenRetry } from '@/lib/session-token'
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

const levelLabel = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '危险'
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平静'
  }
}

function EmptyStateSubscriptionFirst() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const { isSignedIn } = useAppAuth()
  return (
    <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-br from-mentat-bg-elevated via-mentat-bg-card to-black p-8 sm:p-10 text-center shadow-[0_24px_70px_-26px_rgba(0,0,0,0.9)]">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gold/15 blur-3xl" />
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold/15 mb-4">
        <Sparkles className="w-6 h-6 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">今日报告即将生成</h3>
      <p className="text-mentat-text-secondary text-sm max-w-sm mx-auto mb-6 leading-relaxed">
        {isSignedIn
          ? '每日早 8 点送达。你已登录，报告生成后即可在「最新报告」页查看完整内容。'
          : '每日早 8 点送达，一份报告覆盖情绪、预警、新闻与策略。登录后即可继续查看完整内容。'}
      </p>
      {isSignedIn ? (
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
        >
          <Mail className="w-4 h-4" />
          浏览历史报告
        </Link>
      ) : skipClerk ? (
        <Link
          href="/sign-in?redirect_url=/reports/latest"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
        >
          <Mail className="w-4 h-4" />
          登录后查看
        </Link>
      ) : (
        <SignInButton mode="modal" forceRedirectUrl="/reports/latest">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
          >
            <Mail className="w-4 h-4" />
            登录后查看
          </button>
        </SignInButton>
      )}
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
    <span className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3.5 py-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-mentat-muted-secondary flex-shrink-0" />
      <span className={valueClass}>{value}</span>
      <span className="text-mentat-muted-secondary">{label}</span>
    </span>
  )
}

export default function LatestReportCard({ data: dataProp, aiTeaser }: LatestReportCardProps) {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const { getToken, isSignedIn } = useAppAuth()
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
    withTokenRetry(getToken, (token) => reportsApi.latestSummary(token))
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [dataProp, getToken])

  if (loading) {
    return (
      <div className="rounded-[28px] bg-gradient-to-br from-mentat-bg-elevated via-mentat-bg-card to-black p-6 sm:p-8 animate-pulse shadow-[0_24px_70px_-26px_rgba(0,0,0,0.9)]">
        <div className="h-3 w-28 bg-black/35 rounded mb-3" />
        <div className="h-7 w-3/5 bg-black/35 rounded mb-4" />
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-8 w-24 bg-black/35 rounded-full" />
          <div className="h-8 w-20 bg-black/35 rounded-full" />
          <div className="h-8 w-20 bg-black/35 rounded-full" />
        </div>
        <div className="h-2.5 bg-black/35 rounded-full mb-2" />
        <div className="h-20 bg-black/35 rounded-2xl mt-4" />
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
  const totalAlerts = red + yellow
  const criticalShare = totalAlerts > 0 ? `${Math.round((red / totalAlerts) * 100)}%` : '--'
  const alertDensity = items > 0 ? `${Math.round((totalAlerts / items) * 100)}%` : '--'
  const sentimentText = levelLabel(data.sentiment_level)

  return (
    <div className="relative rounded-[30px] overflow-hidden bg-gradient-to-br from-[#0f1116] via-[#141720] to-[#0b0d12] shadow-[0_26px_80px_-32px_rgba(0,0,0,0.95)] transition-all duration-300 hover:scale-[1.004] hover:shadow-[0_36px_95px_-34px_rgba(0,0,0,1)]">
      <div className="absolute -top-16 -right-20 w-72 h-72 rounded-full bg-gold/12 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-10 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${color}22` }} />

      <Link href={`/reports/${data.report_date}`} className="relative block group/link">
        <div className="px-6 sm:px-8 pt-7 sm:pt-8 pb-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.22em] mb-2.5">
                <span className="px-2 py-1 rounded-full bg-white/5">vol.{data.report_date.replaceAll('-', '')}</span>
                <span>{data.report_date}</span>
                <span>最新报告</span>
              </div>
              <h3 className="text-white font-semibold text-xl sm:text-[30px] leading-[1.18] tracking-tight">
                {data.title || `${data.report_date} 美股与国际金融前瞻`}
              </h3>
              <p className="text-sm text-mentat-muted-secondary mt-3 max-w-3xl">
                浓缩当天关键驱动与风险提示，帮助用户更快理解盘前情绪、事件热度和市场方向。
              </p>
            </div>

            {data.sentiment_score != null && (
              <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm px-5 py-4 text-right">
                <div className="text-[11px] text-mentat-muted-tertiary font-mono uppercase tracking-wider mb-1">
                  Sentiment Index
                </div>
                <div className="text-[52px] font-bold font-mono leading-none" style={{ color }}>
                  {data.sentiment_score}
                </div>
                <div className="text-xs mt-2" style={{ color }}>{levelLabel(data.sentiment_level)}</div>
                <span className="inline-flex items-center gap-1.5 text-gold text-xs font-medium mt-3 group-hover/link:gap-2 transition-all">
                  阅读完整报告
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </div>

          {hasStats && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {items > 0 && <StatPill icon={FileText} value={items} label="条信号" />}
              {red > 0 && <StatPill icon={AlertTriangle} value={red} label="重大预警" highlight="danger" />}
              {yellow > 0 && <StatPill icon={AlertTriangle} value={yellow} label="重要预警" highlight="warning" />}
              {topics > 0 && <StatPill icon={Layers} value={topics} label="个主题" />}
              {sources > 0 && <StatPill icon={Radio} value={sources} label="多源汇总" />}
            </div>
          )}

          <div className="mt-4 rounded-xl bg-black/30 px-3 py-2 text-[10px] text-mentat-muted-secondary font-mono uppercase tracking-[0.14em]">
            信号密度 · 预警数量 · 主题覆盖 · 多源验证 · 情绪结构
          </div>

          <div className="mt-3 rounded-xl bg-black/35 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-6 gap-3 px-4 pt-3 pb-2 text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.12em]">
                <div>信号总量</div>
                <div>风险事件</div>
                <div>重大占比</div>
                <div>预警密度</div>
                <div>主题覆盖</div>
                <div>情绪等级</div>
              </div>
              <div className="grid grid-cols-6 gap-3 px-4 pb-3">
                <div>
                  <div className="text-xl font-mono font-semibold leading-none text-white">{String(items)}</div>
                  <div className="text-[10px] text-mentat-muted-secondary mt-1">条/天</div>
                </div>
                <div>
                  <div className={`text-xl font-mono font-semibold leading-none ${totalAlerts > 0 ? 'text-mentat-warning' : 'text-white'}`}>{String(totalAlerts)}</div>
                  <div className="text-[10px] text-mentat-muted-secondary mt-1">红{red} / 黄{yellow}</div>
                </div>
                <div>
                  <div className={`text-xl font-mono font-semibold leading-none ${red > 0 ? 'text-mentat-danger' : 'text-white'}`}>{criticalShare}</div>
                  <div className="text-[10px] text-mentat-muted-secondary mt-1">重大预警占比</div>
                </div>
                <div>
                  <div className={`text-xl font-mono font-semibold leading-none ${totalAlerts > 0 ? 'text-gold' : 'text-white'}`}>{alertDensity}</div>
                  <div className="text-[10px] text-mentat-muted-secondary mt-1">预警密度</div>
                </div>
                <div>
                  <div className="text-xl font-mono font-semibold leading-none text-white">{String(topics)}</div>
                  <div className="text-[10px] text-mentat-muted-secondary mt-1">跟踪主题数</div>
                </div>
                <div>
                  <div className="text-xl font-mono font-semibold leading-none text-gold">{sentimentText}</div>
                  <div className="text-[10px] text-mentat-muted-secondary mt-1">当前情绪</div>
                </div>
              </div>
            </div>
          </div>

          {gaugePercent != null && (
            <div className="mt-6 p-4 rounded-2xl bg-black/30">
              <div
                className="h-2.5 rounded-full overflow-hidden relative"
                style={{
                  background:
                    'linear-gradient(to right, #4CAF50 0%, #4CAF50 35%, #C19A6B 35%, #C19A6B 68%, #D4A55A 68%, #D4A55A 88%, #8A5A36 88%, #8A5A36 100%)',
                }}
              >
                <div
                  className="absolute w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-700"
                  style={{
                    left: `${gaugePercent}%`,
                    top: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                    boxShadow: '0 0 0 2px var(--bg-card, #1E1E1F)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-mentat-muted-tertiary font-mono mt-2">
                <span>0 平静</span>
                <span>50 警戒</span>
                <span>100 危险</span>
              </div>
            </div>
          )}

          {teaserText && (
            <div className="mt-5 max-w-4xl rounded-2xl border border-gold/20 bg-gradient-to-br from-[#2A2115]/70 via-[#1F1A13]/88 to-[#15120F]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_34px_-24px_rgba(212,165,90,0.45)] overflow-hidden">
              <div className="grid min-h-[126px] grid-rows-[1fr_2fr]">
                <div className="flex items-center gap-2 px-4 sm:px-5 border-b border-gold/15 bg-white/[0.02]">
                  <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                  <span className="text-[10px] font-medium text-gold uppercase tracking-wider">AI 解析摘要</span>
                </div>
                <div className="px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col justify-between gap-2">
                  <p className="text-[13px] text-mentat-text-secondary leading-relaxed line-clamp-3">
                    {teaserText}
                  </p>
                  <p className="text-[10px] text-mentat-muted">完整解读与方向建议见报告内</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="relative px-6 sm:px-8 py-4 bg-black/35 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-xs text-mentat-text-secondary text-center sm:text-left">
          {isSignedIn ? '每日早 8 点送达 · 可查看完整报告' : '每日早 8 点送达 · 登录即可完整查看'}
        </span>
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <Link
            href={`/reports/${data.report_date}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-mentat-text-secondary text-xs hover:bg-white/10 transition-colors"
          >
            查看样本
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {isSignedIn ? (
            <Link
              href="/reports/latest"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-mentat-bg-page text-sm font-semibold hover:bg-gold-hover transition-colors"
            >
              <Bell className="w-4 h-4" />
              进入最新报告
            </Link>
          ) : skipClerk ? (
            <Link
              href="/sign-in?redirect_url=/reports/latest"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-mentat-bg-page text-sm font-semibold hover:bg-gold-hover transition-colors"
            >
              <Bell className="w-4 h-4" />
              登录后查看完整
            </Link>
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/reports/latest">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-mentat-bg-page text-sm font-semibold hover:bg-gold-hover transition-colors"
              >
                <Bell className="w-4 h-4" />
                登录后查看完整
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  )
}
