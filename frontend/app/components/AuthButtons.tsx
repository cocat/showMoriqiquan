'use client'

import Link from 'next/link'
import { useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'

export function NavAuthButtons() {
  if (skipClerk) {
    return <span className="text-[#666] text-xs">认证已关闭</span>
  }
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return <span className="text-[#999] text-sm">加载中...</span>
  if (isSignedIn) {
    return (
      <>
        <Link href="/dashboard" className="text-[#999] hover:text-[#E5E5E5]">个人中心</Link>
        <UserButton afterSignOutUrl="/" />
      </>
    )
  }
  return (
    <>
      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
        <button className="px-4 py-2 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition">登录</button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
        <button className="px-4 py-2 border border-[#3A3A3A] text-[#E5E5E5] rounded hover:border-[#C19A6B] transition">注册</button>
      </SignUpButton>
    </>
  )
}

export function HeroAuthButtons() {
  if (skipClerk) {
    return (
      <Link href="/reports" className="px-8 py-3 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition font-medium">
        查看报告
      </Link>
    )
  }
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return null
  if (isSignedIn) {
    return (
      <Link href="/reports" className="px-8 py-3 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition font-medium">
        查看报告
      </Link>
    )
  }
  return (
    <>
      <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
        <button className="px-8 py-3 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition font-medium">免费注册</button>
      </SignUpButton>
      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
        <button className="px-8 py-3 border-2 border-[#3A3A3A] text-[#E5E5E5] rounded hover:border-[#C19A6B] transition font-medium">登录</button>
      </SignInButton>
    </>
  )
}

export function ObserverCardButton() {
  if (skipClerk) {
    return (
      <Link href="/reports" className="block w-full mt-4 px-4 py-2 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition text-center">
        查看报告
      </Link>
    )
  }
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return <span className="text-[#999] text-sm mt-4 block">加载中...</span>
  if (isSignedIn) {
    return (
      <Link href="/dashboard" className="block w-full mt-4 px-4 py-2 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition text-center">
        进入个人中心
      </Link>
    )
  }
  return (
    <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
      <button className="w-full mt-4 px-4 py-2 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition">免费注册</button>
    </SignUpButton>
  )
}
