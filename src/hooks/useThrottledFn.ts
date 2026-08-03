import { useRef, useCallback } from 'react'
import type { AnyFunction } from '@/types/global'

import { useLatest } from './useLatest'
import { useUnmount } from './useUnmount'

type UseThrottleFnOptions = {
  wait?: number // 节流间隔，默认 1000ms
  leading?: boolean // 是否在间隔开始时立即执行，默认 true 确保获取第一次
  trailing?: boolean // 是否在间隔结束后执行最后一次调用，默认 true  确保能获取最后一次
}

export function useThrottleFn<T extends AnyFunction>(
  fn: T,
  options?: UseThrottleFnOptions
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true, wait = 500 } = options || {}
  const fnRef = useLatest(fn)

  const lastCallTime = useRef<number>(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgs = useRef<Parameters<T> | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
    }
  }, [])

  const run = useCallback(
    (...args: Parameters<T>) => {
      clearTimer()
      const now = Date.now()
      const timeSinceLastCall = now - lastCallTime.current
      lastArgs.current = args

      // 首次调用或间隔已满：开启新一轮
      if (lastCallTime.current === 0 || timeSinceLastCall >= wait) {
        if (leading) {
          // leading：新一轮开始立即执行，确保获取第一次
          lastCallTime.current = now
          fnRef.current(...args)
        } else if (trailing) {
          // leading=false：新一轮开始不立即执行，延迟一个间隔由 trailing 执行
          timer.current = setTimeout(() => {
            lastCallTime.current = Date.now()
            fnRef.current(...lastArgs.current!)
          }, wait)
        }
        return
      }

      // 间隔内：trailing=true 时延迟补发最后一次，否则丢弃
      if (trailing) {
        timer.current = setTimeout(() => {
          lastCallTime.current = Date.now()
          fnRef.current(...lastArgs.current!)
        }, wait - timeSinceLastCall)
      }
    },
    [leading, trailing, wait]
  )

  useUnmount(() => {
    clearTimer()
  })

  return run
}
