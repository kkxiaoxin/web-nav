import { getPublicFilePath } from './prefix'

export const DEFAULT_PREVIEW_PATH = '/background.webp'

export function getDefaultPreviewUrl() {
  return getPublicFilePath(DEFAULT_PREVIEW_PATH)
}

export function resolveSitePreviewUrl(link: string): string | null {
  const trimmed = link.trim()
  if (!trimmed) return null

  if (/\.md(?:[?#].*)?$/i.test(trimmed)) return null
  if (!/^https?:\/\//i.test(trimmed) && !/^\/\//.test(trimmed)) return null

  let url = trimmed
  if (url.startsWith('//')) url = `https:${url}`

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return `https://s0.wp.com/mshots/v1/${encodeURIComponent(parsed.href)}?w=800`
  } catch {
    return null
  }
}
