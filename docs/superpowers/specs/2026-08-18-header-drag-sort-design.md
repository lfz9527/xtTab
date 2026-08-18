# Header 左侧按钮拖拽排序 — 设计文档

日期：2026-08-18

## 背景

xtTab 新标签页顶部导航栏（`src/newTab/components/Header.tsx`）左侧为内容区视图切换按钮：「快捷书签」（pins）与「标签页」（tabs），当前顺序写死在组件内。需求：左侧按钮支持拖拽调整顺序，且顺序持久化保存。

## 已确认决策

1. **实现方案**：引入 @dnd-kit 新版（官网 dndkit.com/react 当前 API）
   - `@dnd-kit/react`（^0.5.0）— 唯一必需包：`DragDropProvider`、`useSortable`
   - `@dnd-kit/helpers`（^0.5.0）— `move(items, event)` 排序工具
   - `@dnd-kit/dom`、`@dnd-kit/abstract` 由上述包自动依赖装入，不手动添加
2. **拖拽交互**：整按钮可拖（不设独立手柄），dnd-kit 默认行为即整元素可拖
3. **默认视图**：新标签页默认展示排序后首位按钮对应的视图

## 设计

### 1. 顺序持久化 — 新增 `src/newTab/store/useHeaderViews.ts`

复用现有 `useWxtStorage` + `storage.defineItem` 模式（同 `usePinBookmarks.ts` / `useSettings.ts`）：

- 存储项：`storage.defineItem<HeaderView[]>('local:headerViewOrder', { fallback: ['pins', 'tabs'] })`
- 纯函数 `normalizeViews(views: unknown): HeaderView[]`：
  - 确保返回值永远是全部 `HeaderView` 的完整排列（每个视图恰好出现一次）
  - 剔除非法/重复项，缺失的视图按 fallback 中的相对顺序补到末尾
  - 防止存储值被改动后（如手改 storage）首位默认视图逻辑失效
- hook `useHeaderViews()` 返回 `{ viewOrder, moveView }`：
  - `viewOrder`：`useWxtStorage` 读出的顺序数组（读后经 `normalizeViews` 清洗）
  - `moveView(event)`：`setViewOrder((order) => move(order, event))`
  - `move` 来自 `@dnd-kit/helpers`，自带取消拖拽处理，兼容乐观排序（拖拽中 `source`/`target` 为同一元素，`move` 依据 `initialIndex → index` 计算位移）

### 2. 默认视图跟随首位 — 修改 `src/newTab/store/useAppStore.ts` 与 `src/newTab/app.tsx`

- `useAppStore`：`activeHeaderView` 初始值由 `'pins'` 改为 `null`，类型改为 `HeaderView | null`
  - 语义：`null` = 用户尚未手动选择，跟随视图排序首位
- `app.tsx`：`const effectiveView = activeHeaderView ?? viewOrder[0]`
  - 内容区渲染（`PinnedBookmarks` / `TabsPanel`）与 Header 高亮统一使用 `effectiveView`
  - 用户点击按钮后 `activeHeaderView` 被显式设置，此后拖拽换位不会打断当前视图

### 3. Header 拖拽改造 — 修改 `src/newTab/components/Header.tsx`

只改左侧视图按钮区，右侧「书签/设置」按钮不参与：

- 左侧按钮容器包 `<DragDropProvider onDragEnd={moveView}>`
- 新增内部组件 `SortableViewButton`（需调用 `useSortable`，故独立成组件）：
  - `const { ref, isDragging } = useSortable({ id: view, index })`
  - `ref` 挂到 `<Button ref={ref}>`（项目为 React 19，ref 可作为普通 prop 透传；`Button` 组件 `...props` 展开可带上）
  - `isDragging` 时给按钮加阴影/透明度样式提示
- 排序策略：新版 API 无显式 strategy 概念，列表为横向 flex，乐观排序由内置 `OptimisticSortingPlugin` 处理 DOM 位移

### 4. 测试

新增 `src/newTab/store/useHeaderViews.test.ts`（仿 `usePinBookmarks.test.ts` 纯函数单测）：

- `normalizeViews`：合法排列原样返回；去重；剔除非法值；缺失视图补全；空数组/`undefined` 返回 fallback

### 5. 验证

- `pnpm compile`（tsc 类型检查）
- `pnpm test`（vitest）
- `pnpm dev` 手动验证：拖拽换位、顺序持久化（刷新后保持）、默认视图跟随首位、点击后不被打断

## 涉及文件

| 文件 | 操作 |
| --- | --- |
| `src/newTab/store/useHeaderViews.ts` | 新增 |
| `src/newTab/store/useHeaderViews.test.ts` | 新增 |
| `src/newTab/store/useAppStore.ts` | 修改（`activeHeaderView` 初值/类型） |
| `src/newTab/app.tsx` | 修改（`effectiveView`） |
| `src/newTab/components/Header.tsx` | 修改（拖拽改造） |
| `package.json` | 修改（新增 2 个依赖） |

## 边界情况

- 存储损坏/缺失 → `normalizeViews` 返回完整 fallback 排列，首位默认视图逻辑恒有效
- 拖拽中点击不生效 → dnd-kit 内置传感器区分点击与拖拽（无位移即点击）
- 排序结果只影响按钮顺序与默认视图，不改变 `activeHeaderView` 已选状态
