import { useRef, useState } from 'react'
import { type UseDebounceFnOptions, useDebounceFn } from './useDebounceFn'

type UseDebounceValueOptions<T> = UseDebounceFnOptions & {
  equalityFn?: (prev: T, next: T) => boolean
}

type useDebounceValueReturn<T> = [T, (val: T) => void, cancel: VoidFunction]

export function useDebounceValue<T>(
  initialValue: T,
  options: UseDebounceValueOptions<T> = {}
): useDebounceValueReturn<T> {
  const { equalityFn, ...opts } = options
  const comparison = equalityFn ?? ((l, r) => l === r)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)
  const previousValueRef = useRef<T>(initialValue)

  const { run, cancel } = useDebounceFn((val: T) => {
    if (!comparison(previousValueRef.current, val)) {
      previousValueRef.current = val
      setDebouncedValue(val)
    }
  }, opts)

  return [debouncedValue, run, cancel]
}
