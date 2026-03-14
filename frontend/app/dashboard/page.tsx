'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { usersApi, isNetworkError } from '@/lib/api'
import { User as UserIcon, Crown, Calendar } from 'lucide-react'

interface UserStats {
  tier: string
  daily_query_count: number
  subscription_end?: string
  is_active: boolean
}

function DashboardContent() {
  const { user, getToken } = useAppAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [getToken])

  const loadStats = async () => {
    try {
      const token = await getToken()
      const data = await usersApi.stats(token)
      setStats(data as UserStats)
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
      case 'observer': return { name: '观察者', color: 'text-mentat-blue', bg: 'bg-mentat-blue/20' }
      case 'tracker': return { name: '追踪者', color: 'text-mentat-accent-purple', bg: 'bg-mentat-accent-purple/20' }
      case 'admin': return { name: '管理员', color: 'text-mentat-danger', bg: 'bg-mentat-danger/20' }
      default: return { name: '访客', color: 'text-mentat-muted', bg: 'bg-mentat-border' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-mentat-muted">加载中...</div>
      </div>
    )
  }

  const tierInfo = stats ? getTierInfo(stats.tier) : getTierInfo('guest')

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-mentat-text mb-8">个人中心</h1>

        {apiError && (
          <div className="mb-6 p-4 bg-gold-dim border border-gold/30 rounded-lg text-gold">
            {apiError}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-mentat-card border border-mentat-border rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-mentat-text">
                  {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? '用户'}
                </h2>
                <p className="text-mentat-muted text-sm">{user?.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-mentat-bg-subtle rounded-lg">
                <span className="text-mentat-muted">用户等级</span>
                <span className={`px-3 py-1 ${tierInfo.bg} ${tierInfo.color} rounded-full text-sm font-medium flex items-center gap-1`}>
                  <Crown className="w-4 h-4" />
                  {tierInfo.name}
                </span>
              </div>
              {stats?.subscription_end && (
                <div className="flex items-center justify-between p-3 bg-mentat-bg-subtle rounded-lg">
                  <span className="text-mentat-muted">订阅到期</span>
                  <span className="text-mentat-text flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(stats.subscription_end).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-mentat-bg-subtle rounded-lg">
                <span className="text-mentat-muted">今日查询</span>
                <span className="text-mentat-text font-medium">{stats?.daily_query_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-mentat-card border border-mentat-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-mentat-text mb-4">当前权益</h3>
            {stats?.tier === 'observer' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-mentat-success">✓</span>
                  <span className="text-mentat-muted">完整报告内容</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-mentat-success">✓</span>
                  <span className="text-mentat-muted">最近 7 天历史</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-mentat-muted-secondary">✗</span>
                  <span className="text-mentat-muted-secondary">紧急推送通知</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-mentat-muted-secondary">✗</span>
                  <span className="text-mentat-muted-secondary">全部历史报告</span>
                </div>
              </div>
            )}
            {stats?.tier === 'tracker' && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-mentat-success">✓</span>
                  <span className="text-mentat-muted">全部历史报告</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-mentat-success">✓</span>
                  <span className="text-mentat-muted">紧急推送通知</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {(!stats?.subscription_end || new Date(stats.subscription_end) < new Date()) && (
            <Link
              href="/subscribe"
              className="block p-4 bg-gold-dim border border-gold/40 rounded-lg hover:border-gold transition"
            >
              <h4 className="font-semibold text-gold mb-1">订阅 observer · $29.9/月</h4>
              <p className="text-sm text-mentat-muted">解锁完整报告与 7 天历史</p>
            </Link>
          )}
          <Link
            href="/reports"
            className="block p-4 bg-mentat-card border border-mentat-border rounded-lg hover:border-gold transition"
          >
            <h4 className="font-semibold text-mentat-text mb-1">查看报告</h4>
            <p className="text-sm text-mentat-muted">浏览按日期索引的日报</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
