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

function getScoreLevel(score?: number): 'high' | 'mid' | 'low' {
  if (score == null) return 'low'
  if (score >= 65) return 'high'
  if (score >= 35) return 'mid'
  return 'low'
}

export function TopicComparison({ items }: { items: TopicItem[] }) {
  return (
    <section id="topics" className="scroll-mt-28 xl:scroll-mt-20">
      <div className="report-card">
        <div className="report-card-header blue">热点主题</div>
        <div className="tpc-grid">
          {items.map((item, i) => {
            const level = getScoreLevel(item.score)
            const delta = item.delta ?? 0
            const deltaClass = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'

            return (
              <div key={i} className={`tpc-card score-${level}`}>
                <div className="tpc-name" title={item.topic_name}>
                  {item.topic_name ?? '-'}
                </div>
                <div className="tpc-main">
                  <div className="tpc-score-box">
                    <div className="tpc-score">{item.score ?? '-'}</div>
                  </div>
                  <div className="tpc-counts">
                    <div className="tpc-count-row">
                      <span className="tpc-count today">{item.today_count ?? 0}</span>
                      <span className="tpc-count-label">今</span>
                    </div>
                    <div className="tpc-count-row">
                      <span className="tpc-count yesterday">{item.yesterday_count ?? 0}</span>
                      <span className="tpc-count-label">昨</span>
                    </div>
                  </div>
                </div>
                <div className="tpc-bottom">
                  <span className={`tpc-delta ${deltaClass}`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
