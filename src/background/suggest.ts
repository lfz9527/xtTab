import MessageBus from '@/messages/message'
import { type MessageResponse } from '@/messages/types'
import { MessagingCode, BackgroundAction } from '@/constants'
import { type anyObject } from '@/types'

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

// 请求 suggest API 并解析联想词；失败时抛错交由调用方回退
async function fetchSuggestions(
  engine: string,
  query: string
): Promise<string[]> {
  const api = SUGGEST_APIS[engine] ?? SUGGEST_APIS[FALLBACK_ENGINE]
  const res = await fetch(api + encodeURIComponent(query))
  if (!res.ok) throw new Error(`suggest request failed: ${res.status}`)
  // 统一截断为前 MAX_SUGGESTIONS 条，bing 等引擎返回条数多于其他引擎
  return parseSuggestResponse(await res.text()).slice(0, MAX_SUGGESTIONS)
}

// 请求 suggest API，失败返回空数组（由调用方决定是否回退）
async function tryFetchSuggestions(
  engine: string,
  query: string
): Promise<string[]> {
  try {
    return await fetchSuggestions(engine, query)
  } catch {
    return []
  }
}

// 注册 suggest 联想消息监听：主引擎失败/为空时回退 FALLBACK_ENGINE，仍失败则返回空列表
export function registerSuggestListener() {
  MessageBus.on(BackgroundAction.SUGGEST.key, async (req) => {
    const { engine, query } = (req as anyObject) ?? {}
    if (typeof query !== 'string' || !query.trim()) {
      return {
        code: MessagingCode.SUCCESS_CODE_NORMAL.key,
        data: []
      } satisfies MessageResponse<string[]>
    }
    // 主引擎失败/为空 → 回退百度；百度也失败 → 空列表，前端不展示下拉
    let suggestions = await tryFetchSuggestions(engine, query)
    if (suggestions.length === 0) {
      suggestions = await tryFetchSuggestions(FALLBACK_ENGINE, query)
    }
    return {
      code: MessagingCode.SUCCESS_CODE_NORMAL.key,
      data: suggestions
    } satisfies MessageResponse<string[]>
  })
}
