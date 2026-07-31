// 联想消息 action
export const SUGGEST_ACTION = 'suggest'

// 引擎 suggest API 前缀（query 由调用方 encodeURIComponent 后拼接）
export const SUGGEST_APIS: Record<string, string> = {
  google: 'https://suggestqueries.google.com/complete/search?client=firefox&q=',
  baidu: 'https://suggestion.baidu.com/su?wd=',
  bing: 'https://api.bing.com/osjson.aspx?query='
}

// 无 suggest API 或请求失败/为空时的回退引擎
export const FALLBACK_ENGINE = 'baidu'

/**
 * 解析 suggest API 响应文本为联想词数组
 * 支持 Google/Bing 标准 JSON 数组 与 百度 JSONP (window.baidu.sug({...}))
 * @param text 响应文本
 * @returns 联想词数组，解析失败返回 []
 */
export function parseSuggestResponse(text: string): string[] {
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    // 百度 JSONP 形如 window.baidu.sug({...})，提取首尾括号内的 JSON
    const start = text.indexOf('(')
    const end = text.lastIndexOf(')')
    if (start === -1 || end === -1 || end <= start) return []
    try {
      json = JSON.parse(text.slice(start + 1, end))
    } catch {
      return []
    }
  }
  if (Array.isArray(json) && Array.isArray(json[1])) {
    return json[1].filter(
      (item: unknown): item is string => typeof item === 'string'
    )
  }
  if (json && Array.isArray(json.s)) {
    return json.s.filter(
      (item: unknown): item is string => typeof item === 'string'
    )
  }
  return []
}
