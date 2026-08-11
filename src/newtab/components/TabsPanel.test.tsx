import { describe, expect, it } from 'vitest'
import type { Browser } from 'wxt/browser'
import { groupTabsByWindow } from './TabsPanel'

const makeTab = (id: number, windowId: number): Browser.tabs.Tab =>
  ({ id, windowId }) as Browser.tabs.Tab

describe('groupTabsByWindow', () => {
  it('按 windowId 升序分组，组内保持原顺序', () => {
    const tabs = [makeTab(1, 2), makeTab(2, 1), makeTab(3, 2)]
    const groups = groupTabsByWindow(tabs)
    expect(groups.map((g) => g.map((t) => t.id))).toEqual([[2], [1, 3]])
  })

  it('空数组返回空数组', () => {
    expect(groupTabsByWindow([])).toEqual([])
  })
})
