import { getPublicFilePath } from './prefix'

export const LATENCY_FAST_MAX = 500
export const LATENCY_MODERATE_MAX = 1000
export const DEFAULT_LATENCY_TIMEOUT = 3000
export const MAX_LATENCY_CONCURRENT = 12

const latencyCache = new Map<string, { ok: boolean; ms: number | null }>()
const latencyInflight = new Map<string, Promise<{ ok: boolean; ms: number | null }>>()
let activeLatencyCount = 0
const latencyWaitQueue: Array<() => void> = []

function runWithLatencyQueue<T>(task: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const run = async () => {
      activeLatencyCount += 1
      try {
        resolve(await task())
      } catch (error) {
        reject(error)
      } finally {
        activeLatencyCount -= 1
        const next = latencyWaitQueue.shift()
        if (next) next()
      }
    }

    if (activeLatencyCount < MAX_LATENCY_CONCURRENT) run()
    else latencyWaitQueue.push(run)
  })
}

export function getLatencyTier(ms: number | null) {
  if (ms == null || ms < 0) return 'unreachable'
  if (ms <= LATENCY_FAST_MAX) return 'fast'
  if (ms <= LATENCY_MODERATE_MAX) return 'moderate'
  return 'slow'
}

export function resolvePingUrl(link: string) {
  if (!link || typeof link !== 'string') return ''
  const trimmed = link.trim()
  if (!trimmed || /^(mailto|tel):/i.test(trimmed)) return ''
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
  return getPublicFilePath(trimmed.replace(/^\.\//, ''))
}

function isSameOriginUrl(url: string) {
  try {
    return new URL(url, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}

async function probeUrl(url: string, timeoutMs: number) {
  const sameOrigin = isSameOriginUrl(url)
  const attempts: RequestInit[] = sameOrigin
    ? [{ method: 'GET', mode: 'same-origin' }]
    : [
        { method: 'HEAD', mode: 'no-cors' },
        { method: 'GET', mode: 'no-cors' }
      ]

  const start = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const tasks = attempts.map((attempt) =>
    fetch(url, { ...attempt, cache: 'no-store', signal: controller.signal })
      .then(() => {
        controller.abort()
        return { ok: true, ms: Math.round(performance.now() - start) }
      })
      .catch(() => null)
  )

  try {
    const results = await Promise.all(tasks)
    clearTimeout(timer)
    return results.find((result) => result?.ok) ?? { ok: false, ms: null }
  } catch {
    clearTimeout(timer)
    return { ok: false, ms: null }
  }
}

export async function measureLinkLatency(url: string, options: { timeoutMs?: number; force?: boolean } = {}) {
  if (!url) return { ok: false, ms: null }
  const timeoutMs = options.timeoutMs ?? DEFAULT_LATENCY_TIMEOUT
  const force = options.force ?? false

  if (!force && latencyCache.has(url)) return latencyCache.get(url)!
  if (!force && latencyInflight.has(url)) return latencyInflight.get(url)!

  const task = runWithLatencyQueue(() => probeUrl(url, timeoutMs))
    .then((result) => {
      latencyCache.set(url, result)
      return result
    })
    .finally(() => {
      latencyInflight.delete(url)
    })

  latencyInflight.set(url, task)
  return task
}
