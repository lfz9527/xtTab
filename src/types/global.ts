
export type anyObject<V = any> = Record<string, V>

export type AnyFunction<R = any> = (...args: any[]) => R

export type Response<T = unknown> = {
  message?: string
  data?: T
  code: number
}