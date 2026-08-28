import MessageBus from '@/messages/message'
import { registerSuggestListener } from '@/background/suggest'
import { registerBookmarksListener } from '@/background/bookmarks'

export default defineBackground(() => {
  MessageBus.registerListener()
  registerSuggestListener()
  registerBookmarksListener()
})

browser.tabs.onActivated.addListener(() => {
  console.log('监听标签页激活事件')
})

browser.runtime.onInstalled.addListener((details) => {
  // 首次安装时自动打开新标签页主页（不带 url，地址栏保持 chrome://newtab）
  if (details.reason === 'install') {
    browser.tabs.create({})
  }
})
