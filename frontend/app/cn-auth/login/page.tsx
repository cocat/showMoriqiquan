import { Suspense } from 'react'
import { LoginContent } from './login-content'

function LoginFallback() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">境内登录</h1>
        <p className="text-sm text-mentat-muted mb-6">加载中...</p>
        <div className="space-y-3">
          <div className="h-[72px] rounded-lg border border-mentat-border bg-mentat-bg-card/50 animate-pulse" />
          <div className="h-[72px] rounded-lg border border-mentat-border bg-mentat-bg-card/50 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function CnAuthLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
