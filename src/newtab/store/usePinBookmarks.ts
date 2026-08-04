import { useCallback } from 'react'
import { storage } from '@wxt-dev/storage'
import useWxtStorage from '@/hooks/useWxtStorage'
import type { BookmarkTreeNode } from '@/newTab/components/BookmarkTree'

/** 置顶书签 id 存储：只存 id，主页渲染时实时按 id 匹配书签树，保证数据一致 */
const pinBookmarksStorage = storage.defineItem<string[]>('local:pinBookmarks', {
  fallback: []
})

/** 切换 id 置顶状态：已置顶则移除，未置顶则追加到末尾，返回新数组 */
export function togglePinInList(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

/** 按置顶 id 顺序从书签树中递归查找书签节点；失效 id（已删除）自动跳过 */
export function findBookmarksByIds(
  nodes: BookmarkTreeNode[],
  ids: string[]
): BookmarkTreeNode[] {
  const idSet = new Set(ids)
  const found: BookmarkTreeNode[] = []
  const walk = (list: BookmarkTreeNode[]) => {
    for (const node of list) {
      if (node.url && idSet.has(node.id)) found.push(node)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  const byId = new Map(found.map((node) => [node.id, node]))
  return ids
    .map((id) => byId.get(id))
    .filter((node): node is BookmarkTreeNode => Boolean(node))
}

/** 置顶书签 hook：pinnedIds（置顶 id 列表）+ togglePin（切换置顶状态） */
export default function usePinBookmarks() {
  const [pinnedIds, setPinnedIds] = useWxtStorage(pinBookmarksStorage)
  const togglePin = useCallback(
    (id: string) => setPinnedIds(togglePinInList(pinnedIds, id)),
    [pinnedIds, setPinnedIds]
  )
  return { pinnedIds, togglePin }
}
