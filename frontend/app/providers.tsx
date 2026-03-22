'use client'

import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { authApi } from '@/lib/api'
import { captureAttributionIfPresent, getAttributionPayload } from '@/lib/attribution'

const APP_TOKEN_STORAGE_KEY = 'mv_app_token'
const APP_USER_STORAGE_KEY = 'mv_app_user'

type AppAuthProvider = 'none' | 'phone' | 'clerk'
type CnLoginMode = 'sms' | 'wechat'
type CnLoginIntent = 'login' | 'link'

type AppUser = { firstName?: string | null; emailAddresses?: { emailAddress: string }[] } | null

type AppAuthValue = {
  isLoaded: boolean
  isSignedIn: boolean
  authProvider: AppAuthProvider
  getToken: () => Promise<string | null>
  clearSession: () => Promise<void>
  signInWithAppToken: (token: string, user: AppUser) => Promise<void>
  exchangeExternalToken: (token: string) => Promise<void>
  startCnLogin: (options?: {
    mode?: CnLoginMode
    intent?: CnLoginIntent
    returnUrl?: string
  }) => void
  user: AppUser
}

const skipValues: AppAuthValue = {
  isLoaded: true,
  isSignedIn: false,
  authProvider: 'none',
  getToken: async () => null,
  exchangeExternalToken: async () => undefined,
  startCnLogin: () => undefined,
  clearSession: async () => undefined,
  signInWithAppToken: async () => undefined,
  user: null,
}

const AppAuthContext = React.createContext<AppAuthValue>(skipValues)

export function useAppAuth(): AppAuthValue {
  return useContext(AppAuthContext)
}

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const { user } = useUser()
  const [appToken, setAppToken] = useState<string | null>(null)
  const [appUser, setAppUser] = useState<AppUser>(null)
  const exchangeAttemptedRef = useRef(false)
  // Clerk 的 getToken 引用常随渲染变化；放进 useCallback 依赖会导致全站 useEffect 反复触发、重复打 API
  const authGetTokenRef = useRef(auth.getToken)
  authGetTokenRef.current = auth.getToken

  useEffect(() => {
    captureAttributionIfPresent()
    try {
      const savedToken = localStorage.getItem(APP_TOKEN_STORAGE_KEY)
      if (savedToken) setAppToken(savedToken)

      const rawUser = localStorage.getItem(APP_USER_STORAGE_KEY)
      if (rawUser) setAppUser(JSON.parse(rawUser) as AppUser)
    } catch {
      // ignore localStorage failures
    }
  }, [])

  const persistAppSession = useCallback((token: string | null, nextUser: AppUser) => {
    setAppToken(token)
    setAppUser(nextUser)
    try {
      if (token) {
        localStorage.setItem(APP_TOKEN_STORAGE_KEY, token)
        localStorage.setItem(APP_USER_STORAGE_KEY, JSON.stringify(nextUser))
      } else {
        localStorage.removeItem(APP_TOKEN_STORAGE_KEY)
        localStorage.removeItem(APP_USER_STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  const signInWithAppToken = useCallback(async (token: string, user: AppUser) => {
    persistAppSession(token, user)
  }, [persistAppSession])

  const exchangeExternalToken = useCallback(async (token: string) => {
    const res = await authApi.exchange(token, getAttributionPayload())
    const nextToken = res.app_token || null
    const nextUser: AppUser = res.user
      ? { firstName: res.user.phone || '用户', emailAddresses: [] }
      : null
    if (nextToken) {
      persistAppSession(nextToken, nextUser)
    }
  }, [persistAppSession])

  // Clerk 登录后，尽量交换为 app_token；失败则仍可直接使用 Clerk token。
  useEffect(() => {
    if (!auth.isLoaded) return
    if (!auth.isSignedIn) {
      exchangeAttemptedRef.current = false
      return
    }
    if (appToken) {
      exchangeAttemptedRef.current = true
      return
    }
    if (exchangeAttemptedRef.current) return
    exchangeAttemptedRef.current = true

    authGetTokenRef.current().then((token) => {
      if (!token) return
      exchangeExternalToken(token).catch(() => undefined)
    })
  }, [auth.isLoaded, auth.isSignedIn, appToken, exchangeExternalToken])

  const clearSession = useCallback(async () => {
    exchangeAttemptedRef.current = false
    persistAppSession(null, null)
    if (auth.isSignedIn) {
      await auth.signOut()
    }
  }, [auth, persistAppSession])

  const getToken = useCallback(async () => {
    if (appToken) return appToken
    if (auth.isSignedIn) {
      return authGetTokenRef.current()
    }
    return null
  }, [appToken, auth.isSignedIn])

  const value: AppAuthValue = {
    isLoaded: auth.isLoaded,
    isSignedIn: !!appToken || !!auth.isSignedIn,
    authProvider: appToken ? 'phone' : auth.isSignedIn ? 'clerk' : 'none',
    getToken,
    clearSession,
    signInWithAppToken,
    exchangeExternalToken,
    startCnLogin: () => undefined,
    user: appUser
      ? appUser
      : auth.isSignedIn
        ? {
          firstName: user?.firstName ?? null,
          emailAddresses: user?.emailAddresses ?? [],
        }
        : null,
  }

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  )
}
