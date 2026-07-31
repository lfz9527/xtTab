import { anyObject } from '@/types'
// 消息体
export type MessageRequest<T = anyObject> = {
  action: string
  payload: T
}

// 响应体
export type MessageResponse<T = any> = {
  code: number
  data?: T
  message?: string
}

export type MessageHandler<T = anyObject> = (
  request: MessageResponse<T>,
  sender: Browser.runtime.MessageSender
) => MessageResponse | Promise<MessageResponse> | void