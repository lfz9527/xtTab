# TabsPanel 标签页面板重新设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TabsPanel 从按窗口分组改为按域名分组卡片列表，新增「全部关闭」与「按域名关闭」能力。

**Architecture:** `TabsPanel.tsx` 内部重构——`groupTabsByWindow` 替换为 `groupTabsByHost` 纯函数（按 `safeHost` 分组 + 字母升序 + 「其他」兜底），组件改为顶部工具条（总标签数 + 全部关闭按钮）+ 域名卡片列表；关闭逻辑统一走「pinned 先取消固定再 remove」辅助函数；测试同步改为 `groupTabsByHost` 用例。

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, lucide-react, WXT, Vitest

## Global Constraints

- 分组：纯按域名分组（`safeHost`），同域名跨窗口合并；域名组字母升序；无 URL/解析失败归「其他」组排最后
- 卡片形式：一个域名一张卡片，纵向堆叠（一列到底），面板整体滚动；单 tab 域名也成卡片
- 卡片标题：域名 + tab 数量 + 关闭按钮（关闭该域名全部 tab，无二次确认）
- 全部关闭：顶部工具条按钮，关闭所有标签页；关闭后各窗口保留一个空白新标签页，该空白新标签页仍按域名分组显示（`about:blank` 归「其他」组、`chrome://newtab` 显示为 `newtab` 组）
- pinned 标签：域名关闭 / 全部关闭前先 `browser.tabs.update(id, { pinned: false })` 再 `browser.tabs.remove(ids)`
- 空组消失：域名组内 tab 全部关闭后整卡片消失
- tab 行点击激活保留（`browser.tabs.update(tabId, { active: true })` + `browser.windows.update(windowId, { focused: true })`）；当前活动标签高亮（`lastFocusedWindow` 判定）保留
- 不引入新 UI 组件库；`useTabs` 用法不变（`useTabs({})`）
- 代码风格：2 空格缩进、单引号、无分号、无尾逗号、80 字符行宽
- 禁止 `git add .`，逐个暂存文件（注意仓库 git 跟踪路径为小写 `src/newtab/`，add 时用 `git add -f src/newtab/...` 或小写路径）
- 验证方式：`pnpm compile`（tsc）+ `pnpm test`（vitest）+ 手动浏览器检查

---

### Task 1: groupTabsByHost 纯函数（TDD）

**Files:**
- Modify: `src/newTab/components/TabsPanel.tsx`（新增导出 `groupTabsByHost`，删除 `groupTabsByWindow`）
- Modify: `src/newTab/components/TabsPanel.test.tsx`（替换测试）

**Interfaces:**
- Consumes: `safeHost(url)`（来自 `@/utils`）
- Produces: 导出 `groupTabsByHost(tabs: Browser.tabs.Tab[]): { host: string; tabs: Browser.tabs.Tab[] }[]`——按 `safeHost(tab.url)` 分组（空 host 归 `'其他'`），组按 host 字母升序（「其他」排最后），组内保持原顺序

- [ ] **Step 1: 改写测试文件（先失败）**

将 `src/newTab/components/TabsPanel.test.tsx` 全文替换为：

```tsx
import { describe, expect, it } from 'vitest'
import type { Browser } from 'wxt/browser'
import { groupTabsByHost } from './TabsPanel'

const makeTab = (
  id: number,
  url: string | undefined
): Browser.tabs.Tab =>
  ({ id, url }) as Browser.tabs.Tab

describe('groupTabsByHost', () => {
  it('同域名跨窗口合并为一组', () => {
    const tabs = [
      makeTab(1, 'https://a.com/1'),
      makeTab(2, 'https://a.com/2'),
      makeTab(3, 'https://b.com/1')
    ]
    const groups = groupTabsByHost(tabs)
    expect(groups.map((g) => g.host)).toEqual(['a.com', 'b.com'])
    expect(groups[0].tabs.map((t) => t.id)).toEqual([1, 2])
  })

  it('域名组按字母升序排列', () => {
    const tabs = [
      makeTab(1, 'https://z.com/'),
      makeTab(2, 'https://a.com/'),
      makeTab(3, 'https://m.com/')
    ]
    expect(groupTabsByHost(tabs).map((g) => g.host)).toEqual([
      'a.com',
      'm.com',
      'z.com'
    ])
  })

  it('无 URL 或解析失败的 tab 归入「其他」组且排最后', () => {
    const tabs = [
      makeTab(1, 'https://a.com/'),
      makeTab(2, undefined),
      makeTab(3, 'not a url')
    ]
    const groups = groupTabsByHost(tabs)
    expect(groups.map((g) => g.host)).toEqual(['a.com', '其他'])
    expect(groups[1].tabs.map((t) => t.id)).toEqual([2, 3])
  })

  it('空数组返回空数组', () => {
    expect(groupTabsByHost([])).toEqual([])
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `pnpm test`
Expected: FAIL — `groupTabsByHost` 未定义（Cannot find name / import 解析失败）

- [ ] **Step 3: 实现 groupTabsByHost**

修改 `src/newTab/components/TabsPanel.tsx`：删除第 6-19 行的 `groupTabsByWindow`，替换为：

```tsx
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
```

（`safeHost` 已在文件顶部 import，`useTabs` 与其余组件代码暂不动）

- [ ] **Step 4: 运行测试验证通过**

Run: `pnpm test`
Expected: PASS（`groupTabsByHost` 4 个用例全过）

- [ ] **Step 5: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误（exit 0）——注意此时 `TabsPanel` 组件体内仍引用已删除的 `groupTabsByWindow`，需一并改为 `groupTabsByHost`，否则 tsc 报未定义。将第 35 行 `const groups = groupTabsByWindow(tabs)` 改为：

```tsx
const hostGroups = groupTabsByHost(tabs)
```

且空态判断同步改（第 37 行）：

```tsx
if (hostGroups.length === 0) {
```

以及渲染处（第 49-53 行）由窗口分组改为域名分组（完整卡片渲染在 Task 2 实现，此处先保证编译通过与基础展示）：

```tsx
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
```

（容器 `max-w-160` 保持不变）

- [ ] **Step 6: 类型检查 + 测试**

Run: `pnpm compile && pnpm test`
Expected: 两者均通过（exit 0）

- [ ] **Step 7: 提交**

```bash
git add -f src/newtab/components/TabsPanel.tsx src/newtab/components/TabsPanel.test.tsx
git commit -m "refactor: TabsPanel 分组改为按域名（groupTabsByHost 纯函数 + 测试）"
```

---

### Task 2: 卡片式 UI + 全部关闭 + 域名关闭

**Files:**
- Modify: `src/newTab/components/TabsPanel.tsx`

**Interfaces:**
- Consumes: Task 1 的 `groupTabsByHost`；`useTabs({})`；`browser.tabs` / `browser.windows`；lucide-react 图标（`GlobeIcon`、`XIcon`）
- Produces: `TabsPanel` 默认导出（无 props）——顶部工具条 + 域名卡片列表

- [ ] **Step 1: 重写 TabsPanel 组件**

将 `src/newTab/components/TabsPanel.tsx` 全文替换为：

```tsx
import { useEffect, useState } from 'react'
import { GlobeIcon, XIcon } from 'lucide-react'
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
    browser.tabs.update(id, { pinned: false }).catch(() => {})
  })
  browser.tabs.remove(valid).catch(() => {})
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

  const total = tabs.length

  return (
    <div className='flex w-full max-w-160 flex-col gap-3'>
      {/* 顶部工具条：标题 + 总标签数 + 全部关闭 */}
      <div className='flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2'>
        <span className='text-sm font-medium text-foreground'>
          标签页面板
          <span className='ml-2 text-xs font-normal text-muted-foreground'>
            总 {total}
          </span>
        </span>
        <button
          type='button'
          onClick={closeAll}
          className='flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <XIcon className='size-3.5' />
          全部关闭
        </button>
      </div>
      {/* 域名卡片列表（纵向堆叠） */}
      {hostGroups.map((group) => (
        <section
          key={group.host}
          className='flex flex-col rounded-lg border border-border bg-background/60'
        >
          <header className='flex items-center justify-between px-3 py-2'>
            <span className='text-sm font-medium text-foreground'>
              {group.host}
              <span className='ml-2 text-xs font-normal text-muted-foreground'>
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
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${isActive ? 'bg-muted text-foreground' : 'text-foreground'}`}
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

- [ ] **Step 2: 类型检查 + 测试**

Run: `pnpm compile && pnpm test`
Expected: 两者均通过（exit 0，`groupTabsByHost` 4 用例 + 既有 9 用例 = 13/13）

- [ ] **Step 3: 提交**

```bash
git add -f src/newtab/components/TabsPanel.tsx
git commit -m "feat: TabsPanel 改为域名卡片列表，新增全部关闭与按域名关闭"
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

1. 点击 Header「标签页面板」→ 下方显示域名卡片列表（一个域名一张卡片，纵向堆叠）
2. 同域名跨窗口的 tab 合并到同一卡片；域名组按字母升序；无 URL tab 归「其他」
3. 顶部工具条显示「标签页面板 总 N」与「全部关闭」按钮
4. 卡片标题显示域名 + tab 数量 + 关闭按钮
5. 点击 tab 行 → 激活对应标签页并聚焦窗口；当前活动标签高亮
6. 点击卡片关闭按钮 → 该域名所有 tab 关闭（含 pinned 先取消固定），空组卡片消失
7. 点击全部关闭 → 所有窗口各保留一个空白新标签页，该空白新标签页仍显示（「其他」/`newtab` 组）
8. 快捷键（Ctrl+K / Ctrl+,）、书签/设置弹窗、搜索功能均不受影响

- [ ] **Step 3: 收尾（无未提交改动则跳过）**

Run: `git status`
Expected: working tree clean
