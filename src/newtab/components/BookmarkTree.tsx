import { FolderIcon, GlobeIcon, PinIcon } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref
} from 'react'
import { faviconUrl, safeHost } from '@/utils'
import { useThrottleFn } from '@/hooks/useThrottledFn'

/** 书签树节点最小字段（与 background 返回的浏览器书签结构一致） */
export interface BookmarkTreeNode {
  id: string
  title?: string
  url?: string
  children?: BookmarkTreeNode[]
  folderType?: string
}

/** 键盘导航句柄：方向键切换高亮、回车激活；返回 true 表示事件已被消费 */
export interface BookmarkTreeHandle {
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => boolean
}

interface BookmarkTreeProps {
  nodes: BookmarkTreeNode[]
  /** 点击文件夹进入其内部 */
  onEnterFolder: (node: BookmarkTreeNode) => void
  /** 点击书签在新标签页打开 */
  onOpenBookmark: (url: string) => void
  /** 搜索关键词（高亮匹配部分） */
  searchQuery?: string
  /** 已置顶书签 id 集合 */
  pinnedIds: Set<string>
  /** 切换书签置顶状态 */
  onTogglePin: (id: string) => void
  ref?: Ref<BookmarkTreeHandle>
}

/** 将文本按搜索关键词分割，匹配部分高亮 */
function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>
  const q = query.trim()
  const lower = text.toLowerCase()
  const lowerQ = q.toLowerCase()
  const parts: { text: string; match: boolean }[] = []
  let lastIndex = 0
  let index = lower.indexOf(lowerQ)
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), match: false })
    }
    parts.push({ text: text.slice(index, index + q.length), match: true })
    lastIndex = index + q.length
    index = lower.indexOf(lowerQ, lastIndex)
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), match: false })
  }
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part.match ? (
            <mark className='rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-600/40'>
              {part.text}
            </mark>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </>
  )
}

/**
 * 书签站点图标：用 faviconUrl 加载站点图标，加载失败或域名解析失败兜底 GlobeIcon
 */
function BookmarkFavicon({ url }: { url?: string }) {
  const [iconFailed, setIconFailed] = useState(false)
  const host = url ? safeHost(url) : ''
  if (iconFailed || !host) {
    return <GlobeIcon className='size-4.5 shrink-0 text-muted-foreground' />
  }
  return (
    <img
      src={faviconUrl(host)}
      alt=''
      className='size-4.5 shrink-0'
      onError={() => setIconFailed(true)}
    />
  )
}

/**
 * 目录内容列表：平铺渲染当前目录的文件夹与书签，点击文件夹进入
 */
export default function BookmarkTree({
  nodes,
  onEnterFolder,
  onOpenBookmark,
  searchQuery,
  pinnedIds,
  onTogglePin,
  ref
}: BookmarkTreeProps) {
  // 键盘导航高亮索引，-1 表示无高亮；nodes 变化时重置
  const [activeIndex, setActiveIndex] = useState(-1)
  // 高亮项 DOM 引用，用于滚动跟随
  const activeItemRef = useRef<HTMLLIElement | null>(null)

  // 进入/返回目录、搜索词变化导致列表刷新时重置高亮
  useEffect(() => {
    setActiveIndex(-1)
  }, [nodes])

  // 高亮项变化时滚动到可视区
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // 节流方向键切换：长按 key repeat（~30ms/次）时限制切换频率，避免高亮闪烁不可见
  const throttledMove = useThrottleFn((direction: -1 | 1) => {
    setActiveIndex((i) => {
      if (direction > 0) return (i + 1) % nodes.length
      return i <= 0 ? nodes.length - 1 : i - 1
    })
  }, { wait: 180, trailing: false })

  // 方向键切换高亮、回车激活高亮项（文件夹进入 / 书签打开）；返回 true 表示事件已被消费
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (nodes.length === 0) return false
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      throttledMove(1)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      throttledMove(-1)
      return true
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      const node = nodes[activeIndex]
      e.preventDefault()
      if (Array.isArray(node.children)) onEnterFolder(node)
      else if (node.url) onOpenBookmark(node.url)
      return true
    }
    return false
  }

  useImperativeHandle(ref, () => ({ handleKeyDown }))

  return (
    <ul className='flex flex-col gap-0.5'>
      {nodes.map((node, index) => {
        const isActive = index === activeIndex
        const isFolder = Array.isArray(node.children)
        if (isFolder) {
          return (
            <li key={node.id} ref={isActive ? activeItemRef : undefined}>
              <button
                type='button'
                onClick={() => onEnterFolder(node)}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted ${isActive ? 'bg-muted' : ''}`}
              >
                <FolderIcon className='size-3.5 shrink-0 text-muted-foreground' />
                <span className='truncate'>
                  <HighlightText text={node.title ?? ''} query={searchQuery} />
                </span>
              </button>
            </li>
          )
        }
        const isPinned = pinnedIds.has(node.id)
        return (
          <li key={node.id} ref={isActive ? activeItemRef : undefined}>
            <div className={`group flex w-full items-center rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted ${isActive ? 'bg-muted' : ''}`}>
              <button
                type='button'
                onClick={() => node.url && onOpenBookmark(node.url)}
                className='flex min-w-0 flex-1 items-center gap-1.5 text-left'
              >
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <div className='flex items-center gap-1.5'>
                    <BookmarkFavicon url={node.url} />
                    <span className='truncate'>
                      <HighlightText text={node.title ?? ''} query={searchQuery} />
                    </span>
                  </div>
                  {node.url && (
                    <span className='truncate pl-6 text-xs text-muted-foreground'>
                      <HighlightText text={node.url} query={searchQuery} />
                    </span>
                  )}
                </div>
              </button>
              <button
                type='button'
                onClick={() => onTogglePin(node.id)}
                aria-label={isPinned ? '取消置顶' : '置顶'}
                className={`shrink-0 rounded-md p-1 transition-opacity ${isPinned ? 'text-foreground' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground'}`}
              >
                <PinIcon className={`size-3.5 ${isPinned ? 'fill-foreground' : ''}`} />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
