import { useState } from 'react'
import { useCommand } from '@/hooks/useCommand'
import useSettings from '../store/useSettings'

/**
 * 统一管理快捷键注册与弹窗开关状态
 * 书签弹窗、设置弹窗的快捷键在此统一注册，open 状态供对应组件受控使用
 */
export default function useShortcuts() {
  const [settings] = useSettings()
  const [bookmarkOpen, setBookmarkOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 打开书签弹窗
  useCommand(settings.bookmarkShortcut ?? 'ctrl+k', () => {
    setBookmarkOpen(true)
  })

  // 打开设置弹窗
  useCommand(settings.settingsShortcut ?? 'ctrl+,', () => {
    setSettingsOpen(true)
  })

  return { bookmarkOpen, setBookmarkOpen, settingsOpen, setSettingsOpen }
}
