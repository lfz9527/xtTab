import { useRef } from 'react'

// 用于获取最新的值，避免闭包问题
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}
