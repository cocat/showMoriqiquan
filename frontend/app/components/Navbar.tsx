'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs'
import { TrendingUp, Menu, X } from 'lucide-react'
import { useState } from 'react'

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'text-gold bg-gold-dim'
          : 'text-mentat-muted hover:text-mentat-text hover:bg-mentat-bg-card'
      }`}
    >
      {children}
    </Link>
  )
}

const SKIP_CLERK = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const isReportDetail =
    pathname.startsWith('/reports/') && pathname !== '/reports' && pathname !== '/reports/latest'
  const isReports = pathname === '/reports'
  const isPricing = pathname === '/pricing'

  return (
    <nav className="border-b border-mentat-border bg-mentat-bg/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-4">
            <span className="relative w-8 h-8 rounded overflow-hidden bg-mentat-border-weak flex-shrink-0 flex items-center justify-center">
              {logoError ? (
                <TrendingUp className="w-4 h-4 text-gold" />
              ) : (
                <Image
                  src="/logo.jpg"
                  alt="mentat vision"
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  unoptimized
                  onError={() => setLogoError(true)}
                  priority
                />
              )}
            </span>
            <span className="font-bold text-mentat-text">mentat vision</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/reports/latest" active={isReportDetail}>
              最新报告
            </NavLink>
            <NavLink href="/reports" active={isReports}>
              报告归档
            </NavLink>
            <NavLink href="/#pricing" active={isPricing}>
              定价
            </NavLink>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop auth CTA */}
          <div className="hidden sm:flex items-center gap-2">
            {SKIP_CLERK ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/reports/latest"
                  className="px-4 py-1.5 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors"
                >
                  免费开始
                </Link>
              </>
            ) : (
              <>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button type="button" className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors">登录</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button type="button" className="px-4 py-1.5 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors">免费注册</button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard" className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors">个人中心</Link>
                  <UserButton />
                </Show>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-2 text-mentat-muted hover:text-mentat-text transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-mentat-border px-4 py-3 space-y-1 bg-mentat-bg">
          <Link
            href="/reports/latest"
            className="block px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text hover:bg-mentat-bg-card rounded transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            最新报告
          </Link>
          <Link
            href="/reports"
            className="block px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text hover:bg-mentat-bg-card rounded transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            报告归档
          </Link>
          <Link
            href="/#pricing"
            className="block px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text hover:bg-mentat-bg-card rounded transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            定价
          </Link>
          <div className="pt-2 border-t border-mentat-border-weak flex gap-2">
            {SKIP_CLERK ? (
              <>
                <Link href="/dashboard" className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors" onClick={() => setMobileOpen(false)}>登录</Link>
                <Link href="/reports/latest" className="flex-1 text-center px-3 py-2 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors" onClick={() => setMobileOpen(false)}>免费开始</Link>
              </>
            ) : (
              <>
                <Show when="signed-out">
                  <SignInButton mode="modal"><button type="button" className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors" onClick={() => setMobileOpen(false)}>登录</button></SignInButton>
                  <SignUpButton mode="modal"><button type="button" className="flex-1 text-center px-3 py-2 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors" onClick={() => setMobileOpen(false)}>免费注册</button></SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard" className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors" onClick={() => setMobileOpen(false)}>个人中心</Link>
                  <UserButton />
                </Show>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
