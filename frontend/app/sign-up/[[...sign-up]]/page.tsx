import { Suspense } from 'react'
import { SignUpContent } from './sign-up-content'

function SignUpFallback() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">注册账号</h1>
        <p className="text-sm text-mentat-muted mb-6">加载中...</p>
        <div className="h-10 rounded-lg bg-mentat-bg-card/50 animate-pulse" />
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpContent />
    </Suspense>
  )
}
