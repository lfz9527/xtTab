import { describe, expect, it } from 'vitest'
import type { BookmarkTreeNode } from '@/newTab/components/BookmarkTree'
import { findBookmarksByIds, togglePinInList } from './usePinBookmarks'

describe('togglePinInList', () => {
  it('空列表追加 id', () => {
    expect(togglePinInList([], 'a')).toEqual(['a'])
  })

  it('已置顶的 id 被移除', () => {
    expect(togglePinInList(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('未置顶的 id 追加到末尾', () => {
    expect(togglePinInList(['a'], 'b')).toEqual(['a', 'b'])
  })
})

describe('findBookmarksByIds', () => {
  const tree: BookmarkTreeNode[] = [
    {
      id: 'folder1',
      title: '文件夹',
      children: [
        { id: 'b1', title: '书签一', url: 'https://a.com' },
        { id: 'b2', title: '书签二', url: 'https://b.com' }
      ]
    },
    { id: 'b3', title: '书签三', url: 'https://c.com' }
  ]

  it('按置顶顺序返回命中的书签（忽略树中顺序）', () => {
    expect(findBookmarksByIds(tree, ['b3', 'b1']).map((n) => n.id)).toEqual([
      'b3',
      'b1'
    ])
  })

  it('跳过不在树中的失效 id', () => {
    expect(findBookmarksByIds(tree, ['b1', 'ghost']).map((n) => n.id)).toEqual([
      'b1'
    ])
  })

  it('文件夹节点（无 url）不被匹配', () => {
    expect(findBookmarksByIds(tree, ['folder1'])).toEqual([])
  })
})
