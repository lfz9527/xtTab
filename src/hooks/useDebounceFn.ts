import { useCallback, useRef } from 'react'
import type { AnyFunction } from '@/types/global'

import { useUnmount } from './useUnmount'
import { useLatest } from './useLatest'

export type UseDebounceFnReturn<T extends AnyFunction> = {
  run: (...args: Parameters<T>) => void
  cancel: () => void
  flush: () => void
}

export type UseDebounceFnOptions = {
  leading?: boolean
  trailing?: boolean
  delay?: number
}

/**
 *
 * @param fn 执行函数
 * @param {boolean} [options.trailing=true] - 是否在延迟结束时执行，默认 true
 * @param {boolean} [options.leading=false] - 是否在延迟开始时立即执行，默认 false
 * @returns
 */
export function useDebounceFn<T extends AnyFunction>(
  fn: T,
  options: UseDebounceFnOptions = {}
): UseDebounceFnReturn<T> {
  const { leading = false, trailing = true, delay = 300 } = options
  const fnRef = useLatest<T>(fn)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgsRef = useRef<Parameters<T> | null>(null)
  const isLeadingCalledRef = useRef(false)

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    isLeadingCalledRef.current = false
    lastArgsRef.current = null
  }, [])

  const flush = useCallback(() => {
    if (timerRef.current && lastArgsRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      fnRef.current(...lastArgsRef.current)
      lastArgsRef.current = null
      isLeadingCalledRef.current = false
    }
  }, [])

  const run = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args
      // leading：第一次调用立即执行
      if (leading && !isLeadingCalledRef.current) {
        isLeadingCalledRef.current = true
        fnRef.current(...args)
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null
        isLeadingCalledRef.current = false

        // trailing：延迟结束后执行
        if (trailing) {
          // leading + trailing 同时开启时，leading 已执行则跳过 trailing 避免重复
          if (leading) return
          fnRef.current(...(lastArgsRef.current ?? args))
        }
      }, delay)
    },
    [delay, leading, trailing]
  )

  useUnmount(() => {
    cancel()
  })

  return {
    cancel,
    run,
    flush,
  }
}
