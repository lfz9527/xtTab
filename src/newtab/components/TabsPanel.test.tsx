import { describe, expect, it } from 'vitest'
import type { Browser } from 'wxt/browser'
import { groupTabsByHost } from './TabsPanel'

const makeTab = (
  id: number,
  url: string | undefined
): Browser.tabs.Tab =>
  ({ id, url }) as Browser.tabs.Tab

describe('groupTabsByHost', () => {
  it('同域名跨窗口合并为一组', () => {
    const tabs = [
      makeTab(1, 'https://a.com/1'),
      makeTab(2, 'https://a.com/2'),
      makeTab(3, 'https://b.com/1')
    ]
    const groups = groupTabsByHost(tabs)
    expect(groups.map((g) => g.host)).toEqual(['a.com', 'b.com'])
    expect(groups[0].tabs.map((t) => t.id)).toEqual([1, 2])
  })

  it('域名组按字母升序排列', () => {
    const tabs = [
      makeTab(1, 'https://z.com/'),
      makeTab(2, 'https://a.com/'),
      makeTab(3, 'https://m.com/')
    ]
    expect(groupTabsByHost(tabs).map((g) => g.host)).toEqual([
      'a.com',
      'm.com',
      'z.com'
    ])
  })

  it('无 URL 或解析失败的 tab 归入「其他」组且排最后', () => {
    const tabs = [
      makeTab(1, 'https://a.com/'),
      makeTab(2, undefined),
      makeTab(3, 'not a url')
    ]
    const groups = groupTabsByHost(tabs)
    expect(groups.map((g) => g.host)).toEqual(['a.com', '其他'])
    expect(groups[1].tabs.map((t) => t.id)).toEqual([2, 3])
  })

  it('空数组返回空数组', () => {
    expect(groupTabsByHost([])).toEqual([])
  })
})
