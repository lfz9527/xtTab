import { describe, expect, it } from 'vitest'
import { parseSuggestResponse } from './suggest'

describe('parseSuggestResponse', () => {
  it('解析 Google/Bing 标准 JSON 数组', () => {
    expect(
      parseSuggestResponse('["hello",["hello world","hello kitty"]]')
    ).toEqual(['hello world', 'hello kitty'])
  })

  it('解析百度 JSONP 格式', () => {
    expect(
      parseSuggestResponse(
        'window.baidu.sug({"q":"hello","p":false,"s":["hello world","hello kitty"]})'
      )
    ).toEqual(['hello world', 'hello kitty'])
  })

  it('非法文本返回空数组', () => {
    expect(parseSuggestResponse('not json')).toEqual([])
  })
})
