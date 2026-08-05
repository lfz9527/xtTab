# Header 导航栏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增顶部透明毛玻璃 Header 导航栏，将书签/设置入口收纳其中，页面改为上（Header）中（搜索框）下（置顶书签）三段式布局。

**Architecture:** 新建独立 `Header` 组件（fixed 顶部、透明背景 + `backdrop-blur-md`），从 `SettingsDialog` / `BookmarkDialog` 中移除各自的 `DialogTrigger` 按钮，弹窗改为纯受控（`open` 由 `useAppStore` 驱动）。`app.tsx` 调整为三段式布局。

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, zustand, lucide-react

## Global Constraints

- 弹窗开关沿用 `useAppStore`（`bookmarkOpen` / `settingsOpen` 及 setter），不新增状态
- 按钮样式沿用现有圆形悬浮按钮：`size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground`
- Header 定位 `fixed inset-x-0 top-0 z-40`，背景透明 + `backdrop-blur-md`
- 弹窗内容逻辑（书签树浏览、设置项、快捷键）一律不动
- 代码风格：2 空格缩进、单引号、无分号、无尾逗号、80 字符行宽
- 禁止 `git add .`，逐个暂存文件
- 项目无 UI 渲染测试框架，验证方式为 `pnpm compile`（tsc）+ 手动浏览器检查

---

### Task 1: 新建 Header 组件

**Files:**
- Create: `src/newTab/components/Header.tsx`

**Interfaces:**
- Consumes: `useAppStore` 的 `setBookmarkOpen(open: boolean)`、`setSettingsOpen(open: boolean)`
- Produces: `Header` 默认导出组件，无 props

- [ ] **Step 1: 创建 Header.tsx**

```tsx
import { BookmarkIcon, SettingsIcon } from 'lucide-react'
import { useAppStore } from '@/newTab/store/useAppStore'

/**
 * 顶部导航栏：透明 + 毛玻璃模糊，右侧收纳书签/设置入口
 */
export default function Header() {
  const setBookmarkOpen = useAppStore((s) => s.setBookmarkOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  return (
    <header className='fixed inset-x-0 top-0 z-40 bg-transparent backdrop-blur-md'>
      <div className='flex items-center justify-end gap-2 p-2 pr-4'>
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
git commit -m "feat: 新增顶部 Header 导航栏组件

- 透明背景 + backdrop-blur-md 毛玻璃效果
- 右侧收纳书签/设置图标入口，点击打开对应弹窗"
```

---

### Task 2: SettingsDialog 移除 DialogTrigger

**Files:**
- Modify: `src/newTab/components/SettingsDialog.tsx`（移除 trigger 块 + `SettingsIcon`/`DialogTrigger` import）

**Interfaces:**
- Consumes: Task 1 的 `Header`（负责设置入口点击）
- Produces: 无（`SettingsDialog` 仍默认导出，弹窗内容不变）

- [ ] **Step 1: 移除 DialogTrigger 块**

删除 `SettingsDialog.tsx` 中第 86-92 行的 trigger（`<Dialog modal open={open} onOpenChange={setOpen}>` 之后的 `DialogTrigger ... </DialogTrigger>`），使结构变为：

```tsx
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-label='设置'
        showCloseButton={false}
        className='max-w-225 sm:max-w-225 overflow-hidden p-0'
      >
```

- [ ] **Step 2: 清理不再使用的 import**

第 1 行改为（`SettingsIcon` 仅 trigger 使用，移除；`PlusIcon`/`Trash2Icon` 仍用）：

```tsx
import { PlusIcon, Trash2Icon } from 'lucide-react'
```

dialog import 改为（移除 `DialogTrigger`）：

```tsx
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
```

- [ ] **Step 3: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0），且无未使用 import 报错

- [ ] **Step 4: 提交**

```bash
git add src/newTab/components/SettingsDialog.tsx
git commit -m "refactor: 设置弹窗移除内嵌 DialogTrigger

- 设置入口迁移至顶部 Header，弹窗改为纯受控"
```

---

### Task 3: BookmarkDialog 移除 DialogTrigger

**Files:**
- Modify: `src/newTab/components/BookmarkDialog.tsx`（移除 trigger 块 + `BookmarkIcon`/`DialogTrigger` import）

**Interfaces:**
- Consumes: Task 1 的 `Header`（负责书签入口点击）
- Produces: 无（`BookmarkDialog` 仍默认导出，弹窗内容不变）

- [ ] **Step 1: 移除 DialogTrigger 块**

删除 `BookmarkDialog.tsx` 中第 103-109 行的 trigger（`<Dialog modal open={open} onOpenChange={setOpen}>` 之后的 `DialogTrigger ... </DialogTrigger>`），使结构变为：

```tsx
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-label='书签'
        showCloseButton={false}
        initialFocus={false}
        className='max-w-175 sm:max-w-175'
      >
```

- [ ] **Step 2: 清理不再使用的 import**

第 2 行改为（`BookmarkIcon` 仅 trigger 使用，移除；`ChevronLeftIcon`/`SearchIcon` 仍用）：

```tsx
import { ChevronLeftIcon, SearchIcon } from 'lucide-react'
```

dialog import 改为（移除 `DialogTrigger`）：

```tsx
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
```

- [ ] **Step 3: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0），且无未使用 import 报错

- [ ] **Step 4: 提交**

```bash
git add src/newTab/components/BookmarkDialog.tsx
git commit -m "refactor: 书签弹窗移除内嵌 DialogTrigger

- 书签入口迁移至顶部 Header，弹窗改为纯受控"
```

---

### Task 4: app.tsx 改为上中下三段式布局

**Files:**
- Modify: `src/newTab/app.tsx`

**Interfaces:**
- Consumes: Task 1 的 `Header`；既有 `SearchBar`、`SettingsDialog`、`BookmarkDialog`、`PinnedBookmarks`
- Produces: 无（App 默认导出不变）

- [ ] **Step 1: 改写 app.tsx**

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

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  return (
    <div
      className='flex h-full w-full flex-col items-center'
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 上：顶部导航栏（fixed 定位，不占文档流） */}
      <Header />
      {/* 中：搜索框（偏上部） */}
      <main className='flex w-full flex-1 flex-col items-center'>
        <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
          <SearchBar />
        </div>
      </main>
      {/* 下：置顶书签卡片区（flex-1 撑开中间，卡片区自然沉底，外层 items-center 保持居中） */}
      <PinnedBookmarks />
      {/* 弹窗（fixed 定位，不影响布局） */}
      <SettingsDialog />
      <BookmarkDialog />
    </div>
  )
}
export default App
```

要点：
- 外层移除原 `gap-10`，保留 `items-center` 使底部 `PinnedBookmarks`（max-w-300）居中
- `main` 用 `flex-1` 撑开中部空间，内部 `max-w-160` 容器保持原 `pt-50`（搜索框偏上）
- `Header` fixed 不占文档流，弹窗 fixed 不占文档流

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）

- [ ] **Step 3: 提交**

```bash
git add src/newTab/app.tsx
git commit -m "ui: 新标签页改为上中下三段式布局

- 顶部 Header 导航栏，中部搜索框偏上，底部置顶书签卡片
- 布局由 gap-10 单列改为 flex-1 撑开的三段结构"
```

---

### Task 5: 整体验证

**Files:**
- 无改动，仅验证

- [ ] **Step 1: 类型检查 + 测试**

Run: `pnpm compile && pnpm test`
Expected: 两者均通过（exit 0）

- [ ] **Step 2: 手动浏览器验证**

Run: `pnpm dev`（Chrome 加载扩展），人工核对：

1. 页面顶部出现透明毛玻璃 Header，右侧含书签、设置两个图标按钮
2. 点击书签按钮 → 书签弹窗打开；点击设置按钮 → 设置弹窗打开
3. 原右上角两个悬浮按钮消失，无残留
4. 搜索框位于中部偏上，置顶书签卡片位于底部且居中
5. 快捷键（Ctrl+K 书签 / Ctrl+, 设置）仍可打开弹窗
6. 书签弹窗浏览、搜索、置顶操作正常；设置项正常

- [ ] **Step 3: 收尾（无未提交改动则跳过）**

Run: `git status`
Expected: working tree clean
