# 书签置顶功能设计

## 概述

在书签弹窗（`BookmarkDialog`）中为书签提供「置顶」操作：列表项悬停显示图钉按钮，点击置顶/取消置顶。被置顶的书签以卡片形式展示在 newTab 主页（SearchBar 下方）。置顶仅影响主页卡片展示，书签弹窗目录列表顺序保持不变。

## 数据存储：方案 A（只存 id 列表）

置顶数据仅存书签 id 列表，主页渲染时实时从浏览器书签树按 id 匹配，保证数据一致（书签改名/删除自动同步，不残留失效数据）。

- 存储键：`local:pinBookmarks`，类型 `string[]`（书签 id）
- 新增 `src/newTab/store/usePinBookmarks.ts`，仿 `useSettings` 模式（`storage.defineItem` + `useWxtStorage`）
- 暴露操作：`pinnedIds: string[]`、`togglePin(id: string)`（含则移除、不含则追加）

## 目录结构

```
src/newTab/
├── store/
│   └── usePinBookmarks.ts   ← 新增：置顶书签 id 集合（storage 持久化）
└── components/
    ├── BookmarkTree.tsx     ← 修改：书签项悬停图钉按钮
    ├── BookmarkDialog.tsx   ← 修改：将 pinnedIds 传入 BookmarkTree
    └── PinnedBookmarks.tsx  ← 新增：主页置顶书签卡片区
```

## 书签弹窗改动（BookmarkTree + BookmarkDialog）

- 书签项（有 `url`）在整行 hover 时右侧显示图钉按钮（lucide `PinIcon`）：
  - 未置顶：`text-muted-foreground`，hover 变 `text-foreground`
  - 已置顶：`fill-foreground text-foreground`（高亮态）
- 点击图钉：`togglePin(node.id)`，不触发行点击（`stopPropagation`）
- 文件夹项不显示图钉（主页卡片展示的是书签链接）
- `BookmarkTree` 新增 props：`pinnedIds: Set<string>` 与 `onTogglePin(id: string)`
- `BookmarkDialog` 通过 `usePinBookmarks()` 获取并传入

## 主页卡片区（新增 PinnedBookmarks）

- 挂载位置：`app.tsx` 中 `SearchBar` 下方（现有列布局内）
- 数据流：
  ```
  usePinBookmarks().pinnedIds + messageBus.send(BOOKMARK_GET_TREE)
      → 递归遍历书签树按 id 匹配 → 命中项生成卡片
      → 未命中的 id 自动跳过（书签已删除）
  ```
- 无置顶书签时整块不渲染（主页保持现有简洁样式）
- 卡片内容：站点 favicon + 标题，横向排列（flex wrap）
  - favicon：外部服务 `https://www.google.com/s2/favicons?domain=<host>&sz=64`（外部 URL 硬编码，添加注释说明）；加载失败兜底 `GlobeIcon`
- 卡片交互：
  - 点击：跟随 `settings.bookmarkTarget`（`'current'` 当前页 / `'new'` 新标签页）
  - 悬停显示取消置顶按钮（`PinOffIcon` 或 `XIcon`），点击 `unpin`，不触发行点击

## 错误处理与空态

- 拉树失败（background 兜底返回空数组）→ 主页卡片区自然不渲染，无额外处理
- 书签 id 失效（已删除）→ 按 id 匹配不到即跳过，无需清理逻辑
- 弹窗图钉交互无异常路径（本地状态切换）

## 测试

- 新增纯逻辑（id 匹配/集合切换）可抽纯函数并补 Vitest 测试（沿用 `src/**/*.test.ts` 模式，参考 `src/background/suggest.test.ts`）
- UI 渲染沿用现有策略：`pnpm compile` + `pnpm test` + 浏览器实测

## 未包含（后续版本考虑）

- 目录内排序置顶（本次确认：置顶仅影响主页卡片）
- 置顶文件夹
- 置顶书签的拖拽排序/数量上限
