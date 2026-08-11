# Header 左侧菜单（内容区切换）设计

日期：2026-08-11
状态：已确认

## 需求背景

新标签页顶部 Header 左侧目前为空。本次在左侧添加两个菜单入口：**快捷书签**、**标签页面板**。二者不是下拉浮层，而是**切换搜索框下方内容区**的视图切换器。

## 交互规格

1. 搜索框下方内容区由全局状态 `activeHeaderView` 驱动，共三个视图：

   | 视图 | 触发方式 | 内容 |
   |---|---|---|
   | `pins`（默认） | 初始状态 | 现有置顶书签卡片区（`PinnedBookmarks`） |
   | `quick` | 点击「快捷书签」 | 置顶书签紧凑列表 |
   | `tabs` | 点击「标签页面板」 | 所有窗口标签页列表 |

2. 纯切换、无关闭：点哪个菜单显示哪个视图，没有"关闭/恢复默认"操作
3. 当前激活的菜单按钮高亮（`text-foreground`），未激活不高亮；初始均不高亮
4. 点击已激活的菜单按钮：仍保持该视图（无 toggle 行为）

## 实现方案

### `src/newTab/store/useAppStore.ts`

- 新增 `activeHeaderView: 'pins' | 'quick' | 'tabs'`（初始 `'pins'`）+ `setActiveHeaderView(view)`
- 属于全局临时 UI 状态，符合该 store 定位，不持久化

### `src/newTab/components/Header.tsx`

- 布局从 `justify-end` 改为 `justify-between`
- 左侧新增两个图标按钮（沿用右侧圆形按钮样式 `size-9 rounded-full hover:bg-muted`）：
  - 快捷书签：`StarIcon`（与右侧 `BookmarkIcon` 区分），激活高亮
  - 标签页面板：`LayoutGridIcon`，激活高亮
- 点击时 `setActiveHeaderView('quick' | 'tabs')`
- 右侧书签/设置按钮不动

### `src/newTab/app.tsx`

- `PinnedBookmarks` 区域改为按 `activeHeaderView` 渲染：

```tsx
{activeHeaderView === 'pins' && <PinnedBookmarks />}
{activeHeaderView === 'quick' && <QuickBookmarksView />}
{activeHeaderView === 'tabs' && <TabsPanel />}
```

- `PinnedBookmarks` 自身逻辑不动

### 新建 `src/newTab/components/QuickBookmarksView.tsx`

- 置顶书签**紧凑列表**（非卡片），数据链路完全复用现有 `PinnedBookmarks`：
  - `usePinBookmarks()` 取 `pinnedIds`
  - `messageBus.send(BackgroundAction.BOOKMARK_GET_TREE.key)` 取书签树
  - `findBookmarksByIds` 过滤
- 渲染：favicon（`faviconUrl` + `safeHost`，失败兜底 `GlobeIcon`）+ 标题，点击按 `settings.bookmarkTarget` 打开（'current' → `window.location.href` / 'new' → `window.open`）
- 无置顶书签时显示「暂无置顶书签」占位
- 不渲染"取消置顶"按钮（仅快速打开入口）

### 新建 `src/newTab/components/TabsPanel.tsx`

- `browser.tabs.query({})` 获取**所有窗口**标签页，按 `windowId` 分组展示（组标题显示窗口序号）
- 每项：favicon + 标题 + 域名（`safeHost`）
- 当前活动标签（`tab.active && tab.windowId === 当前聚焦窗口`）高亮
- 点击标签：`browser.tabs.update(tabId, { active: true })` + `browser.windows.update(windowId, { focused: true })`
- 无标签页（理论不出现）兜底显示占位文案

### `src/hooks/useTabs.tsx`

- 扩展为支持可选参数：`useTabs(query?: Browser.tabs.QueryInfo)`，默认 `{ currentWindow: true }` 不变
- `TabsPanel` 传入 `{}` 查询全部窗口
- 该 hook 当前无任何调用方，扩展安全

## 不改动

- Header 右侧书签/设置按钮、两个弹窗
- `PinnedBookmarks` 组件内部逻辑
- `SearchBar`、快捷键
- 不引入新 UI 组件库（不新增 popover/dropdown 浮层）

## 验收标准

1. Header 左侧出现「快捷书签」「标签页面板」两个按钮，右侧按钮不受影响
2. 初始搜索框下方显示置顶书签卡片区（现状不变）
3. 点击「快捷书签」→ 下方切换为置顶书签紧凑列表，按钮高亮
4. 点击「标签页面板」→ 下方切换为所有窗口标签页列表，按钮高亮
5. 点击激活中的菜单按钮视图不变；两个按钮互斥切换
6. 快捷书签列表点击按 `bookmarkTarget` 设置打开
7. 标签页列表点击切换到对应标签页（窗口聚焦 + 标签激活）
8. `pnpm compile` 与 `pnpm test` 通过
