/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { useAppAuth } from '@/app/providers'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard'

  const { signInWithAppToken } = useAppAuth()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugOtp, setDebugOtp] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [phone, otp])

  const handleSend = async () => {
    setSending(true)
    setError(null)
    setDebugOtp(null)
    try {
      const res = await authApi.phoneSend(phone)
      if (res?.debug_otp) setDebugOtp(res.debug_otp)
      setStep('otp')
    } catch (e: any) {
      setError(e?.message || '发送验证码失败')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)
    try {
      const res = await authApi.phoneVerify(phone, otp)
      if (!res.app_token) throw new Error('未获取到登录 token')
      await signInWithAppToken(res.app_token, {
        firstName: res.user?.phone || '用户',
        emailAddresses: [],
      })
      window.location.href = redirectUrl
    } catch (e: any) {
      setError(e?.message || '验证码校验失败')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">手机号登录</h1>
        <p className="text-sm text-mentat-muted mb-6">输入手机号获取 6 位验证码，完成登录。</p>

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

          {step === 'otp' && (
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
          )}

          <div className="flex gap-3">
            {step === 'phone' ? (
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || phone.trim().length < 6}
                className="flex-1 px-4 py-2.5 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? '发送中...' : '获取验证码'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  disabled={verifying}
                  className="px-4 py-2.5 border border-mentat-border text-mentat-muted rounded-lg hover:text-mentat-text transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || otp.trim().length !== 6}
                  className="flex-1 px-4 py-2.5 bg-gold text-mentat-bg rounded-lg font-semibold hover:bg-gold-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {verifying ? '验证中...' : '登录'}
                </button>
              </>
            )}
          </div>

          <div className="pt-2 text-center">
            <Link href="/reports/latest" className="text-sm text-mentat-muted hover:text-mentat-text transition-colors">
              先看看示例报告
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
