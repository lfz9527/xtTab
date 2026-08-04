import { FolderIcon, GlobeIcon } from 'lucide-react'

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
}

/**
 * 目录内容列表：平铺渲染当前目录的文件夹与书签，点击文件夹进入
 */
export default function BookmarkTree({
  nodes,
  onEnterFolder,
  onOpenBookmark
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
                <span className='truncate'>{node.title}</span>
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
              <GlobeIcon className='size-3.5 shrink-0 text-muted-foreground' />
              <span className='truncate'>{node.title}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
