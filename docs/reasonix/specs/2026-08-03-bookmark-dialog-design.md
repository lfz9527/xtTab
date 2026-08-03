# newTab 书签弹窗设计

## 概述

在 newTab 右上角设置按钮旁新增书签按钮，点击弹出 600px 弹窗，以 Windows 文件资源管理器风格的目录浏览方式展示浏览器书签，点击书签项在新标签页打开。

## 入口与布局

- `app.tsx` 中挂载 `BookmarkDialog` 组件（与 `SettingsDialog` 并列）
- 触发按钮：圆形 `BookmarkIcon`，`fixed right-14 top-2`（设置按钮 `right-2` 左侧），样式与设置按钮一致（`size-9` 圆形、hover 反馈）
- 弹窗宽度 `max-w-150`（600px），`showCloseButton={false}`，标题「书签」

## 目录结构

```
src/newTab/components/
├── BookmarkDialog.tsx        ← 新增：书签弹窗（触发按钮 + Dialog + 路径状态 + 面包屑/返回导航）
└── BookmarkTree.tsx          ← 新增：目录内容列表组件（当前目录内文件夹/书签平铺，点击文件夹进入）
```

## 数据流

```
BookmarkDialog 挂载 → messageBus.send(BackgroundAction.BOOKMARK_GET_TREE)
    → background registerBookmarksListener → browser.bookmarks.getTree()
    → MessageResponse<BookmarkTreeNode[]> → state.tree
```

- 复用已实现的 `BackgroundAction.BOOKMARK_GET_TREE` 消息接口（`src/background/bookmarks.ts`）
- 响应为空数组（无书签或异常兜底）→ 显示空状态「暂无书签」

## 资源管理器式目录浏览

### 状态（BookmarkDialog）

- `path: BookmarkTreeNode[]`：路径栈，`[]` 表示根目录；点击文件夹 `setPath([...path, node])` 进入
- 当前显示内容：`path.length === 0 ? tree : path[path.length - 1].children ?? []`

### 顶部导航

- **返回按钮**：`ChevronLeftIcon`，`path` 为空时隐藏，点击 pop 栈逐级回退
- **面包屑**：`根` / 各层级文件夹名称，每级可点击跳回对应层级

### 内容列表（BookmarkTree）

平铺渲染当前目录的 `BookmarkTreeNode`（非递归）：

| 节点类型 | 判定 | 展示 | 交互 |
|---|---|---|---|
| 文件夹 | `children` 存在 | `FolderIcon` + 名称 | 点击 `onEnterFolder(node)` 进入 |
| 书签 | 无 `children`（有 `url`） | `GlobeIcon` + 标题 | 点击 `window.open(url, '_blank')`（新标签页打开，不关闭弹窗） |

- 组件 props：`nodes` + `onEnterFolder(node)` + `onOpenBookmark(url)`，不再接收展开状态
- 空目录（当前文件夹无 children）→ 「此文件夹为空」提示
- 根目录为 `getTree()` 返回的根文件夹数组（"Bookmarks bar"、"Other bookmarks" 等）

## 错误处理与空态

- background 已对接口异常兜底返回空数组，前端无需额外捕获
- 空数组 → 「暂无书签」提示

## 测试

- 目录浏览为 UI 渲染，无纯逻辑可测（项目无 React 测试库），沿用现有策略：`pnpm compile` + `pnpm test`（现有 5/5）+ 浏览器实测

## 未包含（后续版本考虑）

- 书签搜索
- 书签增删改管理
- 书签节点拖拽/右键菜单
