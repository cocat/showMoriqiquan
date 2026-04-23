'use client'

import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { ArrowRight } from 'lucide-react'
import { useAppAuth } from '@/app/providers'
import { mockWeeklyContent } from '@/lib/mock-derived-content'

export default function PlaybookPage() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const { isLoaded, isSignedIn } = useAppAuth()

  if (!isLoaded) {
    return (
      <div className="new-home-shell">
        <section className="new-home-section !pt-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="new-report-skeleton h-[320px]" />
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="new-home-shell">
      <section className="new-home-hero">
        <div className="new-home-orb new-home-orb-left" />
        <div className="new-home-orb new-home-orb-right" />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr] lg:items-start">
            <div>
              <div className="new-home-eyebrow">
                <span className="new-home-dot" />
                Weekly Playbook
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                {mockWeeklyContent.thesis_json.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                {mockWeeklyContent.thesis_json.summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  先看今日观点
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/subscribe" className="new-home-secondary-btn">
                  查看会员权益
                </Link>
              </div>
            </div>

            <aside className="new-home-cta-panel !rounded-[36px]">
              <p className="new-home-panel-kicker">This week in one view</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                本周一句话主判断
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-700">
                {mockWeeklyContent.thesis_json.editor_note}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200/80 bg-white/82 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">本周关键窗口</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{mockWeeklyContent.themes_json[0]?.next_focus}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200/80 bg-white/82 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">本周最先验证</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{mockWeeklyContent.pathways_json[0]?.expected_market_response}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Core themes</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                本周三大主线
              </h2>
            </div>
            <p className="new-home-section-copy">
              周度页面不追求列很多方向，而是把这一周最值得提前盯住的 2-3 个观点拎出来，让用户先知道重点在哪。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {mockWeeklyContent.themes_json.map((item) => (
              <article key={item.id} className="new-home-service-card !rounded-[30px] !p-7">
                <p className="new-home-panel-kicker">{item.direction}</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{item.name}</h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home-section new-home-section-contrast !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-7 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Key windows</p>
              <h2 className="mt-3 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                这周真正会改写预期的，是这些窗口。
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  { day: '周一', title: '先看旧逻辑是否延续', detail: mockWeeklyContent.themes_json[0]?.next_focus || '', level: '观察' },
                  { day: '周三', title: '关键数据窗口', detail: mockWeeklyContent.pathways_json[0]?.trigger_condition || '', level: '高' },
                  { day: '周四', title: '路径确认', detail: mockWeeklyContent.pathways_json[1]?.trigger_condition || '', level: '高' },
                ].map((item, index) => (
                  <article key={item.title} className={`${index > 0 ? 'border-t border-white/10 pt-4' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-slate-200">
                        {item.day}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-amber-200">
                        {item.level}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="new-home-cta-panel !rounded-[36px] !bg-white/92">
              <p className="new-home-panel-kicker">Playbook focus</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                本周最重要的，不是信息更多，而是先确认哪条观点会继续成立。
              </h2>
              <div className="mt-6 space-y-3">
                {mockWeeklyContent.pathways_json.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-slate-200/80 bg-slate-50/75 px-4 py-4">
                    <p className="text-sm leading-7 text-slate-600">{item.expected_market_response}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="new-home-cta-panel !rounded-[36px]">
              <p className="new-home-kicker">Observation frame</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
                本周观察框架
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-600">
                周度内容的价值不在于信息更全，而在于把本周的观察顺序排出来：先看哪条观点，再看它会不会被关键窗口验证。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: '市场已交易什么', body: '市场已经部分交易了利率缓和预期，高估值主线仍有一定容忍度。' },
                { title: '市场还没交易什么', body: '如果收益率重新上冲，当前乐观定价还没有完整反映这种修正。' },
                { title: '本周继续确认什么', body: '先看收益率和美元，再确认纳指与避险资产是否给出一致反馈。' },
              ].map((item) => (
                <article key={item.title} className="new-home-service-card !rounded-[28px] !p-6">
                  <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Scenarios</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                A / B 情景推演
              </h2>
            </div>
            <p className="new-home-section-copy">
              Playbook 最重要的不是描述事件本身，而是提前准备两套最主要的观点路径。真正发生时，用户可以立刻知道先验证哪里。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {mockWeeklyContent.pathways_json.map((item) => (
              <article key={item.id} className="new-home-service-card !rounded-[34px] !p-8">
                <p className="new-home-panel-kicker">{item.name}</p>
                <p className="mt-4 text-sm leading-8 text-slate-700">{item.expected_market_response}</p>
                <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-slate-50/75 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">先验证什么</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.trigger_condition}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Weekly review</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                上周对账
              </h2>
            </div>
            <p className="new-home-section-copy">
              周度产品里必须包含对账，因为用户不是只想看新观点，还想知道之前的观点后来是如何被市场验证或修正的。
            </p>
          </div>

          <div className="mt-10 new-home-cta-panel !rounded-[36px]">
            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.04fr_1.04fr]">
              {[
                { title: '上周主判断', body: 'headline 会很多，但真正主导节奏的仍然是利率与风险偏好。' },
                { title: '后来市场怎么走', body: mockWeeklyContent.track_record_json.what_played_out || '' },
                { title: '本周如何修正', body: mockWeeklyContent.track_record_json.what_changed || '' },
              ].map((item, index) => (
                <article
                  key={item.title}
                  className={`rounded-[26px] border border-slate-200/80 bg-white/82 px-5 py-5 ${index > 0 ? '' : ''}`}
                >
                  <p className="new-home-panel-kicker">{item.title}</p>
                  <p className="mt-4 text-sm leading-8 text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-cta-panel !rounded-[36px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="new-home-kicker">Next step</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  每天先用今日观点进入市场，再用 Playbook 维持一周重点。
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  如果你认同这种“先给观点，再解释，再验证”的节奏，可以继续进入今日信号页，或者解锁完整会员内容。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-secondary-btn">
                  打开今日观点
                </Link>
                {isSignedIn ? (
                  <Link href="/subscribe" className="new-home-primary-btn">
                    查看会员权益
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : skipClerk ? (
                  <Link href="/sign-in?redirect_url=/playbook" className="new-home-primary-btn">
                    登录试读
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl="/playbook">
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
    </div>
  )
}
