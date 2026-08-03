import MessageBus from '@/messages/message'
import { type MessageResponse } from '@/messages/types'
import { MessagingCode, BackgroundAction } from '@/constants'

// 获取完整书签树（含文件夹层级）；返回类型由 WXT 全局 browser API 推断
async function getBookmarksTree() {
  const [root] = await browser.bookmarks.getTree()
  return root?.children ?? []
}

// 书签树返回类型（由 getBookmarksTree 推导，避免手动导入浏览器类型）
type BookmarksTree = Awaited<ReturnType<typeof getBookmarksTree>>

// 注册书签消息监听：异常兜底返回空数组
export function registerBookmarksListener() {
  MessageBus.on(BackgroundAction.BOOKMARK_GET_TREE.key, async () => {
    try {
      const tree = await getBookmarksTree()
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: tree } satisfies MessageResponse<BookmarksTree>
    } catch {
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: [] } satisfies MessageResponse<BookmarksTree>
    }
  })
}
