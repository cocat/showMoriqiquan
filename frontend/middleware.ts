import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'

export default skipClerk
  ? () => NextResponse.next()
  : clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
