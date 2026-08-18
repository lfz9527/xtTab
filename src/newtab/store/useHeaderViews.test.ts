import { describe, expect, it } from 'vitest'
import { normalizeViews } from './useHeaderViews'

describe('normalizeViews', () => {
  it('合法完整排列原样返回', () => {
    expect(normalizeViews(['tabs', 'pins'])).toEqual(['tabs', 'pins'])
  })

  it('剔除非法值与重复项', () => {
    expect(normalizeViews(['tabs', 'tabs', 'ghost', 'pins'])).toEqual([
      'tabs',
      'pins'
    ])
  })

  it('缺失视图按默认顺序补全', () => {
    expect(normalizeViews(['tabs'])).toEqual(['tabs', 'pins'])
  })

  it('空数组与 undefined 返回默认顺序', () => {
    expect(normalizeViews([])).toEqual(['pins', 'tabs'])
    expect(normalizeViews(undefined)).toEqual(['pins', 'tabs'])
  })
})
