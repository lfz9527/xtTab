# 书签置顶功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 书签弹窗内书签项悬停显示图钉按钮可置顶/取消置顶，置顶书签以卡片形式展示在 newTab 主页（SearchBar 下方），数据经 `local:pinBookmarks` 持久化、主页渲染时实时按 id 匹配书签树。

**Architecture:** 新增 `usePinBookmarks` store（只存 id 列表，仿 `useSettings` 的 `storage.defineItem` + `useWxtStorage` 模式），暴露纯函数 `togglePinInList`/`findBookmarksByIds`（可单测）；`BookmarkTree` 书签行重构为「点击区 + 图钉按钮」并新增 props；新增 `PinnedBookmarks` 组件挂载 `app.tsx` SearchBar 下方，无置顶时整块不渲染。

**Tech Stack:** React 19, TypeScript, @wxt-dev/storage, lucide-react 图标, MessageBus 消息总线, Vitest。

## Global Constraints

- 缩进 2 空格；单引号、无分号、无尾逗号、printWidth 80、LF
- 导入别名 `@/` 指向 `src/`；纯类型导入用 `import type`
- 消息 action 必须取 `BackgroundAction.BOOKMARK_GET_TREE.key`（禁止硬编码字符串）
- 图标从 lucide-react 导入（带 `Icon` 后缀，如 `PinIcon`、`PinOffIcon`）
- storage 键 `local:pinBookmarks`，用 `storage.defineItem` + `useWxtStorage` 模式（仿 `src/newTab/store/useSettings.ts`）
- React hooks 显式 import（沿用现有代码风格，不依赖自动导入）
- 外部 favicon 服务 URL 属硬编码，必须添加注释说明
- 提交信息统一中文；PowerShell 下多行消息用 `$msg = @'...'@` 承接再 `git commit -m $msg`
- 现有测试保持通过（`pnpm test` 5/5）；本功能新增纯函数测试（`src/**/*.test.ts`）

---

### Task 1: usePinBookmarks store（纯函数 + hook + 测试）

**Files:**
- Create: `src/newTab/store/usePinBookmarks.ts`
- Create: `src/newTab/store/usePinBookmarks.test.ts`

**Interfaces:**
- Consumes: `useWxtStorage<T>`（`src/hooks/useWxtStorage.ts`，返回 `[T, (value: T) => void]`）；`BookmarkTreeNode`（`src/newTab/components/BookmarkTree.tsx` 导出，`{ id: string; title?: string; url?: string; children?: BookmarkTreeNode[]; folderType?: string }`）
- Produces: `togglePinInList(ids: string[], id: string): string[]`；`findBookmarksByIds(nodes: BookmarkTreeNode[], ids: string[]): BookmarkTreeNode[]`；`usePinBookmarks(): { pinnedIds: string[]; togglePin: (id: string) => void }`。Task 2/3 消费此接口。

- [ ] **Step 1: 编写失败测试 `src/newTab/store/usePinBookmarks.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import type { BookmarkTreeNode } from '@/newTab/components/BookmarkTree'
import { findBookmarksByIds, togglePinInList } from './usePinBookmarks'

describe('togglePinInList', () => {
  it('空列表追加 id', () => {
    expect(togglePinInList([], 'a')).toEqual(['a'])
  })

  it('已置顶的 id 被移除', () => {
    expect(togglePinInList(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('未置顶的 id 追加到末尾', () => {
    expect(togglePinInList(['a'], 'b')).toEqual(['a', 'b'])
  })
})

describe('findBookmarksByIds', () => {
  const tree: BookmarkTreeNode[] = [
    {
      id: 'folder1',
      title: '文件夹',
      children: [
        { id: 'b1', title: '书签一', url: 'https://a.com' },
        { id: 'b2', title: '书签二', url: 'https://b.com' }
      ]
    },
    { id: 'b3', title: '书签三', url: 'https://c.com' }
  ]

  it('按置顶顺序返回命中的书签（忽略树中顺序）', () => {
    expect(findBookmarksByIds(tree, ['b3', 'b1']).map((n) => n.id)).toEqual([
      'b3',
      'b1'
    ])
  })

  it('跳过不在树中的失效 id', () => {
    expect(findBookmarksByIds(tree, ['b1', 'ghost']).map((n) => n.id)).toEqual([
      'b1'
    ])
  })

  it('文件夹节点（无 url）不被匹配', () => {
    expect(findBookmarksByIds(tree, ['folder1'])).toEqual([])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL，`usePinBookmarks.test.ts` 报模块不存在（Cannot find module './usePinBookmarks'），现有 5 个测试通过

- [ ] **Step 3: 编写实现 `src/newTab/store/usePinBookmarks.ts`**

```ts
import { useCallback } from 'react'
import { storage } from '@wxt-dev/storage'
import useWxtStorage from '@/hooks/useWxtStorage'
import type { BookmarkTreeNode } from '@/newTab/components/BookmarkTree'

/** 置顶书签 id 存储：只存 id，主页渲染时实时按 id 匹配书签树，保证数据一致 */
const pinBookmarksStorage = storage.defineItem<string[]>('local:pinBookmarks', {
  fallback: []
})

/** 切换 id 置顶状态：已置顶则移除，未置顶则追加到末尾，返回新数组 */
export function togglePinInList(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

/** 按置顶 id 顺序从书签树中递归查找书签节点；失效 id（已删除）自动跳过 */
export function findBookmarksByIds(
  nodes: BookmarkTreeNode[],
  ids: string[]
): BookmarkTreeNode[] {
  const idSet = new Set(ids)
  const found: BookmarkTreeNode[] = []
  const walk = (list: BookmarkTreeNode[]) => {
    for (const node of list) {
      if (node.url && idSet.has(node.id)) found.push(node)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  const byId = new Map(found.map((node) => [node.id, node]))
  return ids
    .map((id) => byId.get(id))
    .filter((node): node is BookmarkTreeNode => Boolean(node))
}

/** 置顶书签 hook：pinnedIds（置顶 id 列表）+ togglePin（切换置顶状态） */
export default function usePinBookmarks() {
  const [pinnedIds, setPinnedIds] = useWxtStorage(pinBookmarksStorage)
  const togglePin = useCallback(
    (id: string) => setPinnedIds(togglePinInList(pinnedIds, id)),
    [pinnedIds, setPinnedIds]
  )
  return { pinnedIds, togglePin }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS，新增 6 个用例全绿（总计 11/11）

- [ ] **Step 5: 提交**

```powershell
git add src/newTab/store/usePinBookmarks.ts src/newTab/store/usePinBookmarks.test.ts
$msg = @'
feat: 新增置顶书签 store（id 列表持久化 + 纯函数）

- local:pinBookmarks 仅存书签 id（方案 A），仿 useSettings 的 storage.defineItem + useWxtStorage 模式
- togglePinInList：置顶切换纯函数（含则移除、不含则追加）
- findBookmarksByIds：按置顶顺序从书签树递归匹配，失效 id 自动跳过
- 新增 6 个 Vitest 用例
'@
git commit -m $msg
```

---

### Task 2: BookmarkTree 图钉按钮 + BookmarkDialog 接入

**Files:**
- Modify: `src/newTab/components/BookmarkTree.tsx`
- Modify: `src/newTab/components/BookmarkDialog.tsx`

**Interfaces:**
- Consumes: `usePinBookmarks()`（Task 1，`{ pinnedIds: string[]; togglePin: (id: string) => void }`）
- Produces: `BookmarkTreeProps` 新增 `pinnedIds: Set<string>` 与 `onTogglePin: (id: string) => void`；`BookmarkDialog` 内部将 `pinnedIds` 转为 `Set` 传入

- [ ] **Step 1: 修改 `src/newTab/components/BookmarkTree.tsx`**

当前书签行是单个 `<button>`（内含标题/URL），图钉按钮不能嵌套在 button 内。将书签行重构为外层 `<div class="group ...">` + 两个独立 button（点击区 / 图钉）。

① 修改接口与图标导入：

```tsx
import { FolderIcon, GlobeIcon, PinIcon } from 'lucide-react'
```

```tsx
interface BookmarkTreeProps {
  nodes: BookmarkTreeNode[]
  /** 点击文件夹进入其内部 */
  onEnterFolder: (node: BookmarkTreeNode) => void
  /** 点击书签在新标签页打开 */
  onOpenBookmark: (url: string) => void
  /** 搜索关键词（高亮匹配部分） */
  searchQuery?: string
  /** 已置顶书签 id 集合 */
  pinnedIds: Set<string>
  /** 切换书签置顶状态 */
  onTogglePin: (id: string) => void
}
```

② 组件签名解构与书签行渲染改为：

```tsx
export default function BookmarkTree({
  nodes,
  onEnterFolder,
  onOpenBookmark,
  searchQuery,
  pinnedIds,
  onTogglePin
}: BookmarkTreeProps) {
```

书签项分支（`return (` 中的整个 `<li>`）替换为：

```tsx
        const isPinned = pinnedIds.has(node.id)
        return (
          <li key={node.id}>
            <div className='group flex w-full items-center rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted'>
              <button
                type='button'
                onClick={() => node.url && onOpenBookmark(node.url)}
                className='flex min-w-0 flex-1 items-center gap-1.5 text-left'
              >
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <div className='flex items-center gap-1.5'>
                    <GlobeIcon className='size-3.5 shrink-0 text-muted-foreground' />
                    <span className='truncate'>
                      <HighlightText text={node.title ?? ''} query={searchQuery} />
                    </span>
                  </div>
                  {node.url && (
                    <span className='truncate pl-5 text-xs text-muted-foreground'>
                      <HighlightText text={node.url} query={searchQuery} />
                    </span>
                  )}
                </div>
              </button>
              <button
                type='button'
                onClick={() => onTogglePin(node.id)}
                aria-label={isPinned ? '取消置顶' : '置顶'}
                className={`shrink-0 rounded-md p-1 transition-opacity ${isPinned ? 'text-foreground' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground'}`}
              >
                <PinIcon className={`size-3.5 ${isPinned ? 'fill-foreground' : ''}`} />
              </button>
            </div>
          </li>
        )
```

（文件夹分支不变。）

- [ ] **Step 2: 修改 `src/newTab/components/BookmarkDialog.tsx` 接入 usePinBookmarks**

① 导入与调用：

```tsx
import { useMemo } from 'react'
import usePinBookmarks from '@/newTab/store/usePinBookmarks'
```

组件内（`const [settings] = useSettings()` 之后）新增：

```tsx
  const { pinnedIds, togglePin } = usePinBookmarks()
  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds])
```

② `<BookmarkTree>` 传参处新增两个 props：

```tsx
                  <BookmarkTree
                    nodes={currentNodes}
                    onEnterFolder={enterFolder}
                    onOpenBookmark={(url) =>
                      settings.bookmarkTarget === 'current'
                        ? (window.location.href = url)
                        : window.open(url, '_blank')
                    }
                    searchQuery={isSearching ? searchQuery : undefined}
                    pinnedIds={pinnedIdSet}
                    onTogglePin={togglePin}
                  />
```

注意：`useMemo` 需加入现有 `import { useEffect, useMemo, useState } from 'react'` 行（已有 `useMemo`，无需重复导入；仅确认该行存在）。

- [ ] **Step 3: 验证编译与测试**

Run: `pnpm compile; pnpm test`
Expected: 退出码 0；vitest 11 个测试全部通过

- [ ] **Step 4: 提交**

```powershell
git add src/newTab/components/BookmarkTree.tsx src/newTab/components/BookmarkDialog.tsx
$msg = @'
feat: 书签弹窗列表项支持置顶

- BookmarkTree 书签行重构为「点击区 + 图钉按钮」（避免 button 嵌套），新增 pinnedIds/onTogglePin props
- 图钉按钮：未置顶悬停显示，已置顶常显高亮（PinIcon fill），点击切换置顶
- BookmarkDialog 经 usePinBookmarks 接入置顶状态并传入列表
'@
git commit -m $msg
```

---

### Task 3: PinnedBookmarks 主页卡片组件 + 挂载

**Files:**
- Create: `src/newTab/components/PinnedBookmarks.tsx`
- Modify: `src/newTab/app.tsx`

**Interfaces:**
- Consumes: `usePinBookmarks()`（Task 1）；`findBookmarksByIds`（Task 1）；`useSettings()`（`src/newTab/store/useSettings.ts`，`bookmarkTarget: 'current' | 'new'`）；`messageBus.send` + `BackgroundAction.BOOKMARK_GET_TREE.key`；`BookmarkTreeNode` 类型（`./BookmarkTree`）
- Produces: `default export function PinnedBookmarks()`（无 props），挂载于 `app.tsx` SearchBar 下方

- [ ] **Step 1: 新建 `src/newTab/components/PinnedBookmarks.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { GlobeIcon, PinOffIcon } from 'lucide-react'
import messageBus from '@/messages/message'
import { BackgroundAction } from '@/constants'
import usePinBookmarks, {
  findBookmarksByIds
} from '@/newTab/store/usePinBookmarks'
import useSettings from '@/newTab/store/useSettings'
import type { BookmarkTreeNode } from './BookmarkTree'

/**
 * 站点图标外部服务（硬编码 URL：Google favicon 服务，按域名取图标；加载失败组件内兜底 GlobeIcon）
 */
const faviconUrl = (host: string) =>
  `https://www.google.com/s2/favicons?domain=${host}&sz=64`

/** 提取 URL 域名，解析失败返回空串（兜底不显示图标） */
function safeHost(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/**
 * 主页置顶书签卡片区：置顶书签以卡片展示，无置顶时整块不渲染
 */
export default function PinnedBookmarks() {
  const { pinnedIds, togglePin } = usePinBookmarks()
  const [settings] = useSettings()
  const [bookmarks, setBookmarks] = useState<BookmarkTreeNode[]>([])

  // 无置顶书签时不拉取书签树，并清空残留卡片（取消全部置顶后整块消失）
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

  if (bookmarks.length === 0) return null

  return (
    <div className='flex flex-wrap justify-center gap-3'>
      {bookmarks.map((bookmark) => (
        <PinnedCard
          key={bookmark.id}
          bookmark={bookmark}
          target={settings.bookmarkTarget}
          onUnpin={() => togglePin(bookmark.id)}
        />
      ))}
    </div>
  )
}

function PinnedCard({
  bookmark,
  target,
  onUnpin
}: {
  bookmark: BookmarkTreeNode
  target: 'current' | 'new'
  onUnpin: () => void
}) {
  const [iconFailed, setIconFailed] = useState(false)
  const host = bookmark.url ? safeHost(bookmark.url) : ''

  const open = () => {
    if (!bookmark.url) return
    if (target === 'current') {
      window.location.href = bookmark.url
    } else {
      window.open(bookmark.url, '_blank')
    }
  }

  return (
    <div className='group relative flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 shadow-sm transition-colors hover:bg-muted'>
      <button
        type='button'
        onClick={open}
        className='flex min-w-0 items-center gap-2 text-left'
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
        <span className='max-w-40 truncate text-sm'>{bookmark.title ?? ''}</span>
      </button>
      <button
        type='button'
        onClick={onUnpin}
        aria-label='取消置顶'
        className='rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground'
      >
        <PinOffIcon className='size-3.5' />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 修改 `src/newTab/app.tsx` 挂载组件**

当前内容：

```tsx
import './styles/index.css'
import '@/styles/globals.css'
import bgImage from './assets/new-tab-bg.webp'
import useShortcuts from './hooks/useShortcuts'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  return (
    <div
      className='flex h-full w-full justify-center'
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
        <SearchBar />
        <SettingsDialog />
        <BookmarkDialog />
      </div>
    </div>
  )
}
export default App
```

改为（新增 import 与 `<PinnedBookmarks />`，置于 `<SearchBar />` 之后）：

```tsx
import './styles/index.css'
import '@/styles/globals.css'
import bgImage from './assets/new-tab-bg.webp'
import useShortcuts from './hooks/useShortcuts'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'
import PinnedBookmarks from './components/PinnedBookmarks'

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  return (
    <div
      className='flex h-full w-full justify-center'
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
        <SearchBar />
        <PinnedBookmarks />
        <SettingsDialog />
        <BookmarkDialog />
      </div>
    </div>
  )
}
export default App
```

- [ ] **Step 3: 验证编译与测试**

Run: `pnpm compile; pnpm test`
Expected: 退出码 0；vitest 11 个测试全部通过

- [ ] **Step 4: 提交**

```powershell
git add src/newTab/components/PinnedBookmarks.tsx src/newTab/app.tsx
$msg = @'
feat: 主页新增置顶书签卡片区

- PinnedBookmarks 挂载 SearchBar 下方：置顶书签按 id 匹配书签树生成卡片（favicon + 标题），无置顶时整块不渲染
- 卡片点击跟随 bookmarkTarget 设置；悬停显示取消置顶按钮（PinOffIcon）
- favicon 用 Google favicon 服务，加载失败兜底 GlobeIcon
'@
git commit -m $msg
```

---

### Task 4: 整体验证

**Files:**
- 无代码改动，纯验证

- [ ] **Step 1: 类型检查与测试**

Run: `pnpm compile; pnpm test`
Expected: 退出码 0；vitest 11 个测试全部通过（新增 6 + 现有 5）

- [ ] **Step 2: 浏览器实测清单**

Run: `pnpm dev`，在 Chrome 中加载扩展后逐项核验：

1. 打开书签弹窗（ctrl+k），hover 书签项出现图钉按钮，未置顶为浅色
2. 点击图钉 → 图钉高亮常显（fill 态）；再次点击 → 恢复浅色
3. 回到主页：SearchBar 下方出现置顶书签卡片（favicon + 标题），置顶多个书签时横向排列
4. 点击卡片：设置中「书签打开方式」为当前页则当前页跳转、为新页则新标签页打开
5. hover 卡片出现「取消置顶」按钮，点击后卡片立即消失
6. 刷新新标签页：置顶卡片仍在（storage 持久化生效）
7. 在 Chrome 书签管理器中删除某置顶书签 → 刷新主页，对应卡片消失（失效 id 跳过）
8. 取消全部置顶 → 主页卡片区整块消失，恢复原有简洁布局

- [ ] **Step 3: 收尾检查**

Run: `git status --short`
Expected: 工作区干净（无未提交改动）；`git log --oneline -4` 显示 4 条新提交（Task 1-3 + 设计文档）
