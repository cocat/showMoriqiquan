'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usersApi, isNetworkError } from '@/lib/api'
import { TrendingUp, User as UserIcon, Crown, Calendar } from 'lucide-react'

/** 与 Clerk useUser().user 兼容：firstName 允许 null */
interface DashboardUserProps {
  user: {
    firstName?: string | null
    emailAddresses?: { emailAddress: string }[]
  } | null | undefined
  getToken: () => Promise<string | null>
}

interface UserStats {
  tier: string
  daily_query_count: number
  subscription_end?: string
  is_active: boolean
}

function DashboardContent({ user, getToken }: DashboardUserProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = await getToken()
      const data = await usersApi.stats(token)
      setStats(data)
    } catch (error: unknown) {
      console.error('加载用户统计失败:', error)
      const msg = (error as Error)?.message ?? ''
      if (msg.includes('401')) {
        setStats({ tier: 'observer', daily_query_count: 0, is_active: true })
        setApiError('请重新登录以同步账户信息')
      } else if (isNetworkError(error)) {
        setStats({ tier: 'observer', daily_query_count: 0, is_active: true })
        setApiError('无法连接后端，请先启动 API')
      }
    } finally {
      setLoading(false)
    }
  }

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'observer': return { name: '观察者', color: 'text-[#5A9FD4]', bg: 'bg-[#5A9FD4]/20' }
      case 'tracker': return { name: '追踪者', color: 'text-[#9B8DC4]', bg: 'bg-[#9B8DC4]/20' }
      case 'admin': return { name: '管理员', color: 'text-[#FF4444]', bg: 'bg-[#FF4444]/20' }
      default: return { name: '访客', color: 'text-[#999]', bg: 'bg-[#3A3A3A]' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1A1B' }}>
        <div className="text-[#999]">加载中...</div>
      </div>
    )
  }

  const tierInfo = stats ? getTierInfo(stats.tier) : getTierInfo('guest')

  return (
    <div className="min-h-screen" style={{ background: '#1A1A1B' }}>
      <nav className="border-b border-[#3A3A3A] bg-[#1A1A1B]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-[#C19A6B]" />
              <span className="text-lg font-bold text-[#E5E5E5]">mentat vision</span>
            </Link>
            <Link href="/reports" className="text-[#999] hover:text-[#E5E5E5]">查看报告</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#E5E5E5] mb-8">个人中心</h1>

        {apiError && (
          <div className="mb-6 p-4 bg-[#C19A6B]/10 border border-[#C19A6B]/30 rounded-lg text-[#C19A6B]">
            {apiError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-[#C19A6B]/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-[#C19A6B]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#E5E5E5]">
                  {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? '用户'}
                </h2>
                <p className="text-[#999] text-sm">{user?.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#222] rounded-lg">
                <span className="text-[#999]">用户等级</span>
                <span className={`px-3 py-1 ${tierInfo.bg} ${tierInfo.color} rounded-full text-sm font-medium flex items-center gap-1`}>
                  <Crown className="w-4 h-4" />
                  {tierInfo.name}
                </span>
              </div>
              {stats?.subscription_end && (
                <div className="flex items-center justify-between p-3 bg-[#222] rounded-lg">
                  <span className="text-[#999]">订阅到期</span>
                  <span className="text-[#E5E5E5] flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(stats.subscription_end).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-[#222] rounded-lg">
                <span className="text-[#999]">今日查询</span>
                <span className="text-[#E5E5E5] font-medium">{stats?.daily_query_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[#E5E5E5] mb-4">当前权益</h3>
            {stats?.tier === 'observer' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-[#4CAF50]">✓</span>
                  <span className="text-[#999]">完整报告内容</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#4CAF50]">✓</span>
                  <span className="text-[#999]">最近 7 天历史</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#666]">✗</span>
                  <span className="text-[#666]">紧急推送通知</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#666]">✗</span>
                  <span className="text-[#666]">全部历史报告</span>
                </div>
              </div>
            )}
            {stats?.tier === 'tracker' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-[#4CAF50]">✓</span>
                  <span className="text-[#999]">全部历史报告</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#4CAF50]">✓</span>
                  <span className="text-[#999]">紧急推送通知</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/reports"
            className="block p-4 bg-[#1E1E1F] border border-[#3A3A3A] rounded-lg hover:border-[#C19A6B] transition"
          >
            <h4 className="font-semibold text-[#E5E5E5] mb-1">查看报告</h4>
            <p className="text-sm text-[#999]">浏览按日期索引的日报</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent user={null} getToken={async () => null} />
}
