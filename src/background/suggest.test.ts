import { describe, expect, it } from 'vitest'
import { parseSuggestResponse } from './suggest'

describe('parseSuggestResponse', () => {
  it('解析 Google/Bing 标准 JSON 数组', () => {
    expect(
      parseSuggestResponse('["hello",["hello world","hello kitty"]]')
    ).toEqual(['hello world', 'hello kitty'])
  })

  it('解析百度 sugrec 标准 JSON (g[].q)', () => {
    expect(
      parseSuggestResponse(
        '{"q":"搜索","p":false,"g":[{"q":"搜索AI伙伴","type":"direct_new"},{"q":"搜索引擎平台"}]}'
      )
    ).toEqual(['搜索AI伙伴', '搜索引擎平台'])
  })

  it('g 缺失时返回空数组', () => {
    expect(parseSuggestResponse('{"q":"搜索","p":false}')).toEqual([])
  })

  it('过滤 g 中非字符串元素', () => {
    expect(
      parseSuggestResponse(
        '{"g":[{"q":"有效词"},{"q":123},null,{"type":"direct_new"}]}'
      )
    ).toEqual(['有效词'])
  })

  it('非法文本返回空数组', () => {
    expect(parseSuggestResponse('not json')).toEqual([])
  })
})
