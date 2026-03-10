'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { reportsApi, isNetworkError, API_URL } from '@/lib/api'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, TrendingUp, AlertCircle } from 'lucide-react'

interface CalendarData {
  year: number
  month: number
  dates: string[]
}

function ReportsCalendarContent({ getToken }: { getToken: () => Promise<string | null> }) {
  const [calendar, setCalendar] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [current, setCurrent] = useState(() => new Date())

  useEffect(() => {
    loadCalendar()
  }, [current.getFullYear(), current.getMonth()])

  const loadCalendar = async () => {
    try {
      const token = await getToken()
      const data = await reportsApi.getCalendar(current.getFullYear(), current.getMonth() + 1, token)
      setCalendar(data)
      setMessage('')
    } catch (error: unknown) {
      console.error('加载日历失败:', error)
      if (isNetworkError(error)) {
        setMessage(`无法连接后端服务。请确认：1) 后端已启动（uvicorn main:app --reload --port 8000）；2) 当前 API 地址：${API_URL}。若用局域网 IP 访问本页，请在 .env.local 设置 NEXT_PUBLIC_API_URL=http://你的电脑IP:8000 并重启前端。`)
      }
      setCalendar(null)
    } finally {
      setLoading(false)
    }
  }

  const hasReport = (d: Date) => {
    if (!calendar?.dates) return false
    const str = format(d, 'yyyy-MM-dd')
    return calendar.dates.includes(str)
  }

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfWeek = monthStart.getDay()
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1B' }}>
        <div className="text-[#999]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#1A1A1B' }}>
      <nav className="border-b border-[#3A3A3A] bg-[#1A1A1B]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-[#C19A6B]" />
              <span className="text-lg font-bold text-[#E5E5E5]">mentat vision</span>
            </Link>
            <Link href="/" className="text-[#999] hover:text-[#E5E5E5]">首页</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#E5E5E5] mb-2">报告日历</h1>
        <p className="text-[#999] mb-6">点击有报告的日期查看当日日报</p>

        {message && (
          <div className="mb-6 p-4 bg-[#8B2E2E]/20 border border-[#8B2E2E] rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF4444] shrink-0 mt-0.5" />
            <p className="text-[#ff6b6b] text-sm">{message}</p>
          </div>
        )}

        <div className="bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrent(subMonths(current, 1))}
              className="p-2 rounded hover:bg-[#C19A6B]/20 text-[#C19A6B] transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-[#E5E5E5]">
              {format(current, 'yyyy 年 M 月', { locale: zhCN })}
            </h2>
            <button
              onClick={() => setCurrent(addMonths(current, 1))}
              className="p-2 rounded hover:bg-[#C19A6B]/20 text-[#C19A6B] transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="text-xs text-[#999] py-2 font-medium">
                {d}
              </div>
            ))}
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {days.map((d) => {
              const has = hasReport(d)
              const dateStr = format(d, 'yyyy-MM-dd')
              return (
                <div key={dateStr} className="aspect-square flex items-center justify-center">
                  {has ? (
                    <Link
                      href={`/reports/${dateStr}`}
                      className="w-full h-full flex items-center justify-center rounded bg-[#C19A6B]/30 text-[#C19A6B] font-medium hover:bg-[#C19A6B]/50 transition"
                    >
                      {d.getDate()}
                    </Link>
                  ) : (
                    <span className="w-full h-full flex items-center justify-center rounded text-[#666] text-sm">
                      {d.getDate()}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {calendar?.dates && calendar.dates.length === 0 && (
          <div className="mt-6 text-center text-[#999] text-sm">
            该月暂无报告
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return <ReportsCalendarContent getToken={async () => null} />
}
