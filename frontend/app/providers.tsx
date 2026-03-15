'use client'

import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs'
import React, { useContext } from 'react'

const SKIP_CLERK = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'

type AppAuthValue = {
  isLoaded: boolean
  isSignedIn: boolean
  getToken: () => Promise<string | null>
  user: { firstName?: string | null; emailAddresses?: { emailAddress: string }[] } | null
}

const skipValues: AppAuthValue = {
  isLoaded: true,
  isSignedIn: false,
  getToken: async () => null,
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
    isLoaded: auth.isLoaded,
    isSignedIn: !!auth.isSignedIn,
    getToken: auth.getToken,
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
