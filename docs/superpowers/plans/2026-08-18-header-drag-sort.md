# Header 左侧按钮拖拽排序 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让新标签页顶部导航栏左侧的视图切换按钮（快捷书签 / 标签页）支持拖拽排序，顺序持久化，且新标签页默认展示排序首位按钮对应的视图。

**Architecture:** 新增 `useHeaderViews` 存储层（`local:headerViewOrder` 持久化 + `normalizeViews` 清洗 + `moveView` 拖拽更新），沿用项目现有 `storage.defineItem` + `useWxtStorage` 模式；`useAppStore.activeHeaderView` 语义改为「null = 未手动选择」，由 `app.tsx` 派生 `effectiveView = activeHeaderView ?? viewOrder[0]` 统一驱动 Header 高亮与内容区渲染；Header 左侧按钮用新版 @dnd-kit（`DragDropProvider` + `useSortable` + `move`）实现整按钮拖拽。

**Tech Stack:** React 19、TypeScript、zustand、WXT storage（`@wxt-dev/storage`）、`@dnd-kit/react` ^0.5.0、`@dnd-kit/helpers` ^0.5.0、Vitest

## Global Constraints

- 依赖已安装：`@dnd-kit/react@0.5.0`、`@dnd-kit/helpers@0.5.0`（`@dnd-kit/dom`/`abstract` 为自动依赖）；`package.json`、`pnpm-lock.yaml` 已变更，随 Task 1 一并提交
- `HeaderView` 类型定义于 `src/newTab/store/useAppStore.ts`（`export type HeaderView = 'pins' | 'tabs'`），禁止重复定义
- 存储模式：`storage.defineItem` + `useWxtStorage`（见 `src/newTab/store/usePinBookmarks.ts`）；纯逻辑导出为纯函数供 vitest 单测（见 `src/newTab/store/usePinBookmarks.test.ts`）
- `useWxtStorage` 的 setter 只接受新值，**不支持函数式更新**（`setState(fn)` 形式），更新时必须基于闭包内的当前值计算新数组
- dnd 新版 API：`DragDropProvider`（默认内置 PointerSensor + KeyboardSensor，无需配置传感器）、`useSortable({ id, index })` 返回 `ref`（回调 ref）与 `isDragging`、`move(items, event)` 处理乐观排序与取消拖拽
- 项目 Button（`src/components/ui/button.tsx`）基于 React 19 ref-as-prop 可直接透传 `ref`，已实测类型通过
- 代码风格：2 空格缩进、单引号、无分号、LF 换行、80 列；导入别名 `@/`；禁止 `@ts-ignore`/`eslint-disable`
- 任意值 Tailwind 类需注释说明（现有 `bg-[#f1f3f3]` 注释保留）
- Git：禁止 `git add .`，逐个暂存；提交前按 `leju_git_conventions` skill 将完整提交信息展示给用户确认

---

### Task 1: 视图顺序存储层（useHeaderViews）

**Files:**

- Create: `src/newTab/store/useHeaderViews.ts`
- Test: `src/newTab/store/useHeaderViews.test.ts`
- Modify: `package.json`、`pnpm-lock.yaml`（依赖已由 `pnpm add` 安装，随本任务提交）

**Interfaces:**

- Consumes: `HeaderView` 类型（`@/newTab/store/useAppStore`）、`useWxtStorage`（`@/hooks/useWxtStorage`）、`move`（`@dnd-kit/helpers`）
- Produces: `normalizeViews(views: unknown): HeaderView[]`（纯函数）；`useHeaderViews()` → `{ viewOrder: HeaderView[], moveView: (event: Parameters<typeof move>[1]) => void }`。Task 2 消费 `viewOrder`，Task 3 消费 `viewOrder` 与 `moveView`

- [ ] **Step 1: 写失败的测试**

Create `src/newTab/store/useHeaderViews.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalizeViews } from './useHeaderViews'

describe('normalizeViews', () => {
  it('合法完整排列原样返回', () => {
    expect(normalizeViews(['tabs', 'pins'])).toEqual(['tabs', 'pins'])
  })

  it('剔除非法值与重复项', () => {
    expect(normalizeViews(['tabs', 'tabs', 'ghost', 'pins'])).toEqual([
      'tabs',
      'pins'
    ])
  })

  it('缺失视图按默认顺序补全', () => {
    expect(normalizeViews(['tabs'])).toEqual(['tabs', 'pins'])
  })

  it('空数组与 undefined 返回默认顺序', () => {
    expect(normalizeViews([])).toEqual(['pins', 'tabs'])
    expect(normalizeViews(undefined)).toEqual(['pins', 'tabs'])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test src/newTab/store/useHeaderViews.test.ts` Expected: FAIL，`Failed to resolve import "./useHeaderViews"`（文件不存在）

- [ ] **Step 3: 写实现**

Create `src/newTab/store/useHeaderViews.ts`:

```ts
import { useCallback } from 'react'
import { storage } from '@wxt-dev/storage'
import { move } from '@dnd-kit/helpers'
import useWxtStorage from '@/hooks/useWxtStorage'
import type { HeaderView } from '@/newTab/store/useAppStore'

/** Header 视图默认顺序；normalizeViews 补全缺失项时也按此相对顺序 */
const DEFAULT_VIEW_ORDER: HeaderView[] = ['pins', 'tabs']

/**
 * 清洗存储中的视图顺序：剔除非法/重复项，缺失视图按默认顺序补全，
 * 保证返回值永远是全部视图的完整排列（首位即默认视图，必须完整）
 */
export function normalizeViews(views: unknown): HeaderView[] {
  const list = Array.isArray(views) ? views : []
  const result: HeaderView[] = []
  const seen = new Set<HeaderView>()
  for (const view of list) {
    if ((view === 'pins' || view === 'tabs') && !seen.has(view)) {
      seen.add(view)
      result.push(view)
    }
  }
  for (const view of DEFAULT_VIEW_ORDER) {
    if (!seen.has(view)) result.push(view)
  }
  return result
}

/** Header 左侧按钮顺序存储：只存视图 id 数组，拖拽换位后持久化 */
const headerViewOrderStorage = storage.defineItem<HeaderView[]>(
  'local:headerViewOrder',
  { fallback: DEFAULT_VIEW_ORDER }
)

/** Header 左侧视图按钮顺序 hook：viewOrder（清洗后）+ moveView（拖拽结束更新顺序） */
export default function useHeaderViews() {
  const [rawOrder, setViewOrder] = useWxtStorage(headerViewOrderStorage)
  const viewOrder = normalizeViews(rawOrder)
  const moveView = useCallback(
    (event: Parameters<typeof move>[1]) => setViewOrder(move(rawOrder, event)),
    [rawOrder, setViewOrder]
  )
  return { viewOrder, moveView }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test src/newTab/store/useHeaderViews.test.ts` Expected: PASS，4 个用例全绿

- [ ] **Step 5: 类型检查**

Run: `pnpm compile` Expected: 无错误输出

- [ ] **Step 6: 提交**（依赖变更一并提交；提交信息经用户确认后执行）

```bash
git add src/newTab/store/useHeaderViews.ts src/newTab/store/useHeaderViews.test.ts package.json pnpm-lock.yaml
git commit -m "feat: 新增 Header 视图顺序存储与拖拽排序 hook

- 新增 useHeaderViews 存储层，local:headerViewOrder 持久化按钮顺序
- 导出 normalizeViews 清洗逻辑，保证存储值恒为完整视图排列
- 引入 @dnd-kit/react 与 @dnd-kit/helpers 支撑拖拽排序"
```

---

### Task 2: 默认视图跟随排序首位

**Files:**

- Modify: `src/newTab/store/useAppStore.ts:4,20,34`
- Modify: `src/newTab/app.tsx:1-46`
- Modify: `src/newTab/components/Header.tsx:15-19,55-65`

**Interfaces:**

- Consumes: Task 1 的 `useHeaderViews()` → `{ viewOrder }`；`HeaderView` 类型
- Produces: `Header` 组件新增 prop `activeView: HeaderView`（Task 3 继续消费）；`useAppStore.activeHeaderView` 类型变为 `HeaderView | null`

- [ ] **Step 1: 修改 useAppStore 初值与类型**

In `src/newTab/store/useAppStore.ts`：

- 第 20 行 `activeHeaderView: HeaderView` → `activeHeaderView: HeaderView | null`，注释改为 `/** 搜索框下方内容区当前视图；null = 未手动选择，跟随视图排序首位 */`
- 第 34 行 `activeHeaderView: 'pins'` → `activeHeaderView: null`

- [ ] **Step 2: 修改 app.tsx 派生 effectiveView**

In `src/newTab/app.tsx`：

- 新增导入 `import useHeaderViews from './store/useHeaderViews'`
- `App` 内新增两行（在 `useShortcuts()` 之后）：

```tsx
const activeHeaderView = useAppStore((s) => s.activeHeaderView)
const { viewOrder } = useHeaderViews()
// 未手动选择时（null）默认展示视图排序首位
const effectiveView = activeHeaderView ?? viewOrder[0]
```

- 将 `<Header />` 改为 `<Header activeView={effectiveView} />`
- 将内容区两处 `activeHeaderView === 'pins'` / `activeHeaderView === 'tabs'` 改为 `effectiveView === 'pins'` / `effectiveView === 'tabs'`

- [ ] **Step 3: 修改 Header 使用 prop 高亮**

In `src/newTab/components/Header.tsx`：

- 组件签名 `export default function Header()` → `export default function Header({ activeView }: { activeView: HeaderView })`
- 删除 `const activeHeaderView = useAppStore((s) => s.activeHeaderView)` 这一行（保留 `setActiveHeaderView`）
- 第 61 行 `className={activeHeaderView === view ? 'bg-[#f1f3f3]' : undefined}` → `className={activeView === view ? 'bg-[#f1f3f3]' : undefined}`

- [ ] **Step 4: 验证**

Run: `pnpm compile` 与 `pnpm test` Expected: 两者均无错误输出/全部通过

- [ ] **Step 5: 提交**（提交信息经用户确认后执行）

```bash
git add src/newTab/store/useAppStore.ts src/newTab/app.tsx src/newTab/components/Header.tsx
git commit -m "feat: 默认视图跟随 Header 按钮排序首位

- activeHeaderView 初始值改为 null，未手动选择时跟随排序首位
- app.tsx 派生 effectiveView 统一驱动高亮与内容区渲染
- Header 高亮改为接收 activeView prop"
```

---

### Task 3: Header 左侧按钮拖拽排序

**Files:**

- Modify: `src/newTab/components/Header.tsx`（整体重写左侧按钮区）

**Interfaces:**

- Consumes: Task 1 的 `useHeaderViews()` → `{ viewOrder, moveView }`；Task 2 的 `activeView` prop；`@dnd-kit/react` 的 `DragDropProvider`、`@dnd-kit/react/sortable` 的 `useSortable`、`@/lib/utils` 的 `cn`

- [ ] **Step 1: 重写 Header.tsx**

将 `src/newTab/components/Header.tsx` 整体替换为：

```tsx
import {
  BookmarkIcon,
  LayoutGridIcon,
  SettingsIcon,
  StarIcon,
  type LucideIcon
} from 'lucide-react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useHeaderViews from '@/newTab/store/useHeaderViews'
import { useAppStore, type HeaderView } from '@/newTab/store/useAppStore'

/**
 * 顶部导航栏：60% 不透明度背景，左侧内容区切换按钮（支持拖拽排序），右侧收纳书签/设置入口
 * 选中态背景色 bg-[#f1f3f3] 为设计稿指定色，非 Tailwind 标准色，故使用任意值
 */
const VIEW_META: Record<
  HeaderView,
  { label: string; ariaLabel: string; icon: LucideIcon }
> = {
  pins: { label: '快捷书签', ariaLabel: '快捷书签', icon: StarIcon },
  tabs: { label: '标签页', ariaLabel: '标签页面板', icon: LayoutGridIcon }
}

/** 左侧单个视图按钮：整按钮可拖拽排序，拖拽中降透明度并加阴影提示 */
function SortableViewButton({
  view,
  index,
  active
}: {
  view: HeaderView
  index: number
  active: boolean
}) {
  const setActiveHeaderView = useAppStore((s) => s.setActiveHeaderView)
  const { ref, isDragging } = useSortable({ id: view, index })
  const { label, ariaLabel, icon: Icon } = VIEW_META[view]
  return (
    <Button
      ref={ref}
      type='button'
      variant='ghost'
      aria-label={ariaLabel}
      onClick={() => setActiveHeaderView(view)}
      className={cn(
        active && 'bg-[#f1f3f3]',
        isDragging && 'opacity-80 shadow-md'
      )}
    >
      <Icon className='size-3.5' />
      {label}
    </Button>
  )
}

export default function Header({ activeView }: { activeView: HeaderView }) {
  const setBookmarkOpen = useAppStore((s) => s.setBookmarkOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const { viewOrder, moveView } = useHeaderViews()

  const actionButtons: Array<{
    label: string
    ariaLabel: string
    icon: LucideIcon
    onClick: () => void
  }> = [
    {
      label: '书签',
      ariaLabel: '书签',
      icon: BookmarkIcon,
      onClick: () => setBookmarkOpen(true)
    },
    {
      label: '设置',
      ariaLabel: '设置',
      icon: SettingsIcon,
      onClick: () => setSettingsOpen(true)
    }
  ]

  return (
    <header className='fixed inset-x-0 top-0 z-40 bg-background/60 backdrop-blur-md py-2'>
      <div className='flex items-center justify-between gap-2 pl-3 pr-4'>
        <div className='flex items-center gap-2'>
          <DragDropProvider onDragEnd={moveView}>
            {viewOrder.map((view, index) => (
              <SortableViewButton
                key={view}
                view={view}
                index={index}
                active={activeView === view}
              />
            ))}
          </DragDropProvider>
        </div>
        <div className='flex items-center gap-2'>
          {actionButtons.map(({ label, ariaLabel, icon: Icon, onClick }) => (
            <Button
              key={label}
              type='button'
              variant='ghost'
              aria-label={ariaLabel}
              onClick={onClick}
            >
              <Icon className='size-3.5' />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: 验证**

Run: `pnpm compile` Expected: 无错误输出（若报 `moveView` 事件类型不匹配，将 `onDragEnd` 改为 `onDragEnd={(event) => moveView(event)}` 显式传参；`move` 事件参数类型 `Parameters<typeof move>[1]` 已在临时验证中实测与 provider 的 dragend 事件兼容，预期无需调整）

Run: `pnpm test` Expected: 全部通过

- [ ] **Step 3: 提交**（提交信息经用户确认后执行）

```bash
git add src/newTab/components/Header.tsx
git commit -m "feat: Header 左侧按钮支持拖拽排序

- 视图按钮按 viewOrder 渲染并接入 DragDropProvider 拖拽
- 整按钮可拖（useSortable 默认行为），拖拽中降透明度加阴影
- 右侧书签/设置按钮保持原样不参与排序"
```

---

### Task 4: 全量验证

**Files:** 无代码变更

- [ ] **Step 1: 类型检查与单测**

Run: `pnpm compile`、`pnpm test` Expected: 均无错误输出/全部通过

- [ ] **Step 2: 手动验证（pnpm dev）**

1. 拖拽「标签页」到「快捷书签」前面 → 释放后按钮顺序互换
2. 刷新新标签页 → 顺序保持，且默认展示「标签页」视图（首位）
3. 点击「快捷书签」后再次拖拽换位 → 当前视图不被打断
4. 点击不拖动（无位移）→ 正常切换视图
5. 键盘操作：Tab 聚焦到按钮，Space/Enter 开始拖拽、方向键移动、Space 释放（KeyboardSensor 默认启用）

- [ ] **Step 3: 汇总变更**

确认本计划涉及文件：新增 `useHeaderViews.ts` + `useHeaderViews.test.ts`；修改 `useAppStore.ts`、`app.tsx`、`Header.tsx`、`package.json`、`pnpm-lock.yaml`；新增目录 `docs/superpowers/specs/`（设计文档，已单独提交）。
