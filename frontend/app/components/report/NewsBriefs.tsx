'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BriefItem {
  topic_name?: string
  body?: string
  impact?: string
  source_count?: number
  sources?: Array<{ url: string; title: string }>
}

function buildValidationHint(item: BriefItem) {
  const raw = [item.topic_name, item.body, item.impact].filter(Boolean).join(' ').toLowerCase()

  if (/(fomc|fed|联储|利率|美债|收益率|cpi|通胀|非农|就业)/i.test(raw)) {
    return '先看美债收益率、纳指期货和美元是否同时给出反馈。'
  }
  if (/(美元|汇率|dollar|fx)/i.test(raw)) {
    return '先盯美元方向，再确认黄金和风险资产有没有反向变化。'
  }
  if (/(oil|原油|油价|地缘|战争|中东)/i.test(raw)) {
    return '先看油价与避险资产是否共振，而不是只看 headline。'
  }
  if (/(earnings|财报|指引|guidance)/i.test(raw)) {
    return '先确认盘前指引，再看同板块龙头是否一起被重定价。'
  }
  if (/(科技|ai|半导体|芯片|software|cloud)/i.test(raw)) {
    return '先盯科技龙头和主题 ETF，确认热度是否真正扩散。'
  }

  return '先看利率、美元和龙头股是否给出一致验证。'
}

function shortText(text?: string | null, max = 72) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}…`
}

export function NewsBriefs({ items }: { items: BriefItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const activeItem = items[activeIndex] ?? items[0]
  const total = items.length

  const goPrev = () => setActiveIndex((current) => (current === 0 ? total - 1 : current - 1))
  const goNext = () => setActiveIndex((current) => (current === total - 1 ? 0 : current + 1))

  return (
    <section id="briefs" className="scroll-mt-28 xl:scroll-mt-20">
      <div className="new-home-cta-panel !rounded-[40px] border-stone-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,242,0.94))]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="new-home-kicker">Translation stage</p>
            <h2 className="mt-3 text-[2.15rem] font-semibold tracking-[-0.025em] text-slate-950 sm:text-[2.75rem]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              这几条新闻，真正该怎么看
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-8 text-slate-500">
            这里不是把消息按栏目排开，而是把 headline 翻译成更有用的市场观点。当天展示的类目来自摘要数据里的 `topic_name`，会跟着主线变化。
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {items.map((item, index) => (
              <button
                key={`${item.topic_name || 'brief'}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  activeIndex === index
                    ? 'border-slate-900 bg-slate-950 text-white shadow-[0_28px_52px_-36px_rgba(15,23,42,0.52)]'
                    : 'border-stone-200/80 bg-white/82 text-slate-900 hover:border-stone-300 hover:bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${activeIndex === index ? 'text-amber-200/90' : 'text-slate-400'}`}>
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  {item.source_count != null ? (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${activeIndex === index ? 'bg-white/10 text-amber-100' : 'border border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {item.source_count} 条
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-6">{item.topic_name ?? '新闻翻译'}</h3>
                <p className={`mt-3 text-sm leading-7 ${activeIndex === index ? 'text-slate-300' : 'text-slate-500'}`}>
                  {shortText(item.impact || item.body, 72) || '查看这条消息的市场翻译与验证重点。'}
                </p>
              </button>
            ))}
          </aside>

          {activeItem ? (
            <article className="rounded-[36px] border border-stone-200/80 bg-white/96 px-5 py-5 shadow-[0_34px_60px_-40px_rgba(15,23,42,0.22)] sm:px-7 sm:py-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Research card</p>
                  <h3 className="mt-2 text-[1.9rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.35rem]">{activeItem.topic_name ?? '观点翻译'}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {activeItem.source_count != null ? (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {activeItem.source_count} 条来源
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={goPrev}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    aria-label="Previous brief"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    aria-label="Next brief"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 rounded-[30px] border border-slate-900/8 bg-slate-950 px-5 py-5 text-white sm:px-6 sm:py-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/90">市场真正交易什么</p>
                <p className="mt-3 text-[15px] leading-8 text-slate-100 sm:text-base sm:leading-9">
                  {activeItem.impact || '这条消息真正重要的地方，在于它是否改变了资金对利率、美元或板块预期的判断。'}
                </p>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                <div className="rounded-[26px] border border-stone-200/80 bg-stone-50/92 px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">发生了什么</p>
                  <p className="mt-3 text-sm leading-8 text-slate-700">
                    {activeItem.body || '原始新闻背景暂未补充。'}
                  </p>
                </div>

                <div className="rounded-[26px] border border-sky-200/70 bg-sky-50/55 px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">今天先验证</p>
                  <p className="mt-3 text-sm leading-8 text-slate-600">
                    {buildValidationHint(activeItem)}
                  </p>
                </div>
              </div>

              {activeItem.sources && activeItem.sources.length > 0 ? (
                <div className="mt-5 rounded-[24px] border border-stone-200/70 bg-stone-50/75 px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">原始来源</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeItem.sources.map((source, sourceIndex) => (
                      <a
                        key={`${source.url}-${sourceIndex}`}
                        className="brief-src-link"
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.title || source.url}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-center gap-2">
                {items.map((item, index) => (
                  <button
                    key={`${item.topic_name || 'dot'}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full transition ${activeIndex === index ? 'w-8 bg-slate-900' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
                    aria-label={`Go to brief ${index + 1}`}
                  />
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  )
}
