/**
 * mentat vision API 客户端（持久缓存，localStorage）
 */

const DEFAULT_API_URL =
  process.env.NODE_ENV === 'production' ? 'https://www.mentat.hk' : 'http://localhost:8000'
const API_URL_CONFIGURED = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

function resolveApiUrlBase(): string {
  // SSR 仍使用配置地址，避免 Node 环境相对地址 fetch 报错
  if (typeof window === 'undefined') return API_URL_CONFIGURED

  // 在 mentat.hk/www.mentat.hk 间统一走同源，避免跨域预检和重定向
  const currentHost = window.location.hostname
  if (currentHost === 'mentat.hk' || currentHost === 'www.mentat.hk') {
    try {
      const configuredHost = new URL(API_URL_CONFIGURED).hostname
      if (configuredHost === 'mentat.hk' || configuredHost === 'www.mentat.hk') {
        return ''
      }
    } catch {
      return ''
    }
  }

  return API_URL_CONFIGURED
}

function apiUrl(path: string): string {
  const base = resolveApiUrlBase()
  return base ? `${base}${path}` : path
}

export type AttributionPayload = {
  domain?: string | null
  landing_url?: string | null
  referrer?: string | null
  referrer_host?: string | null
  platform?: string | null
  source?: string | null
  medium?: string | null
  campaign?: string | null
  content?: string | null
  term?: string | null
  captured_at?: string | null
}

const CACHE_PREFIX = 'mv_api:'
const DEFAULT_TTL = 60 * 1000 // 1 分钟
const REPORT_TTL = 5 * 60 * 1000 // 5 分钟（报告详情）
const CALENDAR_TTL = 10 * 60 * 1000 // 10 分钟（日历）
const REPORT_LIST_TTL = 3 * 60 * 1000 // 3 分钟（归档列表）
const LATEST_SUMMARY_TTL = 3 * 60 * 1000 // 3 分钟（最新摘要；与报告类接口同一量级，减少重复请求）

function getStorageKey(key: string) {
  return CACHE_PREFIX + key
}

function persistGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getStorageKey(key))
    if (!raw) return null
    const { data, expires } = JSON.parse(raw) as { data: T; expires: number }
    if (expires <= Date.now()) return null
    return data
  } catch {
    return null
  }
}

function persistSet(key: string, data: unknown, ttl: number): void {
  if (typeof window === 'undefined') return
  try {
    const entry = { data, expires: Date.now() + ttl }
    localStorage.setItem(getStorageKey(key), JSON.stringify(entry))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))
        if (keys.length > 0) {
          localStorage.removeItem(keys[0])
          persistSet(key, data, ttl)
        }
      } catch {
        // 写入失败则放弃缓存
      }
    }
  }
}

function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
  opts?: { bypassCache?: boolean }
): Promise<T> {
  if (!opts?.bypassCache) {
    const cached = persistGet<T>(key)
    if (cached != null) return Promise.resolve(cached)
  }
  return fetcher().then((data) => {
    persistSet(key, data, ttl)
    return data
  })
}

function getHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export function isNetworkError(e: unknown): boolean {
  return (
    (e as { message?: string }).message?.includes('fetch') ||
    (e as { code?: string }).code === 'ECONNREFUSED' ||
    (e as { code?: string }).code === 'ENOTFOUND'
  )
}

export const reportsApi = {
  list: (page = 1, pageSize = 20, token?: string | null, scope: 'archive' | 'all' = 'archive') =>
    cachedFetch(`reports:list:${scope}:${page}:${pageSize}:${token ?? ''}`, async () => {
      const res = await fetch(
        apiUrl(`/api/reports/?page=${page}&page_size=${pageSize}&scope=${scope}`),
        { headers: getHeaders(token) }
      )
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, REPORT_LIST_TTL),

  get: (reportId: string, token?: string | null) =>
    cachedFetch(`reports:get:${reportId}:${token ?? ''}`, async () => {
      const res = await fetch(apiUrl(`/api/reports/${reportId}`), {
        headers: getHeaders(token),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, REPORT_TTL),

  getFull: (reportId: string, token?: string | null) =>
    cachedFetch(`reports:full:${reportId}:${token ?? ''}`, async () => {
      const res = await fetch(apiUrl(`/api/reports/${reportId}/full`), {
        headers: getHeaders(token),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, REPORT_TTL),

  getByDate: (date: string, token?: string | null) =>
    cachedFetch(`reports:date:${date}:${token ?? ''}`, async () => {
      const res = await fetch(apiUrl(`/api/reports/date/${date}`), {
        headers: getHeaders(token),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, REPORT_TTL),

  getCalendar: (year: number, month: number, token?: string | null) =>
    cachedFetch(`reports:calendar:${year}:${month}:${token ?? ''}`, async () => {
      const res = await fetch(
        apiUrl(`/api/reports/calendar?year=${year}&month=${month}`),
        { headers: getHeaders(token) }
      )
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }, CALENDAR_TTL),

  latestSummary: (token?: string | null, opts?: { forceRefresh?: boolean }) =>
    cachedFetch(`reports:latest:${token ?? ''}`, async () => {
      const res = await fetch(apiUrl('/api/reports/latest/summary'), {
        headers: getHeaders(token),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const json = await res.json()
      return json.report != null ? json.report : json
    }, LATEST_SUMMARY_TTL, { bypassCache: opts?.forceRefresh }),

  latestSummaryBundle: (token?: string | null, opts?: { forceRefresh?: boolean }) =>
    cachedFetch(`reports:latest:bundle:${token ?? ''}`, async () => {
      const res = await fetch(apiUrl('/api/reports/latest/summary'), {
        headers: getHeaders(token),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json() as Promise<{ report?: unknown; overview_teaser?: string }>
    }, LATEST_SUMMARY_TTL, { bypassCache: opts?.forceRefresh }),
}

export const paymentsApi = {
  checkout: (plan: string, token: string | null) =>
    fetch(apiUrl('/api/payments/checkout'), {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ plan }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail || `API error: ${res.status}`)
      }
      return res.json() as Promise<{ checkout_url: string; order_id: string }>
    }),
}

export const usersApi = {
  stats: (token?: string | null) =>
    cachedFetch(`users:stats:${token ?? ''}`, async () => {
      const res = await fetch(apiUrl('/api/users/me'), {
        headers: getHeaders(token),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      return res.json()
    }),
}

export const authApi = {
  exchange: (token: string, attribution?: AttributionPayload | null) =>
    fetch(apiUrl('/api/auth/exchange'), {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ token, attribution: attribution || undefined }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail || `API error: ${res.status}`)
      }
      return res.json() as Promise<{
        provider: string
        app_token: string | null
        user: {
          user_id: string
          email?: string | null
          phone?: string | null
          display_name?: string | null
          tier: string
          subscription_end?: string | null
        }
      }>
    }),

  identities: (token: string) =>
    fetch(apiUrl('/api/auth/identities'), {
      method: 'GET',
      headers: getHeaders(token),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail || `API error: ${res.status}`)
      }
      return res.json() as Promise<{
        user: {
          user_id: string
          email?: string | null
          phone?: string | null
          display_name?: string | null
          tier: string
          subscription_end?: string | null
        }
        identities: Array<{
          provider: string
          provider_user_id: string
          email?: string | null
          phone?: string | null
          created_at: string
        }>
      }>
    }),

  link: (token: string, currentToken: string) =>
    fetch(apiUrl('/api/auth/link'), {
      method: 'POST',
      headers: getHeaders(currentToken),
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail || `API error: ${res.status}`)
      }
      return res.json() as Promise<{
        status: string
        provider: string
      }>
    }),

  phoneSend: (phone: string) =>
    fetch(apiUrl('/api/auth/phone/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail || `API error: ${res.status}`)
      }
      return res.json() as Promise<{ ok: boolean; debug_otp?: string | null }>
    }),

  phoneVerify: (phone: string, otp: string, attribution?: AttributionPayload | null) =>
    fetch(apiUrl('/api/auth/phone/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, attribution: attribution || undefined }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { detail?: string }).detail || `API error: ${res.status}`)
      }
      return res.json() as Promise<{
        ok: boolean
        app_token: string | null
        user: {
          user_id: string
          email?: string | null
          phone?: string | null
          display_name?: string | null
          tier: string
          subscription_end?: string | null
        }
      }>
    }),
}
