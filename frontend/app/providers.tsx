'use client'

import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs'
import React, { createContext, useContext } from 'react'

const SKIP_CLERK = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'

type AppAuthValue = {
  getToken: () => Promise<string | null>
  isSignedIn: boolean
  user: { firstName?: string | null; emailAddresses?: { emailAddress: string }[] } | null
}

const skipValues: AppAuthValue = {
  getToken: async () => null,
  isSignedIn: false,
  user: null,
}

const AppAuthContext = React.createContext<AppAuthValue>(skipValues)

export function useAppAuth(): AppAuthValue {
  return useContext(AppAuthContext)
}

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const { user } = useUser()
  const value: AppAuthValue = {
    getToken: auth.getToken,
    isSignedIn: !!auth.isSignedIn,
    user: user ? { firstName: user.firstName, emailAddresses: user.emailAddresses } : null,
  }
  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (SKIP_CLERK) {
    return (
      <AppAuthContext.Provider value={skipValues}>
        {children}
      </AppAuthContext.Provider>
    )
  }
  return (
    <ClerkProvider>
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  )
}
