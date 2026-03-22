'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppAuth } from '@/app/providers'

const CN_AUTH_ENABLED = !!process.env.NEXT_PUBLIC_CN_AUTH_LOGIN_URL

export function LoginContent() {
  const { startCnLogin } = useAppAuth()
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent') === 'link' ? 'link' : 'login'
  const returnUrl = searchParams.get('return_url') || '/dashboard'

  const title = intent === 'link' ? '绑定境内登录方式' : '境内登录'
  const hint = intent === 'link'
    ? '请选择要绑定的登录方式。绑定后可直接用该方式登录同一账号。'
    : '请选择境内登录方式。'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">{title}</h1>
        <p className="text-sm text-mentat-muted mb-6">{hint}</p>

        {!CN_AUTH_ENABLED && (
          <div className="mb-4 rounded-lg border border-gold/40 bg-gold-dim p-3 text-sm text-gold">
            未配置 `NEXT_PUBLIC_CN_AUTH_LOGIN_URL`，请先在 `frontend/.env.local` 配置后重启前端。
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => startCnLogin({ mode: 'sms', intent, returnUrl })}
            disabled={!CN_AUTH_ENABLED}
            className="w-full text-left px-4 py-3 rounded-lg border border-mentat-border hover:border-gold transition-colors"
          >
            <p className="text-mentat-text font-medium">手机号验证码</p>
            <p className="text-xs text-mentat-muted mt-1">适用于大陆手机号快速登录</p>
          </button>

          <button
            type="button"
            onClick={() => startCnLogin({ mode: 'wechat', intent, returnUrl })}
            disabled={!CN_AUTH_ENABLED}
            className="w-full text-left px-4 py-3 rounded-lg border border-mentat-border hover:border-gold transition-colors"
          >
            <p className="text-mentat-text font-medium">微信登录</p>
            <p className="text-xs text-mentat-muted mt-1">使用微信授权登录（需平台开通）</p>
          </button>
        </div>

        <div className="mt-6">
          <Link
            href={returnUrl}
            className="text-sm text-mentat-muted hover:text-mentat-text transition-colors"
          >
            返回
          </Link>
        </div>
      </div>
    </div>
  )
}
