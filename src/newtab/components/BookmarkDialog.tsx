import { useEffect, useMemo, useState } from 'react'
import { BookmarkIcon, ChevronLeftIcon, SearchIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import messageBus from '@/messages/message'
import { BackgroundAction } from '@/constants'
import { useComposing } from '@/hooks/useComposing'
import useSettings from '@/newTab/store/useSettings'
import BookmarkTree, { type BookmarkTreeNode } from './BookmarkTree'

/**
 * 书签弹窗：右上角书签按钮，点击弹出 600px 弹窗
 * 资源管理器式目录浏览：点击文件夹进入，面包屑 + 返回按钮导航
 */
export default function BookmarkDialog() {
  const [tree, setTree] = useState<BookmarkTreeNode[]>([])
  // 当前目录路径栈，[] 表示根目录
  const [path, setPath] = useState<BookmarkTreeNode[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const composing = useComposing()
  const [settings] = useSettings()

  useEffect(() => {
    messageBus
      .send<undefined, BookmarkTreeNode[]>(BackgroundAction.BOOKMARK_GET_TREE.key)
      .then((res) => {
        const raw = res?.data ?? []
        // folderType 为 bookmarks-bar 的节点不展示，直接展示其二级数据
        const flattened = raw.flatMap((node) =>
          node.folderType === 'bookmarks-bar'
            ? node.children ?? []
            : [node]
        )
        setTree(flattened)
      })
  }, [])

  // 递归搜索书签（按标题和 URL 匹配）
  const searchBookmarks = (
    nodes: BookmarkTreeNode[],
    query: string
  ): BookmarkTreeNode[] => {
    const q = query.toLowerCase()
    const result: BookmarkTreeNode[] = []
    for (const node of nodes) {
      const titleMatch = node.title?.toLowerCase().includes(q)
      const urlMatch = node.url?.toLowerCase().includes(q)
      if (titleMatch || urlMatch) {
        result.push(node)
      }
      if (node.children) {
        result.push(...searchBookmarks(node.children, q))
      }
    }
    return result
  }

  const isSearching = !composing && searchQuery.trim().length > 0

  const searchResults = useMemo(
    () => (isSearching ? searchBookmarks(tree, searchQuery) : []),
    [tree, searchQuery, isSearching]
  )

  // 当前目录内容：搜索模式且有路径时显示文件夹内容，否则搜索模式显示搜索结果，否则根目录为 tree，否则为路径栈顶文件夹的 children
  const currentNodes = isSearching
    ? path.length === 0
      ? searchResults
      : path[path.length - 1].children ?? []
    : path.length === 0
      ? tree
      : path[path.length - 1].children ?? []

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
        initialFocus={false}
        className='max-w-175 sm:max-w-175'
      >
        <DialogTitle>书签</DialogTitle>
        <div className='min-w-0'>
        {/* 返回按钮 + 页眉面包屑 + 搜索框 */}
        <div className='flex items-center gap-2 pb-2'>
          {path.length > 0 && (
            <button
              type='button'
              onClick={goBack}
              aria-label='返回上级'
              className='flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <ChevronLeftIcon className='size-4' />
            </button>
          )}
          <Breadcrumb className='min-w-0 flex-1'>
            <BreadcrumbList>
              {isSearching && (
                <BreadcrumbItem>
                  <BreadcrumbPage className='truncate'>
                    &quot;搜索&quot;
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
              {isSearching && path.map((node, index) => (
                <BreadcrumbItem key={node.id}>
                  <BreadcrumbSeparator />
                  {index === path.length - 1 ? (
                    <BreadcrumbPage className='truncate'>
                      {node.title}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={
                        <button
                          type='button'
                          onClick={() => setPath(path.slice(0, index + 1))}
                        />
                      }
                      className='truncate'
                    >
                      {node.title}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              ))}
              {!isSearching && path.map((node, index) => (
                <BreadcrumbItem key={node.id}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {index === path.length - 1 ? (
                    <BreadcrumbPage className='truncate'>
                      {node.title}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={
                        <button
                          type='button'
                          onClick={() => setPath(path.slice(0, index + 1))}
                        />
                      }
                      className='truncate'
                    >
                      {node.title}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className='relative w-50 shrink-0'>
            <SearchIcon className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='搜索书签...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value.trim()) setPath([])
              }}
              className='pl-8'
              autoFocus={false}
            />
          </div>
        </div>
        {tree.length === 0 ? (
          <p className='flex h-100 items-center justify-center text-sm text-muted-foreground'>
            暂无书签
          </p>
        ) : (
          <>
            {currentNodes.length === 0 ? (
              <p className='flex h-100 items-center justify-center text-sm text-muted-foreground'>
                {isSearching ? '未找到匹配的书签' : '此文件夹为空'}
              </p>
            ) : (
              <div className='scrollbar-thin h-100 overflow-y-auto pr-1'>
                <BookmarkTree
                  nodes={currentNodes}
                  onEnterFolder={enterFolder}
                  onOpenBookmark={(url) =>
                    settings.bookmarkTarget === 'current'
                      ? (window.location.href = url)
                      : window.open(url, '_blank')
                  }
                  searchQuery={isSearching ? searchQuery : undefined}
                />
              </div>
            )}
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
