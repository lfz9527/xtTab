# Background 消息 Action 统一枚举与书签模块设计

## 概述

为 xtTab 扩展统一 background 消息 action 的常量管理，并新增书签查询能力（首个接口 `getTree`）。

- 新增 `BackgroundAction` 枚举类（参考 `MessagingCode` 的 `BaseEnumCls` 模式），统一收纳 background 消息 action
- 新增 `src/background/bookmarks.ts` 书签模块，提供 `getTree` 接口注册
- 迁移现有 `SUGGEST_ACTION` 常量至 `BackgroundAction`

## BackgroundAction 枚举

### 新建 `src/constants/backgroundAction.ts`

```ts
import BaseEnumCls from './base'

// background 消息 action 枚举
export class BackgroundAction extends BaseEnumCls<string> {
  static readonly SUGGEST = new BackgroundAction('suggest', '搜索联想')
  static readonly BOOKMARK_GET_TREE = new BackgroundAction('bookmark-get-tree', '获取书签树')
}
```

- 与 `MessagingCode` 同构：继承 `BaseEnumCls`，`key` 为消息协议值，`label` 为中文描述
- `key` 取值沿用现有协议值（`'suggest'` 不变），新增 `'bookmark-get-tree'`
- 使用方通过 `BackgroundAction.SUGGEST.key` 取消息值

### 修改 `src/constants/index.ts`

re-export `BackgroundAction`，使用方统一从 `@/constants` 导入（与 `MessagingCode` 一致）：

```ts
export { BackgroundAction } from './backgroundAction'
```

## 目录结构

```
src/
├── constants/
│   ├── backgroundAction.ts        ← 新增：BackgroundAction 枚举
│   └── index.ts                   ← 修改：re-export BackgroundAction
├── background/
│   ├── bookmarks.ts               ← 新增：书签模块（getTree 接口）
│   ├── suggest.ts                 ← 修改：删除 SUGGEST_ACTION 导出，改用 BackgroundAction
│   └── index.ts                   ← 修改：注册 registerBookmarksListener()
└── newtab/
    └── components/
        └── SuggestPopover.tsx     ← 修改：改用 BackgroundAction.SUGGEST.key
```

## 书签模块

### 新建 `src/background/bookmarks.ts`

```ts
import MessageBus from '@/messages/message'
import { type MessageResponse } from '@/messages/types'
import { MessagingCode, BackgroundAction } from '@/constants'

// 获取完整书签树（含文件夹层级）；返回类型由 WXT 全局 browser API 推断
async function getBookmarksTree() {
  const [root] = await browser.bookmarks.getTree()
  return root?.children ?? []
}

// 注册书签消息监听：异常兜底返回空数组
export function registerBookmarksListener() {
  MessageBus.on(BackgroundAction.BOOKMARK_GET_TREE.key, async () => {
    try {
      const tree = await getBookmarksTree()
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: tree } satisfies MessageResponse<typeof tree>
    } catch {
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: [] } satisfies MessageResponse<typeof tree>
    }
  })
}
```

- `getBookmarksTree()`：调用 `browser.bookmarks.getTree()`，返回根节点 children（完整树结构）
- 无入参；树结构原样透传，扁平化/过滤等处理留给前端按需实现
- 依赖 `bookmarks` 权限（已添加）

### 修改 `src/background/index.ts`

在 `registerSuggestListener()` 旁注册：

```ts
registerBookmarksListener()
```

## SUGGEST_ACTION 迁移

- `src/background/suggest.ts`：删除 `SUGGEST_ACTION` 常量导出，消息注册处改用 `BackgroundAction.SUGGEST.key`
- `src/newTab/components/SuggestPopover.tsx`：导入与发送处改用 `BackgroundAction.SUGGEST.key`，从 `@/constants` 导入

## 数据流

```
newTab 前端 → messageBus.send(BackgroundAction.BOOKMARK_GET_TREE)
    → background registerBookmarksListener → browser.bookmarks.getTree()
    → MessageResponse<BookmarkTreeNode[]>（失败返回空数组）
```

## 测试

- `getTree` 直接透传浏览器 API，无纯逻辑可测，本轮不写测试
- 与现有 `suggest.test.ts` 仅覆盖纯函数 `parseSuggestResponse` 的做法一致

## 未包含（后续版本考虑）

- 书签搜索接口（`chrome.bookmarks.search`）
- newTab 前端展示书签树/搜索结果的 UI 集成
- 书签增删改管理
