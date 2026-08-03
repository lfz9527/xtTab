# newTab 书签弹窗设计

## 概述

在 newTab 右上角设置按钮旁新增书签按钮，点击弹出 600px 弹窗，以文件资源管理器风格的树形结构展示浏览器书签，点击书签项在新标签页打开。

## 入口与布局

- `app.tsx` 中挂载 `BookmarkDialog` 组件（与 `SettingsDialog` 并列）
- 触发按钮：圆形 `BookmarkIcon`，`fixed right-14 top-2`（设置按钮 `right-2` 左侧），样式与设置按钮一致（`size-9` 圆形、hover 反馈）
- 弹窗宽度 `max-w-150`（600px），`showCloseButton={false}`，标题「书签」

## 目录结构

```
src/newTab/components/
├── BookmarkDialog.tsx        ← 新增：书签弹窗（触发按钮 + Dialog + 树容器）
└── BookmarkTree.tsx          ← 新增：递归树组件（文件夹节点可展开折叠、书签节点点击打开）
```

## 数据流

```
BookmarkDialog 挂载 → messageBus.send(BackgroundAction.BOOKMARK_GET_TREE)
    → background registerBookmarksListener → browser.bookmarks.getTree()
    → MessageResponse<BookmarkTreeNode[]> → state.tree
```

- 复用已实现的 `BackgroundAction.BOOKMARK_GET_TREE` 消息接口（`src/background/bookmarks.ts`）
- 响应为空数组（无书签或异常兜底）→ 显示空状态「暂无书签」

## 树形展示（BookmarkTree）

递归渲染 `BookmarkTreeNode`：

| 节点类型 | 判定 | 展示 | 交互 |
|---|---|---|---|
| 文件夹 | `children` 存在 | `FolderIcon` + 名称 | 点击展开/折叠（`ChevronRightIcon` 90° 旋转动画） |
| 书签 | 无 `children`（有 `url`） | `GlobeIcon` + 标题 | 点击 `window.open(url, '_blank')`（新标签页打开，不关闭弹窗） |

- 展开状态：`useState<Set<string>>`（按节点 `id` 记录），默认全部折叠
- 仅展示文件夹与书签节点；Chrome 根目录（"Bookmarks bar"、"Other bookmarks" 等）按普通文件夹显示
- 无子节点的文件夹可展开（展开后为空），不特殊处理

## 错误处理与空态

- background 已对接口异常兜底返回空数组，前端无需额外捕获
- 空数组 → 「暂无书签」提示

## 测试

- 树组件为 UI 渲染，无纯逻辑可测（项目无 React 测试库），沿用现有策略：`pnpm compile` + `pnpm test`（现有 5/5）+ 浏览器实测

## 未包含（后续版本考虑）

- 书签搜索
- 书签增删改管理
- 树节点拖拽/右键菜单
