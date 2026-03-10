/**
 * mentat vision API 客户端
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  list: async (page = 1, pageSize = 20, token?: string | null) => {
    const res = await fetch(
      `${API_URL}/api/reports/?page=${page}&page_size=${pageSize}`,
      { headers: getHeaders(token) }
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  get: async (reportId: string, token?: string | null) => {
    const res = await fetch(`${API_URL}/api/reports/${reportId}`, {
      headers: getHeaders(token),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  getFull: async (reportId: string, token?: string | null) => {
    const res = await fetch(`${API_URL}/api/reports/${reportId}/full`, {
      headers: getHeaders(token),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  getByDate: async (date: string, token?: string | null) => {
    const res = await fetch(`${API_URL}/api/reports/date/${date}`, {
      headers: getHeaders(token),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  getCalendar: async (year: number, month: number, token?: string | null) => {
    const res = await fetch(
      `${API_URL}/api/reports/calendar?year=${year}&month=${month}`,
      { headers: getHeaders(token) }
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  latestSummary: async (token?: string | null) => {
    const res = await fetch(`${API_URL}/api/reports/latest/summary`, {
      headers: getHeaders(token),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },
}

export const usersApi = {
  stats: async (token?: string | null) => {
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: getHeaders(token),
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },
}
