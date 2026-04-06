'use client'

import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { ArrowRight, Check, CircleAlert, Clock3, Globe2, ShieldCheck } from 'lucide-react'
import { useAppAuth } from '@/app/providers'

const planCards = [
  {
    title: '免费预览',
    price: 'Guest',
    description: '适合先确认内容风格、阅读路径和压缩效率，再决定是否订阅。',
    points: ['查看首页预览与部分摘要', '感受盘前阅读结构', '先了解我们如何组织信号'],
    featured: false,
  },
  {
    title: 'Observer',
    price: '$29.9 / 月',
    description: '当前阶段的核心订阅方案，适合需要稳定盘前输入的海外华人用户。',
    points: ['完整每日前瞻与风险提示', '近 7 天历史简报回看', '专题追踪与跨资产阅读路径'],
    featured: true,
  },
]

const scenarios = [
  {
    title: '上班前 3 分钟',
    description: '先看今日结论、风险温度和关键驱动，不需要打开过多信息源。',
    icon: Clock3,
  },
  {
    title: '跨时区跟踪美股',
    description: '围绕 ET 节奏组织简报内容，也尽量兼顾用户本地时间语境。',
    icon: Globe2,
  },
  {
    title: '想提升信息效率',
    description: '适合需要每天稳定输入、但不希望在新闻流里反复筛选的用户。',
    icon: ShieldCheck,
  },
]

export default function SubscribePage() {
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
          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div>
              <div className="new-home-eyebrow">
                <span className="new-home-dot" />
                Membership & access
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                会员页要讲清楚权益，而不是只放一个订阅按钮。
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                这里的核心目标是让用户迅速理解：免费能看什么，付费能解锁什么，这类内容是否真的适合自己的日常阅读节奏。当前订阅能力仍在持续完善，所以页面会优先提供清晰说明和试读入口。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  试读今日前瞻
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/reports" className="new-home-secondary-btn">
                  查看历史简报
                </Link>
              </div>

              <div className="mt-6 new-home-cta-note">
                <CircleAlert className="h-4 w-4 text-amber-600" />
                订阅与支付流程正在继续完善，当前以登录试读和内容预览为主。
              </div>
            </div>

            <div className="new-home-terminal-card">
              <p className="new-home-panel-kicker">Who it fits</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                更适合这些使用场景
              </h2>
              <div className="mt-6 grid gap-3">
                {scenarios.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="new-home-pulse-card">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-2xl bg-slate-950/5 p-3 text-slate-800">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Plans</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                当前阶段先把方案讲清楚，再逐步完善开通流程。
              </h2>
            </div>
            <p className="new-home-section-copy">
              站点定位是面向海外华人的美股与国际金融中文前瞻产品，所以会员权益应该围绕“缩短阅读时间”和“提高盘前判断效率”来表达。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {planCards.map((plan) => (
              <article
                key={plan.title}
                className={`new-home-service-card !rounded-[32px] !p-8 ${
                  plan.featured
                    ? 'border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.92))]'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{plan.title}</p>
                    <h3 className="mt-3 text-3xl font-semibold text-slate-950">{plan.price}</h3>
                  </div>
                  {plan.featured ? (
                    <span className="new-report-level-chip new-report-level-watch">当前主方案</span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>
                <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-cta-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="new-home-kicker">Access next step</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  先进入今日简报，看看这套阅读结构是否适合你。
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  如果你每天都需要在开盘前快速整理美股与国际金融信息，这个产品更像一份固定研究输入，而不是一个随机刷新闻的网站。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {isSignedIn ? (
                  <Link href="/reports/latest" className="new-home-primary-btn">
                    查看今日前瞻
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : skipClerk ? (
                  <Link href="/sign-in?redirect_url=/reports/latest" className="new-home-primary-btn">
                    登录试读
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl="/reports/latest">
                    <button type="button" className="new-home-primary-btn">
                      登录试读
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </SignInButton>
                )}

                <Link href="/" className="new-home-ghost-btn">
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
