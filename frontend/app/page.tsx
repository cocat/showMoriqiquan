'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock3, Globe2, ShieldCheck } from 'lucide-react'
import { formatSignalLevel, mockDailyContent } from '@/lib/mock-derived-content'

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

const valueCards = [
  {
    title: '先告诉你重点',
    description: '先抓住今天最重要的观点，不被 headline 数量带偏。',
  },
  {
    title: '再告诉你为什么',
    description: '解释市场真正交易什么，而不是重复资讯表面。',
  },
  {
    title: '最后持续跟踪',
    description: '继续看这条观点有没有被市场验证，而不是说完就算。',
  },
]

export default function HomePage() {
  const [viewerTimeZone, setViewerTimeZone] = useState('')

  useEffect(() => {
    try {
      setViewerTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
    } catch {
      setViewerTimeZone('')
    }
  }, [])

  const signalLabel = formatSignalLevel(mockDailyContent.thesis_json.signal_level)
  const timeContext = viewerTimeZone ? buildTimeContext(mockDailyContent.generated_at, viewerTimeZone) : null
  const checks = mockDailyContent.confirmations_json.slice(0, 2)

  return (
    <div className="new-home-shell">
      <section className="new-home-hero">
        <div className="new-home-orb new-home-orb-left" />
        <div className="new-home-orb new-home-orb-right" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="max-w-4xl">
              <div className="new-home-eyebrow">
                <span className="new-home-dot" />
                US equities & global macro signal
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                每天几分钟，抓住今天最重要的市场观点。
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                面向海外华人的美股与国际金融订阅产品。我们不重复 headline，而是把新闻翻译成更有用的市场观点。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  先看今日观点
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/subscribe" className="new-home-secondary-btn">
                  看看会员多看到什么
                </Link>
              </div>
            </div>

            <aside className="new-home-cta-panel !rounded-[34px]">
              <p className="new-home-panel-kicker">Today signal</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex rounded-full bg-slate-950 px-4 py-1.5 text-sm font-semibold text-white">
                  {signalLabel}
                </span>
                <span className="text-sm text-slate-500">今天最重要的观点</span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                {mockDailyContent.thesis_json.title}
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-700">
                {mockDailyContent.thesis_json.summary}
              </p>

              {timeContext ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="new-report-data-pill">
                    <Clock3 className="h-3.5 w-3.5" />
                    ET {timeContext.et}
                  </span>
                  <span className="new-report-data-pill">
                    <Globe2 className="h-3.5 w-3.5" />
                    {timeContext.localLabel} {timeContext.local}
                  </span>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="new-home-cta-panel !rounded-[36px]">
              <p className="new-home-kicker">Today preview</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                今天市场最重要的，不一定是新闻最多的。
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600">
                免费先看到今天的核心观点，再决定要不要继续看更完整的解释和验证。
              </p>

              <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-white/85 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">一句话理由</p>
                <p className="mt-3 text-sm leading-8 text-slate-700">{mockDailyContent.thesis_json.summary}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  看完整观点
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/reports" className="new-home-ghost-btn">
                  回看过去几天
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <article className="new-home-service-card !rounded-[30px] !p-6">
                <p className="new-home-panel-kicker">先看什么</p>
                <div className="mt-3 space-y-2">
                  {checks.map((item) => (
                    <p key={item.id} className="text-sm leading-7 text-slate-600">
                      {item.name}
                    </p>
                  ))}
                </div>
              </article>
              <article className="new-home-service-card !rounded-[30px] !p-6">
                <p className="new-home-panel-kicker">为什么值得看</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {mockDailyContent.thesis_json.editor_note}
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Why subscribe</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                你不缺新闻，缺的是更有用的观点。
              </h2>
            </div>
            <p className="new-home-section-copy">
              我们先给观点，再给解释，再给验证点。这样你看到的不是内容变多，而是判断变清楚。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {valueCards.map((item) => (
              <article key={item.title} className="new-home-service-card">
                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0" id="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="new-home-service-card !rounded-[32px] !p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">免费先看到</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-950">今天最重要的观点</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                先知道今天值不值得继续看下去，适合快速抓重点。
              </p>
              <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5">
                {['今日最重要的观点', '一句话理由', '本周重点预览'].map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="new-home-service-card !rounded-[32px] !p-8 border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.92))]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">会员再多看到</p>
              <h3 className="mt-3 text-3xl font-semibold text-slate-950">为什么成立，以及后面会怎样</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                真正的会员价值在于补上新闻翻译、验证顺序和后续跟踪，而不是单纯看到更多段落。
              </p>
              <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5">
                {['观点为什么成立', '完整新闻翻译台', '盘前验证清单', '历史判断回看'].map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/subscribe" className="new-home-primary-btn">
                  看看会员多拿到什么
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
