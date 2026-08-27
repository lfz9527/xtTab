import { MessageHandler, MessageRequest, MessageResponse } from './types'
import { MessagingCode } from '@/constants'

export class Content {
  private static instance: Content
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private isListenerRegistered = false
  private constructor() {}
  public static getInstance(): Content {
    if (!Content.instance) {
      Content.instance = new Content()
    }
    return Content.instance
  }
  // 注册content 事件监听器
  registerListener() {
    if (this.isListenerRegistered) return
    this.isListenerRegistered = true
    browser.runtime.onMessage.addListener(
      (request: MessageRequest, sender, sendResponse) => {
        const action = request.action

        if (!action) {
          sendResponse({
            code: MessagingCode.ERROR_CODE_NORMAL.key,
            message: '消息 action 未定义'
          })
          return true
        }

        const handlers = this.handlers.get(action)

        if (!handlers || handlers.size === 0) {
          console.error(`content 未注册 action: ${action}`)
          sendResponse({
            code: MessagingCode.ERROR_CODE_NORMAL.key,
            message: `未注册 action: ${action}`
          })
          return true
        }
        // 立即返回 sendResponse，异步 handler 自行处理
        sendResponse({ code: MessagingCode.SUCCESS_CODE_NORMAL.key })

        const response = request.payload as MessageResponse

        handlers.forEach(async (handler) => {
          try {
            handler(response, sender)
          } catch (err: any) {
            console.error(
              `[Content Messages] handler 错误 action=${action}:`,
              err
            )
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
  public async send<T = Record<string, any>, R = any>(
    action: string,
    payload?: T
  ): Promise<MessageResponse<R>> {
    try {
      const data = {
        code: 0,
        data: payload,
        message: ''
      }
      const response = await browser.runtime.sendMessage({
        action,
        payload: data
      })
      return response
    } catch (err: any) {
      return {
        code: MessagingCode.ERROR_CODE_NORMAL.key,
        message: err?.message || 'contentBus sendMessage error'
      }
    }
  }
}
const contentMessages = Content.getInstance()
export default contentMessages
