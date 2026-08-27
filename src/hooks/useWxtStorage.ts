import type { WxtStorageItem } from '@wxt-dev/storage'
import { useCallback, useEffect, useState } from 'react'

function useWxtStorage<T>(
  storageItem: WxtStorageItem<T, {}>
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(storageItem.fallback)

  // 获取 initial value
  useEffect(() => {
    let isMounted = true
    storageItem
      .getValue()
      .then((initialValue) => {
        if (isMounted) {
          setValue(initialValue)
        }
      })
      .catch((error) => {
        console.error('Failed to get initial value:', error)
      })

    return () => {
      isMounted = false
    }
  }, [storageItem])

  // 监听变化
  useEffect(() => {
    const unwatch = storageItem.watch((newValue) => {
      setValue(newValue)
    })

    return () => unwatch()
  }, [storageItem])

  // 创建一个setter函数，避免每次渲染都创建新的函数
  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue)
      storageItem.setValue(newValue).catch((error: any) => {
        console.error('Failed to update storage value:', error)
      })
    },
    [storageItem]
  )

  return [value, updateValue]
}

export default useWxtStorage
