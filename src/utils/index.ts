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

/** 按域名分组标签页：同域名合并、域名字母升序、无 URL 归「其他」排最后；组内保持原顺序 */
export function groupTabsByHost(
  tabs: Browser.tabs.Tab[]
): { host: string; tabs: Browser.tabs.Tab[] }[] {
  const groups = new Map<string, Browser.tabs.Tab[]>()
  for (const tab of tabs) {
    const host = tab.url ? safeHost(tab.url) : ''
    const key = host || '其他'
    const list = groups.get(key)
    if (list) list.push(tab)
    else groups.set(key, [tab])
  }
  return [...groups.entries()]
    .sort((a, b) => {
      if (a[0] === '其他') return 1
      if (b[0] === '其他') return -1
      return a[0].localeCompare(b[0])
    })
    .map(([host, list]) => ({ host, tabs: list }))
}
