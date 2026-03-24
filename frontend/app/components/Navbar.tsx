'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { TrendingUp, Menu, X, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppAuth } from '@/app/providers'
import { SignInButton } from '@clerk/nextjs'

function NavLink({
  href,
  active,
  children,
  onClick,
  disabled,
}: {
  href: string
  active: boolean
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-disabled={disabled}
      className={`px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'text-gold bg-gold-dim'
          : 'text-mentat-muted hover:text-mentat-text hover:bg-mentat-bg-card'
      } ${disabled ? 'pointer-events-none opacity-70' : ''}`}
    >
      {children}
    </Link>
  )
}

export default function Navbar() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const pathname = usePathname()
  const { isSignedIn, clearSession } = useAppAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [archiveNavigating, setArchiveNavigating] = useState(false)

  const isReportDetail =
    pathname.startsWith('/reports/') && pathname !== '/reports' && pathname !== '/reports/latest'
  const isLatestReport = pathname === '/reports/latest' || isReportDetail
  const isReports = pathname === '/reports'
  const isPricing = pathname === '/pricing'

  useEffect(() => {
    setArchiveNavigating(false)
  }, [pathname])

  return (
    <nav className="border-b border-mentat-border bg-mentat-bg/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-2">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3 flex-shrink-0 mr-4">
            <span className="relative w-9 h-9 rounded-full p-[1.5px] bg-[conic-gradient(from_210deg_at_50%_50%,#7F5A2A_0deg,#D4A55A_120deg,#F1D7A0_190deg,#A7763D_280deg,#7F5A2A_360deg)] shadow-[0_0_0_1px_rgba(212,165,90,0.35),0_10px_24px_-14px_rgba(212,165,90,0.7)] flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.02]">
              <span className="absolute inset-[2px] rounded-full bg-gradient-to-br from-[#1E222D] via-[#141821] to-[#0D0F14]" />
              <span className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center ring-1 ring-white/10">
                {logoError ? (
                  <TrendingUp className="w-4 h-4 text-gold" />
                ) : (
                  <Image
                    src="/logo.jpg"
                    alt="门塔特的视界 logo"
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                    unoptimized
                    onError={() => setLogoError(true)}
                    priority
                  />
                )}
              </span>
              <span className="absolute inset-[1px] rounded-full ring-1 ring-gold/35" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-[0.01em] text-mentat-text">门塔特的视界</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-[#AFA08A]">MENTAT VISION</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink href="/reports/latest" active={isLatestReport}>
              最新报告
            </NavLink>
            <NavLink
              href="/reports"
              active={isReports}
              onClick={() => setArchiveNavigating(true)}
              disabled={archiveNavigating}
            >
              {archiveNavigating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  打开中...
                </span>
              ) : (
                '历史报告'
              )}
            </NavLink>
            <NavLink href="/#pricing" active={isPricing}>
              使用方式
            </NavLink>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop auth CTA */}
          <div className="hidden sm:flex items-center gap-2">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors"
                >
                  个人中心
                </Link>
                <button
                  type="button"
                  onClick={() => clearSession()}
                  className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors border border-mentat-border"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                {/* 首页手机号登录入口先下掉，暂时保留代码不删除
                <Link
                  href="/sign-in?redirect_url=/dashboard"
                  className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors"
                >
                  手机号登录
                </Link>
                */}
                {skipClerk ? (
                  <Link
                    href="/sign-in?redirect_url=/dashboard"
                    className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors"
                  >
                    登录
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors"
                    >
                      登录
                    </button>
                  </SignInButton>
                )}
                <Link
                  href="/reports/latest"
                  className="px-4 py-1.5 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors"
                >
                  查看今日
                </Link>
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
            className={`block px-3 py-2 text-sm rounded transition-colors ${
              archiveNavigating
                ? 'text-mentat-muted pointer-events-none opacity-70'
                : 'text-mentat-muted hover:text-mentat-text hover:bg-mentat-bg-card'
            }`}
            onClick={() => {
              setArchiveNavigating(true)
              setMobileOpen(false)
            }}
          >
            {archiveNavigating ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                打开中...
              </span>
            ) : (
              '历史报告'
            )}
          </Link>
          <Link
            href="/#pricing"
            className="block px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text hover:bg-mentat-bg-card rounded transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            使用方式
          </Link>
          <div className="pt-2 border-t border-mentat-border-weak flex gap-2">
            {isSignedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  个人中心
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearSession().finally(() => setMobileOpen(false))
                  }}
                  className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                {/* 首页手机号登录入口先下掉，暂时保留代码不删除
                <Link
                  href="/sign-in?redirect_url=/dashboard"
                  className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  手机号登录
                </Link>
                */}
                {skipClerk ? (
                  <Link
                    href="/sign-in?redirect_url=/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors"
                  >
                    登录
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center px-3 py-2 text-sm text-mentat-muted hover:text-mentat-text border border-mentat-border rounded transition-colors"
                    >
                      登录
                    </button>
                  </SignInButton>
                )}
                <Link
                  href="/reports/latest"
                  className="flex-1 text-center px-3 py-2 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  查看今日
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
