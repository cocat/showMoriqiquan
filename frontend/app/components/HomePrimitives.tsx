'use client'

import type { ElementType } from 'react'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  className?: string
}

interface InsightCardProps {
  title: string
  description: string
  icon?: ElementType
  align?: 'left' | 'center'
  meta?: string
  points?: string[]
}

export function SectionHeader({ eyebrow, title, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-7 text-center sm:text-left ${className}`.trim()}>
      <h2 className="text-xs text-mentat-muted-secondary font-mono uppercase tracking-wider mb-1.5">{eyebrow}</h2>
      <p className="text-mentat-text-faint font-medium text-base sm:text-lg leading-snug">{title}</p>
    </div>
  )
}

export function InsightCard({
  title,
  description,
  icon: Icon,
  align = 'left',
  meta,
  points = [],
}: InsightCardProps) {
  const textAlignClass = align === 'center' ? 'text-center sm:text-left' : 'text-left'

  return (
    <div className={`h-full rounded-2xl border border-mentat-border-card bg-mentat-bg-card p-6 sm:p-7 ${textAlignClass}`}>
      {meta && (
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-mentat-muted-tertiary mb-2.5">{meta}</p>
      )}
      {Icon && (
        <div className="w-11 h-11 rounded-lg bg-gold-dim flex items-center justify-center mb-3.5">
          <Icon className="w-5.5 h-5.5 text-gold" />
        </div>
      )}
      <div className="text-gold font-mono text-sm uppercase tracking-wider mb-2.5">{title}</div>
      <p className="text-mentat-text-secondary text-[15px] leading-relaxed">{description}</p>
      {points.length > 0 && (
        <div className="mt-4 pt-4 border-t border-mentat-border-weak space-y-2">
          {points.map((point) => (
            <p key={point} className="text-[12px] text-mentat-muted-secondary leading-relaxed">
              · {point}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
