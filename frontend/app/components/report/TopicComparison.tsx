'use client'

interface TopicItem {
  topic_name?: string
  topic_id?: string
  score?: number
  today_count?: number
  yesterday_count?: number
  delta?: number
  level?: string
}

function scoreTone(score?: number) {
  if (score == null) return 'border-slate-200 bg-slate-50 text-slate-700'
  if (score >= 65) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (score >= 35) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

export function TopicComparison({ items, compact = false }: { items: TopicItem[]; compact?: boolean }) {
  return (
    <section id="topics" className="scroll-mt-28 xl:scroll-mt-20">
      <div className={`new-home-cta-panel ${compact ? '!rounded-[28px] !p-5' : '!rounded-[32px]'}`}>
        <div className={`flex flex-wrap items-end justify-between gap-4 ${compact ? '' : ''}`}>
          <div>
            <p className="new-home-kicker">Topic pulse</p>
            <h2 className={`${compact ? 'mt-2 text-xl' : 'mt-2 text-2xl'} font-semibold text-slate-950`} style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              主题轮动
            </h2>
          </div>
          {!compact ? (
            <p className="max-w-xl text-sm leading-7 text-slate-500">
              这里不是看“新闻多不多”，而是看哪些主题开始升温，哪些只是停留在 headline。
            </p>
          ) : null}
        </div>

        <div className={`${compact ? 'mt-4' : 'mt-6'} grid gap-3 sm:grid-cols-2 xl:grid-cols-1`}>
          {items.map((item, index) => {
            const delta = item.delta ?? 0
            const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`

            return (
              <article
                key={`${item.topic_name || 'topic'}-${index}`}
                className={`${compact ? 'rounded-[22px] px-4 py-4' : 'rounded-[26px] px-5 py-5'} border border-slate-200/80 bg-white/88 shadow-[0_24px_40px_-34px_rgba(15,23,42,0.18)]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Topic</p>
                    <h3 className={`${compact ? 'mt-2 text-sm leading-6' : 'mt-2 text-base leading-7'} font-semibold text-slate-950`}>{item.topic_name ?? '未命名主题'}</h3>
                  </div>
                  <span className={`inline-flex min-w-[64px] items-center justify-center rounded-full border px-3 py-1 text-sm font-semibold ${scoreTone(item.score)}`}>
                    {item.score ?? '--'}
                  </span>
                </div>

                <div className={`${compact ? 'mt-4 gap-2' : 'mt-5 gap-3'} grid grid-cols-3`}>
                  <div className={`${compact ? 'rounded-[16px] px-3 py-2.5' : 'rounded-[18px] px-4 py-3'} bg-slate-50`}>
                    <p className="text-[11px] text-slate-400">今日</p>
                    <p className={`${compact ? 'mt-1.5 text-base' : 'mt-2 text-lg'} font-semibold text-slate-950`}>{item.today_count ?? 0}</p>
                  </div>
                  <div className={`${compact ? 'rounded-[16px] px-3 py-2.5' : 'rounded-[18px] px-4 py-3'} bg-slate-50`}>
                    <p className="text-[11px] text-slate-400">昨日</p>
                    <p className={`${compact ? 'mt-1.5 text-base' : 'mt-2 text-lg'} font-semibold text-slate-950`}>{item.yesterday_count ?? 0}</p>
                  </div>
                  <div className={`${compact ? 'rounded-[16px] px-3 py-2.5' : 'rounded-[18px] px-4 py-3'} bg-slate-50`}>
                    <p className="text-[11px] text-slate-400">变化</p>
                    <p className={`${compact ? 'mt-1.5 text-base' : 'mt-2 text-lg'} font-semibold ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      {deltaLabel}
                    </p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
