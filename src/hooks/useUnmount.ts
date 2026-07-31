import { useEffect } from 'react'
import { useLatest } from './useLatest'

/**
 * 组件卸载时执行
 * @param func
 */
export function useUnmount(func: () => void) {
  const funcRef = useLatest(func)

  useEffect(
    () => () => {
      funcRef.current()
    },
    []
  )
}
