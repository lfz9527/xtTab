import { useState } from 'react'
import { PlusIcon, SettingsIcon, Trash2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useSettings, { type SettingsState } from '../store/useSettings'
import useSearchEngines from '../store/useSearchEngines'
import useSearchHistory from '../store/useSearchHistory'
import EngineIcon from './EngineIcon'
import AddEngineDialog from './AddEngineDialog'

interface SettingsTab {
  key: string
  label: string
}

/** 设置 tab 配置：后续在此追加新 tab，并在内容区按 key 渲染对应设置项 */
const SETTINGS_TABS: SettingsTab[] = [
  { key: 'general', label: '通用' },
  { key: 'engines', label: '搜索引擎' }
]

/** 书签跳转方式选项 */
const BOOKMARK_TARGET_OPTIONS = [
  { value: 'current', label: '当前标签页' },
  { value: 'new', label: '新标签页' }
] as const

/** 搜索结果打开方式选项 */
const OPEN_TARGET_OPTIONS = [
  { value: 'current', label: '当前标签页' },
  { value: 'new', label: '新标签页' }
] as const

/** 设置弹窗左右区域共用高度 */
const PANEL_HEIGHT_CLASS = 'h-125'

/**
 * 设置弹窗
 * 左右布局：左侧 tab 导航，右侧展示当前 tab 对应的设置项
 */
export default function SettingsDialog() {
  // 弹窗内 tab 状态，不持久化；默认展开「通用」
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].key)
  const [settings, setSettings] = useSettings()
  const openTarget = settings.openTarget ?? 'current'
  const [engines, setEngines] = useSearchEngines()
  const { clearHistory } = useSearchHistory()

  /** 切换引擎隐藏状态 */
  const toggleEngineHidden = (key: string) => {
    setEngines({
      ...engines,
      list: engines.list.map((e) =>
        e.key === key ? { ...e, hidden: !e.hidden } : e
      )
    })
  }

  /** 删除引擎（当前使用的引擎由 UI 禁用，不会走到这里） */
  const removeEngine = (key: string) => {
    setEngines({
      ...engines,
      list: engines.list.filter((e) => e.key !== key)
    })
  }

  /** 添加引擎弹窗开关 */
  const [addDialogOpen, setAddDialogOpen] = useState(false)

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
        className='max-w-225 sm:max-w-225 overflow-hidden p-0'
      >
        <div className={cn('flex', PANEL_HEIGHT_CLASS)}>
          <nav
            className={cn(
              'flex w-32.5 shrink-0 flex-col gap-1 border-r border-border p-3',
              PANEL_HEIGHT_CLASS
            )}
          >
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
            className='flex flex-1 flex-col gap-4 overflow-y-auto p-6 animate-in fade-in slide-in-from-right-2 duration-200'
          >
            {/* 设置项容器：按 activeTab 渲染不同设置项 */}
            {activeTab === 'general' && (
              <>
                <div className='rounded-lg border border-border bg-card p-4 flex flex-col gap-3'>
                  <span className='text-sm font-medium text-foreground'>
                    搜索结果打开方式
                  </span>
                  <Tabs
                    value={openTarget}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        openTarget: value as SettingsState['openTarget']
                      })
                    }
                    className='w-fit'
                  >
                    <TabsList>
                      {OPEN_TARGET_OPTIONS.map((opt) => (
                        <TabsTrigger
                          key={opt.value}
                          value={opt.value}
                          className='px-3'
                        >
                          {opt.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div className='rounded-lg border border-border bg-card p-4 flex flex-col gap-3'>
                  <span className='text-sm font-medium text-foreground'>
                    书签跳转方式
                  </span>
                  <Tabs
                    value={settings.bookmarkTarget ?? 'new'}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        bookmarkTarget: value as SettingsState['bookmarkTarget']
                      })
                    }
                    className='w-fit'
                  >
                    <TabsList>
                      {BOOKMARK_TARGET_OPTIONS.map((opt) => (
                        <TabsTrigger
                          key={opt.value}
                          value={opt.value}
                          className='px-3'
                        >
                          {opt.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div className='flex items-center justify-between rounded-lg border border-border bg-card p-4'>
                  <div className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-foreground'>
                      搜索历史
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      记录搜索过的关键词，便于再次搜索
                    </span>
                  </div>
                  <Switch
                    checked={settings.searchHistoryEnabled ?? true}
                    onCheckedChange={(checked) => {
                      setSettings({
                        ...settings,
                        searchHistoryEnabled: checked
                      })
                      // 关闭搜索历史时清空已存历史记录
                      if (!checked) clearHistory()
                    }}
                    aria-label='是否开启搜索历史'
                  />
                </div>
              </>
            )}
            {activeTab === 'engines' && (
              <div className='flex flex-col gap-2'>
                {/* 自定义搜索引擎 */}
                <Button
                  variant='default'
                  className='w-fit'
                  onClick={() => setAddDialogOpen(true)}
                >
                  <PlusIcon className='size-4' />
                  自定义搜索引擎
                </Button>
                <div className='grid grid-cols-2 gap-2'>
                  {engines.list.map((engine) => {
                    // 当前正在使用的引擎不允许关闭
                    const isCurrent = engine.key === engines.current
                    return (
                      <div
                        key={engine.key}
                        className={cn(
                          'flex flex-col justify-between gap-2 rounded-lg border bg-card p-3',
                          isCurrent
                            ? 'border-primary/60 ring-1 ring-primary/20'
                            : 'border-border'
                        )}
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <div className='flex min-w-0 items-center gap-2'>
                            <EngineIcon
                              engineKey={engine.key}
                              name={engine.name}
                              icon={engine.icon}
                            />
                            <span className='truncate text-sm font-medium text-foreground'>
                              {engine.name}
                            </span>
                          </div>
                          <Switch
                            checked={!engine.hidden}
                            onCheckedChange={() => toggleEngineHidden(engine.key)}
                            disabled={isCurrent}
                            aria-label={`显示${engine.name}`}
                          />
                        </div>
                        <div className='flex items-center justify-between gap-2'>
                          <span className='truncate text-xs text-muted-foreground'>
                            {engine.url}
                          </span>
                          <button
                            type='button'
                            onClick={() => removeEngine(engine.key)}
                            disabled={isCurrent}
                            aria-label={`删除${engine.name}`}
                            className='shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-40'
                          >
                            <Trash2Icon className='size-3.5' />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      {/* 自定义搜索引擎二次弹窗 */}
      <AddEngineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </Dialog>
  )
}
