# 搜索联想（关联搜索）设计

## 概述

为新标签页搜索栏（SearchBar）增加输入联想/自动补全能力：用户输入关键词时，根据当前选中的搜索引擎拉取联想词，以下拉列表展示；点击或回车选中联想词后，直接用该词在当前引擎中打开搜索。

## 需求确认

经与用户确认：

1. **功能含义**：输入联想/自动补全
2. **数据源**：跟随当前引擎的 suggest API；当前引擎无免费 suggest API（GitHub）或请求失败/结果为空时，**回退到百度** suggest
3. **交互**：点击或回车选中联想词后，**直接搜索**（`window.open` 打开结果页）
4. **UI**：联想下拉使用项目现有 `Popover` 组件，下拉内容最大高度 **300px**，超出滚动

## 架构

联想请求采用 **background 转发**：newtab 页面通过消息总线发送 `{ engine, query }` 给 background service worker，由 background 使用 fetch 请求对应 suggest API（扩展拥有 `<all_urls>` host_permissions），解析后返回联想词数组。规避了 suggest API 无 CORS 头、newtab 页面直接跨域受限的问题。

```
输入 → SearchBar (防抖 200ms) → messageBus.send(SUGGEST_ACTION)
                                     ↓
                     background: fetch(engineSuggestApi) → parse → 空/失败回退百度
                                     ↓
                   MessageResponse<string[]> → SearchBar 渲染 Popover 下拉
```

## suggest API 映射

| 引擎 | API（query 为 encodeURIComponent 后的关键词） | 返回格式 |
|---|---|---|
| google | `https://suggestqueries.google.com/complete/search?client=firefox&q={query}` | JSON `["q", ["a","b"]]` |
| baidu | `https://suggestion.baidu.com/su?wd={query}` | JSONP `window.baidu.sug({...})` |
| bing | `https://api.bing.com/osjson.aspx?query={query}` | JSON `["q", ["a","b"]]` |
| github | 无 suggest API | 直接走百度回退 |

回退策略：`SUGGEST_APIS[engine]` 不存在（github）→ 直接用百度；fetch 失败或解析结果为空 → 重试百度；仍失败/为空 → 返回 `[]`（不展示下拉）。

## 改动清单

### 1. 新增 `src/constants/suggest.ts`

- `SUGGEST_ACTION = 'suggest'`：消息 action 常量
- `SUGGEST_APIS`：引擎 key → API 前缀映射（如上表）
- `FALLBACK_ENGINE = 'baidu'`：回退引擎
- `parseSuggestResponse(text: string): string[]`：纯函数，解析 suggest 响应文本
  - 优先 `JSON.parse`（Google/Bing 标准 JSON 数组，取下标 `[1]`）
  - 失败则提取首 `(` 与末 `)` 之间的内容再 `JSON.parse`（百度 JSONP），取 `.s`
  - 均失败返回 `[]`

### 2. 修改 `src/components/ui/popover.tsx`（用户已批准例外）

`PopoverContent` 的 props 类型增加 `anchor`，并透传给 `PopoverPrimitive.Positioner`，使 Popover 可锚定任意元素（base-ui 1.6.0 的 Positioner 支持 `anchor`，Root/Trigger 不支持）。

> 实施风险：联想 Popover 无 `PopoverTrigger`、纯 `anchor` + 受控 `open` 的用法，需在实施时以 base-ui 1.6.0 实际行为验证（预期可行；若强制要求 Trigger，则渲染隐藏 Trigger 兜底）。

### 3. 修改 `src/messages/message.ts`（MessageBus 支持异步数据响应）

现状：`registerListener` 在收到消息后**立即** `sendResponse` 一个 ack（错误码 -1），随后同步调用 handler 且丢弃返回值——总线无法承载异步数据响应。

改动：listener 改为等待所有 handler 的返回值（handler 可为 async，返回 `MessageResponse | undefined`），取第一个含 `code` 字段的结果 `sendResponse`；无结果时保持原有默认 ack。`onceHandlers` 清理移到 await 之后。向后兼容：现有唯一 handler `content_bg` 无返回值，行为不变。

### 4. 修改 `src/background/index.ts`

注册 suggest 消息监听（在 `MessageBus.registerListener()` 之后）：

```ts
MessageBus.on(SUGGEST_ACTION, async (req) => {
  // 取 engine + query，选 API，fetch → text → parseSuggestResponse
  // 空/失败 → 回退百度重试一次
  // 返回 { code: 0, data: string[] }
})
```

### 5. 修改 `src/newTab/components/SearchBar.tsx`

- 新增 state：`suggestions: string[]`、`suggestOpen: boolean`、`activeIndex: number`
- 输入防抖 200ms：`useEffect` 依赖 `[query, currentEngine]`，超时后 `messageBus.send(SUGGEST_ACTION, { engine, query })`；cleanup 清定时器；响应回来用请求时捕获的 query 与当前 query 比对，不一致则丢弃（防竞态）
- 联想下拉（复用引擎 Popover 的 `popoverWidth` 测量结果）：

```tsx
<Popover open={suggestOpen && suggestions.length > 0} onOpenChange={setSuggestOpen}>
  <PopoverContent
    anchor={inputGroupRef}
    align="start"
    sideOffset={8}
    className='p-1.5 shadow-none rounded-2xl max-h-[300px] overflow-y-auto'
    style={{ width: popoverWidth }}
  >
    <ul>{suggestions.map(/* 列表项按钮 */)}</ul>
  </PopoverContent>
</Popover>
```

- 键盘导航：`↑`/`↓` 移动 `activeIndex` 并打开下拉；`Enter` 时若有选中联想词则用联想词搜索，否则原逻辑；`Esc` 关闭下拉
- 鼠标悬停列表项设置 `activeIndex`（高亮同步）；点击列表项用该词搜索
- 搜索统一走 `search(word)`：`window.open(currentEngine.url + encodeURIComponent(word), '_blank')`，搜索后关闭下拉
- 切换引擎（`handleEngineChange`）后 `useEffect` 依赖 `currentEngine` 自动重新请求

### 6. 新增 `src/constants/suggest.test.ts`

Vitest 单测 `parseSuggestResponse`：
- 标准 JSON 数组输入 → 返回联想词数组
- 百度 JSONP 输入 → 返回 `.s` 数组
- 非法文本 → 返回 `[]`

（项目首个测试文件，`pnpm test` 运行）

## 数据流

```
SearchBar onChange → setQuery
                  → useEffect([query, currentEngine]) 防抖 200ms
                  → messageBus.send(SUGGEST_ACTION, { engine, query })
                  → background fetch + parse + 回退
                  → MessageResponse<string[]> → setSuggestions → Popover 展示
点击/Enter 联想词 → search(word) → window.open(engine.url + word, '_blank')
```

## 验收标准

1. 输入关键词出现联想下拉（Popover 组件，宽度与搜索框一致）
2. 下拉内容最高 300px，超出可滚动
3. 点击 / 回车选中联想词 → 在当前引擎打开搜索
4. `↑`/`↓` 键盘导航、`Esc` 关闭、点击外部关闭
5. GitHub 引擎及请求失败时回退百度联想词
6. 切换引擎后联想词刷新
7. `pnpm test` 通过；`pnpm compile` 通过

## 未包含

- 联想词历史/热词缓存
- 多引擎聚合联想
- 自定义联想数据源配置
