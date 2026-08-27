import { describe, expect, it } from 'vitest'
import { parseChangelog } from './changelog'

describe('parseChangelog', () => {
  it('解析版本、分类与条目结构', () => {
    const md = [
      '# 版本日志',
      '',
      '## v1.2.0',
      '',
      '### 常用入口',
      '',
      '- 新增新标签页底部常用网站入口栏',
      '- 支持在设置中管理常用入口',
      '',
      '### 其他',
      '',
      '- 修复顶部导航栏视图切换问题',
      '',
      '## v1.1.0',
      '',
      '### 搜索',
      '',
      '- 新标签页搜索主页'
    ].join('\n')
    expect(parseChangelog(md)).toEqual([
      {
        version: 'v1.2.0',
        categories: [
          {
            name: '常用入口',
            items: [
              '新增新标签页底部常用网站入口栏',
              '支持在设置中管理常用入口'
            ]
          },
          { name: '其他', items: ['修复顶部导航栏视图切换问题'] }
        ]
      },
      {
        version: 'v1.1.0',
        categories: [{ name: '搜索', items: ['新标签页搜索主页'] }]
      }
    ])
  })

  it('忽略标题与空行', () => {
    const md = '# 版本日志\n\n## v1.0.0\n\n### 设置\n\n- 设置弹窗\n\n'
    expect(parseChangelog(md)).toEqual([
      { version: 'v1.0.0', categories: [{ name: '设置', items: ['设置弹窗'] }] }
    ])
  })

  it('空内容返回空数组', () => {
    expect(parseChangelog('')).toEqual([])
  })
})
