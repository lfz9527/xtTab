import { anyObject } from '@/types'

export type RequestOptions = {
  /**
   * 请求api
   */
  api: string
  /**
   * 请求方法
   */
  method?: RequestInit['method']
  /**
   * 请求头
   */
  headers?: HeadersInit
  /**
   * 请求体
   */
  body?: BodyInit
  /**
   * 请求终止
   */
  abortSignal?: AbortSignal | undefined
}

export class FetchError extends Error {
  constructor(
    public code: number,
    message?: string
  ) {
    super(message)
    this.name = 'FetchError'
  }
}

class Fetch {
  setUpMethod(method: RequestOptions['method']) {
    return method?.toUpperCase() ?? 'POST'
  }
  setupHeader(headers: RequestOptions['headers']) {
    const finalHeaders = new Headers(headers)

    // 如果不设置Content-type 则设置默认值
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json')
    }
    return finalHeaders
  }
  async fetch({ abortSignal, ...options }: RequestOptions) {
    const headers = this.setupHeader(options.headers)

    const response = await fetch(options.api, {
      method: options.method,
      headers,
      body: options.body,
      signal: abortSignal
    })
    if (!response.ok) {
      throw new FetchError(
        response?.status ?? 500,
        (await response.text()) ?? 'Failed to fetch the chat response.'
      )
    }
    return response
  }
  async request(opt: RequestOptions) {
    let api = opt.api
    let body = opt.body
    let finalBody: BodyInit | undefined
    const method = this.setUpMethod(opt.method)
    if (method === 'GET' && body) {
      const params = new URLSearchParams(body as anyObject)
      api += `?${params.toString()}`
    } else {
      // 只处理正常的请求
      // @TODO 文件上传
      finalBody = body ? JSON.stringify(body) : undefined
    }
    return this.fetch({
      ...opt,
      api,
      body: finalBody
    })
  }
}

export default new Fetch()
