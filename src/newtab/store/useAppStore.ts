import { create } from 'zustand'

/** 搜索框下方内容区视图类型：置顶卡片 / 标签页列表 */
export type HeaderView = 'pins' | 'tabs'

/**
 * 全局临时 UI 状态（不持久化）
 * 持久化数据仍由 @wxt-dev/storage 管理，此处仅存放弹窗开关、内容区视图等临时态
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
  /** 搜索框下方内容区当前视图；null = 未手动选择，跟随视图排序首位 */
  activeHeaderView: HeaderView | null

  setBookmarkOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSettingsActiveTab: (tab: string) => void
  setAddEngineOpen: (open: boolean) => void
  setActiveHeaderView: (view: HeaderView) => void
}

export const useAppStore = create<AppState>((set) => ({
  bookmarkOpen: false,
  settingsOpen: false,
  settingsActiveTab: 'general',
  addEngineOpen: false,
  activeHeaderView: null,

  setBookmarkOpen: (open) => set({ bookmarkOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
  setAddEngineOpen: (open) => set({ addEngineOpen: open }),
  setActiveHeaderView: (view) => set({ activeHeaderView: view })
}))
