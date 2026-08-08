# 书签弹窗方向键控制 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为书签弹窗列表增加键盘导航：上下键循环移动高亮、Enter 激活高亮项（文件夹进入 / 书签打开），交互与 `SuggestPopover` 一致。

**Architecture:** 键盘导航逻辑内聚在 `BookmarkTree` 内部（方案 B）：组件内部管理 `activeIndex` 状态，通过 React 19 ref-as-prop 模式暴露 `handleKeyDown` 句柄；`BookmarkDialog` 在搜索框 `onKeyDown` 中调用该句柄消费方向键/Enter。滚动跟随用 `scrollIntoView({ block: 'nearest' })`。

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, lucide-react

## Global Constraints

- 交互规格以 `docs/superpowers/specs/2026-08-08-bookmark-dialog-keyboard-nav-design.md` 为准
- 初始高亮为 `-1`（无高亮），第一次按方向键从第一项开始；列表变化（进入/返回目录、搜索词变化）重置为 `-1`
- 方向键循环移动（`-1` 按下 → 第一项，到底回绕）；长按 key repeat 用 `useThrottleFn` 限频 `{ wait: 180, trailing: false }`
- Enter 激活：文件夹（`Array.isArray(node.children)`）→ `onEnterFolder(node)`；书签 → `onOpenBookmark(node.url)`；无高亮不动作
- 中文输入法组合期间（`e.nativeEvent.isComposing`）不消费事件（在 `BookmarkDialog` 的 `onKeyDown` 判断）
- 组件风格沿用 `SuggestPopover` 的 ref-as-prop 模式（`ref?: Ref<Handle>` + `useImperativeHandle`），不用传统 `forwardRef`
- 高亮类用 `bg-muted`（与现有 `hover:bg-muted` 一致），用模板字符串拼接，不改现有 className 结构与缩进
- 不改动 `Dialog` / `ScrollArea` 等 UI 组件；置顶按钮（PinIcon）不参与键盘导航
- 代码风格：2 空格缩进、单引号、无分号、无尾逗号、80 字符行宽
- 禁止 `git add .`，逐个暂存文件
- 项目无 UI 渲染测试框架，验证方式为 `pnpm compile`（tsc）+ `pnpm test` + 手动浏览器检查（与 2026-08-05-header-nav 计划一致）

---

### Task 1: BookmarkTree 增加键盘导航

**Files:**
- Modify: `src/newTab/components/BookmarkTree.tsx`

**Interfaces:**
- Consumes: 现有 `BookmarkTreeNode`、`BookmarkTreeProps`（`nodes` / `onEnterFolder` / `onOpenBookmark` / `searchQuery` / `pinnedIds` / `onTogglePin`）；`useThrottleFn`（来自 `@/hooks/useThrottledFn`）
- Produces: 新增导出 `BookmarkTreeHandle` 接口 `{ handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => boolean }`；props 新增 `ref?: Ref<BookmarkTreeHandle>`。Task 2 依赖此句柄

- [ ] **Step 1: 改写 BookmarkTree.tsx**

顶部 import 改为（新增 `useEffect` / `useImperativeHandle` / `useRef` / `KeyboardEvent` / `Ref` 与 `useThrottleFn`）：

```tsx
import { FolderIcon, GlobeIcon, PinIcon } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref
} from 'react'
import { faviconUrl, safeHost } from '@/utils'
import { useThrottleFn } from '@/hooks/useThrottledFn'
```

在 `BookmarkTreeNode` 接口之后新增：

```tsx
/** 键盘导航句柄：方向键切换高亮、回车激活；返回 true 表示事件已被消费 */
export interface BookmarkTreeHandle {
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => boolean
}
```

`BookmarkTreeProps` 末尾新增一行：

```tsx
  /** 切换书签置顶状态 */
  onTogglePin: (id: string) => void
  ref?: Ref<BookmarkTreeHandle>
```

组件签名与内部逻辑改为：

```tsx
export default function BookmarkTree({
  nodes,
  onEnterFolder,
  onOpenBookmark,
  searchQuery,
  pinnedIds,
  onTogglePin,
  ref
}: BookmarkTreeProps) {
  // 键盘导航高亮索引，-1 表示无高亮；nodes 变化时重置
  const [activeIndex, setActiveIndex] = useState(-1)
  // 高亮项 DOM 引用，用于滚动跟随
  const activeItemRef = useRef<HTMLLIElement | null>(null)

  // 进入/返回目录、搜索词变化导致列表刷新时重置高亮
  useEffect(() => {
    setActiveIndex(-1)
  }, [nodes])

  // 高亮项变化时滚动到可视区
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // 节流方向键切换：长按 key repeat（~30ms/次）时限制切换频率，避免高亮闪烁不可见
  const throttledMove = useThrottleFn((direction: -1 | 1) => {
    setActiveIndex((i) => {
      if (direction > 0) return (i + 1) % nodes.length
      return i <= 0 ? nodes.length - 1 : i - 1
    })
  }, { wait: 180, trailing: false })

  // 方向键切换高亮、回车激活高亮项（文件夹进入 / 书签打开）；返回 true 表示事件已被消费
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (nodes.length === 0) return false
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      throttledMove(1)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      throttledMove(-1)
      return true
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      const node = nodes[activeIndex]
      e.preventDefault()
      if (Array.isArray(node.children)) onEnterFolder(node)
      else if (node.url) onOpenBookmark(node.url)
      return true
    }
    return false
  }

  useImperativeHandle(ref, () => ({ handleKeyDown }))

  return (
    <ul className='flex flex-col gap-0.5'>
      {nodes.map((node, index) => {
        const isActive = index === activeIndex
        const isFolder = Array.isArray(node.children)
        if (isFolder) {
          return (
            <li key={node.id} ref={isActive ? activeItemRef : undefined}>
              <button
                type='button'
                onClick={() => onEnterFolder(node)}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted ${isActive ? 'bg-muted' : ''}`}
              >
                <FolderIcon className='size-3.5 shrink-0 text-muted-foreground' />
                <span className='truncate'>
                  <HighlightText text={node.title ?? ''} query={searchQuery} />
                </span>
              </button>
            </li>
          )
        }
        const isPinned = pinnedIds.has(node.id)
        return (
          <li key={node.id} ref={isActive ? activeItemRef : undefined}>
            <div className={`group flex w-full items-center rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted ${isActive ? 'bg-muted' : ''}`}>
              <button
                type='button'
                onClick={() => node.url && onOpenBookmark(node.url)}
                className='flex min-w-0 flex-1 items-center gap-1.5 text-left'
              >
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <div className='flex items-center gap-1.5'>
                    <BookmarkFavicon url={node.url} />
                    <span className='truncate'>
                      <HighlightText text={node.title ?? ''} query={searchQuery} />
                    </span>
                  </div>
                  {node.url && (
                    <span className='truncate pl-6 text-xs text-muted-foreground'>
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
      })}
    </ul>
  )
}
```

要点：
- `HighlightText`、`BookmarkFavicon` 两个内部组件及 `BookmarkTreeNode` 接口保持不变
- 书签项高亮加在 `li > div` 上（与 hover 位置一致）；`bg-muted` 与 `hover:bg-muted` 叠加时 hover 优先（类顺序无影响）
- `useThrottleFn` 的 `leading` 默认 true，首次按键立即切换

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/newTab/components/BookmarkTree.tsx
git commit -m "feat: 书签列表支持方向键导航

- BookmarkTree 内部管理高亮索引，暴露 handleKeyDown 句柄
- 上下键循环移动高亮（节流限频），回车激活文件夹/书签
- 高亮项滚动跟随，列表刷新时重置高亮"
```

---

### Task 2: BookmarkDialog 接入键盘句柄

**Files:**
- Modify: `src/newTab/components/BookmarkDialog.tsx`

**Interfaces:**
- Consumes: Task 1 的 `BookmarkTreeHandle`；现有 `searchInputRef`（弹窗打开时自动聚焦）
- Produces: 无（`BookmarkDialog` 仍默认导出，弹窗内容不变）

- [ ] **Step 1: 接入 treeRef 与搜索框 onKeyDown**

第 20 行的 BookmarkTree import 改为（新增 `BookmarkTreeHandle` 类型）：

```tsx
import BookmarkTree, {
  type BookmarkTreeNode,
  type BookmarkTreeHandle
} from './BookmarkTree'
```

在 `const searchInputRef = useRef<HTMLInputElement>(null)` 之后新增：

```tsx
  // 列表键盘导航句柄：方向键/回车由 BookmarkTree 内部处理
  const treeRef = useRef<BookmarkTreeHandle>(null)
```

搜索框 `Input`（`className='pl-8'` 之前）新增 `onKeyDown`：

```tsx
              <Input
                ref={searchInputRef}
                placeholder='搜索书签...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim()) setPath([])
                }}
                onKeyDown={(e) => {
                  // 中文输入法组合期间不消费按键，避免干扰选词
                  if (e.nativeEvent.isComposing) return
                  treeRef.current?.handleKeyDown(e)
                }}
                className='pl-8'
                autoFocus={false}
              />
```

`<BookmarkTree` 标签新增 `ref={treeRef}`：

```tsx
                  <BookmarkTree
                    ref={treeRef}
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

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/newTab/components/BookmarkDialog.tsx
git commit -m "feat: 书签弹窗搜索框接入方向键导航

- 搜索框 onKeyDown 委托给 BookmarkTree 的 handleKeyDown
- 中文输入法组合期间不消费按键"
```

---

### Task 3: 整体验证

**Files:**
- 无改动，仅验证

- [ ] **Step 1: 类型检查 + 测试**

Run: `pnpm compile && pnpm test`
Expected: 两者均通过（exit 0）

- [ ] **Step 2: 手动浏览器验证**

Run: `pnpm dev`（Chrome 加载扩展），人工核对：

1. 打开书签弹窗（Ctrl+K），焦点在搜索框，列表无高亮
2. 按 `ArrowDown` 高亮第一项（`bg-muted` 背景），继续按下循环移动、到末尾回绕第一项；`ArrowUp` 反向循环
3. 高亮文件夹按 `Enter` 进入该文件夹，进入后高亮重置为无
4. 高亮书签按 `Enter` 打开（`bookmarkTarget` 为 current 时当前页打开，new 时新标签页）
5. 按返回按钮/面包屑返回后高亮重置为无
6. 搜索框输入关键词，搜索结果中方向键仍可移动高亮、Enter 激活；修改搜索词后高亮重置
7. 搜索框输入中文（输入法组合中，如拼音候选）时，方向键/Enter 不被列表消费
8. 长按方向键高亮连续移动且无闪烁（节流生效）
9. 高亮项超出可视区时列表自动滚动跟随
10. 原有鼠标点击、Tab 键、搜索、置顶功能不受影响

- [ ] **Step 3: 收尾（无未提交改动则跳过）**

Run: `git status`
Expected: working tree clean
