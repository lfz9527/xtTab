// 联想消息 action
export const SUGGEST_ACTION = 'suggest'

// 引擎 suggest API 前缀（query 由调用方 encodeURIComponent 后拼接）
export const SUGGEST_APIS: Record<string, string> = {
  google: 'https://suggestqueries.google.com/complete/search?client=firefox&q=',
  baidu: 'https://www.baidu.com/sugrec?prod=pc&wd=',
  bing: 'https://api.bing.com/osjson.aspx?query='
}

// 无 suggest API 或请求失败/为空时的回退引擎
export const FALLBACK_ENGINE = 'baidu'

// 联想词最大返回条数，各引擎（google/baidu/bing）统一截断
export const MAX_SUGGESTIONS = 10

/**
 * 解析 suggest API 响应文本为联想词数组
 * 支持 Google/Bing 标准 JSON 数组 与 百度 sugrec 标准 JSON (g[].q)
 * @param text 响应文本
 * @returns 联想词数组，解析失败返回 []
 */
export function parseSuggestResponse(text: string): string[] {
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    return []
  }
  if (Array.isArray(json) && Array.isArray(json[1])) {
    return json[1].filter(
      (item: unknown): item is string => typeof item === 'string'
    )
  }
  if (json && Array.isArray(json.g)) {
    return json.g
      .map((item: unknown) => (item as { q?: unknown } | null)?.q)
      .filter((item: unknown): item is string => typeof item === 'string')
  }
  return []
}
