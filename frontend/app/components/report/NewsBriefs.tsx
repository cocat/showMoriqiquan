'use client'

import { useState } from 'react'

interface BriefItem {
  topic_name?: string
  body?: string
  impact?: string
  source_count?: number
  sources?: Array<{ url: string; title: string }>
}

export function NewsBriefs({ items }: { items: BriefItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const [showSources, setShowSources] = useState<Record<number, boolean>>({})

  return (
    <section id="briefs" className="scroll-mt-28 xl:scroll-mt-20">
      <div className="report-card">
        <div className="report-card-header gold">新闻简报</div>
        <div style={{ padding: '14px 16px 10px' }}>
          {items.map((item, i) => {
            const isOpen = openIdx === i
            const sources = item.sources ?? []
            const hasImpact = !!item.impact

            return (
              <div key={i} className="brief-card">
                <div
                  className="brief-header"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <div className="brief-header-left">
                    <span className="brief-topic">{item.topic_name ?? '简报'}</span>
                    {item.source_count != null && (
                      <span className="brief-count">{item.source_count} 条</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: 'var(--muted)',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isOpen ? '▼' : '▶'}
                  </span>
                </div>
                {isOpen && (
                  <div>
                    {item.body && <div className="brief-body">{item.body}</div>}
                    {hasImpact && <div className="brief-impact">{item.impact}</div>}
                    {sources.length > 0 && (
                      <>
                        <div
                          className="brief-src-toggle"
                          style={{ padding: '8px 18px', background: 'var(--ghost)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}
                          onClick={() => setShowSources((s) => ({ ...s, [i]: !s[i] }))}
                        >
                          {showSources[i] ? '▼ 收起来源' : `▶ 原始来源（${sources.length} 条）`}
                        </div>
                        {showSources[i] && (
                          <div className="brief-sources">
                            {sources.map((s, j) => (
                              <a
                                key={j}
                                className="brief-src-link"
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {s.title || s.url}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
