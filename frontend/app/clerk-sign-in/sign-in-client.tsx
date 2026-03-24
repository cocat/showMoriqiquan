'use client'

import { SignIn } from '@clerk/nextjs'

export default function ClerkSignInClient() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </div>
  )
}
