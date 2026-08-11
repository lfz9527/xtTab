# Header 左侧菜单（内容区切换）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在顶部 Header 左侧新增「快捷书签」「标签页面板」两个菜单按钮，点击切换搜索框下方内容区视图（置顶书签卡片 / 快捷书签列表 / 标签页列表）。

**Architecture:** `useAppStore` 新增 `activeHeaderView` 全局状态驱动内容区三视图切换；Header 布局改 `justify-between`，左侧新增两个激活高亮的图标按钮；新建 `QuickBookmarksView`（复用置顶书签数据链路）与 `TabsPanel`（复用扩展后的 `useTabs` 查询所有窗口标签页）；`app.tsx` 按视图条件渲染。

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, zustand, lucide-react, WXT, Vitest

## Global Constraints

- 内容区三视图：`pins`（默认，现有置顶书签卡片）/ `quick`（快捷书签紧凑列表）/ `tabs`（所有窗口标签页列表）
- 纯切换、无关闭：点哪个菜单显示哪个视图，无"关闭/恢复默认"操作；点击已激活菜单视图不变
- 激活按钮高亮 `bg-muted text-foreground`，未激活 `text-muted-foreground`；初始均不高亮
- 快捷书签数据链路与 `PinnedBookmarks` 完全一致：`usePinBookmarks` → `BOOKMARK_GET_TREE` 消息 → `findBookmarksByIds`
- `Header.tsx` 右侧书签/设置按钮、两个弹窗、`PinnedBookmarks` 组件内部逻辑一律不动
- 不引入新 UI 组件库（无 popover/dropdown 浮层）
- 代码风格：2 空格缩进（`src/hooks/useTabs.tsx` 为历史 4 空格文件，改动时保持 4 空格）、单引号、无分号、无尾逗号、80 字符行宽
- 禁止 `git add .`，逐个暂存文件
- 验证方式：`pnpm compile`（tsc）+ `pnpm test`（vitest）+ 手动浏览器检查

---

### Task 1: useAppStore 新增 activeHeaderView 状态

**Files:**
- Modify: `src/newTab/store/useAppStore.ts`

**Interfaces:**
- Consumes: 无
- Produces: 导出类型 `HeaderView = 'pins' | 'quick' | 'tabs'`；store 新增 `activeHeaderView: HeaderView`（初始 `'pins'`）与 `setActiveHeaderView(view: HeaderView): void`

- [ ] **Step 1: 修改 useAppStore.ts**

将 `src/newTab/store/useAppStore.ts` 全文替换为：

```ts
import { create } from 'zustand'

/** 搜索框下方内容区视图类型：置顶卡片 / 快捷书签列表 / 标签页列表 */
export type HeaderView = 'pins' | 'quick' | 'tabs'

/**
 * 全局临时 UI 状态（不持久化）
 * 持久化数据仍由 @wxt-dev/storage 管理，此处仅存放弹窗开关、内容区视图等临时态
 */
interface AppState {
  /** 书签弹窗开关 */
  bookmarkOpen: boolean
  /** 设置弹窗开关 */
  settingsOpen: boolean
  /** 设置弹窗当前 tab */
  settingsActiveTab: string
  /** 添加引擎弹窗开关 */
  addEngineOpen: boolean
  /** 搜索框下方内容区当前视图 */
  activeHeaderView: HeaderView

  setBookmarkOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSettingsActiveTab: (tab: string) => void
  setAddEngineOpen: (open: boolean) => void
  setActiveHeaderView: (view: HeaderView) => void
}

export const useAppStore = create<AppState>((set) => ({
  bookmarkOpen: false,
  settingsOpen: false,
  settingsActiveTab: 'general',
  addEngineOpen: false,
  activeHeaderView: 'pins',

  setBookmarkOpen: (open) => set({ bookmarkOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),
  setAddEngineOpen: (open) => set({ addEngineOpen: open }),
  setActiveHeaderView: (view) => set({ activeHeaderView: view })
}))
```

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/newTab/store/useAppStore.ts
git commit -m "feat: store 新增内容区视图切换状态 activeHeaderView"
```

---

### Task 2: useTabs 扩展支持查询参数

**Files:**
- Modify: `src/hooks/useTabs.tsx`

**Interfaces:**
- Consumes: 无
- Produces: `useTabs(query?: Browser.tabs.QueryInfo): { tabs: Browser.tabs.Tab[]; activeTab: Browser.tabs.Tab | undefined }`，默认 `query` 为 `{ currentWindow: true }`（保持原行为）；传 `{}` 查询所有窗口

- [ ] **Step 1: 修改 useTabs.tsx**

将 `src/hooks/useTabs.tsx` 中函数签名与 `sync` 内查询调用改为（**保持该文件原有 4 空格缩进**）：

```tsx
const useTabs = (
    query: Browser.tabs.QueryInfo = { currentWindow: true }
): {
    tabs: Browser.tabs.Tab[]
    activeTab: Browser.tabs.Tab | undefined
} => {
    const [tabs, setTabs] = useState<Browser.tabs.Tab[]>([])
    const [activeTab, setActiveTab] = useState<Browser.tabs.Tab | undefined>(
        undefined
    )

    const sync = async () => {
        const tabs = await browser.tabs.query(query)
        const activeTab = tabs.find((tab) => tab.active)
        setActiveTab(activeTab)
        setTabs(tabs)
    }
```

其余部分（监听器、初始 sync、返回）保持不变。

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useTabs.tsx
git commit -m "feat: useTabs 支持传入 query 参数查询所有窗口标签页"
```

---

### Task 3: Header 左侧新增两个菜单按钮

**Files:**
- Modify: `src/newTab/components/Header.tsx`

**Interfaces:**
- Consumes: Task 1 的 `useAppStore`（`activeHeaderView`、`setActiveHeaderView`）
- Produces: 无（`Header` 仍默认导出）

- [ ] **Step 1: 修改 Header.tsx**

将 `src/newTab/components/Header.tsx` 全文替换为：

```tsx
import { BookmarkIcon, LayoutGridIcon, SettingsIcon, StarIcon } from 'lucide-react'
import { useAppStore } from '@/newTab/store/useAppStore'

/**
 * 顶部导航栏：60% 不透明度背景，左侧内容区切换菜单，右侧收纳书签/设置入口
 */
export default function Header() {
  const activeHeaderView = useAppStore((s) => s.activeHeaderView)
  const setActiveHeaderView = useAppStore((s) => s.setActiveHeaderView)
  const setBookmarkOpen = useAppStore((s) => s.setBookmarkOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  return (
    <header className='fixed inset-x-0 top-0 z-40 bg-background/60'>
      <div className='flex items-center justify-between gap-2 p-2 pl-3 pr-4'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            aria-label='快捷书签'
            onClick={() => setActiveHeaderView('quick')}
            className={`flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground ${activeHeaderView === 'quick' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          >
            <StarIcon className='size-5' />
          </button>
          <button
            type='button'
            aria-label='标签页面板'
            onClick={() => setActiveHeaderView('tabs')}
            className={`flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground ${activeHeaderView === 'tabs' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          >
            <LayoutGridIcon className='size-5' />
          </button>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            aria-label='书签'
            onClick={() => setBookmarkOpen(true)}
            className='flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <BookmarkIcon className='size-5' />
          </button>
          <button
            type='button'
            aria-label='设置'
            onClick={() => setSettingsOpen(true)}
            className='flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <SettingsIcon className='size-5' />
          </button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/newTab/components/Header.tsx
git commit -m "feat: Header 左侧新增快捷书签/标签页面板菜单按钮"
```

---

### Task 4: 新建 QuickBookmarksView

**Files:**
- Create: `src/newTab/components/QuickBookmarksView.tsx`

**Interfaces:**
- Consumes: `usePinBookmarks`（`pinnedIds`）、`messageBus.send<undefined, BookmarkTreeNode[]>(BackgroundAction.BOOKMARK_GET_TREE.key)`、`findBookmarksByIds`、`useSettings`（`bookmarkTarget`）、`faviconUrl`/`safeHost`、`BookmarkTreeNode` 类型（来自 `./BookmarkTree`）
- Produces: `QuickBookmarksView` 默认导出，无 props

- [ ] **Step 1: 创建 QuickBookmarksView.tsx**

```tsx
import { useEffect, useState } from 'react'
import { GlobeIcon } from 'lucide-react'
import messageBus from '@/messages/message'
import { BackgroundAction } from '@/constants'
import usePinBookmarks, {
  findBookmarksByIds
} from '@/newTab/store/usePinBookmarks'
import useSettings from '@/newTab/store/useSettings'
import { faviconUrl, safeHost } from '@/utils'
import type { BookmarkTreeNode } from './BookmarkTree'

/**
 * 快捷书签视图：置顶书签紧凑列表，点击按设置打开方式跳转（无取消置顶操作）
 */
export default function QuickBookmarksView() {
  const { pinnedIds } = usePinBookmarks()
  const [settings] = useSettings()
  const [bookmarks, setBookmarks] = useState<BookmarkTreeNode[]>([])

  // 数据链路与 PinnedBookmarks 一致：按置顶 id 从书签树过滤
  useEffect(() => {
    if (pinnedIds.length === 0) {
      setBookmarks([])
      return
    }
    messageBus
      .send<undefined, BookmarkTreeNode[]>(
        BackgroundAction.BOOKMARK_GET_TREE.key
      )
      .then((res) => setBookmarks(findBookmarksByIds(res?.data ?? [], pinnedIds)))
  }, [pinnedIds])

  if (bookmarks.length === 0) {
    return <p className='py-4 text-sm text-muted-foreground'>暂无置顶书签</p>
  }

  const open = (url: string) => {
    if (settings.bookmarkTarget === 'current') {
      window.location.href = url
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <ul className='flex w-full max-w-120 flex-col gap-1'>
      {bookmarks.map((bookmark) => (
        <QuickBookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onOpen={open}
        />
      ))}
    </ul>
  )
}

function QuickBookmarkItem({
  bookmark,
  onOpen
}: {
  bookmark: BookmarkTreeNode
  onOpen: (url: string) => void
}) {
  const [iconFailed, setIconFailed] = useState(false)
  const host = bookmark.url ? safeHost(bookmark.url) : ''

  return (
    <li>
      <button
        type='button'
        onClick={() => bookmark.url && onOpen(bookmark.url)}
        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted'
      >
        {iconFailed || !host ? (
          <GlobeIcon className='size-4 shrink-0 text-muted-foreground' />
        ) : (
          <img
            src={faviconUrl(host)}
            alt=''
            className='size-4 shrink-0'
            onError={() => setIconFailed(true)}
          />
        )}
        <span className='truncate'>{bookmark.title ?? ''}</span>
      </button>
    </li>
  )
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/newTab/components/QuickBookmarksView.tsx
git commit -m "feat: 新增快捷书签视图（置顶书签紧凑列表）"
```

---

### Task 5: 新建 TabsPanel（含分组纯函数测试）

**Files:**
- Create: `src/newTab/components/TabsPanel.tsx`
- Test: `src/newTab/components/TabsPanel.test.tsx`

**Interfaces:**
- Consumes: Task 2 的 `useTabs({})`、`browser.tabs` / `browser.windows`
- Produces: `TabsPanel` 默认导出（无 props）；导出纯函数 `groupTabsByWindow(tabs: Browser.tabs.Tab[]): Browser.tabs.Tab[][]`（按 windowId 升序分组，组内保持原顺序）

- [ ] **Step 1: 编写失败测试**

创建 `src/newTab/components/TabsPanel.test.tsx`：

```tsx
import { describe, expect, it } from 'vitest'
import type { Browser } from 'wxt/browser'
import { groupTabsByWindow } from './TabsPanel'

const makeTab = (id: number, windowId: number): Browser.tabs.Tab =>
  ({ id, windowId }) as Browser.tabs.Tab

describe('groupTabsByWindow', () => {
  it('按 windowId 升序分组，组内保持原顺序', () => {
    const tabs = [makeTab(1, 2), makeTab(2, 1), makeTab(3, 2)]
    const groups = groupTabsByWindow(tabs)
    expect(groups.map((g) => g.map((t) => t.id))).toEqual([[2], [1, 3]])
  })

  it('空数组返回空数组', () => {
    expect(groupTabsByWindow([])).toEqual([])
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `pnpm test`
Expected: FAIL — `groupTabsByWindow` 未定义（Cannot find name / import 解析失败）

- [ ] **Step 3: 创建 TabsPanel.tsx**

```tsx
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
```

- [ ] **Step 4: 运行测试验证通过**

Run: `pnpm test`
Expected: PASS（`groupTabsByWindow` 两个用例全过）

- [ ] **Step 5: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 6: 提交**

```bash
git add src/newTab/components/TabsPanel.tsx src/newTab/components/TabsPanel.test.tsx
git commit -m "feat: 新增标签页面板（所有窗口标签页按窗口分组，点击切换）"
```

---

### Task 6: app.tsx 按视图渲染内容区

**Files:**
- Modify: `src/newTab/app.tsx`

**Interfaces:**
- Consumes: Task 1 的 `useAppStore`（`activeHeaderView`）、Task 4 的 `QuickBookmarksView`、Task 5 的 `TabsPanel`、既有 `PinnedBookmarks`
- Produces: 无（`App` 默认导出不变）

- [ ] **Step 1: 修改 app.tsx**

将 `src/newTab/app.tsx` 全文替换为：

```tsx
import './styles/index.css'
import '@/styles/globals.css'
import bgImage from './assets/new-tab-bg.webp'
import useShortcuts from './hooks/useShortcuts'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'
import PinnedBookmarks from './components/PinnedBookmarks'
import QuickBookmarksView from './components/QuickBookmarksView'
import TabsPanel from './components/TabsPanel'
import { useAppStore } from './store/useAppStore'

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  const activeHeaderView = useAppStore((s) => s.activeHeaderView)
  return (
    <div
      className='flex h-full w-full flex-col items-center'
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 上：顶部导航栏（fixed 定位，不占文档流） */}
      <Header />
      {/* 中：搜索框（偏上部） */}
      <main className='flex w-full flex-col items-center'>
        <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
          <SearchBar />
        </div>
      </main>
      {/* 下：内容区，由 Header 左侧菜单切换（pins 置顶卡片 / quick 快捷书签 / tabs 标签页面板） */}
      {activeHeaderView === 'pins' && <PinnedBookmarks />}
      {activeHeaderView === 'quick' && <QuickBookmarksView />}
      {activeHeaderView === 'tabs' && <TabsPanel />}
      {/* 弹窗（fixed 定位，不影响布局） */}
      <SettingsDialog />
      <BookmarkDialog />
    </div>
  )
}
export default App
```

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/newTab/app.tsx
git commit -m "feat: 新标签页内容区按 Header 菜单视图切换渲染"
```

---

### Task 7: 整体验证

**Files:**
- 无改动，仅验证

- [ ] **Step 1: 类型检查 + 测试**

Run: `pnpm compile && pnpm test`
Expected: 两者均通过（exit 0）

- [ ] **Step 2: 手动浏览器验证**

Run: `pnpm dev`（Chrome 加载扩展），人工核对：

1. Header 左侧出现「快捷书签」「标签页面板」两个图标按钮，右侧书签/设置按钮不受影响
2. 初始搜索框下方显示置顶书签卡片区（现状不变），左侧两按钮均不高亮
3. 点击「快捷书签」→ 下方切换为置顶书签紧凑列表（favicon + 标题），按钮高亮
4. 点击「标签页面板」→ 下方切换为所有窗口标签页列表（按窗口分组，当前活动标签高亮），按钮高亮
5. 点击激活中的菜单按钮视图不变；两个按钮互斥切换
6. 快捷书签列表点击按 `bookmarkTarget` 设置打开（默认 new 新标签页）
7. 标签页列表点击 → 切换到对应标签页并聚焦其窗口
8. 无置顶书签时快捷书签视图显示「暂无置顶书签」
9. 快捷键（Ctrl+K 书签 / Ctrl+, 设置）、书签/设置弹窗、搜索功能均不受影响

- [ ] **Step 3: 收尾（无未提交改动则跳过）**

Run: `git status`
Expected: working tree clean
