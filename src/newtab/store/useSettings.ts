import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface SettingsState {
  /** 搜索结果打开方式：'current' 当前标签页 / 'new' 新标签页 */
  openTarget: 'current' | 'new'
  /** 是否开启搜索历史记录 */
  searchHistoryEnabled: boolean
  /** 书签跳转方式：'current' 当前标签页 / 'new' 新标签页 */
  bookmarkTarget: 'current' | 'new'
  // 配置项字段在此追加
}

const settingsStorage = storage.defineItem<SettingsState>('local:settings', {
  fallback: {
    openTarget: 'current',
    searchHistoryEnabled: true,
    bookmarkTarget: 'new'
  }
})

export default function useSettings() {
  return useWxtStorage(settingsStorage)
}
