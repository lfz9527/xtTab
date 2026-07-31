import { MessageResponse, MessageHandler, MessageRequest } from './types'
import { MessagingCode } from '@/constants'

class MessageBus {
  private static instance: MessageBus
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  // 单次调用
  private onceHandlers: Map<string, Set<MessageHandler>> = new Map()
  private isListenerRegistered = false

  // 私有构造函数，防止实例化
  private constructor() { }

  // 获取单例
  public static getInstance(): MessageBus {
    if (!MessageBus.instance) {
      MessageBus.instance = new MessageBus()
    }
    return MessageBus.instance
  }
  // 注册全局监听器
  public registerListener() {
    if (this.isListenerRegistered) return
    this.isListenerRegistered = true

    browser.runtime.onMessage.addListener(
      (request: MessageRequest, sender, sendResponse) => {
        const action = request.action
        if (!action) {
          sendResponse({ code: MessagingCode.ERROR_CODE_NORMAL.key, message: '消息 action 未定义' })
          return true
        }
        const handlers = this.handlers.get(action)
        const onceHandlers = this.onceHandlers.get(action)

        if ((!handlers || handlers.size === 0) && (!onceHandlers || onceHandlers.size === 0)) {
          sendResponse({ code: MessagingCode.ERROR_CODE_NORMAL.key, message: `未注册 handler: ${action}` })
          return true
        }

        const response = request.payload as MessageResponse
        const allHandlers = [...(handlers || []), ...(onceHandlers || [])]

        // 等待所有 handler 的返回结果，取第一个含 code 字段的响应回传
        // allSettled：handler Promise 被 reject 时不阻塞 sendResponse，避免调用方挂起
        Promise.allSettled(
          allHandlers.map((handler) => {
            try {
              return handler(response, sender)
            } catch (err: any) {
              console.error(`[MessageBus] handler 错误 action=${action}:`, err)
              return undefined
            }
          })
        ).then((results) => {
          const handled = results
            .filter(
              (r): r is PromiseFulfilledResult<MessageResponse | void> =>
                r.status === 'fulfilled'
            )
            .map((r) => r.value)
            .find(
              (r): r is MessageResponse =>
                !!r && typeof r === 'object' && 'code' in r
            )
          sendResponse(handled ?? { code: MessagingCode.ERROR_CODE_NORMAL.key })
          // 执行完 onceHandlers 后清理掉
          if (onceHandlers && onceHandlers.size > 0) {
            this.onceHandlers.delete(action)
          }
        })
        // 始终返回 true，以支持异步响应
        return true
      }
    )
  }

  /** 注册事件监听（subscribe） */
  public on(action: string, handler: MessageHandler) {
    if (!this.handlers.has(action)) this.handlers.set(action, new Set())
    this.handlers.get(action)!.add(handler)
    return () => {
      this.off(action, handler)
    }
  }

  /** 移除事件监听（unsubscribe） */
  public off(action: string, handler: MessageHandler) {
    this.handlers.get(action)?.delete(handler)
  }

  /** 手动分发消息给订阅者 */
  public dispatch(action: string, msg: any, sender?: Browser.runtime.MessageSender) {
    const handlers = this.handlers.get(action)
    if (!handlers) return
    handlers.forEach(async (handler) => {
      try {
        await handler(msg, sender!)
      } catch (err) {
        console.error(`[MessageBus] dispatch handler 错误 type=${action}:`, err)
      }
    })
  }
  public async send<T = any, R = any>(
    action: string,
    payload?: T
  ): Promise<MessageResponse<R>> {
    try {
      const response = await browser.runtime.sendMessage({ action, payload })
      return response
    } catch (err: any) {
      return { code: -1, message: err?.message || 'sendMessage error' }
    }
  }

  /** 注册一次性监听（once） */
  public once(action: string, handler: MessageHandler) {
    if (!this.onceHandlers.has(action)) this.onceHandlers.set(action, new Set())
    this.onceHandlers.get(action)!.add(handler)
  }

  public async sendToTab(
    action: string,
    payload?: Record<string, any>,
    current: boolean = true,
  ): Promise<{ success: MessageResponse[]; failed: any[] }> {
    return new Promise(async (resolve, reject) => {
      let isResolved = false

      const data = {
        code: 0,
        data: payload,
        message: ''
      }

      try {

        if (current) {
          const currentTabs = await browser.tabs.query({
            active: true,
            currentWindow: true
          })
          const currentTab = currentTabs?.[0]
          if (currentTab?.id) {
            try {
              const res = await browser.tabs.sendMessage(currentTab?.id, {
                action,
                payload: data
              })
              return resolve({ success: [res], failed: [] })
            } catch (error: any) {
              console.error('browser.tabs.sendMessage__error', error)
              reject?.([{
                code: MessagingCode.ERROR_CODE_NORMAL.key,
                message: error.message || 'browser.tabs.sendMessage__error'
              }])
            } finally {
              isResolved = true
            }
          }
          return resolve({ success: [], failed: ['当前没有可用的 tab'] })
        }

        const allTabs = await browser.tabs.query({ currentWindow: true })
        const filteredTabs = allTabs.filter((tab) => tab?.id)

        const results = await Promise.allSettled(
          filteredTabs.map((tab) =>
            browser.tabs.sendMessage(tab.id!, {
              action,
              payload: data
            })
          )
        )

        results.forEach((r, i) => {
          const tab = filteredTabs[i]
          if (r.status !== 'fulfilled') {
            console.log('失败的tab===>', tab.url)
            console.error(`Tab ${tab.id} 失败:`, r.reason, r.reason?.message)
          }
        })

        const success = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value)
        const failed = results
          .filter(r => r.status === 'rejected')
          .map(r => (r as PromiseRejectedResult).reason)

        console.log('成功结果:', success)
        console.log('失败结果:', failed)
        return resolve({ success, failed })
      } catch (error) {
        reject(error)
      }

    })
  }

}

const messageBus = MessageBus.getInstance()
export default messageBus