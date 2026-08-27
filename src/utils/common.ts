// tab 排除名单列表
export const EXCLUSION_TAB_URL = ['chrome://extensions/']

interface GetTabConfig {
  filter?: boolean
  currentWindow?: boolean
}

/**
 * 获取当前浏览器全部Tab
 * @param config
 * @returns
 */
export const getAllTabs = async (
  config: GetTabConfig = {}
): Promise<Browser.tabs.Tab[]> => {
  const { filter = true, currentWindow = true } = config
  const allTabs = await browser.tabs.query({ currentWindow })
  if (!filter) return allTabs
  const tabs = allTabs.filter(
    (tab) => !(tab.url ? EXCLUSION_TAB_URL.includes(tab.url) : false)
  )
  return tabs
}
