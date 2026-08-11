import { useEffect, useState } from 'react'
import { GlobeIcon } from 'lucide-react'
import useTabs from '@/hooks/useTabs'
import { safeHost } from '@/utils'

/** 按 windowId 升序分组标签页；返回数组，组内保持原顺序 */
export function groupTabsByWindow(
  tabs: Browser.tabs.Tab[]
): Browser.tabs.Tab[][] {
  const groups = new Map<number, Browser.tabs.Tab[]>()
  for (const tab of tabs) {
    const list = groups.get(tab.windowId)
    if (list) list.push(tab)
    else groups.set(tab.windowId, [tab])
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, list]) => list)
}

/**
 * 标签页面板：展示所有窗口的标签页，按窗口分组；点击激活对应标签页并聚焦窗口
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

  const groups = groupTabsByWindow(tabs)

  if (groups.length === 0) {
    return <p className='py-4 text-sm text-muted-foreground'>暂无标签页</p>
  }

  const activate = (tab: Browser.tabs.Tab) => {
    if (tab.id == null) return
    browser.tabs.update(tab.id, { active: true })
    browser.windows.update(tab.windowId, { focused: true })
  }

  return (
    <div className='flex w-full max-w-160 flex-col gap-3'>
      {groups.map((group, index) => (
        <section key={group[0].windowId}>
          <h2 className='mb-1 text-xs font-medium text-muted-foreground'>
            窗口 {index + 1}
          </h2>
          <ul className='flex flex-col gap-0.5'>
            {group.map((tab) => (
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
