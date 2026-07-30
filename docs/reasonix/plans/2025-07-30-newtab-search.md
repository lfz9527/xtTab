# New Tab 极简搜索主页 — 实现计划

> **For agentic workers:** implement this plan task-by-task — dispatch a fresh subagent per task with the native `task` tool (recommended for quality), or use the superpowers-executing-plans skill to work through it inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 xtTab 扩展新增浏览器新标签页搜索主页，替换 Chrome 默认新标签页

**Architecture:** 新增 WXT newtab 入口，React 根组件挂载 SearchBar 组件，搜索引擎配置通过 `@wxt-dev/storage` 持久化，通过 `hooks/useWxtStorage` 公共 hook 读写

**Tech Stack:** WXT 0.20, React 19, TypeScript, @wxt-dev/storage

**参考文件:**
- `src/entries/sidePanel/index.html` — 入口 HTML 模板
- `src/sidePanel/index.tsx` — React 根组件模板
- `src/sidePanel/store/demo.ts` — storage 封装模板
- `src/hooks/useWxtStorage.tsx` — 公共 storage hook

---

### Task 1: 配置 wxt.config.ts 注册 newtab

**Files:**
- Modify: `wxt.config.ts`

- [ ] **Step 1: 在 manifest 中添加 chrome_url_overrides**

在 manifest 对象中添加 `chrome_url_overrides` 配置：

```ts
const manifest = {
    // ...现有配置
    chrome_url_overrides: {
        newtab: 'newtab/index.html'
    }
}
```

放置在 `side_panel` 配置之后。

- [ ] **Step 2: 验证构建不报错**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add wxt.config.ts
git commit -m "chore: 注册新标签页覆盖为 newtab/index.html"
```

---

### Task 2: 创建入口 HTML 文件

**Files:**
- Create: `src/entries/newtab/index.html`

- [ ] **Step 1: 创建入口 HTML**

参考 `src/entries/sidePanel/index.html`，创建 newtab 入口：

```html
<!doctype html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>新标签页</title>
    </head>

    <body>
        <div id="root"></div>
        <script type="module" src="@/newtab/index.tsx"></script>
    </body>
</html>
```

- [ ] **Step 2: 提交**

```bash
git add src/entries/newtab/index.html
git commit -m "feat: 创建新标签页入口 HTML"
```

---

### Task 3: 创建搜索引擎存储 hook

**Files:**
- Create: `src/newtab/store/useSearchEngines.ts`

- [ ] **Step 1: 创建 useSearchEngines.ts**

参考 `src/sidePanel/store/demo.ts` 的模式，使用 `@wxt-dev/storage` 定义存储项并封装 hook：

```ts
import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface SearchEngine {
  key: string
  name: string
  url: string
}

export interface SearchEnginesState {
  current: string
  list: SearchEngine[]
}

const searchEnginesStorage = storage.defineItem<SearchEnginesState>(
  'local:searchEngines',
  {
    fallback: {
      current: 'google',
      list: [
        {
          key: 'google',
          name: 'Google',
          url: 'https://www.google.com/search?q='
        },
        {
          key: 'baidu',
          name: '百度',
          url: 'https://www.baidu.com/s?wd='
        },
        {
          key: 'bing',
          name: 'Bing',
          url: 'https://www.bing.com/search?q='
        }
      ]
    }
  }
)

export default function useSearchEngines() {
  return useWxtStorage(searchEnginesStorage)
}
```

- [ ] **Step 2: 验证类型**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/newtab/store/useSearchEngines.ts
git commit -m "feat: 创建搜索引擎存储 hook"
```

---

### Task 4: 创建搜索栏组件

**Files:**
- Create: `src/newtab/components/SearchBar.tsx`

- [ ] **Step 1: 创建 SearchBar.tsx**

搜索栏组件，包含引擎下拉选择、搜索输入框、居中样式：

```tsx
import { useState, type KeyboardEvent } from 'react'
import useSearchEngines from '../store/useSearchEngines'

export default function SearchBar() {
  const [engines, setEngines] = useSearchEngines()
  const [query, setQuery] = useState('')

  const currentEngine = engines.list.find(
    (e) => e.key === engines.current
  ) ?? engines.list[0]

  const handleSearch = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    window.open(currentEngine.url + encodeURIComponent(trimmed), '_blank')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleEngineChange = (key: string) => {
    setEngines({ ...engines, current: key })
  }

  return (
    <div className='search-bar'>
      <select
        value={engines.current}
        onChange={(e) => handleEngineChange(e.target.value)}
      >
        {engines.list.map((engine) => (
          <option key={engine.key} value={engine.key}>
            {engine.name}
          </option>
        ))}
      </select>
      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='搜索...'
      />
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/newtab/components/SearchBar.tsx
git commit -m "feat: 创建搜索栏组件"
```

---

### Task 5: 创建 React 根组件

**Files:**
- Create: `src/newtab/index.tsx`

- [ ] **Step 1: 创建 index.tsx**

根组件，挂载 SearchBar 并引入全局样式：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SearchBar from './components/SearchBar'

// 内联全局样式：纯色背景 + 居中布局
const style = document.createElement('style')
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .search-bar {
    display: flex;
    gap: 8px;
    width: 560px;
  }
  .search-bar select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
    outline: none;
    cursor: pointer;
  }
  .search-bar input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-bar input:focus {
    border-color: #666;
  }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SearchBar />
  </StrictMode>
)
```

- [ ] **Step 2: 验证类型**

Run: `pnpm compile`
Expected: 无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/newtab/index.tsx
git commit -m "feat: 创建新标签页根组件"
```

---

### Task 6: 全局验证

- [ ] **Step 1: 完整构建测试**

Run: `pnpm build`
Expected: 构建成功，输出目录包含 `newtab/index.html`

- [ ] **Step 2: 运行现有测试**

Run: `pnpm test`
Expected: 现有测试全部通过

- [ ] **Step 3: 提交剩余文件**

```bash
git add .
git commit -m "feat: 完成新标签页搜索主页"
```
