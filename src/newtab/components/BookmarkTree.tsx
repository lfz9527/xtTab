import { ChevronRightIcon, FolderIcon, GlobeIcon } from 'lucide-react'

/** 书签树节点最小字段（与 background 返回的浏览器书签结构一致） */
export interface BookmarkTreeNode {
  id: string
  title?: string
  url?: string
  children?: BookmarkTreeNode[]
}

interface BookmarkTreeProps {
  nodes: BookmarkTreeNode[]
  /** 已展开的文件夹 id 集合 */
  expanded: Set<string>
  /** 切换文件夹展开状态 */
  onToggle: (id: string) => void
}

/**
 * 书签树递归渲染：文件夹节点可展开/折叠，书签节点点击在新标签页打开
 */
export default function BookmarkTree({
  nodes,
  expanded,
  onToggle
}: BookmarkTreeProps) {
  return (
    <ul className='flex flex-col gap-0.5'>
      {nodes.map((node) => {
        const isFolder = Array.isArray(node.children)
        const isExpanded = expanded.has(node.id)
        if (isFolder) {
          return (
            <li key={node.id}>
              <button
                type='button'
                onClick={() => onToggle(node.id)}
                className='flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted'
              >
                <ChevronRightIcon
                  className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
                <FolderIcon className='size-3.5 shrink-0 text-muted-foreground' />
                <span className='truncate'>{node.title}</span>
              </button>
              {isExpanded && node.children && (
                <div className='ml-4 border-l border-border pl-2'>
                  <BookmarkTree
                    nodes={node.children}
                    expanded={expanded}
                    onToggle={onToggle}
                  />
                </div>
              )}
            </li>
          )
        }
        return (
          <li key={node.id}>
            <button
              type='button'
              onClick={() => node.url && window.open(node.url, '_blank')}
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
