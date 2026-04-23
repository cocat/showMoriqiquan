'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, ArrowRight, CalendarRange, Clock3, ShieldAlert } from 'lucide-react'
import { useAppAuth } from '@/app/providers'
import type { SnapshotItem } from '@/app/components/report/MarketSnapshot'

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
  overview?: { content?: string } | null
  market_snapshots?: SnapshotItem[]
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

const levelText = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger':
      return '高风险'
    case 'alert':
      return '警戒'
    case 'watch':
      return '关注'
    default:
      return '平稳'
  }
}

const levelClass = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'danger':
      return 'new-report-level-danger'
    case 'alert':
      return 'new-report-level-alert'
    case 'watch':
      return 'new-report-level-watch'
    default:
      return 'new-report-level-calm'
  }
}

function shortText(text?: string | null, max = 90) {
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
    return '先看油价、避险资产和科技股会不会同时给出反馈。'
  }

  return '先看指数、利率和龙头股有没有给出一致验证。'
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
  const { isLoaded } = useAppAuth()

  if (loading) {
    return (
      <div className="new-home-shell">
        <section className="new-home-section !pt-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="new-report-skeleton h-[220px]" />
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="new-report-skeleton h-[260px]" />
              <div className="new-report-skeleton h-[260px]" />
            </div>
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
                当前内容暂时无法加载。
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {errorMessage || '请稍后再试。'}
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

  const { report, sentiment, overview, alerts, news_briefs } = data
  const leadBrief = news_briefs?.[0] ?? null
  const leadAlert = alerts?.[0] ?? null
  const leadCopy = splitLeadText(overview?.content)
  const etTime = formatZonedTime(report.generated_at, 'en-US', 'America/New_York')
  const localTime = formatZonedTime(report.generated_at, 'zh-CN', 'Asia/Shanghai')
  const score = sentiment?.score ?? report.sentiment_score ?? 0
  const firstAsset = alertAssets(leadAlert)[0] ?? '收益率 / 美元 / 龙头股'
  const validationFocus = buildValidationFocus(leadBrief, leadAlert)
  const showStickyCta = isLoaded

  return (
    <div className="new-home-shell">
      <section className="new-home-section !pt-10 sm:!pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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

          <div className="mt-8 new-report-feature-card !overflow-hidden !p-0">
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1.16fr)_360px]">
              <div className="px-7 py-8 sm:px-9 sm:py-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="new-home-kicker">Today signal</span>
                  <span className={`new-report-level-chip ${levelClass(report.sentiment_level)}`}>
                    {levelText(report.sentiment_level)}
                  </span>
                </div>

                <h1 className="mt-6 max-w-4xl text-[2.35rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[4.1rem] sm:leading-[1.02]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  {report.title || `${report.report_date} 今日观点`}
                </h1>

                <p className="mt-5 max-w-3xl text-[15px] leading-8 text-slate-700 sm:text-lg sm:leading-9">
                  {leadCopy.lead || '先抓住今天最重要的观点，再决定要不要继续往下看 headline。'}
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
              </div>

              <aside className="border-t border-stone-200/80 bg-[linear-gradient(180deg,#111827,#0f172a)] px-6 py-8 text-slate-50 xl:border-l xl:border-t-0 sm:px-7">
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
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  免费先看到今天最重要的观点。会员再解锁为什么是这个观点，以及看哪里验证。
                </p>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className={`new-home-section !pt-0 ${showStickyCta ? '!pb-28 sm:!pb-32' : ''}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 sm:space-y-12">
            <div className="new-home-cta-panel !rounded-[36px] border-stone-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.72))]">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_340px]">
                <div>
                  <p className="new-home-kicker">Core view</p>
                  <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.4rem]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    今天最重要的观点
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600">
                    先知道今天真正重要的是什么，再往下看为什么是这个观点。
                  </p>

                  <div className="mt-7 grid gap-3 md:grid-cols-2">
                    <article className="rounded-[24px] border border-slate-900/10 bg-slate-950 px-5 py-5 text-white shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/90">今天的观点</p>
                      <h3 className="mt-3 text-lg font-semibold leading-7">{leadCopy.lead || '先看这条判断，再看新闻。'}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {shortText(leadCopy.rest || overview?.content || '今天的重点不是 headline 数量，而是市场有没有认真交易它。', 180)}
                      </p>
                    </article>

                    <article className="rounded-[24px] border border-slate-200/80 bg-white/88 px-5 py-5 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">为什么是这个观点</p>
                      <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-950">
                        {leadBrief?.topic_name || '市场真正交易什么'}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {shortText(leadBrief?.impact || leadBrief?.body || '今天真正重要的，不是 headline 表面，而是它改变了哪条定价主线。', 170)}
                      </p>
                    </article>
                  </div>
                </div>

                <aside className="rounded-[32px] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.65),rgba(255,255,255,0.94))] px-6 py-6 text-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">Today watch</p>
                  <h3 className="mt-3 text-[1.8rem] font-semibold text-slate-950 sm:text-[2rem]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    今天先看什么
                  </h3>
                  <div className="mt-6 space-y-3">
                    <article className="rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">盘前先看</p>
                      <h4 className="mt-2 text-sm font-semibold text-slate-950">哪条风险被市场真正接住</h4>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {leadAlert ? shortText(leadAlert.direction_note || leadAlert.ai_summary || alertTitle(leadAlert), 88) : '如果今天没有强风险，就重点看利率和主题扩散。'}
                      </p>
                    </article>
                    <article className="rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">最先确认的资产</p>
                      <h4 className="mt-2 text-sm font-semibold text-slate-950">{firstAsset}</h4>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{validationFocus}</p>
                    </article>
                  </div>
                </aside>
              </div>
            </div>

            {news_briefs && news_briefs.length > 0 ? (
              <NewsBriefs items={news_briefs} />
            ) : null}
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
                  免费先看到观点，会员再看到为什么，以及后面会怎样。
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  href={backHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  回看过去判断
                </Link>
                <Link
                  href={oppositeHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  解锁会员能看到的部分
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
