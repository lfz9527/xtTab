import { useCallback, useEffect, useState } from 'react'
import { storage } from '@wxt-dev/storage'
import { move } from '@dnd-kit/helpers'
import useWxtStorage from '@/hooks/useWxtStorage'
import type { HeaderView } from '@/newTab/store/useAppStore'

/** Header 视图默认顺序；normalizeViews 补全缺失项时也按此相对顺序 */
const DEFAULT_VIEW_ORDER: HeaderView[] = ['pins', 'tabs']

/**
 * 清洗存储中的视图顺序：剔除非法/重复项，缺失视图按默认顺序补全，
 * 保证返回值永远是全部视图的完整排列（首位即默认视图，必须完整）
 */
export function normalizeViews(views: unknown): HeaderView[] {
  const list = Array.isArray(views) ? views : []
  const result: HeaderView[] = []
  const seen = new Set<HeaderView>()
  for (const view of list) {
    if ((view === 'pins' || view === 'tabs') && !seen.has(view)) {
      seen.add(view)
      result.push(view)
    }
  }
  for (const view of DEFAULT_VIEW_ORDER) {
    if (!seen.has(view)) result.push(view)
  }
  return result
}

/** Header 左侧按钮顺序存储：只存视图 id 数组，拖拽换位后持久化 */
const headerViewOrderStorage = storage.defineItem<HeaderView[]>(
  'local:headerViewOrder',
  { fallback: DEFAULT_VIEW_ORDER }
)

/** Header 左侧视图按钮顺序 hook：viewOrder（清洗后）+ moveView（拖拽结束更新顺序）+ ready（storage 就绪） */
export default function useHeaderViews() {
  const [rawOrder, setViewOrder] = useWxtStorage(headerViewOrderStorage)
  // useWxtStorage 首帧返回 fallback，真实值异步到达；此处跟踪读取完成时机
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let isMounted = true
    headerViewOrderStorage
      .getValue()
      .then(() => {
        if (isMounted) setReady(true)
      })
      .catch(() => {
        if (isMounted) setReady(true)
      })
    return () => {
      isMounted = false
    }
  }, [])
  const viewOrder = normalizeViews(rawOrder)
  const moveView = useCallback(
    (event: Parameters<typeof move>[1]) =>
      setViewOrder(move(normalizeViews(rawOrder), event)),
    [rawOrder, setViewOrder]
  )
  return { viewOrder, moveView, ready }
}
