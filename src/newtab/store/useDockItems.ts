import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface DockItem {
  id: string
  name: string
  url: string
  /** 图标图片链接（可选），缺省时 Dock 用默认图标占位 */
  icon?: string
}

export interface DockItemsState {
  list: DockItem[]
}

const dockItemsStorage = storage.defineItem<DockItemsState>('local:dockItems', {
  fallback: { list: [] }
})

export default function useDockItems() {
  return useWxtStorage(dockItemsStorage)
}
