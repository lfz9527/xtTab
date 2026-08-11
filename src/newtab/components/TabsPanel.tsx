import { useEffect, useState } from 'react'
import { GlobeIcon } from 'lucide-react'
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

/**
 * 标签页面板：展示所有标签页并按域名分组；点击激活对应标签页并聚焦窗口
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

  return (
    <div className='flex w-full max-w-160 flex-col gap-3'>
      {hostGroups.map((group) => (
        <section key={group.host}>
          <h2 className='mb-1 text-xs font-medium text-muted-foreground'>
            {group.host}
          </h2>
          <ul className='flex flex-col gap-0.5'>
            {group.tabs.map((tab) => (
              <TabItem
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                onActivate={activate}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function TabItem({
  tab,
  isActive,
  onActivate
}: {
  tab: Browser.tabs.Tab
  isActive: boolean
  onActivate: (tab: Browser.tabs.Tab) => void
}) {
  const [iconFailed, setIconFailed] = useState(false)
  const host = tab.url ? safeHost(tab.url) : ''

  return (
    <li>
      <button
        type='button'
        onClick={() => onActivate(tab)}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${isActive ? 'bg-muted text-foreground' : 'text-foreground'}`}
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
        <span className='min-w-0 flex-1 truncate'>{tab.title ?? ''}</span>
        {host && (
          <span className='shrink-0 text-xs text-muted-foreground'>{host}</span>
        )}
      </button>
    </li>
  )
}
