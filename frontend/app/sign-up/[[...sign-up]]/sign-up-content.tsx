'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { useAppAuth } from '@/app/providers'
import { captureAttributionIfPresent, getAttributionPayload } from '@/lib/attribution'

export function SignUpContent() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'
  const { signInWithAppToken } = useAppAuth()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    captureAttributionIfPresent()
  }, [])

  useEffect(() => {
    setError(null)
  }, [phone, otp, password])

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = window.setInterval(() => {
      setCooldownSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const handleSend = async () => {
    setSending(true)
    setError(null)
    setDebugOtp(null)
    try {
      const res = await authApi.phoneSend(phone)
      if (res?.debug_otp) setDebugOtp(res.debug_otp)
      setCooldownSeconds(60)
    } catch (e: any) {
      setError(e?.message || '发送验证码失败')
    } finally {
      setSending(false)
    }
  }

  const handleRegister = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await authApi.passwordRegister(phone, otp, password, getAttributionPayload())
      if (!res.app_token) throw new Error('未获取到登录 token')
      await signInWithAppToken(res.app_token, {
        firstName: res.user?.phone || '用户',
        emailAddresses: [],
      })
      window.location.href = redirectUrl
    } catch (e: any) {
      setError(e?.message || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">注册账号</h1>
        <p className="text-sm text-mentat-muted mb-6">输入手机号、验证码和密码，注册后自动登录。</p>

        {error && (
          <div className="mb-4 rounded-lg border border-gold/40 bg-gold-dim p-3 text-sm text-gold">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-mentat-muted">手机号</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="+86 138xxxxxxx"
              className="mt-2 w-full px-3 py-2 rounded-lg bg-mentat-bg-card border border-mentat-border outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="text-sm text-mentat-muted">验证码</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              placeholder="6 位数字"
              className="mt-2 w-full px-3 py-2 rounded-lg bg-mentat-bg-card border border-mentat-border outline-none focus:border-gold"
            />
            {debugOtp && (
              <p className="text-xs text-mentat-muted mt-2">
                调试验证码：<span className="text-mentat-text font-mono">{debugOtp}</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-mentat-muted">密码</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="至少 8 位"
              className="mt-2 w-full px-3 py-2 rounded-lg bg-mentat-bg-card border border-mentat-border outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="mt-2 text-xs text-mentat-muted hover:text-mentat-text transition"
            >
              {showPassword ? '隐藏密码' : '显示密码'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || submitting || cooldownSeconds > 0 || phone.trim().length < 6}
              className="px-4 py-2.5 border border-mentat-border text-mentat-muted rounded-lg hover:text-mentat-text transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? '发送中...' : cooldownSeconds > 0 ? `${cooldownSeconds}s 后重发` : '获取验证码'}
            </button>
            <button
              type="button"
              onClick={handleRegister}
              disabled={submitting || otp.trim().length !== 6 || password.trim().length < 8}
              className="flex-1 px-4 py-2.5 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? '注册中...' : '注册并登录'}
            </button>
          </div>

          <div className="pt-2 text-center space-y-2">
            <div className="text-sm text-mentat-muted">
              已有账号？{' '}
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
                className="text-gold hover:text-gold-hover transition-colors"
              >
                去登录
              </Link>
            </div>
            <Link href="/reports/latest" className="text-sm text-mentat-muted hover:text-mentat-text transition-colors">
              先看看示例报告
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
