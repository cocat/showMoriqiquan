'use client'

import { Fragment } from 'react'

export interface SnapshotItem {
  symbol: string
  name?: string
  group_label?: string
  price?: number
  pct_change?: number
  change?: number
  range_high?: number
  range_low?: number
  direction?: string
  volume?: number
  link?: string
}

function formatPrice(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function MarketSnapshot({ items }: { items: SnapshotItem[] }) {
  const groups = items.reduce<Record<string, SnapshotItem[]>>((acc, item) => {
    const key = item.group_label || ''
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
    if (a === '') return 1
    if (b === '') return -1
    return a.localeCompare(b)
  })

  return (
    <section id="market" className="scroll-mt-28 xl:scroll-mt-20">
      <div className="new-home-cta-panel !rounded-[34px] border-stone-200/65 bg-white/58">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="new-home-kicker">Market validation</p>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[2.05rem]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              盘前市场快照
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-8 text-slate-500">
            这一层不是再看更多新闻，而是用资产价格确认我们的解释有没有被市场认真交易。重点看利率、美元、指数和关键板块是否同向。
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {sortedGroups.map(([groupLabel, groupItems]) => (
            <Fragment key={groupLabel || 'default'}>
              {groupLabel ? (
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{groupLabel}</p>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {groupItems.map((row, index) => {
                  const pct = row.pct_change ?? 0
                  const directionClass = pct > 0 ? 'border-emerald-200 bg-emerald-50/38' : pct < 0 ? 'border-rose-200 bg-rose-50/38' : 'border-stone-200 bg-stone-50/72'
                  const pctClass = pct > 0 ? 'text-emerald-600' : pct < 0 ? 'text-rose-600' : 'text-slate-500'
                  const Card = row.link ? 'a' : 'div'
                  const cardProps = row.link ? { href: row.link, target: '_blank', rel: 'noopener noreferrer' } : {}

                  return (
                    <Card
                      key={`${row.symbol}-${index}`}
                      className={`rounded-[24px] border px-4 py-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 ${directionClass}`}
                      {...cardProps}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{row.symbol}</p>
                          <h3 className="mt-2 text-sm font-semibold leading-6 text-slate-950">{row.name ?? row.symbol}</h3>
                        </div>
                        <span className={`text-sm font-semibold ${pctClass}`}>
                          {row.pct_change != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%` : '-'}
                        </span>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <strong className="text-2xl font-light text-slate-950">{row.price != null ? formatPrice(row.price) : '-'}</strong>
                        {row.change != null ? (
                          <span className="text-xs text-slate-500">
                            {row.change > 0 ? '+' : ''}{row.change}
                          </span>
                        ) : null}
                      </div>

                      {row.range_high != null && row.range_low != null ? (
                        <p className="mt-4 text-[11px] leading-6 text-slate-400">
                          振幅 {row.range_high.toFixed(2)} ↔ {row.range_low.toFixed(2)}
                        </p>
                      ) : null}
                    </Card>
                  )
                })}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
