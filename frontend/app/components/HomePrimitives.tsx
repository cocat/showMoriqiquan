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
    <div className={`mb-6 text-center sm:text-left ${className}`.trim()}>
      <h2 className="text-[11px] text-mentat-muted-secondary font-mono uppercase tracking-wider mb-1">{eyebrow}</h2>
      <p className="text-mentat-text-faint font-medium">{title}</p>
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
    <div className={`h-full rounded-xl border border-mentat-border-card bg-mentat-bg-card p-5 ${textAlignClass}`}>
      {meta && (
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-mentat-muted-tertiary mb-2">{meta}</p>
      )}
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-gold-dim flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-gold" />
        </div>
      )}
      <div className="text-gold font-mono text-xs uppercase tracking-wider mb-2">{title}</div>
      <p className="text-mentat-text-secondary text-sm leading-relaxed">{description}</p>
      {points.length > 0 && (
        <div className="mt-3 pt-3 border-t border-mentat-border-weak space-y-1.5">
          {points.map((point) => (
            <p key={point} className="text-[11px] text-mentat-muted-secondary leading-relaxed">
              · {point}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
