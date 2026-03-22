import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'

const SKIP_CLERK = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
const clerkBaseProxy = clerkMiddleware()

export async function proxy(
  req: NextRequest,
  event: NextFetchEvent
) {
  if (SKIP_CLERK) {
    return NextResponse.next()
  }
  // Only inject Clerk context; route protection is handled elsewhere.
  return clerkBaseProxy(req, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
