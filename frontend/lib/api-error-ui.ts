/**
 * 将 `throwApiResponseError` 等产生的 `Error.message` 转为适合直接展示给用户的文案。
 */
const API_ERROR_RE = /^API error:\s*(\d{3})(?::\s*(.+))?$/i

export function formatApiErrorForUser(error: unknown, fallback: string): string {
  const raw = String((error as { message?: string })?.message ?? '').trim()
  if (!raw) return fallback

  const m = raw.match(API_ERROR_RE)
  if (!m) return raw

  const code = m[1]
  const detail = m[2]?.trim()
  if (detail) {
    if (/database host could not be resolved/i.test(detail)) {
      return '数据库地址无法解析，请检查 DATABASE_URL 或本机 DNS 配置。'
    }
    if (/database connection timed out/i.test(detail)) {
      return '数据库连接超时，请检查当前网络或数据库白名单配置。'
    }
    if (/database connection was refused/i.test(detail)) {
      return '数据库连接被拒绝，请确认数据库实例可访问。'
    }
    if (/database temporarily unavailable/i.test(detail)) {
      return '数据库暂时不可用，请稍后再试。'
    }
    return detail
  }

  switch (code) {
    case '401':
    case '403':
      return '登录已失效，请重新登录后再试。'
    case '404':
      return '请求的内容不存在。'
    case '429':
      return '操作过于频繁，请稍后再试。'
    default:
      if (code.startsWith('5')) return '服务暂时不可用，请稍后再试。'
      return fallback
  }
}
