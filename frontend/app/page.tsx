'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CalendarRange,
  ChartCandlestick,
  CircleAlert,
  Clock3,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { formatApiErrorForUser } from '@/lib/api-error-ui'
import { withTokenRetry } from '@/lib/session-token'

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

const levelLabel = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger': return '高风险'
    case 'alert': return '警戒'
    case 'watch': return '关注'
    default: return '平稳'
  }
}

const heroBenefitCards = [
  {
    title: '先给判断',
    description: '先知道今天偏进攻、偏防守还是先观望，再决定要不要深读。',
  },
  {
    title: '跨时区阅读',
    description: '把 ET 与本地时间放到同一视图里，减少时差带来的信息断层。',
  },
  {
    title: '只抓主驱动',
    description: '聚焦利率、美元、美债、科技股和国际风险，而不是平铺大量新闻。',
  },
]

const heroSupportRows = [
  {
    title: '适合上班前 3 分钟打开',
    description: '先完成第一次盘前判断，不需要同时切多个信息源。',
    icon: Clock3,
  },
  {
    title: '更适合海外华人的语境',
    description: '用中文快速理解美股与国际金融变化，但保留市场结构与专业感。',
    icon: Globe2,
  },
  {
    title: '像一份固定研究输入',
    description: '不是刷资讯，而是每天稳定补充一份结构化盘前前瞻。',
    icon: Sparkles,
  },
]

const audienceCards = [
  {
    title: '中文快速理解美股与国际金融',
    description: '把盘前资讯压缩成中文结论、驱动与风险提示，减少来回切英文终端、媒体和社交平台的成本。',
    points: ['先给判断，再给信号', '更适合工作日前 3 分钟阅读'],
    icon: Globe2,
  },
  {
    title: '更适合跨时区的阅读节奏',
    description: '晨报逻辑围绕美股交易时段展开，同时补上 ET 与本地时间语境，让海外华人更容易对齐阅读节奏。',
    points: ['突出盘前与重要事件窗口', '适合通勤、午休和收盘后复盘'],
    icon: Clock3,
  },
  {
    title: '关注关键联动，而不是铺满新闻',
    description: '重点跟踪宏观、利率、美元、美债、科技股与全球风险事件，帮助用户更快理解市场背后的主驱动。',
    points: ['不覆盖 A 股，聚焦美股与国际金融', '内容更像研究产品，而不是资讯门户'],
    icon: ChartCandlestick,
  },
]

const trackingCards = [
  {
    step: '01',
    title: '利率路径与美债收益率',
    description: '先看美联储预期、收益率曲线和流动性环境，再判断高估值板块承压还是修复。',
  },
  {
    step: '02',
    title: '美元强弱与全球风险偏好',
    description: '美元、避险资产和跨市场情绪变化，往往决定当天风险偏好是扩散还是收缩。',
  },
  {
    step: '03',
    title: '大型科技股与主题板块',
    description: '把指数层面的波动拆回到科技龙头、AI 链条和重点行业上，帮助用户识别真正的驱动源。',
  },
]

const weeklyFocusRows = [
  {
    label: '周初',
    title: '先确认利率、美元和美债收益率怎么定价',
    description: '一周开始先看流动性和利率路径，判断市场是继续偏防守，还是有风险偏好回升的空间。',
  },
  {
    label: '周中',
    title: '再看财报、主题板块和大型科技股怎么反馈',
    description: '真正影响节奏的，往往不是消息数量，而是重点公司与高权重板块有没有把情绪接住。',
  },
  {
    label: '周后',
    title: '最后检查风险有没有扩散成更大的交易主题',
    description: '地缘、政策、监管和避险情绪如果外溢，往往会把原本局部的扰动推成全市场的风险定价。',
  },
]

const reportModules = [
  {
    title: '今日结论',
    description: '先给一段盘前核心判断，帮助用户快速知道今天是偏进攻、偏防守还是先观望。',
  },
  {
    title: '风险温度',
    description: '情绪指数、预警密度和重要事件集中度，用来判断当天的波动级别。',
  },
  {
    title: '盘前市场快照',
    description: '覆盖指数、美元、美债、黄金与重点板块，快速建立跨资产背景。',
  },
  {
    title: '三大驱动',
    description: '把最重要的宏观、政策或公司层面驱动抽出来，而不是让用户自己在新闻里找答案。',
  },
  {
    title: '重点板块与龙头股',
    description: '关注科技股、AI、半导体与其他当天最关键的交易主题，方便把判断落到标的层。',
  },
  {
    title: '风险提示与后续观察',
    description: '明确提醒还没定价完的风险点，以及接下来几个交易时段要继续盯什么。',
  },
]

const membershipCards = [
  {
    title: '免费预览',
    price: 'Guest',
    description: '先体验阅读结构和摘要压缩能力，确认内容节奏适合自己的使用习惯。',
    points: ['可查看首页预览与部分摘要', '适合先了解内容风格', '进入完整报告前先建立判断框架'],
    accent: 'subtle',
  },
  {
    title: 'Observer 会员',
    price: '$29.9 / 月',
    description: '完整解锁每日简报、近 7 天历史内容和专题追踪，适合需要稳定盘前输入的用户。',
    points: ['完整前瞻与风险提示', '近 7 天历史简报回看', '专题追踪与研究型阅读路径'],
    accent: 'featured',
  },
]

const methodCards = [
  {
    title: '信息来源',
    description: '内容以公开市场信息、多源信号和结构化整理为基础，重点是筛选与解释，不是堆原始链接。',
  },
  {
    title: '输出原则',
    description: '优先给出结论、驱动和风险边界，再补充背景与延伸阅读，保证忙碌用户也能快速使用。',
  },
  {
    title: '风险边界',
    description: '站点提供的是市场前瞻与风险提示，不构成个股推荐或投资收益承诺。',
  },
]

const trackingTopics = ['美联储路径', '美元与美债', '大型科技股', 'AI 与半导体', '财报季', '全球风险事件']

function cut(text?: string | null, max = 120) {
  if (!text) return ''
  const cleaned = text.trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max).trim()}…`
}

function formatClock(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(value))
}

function buildTimeContext(value: string, viewerTimeZone: string) {
  try {
    const localLabel = viewerTimeZone.split('/').pop()?.replace(/_/g, ' ') || '本地时间'
    return {
      et: formatClock(value, 'America/New_York'),
      local: formatClock(value, viewerTimeZone),
      localLabel,
    }
  } catch {
    return null
  }
}

export default function HomePage() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const { getToken, isSignedIn } = useAppAuth()
  const [latest, setLatest] = useState<LatestSummary | null>(null)
  const [overviewExcerpt, setOverviewExcerpt] = useState('')
  const [alerts, setAlerts] = useState<AlertPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [viewerTimeZone, setViewerTimeZone] = useState('')
  const alertsFetchedDateRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      setViewerTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
    } catch {
      setViewerTimeZone('')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    withTokenRetry(getToken, (token) => reportsApi.latestSummaryBundle(token))
      .then((data) => {
        if (cancelled) return
        const report = (data as { report?: LatestSummary; overview_teaser?: string })?.report
        setLatest(report ?? null)
        setOverviewExcerpt(typeof (data as { overview_teaser?: string })?.overview_teaser === 'string' ? (data as { overview_teaser?: string }).overview_teaser! : '')
        setLoadError('')
      })
      .catch((error) => {
        if (cancelled) return
        setLatest(null)
        setOverviewExcerpt('')
        setAlerts([])
        setLoadError(formatApiErrorForUser(error, '今日前瞻暂时无法加载，请稍后再试。'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [getToken])

  useEffect(() => {
    const reportDate = latest?.report_date
    if (!reportDate || !isSignedIn) return
    if (alertsFetchedDateRef.current === reportDate) return
    alertsFetchedDateRef.current = reportDate

    let cancelled = false
    withTokenRetry(getToken, (token) => reportsApi.getByDate(reportDate, token))
      .then((detail) => {
        if (cancelled) return
        const value = detail as { alerts?: AlertPreview[] }
        setAlerts(Array.isArray(value.alerts) ? value.alerts.slice(0, 4) : [])
      })
      .catch(() => {
        if (!cancelled) setAlerts([])
      })

    return () => {
      cancelled = true
    }
  }, [latest?.report_date, isSignedIn, getToken])

  const totalAlerts = (latest?.red_count ?? 0) + (latest?.yellow_count ?? 0)
  const afterSignInUrl = '/reports/latest'
  const timeContext = latest?.generated_at && viewerTimeZone ? buildTimeContext(latest.generated_at, viewerTimeZone) : null
  const heroMetrics = [
    { value: latest?.sentiment_score ?? '--', label: '情绪指数', icon: TrendingUp, tint: 'text-sky-600' },
    { value: latest ? `${totalAlerts} 条` : '--', label: '重点预警', icon: BellRing, tint: 'text-rose-500' },
    { value: latest?.topic_count != null ? String(latest.topic_count) : '--', label: '主题覆盖', icon: Layers3, tint: 'text-amber-600' },
    { value: latest?.multi_source_count != null ? String(latest.multi_source_count) : '--', label: '多源信号', icon: CalendarRange, tint: 'text-slate-500' },
  ]
  const previewFocus = alerts.length > 0
    ? alerts.slice(0, 3).map((item) => item.zh_title || item.title || item.ai_summary || '重点预警')
    : ['先看盘前结论与风险温度', '再看当天最关键的宏观驱动', '最后确认重点板块与后续观察点']

  return (
    <div className="new-home-shell">
      <section className="new-home-hero">
        <div className="new-home-orb new-home-orb-left" />
        <div className="new-home-orb new-home-orb-right" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[1.14fr_0.86fr] lg:items-center">
            <div className="max-w-4xl">
              <div className="new-home-eyebrow">
                <span className="new-home-dot" />
                US equities & global macro brief
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                用中文，3 分钟读懂开盘前最重要的美股与国际金融信号。
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                这是一个面向海外华人的美股与国际金融中文前瞻产品。我们把盘前风险、宏观驱动、美元与美债、科技股与主题板块压缩成一份更适合跨时区阅读的简报，帮助用户先建立判断，再进入完整研究。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  试读今日前瞻
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/subscribe" className="new-home-secondary-btn">
                  查看会员权益
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {heroBenefitCards.map((item) => (
                  <article key={item.title} className="new-home-service-card !rounded-[24px] !p-5">
                    <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="new-home-cta-panel !rounded-[32px]">
              <p className="new-home-panel-kicker">How it fits your day</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                这份简报更像一个固定的盘前工作台。
              </h2>
              <div className="mt-6 space-y-4">
                {heroSupportRows.map(({ title, description, icon: Icon }, index) => (
                  <div
                    key={title}
                    className={`flex items-start gap-4 ${index > 0 ? 'border-t border-slate-200/80 pt-4' : ''}`}
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950/5 text-slate-800">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="mt-8 new-home-terminal-card !rounded-[40px] !p-8">
            {loading ? (
              <div className="space-y-4">
                <div className="new-report-skeleton h-16" />
                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.95fr_0.9fr]">
                  <div className="new-report-skeleton h-[200px]" />
                  <div className="new-report-skeleton h-[200px]" />
                  <div className="new-report-skeleton h-[200px]" />
                </div>
              </div>
            ) : loadError ? (
              <div className="new-home-cta-panel !border-0 !bg-transparent !p-0 !shadow-none">
                <p className="new-home-kicker">Daily brief</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  暂无权限，可以登录后查看。
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  暂无权限，可以登录后查看。
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/reports" className="new-home-secondary-btn">
                    查看历史简报
                  </Link>
                  <Link href="/subscribe" className="new-home-ghost-btn">
                    查看会员权益
                  </Link>
                </div>
              </div>
            ) : latest ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="new-home-panel-kicker">Today briefing</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                      {latest.title || `${latest.report_date} 美股与国际金融前瞻`}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {timeContext ? (
                      <>
                        <div className="new-report-data-pill">
                          <Clock3 className="h-3.5 w-3.5" />
                          ET {timeContext.et}
                        </div>
                        <div className="new-report-data-pill">
                          <Globe2 className="h-3.5 w-3.5" />
                          {timeContext.localLabel} {timeContext.local}
                        </div>
                      </>
                    ) : null}
                    <div className={`new-report-level-chip ${latest.sentiment_level ? `new-report-level-${latest.sentiment_level === 'danger' ? 'danger' : latest.sentiment_level === 'alert' ? 'alert' : latest.sentiment_level === 'watch' ? 'watch' : 'calm'}` : 'new-report-level-calm'}`}>
                      {levelLabel(latest.sentiment_level)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1.12fr_0.98fr_0.9fr]">
                  <div className="new-report-feature-summary !h-full">
                    <p className="new-home-panel-kicker">盘前结论</p>
                    <p className="mt-4 text-sm leading-8 text-slate-700">
                      {cut(overviewExcerpt, 220) || '先用一段压缩摘要完成盘前判断，再展开看驱动、风险和重点主题。'}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {['先判断方向', '再看驱动来源', '最后确认风险边界'].map((item) => (
                        <span key={item} className="new-report-data-pill">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {heroMetrics.map(({ value, label, icon: Icon, tint }) => (
                      <div key={label} className="new-home-pulse-card !p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-500">{label}</span>
                          <Icon className={`h-4 w-4 ${tint}`} />
                        </div>
                        <div className="mt-4 text-3xl font-semibold text-slate-950">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-6">
                    <p className="new-home-panel-kicker">先看这三项</p>
                    <div className="mt-4 space-y-3">
                      {previewFocus.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className={`flex items-start gap-3 ${index > 0 ? 'border-t border-slate-200/70 pt-3' : ''}`}
                        >
                          <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-rose-400" />
                          <p className="text-sm leading-7 text-slate-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="new-home-cta-panel !border-0 !bg-transparent !p-0 !shadow-none">
                <p className="new-home-kicker">Daily brief</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  当前还没有可展示的最新简报。
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  你可以先查看历史简报，或者稍后再回来获取当天更新。
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-8" id="topics">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">For overseas Chinese</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                不只是中文金融站，而是更适合海外华人的跨时区研究输入。
              </h2>
            </div>
            <p className="new-home-section-copy">
              首页先讲清使用场景，而不是一上来堆栏目。用户需要知道这里为什么值得每天打开，以及它能不能真正节省自己的判断时间。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {audienceCards.map(({ title, description, points, icon: Icon }) => (
              <article key={title} className="new-home-service-card">
                <div className="new-home-service-icon bg-slate-950/5 text-slate-800">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                <div className="mt-5 space-y-2 border-t border-slate-200/80 pt-4">
                  {points.map((point) => (
                    <p key={point} className="text-sm leading-6 text-slate-500">
                      {point}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home-section new-home-section-contrast">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="new-home-insight-panel">
              <p className="new-home-kicker">What we track</p>
              <h2 className="new-home-section-title text-white" style={{ fontFamily: 'var(--font-display)' }}>
                我们聚焦美股和国际金融的关键驱动，不做泛市场铺量。
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                产品主线应该清楚告诉用户：这里看的是利率、美元、美债、科技股和全球风险事件如何共同影响美股，而不是把各种新闻拼在一起。
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {trackingTopics.map((item) => (
                  <span key={item} className="new-home-topic-chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {trackingCards.map((item) => (
                <article key={item.step} className="new-home-flow-card">
                  <span className="new-home-flow-step">{item.step}</span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Weekly radar</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                用一套连续的观察框架，代替碎片化的每周提醒。
              </h2>
            </div>
            <p className="new-home-section-copy">
              这一块不再做四张零碎的小卡，而是更清楚地告诉用户：一周里应该先看什么、再看什么、最后确认什么。
            </p>
          </div>

          <div className="mt-10 new-home-cta-panel !rounded-[38px]">
            <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-2">
                {weeklyFocusRows.map((item, index) => (
                  <article
                    key={item.title}
                    className={`grid gap-4 py-4 sm:grid-cols-[88px_minmax(0,1fr)] ${index > 0 ? 'border-t border-slate-200/80' : ''}`}
                  >
                    <div>
                      <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white">
                        {item.label}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="rounded-[30px] border border-slate-900/10 bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-8 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Tracking set</p>
                <h3 className="mt-4 text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  这周真正要盯住的，不是消息数量，而是三条主线有没有继续发酵。
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  每日简报会围绕这些主线持续更新，让用户知道市场是在延续旧逻辑，还是已经切换到新的风险定价阶段。
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {trackingTopics.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-white/12 bg-white/8 px-3 py-2 text-sm text-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="new-home-cta-panel">
              <p className="new-home-kicker">Report sample</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                一份简报先给结论，再展开驱动、风险和重点板块。
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600">
                首页不需要展示全部内容，但要让用户知道进到报告后会读到什么。真正的价值不是“有很多模块”，而是“模块排列顺序能帮助用户更快形成判断”。
              </p>
              <div className="mt-6 new-report-feature-summary">
                <p className="new-home-panel-kicker">Preview excerpt</p>
                <p className="mt-3 text-sm leading-8 text-slate-700">
                  {cut(overviewExcerpt, 220) || '完整简报会先压缩成一段盘前摘要，再展开风险温度、市场快照、重点驱动、板块观察和后续需要跟踪的风险点。'}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  打开今日简报
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/reports" className="new-home-ghost-btn">
                  查看历史简报
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {reportModules.map((item) => (
                <article key={item.title} className="new-home-service-card !p-6">
                  <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section" id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Membership</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                先试读，再决定是否把它变成每天固定打开的一份研究输入。
              </h2>
            </div>
            <p className="new-home-section-copy">
              订阅页的重点不只是价格，而是清楚解释免费能看什么、付费能解锁什么，以及这类内容适合什么样的用户。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {membershipCards.map((item) => (
              <article
                key={item.title}
                className={`new-home-service-card !rounded-[32px] !p-8 ${
                  item.accent === 'featured'
                    ? 'border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.92))]'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{item.title}</p>
                    <h3 className="mt-3 text-3xl font-semibold text-slate-950">{item.price}</h3>
                  </div>
                  {item.accent === 'featured' ? (
                    <span className="new-report-level-chip new-report-level-watch">核心方案</span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5">
                  {item.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 new-home-cta-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="new-home-kicker">Current rollout</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  订阅流程正在持续完善，当前可以先登录试读并查看报告结构。
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/subscribe" className="new-home-secondary-btn">
                  打开会员页
                </Link>
                {isSignedIn ? (
                  <Link href="/reports/latest" className="new-home-primary-btn">
                    查看今日简报
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : skipClerk ? (
                  <Link href={`/sign-in?redirect_url=${encodeURIComponent(afterSignInUrl)}`} className="new-home-primary-btn">
                    登录试读
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl={afterSignInUrl}>
                    <button type="button" className="new-home-primary-btn">
                      登录试读
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0" id="method">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Method</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                这是一份市场前瞻与风险提示，不是喊单站。
              </h2>
            </div>
            <p className="new-home-section-copy">
              对金融咨询类产品来说，信任建立不能只放在页脚。方法说明、输出边界和风险提示应该是首页就能看到的一部分。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {methodCards.map((item, index) => (
              <article key={item.title} className="new-home-service-card">
                <div className="new-home-service-icon bg-slate-950/5 text-slate-800">
                  {index === 0 ? <BriefcaseBusiness className="h-5 w-5" /> : index === 1 ? <Sparkles className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
