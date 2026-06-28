import { APP_CONFIG } from '../config/app'

export function normalizePrefix(prefix: string) {
  if (!prefix || prefix === '/') return ''
  return `/${String(prefix).replace(/^\/+|\/+$/g, '')}`
}

export function normalizePublicPath(filePath: string) {
  return String(filePath).trim().replace(/^\.\//, '').replace(/^\/+/, '')
}

export function getBaseUrl() {
  const viteBase = import.meta.env.BASE_URL
  if (viteBase && viteBase !== '/') {
    return viteBase.endsWith('/') ? viteBase : `${viteBase}/`
  }
  const manualPrefix = normalizePrefix(APP_CONFIG.BASE_PREFIX)
  return manualPrefix ? `${manualPrefix}/` : '/'
}

export function getBasePath() {
  return normalizePrefix(getBaseUrl())
}

function joinBasePath(relativePath: string) {
  const base = getBaseUrl()
  const pathname = `${base}${normalizePublicPath(relativePath)}`.replace(/\/{2,}/g, '/')
  return new URL(pathname, window.location.origin).href
}

export function isExternalUrl(path: string) {
  return /^(https?:)?\/\//i.test(path) || /^(mailto|tel):/i.test(path)
}

export function getPublicFilePath(filePath: string) {
  if (isExternalUrl(filePath)) return filePath
  return joinBasePath(filePath)
}

export function stripBasePath(pathname: string) {
  const basePath = getBasePath()
  const normalizedPathname = `/${normalizePublicPath(pathname)}`
  if (!basePath) return normalizedPathname
  if (normalizedPathname === basePath) return '/'
  if (normalizedPathname.startsWith(`${basePath}/`)) {
    return normalizedPathname.slice(basePath.length) || '/'
  }
  return normalizedPathname
}

export function isWithinBasePath(pathname: string) {
  const basePath = getBasePath()
  const normalizedPathname = `/${normalizePublicPath(pathname)}`
  if (!basePath) return true
  return normalizedPathname === basePath || normalizedPathname.startsWith(`${basePath}/`)
}

export function getAppPath(path: string) {
  if (isExternalUrl(path)) return path
  return `${getBaseUrl()}${normalizePublicPath(path)}`.replace(/\/{2,}/g, '/')
}
