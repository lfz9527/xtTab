import { useEffect, useState } from 'react'
import { GlobeIcon } from 'lucide-react'
import messageBus from '@/messages/message'
import { BackgroundAction } from '@/constants'
import usePinBookmarks, {
  findBookmarksByIds
} from '@/newTab/store/usePinBookmarks'
import useSettings from '@/newTab/store/useSettings'
import { faviconUrl, safeHost } from '@/utils'
import type { BookmarkTreeNode } from './BookmarkTree'

/**
 * 快捷书签视图：置顶书签紧凑列表，点击按设置打开方式跳转（无取消置顶操作）
 */
export default function QuickBookmarksView() {
  const { pinnedIds } = usePinBookmarks()
  const [settings] = useSettings()
  const [bookmarks, setBookmarks] = useState<BookmarkTreeNode[]>([])

  // 数据链路与 PinnedBookmarks 一致：按置顶 id 从书签树过滤
  useEffect(() => {
    if (pinnedIds.length === 0) {
      setBookmarks([])
      return
    }
    messageBus
      .send<undefined, BookmarkTreeNode[]>(
        BackgroundAction.BOOKMARK_GET_TREE.key
      )
      .then((res) => setBookmarks(findBookmarksByIds(res?.data ?? [], pinnedIds)))
  }, [pinnedIds])

  if (bookmarks.length === 0) {
    return <p className='py-4 text-sm text-muted-foreground'>暂无置顶书签</p>
  }

  const open = (url: string) => {
    if (settings.bookmarkTarget === 'current') {
      window.location.href = url
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <ul className='flex w-full max-w-120 flex-col gap-1'>
      {bookmarks.map((bookmark) => (
        <QuickBookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onOpen={open}
        />
      ))}
    </ul>
  )
}

function QuickBookmarkItem({
  bookmark,
  onOpen
}: {
  bookmark: BookmarkTreeNode
  onOpen: (url: string) => void
}) {
  const [iconFailed, setIconFailed] = useState(false)
  const host = bookmark.url ? safeHost(bookmark.url) : ''

  return (
    <li>
      <button
        type='button'
        onClick={() => bookmark.url && onOpen(bookmark.url)}
        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted'
      >
        {iconFailed || !host ? (
          <GlobeIcon className='size-4 shrink-0 text-muted-foreground' />
        ) : (
          <img
            src={faviconUrl(host)}
            alt=''
            className='size-4 shrink-0'
            onError={() => setIconFailed(true)}
          />
        )}
        <span className='min-w-0 flex-1 truncate'>{bookmark.title ?? ''}</span>
      </button>
    </li>
  )
}
