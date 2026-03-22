import { Suspense } from 'react'
import { CallbackContent } from './callback-content'

function CallbackFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-mentat-border bg-mentat-card p-6">
        <h1 className="text-xl font-semibold text-mentat-text mb-2">境内登录</h1>
        <p className="text-sm text-mentat-muted">正在验证登录信息...</p>
      </div>
    </div>
  )
}

export default function CnAuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </Suspense>
  )
}
