'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAppAuth } from '@/app/providers'
import { reportsApi } from '@/lib/api'
import { formatApiErrorForUser } from '@/lib/api-error-ui'
import { withTokenRetry } from '@/lib/session-token'
import { NewReportDetailView, type NewReportData } from '@/app/components/NewReportDetailView'

function useAdjacentDates(
  date: string,
  getToken: (opts?: { skipCache?: boolean }) => Promise<string | null>,
) {
  const [prev, setPrev] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return
    let cancelled = false

    async function load() {
      try {
        const [year, month] = date.split('-').map(Number)
        const current = await withTokenRetry(getToken, (token) => reportsApi.getCalendar(year, month, token))
        if (cancelled) return
        const dates = current?.dates ?? []
        const idx = dates.indexOf(date)

        let prevDate: string | null = idx > 0 ? dates[idx - 1] : null
        let nextDate: string | null = idx >= 0 && idx < dates.length - 1 ? dates[idx + 1] : null

        if (!prevDate) {
          const prevMonth = month === 1 ? 12 : month - 1
          const prevYear = month === 1 ? year - 1 : year
          const prevData = await withTokenRetry(getToken, (token) => reportsApi.getCalendar(prevYear, prevMonth, token))
          const prevDates = prevData?.dates ?? []
          prevDate = prevDates[prevDates.length - 1] ?? null
        }

        if (!nextDate) {
          const nextMonth = month === 12 ? 1 : month + 1
          const nextYear = month === 12 ? year + 1 : year
          const nextData = await withTokenRetry(getToken, (token) => reportsApi.getCalendar(nextYear, nextMonth, token))
          nextDate = nextData?.dates?.[0] ?? null
        }

        if (!cancelled) {
          setPrev(prevDate)
          setNext(nextDate)
        }
      } catch {
        if (!cancelled) {
          setPrev(null)
          setNext(null)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [date, getToken])

  return { prev, next }
}

export default function ReportsV2DatePage() {
  const params = useParams()
  const date = params.date as string
  const { getToken } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<NewReportData | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const { prev, next } = useAdjacentDates(date, getToken)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage('')
      try {
        const detail = await withTokenRetry(getToken, (token) => reportsApi.getByDate(date, token))
        if (!cancelled) setData(detail as NewReportData)
      } catch (error) {
        if (!cancelled) setErrorMessage(formatApiErrorForUser(error, '加载报告失败'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [date, getToken])

  return (
    <NewReportDetailView
      data={data}
      loading={loading}
      errorMessage={errorMessage}
      backHref="/reports"
      backLabel="返回历史简报"
      oppositeHref="/subscribe"
      oppositeLabel="查看会员权益"
      prevHref={prev ? `/reports/${prev}` : null}
      nextHref={next ? `/reports/${next}` : null}
    />
  )
}
