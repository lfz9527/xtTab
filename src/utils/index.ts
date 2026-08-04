/**
 * 站点图标外部服务（硬编码 URL：Google favicon 服务，按域名取图标；加载失败由调用方兜底）
 */
export const faviconUrl = (host: string) =>
  `https://www.google.com/s2/favicons?domain=${host}&sz=64`

/** 提取 URL 域名，解析失败返回空串（兜底不显示图标） */
export function safeHost(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
