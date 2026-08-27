import { useState } from 'react'
import { GlobeIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/newTab/store/useAppStore'
import useSettings, { type SettingsState } from '../store/useSettings'
import useSearchEngines from '../store/useSearchEngines'
import useSearchHistory from '../store/useSearchHistory'
import useDockItems, { type DockItem } from '../store/useDockItems'
import EngineIcon from './EngineIcon'
import AddEngineDialog from './AddEngineDialog'
import AddDockItemDialog from './AddDockItemDialog'
import ShortcutInput from './ShortcutInput'

interface SettingsTab {
  key: string
  label: string
}

/** 设置 tab 配置：后续在此追加新 tab，并在内容区按 key 渲染对应设置项 */
const SETTINGS_TABS: SettingsTab[] = [
  { key: 'general', label: '通用' },
  { key: 'engines', label: '搜索引擎' },
  { key: 'dock', label: '常用入口' },
  { key: 'shortcuts', label: '快捷键' }
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

/** 常用入口跳转方式选项 */
const DOCK_ITEM_TARGET_OPTIONS = [
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
  const open = useAppStore((s) => s.settingsOpen)
  const setOpen = useAppStore((s) => s.setSettingsOpen)
  const activeTab = useAppStore((s) => s.settingsActiveTab)
  const setActiveTab = useAppStore((s) => s.setSettingsActiveTab)
  const [settings, setSettings] = useSettings()
  const openTarget = settings.openTarget ?? 'current'
  const dockItemTarget = settings.dockItemTarget ?? 'new'
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

  /** 添加引擎弹窗开关（全局状态） */
  const addDialogOpen = useAppStore((s) => s.addEngineOpen)
  const setAddDialogOpen = useAppStore((s) => s.setAddEngineOpen)
  /** 添加常用入口弹窗开关（全局状态） */
  const addDockItemOpen = useAppStore((s) => s.addDockItemOpen)
  const setAddDockItemOpen = useAppStore((s) => s.setAddDockItemOpen)
  const [dockItems, setDockItems] = useDockItems()
  /** 常用入口弹窗编辑目标；null = 添加模式 */
  const [editingDockItem, setEditingDockItem] = useState<DockItem | null>(null)

  /** 删除常用入口 */
  const removeDockItem = (id: string) => {
    setDockItems({
      ...dockItems,
      list: dockItems.list.filter((item) => item.id !== id)
    })
  }

  /** 打开常用入口弹窗：null 为添加模式，传入条目为编辑模式 */
  const openDockItemDialog = (item: DockItem | null) => {
    setEditingDockItem(item)
    setAddDockItemOpen(true)
  }

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
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
            className='flex min-h-0 flex-1 flex-col p-4 animate-in fade-in slide-in-from-right-2 duration-200'
          >
            {/* 设置项容器：按 activeTab 渲染不同设置项 */}
            {activeTab === 'general' && (
              <ScrollArea className='min-h-0 flex-1'>
                <div className='flex flex-col gap-4 pr-3'>
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
                          bookmarkTarget:
                            value as SettingsState['bookmarkTarget']
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
                  <div className='rounded-lg border border-border bg-card p-4 flex flex-col gap-3'>
                    <span className='text-sm font-medium text-foreground'>
                      常用入口跳转方式
                    </span>
                    <Tabs
                      value={dockItemTarget}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          dockItemTarget:
                            value as SettingsState['dockItemTarget']
                        })
                      }
                      className='w-fit'
                    >
                      <TabsList>
                        {DOCK_ITEM_TARGET_OPTIONS.map((opt) => (
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
                </div>
              </ScrollArea>
            )}
            {activeTab === 'engines' && (
              <div className='flex min-h-0 flex-1 flex-col gap-2'>
                {/* header：添加按钮固定不滚动 */}
                <div className='flex items-center justify-end'>
                  <Button
                    variant='default'
                    className='w-fit'
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <PlusIcon className='size-4' />
                    自定义
                  </Button>
                </div>
                {/* list：仅列表区域滚动 */}
                <ScrollArea className='min-h-0 flex-1'>
                  <div className='grid grid-cols-2 gap-2 pr-3'>
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
                              onCheckedChange={() =>
                                toggleEngineHidden(engine.key)
                              }
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
                </ScrollArea>
              </div>
            )}
            {activeTab === 'dock' && (
              <div className='flex min-h-0 flex-1 flex-col gap-2'>
                {/* header：添加按钮固定不滚动 */}
                <div className='flex items-center justify-end'>
                  <Button
                    variant='default'
                    className='w-fit'
                    onClick={() => openDockItemDialog(null)}
                  >
                    <PlusIcon className='size-4' />
                    添加
                  </Button>
                </div>
                {/* list：仅列表区域滚动 */}
                <ScrollArea className='min-h-0 flex-1'>
                  <div className='grid grid-cols-2 gap-2 pr-3'>
                    {dockItems.list.map((item) => (
                      <div
                        key={item.id}
                        className='flex flex-col justify-between gap-2 rounded-lg border border-border bg-card p-3'
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <div className='flex min-w-0 items-center gap-2'>
                            <span className='flex size-8 shrink-0 items-center justify-center rounded-md bg-white'>
                              {item.icon ? (
                                <img
                                  src={item.icon}
                                  alt={item.name}
                                  className='size-6'
                                />
                              ) : (
                                <GlobeIcon className='size-5 text-muted-foreground' />
                              )}
                            </span>
                            <span className='truncate text-sm font-medium text-foreground'>
                              {item.name}
                            </span>
                          </div>
                          <div className='flex shrink-0 items-center gap-1'>
                            <button
                              type='button'
                              onClick={() => openDockItemDialog(item)}
                              aria-label={`编辑${item.name}`}
                              className='rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground'
                            >
                              <PencilIcon className='size-3.5' />
                            </button>
                            <button
                              type='button'
                              onClick={() => removeDockItem(item.id)}
                              aria-label={`删除${item.name}`}
                              className='rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive'
                            >
                              <Trash2Icon className='size-3.5' />
                            </button>
                          </div>
                        </div>
                        <span className='truncate text-xs text-muted-foreground'>
                          {item.url}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            {activeTab === 'shortcuts' && (
              <ScrollArea className='min-h-0 flex-1'>
                <div className='flex flex-col gap-4 pr-3'>
                  <div className='flex items-center justify-between rounded-lg border border-border bg-card p-4'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-foreground'>
                        打开书签
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        按下组合键快速打开书签弹窗
                      </span>
                    </div>
                    <ShortcutInput
                      value={settings.bookmarkShortcut ?? 'ctrl+k'}
                      onChange={(shortcut) =>
                        setSettings({
                          ...settings,
                          bookmarkShortcut: shortcut
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between rounded-lg border border-border bg-card p-4'>
                    <div className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-foreground'>
                        打开设置
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        按下组合键快速打开设置弹窗
                      </span>
                    </div>
                    <ShortcutInput
                      value={settings.settingsShortcut ?? 'ctrl+,'}
                      onChange={(shortcut) =>
                        setSettings({
                          ...settings,
                          settingsShortcut: shortcut
                        })
                      }
                    />
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
      {/* 自定义搜索引擎二次弹窗 */}
      <AddEngineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {/* 添加/编辑常用入口二次弹窗：key 含编辑目标与开合状态，保证每次打开重建并初始化表单 */}
      <AddDockItemDialog
        key={`${editingDockItem?.id ?? 'new'}-${addDockItemOpen}`}
        open={addDockItemOpen}
        onOpenChange={setAddDockItemOpen}
        editingItem={editingDockItem}
      />
    </Dialog>
  )
}
