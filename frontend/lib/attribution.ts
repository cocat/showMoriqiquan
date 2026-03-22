'use client'

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

const FIRST_TOUCH_KEY = 'mv_attribution_first_touch'
const LAST_TOUCH_KEY = 'mv_attribution_last_touch'

function parseSourceAliasMap(): Record<string, string> {
  const raw = process.env.NEXT_PUBLIC_ATTR_SOURCE_ALIASES
  if (!raw) return {}
  try {
    const data = JSON.parse(raw) as Record<string, string>
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()])
    )
  } catch {
    return {}
  }
}

const SOURCE_ALIAS_MAP = parseSourceAliasMap()

function normalizeSourceToPlatform(source: string | null): string | null {
  if (!source) return null
  const key = source.toLowerCase()
  return SOURCE_ALIAS_MAP[key] || key
}

function parseHost(urlText: string | null | undefined): string | null {
  if (!urlText) return null
  try {
    return new URL(urlText).hostname.toLowerCase()
  } catch {
    return null
  }
}

function inferPlatform(referrerHost: string | null, source: string | null): string {
  const mapped = normalizeSourceToPlatform(source)
  if (mapped) return mapped

  const host = (referrerHost || '').toLowerCase()

  if (!host) return 'direct'
  if (host.includes('xiaohongshu.com')) return 'xiaohongshu'
  if (host.includes('weixin.qq.com') || host.includes('wechat.com')) return 'wechat'
  if (host.includes('douyin.com') || host.includes('tiktok.com')) return 'douyin'
  if (host.includes('bilibili.com')) return 'bilibili'
  if (host.includes('zhihu.com')) return 'zhihu'
  if (host.includes('x.com') || host.includes('twitter.com') || host.includes('t.co')) return 'x'
  if (host.includes('google.')) return 'google'
  if (host.includes('baidu.com')) return 'baidu'
  if (host.includes('bing.com')) return 'bing'
  return 'referral'
}

function readStorage(key: string): AttributionPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as AttributionPayload
  } catch {
    return null
  }
}

function writeStorage(key: string, value: AttributionPayload): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

export function captureAttributionIfPresent(): AttributionPayload | null {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  const referrer = document.referrer || null
  const referrerHost = parseHost(referrer)

  const utmSource = url.searchParams.get('utm_source')
  const source = url.searchParams.get('s') || url.searchParams.get('source') || utmSource
  const medium = url.searchParams.get('medium') || url.searchParams.get('utm_medium')
  const campaign = url.searchParams.get('campaign') || url.searchParams.get('utm_campaign')
  const content = url.searchParams.get('content') || url.searchParams.get('utm_content')
  const term = url.searchParams.get('term') || url.searchParams.get('utm_term')
  const fromPlatform = url.searchParams.get('from_platform')

  const hasAttributionParams =
    !!source ||
    !!medium ||
    !!campaign ||
    !!content ||
    !!term ||
    !!fromPlatform ||
    !!referrer

  if (!hasAttributionParams) {
    return readStorage(LAST_TOUCH_KEY) || readStorage(FIRST_TOUCH_KEY)
  }

  const payload: AttributionPayload = {
    domain: window.location.hostname || null,
    landing_url: window.location.href,
    referrer,
    referrer_host: referrerHost,
    platform:
      normalizeSourceToPlatform(fromPlatform) ||
      inferPlatform(referrerHost, source),
    source: source || undefined,
    medium: medium || undefined,
    campaign: campaign || undefined,
    content: content || undefined,
    term: term || undefined,
    captured_at: new Date().toISOString(),
  }

  const firstTouch = readStorage(FIRST_TOUCH_KEY)
  if (!firstTouch) {
    writeStorage(FIRST_TOUCH_KEY, payload)
  }
  writeStorage(LAST_TOUCH_KEY, payload)
  return payload
}

export function getAttributionPayload(): AttributionPayload | null {
  if (typeof window === 'undefined') return null
  return (
    captureAttributionIfPresent() ||
    readStorage(LAST_TOUCH_KEY) ||
    readStorage(FIRST_TOUCH_KEY)
  )
}
