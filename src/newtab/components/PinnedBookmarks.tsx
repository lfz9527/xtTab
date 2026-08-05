import { useEffect, useState } from 'react'
import { GlobeIcon, PinOffIcon } from 'lucide-react'
import messageBus from '@/messages/message'
import { BackgroundAction } from '@/constants'
import usePinBookmarks, {
  findBookmarksByIds
} from '@/newTab/store/usePinBookmarks'
import useSettings from '@/newTab/store/useSettings'
import { faviconUrl, safeHost } from '@/utils'
import type { BookmarkTreeNode } from './BookmarkTree'

/**
 * 主页置顶书签卡片区：置顶书签以卡片展示，无置顶时整块不渲染
 */
export default function PinnedBookmarks() {
  const { pinnedIds, togglePin } = usePinBookmarks()
  const [settings] = useSettings()
  const [bookmarks, setBookmarks] = useState<BookmarkTreeNode[]>([])

  // 无置顶书签时不拉取书签树，并清空残留卡片（取消全部置顶后整块消失）
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

  if (bookmarks.length === 0) return null

  return (
    <div className='flex w-full max-w-300 flex-wrap justify-center gap-3'>
      {bookmarks.map((bookmark) => (
        <PinnedCard
          key={bookmark.id}
          bookmark={bookmark}
          target={settings.bookmarkTarget}
          onUnpin={() => togglePin(bookmark.id)}
        />
      ))}
    </div>
  )
}

function PinnedCard({
  bookmark,
  target,
  onUnpin
}: {
  bookmark: BookmarkTreeNode
  target: 'current' | 'new'
  onUnpin: () => void
}) {
  const [iconFailed, setIconFailed] = useState(false)
  const host = bookmark.url ? safeHost(bookmark.url) : ''

  const open = () => {
    if (!bookmark.url) return
    if (target === 'current') {
      window.location.href = bookmark.url
    } else {
      window.open(bookmark.url, '_blank')
    }
  }

  return (
    <div
      title={bookmark.title}
      className='group relative flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 shadow-sm transition-colors hover:bg-muted'
    >
      <button
        type='button'
        onClick={open}
        className='flex min-w-0 items-center gap-2 text-left'
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
        <span className='max-w-40 truncate text-sm'>{bookmark.title ?? ''}</span>
      </button>
      <button
        type='button'
        onClick={onUnpin}
        aria-label='取消置顶'
        className='rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground'
      >
        <PinOffIcon className='size-3.5' />
      </button>
    </div>
  )
}
