import Fetch, { FetchError, type RequestOptions } from './fetch'
import { anyObject, Response } from '@/types'
import uid from 'tiny-uid'

type ErrorCallback = {
  onError: (data: Response) => {}
  // 认证权限校验错误回调
  onAuthorized: (data: Response) => {}
}

const errorMessage = (code: number) => {
  switch (code) {
    case 408:
      return '请求超时,请稍后重试'
    case 500:
      return '服务器内部错误'
    default:
      return `网络异常,请稍后重试`
  }
}

type RequestOpt = Omit<RequestOptions, 'abortSignal'> & {
  abortSignal?: AbortController
  requestKey?: string
  timeout?: number
}

class Services {
  private fetch = Fetch.request
  private timeout = 5000

  private abortControllers: Map<string, AbortController> = new Map()

  /**
   * 错误处理
   * @param error 错误
   * @param errorCallback 针对性的错误回调
   */
  errorHandler(errorData: Response, errorCallback?: ErrorCallback) {
    console.log('错误回调函数的捕获')
    switch (errorData?.code) {
      case 10402: // 未授权,未登录
        errorCallback?.onAuthorized?.(errorData)
        break
      default:
        errorCallback?.onError?.(errorData)
        break
    }
  }

  /**
   * 取消某个请求
   * @param key 请求唯一标识
   * @param message 取消原因
   * @returns 是否成功取消
   */
  cancelRequest(key: string, message?: string) {
    const controller = this.abortControllers.get(key)
    if (controller) {
      controller.abort(message || `取消请求: ${String(key)}`)
      this.abortControllers.delete(key)
      return true
    }
    return false
  }

  /**
   * 初始化终止请求控制
   * @param opt
   * @returns
   */
  private setupCancelController(opt: RequestOpt) {
    const key = opt.requestKey ?? uid()
    const controller = opt.abortSignal ?? new AbortController()

    this.abortControllers.set(key, controller)
    return {
      key,
      abortSignal: controller.signal
    }
  }

  /**
   * 初始化超时
   * @param key
   * @param opt
   * @returns
   */
  private setupTimeout(opt: RequestOpt, fn: VoidFunction) {
    const timeout = opt.timeout ?? this.timeout
    if (!!timeout && timeout > 0) {
      return setTimeout(() => fn(), timeout)
    }
    return null
  }

  async http<T = anyObject>(opt: RequestOpt, errorCallback?: ErrorCallback) {
    const { key, abortSignal } = this.setupCancelController(opt)
    let isTimeout = false
    const timer = this.setupTimeout(opt, () => {
      isTimeout = true
      this.cancelRequest(key, '接口请求超时')
    })
    try {
      const response = await this.fetch({ ...opt, abortSignal })
      const result: Response<T> = await response.json()

      if (result.code !== 10000) {
        const message = result.message ?? errorMessage(0)
        // 业务错误
        this.errorHandler({ ...result, message }, errorCallback)
        throw new Error(message)
      }
      return result.data ?? {}
    } catch (error) {
      // 处理请求系统错误回调
      if (error instanceof FetchError) {
        this.errorHandler({ ...error }, errorCallback)
      }
      // 前端接口请求超时处理, 过期时间,前端决定
      if (isTimeout && this.abortControllers.get(key)) {
        this.errorHandler(
          { code: 408, message: errorMessage(408) },
          errorCallback
        )
      }

      throw error
    } finally {
      timer && clearTimeout(timer)
    }
  }
  async get(opt: Omit<RequestOpt, 'method'>, errorCallback?: ErrorCallback) {
    return this.http({ ...opt, method: 'GET' }, errorCallback)
  }
  async post(opt: Omit<RequestOpt, 'method'>, errorCallback?: ErrorCallback) {
    return this.http({ ...opt, method: 'POST' }, errorCallback)
  }
  // 流式响应请求,直接返回请求体,供业务进行读流
  async httpSSE(opt: RequestOpt, errorCallback?: ErrorCallback) {
    const { key, abortSignal } = this.setupCancelController(opt)
    let isTimeout = false
    const timer = this.setupTimeout(opt, () => {
      isTimeout = true
      this.cancelRequest(key, '接口请求超时')
    })
    try {
      const response = await this.fetch({
        ...opt,
        method: 'POST',
        abortSignal
      })
      if (!response.body) {
        throw new FetchError(
          response.status ?? 500,
          'The response body is empty.'
        )
      }
      return response.body
    } catch (error) {
      if (error instanceof FetchError) {
        this.errorHandler({ ...error }, errorCallback)
      }
      // 前端接口请求超时处理, 过期时间,前端决定
      if (isTimeout && this.abortControllers.get(key)) {
        this.errorHandler(
          { code: 408, message: errorMessage(408) },
          errorCallback
        )
      }
      throw error
    } finally {
      timer && clearTimeout(timer)
    }
  }
}
export default new Services()
