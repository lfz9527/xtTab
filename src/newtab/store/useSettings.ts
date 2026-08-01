import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface SettingsState {
  /** 搜索结果打开方式：'current' 当前标签页 / 'new' 新标签页 */
  openTarget: 'current' | 'new'
  // 配置项字段在此追加
}

const settingsStorage = storage.defineItem<SettingsState>('local:settings', {
  fallback: {
    openTarget: 'current'
  }
})

export default function useSettings() {
  return useWxtStorage(settingsStorage)
}
