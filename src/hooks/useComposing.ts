import { useState } from 'react'
import { useEventListener } from './useEventListener'

/**
 * 监听中文输入法组合状态
 * composition 期间 composing 为 true，拼音选词时不触发其他逻辑
 */
export function useComposing(): boolean {
  const [composing, setComposing] = useState(false)

  useEventListener('compositionstart', () => setComposing(true))
  useEventListener('compositionend', () => setComposing(false))

  return composing
}
