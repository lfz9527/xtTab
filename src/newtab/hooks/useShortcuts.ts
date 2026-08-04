import { useCommand } from '@/hooks/useCommand'
import useSettings from '../store/useSettings'
import { useAppStore } from '../store/useAppStore'

/**
 * 统一管理快捷键注册
 * 弹窗开关状态由全局 useAppStore 管理（zustand），此处仅注册快捷键
 */
export default function useShortcuts() {
  const [settings] = useSettings()
  const setBookmarkOpen = useAppStore((s) => s.setBookmarkOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  // 打开书签弹窗
  useCommand(settings.bookmarkShortcut ?? 'ctrl+k', () => {
    setBookmarkOpen(true)
  })

  // 打开设置弹窗
  useCommand(settings.settingsShortcut ?? 'ctrl+,', () => {
    setSettingsOpen(true)
  })
}
