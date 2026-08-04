import { useCallback, type RefObject } from 'react'
import { useEventListener } from './useEventListener'
import { useLatest } from './useLatest'

const MODIFIER_KEYS = ['ctrl', 'shift', 'alt', 'meta'] as const

interface UseCommandOptions {
  /** 是否启用，默认 true */
  enabled?: boolean
  /** 是否阻止默认行为，默认 true */
  preventDefault?: boolean
  /** 绑定监听的元素，默认 window */
  element?: RefObject<HTMLElement>
}

/**
 * 快速注册键盘快捷键，组件挂载时自动注册，卸载时自动移除
 * @param key - 快捷键组合，如 "Ctrl+k"、"Meta+Shift+P"（不区分大小写）
 * @param callback - 触发回调，接收原生 KeyboardEvent
 * @param options - 配置项
 */
export function useCommand(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: UseCommandOptions = {}
) {
  const { enabled = true, preventDefault = true, element } = options
  const callbackRef = useLatest(callback)

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      const keys = key
        .toLowerCase()
        .split('+')
        .map((k) => k.trim())
      const targetKey = keys.find(
        (k) => !(MODIFIER_KEYS as readonly string[]).includes(k)
      )

      // 开发环境提示缺少非修饰键
      if (!targetKey) {
        if (import.meta.env.DEV) {
          console.warn(`[useCommand] 快捷键 "${key}" 缺少非修饰键`)
        }
        return
      }

      if (e.key.toLowerCase() !== targetKey) return
      if (keys.includes('ctrl') !== e.ctrlKey) return
      if (keys.includes('shift') !== e.shiftKey) return
      if (keys.includes('alt') !== e.altKey) return
      if (keys.includes('meta') !== e.metaKey) return

      if (preventDefault) e.preventDefault()
      callbackRef.current(e)
    },
    [key, enabled]
  )

  useEventListener('keydown', handler, element)
}
