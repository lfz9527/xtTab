import { create } from 'zustand'

/**
 * 全局临时 UI 状态（不持久化）
 * 持久化数据仍由 @wxt-dev/storage 管理，此处仅存放弹窗开关、当前 tab 等临时态
 */
interface AppState {
  /** 书签弹窗开关 */
  bookmarkOpen: boolean
  /** 设置弹窗开关 */
  settingsOpen: boolean
  /** 设置弹窗当前 tab */
  settingsActiveTab: string
  /** 添加引擎弹窗开关 */
  addEngineOpen: boolean

  setBookmarkOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSettingsActiveTab: (tab: string) => void
  setAddEngineOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  bookmarkOpen: false,
  settingsOpen: false,
  settingsActiveTab: 'general',
  addEngineOpen: false,

  setBookmarkOpen: (open) => set({ bookmarkOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
  setAddEngineOpen: (open) => set({ addEngineOpen: open })
}))
