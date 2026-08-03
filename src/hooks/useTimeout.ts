import { useEffect } from 'react'

import { useLatest } from './useLatest'

export function useTimeout(callback: VoidFunction, delay?: number): void {
  const savedCallback = useLatest(callback)

  useEffect(() => {
    if (delay && delay < 0) return

    const id = setTimeout(() => {
      savedCallback.current()
    }, delay)

    return () => {
      clearTimeout(id)
    }
  }, [delay])
}
