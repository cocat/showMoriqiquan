'use client'

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

export function AlertsList({ items }: { items: AlertItem[] }) {
  const redItems = items.filter((i) => (i.level || '').toLowerCase() === 'red')
  const yellowItems = items.filter((i) => (i.level || '').toLowerCase() === 'yellow')

  const renderAlert = (item: AlertItem) => {
    const isRed = (item.level || '').toLowerCase() === 'red'
    const levelClass = isRed ? 'level-red' : 'level-yellow'
    const badgeClass = isRed ? 'level-red' : 'level-yellow'

    const assetChips = Array.isArray(item.assets)
      ? item.assets.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
      : []

    return (
      <div key={item.id} className={`alert-item ${levelClass}`}>
        <div className="alert-top">
          <div className={`score-badge ${badgeClass}`}>
            <span className="score-num">{item.score ?? 0}</span>
            <span className="score-sub">分</span>
          </div>
          <div className="alert-main">
            <div className="alert-title">
              {item.topic_name && (
                <span className="alert-topic-tag">{item.topic_name}</span>
              )}
              {item.zh_title ?? item.title}
            </div>
          </div>
        </div>

        {item.zh_title && item.zh_title !== item.title && (
          <div className="zh-trans">{item.zh_title}</div>
        )}

        <div className="alert-meta">
          {item.source_name && <span>{item.source_name}</span>}
          {item.published_at && <span>{new Date(item.published_at).toLocaleString('zh-CN')}</span>}
        </div>

        {item.ai_summary && (
          <div className="ai-box">
            <div className="ai-box-label">AI 深度解读</div>
            <div className="summary-text">{item.ai_summary}</div>
            {item.ai_summary_en && (
              <div className="en-text" style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginTop: 8, padding: '8px 12px', background: 'var(--ghost)', borderLeft: '3px solid var(--border)', lineHeight: 1.55 }}>
                {item.ai_summary_en}
              </div>
            )}
            {assetChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>相关标的</span>
                {assetChips.map((name, j) => (
                  <span key={j} className="asset-chip" style={{ padding: '3px 8px', borderRadius: 2, fontSize: 11, fontWeight: 600, background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid var(--blue)' }}>
                    {name}
                  </span>
                ))}
              </div>
            )}
            {item.direction && (
              <div
                className={`dir-bar ${item.direction === 'bullish' ? 'bullish' : item.direction === 'bearish' ? 'bearish' : 'neutral'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  background: item.direction === 'bullish' ? 'var(--green-light)' : item.direction === 'bearish' ? 'var(--burgundy-dim)' : 'var(--ghost)',
                  color: item.direction === 'bullish' ? 'var(--green)' : item.direction === 'bearish' ? '#ff6b6b' : 'var(--muted)',
                  border: '1px solid',
                  borderColor: item.direction === 'bullish' ? 'var(--green-border)' : item.direction === 'bearish' ? 'var(--burgundy-light)' : 'var(--border)',
                  borderLeft: '3px solid',
                  borderLeftColor: item.direction === 'bullish' ? 'var(--green)' : item.direction === 'bearish' ? 'var(--burgundy)' : 'var(--border)',
                }}
              >
                <span style={{ padding: '3px 8px', borderRadius: 2, fontSize: 10, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
                  {item.direction === 'bullish' ? '利多' : item.direction === 'bearish' ? '利空' : '中性'}
                </span>
                {item.direction_note && <span>{item.direction_note}</span>}
              </div>
            )}
          </div>
        )}

        <div className="alert-footer">
          {item.link && (
            <a className="alert-link primary" href={item.link} target="_blank" rel="noopener noreferrer">
              原文链接
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <section id="alerts" className="scroll-mt-28 xl:scroll-mt-20">
      <div className="report-card">
        {redItems.length > 0 && (
          <>
            <div className="alerts-section-header red-hdr" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', background: 'var(--burgundy-dim)', color: '#ff6b6b', borderBottom: '1px solid var(--border)', borderLeft: '4px solid var(--burgundy)' }}>
              重大预警
              <span className="section-count">{redItems.length} 条</span>
            </div>
            <div className="alerts-body-inner" style={{ padding: '10px 14px' }}>
              {redItems.map(renderAlert)}
            </div>
          </>
        )}
        {yellowItems.length > 0 && (
          <>
            <div className="alerts-section-header yellow-hdr" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', background: 'var(--orange-light)', color: 'var(--gold)', borderBottom: '1px solid var(--border)', borderLeft: '4px solid var(--gold)' }}>
              重要提示
              <span className="section-count">{yellowItems.length} 条</span>
            </div>
            <div className="alerts-body-inner" style={{ padding: '10px 14px' }}>
              {yellowItems.map(renderAlert)}
            </div>
          </>
        )}
        {items.length === 0 && (
          <>
            <div
              className="alerts-section-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                background: 'var(--ghost)',
                color: 'var(--muted)',
                borderBottom: '1px solid var(--border)',
                borderLeft: '4px solid var(--border)',
              }}
            >
              核心预警
              <span className="section-count">0 条</span>
            </div>
            <div
              className="empty-alerts"
              style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--faint)', fontSize: 14 }}
            >
              今日暂无预警，市场相对平静
            </div>
          </>
        )}
      </div>
    </section>
  )
}
