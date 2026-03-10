'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { reportsApi } from '@/lib/api'

const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { navIds } from '@/lib/design-tokens'
import { SentimentDashboard } from '@/app/components/report/SentimentDashboard'
import { MarketSnapshot, SnapshotItem } from '@/app/components/report/MarketSnapshot'
import { AlertsList } from '@/app/components/report/AlertsList'
import { NewsBriefs } from '@/app/components/report/NewsBriefs'
import { OptionsPanel, type OptionsData } from '@/app/components/report/OptionsPanel'
import { TopicComparison } from '@/app/components/report/TopicComparison'

interface FullReport {
  report: { report_id: string; report_date: string; title: string; generated_at?: string; sentiment_score?: number; sentiment_level?: string; item_count?: number; red_count?: number; yellow_count?: number; message?: string }
  sentiment?: { score: number; level: string; label?: string; description?: string } | null
  market_snapshots?: SnapshotItem[]
  overview?: { content: string } | null
  alerts?: Array<{ id: number; level: string; score?: number; title: string; zh_title?: string; ai_summary?: string; ai_summary_en?: string; source_name?: string; published_at?: string; link?: string; topic_name?: string; direction?: string; direction_note?: string; assets?: string[] | { name?: string }[] }>
  news_briefs?: Array<{ topic_name?: string; body?: string; impact?: string; source_count?: number; sources?: Array<{ url: string; title: string }> }>
  options?: { body_text?: string; candidates?: unknown[] } | null
  topic_comparisons?: Array<{ topic_name?: string; topic_id?: string; score?: number; today_count?: number; yesterday_count?: number; delta?: number; level?: string }>
  message?: string
}

function ReportDetailContent({ getToken }: { getToken: () => Promise<string | null> }) {
  const params = useParams()
  const date = params.date as string
  const [data, setData] = useState<FullReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [date])

  const loadReport = async () => {
    try {
      const token = await getToken()
      const res = await reportsApi.getByDate(date, token)
      setData(res)
    } catch (error) {
      console.error('加载报告失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1B' }}>
        <div className="text-[#999]">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ background: '#1A1A1B' }}>
        <p className="text-[#999]">报告不存在或加载失败</p>
        <Link href="/reports" className="text-[#C19A6B] hover:underline">返回日历</Link>
      </div>
    )
  }

  const { report, sentiment, market_snapshots, overview, alerts, news_briefs, options, topic_comparisons, message } = data

  return (
    <div className="report-detail-page">
      <nav className="report-sticky-nav">
        <Link href="/reports" className="report-nav-item">← 返回</Link>
        <span className="report-nav-sep" />
        {navIds.map(({ id, label }) => (
          <a key={id} href={`#${id}`} className="report-nav-item">
            {label}
          </a>
        ))}
      </nav>

      <div className="report-page-header" id="sec-header">
        <h1>{report.title}</h1>
        <div className="meta">
          <span>{report.report_date}</span>
          {report.generated_at && <span>{new Date(report.generated_at).toLocaleString('zh-CN')}</span>}
          {report.item_count != null && <span>{report.item_count} 条</span>}
          {report.red_count != null && report.red_count > 0 && (
            <span className="text-[#FF4444]">🔴 {report.red_count} 重大</span>
          )}
          {report.yellow_count != null && report.yellow_count > 0 && (
            <span className="text-[#D4A55A]">🟡 {report.yellow_count} 重要</span>
          )}
        </div>
      </div>

        {message && (
          <div className="mb-6 p-4 flex items-start gap-3 rounded border border-[#C19A6B]/30 border-l-4 border-l-[#C19A6B]" style={{ background: 'rgba(193,154,107,0.1)' }}>
            <AlertCircle className="w-5 h-5 text-[#C19A6B] shrink-0 mt-0.5" />
            <p className="text-[#C19A6B] text-sm">{message}</p>
          </div>
        )}

        {sentiment && <SentimentDashboard data={sentiment} />}
        {market_snapshots && market_snapshots.length > 0 && (
          <MarketSnapshot items={market_snapshots as SnapshotItem[]} />
        )}
        {overview?.content && (
          <section id="overview" className="scroll-mt-16">
            <div className="report-card">
              <div className="report-card-header blue">市场综述</div>
              <div className="overview-body">{overview.content}</div>
            </div>
          </section>
        )}
        {alerts && alerts.length > 0 && <AlertsList items={alerts} />}
        {news_briefs && news_briefs.length > 0 && <NewsBriefs items={news_briefs} />}
        {(options?.body_text || (options?.candidates && (options.candidates as unknown[]).length > 0)) && (
          <OptionsPanel data={options as OptionsData} />
        )}
        {topic_comparisons && topic_comparisons.length > 0 && <TopicComparison items={topic_comparisons} />}
    </div>
  )
}

export default function ReportDetailPage() {
  if (skipClerk) {
    return <ReportDetailContent getToken={async () => null} />
  }
  return <ReportDetailWithAuth />
}

function ReportDetailWithAuth() {
  const { getToken } = useAuth()
  return <ReportDetailContent getToken={getToken} />
}
