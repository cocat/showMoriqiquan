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

function formatPrice(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
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
    <section id="market" className="scroll-mt-20">
      <div className="report-card">
        <div className="report-card-header green">实时行情快照</div>
        <div className="snap-grid">
          {sortedGroups.map(([groupLabel, groupItems]) => (
            <Fragment key={groupLabel || 'default'}>
              {groupLabel && (
                <div className="snap-group-label">{groupLabel}</div>
              )}
              {groupItems.map((row, i) => {
                const pct = row.pct_change ?? 0
                const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
                const Card = row.link ? 'a' : 'div'
                const cardProps = row.link
                  ? { href: row.link, target: '_blank', rel: 'noopener noreferrer' }
                  : {}

                return (
                  <Card
                    key={row.symbol + i}
                    className={`snap-card ${direction}`}
                    {...cardProps}
                  >
                    <div className="snap-top">
                      <span className="snap-sym">{row.symbol}</span>
                    </div>
                    <div className="snap-name" title={row.name ?? row.symbol}>
                      {row.name ?? row.symbol}
                    </div>
                    <div className="snap-price-row">
                      <span className="snap-price">
                        {row.price != null ? formatPrice(row.price) : '-'}
                      </span>
                      <span
                        className="snap-pct"
                        style={{ color: pct >= 0 ? 'var(--green)' : '#ff6b6b' }}
                      >
                        {row.pct_change != null
                          ? `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`
                          : '-'}
                      </span>
                    </div>
                    {row.change != null && (
                      <div className="snap-change">
                        {row.change > 0 ? '+' : ''}{row.change}
                      </div>
                    )}
                    {row.range_high != null && row.range_low != null && (
                      <div className="snap-range">
                        振幅　{row.range_high?.toFixed(2)} ↔ {row.range_low?.toFixed(2)}
                      </div>
                    )}
                  </Card>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
