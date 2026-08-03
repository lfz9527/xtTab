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
