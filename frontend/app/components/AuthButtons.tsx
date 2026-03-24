'use client'

import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'

export function NavAuthButtons() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  return (
    <div className="flex items-center gap-2">
      {skipClerk ? (
        <Link href="/sign-in?redirect_url=/dashboard" className="px-4 py-1.5 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors">
          登录后开始使用
        </Link>
      ) : (
        <SignInButton mode="modal">
          <button type="button" className="px-4 py-1.5 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors">
            登录后开始使用
          </button>
        </SignInButton>
      )}
    </div>
  )
}

export function HeroAuthButtons() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  return (
    skipClerk ? (
      <Link href="/sign-in?redirect_url=/dashboard" className="px-8 py-3 bg-gold text-mentat-bg rounded hover:bg-gold-hover transition font-medium">
        登录后开始使用
      </Link>
    ) : (
      <SignInButton mode="modal">
        <button type="button" className="px-8 py-3 bg-gold text-mentat-bg rounded hover:bg-gold-hover transition font-medium">
          登录后开始使用
        </button>
      </SignInButton>
    )
  )
}

export function ObserverCardButton() {
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  return (
    skipClerk ? (
      <Link href="/sign-in?redirect_url=/reports/latest" className="block w-full mt-4 px-4 py-2 bg-gold text-mentat-bg rounded hover:bg-gold-hover transition text-center">
        登录后查看报告
      </Link>
    ) : (
      <SignInButton mode="modal">
        <button type="button" className="block w-full mt-4 px-4 py-2 bg-gold text-mentat-bg rounded hover:bg-gold-hover transition text-center">
          登录后查看报告
        </button>
      </SignInButton>
    )
  )
}

export function SignedInLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors">
      {label}
    </Link>
  )
}
