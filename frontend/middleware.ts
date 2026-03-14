import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const SKIP_CLERK = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
const isProtectedRoute = createRouteMatcher(['/dashboard'])

const clerkWithProtection = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export default async function middleware(
  req: NextRequest,
  event: unknown
) {
  if (SKIP_CLERK) {
    return NextResponse.next()
  }
  return clerkWithProtection(req, event as { waitUntil: (p: Promise<unknown>) => void })
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
