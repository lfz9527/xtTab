# New Tab 极简搜索主页设计

## 概述

为 xtTab 扩展新增浏览器新标签页（New Tab Page），替换 Chrome 默认新标签页，提供一个极简的多引擎搜索主页。

## 入口

- 通过 WXT `chrome_url_overrides` 注册 `newtab` 入口
- 新增 `src/entries/newtab/index.html` 作为 WXT 入口 HTML
- 替换浏览器默认新标签页，新建标签页时自动打开

## 目录结构

```
src/
├── entries/
│   └── newtab/
│       └── index.html              ← WXT newtab 入口 HTML
├── newtab/
│   ├── index.tsx                   ← React 根组件
│   ├── components/
│   │   └── SearchBar.tsx           ← 多引擎搜索栏组件
│   └── store/
│       └── useSearchEngines.ts     ← 搜索引擎存储 + hook 封装
```

## 功能

### 搜索栏 (SearchBar)

- 居中布局，搜索输入框
- 引擎切换：Google / 百度 / Bing，通过下拉选择
- Enter 回车在新标签页打开搜索结果
- 搜索 URL 规则：
  - Google: `https://www.google.com/search?q={query}`
  - 百度: `https://www.baidu.com/s?wd={query}`
  - Bing: `https://www.bing.com/search?q={query}`

### 搜索引擎存储 (store/useSearchEngines.ts)

- 使用 `@wxt-dev/storage` 的 `storage.defineItem` 定义 `local:searchEngines`
- 数据结构：`{ current: string, list: SearchEngine[] }`
- `SearchEngine`: `{ key: string, name: string, url: string }`
- 默认列表内置 Google / 百度 / Bing 三个引擎
- 导出 `useSearchEngines()` hook，内部调用 `useWxtStorage()`，返回 `[state, setState]` 数组
- 后续扩展：在 hook 内部增强 setter，对外接口不变

### 视觉

- 纯色背景（白色/浅灰）
- 搜索栏垂直居中 + 水平居中
- 简约风格，无额外装饰

## 数据流

```
用户输入查询 + 选引擎 → SearchBar → window.open(engine.url + query, '_blank')
                                  ↑
                          useSearchEngines() → @wxt-dev/storage → chrome.storage.local
```

## wxt.config.ts 变更

- 增加 `chrome_url_overrides` manifest 配置：`newtab: 'newtab/index.html'`

## 未包含（后续版本考虑）

- 常用链接网格
- 书签导入
- 设置面板
- 自定义背景
- 天气等小部件
