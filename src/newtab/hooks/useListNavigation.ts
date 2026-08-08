import { useEffect, useState, type KeyboardEvent } from 'react'
import { useThrottleFn } from '@/hooks/useThrottledFn'

interface UseListNavigationOptions<T> {
  /** 列表项，变化时重置高亮 */
  items: T[]
  /** 是否启用键盘导航（如列表关闭时不消费按键），默认 true */
  enabled?: boolean
  /** 回车激活高亮项 */
  onActivate: (item: T) => void
  /** 长按方向键节流间隔（ms），默认 180 */
  throttleWait?: number
}

/**
 * 列表键盘导航：上下键循环移动高亮、回车激活高亮项
 * 供书签弹窗列表（BookmarkTree）与搜索联想列表（SuggestPopover）复用
 * 返回 activeIndex 供渲染高亮，handleKeyDown 返回 true 表示事件已被消费
 */
export function useListNavigation<T>({
  items,
  enabled = true,
  onActivate,
  throttleWait = 180
}: UseListNavigationOptions<T>) {
  // 高亮索引，-1 表示无高亮
  const [activeIndex, setActiveIndex] = useState(-1)

  // 列表刷新后重置高亮
  useEffect(() => {
    setActiveIndex(-1)
  }, [items])

  // 节流方向键切换：长按 key repeat（~30ms/次）时限制切换频率，避免高亮闪烁不可见
  const throttledMove = useThrottleFn((direction: -1 | 1) => {
    setActiveIndex((i) => {
      if (direction > 0) return (i + 1) % items.length
      return i <= 0 ? items.length - 1 : i - 1
    })
  }, { wait: throttleWait, trailing: false })

  // 方向键切换高亮、回车激活高亮项；返回 true 表示事件已被消费
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!enabled || items.length === 0) return false
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      throttledMove(1)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      throttledMove(-1)
      return true
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      const item = items[activeIndex]
      e.preventDefault()
      if (!item) return true
      onActivate(item)
      setActiveIndex(-1)
      return true
    }
    return false
  }

  return { activeIndex, setActiveIndex, handleKeyDown }
}
