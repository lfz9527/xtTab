# Header 导航栏设计

日期：2026-08-05
状态：已确认

## 需求背景

新标签页当前的书签、设置入口为两个 fixed 定位的圆形图标按钮（右上角），散落在弹窗组件内部。本次改造为统一的上中下三段式页面布局，将入口收纳进顶部 Header 导航栏，提升视觉统一性。

## 页面结构（上中下三段）

```
<div 背景图容器 flex-col h-full>
  <Header />              ← 上：60% 不透明度导航（fixed 顶部）
  <main 中部>             ← 中：搜索框（偏上部）
    <SearchBar />
  </main>
  <PinnedBookmarks />     ← 下：置顶书签卡片区
  <SettingsDialog />      ← 弹窗（fixed，不影响布局）
  <BookmarkDialog />      ← 弹窗（fixed，不影响布局）
</div>
```

## Header 组件（新增 `src/newTab/components/Header.tsx`）

- 定位：`fixed inset-x-0 top-0 z-40`，不占文档流
- 样式：`bg-background/60`（60% 不透明度），无高斯模糊，内边距容纳按钮
- 内容：右侧排列两个图标按钮
  - 书签按钮：`BookmarkIcon`，点击 `setBookmarkOpen(true)`
  - 设置按钮：`SettingsIcon`，点击 `setSettingsOpen(true)`
- 按钮样式沿用现有圆形悬浮按钮（`size-9 rounded-full hover:bg-muted`），移除原 fixed 定位

## 弹窗改造

- **SettingsDialog**：移除 `DialogTrigger`（齿轮按钮），仅保留受控 `DialogContent`（`open` 由 `useAppStore` 驱动）
- **BookmarkDialog**：移除 `DialogTrigger`（书签按钮），仅保留受控 `DialogContent`
- 弹窗内容逻辑不变（书签树浏览、设置项、快捷键等均不动）

## 布局调整（app.tsx）

- 外层背景容器保持 `flex h-full w-full flex-col`
- 中部搜索区域改为 `flex-1` 容器，内容偏上（`pt-50` 类保持距顶部间距）
- `PinnedBookmarks` 置于底部
- 弹窗组件保留在末尾（fixed 定位不受布局影响）

## 状态管理

- 弹窗开关沿用现有 `useAppStore`（`bookmarkOpen` / `settingsOpen` 及 setter），无新增状态
- 快捷键功能（`useShortcuts`）不受影响

## 验收标准

1. 页面顶部出现 60% 不透明度 Header，右侧含书签、设置两个图标按钮
2. 点击书签按钮打开书签弹窗，点击设置按钮打开设置弹窗
3. 原右上角悬浮按钮消失，无残留
4. 搜索框位于中部偏上，置顶书签卡片位于底部
5. 弹窗内容、快捷键、搜索功能均不受影响
