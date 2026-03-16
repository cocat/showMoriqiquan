'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import LatestReportCard from './components/LatestReportCard'
import { InsightCard, SectionHeader } from './components/HomePrimitives'
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

const valuePoints = [
  {
    title: '多维覆盖',
    description: '宏观、资金、指数、主题、事件、期权六条线并行扫描。',
    meta: 'coverage',
    points: ['跨资产横截面监控', '多源信号交叉验证'],
  },
  {
    title: '高频更新',
    description: '固定时点交付 + 结构化模块，形成可复用决策工作流。',
    meta: 'cadence',
    points: ['每日 08:00 输出', '7 天连续可回溯'],
  },
  {
    title: '专业筛选',
    description: '预警分级与 AI 提炼并行，先过滤噪声，再聚焦风险与机会。',
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
  'Macro Drivers',
  'Cross-Asset Flows',
  'Event Risk',
  'Theme Heat',
  'Options Sentiment',
  'AI Action Points',
]

const subscriptionHighlights = [
  '盘前 10 分钟完成当日风险与机会框架',
  '红黄预警直接标注优先级，减少信息筛选成本',
  '关键事件附方向建议，支持快速形成交易假设',
]

export default function HomePage() {
  const { getToken } = useAppAuth()
  const [latest, setLatest] = useState<LatestSummary | null>(null)
  const [overviewExcerpt, setOverviewExcerpt] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    getToken().then((token) => {
      if (cancelled) return
      reportsApi
        .latestSummaryBundle(token)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((d: any) => {
          if (cancelled) return
          const report = d?.report
          setLatest(report && typeof report === 'object' && report.report_date != null ? report : null)
          setOverviewExcerpt(typeof d?.overview_teaser === 'string' ? d.overview_teaser : '')
        })
        .catch(() => {
          if (!cancelled) {
            setLatest(null)
            setOverviewExcerpt('')
          }
        })
    })
    return () => { cancelled = true }
  }, [getToken])

  return (
    <div className="min-h-screen bg-mentat-bg-page">
      {/* 顶部：品牌 + 标题 + CTA */}
      <section className="relative border-b border-mentat-border-section bg-gradient-to-b from-mentat-bg-gradient-start to-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-12 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7 max-w-2xl">
              <div className="text-[10px] text-mentat-muted-tertiary font-mono uppercase tracking-[0.2em] mb-2">
                market intelligence daily brief · mentat vision
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-white tracking-tight leading-tight">
                市场情报晨报
                <span className="text-gold font-semibold"> · 高密度决策情报，10 分钟完成盘前框架搭建</span>
              </h1>
              <p className="text-mentat-text-secondary text-sm mt-3 max-w-xl leading-relaxed">
                将宏观变量、资金流向、关键资产异动与突发事件信号压缩成结构化晨报；
                不只告诉你发生了什么，更明确「优先级、影响路径、可执行方向」。
              </p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg border border-mentat-border-card bg-black/25 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-mono text-mentat-muted-tertiary">Signals</p>
                  <p className="text-sm font-semibold text-white mt-1">{latest?.item_count ?? '--'}</p>
                </div>
                <div className="rounded-lg border border-mentat-border-card bg-black/25 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-mono text-mentat-muted-tertiary">Red Alerts</p>
                  <p className="text-sm font-semibold text-mentat-danger mt-1">{latest?.red_count ?? '--'}</p>
                </div>
                <div className="rounded-lg border border-mentat-border-card bg-black/25 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-mono text-mentat-muted-tertiary">Yellow Alerts</p>
                  <p className="text-sm font-semibold text-mentat-warning mt-1">{latest?.yellow_count ?? '--'}</p>
                </div>
                <div className="rounded-lg border border-mentat-border-card bg-black/25 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] font-mono text-mentat-muted-tertiary">Delivery</p>
                  <p className="text-sm font-semibold text-white mt-1">08:00 Daily</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-mentat-border-card bg-gradient-to-br from-[#181c26] via-[#12161e] to-[#0f1218] p-4 sm:p-5 shadow-[0_24px_55px_-30px_rgba(0,0,0,0.95)]">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] font-mono text-mentat-muted-tertiary">Professional Subscription</p>
                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-gold">Beta Access</span>
                </div>
                <h3 className="text-base font-semibold text-white leading-snug">
                  订阅后每天获得完整情报结构与可执行方向建议
                </h3>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="rounded-lg border border-mentat-border-weak bg-white/[0.02] px-2.5 py-2">
                    <p className="text-[10px] text-mentat-muted-tertiary font-mono uppercase">Delivery</p>
                    <p className="text-xs text-white mt-1 font-semibold">08:00</p>
                  </div>
                  <div className="rounded-lg border border-mentat-border-weak bg-white/[0.02] px-2.5 py-2">
                    <p className="text-[10px] text-mentat-muted-tertiary font-mono uppercase">Depth</p>
                    <p className="text-xs text-white mt-1 font-semibold">Full Report</p>
                  </div>
                  <div className="rounded-lg border border-mentat-border-weak bg-white/[0.02] px-2.5 py-2">
                    <p className="text-[10px] text-mentat-muted-tertiary font-mono uppercase">History</p>
                    <p className="text-xs text-white mt-1 font-semibold">7 Days+</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-mentat-border-weak space-y-1.5">
                  {subscriptionHighlights.map((item) => (
                    <p key={item} className="text-[11px] text-mentat-text-secondary leading-relaxed">
                      · {item}
                    </p>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <Link
                    href="/subscribe"
                    className="px-4 py-2.5 bg-gold text-mentat-bg-page rounded-lg font-semibold text-sm hover:bg-gold-hover transition-colors inline-flex items-center gap-2"
                  >
                    订阅完整日报
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/reports/latest"
                    className="px-4 py-2.5 border border-mentat-border text-mentat-text rounded-lg text-sm hover:border-mentat-border hover:bg-mentat-bg-card transition-colors"
                  >
                    查看专业样本
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-mentat-border-card bg-black/20 px-3 py-3 sm:px-4">
            <div className="text-[10px] uppercase tracking-[0.14em] font-mono text-mentat-muted-tertiary mb-2">Coverage Matrix</div>
            <div className="flex flex-wrap gap-2">
              {coverageTags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-md border border-mentat-border-weak bg-white/[0.02] text-[10px] uppercase tracking-[0.08em] text-mentat-muted-secondary font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 最新报告（主钩子，置顶） */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="rounded-2xl border border-mentat-border-card bg-mentat-bg-card/30 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div className="mb-0">
              <SectionHeader eyebrow="今日重点" title="最新市场情报报告" className="mb-0" />
            </div>
            <p className="text-[11px] text-mentat-muted-tertiary sm:text-right">
              无需绑定支付，可随时停止使用。
            </p>
          </div>
          <LatestReportCard data={latest} aiTeaser={overviewExcerpt} />
        </div>
      </section>

      {/* 三卖点 */}
      <section className="border-t border-mentat-border-section py-10 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="核心价值" title="信息不只全，更要快、准、可执行" />
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

      {/* 定价 */}
      <section id="pricing" className="border-t border-mentat-border-section py-10 sm:py-12 bg-mentat-bg-page">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="访问等级" title="按使用深度选择" />
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
