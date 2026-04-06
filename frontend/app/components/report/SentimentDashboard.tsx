'use client'

interface SentimentData {
  score: number
  level: string
  label?: string
  description?: string
  signal_count?: number
  red_count?: number
  yellow_count?: number
  confirmed_count?: number
  topic_count?: number
}

const levelToClass: Record<string, string> = {
  calm: 's-calm score-calm',
  watch: 's-watch score-watch',
  alert: 's-alert score-alert',
  danger: 's-danger score-danger',
}

export function SentimentDashboard({ data }: { data: SentimentData }) {
  const level = (data.level || 'calm').toLowerCase()
  const labelClass = levelToClass[level]?.split(' ')[0] || 's-calm'
  const scoreClass = levelToClass[level]?.split(' ')[1] || 'score-calm'
  const needlePercent = Math.min(100, Math.max(0, data.score ?? 0))

  return (
    <section id="sentiment" className="sentiment-dashboard scroll-mt-28 xl:scroll-mt-20">
      <div className="sentiment-top">
        <div className="sentiment-left">
          <div className="sentiment-title">市场风险温度</div>
          <div className="sentiment-desc">{data.description ?? '先看今天的风险温度落在哪个区间，再决定后面的阅读和验证重点。'}</div>
        </div>
        <div className="sentiment-right">
          <div className={`sentiment-score ${scoreClass}`}>
            {data.score?.toFixed(1) ?? '-'}
          </div>
          <span className={`sentiment-label ${labelClass}`}>
            {data.label ?? data.level ?? '-'}
          </span>
        </div>
      </div>

      {(data.signal_count != null || data.red_count != null || data.yellow_count != null || data.topic_count != null || data.confirmed_count != null) && (
        <div className="stats-pills">
          {data.signal_count != null && (
            <div className="stat-pill"><strong>{data.signal_count}</strong> 条信号</div>
          )}
          {data.red_count != null && data.red_count > 0 && (
            <div className="stat-pill red-pill"><strong>{data.red_count}</strong> 红色</div>
          )}
          {data.yellow_count != null && data.yellow_count > 0 && (
            <div className="stat-pill orange-pill"><strong>{data.yellow_count}</strong> 黄色</div>
          )}
          {data.topic_count != null && (
            <div className="stat-pill"><strong>{data.topic_count}</strong> 个主题</div>
          )}
          {data.confirmed_count != null && (
            <div className="stat-pill"><strong>{data.confirmed_count}</strong> 多源确认</div>
          )}
        </div>
      )}

      <div className="gauge-wrap">
        <div className="gauge-track">
          <div className="gauge-needle" style={{ left: `${needlePercent}%` }} />
        </div>
        <div className="gauge-ticks">
          <span>0 平静</span>
          <span>35</span>
          <span>50</span>
          <span>65</span>
          <span>100 警戒</span>
        </div>
      </div>
    </section>
  )
}
