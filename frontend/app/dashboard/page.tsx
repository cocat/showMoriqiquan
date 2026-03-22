'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { usersApi, isNetworkError } from '@/lib/api'
import { User as UserIcon, Crown, Calendar, Clock, AlertTriangle } from 'lucide-react'

interface UserStats {
  tier: string
  daily_query_count: number
  subscription_end?: string
  is_active: boolean
}

type Entitlement = {
  enabled: boolean
  text: string
}

function getDaysLeft(subscriptionEnd?: string): number | null {
  if (!subscriptionEnd) return null
  const diff = new Date(subscriptionEnd).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function TrialBanner({ daysLeft, subscriptionEnd }: { daysLeft: number; subscriptionEnd: string }) {
  const isUrgent = daysLeft <= 2
  const endDate = new Date(subscriptionEnd).toLocaleDateString('zh-CN')

  return (
    <div
      className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
        isUrgent
          ? 'bg-mentat-danger/10 border-mentat-danger/40'
          : 'bg-gold-dim border-gold/30'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-5 h-5 text-mentat-danger flex-shrink-0 mt-0.5" />
      ) : (
        <Clock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isUrgent ? 'text-mentat-danger' : 'text-gold'}`} />
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${isUrgent ? 'text-mentat-danger' : 'text-gold'}`}>
          {daysLeft === 0
            ? '免费试用期今日到期'
            : `免费试用期剩余 ${daysLeft} 天`}
        </p>
        <p className="text-mentat-muted text-xs mt-0.5">
          到期日：{endDate}。到期后将降为访客权限，仅可预览有限内容。
        </p>
      </div>
      {isUrgent && (
        <Link
          href="/reports/latest"
          className="flex-shrink-0 px-3 py-1.5 bg-gold text-mentat-bg rounded text-xs font-semibold hover:bg-gold-hover transition"
        >
          查看今日报告
        </Link>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-32 rounded bg-mentat-border animate-pulse mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-mentat-card border border-mentat-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-mentat-border animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-mentat-border animate-pulse" />
                <div className="h-3 w-40 rounded bg-mentat-border animate-pulse" />
              </div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-mentat-border animate-pulse" />
            ))}
          </div>
          <div className="bg-mentat-card border border-mentat-border rounded-lg p-6">
            <div className="h-5 w-24 rounded bg-mentat-border animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-full rounded bg-mentat-border animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  const { isLoaded, user, getToken } = useAppAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    loadStats()
  }, [isLoaded, getToken])

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
      } else {
        setStats({ tier: 'guest', daily_query_count: 0, is_active: true })
        setApiError('账户信息加载失败，先为你展示默认权益。')
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

  const getEntitlements = (tier: string): Entitlement[] => {
    switch (tier) {
      case 'observer':
        return [
          { enabled: true, text: '查看完整报告' },
          { enabled: true, text: '查看最近 7 天历史' },
          { enabled: false, text: '紧急推送通知' },
          { enabled: false, text: '查看全部历史报告' },
        ]
      case 'tracker':
        return [
          { enabled: true, text: '查看完整报告' },
          { enabled: true, text: '查看全部历史报告' },
          { enabled: true, text: '紧急推送通知' },
        ]
      case 'admin':
        return [
          { enabled: true, text: '查看完整报告' },
          { enabled: true, text: '查看全部历史报告' },
          { enabled: true, text: '紧急推送通知' },
          { enabled: true, text: '管理员权限（系统维护）' },
        ]
      default:
        return [
          { enabled: true, text: '预览最新报告（部分内容）' },
          { enabled: false, text: '查看完整报告' },
          { enabled: false, text: '查看历史报告' },
        ]
    }
  }

  if (!isLoaded || loading) {
    return <DashboardSkeleton />
  }

  const currentTier = stats?.tier || 'guest'
  const tierInfo = getTierInfo(currentTier)
  const entitlements = getEntitlements(currentTier)
  const daysLeft = getDaysLeft(stats?.subscription_end)
  const showTrialBanner = daysLeft !== null && daysLeft <= 7

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-mentat-text mb-8">个人中心</h1>

        {apiError && (
          <div className="mb-6 p-4 bg-gold-dim border border-gold/30 rounded-lg text-gold">
            {apiError}
          </div>
        )}

        {showTrialBanner && stats?.subscription_end && (
          <TrialBanner daysLeft={daysLeft!} subscriptionEnd={stats.subscription_end} />
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
                <span className="text-mentat-muted">账号等级</span>
                <span className={`px-3 py-1 ${tierInfo.bg} ${tierInfo.color} rounded-full text-sm font-medium flex items-center gap-1`}>
                  <Crown className="w-4 h-4" />
                  {tierInfo.name}
                </span>
              </div>
              {stats?.subscription_end && (
                <div className="flex items-center justify-between p-3 bg-mentat-bg-subtle rounded-lg">
                  <span className="text-mentat-muted">
                    {daysLeft !== null && daysLeft > 0 ? '权限到期' : '权限状态'}
                  </span>
                  <span className="text-mentat-text flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(stats.subscription_end).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-mentat-bg-subtle rounded-lg">
                <span className="text-mentat-muted">今日查看次数</span>
                <span className="text-mentat-text font-medium">{stats?.daily_query_count ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-mentat-card border border-mentat-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-mentat-text mb-4">当前权益</h3>
            <div className="space-y-3">
              {entitlements.map((item) => (
                <div key={item.text} className="flex items-start gap-2">
                  <span className={item.enabled ? 'text-mentat-success' : 'text-mentat-muted-secondary'}>
                    {item.enabled ? '✓' : '✗'}
                  </span>
                  <span className={item.enabled ? 'text-mentat-muted' : 'text-mentat-muted-secondary'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {(!stats?.subscription_end || new Date(stats.subscription_end) < new Date()) && (
            <Link
              href="/reports/latest"
              className="block p-4 bg-gold-dim border border-gold/40 rounded-lg hover:border-gold transition"
            >
              <h4 className="font-semibold text-gold mb-1">继续查看今日报告</h4>
              <p className="text-sm text-mentat-muted">先看最新，再按需回看历史报告</p>
            </Link>
          )}
          <Link
            href="/reports"
            className="block p-4 bg-mentat-card border border-mentat-border rounded-lg hover:border-gold transition"
          >
            <h4 className="font-semibold text-mentat-text mb-1">查看报告</h4>
            <p className="text-sm text-mentat-muted">浏览按日期索引的日报</p>
          </Link>
          <Link
            href="/account/security"
            className="block p-4 bg-mentat-card border border-mentat-border rounded-lg hover:border-gold transition"
          >
            <h4 className="font-semibold text-mentat-text mb-1">账号安全</h4>
            <p className="text-sm text-mentat-muted">绑定不同登录方式，统一到同一账号</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
