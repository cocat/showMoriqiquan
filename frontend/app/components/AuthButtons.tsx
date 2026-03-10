'use client'

import Link from 'next/link'

export function NavAuthButtons() {
  return <span className="text-[#666] text-xs">认证已关闭</span>
}

export function HeroAuthButtons() {
  return (
    <Link href="/reports" className="px-8 py-3 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition font-medium">
      查看报告
    </Link>
  )
}

export function ObserverCardButton() {
  return (
    <Link href="/reports" className="block w-full mt-4 px-4 py-2 bg-[#C19A6B] text-[#1A1A1B] rounded hover:bg-[#d4af7a] transition text-center">
      查看报告
    </Link>
  )
}
