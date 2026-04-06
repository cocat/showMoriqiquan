'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignIn, useAuth } from '@clerk/nextjs'
import { authApi } from '@/lib/api'
import { formatApiErrorForUser } from '@/lib/api-error-ui'

const APP_TOKEN_STORAGE_KEY = 'mv_app_token'

function safeInternalPath(raw: string | null, fallback: string): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return fallback
  }
  return raw
}

export default function ClerkSignInClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const intent = searchParams.get('intent') === 'link' ? 'link' : 'login'
  const redirectUrl = safeInternalPath(searchParams.get('redirect_url'), '/dashboard')
  const returnToSelf = useMemo(() => {
    const qp = new URLSearchParams()
    qp.set('redirect_url', redirectUrl)
    if (intent === 'link') qp.set('intent', 'link')
    return `/clerk-sign-in?${qp.toString()}`
  }, [intent, redirectUrl])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    if (intent !== 'link') {
      router.replace(redirectUrl)
      return
    }

    let cancelled = false

    async function linkIdentity() {
      setLinking(true)
      setError(null)
      try {
        const clerkToken = await getToken()
        const currentToken =
          typeof window === 'undefined'
            ? null
            : window.localStorage.getItem(APP_TOKEN_STORAGE_KEY)
        if (!clerkToken || !currentToken) {
          throw new Error('请先登录已有账号，再绑定 Clerk 账号。')
        }
        await authApi.link(clerkToken, currentToken)
        if (!cancelled) {
          router.replace(redirectUrl)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(formatApiErrorForUser(err, '绑定 Clerk 账号失败。'))
        }
      } finally {
        if (!cancelled) {
          setLinking(false)
        }
      }
    }

    linkIdentity()
    return () => {
      cancelled = true
    }
  }, [getToken, intent, isLoaded, isSignedIn, redirectUrl, router])

  if (isLoaded && isSignedIn && intent === 'link') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md rounded-xl border border-mentat-border bg-mentat-card p-6">
          <h1 className="text-xl font-semibold text-mentat-text mb-2">绑定 Clerk 账号</h1>
          <p className="text-sm text-mentat-muted">
            {linking ? '正在完成绑定，请稍候...' : error || '正在跳转...'}
          </p>
          {error && (
            <div className="mt-5">
              <Link
                href={redirectUrl}
                className="inline-block px-4 py-2 rounded bg-gold text-mentat-bg text-sm font-semibold hover:bg-gold-hover transition-colors"
              >
                返回上一页
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <SignIn
        fallbackRedirectUrl={returnToSelf}
        forceRedirectUrl={returnToSelf}
        signUpUrl="/sign-up"
      />
    </div>
  )
}
