'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { paymentsApi } from '@/lib/api'
import { Check, Loader2 } from 'lucide-react'

export default function SubscribePage() {
  const { getToken, isSignedIn } = useAppAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/subscribe')
      return
    }
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
          <p className="text-mentat-muted text-sm mb-6">请先登录后再订阅</p>
          <Link
            href="/sign-in?redirect_url=/subscribe"
            className="inline-flex items-center justify-center px-6 py-3 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition"
          >
            去登录
          </Link>
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
          {['完整日报所有模块', '最近 7 天历史', '情绪仪表盘 + 行情快照', '红黄预警 + 新闻简报'].map((item) => (
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
