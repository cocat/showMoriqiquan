'use client'

import { useEffect, useState } from 'react'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { formatApiErrorForUser } from '@/lib/api-error-ui'
import { withTokenRetry } from '@/lib/session-token'
import { NewReportDetailView, type NewReportData } from '@/app/components/NewReportDetailView'

interface LatestSummaryBundle {
  report?: {
    report_date?: string
  }
}

export default function ReportsV2LatestPage() {
  const { getToken } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<NewReportData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage('')
      try {
        const latest = await withTokenRetry(getToken, (token) => reportsApi.latestSummaryBundle(token))
        const date = (latest as LatestSummaryBundle)?.report?.report_date
        if (!date) throw new Error('最新报告日期不存在')
        const detail = await withTokenRetry(getToken, (token) => reportsApi.getByDate(date, token))
        if (!cancelled) setData(detail as NewReportData)
      } catch (error) {
        if (!cancelled) setErrorMessage(formatApiErrorForUser(error, '加载简报失败'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [getToken])

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
