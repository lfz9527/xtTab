# Header 左侧菜单（内容区切换）设计

日期：2026-08-11
状态：已确认

## 需求背景

新标签页顶部 Header 左侧目前为空。本次在左侧添加一个菜单入口：**快捷书签**。它不是下拉浮层，而是**切换搜索框下方内容区**的视图切换器。

## 交互规格

1. 搜索框下方内容区由全局状态 `activeHeaderView` 驱动，共两个视图：

   | 视图 | 触发方式 | 内容 |
   |---|---|---|
   | `pins`（默认） | 初始状态 | 现有置顶书签卡片区（`PinnedBookmarks`） |
   | `quick` | 点击「快捷书签」 | 置顶书签紧凑列表 |

2. 纯切换、无关闭：点击菜单显示对应视图，没有"关闭/恢复默认"操作
3. 当前激活的菜单按钮高亮（`text-foreground`），未激活不高亮；初始均不高亮
4. 点击已激活的菜单按钮：仍保持该视图（无 toggle 行为）

## 实现方案

### `src/newTab/store/useAppStore.ts`

- 新增 `activeHeaderView: 'pins' | 'quick'`（初始 `'pins'`）+ `setActiveHeaderView(view)`
- 属于全局临时 UI 状态，符合该 store 定位，不持久化

### `src/newTab/components/Header.tsx`

- 布局从 `justify-end` 改为 `justify-between`
- 左侧新增一个图标按钮（沿用右侧圆形按钮样式 `size-9 rounded-full hover:bg-muted`）：
  - 快捷书签：`StarIcon`（与右侧 `BookmarkIcon` 区分），激活高亮
- 点击时 `setActiveHeaderView('quick')`
- 右侧书签/设置按钮不动

### `src/newTab/app.tsx`

- `PinnedBookmarks` 区域改为按 `activeHeaderView` 渲染：

```tsx
{activeHeaderView === 'pins' && <PinnedBookmarks />}
{activeHeaderView === 'quick' && <QuickBookmarksView />}
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

### ~~新建 `src/newTab/components/TabsPanel.tsx`~~（已移除）

> 需求变更：标签页面板不再实现。原方案为 `browser.tabs.query({})` 获取所有窗口标签页按窗口分组展示，点击 `browser.tabs.update` + `browser.windows.update` 切换；相关内容与 `useTabs` 扩展均已回退删除。

### ~~`src/hooks/useTabs.tsx` 扩展~~（已回退）

> 原方案扩展为支持 `query` 参数查询所有窗口标签页；TabsPanel 移除后无调用方，已回退为原始实现（`currentWindow: true` 固定）。

## 不改动

- Header 右侧书签/设置按钮、两个弹窗
- `PinnedBookmarks` 组件内部逻辑
- `SearchBar`、快捷键
- 不引入新 UI 组件库（不新增 popover/dropdown 浮层）

## 验收标准

1. Header 左侧出现「快捷书签」按钮，右侧按钮不受影响
2. 初始搜索框下方显示置顶书签卡片区（现状不变）
3. 点击「快捷书签」→ 下方切换为置顶书签紧凑列表，按钮高亮
4. 再次点击已激活的「快捷书签」按钮视图不变（无 toggle 行为）
5. 快捷书签列表点击按 `bookmarkTarget` 设置打开
6. `pnpm compile` 与 `pnpm test` 通过
