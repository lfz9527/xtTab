import { useState } from 'react'
import { cn } from '@/lib/utils'

/** 修饰键显示名 */
const MODIFIER_DISPLAY: Record<string, string> = {
  ctrl: 'Ctrl',
  shift: 'Shift',
  alt: 'Alt',
  meta: 'Meta'
}

/** 特殊键名映射为 useCommand 可识别的小写形式 */
const SPECIAL_KEYS: Record<string, string> = {
  ' ': 'space',
  Enter: 'enter',
  Escape: 'escape',
  Tab: 'tab',
  Backspace: 'backspace',
  Delete: 'delete',
  ArrowUp: 'arrowup',
  ArrowDown: 'arrowdown',
  ArrowLeft: 'arrowleft',
  ArrowRight: 'arrowright'
}

/** 将存储的小写组合键格式化为显示文本，如 ctrl+k -> Ctrl+K */
export function formatShortcut(shortcut: string): string {
  if (!shortcut) return ''
  return shortcut
    .split('+')
    .map((part) => MODIFIER_DISPLAY[part] ?? part.toUpperCase())
    .join('+')
}

/** 将 KeyboardEvent 解析为小写组合键字符串；纯修饰键或无修饰键返回 null */
function parseKeyEvent(e: KeyboardEvent): string | null {
  const modifiers: string[] = []
  if (e.ctrlKey) modifiers.push('ctrl')
  if (e.shiftKey) modifiers.push('shift')
  if (e.altKey) modifiers.push('alt')
  if (e.metaKey) modifiers.push('meta')

  const rawKey = e.key
  // 仅按下修饰键本身（无其他键）不记录
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(rawKey)) return null
  // 无任何修饰键的单独按键不记录（避免误触）
  if (modifiers.length === 0) return null

  const keyPart =
    rawKey.length === 1 ? rawKey.toLowerCase() : SPECIAL_KEYS[rawKey]
  if (!keyPart) return null
  return [...modifiers, keyPart].join('+')
}

/**
 * 快捷键录制输入：点击进入录制态，按下组合键保存
 */
export default function ShortcutInput({
  value,
  onChange
}: {
  value: string
  onChange: (shortcut: string) => void
}) {
  const [recording, setRecording] = useState(false)

  return (
    <button
      type='button'
      onClick={() => setRecording(true)}
      onKeyDown={(e) => {
        if (!recording) return
        e.preventDefault()
        e.stopPropagation()
        if (e.key === 'Escape') {
          setRecording(false)
          return
        }
        const parsed = parseKeyEvent(e.nativeEvent)
        if (parsed) {
          onChange(parsed)
          setRecording(false)
        }
      }}
      className={cn(
        'h-8 min-w-32 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground transition-colors',
        recording ? 'border-ring ring-3 ring-ring/50' : 'hover:border-ring'
      )}
    >
      {recording ? '按下快捷键...' : formatShortcut(value) || '未设置'}
    </button>
  )
}
