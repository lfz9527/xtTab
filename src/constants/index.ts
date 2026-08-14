import BaseEnumCls from './base'

export class MessagingCode extends BaseEnumCls<number> {
  static readonly ERROR_CODE_NORMAL = new MessagingCode(-1, '错误码通用')
  static readonly SUCCESS_CODE_NORMAL = new MessagingCode(0, '成功码通用')
}

// background 消息 action 枚举
export class BackgroundAction extends BaseEnumCls<string> {
  static readonly SUGGEST = new BackgroundAction('suggest', '搜索联想')
  static readonly BOOKMARK_GET_TREE = new BackgroundAction(
    'bookmark-get-tree',
    '获取书签树'
  )
}

// GitLab MR 回复模板——固定单模板，修改需改代码
export const GITLAB_REPLY_TEMPLATE = '已根据评审意见修复，请再次确认。'

// GitLab 15.10 评论编辑器 DOM 选择器（GitLab 升级需重新校准）
export const GITLAB_REPLY_SELECTORS = {
  // 线程回复容器（点击「回复」后带 is-replying 态）
  replyHolder: 'li.discussion-reply-holder.is-replying',
  // 表单操作区（按钮注入锚点，位于提交按钮上方）
  actionBar: '.note-form-actions',
  // 回复表单（用于从按钮定位同表单内输入框）
  form: 'form.edit-note',
  // 回复输入框
  textarea: 'textarea.note-textarea'
} as const
