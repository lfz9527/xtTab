# 书签弹窗方向键控制设计

日期：2026-08-08
状态：已确认

## 需求背景

书签弹窗（`BookmarkDialog`）目前只能通过鼠标点击或 Tab 键操作列表，无法用键盘高效浏览。本功能为弹窗列表增加方向键控制：上下键在列表中移动高亮，Enter 激活高亮项，交互与已有 `SuggestPopover` 联想列表一致。

## 交互规格

1. 打开弹窗：焦点在搜索框，列表无高亮
2. `ArrowDown` / `ArrowUp`：在当前目录列表（`currentNodes`）中循环移动高亮（`-1` 时按下 → 第一项，到底回绕），长按 key repeat 用 `useThrottleFn` 限频
3. `Enter`：高亮项为文件夹 → 进入该文件夹；为书签 → 打开；无高亮 → 不动作
4. 列表变化（进入/返回目录、搜索词变化）：重置高亮为 `-1`
5. 高亮项滚动跟随：超出可视区时 `scrollIntoView({ block: 'nearest' })`
6. 搜索框聚焦时：方向键 / Enter 优先被列表消费（`preventDefault`），与 `SuggestPopover` 一致；中文输入法组合期间（`isComposing`）不消费事件
7. `Esc`：Dialog 默认关闭，无需处理

## 实现方案（方案 B：Tree 内部封装）

参照 `SuggestPopover` 的 ref + handle 模式，键盘导航逻辑内聚在 `BookmarkTree` 内部。

### `src/newTab/components/BookmarkTree.tsx`

- 新增并导出 `BookmarkTreeHandle` 接口：`handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => boolean`（返回 true 表示事件已被消费）
- 组件改为 `forwardRef` + `useImperativeHandle`，暴露 `handleKeyDown`
- 新增 `activeIndex` 状态，`nodes` 变化时 `useEffect` 重置为 `-1`
- `handleKeyDown`：
  - `ArrowDown` / `ArrowUp` → 循环移动 `activeIndex`（复用 `useThrottleFn` 限频，`{ wait: 180, trailing: false }` 与 SuggestPopover 一致）
  - `Enter` 且 `activeIndex >= 0` → 文件夹走 `onEnterFolder(node)`，书签走 `onOpenBookmark(node.url)`
- 高亮渲染：`index === activeIndex` 的项加 `bg-muted` 类（与现有 hover 效果一致）
- 滚动跟随：给高亮项挂 ref，`activeIndex` 变化时 `scrollIntoView({ block: 'nearest' })`

### `src/newTab/components/BookmarkDialog.tsx`

- 新增 `treeRef = useRef<BookmarkTreeHandle>(null)`，传入 `<BookmarkTree ref={treeRef} />`
- 搜索框 `Input` 新增 `onKeyDown`：先判断 `e.nativeEvent.isComposing` 则 return，再调用 `treeRef.current?.handleKeyDown(e)`，返回 true 则消费

## 不改动

- `Dialog` / `ScrollArea` 等 UI 组件
- 现有目录浏览、搜索、置顶逻辑
- 置顶按钮（PinIcon）不参与键盘导航

## 验收标准

1. 打开书签弹窗，焦点在搜索框，列表无高亮
2. 按 `ArrowDown` 高亮第一项，继续按循环移动；`ArrowUp` 反向循环
3. 高亮文件夹按 `Enter` 进入该文件夹，高亮书签按 `Enter` 打开
4. 进入/返回目录、修改搜索词后高亮重置为无
5. 高亮项超出可视区时列表自动滚动跟随
6. 搜索框输入中文（输入法组合中）时方向键/Enter 不被列表消费
7. 原有鼠标操作、Tab 操作、搜索、置顶功能不受影响
