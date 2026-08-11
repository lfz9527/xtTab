import { useEffect, useState } from 'react'
import { CopyIcon, GlobeIcon, XIcon } from 'lucide-react'
import { Masonry } from 'antd'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import useTabs from '@/hooks/useTabs'
import { safeHost } from '@/utils'

/** 按域名分组标签页：同域名合并、域名字母升序、无 URL 归「其他」排最后；组内保持原顺序 */
export function groupTabsByHost(
  tabs: Browser.tabs.Tab[]
): { host: string; tabs: Browser.tabs.Tab[] }[] {
  const groups = new Map<string, Browser.tabs.Tab[]>()
  for (const tab of tabs) {
    const host = tab.url ? safeHost(tab.url) : ''
    const key = host || '其他'
    const list = groups.get(key)
    if (list) list.push(tab)
    else groups.set(key, [tab])
  }
  return [...groups.entries()]
    .sort((a, b) => {
      if (a[0] === '其他') return 1
      if (b[0] === '其他') return -1
      return a[0].localeCompare(b[0])
    })
    .map(([host, list]) => ({ host, tabs: list }))
}

/** 关闭标签页：pinned 先取消固定，再批量关闭 */
function closeTabs(ids: number[]) {
  const valid = ids.filter((id) => id != null)
  if (valid.length === 0) return
  valid.forEach((id) => {
    browser.tabs.update(id, { pinned: false }).catch(() => { })
  })
  browser.tabs.remove(valid).catch(() => { })
}

/**
 * 标签页面板：按域名分组展示所有窗口标签页（卡片形式），支持全部关闭与按域名关闭
 */
export default function TabsPanel() {
  const { tabs } = useTabs({})
  const [activeTabId, setActiveTabId] = useState<number | undefined>(undefined)

  // 当前聚焦窗口的活动标签 id（用于高亮）
  useEffect(() => {
    browser.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then((res) => setActiveTabId(res[0]?.id))
  }, [tabs])

  const hostGroups = groupTabsByHost(tabs)

  if (hostGroups.length === 0) {
    return <p className='py-4 text-sm text-muted-foreground'>暂无标签页</p>
  }

  const activate = (tab: Browser.tabs.Tab) => {
    if (tab.id == null) return
    browser.tabs.update(tab.id, { active: true })
    browser.windows.update(tab.windowId, { focused: true })
  }

  const closeAll = () => {
    closeTabs(tabs.map((tab) => tab.id ?? -1).filter((id) => id >= 0))
  }

  const closeHost = (host: string) => {
    const group = hostGroups.find((g) => g.host === host)
    if (!group) return
    closeTabs(group.tabs.map((tab) => tab.id ?? -1).filter((id) => id >= 0))
  }

  const closeTab = (tab: Browser.tabs.Tab) => {
    if (tab.id == null) return
    browser.tabs.remove(tab.id).catch(() => { })
  }

  const copyTab = (tab: Browser.tabs.Tab) => {
    if (!tab.url) return
    navigator.clipboard.writeText(tab.url).catch(() => { })
    toast.success('已复制链接')
  }

  return (    <div className='flex w-full max-w-300 flex-col gap-3 px-4'>
      {/* 顶部操作条：仅全部关闭按钮（右对齐） */}
      <div className='flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={closeAll}
          className='text-xs text-muted-foreground'
        >
          <XIcon className='size-3.5' />
          全部关闭
        </Button>
      </div>
      {/* 域名卡片瀑布流（antd Masonry 固定 5 列，限高内部滚动——滚动条在列表内而非页面） */}
      {/* max-h 任意值说明：视口高度减去顶部偏移（Header≈52px + pt-50 搜索区偏移 200px + 搜索框等≈88px），使列表底部与页面底部对齐 */}
      <div className='max-h-[calc(100vh-340px)] overflow-y-auto'>
        <Masonry
          columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
          gutter={{ xs: 8, sm: 12, md: 16 }}
          items={hostGroups.map((group) => ({ key: group.host, data: group }))}
          itemRender={({ data: group }) => (
            <section className='flex flex-col rounded-lg border border-border bg-background/60'>
              <header className='flex items-center justify-between gap-2 px-3 py-2'>
                <span className='flex min-w-0 flex-1 items-baseline gap-2'>
                  <span className='truncate text-sm font-medium text-foreground'>
                    {group.host}
                  </span>
                  <span className='shrink-0 text-xs font-normal text-muted-foreground'>
                    {group.tabs.length}
                  </span>
                </span>
                <button
                  type='button'
                  aria-label={`关闭 ${group.host} 标签页`}
                  onClick={() => closeHost(group.host)}
                  className='flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <XIcon className='size-3.5' />
                </button>
              </header>
              <ul className='flex flex-col gap-0.5 px-1 pb-1'>
                {group.tabs.map((tab) => (
                  <TabItem
                    key={tab.id}
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    onActivate={activate}
                    onClose={closeTab}
                    onCopy={copyTab}
                  />
                ))}
              </ul>
            </section>
          )}
        />
      </div>
    </div>
  )
}

function TabItem({
  tab,
  isActive,
  onActivate,
  onClose,
  onCopy
}: {
  tab: Browser.tabs.Tab
  isActive: boolean
  onActivate: (tab: Browser.tabs.Tab) => void
  onClose: (tab: Browser.tabs.Tab) => void
  onCopy: (tab: Browser.tabs.Tab) => void
}) {
  const [iconFailed, setIconFailed] = useState(false)
  // 兜底：title 不存在时展示链接；title 和链接都没有则不显示该行
  const label = tab.title || tab.url
  if (!label) return null

  return (
    <li className={`group flex w-full items-center rounded-lg transition-colors hover:bg-muted ${isActive ? 'bg-muted' : ''}`}>
      <button
        type='button'
        onClick={() => onActivate(tab)}
        className='flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-foreground'
      >
        {iconFailed || !tab.favIconUrl ? (
          <GlobeIcon className='size-4 shrink-0 text-muted-foreground' />
        ) : (
          <img
            src={tab.favIconUrl}
            alt=''
            className='size-4 shrink-0'
            onError={() => setIconFailed(true)}
          />
        )}
        <span className='min-w-0 flex-1 truncate'>{label}</span>
      </button>
      <button
        type='button'
        aria-label='复制链接'
        onClick={() => onCopy(tab)}
        className='shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground'
      >
        <CopyIcon className='size-3.5' />
      </button>
      <button
        type='button'
        aria-label='关闭标签页'
        onClick={() => onClose(tab)}
        className='mr-1 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground'
      >
        <XIcon className='size-3.5' />
      </button>
    </li>
  )
}
