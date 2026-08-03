# newTab 书签弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 newTab 右上角设置按钮旁新增书签按钮，点击弹出 600px 弹窗，以文件资源管理器风格树形展示书签，点击书签新标签页打开。

**Architecture:** 新建 `BookmarkTree.tsx`（递归树组件，纯展示）与 `BookmarkDialog.tsx`（触发按钮 + 弹窗 + 数据获取 + 展开状态），数据经 background `BOOKMARK_GET_TREE` 消息接口获取（复用 `src/background/bookmarks.ts`），`app.tsx` 挂载。

**Tech Stack:** React 19, TypeScript, @base-ui/react Dialog, lucide-react 图标, MessageBus 消息总线。

## Global Constraints

- 缩进 2 空格；单引号、无分号、printWidth 80
- 弹窗宽度 `max-w-150`（600px），触发按钮 `fixed right-14 top-2 z-40 size-9` 圆形，与设置按钮样式一致
- 消息 action 必须取 `BackgroundAction.BOOKMARK_GET_TREE`（禁止硬编码字符串）
- 图标从 lucide-react 导入（带 `Icon` 后缀，如 `BookmarkIcon`）
- 导入别名 `@/` 指向 `src/`
- 提交信息统一中文；PowerShell 下用 `$msg = @'...'@` 承接多行消息再 `git commit -m $msg`
- 现有测试保持通过（`pnpm test` 5/5）；本功能无纯逻辑可测（UI 组件），验证以 `pnpm compile` + `pnpm test` + 浏览器实测为准

---

### Task 1: 新增 BookmarkTree 递归树组件

**Files:**
- Create: `src/newTab/components/BookmarkTree.tsx`

**Interfaces:**
- Produces: `export interface BookmarkTreeNode { id: string; title?: string; url?: string; children?: BookmarkTreeNode[] }`；`export default function BookmarkTree({ nodes, expanded, onToggle }: BookmarkTreeProps)`，其中 `BookmarkTreeProps = { nodes: BookmarkTreeNode[]; expanded: Set<string>; onToggle: (id: string) => void }`。Task 2 消费此接口。

- [ ] **Step 1: 新建 `src/newTab/components/BookmarkTree.tsx`**

```tsx
import { ChevronRightIcon, FolderIcon, GlobeIcon } from 'lucide-react'

/** 书签树节点最小字段（与 background 返回的浏览器书签结构一致） */
export interface BookmarkTreeNode {
  id: string
  title?: string
  url?: string
  children?: BookmarkTreeNode[]
}

interface BookmarkTreeProps {
  nodes: BookmarkTreeNode[]
  /** 已展开的文件夹 id 集合 */
  expanded: Set<string>
  /** 切换文件夹展开状态 */
  onToggle: (id: string) => void
}

/**
 * 书签树递归渲染：文件夹节点可展开/折叠，书签节点点击在新标签页打开
 */
export default function BookmarkTree({
  nodes,
  expanded,
  onToggle
}: BookmarkTreeProps) {
  return (
    <ul className='flex flex-col gap-0.5'>
      {nodes.map((node) => {
        const isFolder = Array.isArray(node.children)
        const isExpanded = expanded.has(node.id)
        if (isFolder) {
          return (
            <li key={node.id}>
              <button
                type='button'
                onClick={() => onToggle(node.id)}
                className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted'
              >
                <ChevronRightIcon
                  className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
                <FolderIcon className='size-3.5 shrink-0 text-muted-foreground' />
                <span className='truncate'>{node.title}</span>
              </button>
              {isExpanded && node.children && (
                <div className='ml-4 border-l border-border pl-2'>
                  <BookmarkTree
                    nodes={node.children}
                    expanded={expanded}
                    onToggle={onToggle}
                  />
                </div>
              )}
            </li>
          )
        }
        return (
          <li key={node.id}>
            <button
              type='button'
              onClick={() => node.url && window.open(node.url, '_blank')}
              className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted'
            >
              <GlobeIcon className='size-3.5 shrink-0 text-muted-foreground' />
              <span className='truncate'>{node.title}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 2: 验证编译**

Run: `pnpm compile`
Expected: 退出码 0，无错误输出

- [ ] **Step 3: 提交**

```powershell
git add src/newTab/components/BookmarkTree.tsx
$msg = @'
feat: 新增 BookmarkTree 书签树组件

- 递归渲染书签树：文件夹节点（FolderIcon + 名称）可展开/折叠，书签节点（GlobeIcon + 标题）点击在新标签页打开
- 展开状态由父组件通过 expanded Set 与 onToggle 回调控制，默认全部折叠
'@
git commit -m $msg
```

---

### Task 2: 新增 BookmarkDialog 弹窗并挂载

**Files:**
- Create: `src/newTab/components/BookmarkDialog.tsx`
- Modify: `src/newTab/app.tsx`

**Interfaces:**
- Consumes: `BookmarkTreeNode` 与 `BookmarkTree` 组件（Task 1）；`BackgroundAction.BOOKMARK_GET_TREE`（`src/constants/index.ts`，值为 `'bookmark-get-tree'`）；`messageBus.send<T, R>(action, payload?)` 返回 `Promise<MessageResponse<R>>`，`MessageResponse<R>` 形如 `{ code: number; data?: R }`
- Produces: `default export function BookmarkDialog()`（无 props），挂载于 `app.tsx`

- [ ] **Step 1: 新建 `src/newTab/components/BookmarkDialog.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { BookmarkIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import messageBus from '@/messages/message'
import { BackgroundAction } from '@/constants'
import BookmarkTree, { type BookmarkTreeNode } from './BookmarkTree'

/**
 * 书签弹窗：右上角书签按钮，点击弹出 600px 弹窗展示书签树
 * 数据经 background BOOKMARK_GET_TREE 消息接口获取
 */
export default function BookmarkDialog() {
  const [tree, setTree] = useState<BookmarkTreeNode[]>([])
  // 展开的文件夹 id 集合，默认全部折叠
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    messageBus
      .send<undefined, BookmarkTreeNode[]>(BackgroundAction.BOOKMARK_GET_TREE)
      .then((res) => setTree(res?.data ?? []))
  }, [])

  const toggleFolder = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <Dialog modal>
      <DialogTrigger
        aria-label='书签'
        className='fixed right-14 top-2 z-40 flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      >
        <BookmarkIcon className='size-5' />
      </DialogTrigger>
      <DialogContent
        aria-label='书签'
        showCloseButton={false}
        className='max-w-150 sm:max-w-150'
      >
        <DialogTitle>书签</DialogTitle>
        {tree.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            暂无书签
          </p>
        ) : (
          <div className='max-h-125 overflow-y-auto pr-1'>
            <BookmarkTree
              nodes={tree}
              expanded={expanded}
              onToggle={toggleFolder}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: 修改 `src/newTab/app.tsx` 挂载组件**

当前内容：

```tsx
import './styles/index.css'
import '@/styles/globals.css'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'

function App() {
  return (
    <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
      <SearchBar />
      <SettingsDialog />
    </div>
  )
}
export default App
```

改为：

```tsx
import './styles/index.css'
import '@/styles/globals.css'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'

function App() {
  return (
    <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
      <SearchBar />
      <SettingsDialog />
      <BookmarkDialog />
    </div>
  )
}
export default App
```

- [ ] **Step 3: 验证编译与测试**

Run: `pnpm compile; pnpm test`
Expected: 退出码 0；vitest 5 个测试全部通过

- [ ] **Step 4: 提交**

```powershell
git add src/newTab/components/BookmarkDialog.tsx src/newTab/app.tsx
$msg = @'
feat: 新增书签弹窗并挂载到 newTab

- BookmarkDialog：右上角设置按钮旁新增书签按钮（fixed right-14 top-2 圆形），点击弹出 600px 弹窗
- 复用 background BOOKMARK_GET_TREE 接口获取书签树，树容器 max-h-125 可滚动，空数据展示「暂无书签」
- app.tsx 挂载 BookmarkDialog
'@
git commit -m $msg
```
