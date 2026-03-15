'use client'

import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export function NavAuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button type="button" className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors">
          登录
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button type="button" className="px-4 py-1.5 bg-gold text-mentat-bg rounded font-semibold text-sm hover:bg-gold-hover transition-colors">
          免费开始
        </button>
      </SignUpButton>
    </div>
  )
}

export function HeroAuthButtons() {
  return (
    <SignUpButton mode="modal">
      <button type="button" className="px-8 py-3 bg-gold text-mentat-bg rounded hover:bg-gold-hover transition font-medium">
        免费开始
      </button>
    </SignUpButton>
  )
}

export function ObserverCardButton() {
  return (
    <SignUpButton mode="modal">
      <button type="button" className="block w-full mt-4 px-4 py-2 bg-gold text-mentat-bg rounded hover:bg-gold-hover transition text-center">
        查看报告
      </button>
    </SignUpButton>
  )
}

export function SignedInLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="px-3 py-1.5 text-sm text-mentat-muted hover:text-mentat-text rounded transition-colors">
      {label}
    </Link>
  )
}
