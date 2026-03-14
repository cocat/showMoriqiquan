'use client'

interface SectionPlaceholderProps {
  title?: string
  message?: string
  className?: string
}

/** 模块暂无数据时的占位展示 */
export function SectionPlaceholder({ title = '暂无数据', message, className = '' }: SectionPlaceholderProps) {
  return (
    <div
      className={`rounded-xl border border-mentat-border-card bg-mentat-bg-card/50 flex flex-col items-center justify-center py-12 px-4 text-center min-h-[120px] ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-mentat-border-card mb-3 flex items-center justify-center">
        <div className="w-4 h-4 border border-mentat-border rounded animate-pulse" />
      </div>
      <p className="text-sm text-mentat-muted-secondary font-medium">{title}</p>
      {message && <p className="text-xs text-mentat-muted-tertiary mt-1">{message}</p>}
    </div>
  )
}

/** 通用加载骨架 */
export function SkeletonPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-mentat-border-card bg-mentat-bg-card overflow-hidden animate-pulse ${className}`}>
      <div className="h-10 bg-mentat-border-card mb-4" />
      <div className="space-y-3 px-4 pb-4">
        <div className="h-3 w-full rounded bg-mentat-border-card" />
        <div className="h-3 w-[80%] rounded bg-mentat-border-card" />
        <div className="h-3 w-[70%] rounded bg-mentat-border-card" />
      </div>
    </div>
  )
}
