# 搜索联想（关联搜索）Implementation Plan

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为新标签页搜索栏增加输入联想：输入关键词时通过 background 转发请求当前引擎的 suggest API（GitHub 无 API 或失败时回退百度），以 Popover 下拉展示，点击/回车直接搜索。

**Architecture:** newtab SearchBar 防抖 200ms 后通过 MessageBus 发送 `{ engine, query }` 给 background；background 用原生 fetch 请求 suggest API，解析响应（Google/Bing 标准 JSON 数组、百度 JSONP），空/失败回退百度，返回 `MessageResponse<string[]>`。联想下拉复用项目 Popover 组件（新增 `anchor` 透传），内容最大高度 300px 可滚动。

**Tech Stack:** WXT 0.20 / React 19 / TypeScript / @base-ui/react 1.6.0 / Vitest 4

**前置说明：**
- 每个任务末尾的 Commit 步骤：按项目 git-conventions 规范，提交前必须向用户展示 commit message 并确认后再执行。
- 每次提交前用 `git status` 检查工作区，仅逐个 `git add` 涉及文件，禁止 `git add .`。
- 验证命令：`pnpm test`（vitest）、`pnpm compile`（tsc --noEmit）。

---

## 文件结构

| 文件 | 动作 | 职责 |
|---|---|---|
| `src/constants/suggest.ts` | 新增 | suggest API 映射、action 常量、回退引擎、响应解析纯函数 |
| `src/constants/suggest.test.ts` | 新增 | `parseSuggestResponse` 单测 |
| `src/messages/types.ts` | 修改 | `MessageHandler` 允许返回 `MessageResponse \| Promise<MessageResponse> \| void` |
| `src/messages/message.ts` | 修改 | `registerListener` 等待 handler 返回值并 `sendResponse` 首个含 code 的结果 |
| `src/background/index.ts` | 修改 | 注册 `SUGGEST_ACTION` 监听：fetch → parse → 回退百度 |
| `src/components/ui/popover.tsx` | 修改 | `PopoverContent` 透传 `anchor` 给 Positioner（用户已批准例外） |
| `src/newTab/components/SearchBar.tsx` | 修改 | 防抖请求、联想下拉（Popover + 300px）、键盘导航、直搜 |

---

### Task 1: 新增 `src/constants/suggest.ts`（常量 + 解析纯函数，TDD）

**Files:**
- Create: `src/constants/suggest.ts`
- Create: `src/constants/suggest.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/constants/suggest.test.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { parseSuggestResponse } from './suggest'

describe('parseSuggestResponse', () => {
  it('解析 Google/Bing 标准 JSON 数组', () => {
    expect(
      parseSuggestResponse('["hello",["hello world","hello kitty"]]')
    ).toEqual(['hello world', 'hello kitty'])
  })

  it('解析百度 JSONP 格式', () => {
    expect(
      parseSuggestResponse(
        'window.baidu.sug({"q":"hello","p":false,"s":["hello world","hello kitty"]})'
      )
    ).toEqual(['hello world', 'hello kitty'])
  })

  it('非法文本返回空数组', () => {
    expect(parseSuggestResponse('not json')).toEqual([])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './suggest'`（模块尚不存在）

- [ ] **Step 3: 实现 `src/constants/suggest.ts`**

```ts
// 联想消息 action
export const SUGGEST_ACTION = 'suggest'

// 引擎 suggest API 前缀（query 由调用方 encodeURIComponent 后拼接）
export const SUGGEST_APIS: Record<string, string> = {
  google: 'https://suggestqueries.google.com/complete/search?client=firefox&q=',
  baidu: 'https://suggestion.baidu.com/su?wd=',
  bing: 'https://api.bing.com/osjson.aspx?query='
}

// 无 suggest API 或请求失败/为空时的回退引擎
export const FALLBACK_ENGINE = 'baidu'

/**
 * 解析 suggest API 响应文本为联想词数组
 * 支持 Google/Bing 标准 JSON 数组 与 百度 JSONP (window.baidu.sug({...}))
 * @param text 响应文本
 * @returns 联想词数组，解析失败返回 []
 */
export function parseSuggestResponse(text: string): string[] {
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    // 百度 JSONP 形如 window.baidu.sug({...})，提取首尾括号内的 JSON
    const start = text.indexOf('(')
    const end = text.lastIndexOf(')')
    if (start === -1 || end === -1 || end <= start) return []
    try {
      json = JSON.parse(text.slice(start + 1, end))
    } catch {
      return []
    }
  }
  if (Array.isArray(json) && Array.isArray(json[1])) {
    return json[1].filter((item): item is string => typeof item === 'string')
  }
  if (json && Array.isArray(json.s)) {
    return json.s.filter((item): item is string => typeof item === 'string')
  }
  return []
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS — 3 个用例全绿

- [ ] **Step 5: Commit**

```bash
git add src/constants/suggest.ts src/constants/suggest.test.ts
git commit -m "feat: 新增 suggest API 映射与响应解析函数

- 定义联想消息 action、各引擎 suggest API 前缀与百度回退引擎
- 实现 parseSuggestResponse 兼容标准 JSON 数组与百度 JSONP
- 补充三组单测覆盖标准 JSON、JSONP 与非法输入"
```

（提交前向用户展示并确认 commit message）

---

### Task 2: `MessageBus` 支持异步数据响应

**Files:**
- Modify: `src/messages/types.ts:15-19`
- Modify: `src/messages/message.ts:26-64`

现状：`registerListener` 收到消息后立即 `sendResponse` 一个 ack（`ERROR_CODE_NORMAL`），随后同步调用 handler 且丢弃返回值，无法承载异步数据响应。

- [ ] **Step 1: 修改 `MessageHandler` 类型允许返回响应**

`src/messages/types.ts` 中 `MessageHandler` 改为：

```ts
export type MessageHandler<T = anyObject> = (
  request: MessageResponse<T>,
  sender: Browser.runtime.MessageSender
) => MessageResponse | Promise<MessageResponse> | void
```

- [ ] **Step 2: 重写 `registerListener` 等待 handler 返回值**

`src/messages/message.ts` 中 `registerListener` 的 listener 回调（第 26-63 行）整体替换为：

```ts
    browser.runtime.onMessage.addListener(
      (request: MessageRequest, sender, sendResponse) => {
        const action = request.action
        if (!action) {
          sendResponse({ code: MessagingCode.ERROR_CODE_NORMAL.key, message: '消息 action 未定义' })
          return true
        }
        const handlers = this.handlers.get(action)
        const onceHandlers = this.onceHandlers.get(action)

        if ((!handlers || handlers.size === 0) && (!onceHandlers || onceHandlers.size === 0)) {
          sendResponse({ code: MessagingCode.ERROR_CODE_NORMAL.key, message: `未注册 handler: ${action}` })
          return true
        }

        const response = request.payload as MessageResponse
        const allHandlers = [...(handlers || []), ...(onceHandlers || [])]

        // 等待所有 handler 的返回结果，取第一个含 code 字段的响应回传
        Promise.all(
          allHandlers.map((handler) => {
            try {
              return handler(response, sender)
            } catch (err: any) {
              console.error(`[MessageBus] handler 错误 action=${action}:`, err)
              return undefined
            }
          })
        ).then((results) => {
          const handled = results.find(
            (r): r is MessageResponse => !!r && typeof r === 'object' && 'code' in r
          )
          sendResponse(handled ?? { code: MessagingCode.ERROR_CODE_NORMAL.key })
          // 执行完 onceHandlers 后清理掉
          if (onceHandlers && onceHandlers.size > 0) {
            this.onceHandlers.delete(action)
          }
        })
        // 始终返回 true，以支持异步响应
        return true
      }
    )
```

兼容性说明：现有唯一 handler `MessageBus.on('content_bg', () => { console.log(...) })` 无返回值 → `Promise.all` 结果为 `undefined` → 走默认 ack（`ERROR_CODE_NORMAL`），行为与原实现一致。

- [ ] **Step 3: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add src/messages/types.ts src/messages/message.ts
git commit -m "feat: MessageBus 支持异步数据响应

- MessageHandler 允许返回 MessageResponse 或 Promise
- registerListener 等待 handler 返回值并回传首个含 code 的结果
- 无返回值 handler 保持原默认 ack，向后兼容"
```

（提交前向用户展示并确认 commit message）

---

### Task 3: background 注册 suggest 监听

**Files:**
- Modify: `src/background/index.ts`

- [ ] **Step 1: 在 background 注册 `SUGGEST_ACTION` 监听**

`src/background/index.ts` 文件末尾追加（保留现有 `content_bg` 监听）：

```ts
import { FALLBACK_ENGINE, SUGGEST_ACTION, SUGGEST_APIS, parseSuggestResponse } from '@/constants/suggest'
import { type MessageResponse } from '@/messages/types'
import { MessagingCode } from '@/constants'

// 请求 suggest API 并解析联想词；失败时抛错交由调用方回退
async function fetchSuggestions(engine: string, query: string): Promise<string[]> {
  const api = SUGGEST_APIS[engine] ?? SUGGEST_APIS[FALLBACK_ENGINE]
  const res = await fetch(api + encodeURIComponent(query))
  if (!res.ok) throw new Error(`suggest request failed: ${res.status}`)
  return parseSuggestResponse(await res.text())
}

MessageBus.on(SUGGEST_ACTION, async (req) => {
  const { engine, query } = (req as anyObject) ?? {}
  if (typeof query !== 'string' || !query.trim()) {
    return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: [] } satisfies MessageResponse<string[]>
  }
  try {
    const suggestions = await fetchSuggestions(engine, query)
    if (suggestions.length > 0) {
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: suggestions } satisfies MessageResponse<string[]>
    }
    // 空结果 → 回退百度
    const fallback = await fetchSuggestions(FALLBACK_ENGINE, query)
    return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: fallback } satisfies MessageResponse<string[]>
  } catch {
    try {
      const fallback = await fetchSuggestions(FALLBACK_ENGINE, query)
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: fallback } satisfies MessageResponse<string[]>
    } catch {
      // 兜底：suggest 服务不可用时返回空列表，前端不展示下拉
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: [] } satisfies MessageResponse<string[]>
    }
  }
})
```

> 说明：现有 `import uid from "tiny-uid"`、`import MessageBus from '@/messages/message'` 已存在；新增 import 与现有 import 合并到文件顶部（保持项目 2 空格缩进、无分号风格）。`anyObject` 从 `@/types` 导入。

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add src/background/index.ts
git commit -m "feat: background 注册搜索联想消息监听

- 新增 fetchSuggestions 请求 suggest API 并解析联想词
- 注册 SUGGEST_ACTION 监听，空结果或请求失败时回退百度
- 兜底返回空数组避免前端误展示"
```

（提交前向用户展示并确认 commit message）

---

### Task 4: `PopoverContent` 透传 anchor

**Files:**
- Modify: `src/components/ui/popover.tsx:16-27`

> ⚠️ 此文件为 shadcn/ui 组件源码，常规禁止修改；用户已在设计中明确批准「透传 anchor」例外。

- [ ] **Step 1: 增加并透传 `anchor` prop**

`src/components/ui/popover.tsx` 中 `PopoverContent` 函数签名改为（`Pick` 增加 `"anchor"`，解构增加 `anchor`，`Positioner` 传入 `anchor={anchor}`）：

```tsx
function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  anchor,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "anchor"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
        className="isolate z-50"
      >
```

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/popover.tsx
git commit -m "feat: PopoverContent 透传 anchor 支持自定义锚点

- Positioner 透传 anchor prop，联想下拉可锚定搜索框
- 经用户批准对 ui 组件源码的例外修改"
```

（提交前向用户展示并确认 commit message）

---

### Task 5: SearchBar 联想下拉

**Files:**
- Modify: `src/newTab/components/SearchBar.tsx`

- [ ] **Step 1: 新增 import 与状态**

`src/newTab/components/SearchBar.tsx`：

1. import 区新增：
```ts
import messageBus from '@/messages/message'
import { SUGGEST_ACTION } from '@/constants/suggest'
```

2. 组件内新增状态与 ref（放在现有 `enginePopoverOpen` state 之后）：
```ts
const [suggestions, setSuggestions] = useState<string[]>([])
const [suggestOpen, setSuggestOpen] = useState(false)
const [activeIndex, setActiveIndex] = useState(-1)
const queryRef = useRef(query)
queryRef.current = query
```

3. 抽离搜索函数（替换现有 `handleSearch` 的打开逻辑，`handleSearch` 调用它）：
```ts
const search = (word: string) => {
  const trimmed = word.trim()
  if (!trimmed) return
  window.open(currentEngine.url + encodeURIComponent(trimmed), '_blank')
  setSuggestOpen(false)
  setActiveIndex(-1)
}

const handleSearch = () => {
  search(query)
}
```

4. 新增联想请求 effect（放在 `handleEngineChange` 之后）：
```ts
// 联想请求：防抖 200ms，响应过期丢弃
useEffect(() => {
  const trimmed = query.trim()
  if (!trimmed) {
    setSuggestions([])
    setSuggestOpen(false)
    setActiveIndex(-1)
    return
  }
  const timer = setTimeout(async () => {
    const res = await messageBus.send<string[], string[]>(SUGGEST_ACTION, {
      engine: currentEngine.key,
      query: trimmed
    })
    if (queryRef.current.trim() !== trimmed) return // 过期响应丢弃
    setSuggestions(res?.data ?? [])
    setSuggestOpen(true)
    setActiveIndex(-1)
  }, 200)
  return () => clearTimeout(timer)
}, [query, currentEngine])
```

5. `handleKeyDown` 增加联想导航（整体替换为）：
```ts
const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (suggestions.length === 0) return
    setSuggestOpen(true)
    setActiveIndex((i) => (i + 1) % suggestions.length)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (suggestions.length === 0) return
    setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
  } else if (e.key === 'Escape') {
    setSuggestOpen(false)
    setActiveIndex(-1)
  } else if (e.key === 'Enter') {
    if (suggestOpen && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault()
      search(suggestions[activeIndex])
    } else {
      handleSearch()
    }
  }
}
```

- [ ] **Step 2: 渲染联想 Popover**

`SearchBar` 的 return 改为包裹 Fragment，`InputGroup` 之后渲染联想 Popover（锚定 `inputGroupRef`，内容最高 300px）：

```tsx
  return (
    <>
      <InputGroup ref={inputGroupRef} className='h-12 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-2'>
        {/* 现有引擎选择 Popover + InputGroupInput + 搜索按钮，原样保留 */}
      </InputGroup>
      <Popover open={suggestOpen && suggestions.length > 0} onOpenChange={setSuggestOpen}>
        <PopoverContent
          anchor={inputGroupRef}
          align="start"
          alignOffset={-8}
          sideOffset={8}
          className='p-1.5 shadow-none rounded-2xl max-h-[300px] overflow-y-auto'
          style={{ width: popoverWidth }}
        >
          <ul className='flex flex-col'>
            {suggestions.map((s, i) => (
              <li key={s}>
                <button
                  type='button'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => search(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground ${i === activeIndex ? 'bg-muted' : ''}`}
                >
                  <SearchIcon className='size-3.5 shrink-0 text-muted-foreground' />
                  <span className='truncate'>{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </>
  )
```

> `alignOffset={-8}` 与 InputGroup 的 `px-2` 内边距对齐，使下拉左侧与输入文本对齐。`onMouseDown preventDefault` 避免点击项时输入框失焦提前关闭。

- [ ] **Step 3: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add src/newTab/components/SearchBar.tsx
git commit -m "feat: 搜索栏输入联想下拉

- 防抖 200ms 请求当前引擎联想词，过期响应丢弃
- 复用 Popover 展示联想词，最大高度 300px 可滚动
- 上下键导航、回车/点击直接搜索、Esc 关闭"
```

（提交前向用户展示并确认 commit message）

---

### Task 6: 全量验证

**Files:** 无代码变更

- [ ] **Step 1: 运行全部测试**

Run: `pnpm test`
Expected: PASS — suggest.test.ts 3 个用例通过，无失败

- [ ] **Step 2: 类型检查**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 3: 生产构建冒烟**

Run: `pnpm build`
Expected: 构建成功，无报错

- [ ] **Step 4: 手动验收清单**（由用户或开发者在 Chrome 中加载 `pnpm dev` 验证）

- [ ] 输入关键词出现联想下拉，宽度与搜索框一致
- [ ] 下拉内容超过 300px 时可滚动
- [ ] 点击 / 回车选中联想词 → 当前引擎打开搜索
- [ ] `↑`/`↓` 导航高亮同步，`Esc` 关闭，点击外部关闭
- [ ] 切换引擎后联想词刷新
- [ ] GitHub 引擎与断网时回退百度（或返回空不展示）

- [ ] **Step 5: 收尾提交（如验证中发现修复项，单独提交）**

无修复项则跳过；有则按修复内容生成 commit message 并经用户确认后提交。

---

## Self-Review 记录

- **Spec 覆盖**：suggest.ts 常量+解析（设计 §改动1）✓ Task 1；popover anchor 透传（§改动2）✓ Task 4；message.ts 异步响应（§改动3）✓ Task 2；background 监听+回退（§改动4）✓ Task 3；SearchBar 防抖/竞态/Popover 300px/键盘/直搜（§改动5）✓ Task 5；单测（§改动6）✓ Task 1；验收标准全部映射 Task 6。
- **占位符**：无 TBD/TODO；Task 3 兜底返回空数组已注释说明（符合项目"兜底需注释"要求）。
- **类型一致性**：`SUGGEST_ACTION`/`SUGGEST_APIS`/`FALLBACK_ENGINE`/`parseSuggestResponse` 在 Task 1 定义、Task 3 引用一致；`MessageResponse<string[]>` 贯穿 Task 2/3/5；`messageBus.send<string[], string[]>` 返回 `MessageResponse<string[]>` 与 `res?.data` 匹配。
- **风险注记**：Task 5 依赖 Task 4 的 anchor 透传；联想 Popover 无 Trigger 纯受控用法基于 base-ui 1.6.0 Positioner 的 anchor 支持（已在 spec 记录，若实测不可行则回退渲染隐藏 Trigger）。
