'use client'

import { useState } from 'react'

interface AlertItem {
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
}

function alertTone(level: string) {
  return level.toLowerCase() === 'red'
    ? {
        pill: 'bg-rose-100 text-rose-700',
        card: 'border-rose-200 bg-rose-50/70',
      }
    : {
        pill: 'bg-amber-100 text-amber-700',
        card: 'border-amber-200 bg-amber-50/70',
      }
}

export function AlertsList({ items }: { items: AlertItem[] }) {
  const redItems = items.filter((item) => (item.level || '').toLowerCase() === 'red')
  const yellowItems = items.filter((item) => (item.level || '').toLowerCase() === 'yellow')
  const [openId, setOpenId] = useState<number | null>(() => redItems[0]?.id ?? yellowItems[0]?.id ?? null)

  const renderGroup = (groupTitle: string, groupItems: AlertItem[]) => (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
          {groupTitle}
        </span>
        <span className="text-sm text-slate-400">{groupItems.length} 条</span>
      </div>

      <div className="space-y-3">
        {groupItems.map((item) => {
          const tone = alertTone(item.level || '')
          const assetChips = Array.isArray(item.assets)
            ? item.assets.map((asset) => (typeof asset === 'string' ? asset : asset?.name)).filter(Boolean)
            : []
          const isOpen = openId === item.id

          return (
            <article
              key={item.id}
              className={`rounded-[26px] border px-5 py-4 shadow-[0_20px_36px_-34px_rgba(15,23,42,0.16)] ${tone.card}`}
            >
              <button
                type="button"
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                className="w-full text-left"
              >
                <div className="flex items-start gap-4">
                  <div className={`inline-flex min-w-[64px] flex-col items-center rounded-[18px] px-3 py-3 ${tone.pill}`}>
                    <strong className="text-2xl font-light leading-none">{item.score ?? 0}</strong>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em]">风险分</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.topic_name ? (
                        <span className="inline-flex rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-500">
                          {item.topic_name}
                        </span>
                      ) : null}
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {(item.level || '').toLowerCase() === 'red' ? '高优先级风险' : '继续跟踪线索'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-950">
                      {item.zh_title ?? item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.direction_note || item.ai_summary || '点击展开查看这条风险的解释、验证点和相关资产。'}
                    </p>
                  </div>

                  <span className="pt-1 text-sm text-slate-400">{isOpen ? '−' : '+'}</span>
                </div>
              </button>

              {isOpen ? (
                <div className="mt-5 border-t border-white/70 pt-5">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(240px,0.92fr)]">
                    <div className="rounded-[20px] border border-white/80 bg-white/85 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">为什么需要在意</p>
                      <p className="mt-3 text-sm leading-8 text-slate-700">
                        {item.ai_summary || item.direction_note || '这条信号值得继续跟踪，因为它可能改变今天的风险偏好与板块定价。'}
                      </p>
                    </div>

                    <div className="rounded-[20px] border border-slate-200/80 bg-slate-50/85 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">来源与验证</p>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                        {item.source_name ? <p>来源：{item.source_name}</p> : null}
                        {item.published_at ? <p>时间：{new Date(item.published_at).toLocaleString('zh-CN')}</p> : null}
                        {item.direction_note ? <p>{item.direction_note}</p> : null}
                      </div>
                    </div>
                  </div>

                  {assetChips.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {assetChips.map((name, index) => (
                        <span
                          key={`${name}-${index}`}
                          className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {item.link ? (
                    <div className="mt-4">
                      <a
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        查看原始消息
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )

  return (
    <section id="alerts" className="scroll-mt-28 xl:scroll-mt-20">
      <div className="new-home-cta-panel !rounded-[34px] border-stone-200/65 bg-white/58">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="new-home-kicker">Risk watch</p>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.05rem]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              哪些 headline 还没被市场真正交易
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-8 text-slate-500">
            这里不是重复当天消息，而是把还可能继续发酵、值得二次确认的风险单独拎出来。默认只展开最关键的一条，方便快速扫读。
          </p>
        </div>

        {redItems.length > 0 ? renderGroup('先确认的高优先级风险', redItems) : null}
        {yellowItems.length > 0 ? renderGroup('继续跟踪的次级线索', yellowItems) : null}

        {items.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-slate-200/80 bg-white/80 px-5 py-8 text-center text-sm text-slate-500">
            今日暂无需要特别升级的风险点，重点看主题轮动和资产联动。
          </div>
        ) : null}
      </div>
    </section>
  )
}
