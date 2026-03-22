'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { authApi } from '@/lib/api'
import { captureAttributionIfPresent } from '@/lib/attribution'

export default function CnAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { exchangeExternalToken, getToken } = useAppAuth()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('正在验证登录信息...')

  useEffect(() => {
    captureAttributionIfPresent()
    const token = searchParams.get('token') || searchParams.get('access_token')
    const intent = searchParams.get('intent') || 'login'
    const returnUrl = searchParams.get('return_url') || '/dashboard'

    if (!token) {
      setStatus('error')
      setMessage('未收到登录令牌，请从登录入口重试。')
      return
    }

    if (intent === 'link') {
      setMessage('正在绑定身份...')
      getToken()
        .then((currentToken) => {
          if (!currentToken) {
            throw new Error('请先登录已有账号，再执行绑定。')
          }
          return authApi.link(token, currentToken)
        })
        .then(() => {
          router.replace(returnUrl)
        })
        .catch((err: unknown) => {
          const text = (err as Error)?.message || '绑定失败，请稍后重试。'
          setStatus('error')
          setMessage(text)
        })
      return
    }

    exchangeExternalToken(token)
      .then(() => {
        router.replace(returnUrl)
      })
      .catch((err: unknown) => {
        const text = (err as Error)?.message || '登录失败，请稍后重试。'
        setStatus('error')
        setMessage(text)
      })
  }, [searchParams, exchangeExternalToken, getToken, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">境内登录</h1>
        <p className="text-sm text-mentat-muted">{message}</p>
        {status === 'error' && (
          <div className="mt-5">
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded bg-gold text-mentat-bg text-sm font-semibold hover:bg-gold-hover transition-colors"
            >
              返回首页
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
