'use client'

import { useEffect, useState } from 'react'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { formatApiErrorForUser } from '@/lib/api-error-ui'
import { withTokenRetry } from '@/lib/session-token'
import { NewReportDetailView, type NewReportData } from '@/app/components/NewReportDetailView'

type LatestSummaryBundle = {
  report?: {
    report_date?: string
  } | null
  overview_teaser?: string
  alerts?: NewReportData['alerts']
  news_briefs?: NewReportData['news_briefs']
}

export default function ReportsV2LatestPage() {
  const { isLoaded, isSignedIn, getToken } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<NewReportData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isLoaded) return
      setLoading(true)
      setErrorMessage('')
      try {
        const latest = await withTokenRetry(getToken, (token) => reportsApi.latestSummaryBundle(token))
        const latestBundle = latest as LatestSummaryBundle & { report?: Record<string, unknown> | null }
        const reportDate = latestBundle?.report?.report_date
        if (!reportDate || !latestBundle.report) {
          throw new Error('暂未找到最新研报')
        }

        if (!isSignedIn) {
          if (!cancelled) {
            setData({
              report: latestBundle.report as NewReportData['report'],
              overview: latestBundle.overview_teaser
                ? { content: latestBundle.overview_teaser }
                : null,
              alerts: latestBundle.alerts ?? [],
              news_briefs: latestBundle.news_briefs ?? [],
              market_snapshots: [],
              options: null,
              topic_comparisons: [],
              sentiment: null,
            })
          }
          return
        }

        const detail = await withTokenRetry(getToken, (token) => reportsApi.getByDate(reportDate, token))
        if (!cancelled) {
          setData(detail as NewReportData)
        }
      } catch (error) {
        if (!cancelled) {
          setData(null)
          setErrorMessage(formatApiErrorForUser(error, '加载今日研报失败'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn])

  return (
    <NewReportDetailView
      data={data}
      loading={loading}
      errorMessage={errorMessage}
      backHref="/reports"
      backLabel="返回历史简报"
      oppositeHref="/subscribe"
      oppositeLabel="查看会员权益"
    />
  )
}
