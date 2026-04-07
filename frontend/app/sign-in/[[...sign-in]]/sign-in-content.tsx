'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BellRing, Eye, EyeOff, LockKeyhole, Radio, ShieldCheck, Sparkles } from 'lucide-react'
import { authApi } from '@/lib/api'
import { formatApiErrorForUser } from '@/lib/api-error-ui'
import { useAppAuth } from '@/app/providers'
import { captureAttributionIfPresent, getAttributionPayload } from '@/lib/attribution'

export function SignInContent() {
  const searchParams = useSearchParams()
  const redirectUrlRaw = searchParams.get('redirect_url')

  const { signInWithAppToken } = useAppAuth()

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'otp'>('password')
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
  }, [phone, otp, password, mode])

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = window.setInterval(() => {
      setCooldownSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const redirectUrl =
    typeof redirectUrlRaw === 'string' &&
    redirectUrlRaw.startsWith('/') &&
    !redirectUrlRaw.startsWith('//')
      ? redirectUrlRaw
      : '/dashboard'

  const handleSend = async () => {
    setSending(true)
    setError(null)
    setDebugOtp(null)
    try {
      const res = await authApi.phoneSend(phone)
      if (res?.debug_otp) setDebugOtp(res.debug_otp)
      setCooldownSeconds(60)
    } catch (e: unknown) {
      setError(formatApiErrorForUser(e, '发送验证码失败'))
    } finally {
      setSending(false)
    }
  }

  const completeSignIn = async (token: string | null, phoneLabel?: string | null) => {
    if (!token) throw new Error('未获取到登录 token')
    await signInWithAppToken(token, {
      firstName: phoneLabel || '用户',
      emailAddresses: [],
    })
    window.location.href = redirectUrl
  }

  const handleOtpLogin = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await authApi.phoneVerify(phone, otp, getAttributionPayload())
      await completeSignIn(res.app_token, res.user?.phone)
    } catch (e: unknown) {
      setError(formatApiErrorForUser(e, '验证码校验失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordLogin = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await authApi.passwordLogin(phone, password, getAttributionPayload())
      await completeSignIn(res.app_token, res.user?.phone)
    } catch (e: unknown) {
      setError(formatApiErrorForUser(e, '账号或密码错误'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-[15px] text-slate-950 shadow-inner shadow-slate-950/[0.03] outline-none transition placeholder:text-slate-400 focus:border-[#b7791f] focus:bg-white focus:ring-4 focus:ring-amber-200/50'
  const inactiveModeClass =
    'border border-slate-200 bg-white/70 text-slate-500 hover:border-slate-300 hover:text-slate-900'
  const activeModeClass =
    'bg-slate-950 text-white shadow-xl shadow-slate-950/20'

  return (
    <div className="relative isolate min-h-[calc(100vh-96px)] overflow-hidden bg-[#f7f1e6] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_10%_10%,rgba(245,158,11,0.28),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(14,165,233,0.20),transparent_30%),linear-gradient(135deg,#fff7e8_0%,#f8fafc_50%,#eef3f8_100%)]" />
      <div className="absolute left-[-120px] top-16 -z-10 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-80px] -z-10 h-96 w-96 rounded-full bg-slate-900/10 blur-3xl" />
      <div className="mx-auto grid min-h-[calc(100vh-160px)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-7 text-white shadow-2xl shadow-slate-950/20 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.28),transparent_28%),radial-gradient(circle_at_88%_22%,rgba(56,189,248,0.16),transparent_26%),linear-gradient(145deg,#101827_0%,#111827_54%,#22160c_100%)]" />
          <div className="absolute right-6 top-6 h-24 w-24 rounded-full border border-white/10" />
          <div className="absolute bottom-[-40px] right-[-32px] h-56 w-56 rounded-full border border-amber-200/10" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Pre-market cockpit
            </div>

            <div className="mt-12 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-amber-200/80">Mentat Vision</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
                欢迎回到你的
                <span className="block text-amber-200">盘前情报台</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
                登录后同步账户权限，解锁完整研报、历史归档与更细颗粒度的风险观察。我们把开盘前的噪音，整理成你能直接行动的阅读顺序。
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ['07:30', '盘前摘要'],
                ['24h', '全球情绪线索'],
                ['3 min', '快速进入重点'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <div className="text-2xl font-semibold tracking-[-0.04em] text-white">{value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/20 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Today brief</p>
                  <p className="mt-1 text-sm text-slate-200">新闻翻译台 · 市场快照 · 风险清单</p>
                </div>
                <BellRing className="h-5 w-5 text-amber-200" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-2.5 w-11/12 rounded-full bg-white/20" />
                <div className="h-2.5 w-8/12 rounded-full bg-amber-200/70" />
                <div className="h-2.5 w-10/12 rounded-full bg-sky-200/40" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/78 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-6">
          <div className="rounded-[1.65rem] border border-slate-200/80 bg-[#fffaf1]/80 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Secure sign in
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">欢迎登录</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">默认使用手机号密码登录，也可以切换到短信验证码。</p>
              </div>
              <div className="hidden rounded-2xl bg-slate-950 p-3 text-amber-100 shadow-lg shadow-slate-950/20 sm:block">
                <LockKeyhole className="h-5 w-5" />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === 'password' ? activeModeClass : inactiveModeClass}`}
                >
                  密码登录
                </button>
                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${mode === 'otp' ? activeModeClass : inactiveModeClass}`}
                >
                  短信登录
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">手机号</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="+86 138xxxxxxx"
                  className={inputClass}
                />
              </div>

              {mode !== 'password' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">验证码</label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    inputMode="numeric"
                    placeholder="6 位数字"
                    className={inputClass}
                  />
                  {debugOtp && (
                    <p className="mt-2 rounded-xl bg-slate-950 px-3 py-2 text-xs text-slate-300">
                      调试验证码：<span className="font-mono text-amber-200">{debugOtp}</span>
                    </p>
                  )}
                </div>
              )}

              {mode !== 'otp' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">密码</label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少 8 位"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute bottom-3 right-3 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                {mode !== 'password' && (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || submitting || cooldownSeconds > 0 || phone.trim().length < 6}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-36"
                  >
                    {sending ? '发送中...' : cooldownSeconds > 0 ? `${cooldownSeconds}s 后重发` : '获取验证码'}
                  </button>
                )}
                {mode === 'password' && (
                  <button
                    type="button"
                    onClick={handlePasswordLogin}
                    disabled={submitting || phone.trim().length < 6 || password.trim().length < 8}
                    className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? '登录中...' : '进入个人中心'}
                    {!submitting && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                  </button>
                )}
                {mode === 'otp' && (
                  <button
                    type="button"
                    onClick={handleOtpLogin}
                    disabled={submitting || otp.trim().length !== 6}
                    className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? '验证中...' : '短信登录'}
                    {!submitting && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">登录后会同步真实权限</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">如果页面显示“登录失效”，说明后端没有接受当前会话，可以退出后重新登录。</p>
                  </div>
                </div>
              </div>

              <div className="pt-1 text-center text-sm text-slate-500">
                还没有账号？{' '}
                <Link
                  href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
                  className="font-semibold text-slate-950 underline decoration-amber-300 decoration-2 underline-offset-4 transition hover:text-amber-700"
                >
                  注册账号
                </Link>
                <span className="mx-2 text-slate-300">/</span>
                <Link href="/reports/latest" className="font-semibold text-slate-600 transition hover:text-slate-950">
                  先看今日前瞻
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
