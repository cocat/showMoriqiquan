import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SignInContent } from './sign-in-content'

function SignInFallback() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">手机号登录</h1>
        <p className="text-sm text-mentat-muted mb-6">加载中...</p>
        <div className="h-10 rounded-lg bg-mentat-bg-card/50 animate-pulse" />
      </div>
    </div>
  )
}

function safeInternalPath(raw: string | string[] | undefined): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (typeof v !== 'string' || !v.startsWith('/') || v.startsWith('//')) return null
  return v
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>
}) {
  if (process.env.NEXT_PUBLIC_SKIP_CLERK === 'true') {
    const sp = await searchParams
    const dest = safeInternalPath(sp.redirect_url) ?? '/reports/latest'
    redirect(dest)
  }

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  )
}
