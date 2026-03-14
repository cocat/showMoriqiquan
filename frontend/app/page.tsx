'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import LatestReportCard from './components/LatestReportCard'
import { ArrowRight, BarChart2, Bell, History } from 'lucide-react'

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
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平静'
  }
}

/** 从 overview 正文中取前两段（按双换行分割） */
function getFirstTwoParagraphs(content: string | null | undefined): string {
  if (!content || typeof content !== 'string') return ''
  const paragraphs = content.trim().split(/\n\n+/).filter(Boolean)
  return paragraphs.slice(0, 2).join('\n\n')
}

export default function HomePage() {
  const { getToken } = useAppAuth()
  const [latest, setLatest] = useState<LatestSummary | null>(null)
  const [latestLoading, setLatestLoading] = useState(true)
  const [overviewExcerpt, setOverviewExcerpt] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    getToken().then((token) => {
      if (cancelled) return
      reportsApi
        .latestSummary(token)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((d: any) => {
          if (!cancelled) setLatest(d && typeof d === 'object' && d.report_date != null ? d : null)
        })
        .catch(() => { if (!cancelled) setLatest(null) })
        .finally(() => { if (!cancelled) setLatestLoading(false) })
    })
    return () => { cancelled = true }
  }, [getToken])

  useEffect(() => {
    if (!latest?.report_date) return
    let cancelled = false
    getToken().then((token) => {
      if (cancelled) return
      reportsApi
        .getByDate(latest.report_date, token)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((data: any) => {
          if (!cancelled) {
            const content = data?.overview?.content
            setOverviewExcerpt(getFirstTwoParagraphs(content))
          }
        })
        .catch(() => { if (!cancelled) setOverviewExcerpt('') })
    })
    return () => { cancelled = true }
  }, [latest?.report_date, getToken])

  const kpis = useMemo(() => {
    const score = latest?.sentiment_score
    const level = latest?.sentiment_level
    return {
      level,
      levelText: levelLabel(level),
      levelColor: levelColor(level),
      score: score == null ? '—' : String(score),
      red: latest?.red_count ?? '—',
      yellow: latest?.yellow_count ?? '—',
      items: latest?.item_count ?? '—',
      date: latest?.report_date ?? '—',
    }
  }, [latest])

  return (
    <div className="min-h-screen bg-mentat-bg-page">
      {/* 顶部：品牌 + 标题 + CTA */}
      <section className="relative border-b border-mentat-border-section bg-gradient-to-b from-mentat-bg-gradient-start to-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.2em] mb-2">
                market intelligence daily · mentat vision
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                市场情报晨报
                <span className="text-gold font-semibold"> · 全面、一目了然</span>
              </h1>
              <p className="text-mentat-text-secondary text-sm mt-1.5 max-w-xl">
                多源数据汇总成一份日报，终端式高密度视图，十分钟掌握当天市场在关心什么。
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/reports/latest"
                className="px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg font-semibold text-sm hover:bg-gold-hover transition-colors flex items-center gap-2"
              >
                免费开始阅读
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/reports"
                className="px-4 py-2.5 border border-mentat-border text-mentat-text rounded-lg text-sm hover:border-mentat-border hover:bg-mentat-bg-card transition-colors"
              >
                查看历史样本
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 主钩子：今日看点（纯 preview，无归档混入） */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div
          className="rounded-2xl border border-mentat-border-card bg-mentat-bg-elevated overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]"
          style={{ borderLeft: '3px solid var(--gold, #C19A6B)' }}
        >
          <div className="flex flex-col min-h-[260px]">
            <div className="flex flex-col p-5 sm:p-6 flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <span className="text-[11px] text-mentat-muted-secondary font-mono uppercase tracking-wider">
                  {latestLoading ? '同步中…' : `今日报告 · ${kpis.date || '—'}`}
                </span>
                {!latestLoading && (
                  <span className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md"
                      style={{
                        color: kpis.levelColor,
                        background: `${kpis.levelColor}20`,
                        border: `1px solid ${kpis.levelColor}50`,
                      }}
                    >
                      情绪 {kpis.score} · {kpis.levelText}
                    </span>
                    {(Number(kpis.red) > 0 || Number(kpis.yellow) > 0) && (
                      <span className="text-[11px] text-mentat-muted-secondary">
                        <span className="text-mentat-danger">🔴 {String(kpis.red)}</span>
                        <span className="mx-1">·</span>
                        <span className="text-mentat-warning">🟡 {String(kpis.yellow)}</span>
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-0">
                {latestLoading ? (
                  <div className="space-y-2.5">
                    <div className="h-3.5 w-full rounded bg-mentat-border-card animate-pulse" />
                    <div className="h-3.5 w-[95%] rounded bg-mentat-border-card animate-pulse" />
                    <div className="h-3.5 w-[88%] rounded bg-mentat-border-card animate-pulse" />
                    <div className="h-3.5 w-[70%] rounded bg-mentat-border-card animate-pulse" />
                  </div>
                ) : overviewExcerpt ? (
                  <div className="text-[15px] text-mentat-text-faint leading-[1.75] whitespace-pre-wrap line-clamp-6">
                    {overviewExcerpt}
                  </div>
                ) : (
                  <p className="text-sm text-mentat-muted-secondary">
                    今日市场综述生成中，可先
                    <Link href="/reports" className="text-gold hover:underline ml-1">查看历史报告</Link>。
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-mentat-border-card flex items-center justify-between flex-wrap gap-3">
                <Link
                  href="/reports/latest"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                >
                  阅读完整报告
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-[11px] text-mentat-muted-secondary">每日早 8 点送达 · 订阅免费</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-mentat-muted-tertiary mt-3 text-center sm:text-left">
          无需绑定支付，可随时停止使用。
        </p>
      </section>

      {/* 三卖点 */}
      <section className="border-t border-mentat-border-section py-8 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-4">
              <div className="text-gold font-mono text-xs uppercase tracking-wider mb-2">数据全面</div>
              <p className="text-mentat-text-secondary text-sm leading-relaxed">多源汇总，一份报告覆盖情绪、预警、新闻与策略。</p>
            </div>
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-4">
              <div className="text-gold font-mono text-xs uppercase tracking-wider mb-2">使用方便</div>
              <p className="text-mentat-text-secondary text-sm leading-relaxed">固定模块、固定节奏，打开即用，无需到处翻找。</p>
            </div>
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-4">
              <div className="text-gold font-mono text-xs uppercase tracking-wider mb-2">高信噪比</div>
              <p className="text-mentat-text-secondary text-sm leading-relaxed">AI 提炼重点，红黄分级，只突出值得盯的信号。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 今日报告：订阅主钩子，单一焦点 */}
      <section className="border-t border-mentat-border-section py-10 bg-mentat-bg-page">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-[10px] text-gold font-mono uppercase tracking-[0.2em] mb-1">今日报告</h2>
            <p className="text-mentat-text-secondary text-sm">当日最新一份，订阅后每天第一时间送达</p>
          </div>
          <LatestReportCard data={latest} />
        </div>
      </section>

      {/* 报告内容模块说明 */}
      <section className="border-t border-mentat-border-section py-10 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[11px] text-mentat-muted-secondary font-mono uppercase tracking-wider mb-1">报告内容</h2>
          <p className="text-mentat-text-faint font-medium mb-5">每天一份，固定包含这些模块</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5">
              <div className="w-10 h-10 rounded-lg bg-gold-dim flex items-center justify-center mb-3">
                <BarChart2 className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold text-mentat-text text-sm mb-1.5">情绪仪表盘 + 行情快照</h3>
              <p className="text-mentat-text-secondary text-sm leading-relaxed">量化市场情绪，叠加核心指数与品种表现，一眼判断今日风险等级。</p>
            </div>
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5">
              <div className="w-10 h-10 rounded-lg bg-gold-dim flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold text-mentat-text text-sm mb-1.5">红黄两级预警 + 方向建议</h3>
              <p className="text-mentat-text-secondary text-sm leading-relaxed">AI 挑出重要事件并给出方向提示，决定「需要盯」还是「可忽略」。</p>
            </div>
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5">
              <div className="w-10 h-10 rounded-lg bg-gold-dim flex items-center justify-center mb-3">
                <History className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-semibold text-mentat-text text-sm mb-1.5">新闻脉络 + 主题热度 + 期权视角</h3>
              <p className="text-mentat-text-secondary text-sm leading-relaxed">新闻按主题归类、热度对比，关键资产补充期权情绪信号。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 定价 */}
      <section id="pricing" className="border-t border-mentat-border-section py-10 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[11px] text-mentat-muted-secondary font-mono uppercase tracking-wider mb-1">访问等级</h2>
          <p className="text-mentat-text-faint font-medium mb-6">按使用深度选择</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5 flex flex-col">
              <div className="text-[10px] text-mentat-muted-secondary font-mono uppercase tracking-[0.12em] mb-2">访客 · guest</div>
              <h3 className="text-sm font-semibold text-mentat-text mb-2">公开预览</h3>
              <p className="text-xs text-mentat-text-secondary mb-3 flex-1">无需登录，预览最新 1 篇报告的部分内容（情绪 + 前几条预警）。</p>
              <ul className="text-[11px] text-mentat-muted-secondary space-y-1 mb-4">
                <li>· 最新 1 天摘要</li>
                <li>· 部分预警与模块</li>
              </ul>
              <div className="text-xs text-mentat-muted-tertiary mt-auto">始终可用 · 免费</div>
            </div>
            <div className="rounded-xl border-2 border-gold bg-mentat-bg-elevated p-5 flex flex-col relative">
              <div className="absolute -top-px right-4 px-2 py-0.5 rounded-b-md bg-gold text-[10px] font-semibold text-mentat-bg-page uppercase tracking-wider">推荐</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] mb-2 text-[#9FB9E5]">观察者 · observer</div>
              <h3 className="text-sm font-semibold text-white mb-2">完整日报体验</h3>
              <p className="text-xs text-mentat-text-secondary mb-3 flex-1">全部模块 + 最近 7 天历史可回溯。</p>
              <ul className="text-[11px] text-mentat-text-secondary space-y-1 mb-4">
                <li>· 完整日报所有模块</li>
                <li>· 最近 7 天历史</li>
              </ul>
              <div className="mt-auto">
                <p className="text-sm font-mono text-gold mb-2">当前内测免费</p>
                <Link
                  href="/reports/latest"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg text-sm font-semibold hover:bg-gold-hover transition-colors"
                >
                  立即使用
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5 flex flex-col opacity-95">
              <div className="text-[10px] text-mentat-text font-mono uppercase tracking-[0.12em] mb-2" style={{ color: '#9B8DC4' }}>追踪者 · tracker</div>
              <h3 className="text-sm font-semibold text-mentat-text mb-2">重度研究者</h3>
              <p className="text-xs text-mentat-text-secondary mb-3 flex-1">全部历史 + 更多策略说明，计划支持重大预警推送。</p>
              <ul className="text-[11px] text-mentat-muted-secondary space-y-1 mb-4">
                <li>· 全部历史归档</li>
                <li>· 计划支持推送</li>
              </ul>
              <div className="mt-auto">
                <p className="text-[11px] text-mentat-muted-tertiary mb-2">即将开放</p>
                <button type="button" className="w-full px-4 py-2 border border-dashed border-mentat-border text-mentat-muted-tertiary rounded-lg text-sm cursor-not-allowed">敬请期待</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
