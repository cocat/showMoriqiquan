'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'
import { authApi } from '@/lib/api'
import { withTokenRetry } from '@/lib/session-token'
import { formatApiErrorForUser } from '@/lib/api-error-ui'

type IdentityRow = {
  provider: string
  provider_user_id: string
  email?: string | null
  phone?: string | null
  created_at: string
}

const PROVIDER_LABELS: Record<string, string> = {
  clerk: 'Clerk（邮箱/海外）',
  cn_auth: '境内 Auth',
  app: '业务 Token',
}

export default function AccountSecurityPage() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const { isLoaded, isSignedIn, getToken } = useAppAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<IdentityRow[]>([])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setError('请先登录后查看账号安全设置。')
      setLoading(false)
      return
    }
    withTokenRetry(getToken, (token) => {
      if (!token) throw new Error('登录状态无效，请重新登录。')
      return authApi.identities(token)
    })
      .then((res) => {
        setRows(res.identities || [])
      })
      .catch((err: unknown) => {
        setError(formatApiErrorForUser(err, '加载账号绑定信息失败。'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isLoaded, isSignedIn, getToken])

  const linkedProviders = useMemo(() => new Set(rows.map((x) => x.provider)), [rows])

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-mentat-text mb-2">账号安全</h1>
        <p className="text-sm text-mentat-muted mb-6">管理可用于登录同一账号的身份来源。</p>

        {loading && (
          <div className="rounded-lg border border-mentat-border bg-mentat-card p-4 text-mentat-muted">
            正在加载...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-gold/40 bg-gold-dim p-4 text-gold">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="rounded-lg border border-mentat-border bg-mentat-card p-5">
              <h2 className="text-lg font-semibold text-mentat-text mb-4">已绑定身份</h2>
              {rows.length === 0 ? (
                <p className="text-sm text-mentat-muted">暂无绑定记录。</p>
              ) : (
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div
                      key={`${row.provider}-${row.provider_user_id}`}
                      className="rounded-lg bg-mentat-bg-subtle px-4 py-3"
                    >
                      <p className="text-sm font-medium text-mentat-text">
                        {PROVIDER_LABELS[row.provider] || row.provider}
                      </p>
                      <p className="text-xs text-mentat-muted mt-1">
                        {row.email || row.phone || row.provider_user_id}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-mentat-border bg-mentat-card p-5">
              <h2 className="text-lg font-semibold text-mentat-text mb-4">新增绑定</h2>
              <div className="flex flex-wrap gap-3">
                {!linkedProviders.has('cn_auth') && (
                  <Link
                    href="/cn-auth/login?intent=link&return_url=/account/security"
                    className="px-4 py-2 rounded border border-mentat-border text-sm text-mentat-muted hover:text-mentat-text hover:border-gold transition-colors"
                  >
                    绑定境内账号
                  </Link>
                )}
                {!skipClerk && !linkedProviders.has('clerk') && (
                  <Link
                    href="/clerk-sign-in?intent=link&redirect_url=/account/security"
                    className="px-4 py-2 rounded border border-mentat-border text-sm text-mentat-muted hover:text-mentat-text hover:border-gold transition-colors"
                  >
                    绑定 Clerk 账号
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
