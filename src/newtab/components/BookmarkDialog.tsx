import { useEffect, useState } from 'react'
import { BookmarkIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import messageBus from '@/messages/message'
import { BackgroundAction } from '@/constants'
import BookmarkTree, { type BookmarkTreeNode } from './BookmarkTree'

/**
 * 书签弹窗：右上角书签按钮，点击弹出 600px 弹窗展示书签树
 * 数据经 background BOOKMARK_GET_TREE 消息接口获取
 */
export default function BookmarkDialog() {
  const [tree, setTree] = useState<BookmarkTreeNode[]>([])
  // 展开的文件夹 id 集合，默认全部折叠
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    messageBus
      .send<undefined, BookmarkTreeNode[]>(BackgroundAction.BOOKMARK_GET_TREE.key)
      .then((res) => setTree(res?.data ?? []))
  }, [])

  const toggleFolder = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <Dialog modal>
      <DialogTrigger
        aria-label='书签'
        className='fixed right-14 top-2 z-40 flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      >
        <BookmarkIcon className='size-5' />
      </DialogTrigger>
      <DialogContent
        aria-label='书签'
        showCloseButton={false}
        className='max-w-150 sm:max-w-150'
      >
        <DialogTitle>书签</DialogTitle>
        {tree.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            暂无书签
          </p>
        ) : (
          <div className='h-150 overflow-y-auto pr-1'>
            <BookmarkTree
              nodes={tree}
              expanded={expanded}
              onToggle={toggleFolder}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
