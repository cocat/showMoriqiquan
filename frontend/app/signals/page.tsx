'use client'

import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { ArrowRight, Radar, RefreshCw, TrendingUp } from 'lucide-react'
import { useAppAuth } from '@/app/providers'
import { formatThemeStatus, mockBoardContent } from '@/lib/mock-derived-content'

export default function SignalsPage() {
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
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div>
              <div className="new-home-eyebrow">
                <span className="new-home-dot" />
                Signal board
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
                观点不是发出去就结束了，而是要持续被跟踪。
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
                信号看板不是一篇文章，而是一张持续更新的观点状态图。它帮助用户快速知道当前市场主要在交易什么、哪些逻辑正在强化、哪些逻辑需要重新验证。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/reports/latest" className="new-home-primary-btn">
                  查看今日观点
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/playbook" className="new-home-secondary-btn">
                  打开本周 Playbook
                </Link>
              </div>
            </div>

            <aside className="new-home-cta-panel !rounded-[36px]">
              <p className="new-home-panel-kicker">Board overview</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                当前市场主线总览
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="new-home-pulse-card !p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-500">主线数量</span>
                    <Radar className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-slate-950">{mockBoardContent.themes_json.length}</div>
                </div>
                <div className="new-home-pulse-card !p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-500">整体环境</span>
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-3 text-lg font-semibold text-slate-950">中性偏谨慎</div>
                </div>
                <div className="new-home-pulse-card !p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-500">最近更新</span>
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="mt-3 text-lg font-semibold text-slate-950">{mockBoardContent.updated_at}</div>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/82 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">怎么看这张板</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  先看哪条观点还在强化，再看哪条观点只是噪音升级，最后盯住“下一观察点”来确认市场会不会切换节奏。
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Signal cards</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                当前重点观点
              </h2>
            </div>
            <p className="new-home-section-copy">
              每张卡只回答五件事：观点名称、方向、状态、最近变化、下一观察点。这样用户不是在读长文，而是在快速扫描市场结构。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {mockBoardContent.themes_json.map((item) => (
              <article key={item.id} className="new-home-service-card !rounded-[34px] !p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="new-home-panel-kicker">{item.direction}</p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">{item.name}</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {formatThemeStatus(item.status)}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-8 text-slate-700">{item.summary}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/75 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">下一观察点</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.next_focus}</p>
                  </div>
                  <div className="rounded-[22px] border border-slate-200/80 bg-white/82 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">编辑评语</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.editor_note}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="new-home-section new-home-section-contrast !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
            <div className="rounded-[36px] border border-white/10 bg-white/5 p-7 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Update logic</p>
              <h2 className="mt-3 text-3xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                看板不是每天重写，而是在关键变化时更新状态。
              </h2>
              <div className="mt-6 space-y-3">
                {[
                  '观点强化时，更新方向与状态',
                  '观点震荡时，保留原判断但下调确定性',
                  '观点失效时，明确告诉用户为什么失效',
                ].map((item) => (
                  <div key={item} className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
                    <p className="text-sm leading-7 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="new-home-cta-panel !rounded-[36px] !bg-white/92">
              <p className="new-home-panel-kicker">Timeline</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>
                最近变化时间线
              </h2>
              <div className="mt-6 space-y-4">
                {mockBoardContent.recent_updates.map((item, index) => (
                  <article key={item.title} className={`${index > 0 ? 'border-t border-slate-200/80 pt-4' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.time}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="new-home-section !pt-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="new-home-section-head">
            <div>
              <p className="new-home-kicker">Why it matters</p>
              <h2 className="new-home-section-title" style={{ fontFamily: 'var(--font-display)' }}>
                信号看板的价值，不是更多信息，而是更稳定的连续性。
              </h2>
            </div>
            <p className="new-home-section-copy">
              它和今日信号、周度 Playbook 的区别在于：日报先给今天的观点，周报提前给出预案，看板持续追踪这些观点是否还成立。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                title: '减少重复判断',
                body: '用户不需要每天从零理解市场，只需要先确认哪些旧主线还有效。',
              },
              {
                title: '建立连续性',
                body: '看板把日报和周报串起来，让内容不再是一篇篇孤立文章。',
              },
              {
                title: '形成复访习惯',
                body: '当主线状态持续更新时，用户更容易形成“顺手回来确认一下”的使用习惯。',
              },
            ].map((item) => (
              <article key={item.title} className="new-home-service-card !rounded-[28px] !p-6">
                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-4 text-sm leading-8 text-slate-600">{item.body}</p>
              </article>
            ))}
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
                  先用今日观点进入市场，再用信号看板确认哪些逻辑还在持续。
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  如果你认同这种持续跟踪主线的方式，可以继续打开今日信号页，或者解锁完整会员内容。
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
                  <Link href="/sign-in?redirect_url=/signals" className="new-home-primary-btn">
                    登录试读
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <SignInButton mode="modal" forceRedirectUrl="/signals">
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
