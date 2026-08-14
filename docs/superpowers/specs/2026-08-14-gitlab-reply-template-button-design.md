# GitLab MR 回复框模板按钮

## 需求

在 GitLab MR 页面的**讨论线程回复输入框**工具栏中注入「模板」按钮，点击后将输入框内容**整体替换**为固定模板文案「已根据评审意见修复，请再次确认。」。

## 决策记录

| 决策项 | 结论 | 来源 |
| --- | --- | --- |
| 模板内容 | 固定单模板「已根据评审意见修复，请再次确认。」 | 用户确认 |
| 作用范围 | 仅线程回复框（顶部新评论不注入） | 用户确认 |
| 注入行为 | 替换输入框全部内容 | 用户确认 |
| 模板来源 | 常量硬编码于 `src/constants/`，修改需改代码 | 用户确认 |
| 实现方案 | 方案 B：shadow UI 挂载（`createShadowRootUi`），onMount 内建 div 扩展容器 | 用户选择 |

## 实测环境

- GitLab 社区版 **15.10.8**
- 验证页面：`https://www.lejuhub.com/aelos_blockly_edu/aelos_blockly_edu/-/merge_requests/2859`
- 回复容器：`li.discussion-reply-holder.is-replying`
- 按钮注入锚点：`.note-form-actions`（表单操作区，按钮插入其上方）
- 输入框：同一 `form.edit-note` 内 `textarea.note-textarea`（线程回复框另带 `data-qa-selector="reply_field"`）
- 输入事件：`set value` + 派发 `input` 事件后「立即添加评论」按钮由灰变可用 —— 方案已验证可行

## 架构

| 文件 | 职责 |
| --- | --- |
| `src/constants/index.ts` | 新增 `GITLAB_REPLY_TEMPLATE` 文案常量与 `GITLAB_REPLY_SELECTORS` 选择器常量 |
| `src/content/gitlabReplyButton.tsx`（新增） | 按钮 React 组件：自带 div 扩展容器（`<div><button>`），经 shadow host 向上 `closest('form.edit-note')` 定位 textarea，替换内容并派发 `input` 事件 |
| `src/entries/content/gitLabReplyContent.tsx`（改造） | 编排：MutationObserver 检测回复容器内 `.note-form-actions`，`createShadowRootUi` 挂载（`position: 'inline'`, `append: 'before'`），onMount 创建 div 包裹（官方 React 模式）并渲染按钮组件，锚点打同步 `dataset` 标记去重，断链时清理 |

## 数据流

1. content script 启动 → `createGitLabReplyTemplate(ctx)` 注册 MutationObserver 监听 `document.body`
2. 检测到 `li.discussion-reply-holder.is-replying` 内 `.note-form-actions` 且未标记 → `createShadowRootUi` 在操作区上方挂载（`append: 'before'`），shadow 内渲染自带 div 容器的「文件解决模板」按钮组件
3. 点击按钮 → 经 shadow host 定位同表单内 textarea，内容替换为模板 → 派发 `input` 事件（GitLab 提交按钮激活）
4. 回复框移除 → 操作区脱离文档，编排层 `ui.remove()` 卸载并清理；再次展开的新节点重新注入

## 错误处理与边界

- 选择器未匹配：跳过本轮观察，不抛错（GitLab 版本差异容忍）
- 无回复框时按钮不存在，不污染页面；多回复框各自独立挂载
- 同一节点不重复注入（`dataset` 标记）；旧节点移除后重新出现则重新注入

## 验证方式

`pnpm dev` 加载扩展 → 打开实测 MR 页面 → 展开回复框 → 确认操作区上方出现「文件解决模板」按钮（shadow UI 内 div 容器） → 点击 → 输入框内容被替换、「立即添加评论」按钮变可用。
