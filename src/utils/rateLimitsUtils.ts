import { RateLimitError } from 'openai'

export const CONCURRENCY = 7
export const MAX_RATE_LIMIT_RETRIES = 15

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createCooldown() {
  let until = 0

  return {
    async wait() {
      const wait = until - Date.now()
      if (wait > 0) {
        await sleep(wait)
      }
    },
    extend(ms: number) {
      until = Math.max(until, Date.now() + ms)
    },
  }
}

export function retryAfterMs(error: RateLimitError): number {
  const fromMs = Number(error.headers.get('retry-after-ms'))
  if (Number.isFinite(fromMs) && fromMs >= 0) {
    return fromMs
  }

  const fromSeconds = Number(error.headers.get('retry-after'))
  if (Number.isFinite(fromSeconds) && fromSeconds >= 0) {
    return fromSeconds * 1000
  }

  return 1000
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const index = nextIndex++
      if (index >= items.length) {
        return
      }
      results[index] = await fn(items[index])
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}
