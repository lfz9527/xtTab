import { FolderIcon, GlobeIcon } from 'lucide-react'
import { Fragment } from 'react'

/** 书签树节点最小字段（与 background 返回的浏览器书签结构一致） */
export interface BookmarkTreeNode {
  id: string
  title?: string
  url?: string
  children?: BookmarkTreeNode[]
  folderType?: string
}

interface BookmarkTreeProps {
  nodes: BookmarkTreeNode[]
  /** 点击文件夹进入其内部 */
  onEnterFolder: (node: BookmarkTreeNode) => void
  /** 点击书签在新标签页打开 */
  onOpenBookmark: (url: string) => void
  /** 搜索关键词（高亮匹配部分） */
  searchQuery?: string
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
 * 目录内容列表：平铺渲染当前目录的文件夹与书签，点击文件夹进入
 */
export default function BookmarkTree({
  nodes,
  onEnterFolder,
  onOpenBookmark,
  searchQuery
}: BookmarkTreeProps) {
  return (
    <ul className='flex flex-col gap-0.5'>
      {nodes.map((node) => {
        const isFolder = Array.isArray(node.children)
        if (isFolder) {
          return (
            <li key={node.id}>
              <button
                type='button'
                onClick={() => onEnterFolder(node)}
                className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted'
              >
                <FolderIcon className='size-3.5 shrink-0 text-muted-foreground' />
                <span className='truncate'>
                  <HighlightText text={node.title ?? ''} query={searchQuery} />
                </span>
              </button>
            </li>
          )
        }
        return (
          <li key={node.id}>
            <button
              type='button'
              onClick={() => node.url && onOpenBookmark(node.url)}
              className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted'
            >
              <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                <div className='flex items-center gap-1.5'>
                  <GlobeIcon className='size-3.5 shrink-0 text-muted-foreground' />
                  <span className='truncate'>
                    <HighlightText text={node.title ?? ''} query={searchQuery} />
                  </span>
                </div>
                {node.url && (
                  <span className='truncate pl-5 text-xs text-muted-foreground'>
                    <HighlightText text={node.url} query={searchQuery} />
                  </span>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
