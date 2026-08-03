import { useEffect, useState } from 'react'
import { BookmarkIcon, ChevronLeftIcon } from 'lucide-react'
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
 * 书签弹窗：右上角书签按钮，点击弹出 600px 弹窗
 * 资源管理器式目录浏览：点击文件夹进入，面包屑 + 返回按钮导航
 */
export default function BookmarkDialog() {
  const [tree, setTree] = useState<BookmarkTreeNode[]>([])
  // 当前目录路径栈，[] 表示根目录
  const [path, setPath] = useState<BookmarkTreeNode[]>([])

  useEffect(() => {
    messageBus
      .send<undefined, BookmarkTreeNode[]>(BackgroundAction.BOOKMARK_GET_TREE.key)
      .then((res) => setTree(res?.data ?? []))
  }, [])

  // 当前目录内容：根目录为 tree，否则为路径栈顶文件夹的 children
  const currentNodes =
    path.length === 0 ? tree : path[path.length - 1].children ?? []

  const enterFolder = (node: BookmarkTreeNode) => {
    setPath((prev) => [...prev, node])
  }

  const goBack = () => {
    setPath((prev) => prev.slice(0, -1))
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
          <>
            <div className='flex items-center gap-1 border-b border-border pb-2'>
              {path.length > 0 && (
                <button
                  type='button'
                  onClick={goBack}
                  aria-label='返回上级'
                  className='flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  <ChevronLeftIcon className='size-4' />
                </button>
              )}
              <nav className='flex min-w-0 flex-1 items-center gap-1 text-sm text-muted-foreground'>
                <button
                  type='button'
                  onClick={() => setPath([])}
                  className='shrink-0 rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground'
                >
                  根
                </button>
                {path.map((node, index) => (
                  <span key={node.id} className='flex min-w-0 items-center gap-1'>
                    <span className='text-muted-foreground/50'>/</span>
                    <button
                      type='button'
                      onClick={() => setPath(path.slice(0, index + 1))}
                      className='truncate rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground'
                    >
                      {node.title}
                    </button>
                  </span>
                ))}
              </nav>
            </div>
            {currentNodes.length === 0 ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>
                此文件夹为空
              </p>
            ) : (
              <div className='h-150 overflow-y-auto pr-1'>
                <BookmarkTree
                  nodes={currentNodes}
                  onEnterFolder={enterFolder}
                  onOpenBookmark={(url) => window.open(url, '_blank')}
                />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
