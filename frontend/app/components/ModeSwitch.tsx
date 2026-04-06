'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Mode = 'classic' | 'modern'

function resolveModeHref(pathname: string, mode: Mode) {
  const isModern = pathname === '/home-v2'
    || pathname === '/reports-v2'
    || pathname === '/reports-v2/latest'
    || pathname.startsWith('/reports-v2/')

  if (mode === 'modern') {
    if (pathname === '/') return '/home-v2'
    if (pathname === '/reports') return '/reports-v2'
    if (pathname === '/reports/latest') return '/reports-v2/latest'
    if (pathname.startsWith('/reports/') && pathname !== '/reports/latest') {
      return pathname.replace('/reports/', '/reports-v2/')
    }
    if (isModern) return pathname
    return '/home-v2'
  }

  if (pathname === '/home-v2') return '/'
  if (pathname === '/reports-v2') return '/reports'
  if (pathname === '/reports-v2/latest') return '/reports/latest'
  if (pathname.startsWith('/reports-v2/') && pathname !== '/reports-v2/latest') {
    return pathname.replace('/reports-v2/', '/reports/')
  }
  return pathname === '/' || pathname === '/reports' || pathname.startsWith('/reports/') ? pathname : '/'
}

export function ModeSwitch({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const isModern = pathname === '/home-v2'
    || pathname === '/reports-v2'
    || pathname === '/reports-v2/latest'
    || pathname.startsWith('/reports-v2/')

  const classicHref = resolveModeHref(pathname, 'classic')
  const modernHref = resolveModeHref(pathname, 'modern')

  return (
    <div
      className={`inline-flex items-center rounded-full border border-mentat-border bg-mentat-bg-card/80 p-1 ${
        mobile ? 'w-full justify-center' : ''
      }`}
    >
      <Link
        href={classicHref}
        onClick={onNavigate}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          !isModern
            ? 'bg-gold text-mentat-bg'
            : 'text-mentat-muted hover:text-mentat-text'
        }`}
      >
        经典模式
      </Link>
      <Link
        href={modernHref}
        onClick={onNavigate}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          isModern
            ? 'bg-gold text-mentat-bg'
            : 'text-mentat-muted hover:text-mentat-text'
        }`}
      >
        新版模式
      </Link>
    </div>
  )
}
