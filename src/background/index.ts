import uid from "tiny-uid"
import MessageBus from '@/messages/message'
import { FALLBACK_ENGINE, SUGGEST_ACTION, SUGGEST_APIS, parseSuggestResponse } from '@/constants/suggest'
import { type MessageResponse } from '@/messages/types'
import { MessagingCode } from '@/constants'
import { type anyObject } from '@/types'

export default defineBackground(() => {
    MessageBus.registerListener()
    // 左键点击图标 (如果有 popup 是不会触发的，可以执行 browser.action.setPopup({ popup: '' }) 来监听事件)
    browser.action.setPopup({ popup: '' })

    // 监听插件图标点击事件
    browser.action.onClicked.addListener(async (tab) => {
        browser.sidePanel.open({ windowId: tab.windowId })
    })
})


browser.tabs.onActivated.addListener((activeInfo) => {
    console.log('监听标签页激活事件')
})

browser.runtime.onInstalled.addListener(() => {
    console.log('监听插件安装状态')
})

MessageBus.on('content_bg', () => {
    console.log('content_bg', uid())
})

// 请求 suggest API 并解析联想词；失败时抛错交由调用方回退
async function fetchSuggestions(engine: string, query: string): Promise<string[]> {
  const api = SUGGEST_APIS[engine] ?? SUGGEST_APIS[FALLBACK_ENGINE]
  const res = await fetch(api + encodeURIComponent(query))
  if (!res.ok) throw new Error(`suggest request failed: ${res.status}`)
  return parseSuggestResponse(await res.text())
}

MessageBus.on(SUGGEST_ACTION, async (req) => {
  const { engine, query } = (req as anyObject) ?? {}
  if (typeof query !== 'string' || !query.trim()) {
    return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: [] } satisfies MessageResponse<string[]>
  }
  try {
    const suggestions = await fetchSuggestions(engine, query)
    if (suggestions.length > 0) {
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: suggestions } satisfies MessageResponse<string[]>
    }
    // 空结果 → 回退百度
    const fallback = await fetchSuggestions(FALLBACK_ENGINE, query)
    return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: fallback } satisfies MessageResponse<string[]>
  } catch {
    try {
      const fallback = await fetchSuggestions(FALLBACK_ENGINE, query)
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: fallback } satisfies MessageResponse<string[]>
    } catch {
      // 兜底：suggest 服务不可用时返回空列表，前端不展示下拉
      return { code: MessagingCode.SUCCESS_CODE_NORMAL.key, data: [] } satisfies MessageResponse<string[]>
    }
  }
})