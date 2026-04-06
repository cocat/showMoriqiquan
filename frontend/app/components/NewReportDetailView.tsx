'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CalendarRange,
  Clock3,
  Layers3,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { SectionPlaceholder } from '@/app/components/SectionPlaceholder'
import { useAppAuth } from '@/app/providers'
import type { SnapshotItem } from '@/app/components/report/MarketSnapshot'

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

export interface NewReportData {
  report: {
    report_id: string
    report_date: string
    title?: string
    generated_at?: string
    sentiment_score?: number
    sentiment_level?: string
    item_count?: number
    red_count?: number
    yellow_count?: number
  }
  sentiment?: { score: number; level: string; label?: string; description?: string } | null
  market_snapshots?: SnapshotItem[]
  overview?: { content?: string } | null
  alerts?: Array<{
    id: number
    level: string
    score?: number
    title: string
    zh_title?: string
    ai_summary?: string
    ai_summary_en?: string
    source_name?: string
    published_at?: string
    link?: string
    topic_name?: string
    direction?: string
    direction_note?: string
    assets?: string[] | { name?: string }[]
  }>
  news_briefs?: Array<{
    topic_name?: string
    body?: string
    impact?: string
    source_count?: number
    sources?: Array<{ url: string; title: string }>
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
}

type AlertRecord = NonNullable<NewReportData['alerts']>[number]
type BriefRecord = NonNullable<NewReportData['news_briefs']>[number]
type TopicRecord = NonNullable<NewReportData['topic_comparisons']>[number]

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

function shortText(text?: string | null, max = 88) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}…`
}

function splitLeadText(text?: string | null) {
  const clean = text?.replace(/\s+/g, ' ').trim() ?? ''
  if (!clean) return { lead: '', rest: '' }

  const sentences = clean.split(/(?<=[。！？!?])/).map((part) => part.trim()).filter(Boolean)
  if (sentences.length > 1) {
    return {
      lead: sentences[0] ?? '',
      rest: sentences.slice(1).join(' '),
    }
  }

  if (clean.length <= 92) return { lead: clean, rest: '' }

  return {
    lead: `${clean.slice(0, 92).trim()}…`,
    rest: clean,
  }
}

function mediumText(text?: string | null, max = 220) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}…`
}

function formatZonedTime(value?: string, locale = 'zh-CN', timeZone = 'Asia/Shanghai') {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat(locale, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function alertTitle(item?: AlertRecord | null) {
  if (!item) return ''
  return item.zh_title || item.title || item.ai_summary || '重点风险'
}

function alertAssets(item?: AlertRecord | null) {
  if (!item || !Array.isArray(item.assets)) return []

  return item.assets
    .map((asset) => (typeof asset === 'string' ? asset : asset?.name))
    .filter((asset): asset is string => Boolean(asset))
}

function buildValidationFocus(brief?: BriefRecord | null, alert?: AlertRecord | null) {
  const raw = [brief?.impact, brief?.body, alert?.direction_note, alert?.ai_summary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/(fomc|fed|联储|利率|美债|收益率|cpi|通胀|非农|就业)/i.test(raw)) {
    return '先看美债收益率和纳指能否给出同向反馈。'
  }
  if (/(美元|汇率|dollar|fx)/i.test(raw)) {
    return '先看美元强弱，再确认非美资产有没有同步承压。'
  }
  if (/(oil|原油|油价|地缘|中东|战争)/i.test(raw)) {
    return '先看油价、能源股和避险资产是否一起走强。'
  }
  if (/(earnings|财报|指引|guidance)/i.test(raw)) {
    return '先确认盘前指引，再看龙头股有没有带动板块重定价。'
  }
  if (/(科技|ai|半导体|芯片|software|cloud)/i.test(raw)) {
    return '先盯科技龙头和主题 ETF，确认情绪是不是只停留在标题。'
  }

  return '先看指数、利率和龙头股有没有给出一致验证。'
}

function buildTopicFocus(topic?: TopicRecord | null) {
  if (!topic?.topic_name) return '继续观察主题扩散和资金承接。'
  return `${topic.topic_name} 是否继续扩散，取决于价格表现和资金承接能不能跟上。`
}

function riskBand(score?: number) {
  const value = score ?? 0
  if (value >= 65) return '65-100 高风险'
  if (value >= 50) return '50-65 警戒'
  if (value >= 35) return '35-50 关注'
  return '0-35 平静'
}

export function NewReportDetailView({
  data,
  loading,
  errorMessage,
  backHref,
  backLabel,
  oppositeHref,
  oppositeLabel,
  prevHref,
  nextHref,
}: {
  data: NewReportData | null
  loading: boolean
  errorMessage?: string
  backHref: string
  backLabel: string
  oppositeHref: string
  oppositeLabel: string
  prevHref?: string | null
  nextHref?: string | null
}) {
  const { isLoaded, isSignedIn } = useAppAuth()

  if (loading) {
    return (
      <div className="new-home-shell">
        <section className="new-home-section !pt-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="new-report-skeleton h-[220px]" />
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="new-report-skeleton h-[280px]" />
              <div className="new-report-skeleton h-[280px]" />
            </div>
            <div className="mt-5 new-report-skeleton h-[300px]" />
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
              <p className="new-home-kicker">Report status</p>
              <h1 className="new-home-section-title" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                当前简报暂时无法加载。
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {errorMessage || '请返回列表页重新选择，或稍后再试。'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={backHref} className="new-home-primary-btn">{backLabel}</Link>
                <Link href={oppositeHref} className="new-home-ghost-btn">{oppositeLabel}</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const { report, sentiment, market_snapshots, overview, alerts, news_briefs, topic_comparisons } = data
  const totalAlerts = (report.red_count ?? 0) + (report.yellow_count ?? 0)
  const leadBrief = news_briefs?.[0] ?? null
  const leadAlert = alerts?.[0] ?? null
  const sortedTopics = [...(topic_comparisons ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const leadTopic = sortedTopics[0] ?? null
  const leadCopy = splitLeadText(overview?.content)
  const secondaryLead = mediumText(leadCopy.rest || overview?.content, 220)
  const etTime = formatZonedTime(report.generated_at, 'en-US', 'America/New_York')
  const localTime = formatZonedTime(report.generated_at, 'zh-CN', 'Asia/Shanghai')
  const firstAsset = alertAssets(leadAlert)[0] ?? '收益率 / 美元 / 龙头股'
  const validationFocus = buildValidationFocus(leadBrief, leadAlert)
  const topicFocus = buildTopicFocus(leadTopic)
  const score = sentiment?.score ?? report.sentiment_score ?? 0
  const riskExplanation = sentiment?.description || `${levelText(report.sentiment_level)}区间，说明今天的波动和不确定性需要优先纳入盘前判断。`
  const topicHighlights = sortedTopics.slice(0, 4)
  // 临时放开登录态限制，方便直接预览吸底效果。
  // const showStickyCta = isLoaded && !isSignedIn
  const showStickyCta = true

  const summaryMetrics = [
    { label: '重点预警', value: `${totalAlerts} 条`, icon: BellRing, tint: 'text-rose-500' },
    { label: '核心信号', value: `${report.item_count ?? 0} 条`, icon: Layers3, tint: 'text-amber-600' },
    { label: '主题追踪', value: `${topic_comparisons?.length ?? 0} 个`, icon: TrendingUp, tint: 'text-slate-700' },
  ]

  const judgmentPanels = [
    {
      label: '今日一句话判断',
      title: leadCopy.lead || '今天先不要被 headline 带着跑，先抓住真正改变市场预期的主线。',
      body: secondaryLead || '这份日报的重点不是把新闻列出来，而是解释它先影响利率、美元、科技股，还是风险偏好本身。',
    },
    {
      label: '当前主线',
      title: leadBrief?.topic_name || leadTopic?.topic_name || '盘前市场主线',
      body: shortText(leadBrief?.impact || leadBrief?.body || '今天更适合先抓主线，再展开阅读。', 100),
    },
    {
      label: '最强扰动',
      title: leadAlert ? alertTitle(leadAlert) : '暂无强风险 headline',
      body: shortText(leadAlert?.direction_note || leadAlert?.ai_summary || '市场暂时没有出现需要立刻追踪的单点风险。', 100),
    },
    {
      label: '容易误读',
      title: leadBrief?.topic_name ? `别只看「${leadBrief.topic_name}」headline` : '别把新闻数量当成重点',
      body: topicFocus,
    },
  ]

  const watchItems = [
    {
      label: '盘前先看',
      title: '哪条风险被市场真正接住',
      body: leadAlert
        ? shortText(leadAlert.direction_note || leadAlert.ai_summary || alertTitle(leadAlert), 88)
        : '如果今天没有强风险，就重点看主题扩散和利率方向。',
    },
    {
      label: '开盘先看',
      title: '最先确认的资产',
      body: leadAlert
        ? `${firstAsset} 会比 headline 更早给出验证。`
        : '优先看美债收益率、美元与科技龙头是否同向。',
    },
    {
      label: '盘中确认',
      title: '市场有没有认真交易',
      body: validationFocus,
    },
  ]

  return (
    <div className="new-home-shell">
      <section className="new-home-section !pt-10 sm:!pt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <Link href={backHref} className="new-home-secondary-btn">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
              <Link href={oppositeHref} className="new-home-ghost-btn">
                {oppositeLabel}
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {prevHref ? (
                <Link href={prevHref} className="new-home-ghost-btn">
                  <ArrowLeft className="h-4 w-4" />
                  前一日
                </Link>
              ) : null}
              {nextHref ? (
                <Link href={nextHref} className="new-home-ghost-btn">
                  后一日
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 new-report-feature-card !p-0 overflow-hidden">
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1.16fr)_380px]">
              <div className="px-7 py-7 sm:px-8 sm:py-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="new-home-kicker">US equities daily brief</span>
                  <span className={`new-report-level-chip ${levelClass(report.sentiment_level)}`}>
                    {levelText(report.sentiment_level)}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {report.title || `${report.report_date} 美股与国际金融前瞻`}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-700">
                  {leadCopy.lead || '这份 briefing 的重点，不是重复 headline，而是先帮你抓住今天真正改变市场预期的主线。'}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="new-report-data-pill">
                    <CalendarRange className="h-4 w-4 text-sky-600" />
                    {report.report_date}
                  </span>
                  {etTime ? (
                    <span className="new-report-data-pill">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      ET {etTime}
                    </span>
                  ) : null}
                  {localTime ? (
                    <span className="new-report-data-pill">
                      <Clock3 className="h-4 w-4 text-slate-500" />
                      Shanghai {localTime}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {summaryMetrics.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="new-report-metric-card">
                        <Icon className={`h-4 w-4 ${item.tint}`} />
                        <div><p>{item.label}</p><strong>{item.value}</strong></div>
                      </div>
                    )
                  })}
                </div>

                {topicHighlights.length > 0 ? (
                  <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-slate-50/75 px-5 py-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Topic pulse</p>
                        <h3 className="mt-2 text-base font-semibold text-slate-950">今日主题轮动</h3>
                      </div>
                      <p className="text-xs text-slate-400">当天类目由摘要数据自动生成</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {topicHighlights.map((topic, index) => (
                        <div
                          key={`${topic.topic_name || 'topic'}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.2)]"
                        >
                          <span className="font-medium">{topic.topic_name ?? '未命名主题'}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                            {topic.score ?? '--'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="border-t border-slate-200/70 bg-slate-950 px-6 py-7 text-slate-50 xl:border-l xl:border-t-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/12">
                    <ShieldAlert className="h-5 w-5 text-amber-300" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">Risk temperature</p>
                    <p className="mt-1 text-sm text-slate-300">市场风险温度</p>
                  </div>
                </div>

                <div className="mt-6 flex items-end gap-3">
                  <strong className="text-6xl font-light leading-none text-white">{score.toFixed(1)}</strong>
                  <div className="pb-1">
                    <span className={`new-report-level-chip ${levelClass(report.sentiment_level)}`}>
                      {levelText(report.sentiment_level)}
                    </span>
                    <p className="mt-3 text-sm text-slate-400">{riskBand(score)}</p>
                  </div>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                    style={{ width: `${Math.max(8, Math.min(100, score))}%` }}
                  />
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">{riskExplanation}</p>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[11px] text-slate-400">红色</p>
                    <p className="mt-2 text-sm font-semibold text-white">{report.red_count ?? 0}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[11px] text-slate-400">黄色</p>
                    <p className="mt-2 text-sm font-semibold text-white">{report.yellow_count ?? 0}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[11px] text-slate-400">主题</p>
                    <p className="mt-2 text-sm font-semibold text-white">{topic_comparisons?.length ?? 0}</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className={`new-home-section !pt-0 ${showStickyCta ? '!pb-28 sm:!pb-32' : ''}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="new-home-cta-panel !rounded-[34px]">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_340px]">
                <div>
                  <p className="new-home-kicker">Judgment desk</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    今日判断与验证重点
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    这一块只做两件事：先把今天怎么看讲清楚，再告诉用户盘前到盘中要先盯什么。
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {judgmentPanels.map((panel) => (
                      <article
                        key={panel.label}
                        className="rounded-[24px] border border-slate-200/80 bg-white/85 px-5 py-5 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.22)]"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{panel.label}</p>
                        <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-950">{panel.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{panel.body}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <aside className="rounded-[30px] bg-slate-950 px-6 py-6 text-slate-50">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">Today watch</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    今天先盯什么
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    从盘前到盘中，把验证顺序排出来，不再让用户自己在页面里找重点。
                  </p>

                  <div className="mt-6 space-y-3">
                    {watchItems.map((item) => (
                      <article key={item.label} className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/90">{item.label}</p>
                        <h4 className="mt-2 text-sm font-semibold text-white">{item.title}</h4>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{item.body}</p>
                      </article>
                    ))}
                  </div>
                </aside>
              </div>
            </div>

            <div className="relative">
              <div className="min-w-0">
                {news_briefs && news_briefs.length > 0 ? (
                  <NewsBriefs items={news_briefs} />
                ) : (
                  <SectionPlaceholder title="新闻翻译台" message="暂无新闻翻译内容" className="!bg-white/70 !border-slate-200" />
                )}
              </div>

            </div>

            {market_snapshots && market_snapshots.length > 0 ? (
              <MarketSnapshot items={market_snapshots} />
            ) : (
              <SectionPlaceholder title="盘前市场快照" message="暂无行情数据" className="!bg-white/70 !border-slate-200" />
            )}
          </div>

          <div className="mt-8">
            {alerts && alerts.length > 0 ? (
              <AlertsList items={alerts} />
            ) : (
              <SectionPlaceholder title="风险观察清单" message="暂无预警数据" className="!bg-white/70 !border-slate-200" />
            )}
          </div>

        </div>
      </section>

      {showStickyCta ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-4 sm:px-4">
          <div className="mx-auto max-w-4xl rounded-[26px] border border-white/70 bg-white/88 px-4 py-3 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.4)] backdrop-blur-xl pointer-events-auto sm:px-5 sm:py-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">继续阅读</p>
                <p className="mt-1 text-sm font-medium text-slate-950 sm:text-base">
                  看完这份解释型日报后，可以继续回看历史判断，或了解会员权益。
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={backHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {backLabel}
                </Link>
                <Link
                  href={oppositeHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {oppositeLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
