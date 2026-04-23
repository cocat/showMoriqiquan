'use client'

import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { ArrowRight, Check } from 'lucide-react'
import { useAppAuth } from '@/app/providers'

const freePoints = [
  '今天最重要的观点',
  '一句话理由',
  '本周重点预览',
]

const memberPoints = [
  '观点为什么成立',
  '完整新闻翻译台',
  '盘前验证清单',
  '历史判断回看',
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
                订阅的不是更多内容，而是更完整的市场观点。
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                免费先告诉你今天最重要的是什么。会员再告诉你为什么是这个观点、该看哪里验证，以及这条观点后续有没有继续成立。
              </p>
            </div>

            <aside className="new-home-cta-panel !rounded-[34px]">
              <p className="new-home-panel-kicker">What changes after subscribing</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                不是看更多，而是判断更完整。
              </h2>
              <p className="mt-4 text-sm leading-8 text-slate-700">
                如果你不想每天在 headline 里来回筛选，会员内容会更适合你。
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="new-home-service-card !rounded-[32px] !p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">免费先看到</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">今天最重要的观点</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                适合先快速判断今天值不值得继续看下去。
              </p>
              <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5">
                {freePoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="new-home-service-card !rounded-[32px] !p-8 border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,242,255,0.92))]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">会员再多看到</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">为什么成立，以及后面会怎样</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                真正的会员价值在于补上解释、验证和连续跟踪，而不是单纯看到更多段落。
              </p>
              <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5">
                {memberPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-cta-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="new-home-kicker">Try it first</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                  先试读今日观点，再决定要不要订阅。
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  先确认这套观点风格是否真的能帮你节省时间、减少误读，再做决定。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {isSignedIn ? (
                  <Link href="/reports/latest" className="new-home-primary-btn">
                    直接进入今日观点
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : skipClerk ? (
                  <Link href="/sign-in?redirect_url=/reports/latest" className="new-home-primary-btn">
                    登录后先试读
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl="/reports/latest">
                    <button type="button" className="new-home-primary-btn">
                      登录后先试读
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </SignInButton>
                )}

                <Link href="/" className="new-home-ghost-btn">
                  先回首页看看
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
