/**
 * 客户端 JWT exp 检查（不验证签名，仅用于丢弃明显过期的 app_token，避免「仍显示已登录但全站 401」）
 */
export function isLikelyExpiredJwt(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return false
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { exp?: unknown }
    const exp = payload.exp
    if (typeof exp !== 'number') return false
    const skewMs = 30_000
    return exp * 1000 < Date.now() + skewMs
  } catch {
    return false
  }
}

export function isAuthApiError(error: unknown): boolean {
  const message = (error as { message?: string })?.message || ''
  return /API error:\s*(401|403)/.test(message)
}

type GetTokenFn = (opts?: { skipCache?: boolean }) => Promise<string | null>

/** 401/403 时用 skipCache 再取一次 token 并重试（缓解 Clerk 会话 token 缓存过期） */
export async function withTokenRetry<T>(getToken: GetTokenFn, run: (token: string | null) => Promise<T>): Promise<T> {
  const t1 = await getToken()
  try {
    return await run(t1)
  } catch (e) {
    if (!isAuthApiError(e)) throw e
    const t2 = await getToken({ skipCache: true })
    if (t2 === t1) throw e
    return await run(t2)
  }
}
