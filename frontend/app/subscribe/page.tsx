'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { useAppAuth } from '@/app/providers'
import { paymentsApi } from '@/lib/api'
import { Check, Loader2 } from 'lucide-react'

const FEATURES = ['完整日报所有模块', '最近 7 天历史', '情绪仪表盘 + 行情快照', '红黄预警 + 新闻简报']

function PageSkeleton() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-mentat-border bg-mentat-card p-8 space-y-4 animate-pulse">
        <div className="h-6 w-36 rounded bg-mentat-border" />
        <div className="h-4 w-56 rounded bg-mentat-border" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-mentat-border" />
          ))}
        </div>
        <div className="h-12 w-full rounded-lg bg-mentat-border" />
      </div>
    </div>
  )
}

export default function SubscribePage() {
  const { isLoaded, isSignedIn, getToken } = useAppAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded) {
    return <PageSkeleton />
  }

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await paymentsApi.checkout('observer', token)
      if (res?.checkout_url) {
        window.location.href = res.checkout_url
      } else {
        setError('未获取到支付链接')
      }
    } catch (e) {
      setError((e as Error).message || '创建支付失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-mentat-text mb-4">订阅 observer</h2>
          <p className="text-mentat-muted text-sm mb-6">请先登录或注册后再订阅</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SignUpButton mode="modal" fallbackRedirectUrl="/subscribe">
              <button
                type="button"
                className="inline-flex items-center justify-center px-6 py-3 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition"
              >
                注册
              </button>
            </SignUpButton>
            <span className="text-mentat-muted text-sm">已有账号？</span>
            <SignInButton mode="modal" fallbackRedirectUrl="/subscribe">
              <button
                type="button"
                className="inline-flex items-center justify-center px-6 py-3 border border-mentat-border text-mentat-text rounded-lg font-medium hover:bg-mentat-bg-card transition"
              >
                登录
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-mentat-border bg-mentat-card p-8">
        <h2 className="text-xl font-semibold text-mentat-text mb-2">订阅 observer</h2>
        <p className="text-mentat-muted text-sm mb-6">
          完整报告内容 + 最近 7 天历史 · $29.9/月
        </p>
        <ul className="space-y-3 mb-8">
          {FEATURES.map((item) => (
            <li key={item} className="flex items-center gap-2 text-mentat-text-secondary text-sm">
              <Check className="w-4 h-4 text-mentat-success flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-mentat-error-border/20 border border-mentat-error-border text-sm text-mentat-danger">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              创建订单...
            </>
          ) : (
            '立即支付 $29.9/月'
          )}
        </button>
        <Link
          href="/dashboard"
          className="block mt-4 text-center text-sm text-mentat-muted hover:text-mentat-text transition"
        >
          返回个人中心
        </Link>
      </div>
    </div>
  )
}
