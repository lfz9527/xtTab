import { useState } from 'react'
import { SettingsIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import useSettings from '../store/useSettings'

interface SettingsTab {
  key: string
  label: string
}

/** 设置 tab 配置：后续在此追加新 tab，并在内容区按 key 渲染对应设置项 */
const SETTINGS_TABS: SettingsTab[] = [
  { key: 'general', label: '通用' },
  { key: 'engines', label: '搜索引擎' }
]

/** 搜索结果打开方式选项 */
const OPEN_TARGET_OPTIONS = [
  { value: 'current', label: '当前标签页' },
  { value: 'new', label: '新标签页' }
] as const

/**
 * 设置弹窗
 * 左右布局：左侧 tab 导航，右侧展示当前 tab 对应的设置项
 */
export default function SettingsDialog() {
  // 弹窗内 tab 状态，不持久化；默认展开「通用」
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].key)
  const [settings, setSettings] = useSettings()
  const openTarget = settings.openTarget ?? 'current'

  return (
    <Dialog modal>
      <DialogTrigger
        aria-label='设置'
        className='fixed right-2 top-2 z-40 flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      >
        <SettingsIcon className='size-5' />
      </DialogTrigger>
      <DialogContent
        aria-label='设置'
        showCloseButton={false}
        className='max-w-[600px] sm:max-w-[600px] overflow-hidden p-0'
      >
        <div className='flex min-h-96'>
          <nav className='flex w-[130px] shrink-0 flex-col gap-1 border-r border-border p-3'>
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.key}
                type='button'
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted',
                  activeTab === tab.key && 'bg-muted font-medium'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div
            key={activeTab}
            className='flex flex-1 flex-col gap-4 p-6 animate-in fade-in slide-in-from-right-2 duration-200'
          >
            {/* 设置项容器：按 activeTab 渲染不同设置项 */}
            {activeTab === 'general' && (
              <div className='rounded-lg border border-border bg-card p-4 flex flex-col gap-3'>
                <span className='text-sm font-medium text-foreground'>
                  搜索结果打开方式
                </span>
                <div className='flex w-fit gap-1 rounded-lg bg-muted p-1'>
                  {OPEN_TARGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      onClick={() =>
                        setSettings({ ...settings, openTarget: opt.value })
                      }
                      className={cn(
                        'rounded-md px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground',
                        openTarget === opt.value &&
                          'bg-background text-foreground shadow-sm'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'engines' && <div className='flex flex-col gap-3' />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
