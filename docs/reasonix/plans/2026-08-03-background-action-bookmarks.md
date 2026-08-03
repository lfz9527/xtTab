# Background Action 枚举与书签模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `BackgroundAction` 枚举统一收纳 background 消息 action，并实现书签模块首个接口 `getTree`（`browser.bookmarks.getTree` 透传）。

**Architecture:** 参考 `MessagingCode` 的 `BaseEnumCls` 模式在 `src/constants/` 新增 `BackgroundAction` 枚举（key 为消息协议值、label 为中文描述）；新建 `src/background/bookmarks.ts` 仿照 `suggest.ts` 的 `registerSuggestListener` 模式提供 `registerBookmarksListener`；迁移现有 `SUGGEST_ACTION` 常量至枚举。

**Tech Stack:** WXT 0.20, React 19, TypeScript, Vitest, `@wxt-dev/browser` 全局 `browser` API。

## Global Constraints

- 缩进 2 空格；`src/background/index.ts` 为历史 4 空格文件，改动时遵循其原风格
- 单引号、无分号、printWidth 80
- 枚举必须使用 `BaseEnumCls` 抽象类模式（非原生 `enum`）
- 消息 action 协议值使用 kebab-case 字符串
- `bookmarks` 权限已在 `wxt.config.ts` 中声明（`permissions` 含 `'bookmarks'`）
- 导入别名：`@/` 指向 `src/`

---

### Task 1: 创建 BackgroundAction 枚举

**Files:**
- Create: `src/constants/backgroundAction.ts`
- Modify: `src/constants/index.ts`

**Interfaces:**
- Produces: `BackgroundAction` 类，静态成员 `SUGGEST`（key `'suggest'`，label `'搜索联想'`）、`BOOKMARK_GET_TREE`（key `'bookmark-get-tree'`，label `'获取书签树'`）；通过 `BackgroundAction.SUGGEST.key` 取消息值。后续任务从 `@/constants` 导入。

- [ ] **Step 1: 新建 `src/constants/backgroundAction.ts`**

```ts
import BaseEnumCls from './base'

// background 消息 action 枚举
export class BackgroundAction extends BaseEnumCls<string> {
  static readonly SUGGEST = new BackgroundAction('suggest', '搜索联想')
  static readonly BOOKMARK_GET_TREE = new BackgroundAction('bookmark-get-tree', '获取书签树')
}
```

- [ ] **Step 2: 修改 `src/constants/index.ts`，re-export `BackgroundAction`**

当前内容为：

```ts
import BaseEnumCls from './base'

export class MessagingCode extends BaseEnumCls<number> {
  static readonly ERROR_CODE_NORMAL = new MessagingCode(-1, '错误码通用')
  static readonly SUCCESS_CODE_NORMAL = new MessagingCode(0, '成功码通用')
}
```

改为：

```ts
import BaseEnumCls from './base'

export class MessagingCode extends BaseEnumCls<number> {
  static readonly ERROR_CODE_NORMAL = new MessagingCode(-1, '错误码通用')
  static readonly SUCCESS_CODE_NORMAL = new MessagingCode(0, '成功码通用')
}

export { BackgroundAction } from './backgroundAction'
```

- [ ] **Step 3: 验证编译**

Run: `pnpm compile`
Expected: 退出码 0，无错误输出

- [ ] **Step 4: 提交**

```powershell
git add src/constants/backgroundAction.ts src/constants/index.ts
$msg = @'
feat: 新增 BackgroundAction 枚举统一收纳消息 action

- 参考 MessagingCode 的 BaseEnumCls 模式定义 BackgroundAction，key 为协议值、label 为中文描述
- 收纳 SUGGEST（suggest/搜索联想）与 BOOKMARK_GET_TREE（bookmark-get-tree/获取书签树）
- constants/index.ts re-export，使用方统一从 @/constants 导入
'@
git commit -m $msg
```

---

### Task 2: 迁移 SUGGEST_ACTION 至 BackgroundAction

**Files:**
- Modify: `src/background/suggest.ts`
- Modify: `src/newTab/components/SuggestPopover.tsx`

**Interfaces:**
- Consumes: `BackgroundAction`（Task 1），`BackgroundAction.SUGGEST.key === 'suggest'`
- Produces: `SUGGEST_ACTION` 常量从 `suggest.ts` 中移除，外部不再存在该导出；`suggest.ts` 仍导出 `registerSuggestListener`（签名不变）。

- [ ] **Step 1: 修改 `src/background/suggest.ts`**

删除第 6-7 行的常量定义与注释：

```ts
// 联想消息 action
export const SUGGEST_ACTION = 'suggest'
```

并在文件顶部 import 增加 `BackgroundAction`（现有 `import { MessagingCode } from '@/constants'` 改为）：

```ts
import { MessagingCode, BackgroundAction } from '@/constants'
```

将注册函数中的消息 action 替换（`MessageBus.on(SUGGEST_ACTION, async (req) => {` →）：

```ts
MessageBus.on(BackgroundAction.SUGGEST.key, async (req) => {
```

- [ ] **Step 2: 修改 `src/newTab/components/SuggestPopover.tsx`**

将第 13 行：

```ts
import { SUGGEST_ACTION } from '@/background/suggest'
```

改为：

```ts
import { BackgroundAction } from '@/constants'
```

将发送处 `messageBus.send<{ engine: string; query: string }, string[]>(SUGGEST_ACTION, ...)` 中的 `SUGGEST_ACTION` 改为：

```ts
BackgroundAction.SUGGEST.key
```

- [ ] **Step 3: 验证编译与测试**

Run: `pnpm compile; pnpm test`
Expected: 退出码 0；vitest 5 个测试全部通过

- [ ] **Step 4: 提交**

```powershell
git add src/background/suggest.ts src/newtab/components/SuggestPopover.tsx
$msg = @'
refactor: SUGGEST_ACTION 迁移至 BackgroundAction 枚举

- suggest.ts 删除 SUGGEST_ACTION 常量导出，注册处改用 BackgroundAction.SUGGEST.key
- SuggestPopover 导入与发送处同步改为 BackgroundAction.SUGGEST.key，统一从 @/constants 导入
'@
git commit -m $msg
```

---

### Task 3: 书签模块 getTree 接口

**Files:**
- Create: `src/background/bookmarks.ts`
- Modify: `src/background/index.ts`

**Interfaces:**
- Consumes: `BackgroundAction`（Task 1），`BackgroundAction.BOOKMARK_GET_TREE.key === 'bookmark-get-tree'`；`MessageBus`、`MessageResponse`、`MessagingCode`
- Produces: `registerBookmarksListener()`（无参数、无返回值），在 `index.ts` 中调用注册；`browser.bookmarks.getTree()` 结果透传。

- [ ] **Step 1: 新建 `src/background/bookmarks.ts`**

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

- [ ] **Step 2: 修改 `src/background/index.ts` 注册模块**

现有头部 import（保持 4 空格原风格）：

```ts
import { registerSuggestListener } from '@/background/suggest'
```

在其后新增：

```ts
import { registerBookmarksListener } from '@/background/bookmarks'
```

在 `defineBackground` 回调内 `registerSuggestListener()` 之后新增一行（保持 4 空格缩进）：

```ts
    registerBookmarksListener()
```

- [ ] **Step 3: 验证编译与测试**

Run: `pnpm compile; pnpm test`
Expected: 退出码 0；vitest 5 个测试全部通过

- [ ] **Step 4: 提交**

```powershell
git add src/background/bookmarks.ts src/background/index.ts
$msg = @'
feat: 新增书签模块 getTree 接口

- bookmarks.ts 提供 getBookmarksTree（browser.bookmarks.getTree 透传，返回根节点 children）
- registerBookmarksListener 注册 BOOKMARK_GET_TREE 消息监听，异常兜底返回空数组
- index.ts 启动时注册书签模块监听
'@
git commit -m $msg
```
