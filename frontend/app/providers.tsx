'use client'

import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { authApi, clearPersistedApiCache } from '@/lib/api'
import { captureAttributionIfPresent, getAttributionPayload } from '@/lib/attribution'
import { isLikelyExpiredJwt } from '@/lib/session-token'

const APP_TOKEN_STORAGE_KEY = 'mv_app_token'
const APP_USER_STORAGE_KEY = 'mv_app_user'

type AppAuthProvider = 'none' | 'phone' | 'clerk' | 'skip'
type CnLoginMode = 'sms' | 'wechat'
type CnLoginIntent = 'login' | 'link'

type AppUser = { firstName?: string | null; emailAddresses?: { emailAddress: string }[] } | null

type AppAuthValue = {
  isLoaded: boolean
  isSignedIn: boolean
  authProvider: AppAuthProvider
  getToken: (opts?: { skipCache?: boolean }) => Promise<string | null>
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

function AppTokenOnlyBridge({ children }: { children: React.ReactNode }) {
  const [appToken, setAppToken] = useState<string | null>(null)
  const [appUser, setAppUser] = useState<AppUser>(null)

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
        clearPersistedApiCache()
      }
    } catch {
      // ignore
    }
  }, [])

  const value: AppAuthValue = {
    isLoaded: true,
    // 与后端 SKIP_CLERK 一致：无 token 也视为已授权，避免仍出现「登录」入口和部分页面不拉数
    isSignedIn: true,
    authProvider: appToken ? 'phone' : 'skip',
    getToken: async (_opts?: { skipCache?: boolean }) => {
      if (appToken && isLikelyExpiredJwt(appToken)) {
        persistAppSession(null, null)
        return null
      }
      return appToken
    },
    clearSession: async () => persistAppSession(null, null),
    signInWithAppToken: async (token: string, user: AppUser) => {
      persistAppSession(token, user)
    },
    exchangeExternalToken: async () => undefined,
    startCnLogin: () => undefined,
    user: appUser ?? { firstName: '本地用户', emailAddresses: [] },
  }

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
}

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const { user } = useUser()
  const [appToken, setAppToken] = useState<string | null>(null)
  const [appUser, setAppUser] = useState<AppUser>(null)
  const exchangeAttemptedRef = useRef(false)
  const exchangeRetryOnceRef = useRef(false)
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
        clearPersistedApiCache()
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

  // Clerk 登录后尝试 exchange（归因 / 可选 app_token）。不要用本地 app_token 短路：
  // 否则用户先手机号登录再谷歌登录时，旧 app_token 会阻止 exchange，且旧 token 还会导致 API 401。
  useEffect(() => {
    if (!auth.isLoaded) return
    if (!auth.isSignedIn) {
      exchangeAttemptedRef.current = false
      exchangeRetryOnceRef.current = false
      return
    }
    if (exchangeAttemptedRef.current) return
    exchangeAttemptedRef.current = true

    authGetTokenRef.current().then((token) => {
      if (!token) return
      exchangeExternalToken(token).catch(() => {
        if (exchangeRetryOnceRef.current) return
        exchangeRetryOnceRef.current = true
        exchangeAttemptedRef.current = false
        window.setTimeout(() => {
          authGetTokenRef.current().then((t) => {
            if (!t) return
            exchangeAttemptedRef.current = true
            exchangeExternalToken(t).catch(() => undefined)
          })
        }, 1600)
      })
    })
  }, [auth.isLoaded, auth.isSignedIn, exchangeExternalToken])

  const clearSession = useCallback(async () => {
    exchangeAttemptedRef.current = false
    exchangeRetryOnceRef.current = false
    persistAppSession(null, null)
    if (auth.isSignedIn) {
      await auth.signOut()
    }
  }, [auth, persistAppSession])

  // Clerk 已登录时必须优先用 Clerk JWT。若仍优先返回 localStorage 里的旧 app_token（手机号会话），
  // 多为过期 HS256，后端会 401，表现为已登录但全站报告接口拉不到数据。
  const getToken = useCallback(
    async (opts?: { skipCache?: boolean }) => {
      if (auth.isSignedIn) {
        try {
          const getClerk = authGetTokenRef.current as (p?: { skipCache?: boolean }) => Promise<string | null>
          const clerkJwt = await getClerk(opts?.skipCache ? { skipCache: true } : undefined)
          if (clerkJwt) return clerkJwt
        } catch {
          // ignore
        }
      }
      if (appToken) {
        if (isLikelyExpiredJwt(appToken)) {
          persistAppSession(null, null)
          return null
        }
        return appToken
      }
      return null
    },
    [appToken, auth.isSignedIn, persistAppSession],
  )

  const value: AppAuthValue = {
    isLoaded: auth.isLoaded,
    isSignedIn: !!appToken || !!auth.isSignedIn,
    authProvider: auth.isSignedIn ? 'clerk' : appToken ? 'phone' : 'none',
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
  const skipClerk = process.env.NEXT_PUBLIC_SKIP_CLERK === 'true'
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL

  if (skipClerk) {
    return <AppTokenOnlyBridge>{children}</AppTokenOnlyBridge>
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      proxyUrl={proxyUrl || undefined}
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  )
}
