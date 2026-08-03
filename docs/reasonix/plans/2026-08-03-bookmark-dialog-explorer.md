# 书签弹窗资源管理器式浏览重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将书签弹窗的树形展开交互重构为 Windows 资源管理器式目录浏览：内容区显示当前目录，点击文件夹进入其内部，面包屑 + 返回按钮导航。

**Architecture:** 重构 `BookmarkTree.tsx` 为当前目录内容列表（props 改为 `nodes` + `onEnterFolder` + `onOpenBookmark`）；重构 `BookmarkDialog.tsx` 用 `path` 路径栈替代 `expanded` Set，新增顶部返回按钮与面包屑导航。

**Tech Stack:** React 19, TypeScript, @base-ui/react Dialog, lucide-react 图标, MessageBus。

## Global Constraints

- 缩进 2 空格；单引号、无分号、printWidth 80
- 弹窗宽度 `max-w-150`（600px），树容器 `h-150`（固定 600px）保持现状
- 消息 action 必须取 `BackgroundAction.BOOKMARK_GET_TREE.key`（禁止硬编码字符串）
- 图标从 lucide-react 导入（带 `Icon` 后缀）
- 导入别名 `@/` 指向 `src/`
- 提交信息统一中文；PowerShell 下用 `$msg = @'...'@` 承接多行消息再 `git commit -m $msg`
- 现有测试保持通过（`pnpm test` 5/5）；本功能无纯逻辑可测，验证以 `pnpm compile` + `pnpm test` + 浏览器实测为准

---

### Task 1: 重构 BookmarkTree 为目录内容列表

**Files:**
- Modify: `src/newTab/components/BookmarkTree.tsx`（整体替换，73 行 → 约 60 行）

**Interfaces:**
- Produces: `export interface BookmarkTreeNode { id: string; title?: string; url?: string; children?: BookmarkTreeNode[] }`（不变）；`export default function BookmarkTree({ nodes, onEnterFolder, onOpenBookmark }: BookmarkTreeProps)`，其中 `BookmarkTreeProps = { nodes: BookmarkTreeNode[]; onEnterFolder: (node: BookmarkTreeNode) => void; onOpenBookmark: (url: string) => void }`。Task 2 消费此接口。移除原 `expanded`/`onToggle` props。

- [ ] **Step 1: 整体替换 `src/newTab/components/BookmarkTree.tsx`**

```tsx
import { FolderIcon, GlobeIcon } from 'lucide-react'

/** 书签树节点最小字段（与 background 返回的浏览器书签结构一致） */
export interface BookmarkTreeNode {
  id: string
  title?: string
  url?: string
  children?: BookmarkTreeNode[]
}

interface BookmarkTreeProps {
  nodes: BookmarkTreeNode[]
  /** 点击文件夹进入其内部 */
  onEnterFolder: (node: BookmarkTreeNode) => void
  /** 点击书签在新标签页打开 */
  onOpenBookmark: (url: string) => void
}

/**
 * 目录内容列表：平铺渲染当前目录的文件夹与书签，点击文件夹进入
 */
export default function BookmarkTree({
  nodes,
  onEnterFolder,
  onOpenBookmark
}: BookmarkTreeProps) {
  return (
    <ul className='flex flex-col gap-0.5'>
      {nodes.map((node) => {
        const isFolder = Array.isArray(node.children)
        if (isFolder) {
          return (
            <li key={node.id}>
              <button
                type='button'
                onClick={() => onEnterFolder(node)}
                className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted'
              >
                <FolderIcon className='size-3.5 shrink-0 text-muted-foreground' />
                <span className='truncate'>{node.title}</span>
              </button>
            </li>
          )
        }
        return (
          <li key={node.id}>
            <button
              type='button'
              onClick={() => node.url && onOpenBookmark(node.url)}
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
Expected: 退出码 0（注意：Task 2 尚未改，BookmarkDialog 此时仍按旧 props 调用会报错——若编译报 BookmarkDialog 相关错误属预期，Task 2 完成后消除；此处只需确认 BookmarkTree.tsx 自身无语法错误）

- [ ] **Step 3: 提交**

```powershell
git add src/newTab/components/BookmarkTree.tsx
$msg = @'
refactor: BookmarkTree 改为目录内容列表

- 移除递归展开逻辑（expanded/onToggle），改为平铺渲染当前目录的文件夹与书签
- props 改为 nodes + onEnterFolder + onOpenBookmark，点击文件夹进入、书签新标签页打开
'@
git commit -m $msg
```

---

### Task 2: 重构 BookmarkDialog 为路径栈 + 面包屑导航

**Files:**
- Modify: `src/newTab/components/BookmarkDialog.tsx`（整体替换，70 行 → 约 125 行）

**Interfaces:**
- Consumes: `BookmarkTreeNode`、`BookmarkTree`（Task 1，props `nodes`/`onEnterFolder`/`onOpenBookmark`）；`BackgroundAction.BOOKMARK_GET_TREE.key`（`@/constants`）；`messageBus.send<undefined, BookmarkTreeNode[]>(action)` 返回 `Promise<MessageResponse<BookmarkTreeNode[]>>`
- Produces: `export default function BookmarkDialog()`（无 props），`app.tsx` 挂载不变（无需改 app.tsx）

- [ ] **Step 1: 整体替换 `src/newTab/components/BookmarkDialog.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { BookmarkIcon, ChevronLeftIcon } from 'lucide-react'
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
 * 书签弹窗：右上角书签按钮，点击弹出 600px 弹窗
 * 资源管理器式目录浏览：点击文件夹进入，面包屑 + 返回按钮导航
 */
export default function BookmarkDialog() {
  const [tree, setTree] = useState<BookmarkTreeNode[]>([])
  // 当前目录路径栈，[] 表示根目录
  const [path, setPath] = useState<BookmarkTreeNode[]>([])

  useEffect(() => {
    messageBus
      .send<undefined, BookmarkTreeNode[]>(BackgroundAction.BOOKMARK_GET_TREE.key)
      .then((res) => setTree(res?.data ?? []))
  }, [])

  // 当前目录内容：根目录为 tree，否则为路径栈顶文件夹的 children
  const currentNodes =
    path.length === 0 ? tree : path[path.length - 1].children ?? []

  const enterFolder = (node: BookmarkTreeNode) => {
    setPath((prev) => [...prev, node])
  }

  const goBack = () => {
    setPath((prev) => prev.slice(0, -1))
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
          <>
            <div className='flex items-center gap-1 border-b border-border pb-2'>
              {path.length > 0 && (
                <button
                  type='button'
                  onClick={goBack}
                  aria-label='返回上级'
                  className='flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronLeftIcon className='size-4' />
                </button>
              )}
              <nav className='flex min-w-0 flex-1 items-center gap-1 text-sm text-muted-foreground'>
                <button
                  type='button'
                  onClick={() => setPath([])}
                  className='shrink-0 rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground'
                >
                  根
                </button>
                {path.map((node, index) => (
                  <span key={node.id} className='flex min-w-0 items-center gap-1'>
                    <span className='text-muted-foreground/50'>/</span>
                    <button
                      type='button'
                      onClick={() => setPath(path.slice(0, index + 1))}
                      className='truncate rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground'
                    >
                      {node.title}
                    </button>
                  </span>
                ))}
              </nav>
            </div>
            {currentNodes.length === 0 ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>
                此文件夹为空
              </p>
            ) : (
              <div className='h-150 overflow-y-auto pr-1'>
                <BookmarkTree
                  nodes={currentNodes}
                  onEnterFolder={enterFolder}
                  onOpenBookmark={(url) => window.open(url, '_blank')}
                />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: 验证编译与测试**

Run: `pnpm compile; pnpm test`
Expected: 退出码 0；vitest 5 个测试全部通过（Task 1 遗留的 BookmarkDialog 编译错误此时应消除）

- [ ] **Step 3: 提交**

```powershell
git add src/newTab/components/BookmarkDialog.tsx
$msg = @'
refactor: BookmarkDialog 改为资源管理器式目录浏览

- 展开状态 expanded Set 改为 path 路径栈，点击文件夹进入其内部，根目录显示 getTree 根文件夹
- 顶部新增返回按钮（←）与面包屑导航（根/层级可点击跳回）
- 空目录显示「此文件夹为空」，树容器保持 h-150 固定高度
'@
git commit -m $msg
```
