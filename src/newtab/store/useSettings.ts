import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface SettingsState {
  /** 搜索结果打开方式：'current' 当前标签页 / 'new' 新标签页 */
  openTarget: 'current' | 'new'
  /** 是否开启搜索历史记录 */
  searchHistoryEnabled: boolean
  /** 书签跳转方式：'current' 当前标签页 / 'new' 新标签页 */
  bookmarkTarget: 'current' | 'new'
  /** 常用入口跳转方式：'current' 当前标签页 / 'new' 新标签页 */
  dockItemTarget: 'current' | 'new'
  /** 入口栏宽度模式：'auto' 内容自适应 / 'full' 全屏 / 'fixed' 固定宽度 */
  dockWidthMode: 'auto' | 'full' | 'fixed'
  /** 入口栏固定宽度（px），dockWidthMode='fixed' 时生效 */
  dockWidthValue: number
  /** 打开书签弹窗快捷键（小写组合，如 ctrl+k） */
  bookmarkShortcut: string
  /** 打开设置弹窗快捷键（小写组合，如 ctrl+,） */
  settingsShortcut: string
  // 配置项字段在此追加
}

const settingsStorage = storage.defineItem<SettingsState>('local:settings', {
  fallback: {
    openTarget: 'current',
    searchHistoryEnabled: true,
    bookmarkTarget: 'new',
    dockItemTarget: 'new',
    dockWidthMode: 'auto',
    dockWidthValue: 1200,
    bookmarkShortcut: 'ctrl+k',
    settingsShortcut: 'ctrl+,'
  }
})

export default function useSettings() {
  return useWxtStorage(settingsStorage)
}
