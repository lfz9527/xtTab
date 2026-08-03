import uid from "tiny-uid"
import MessageBus from '@/messages/message'
import { registerSuggestListener } from '@/background/suggest'

export default defineBackground(() => {
    MessageBus.registerListener()
    registerSuggestListener()
    // 左键点击图标 (如果有 popup 是不会触发的，可以执行 browser.action.setPopup({ popup: '' }) 来监听事件)
    browser.action.setPopup({ popup: '' })

    // 监听插件图标点击事件
    browser.action.onClicked.addListener(async (tab) => {
        browser.sidePanel.open({ windowId: tab.windowId })
    })
})


browser.tabs.onActivated.addListener((activeInfo) => {
    console.log('监听标签页激活事件')
})

browser.runtime.onInstalled.addListener((details) => {
    // 首次安装时自动打开新标签页主页（不带 url，地址栏保持 chrome://newtab）
    if (details.reason === 'install') {
        browser.tabs.create({})
    }
})

MessageBus.on('content_bg', () => {
    console.log('content_bg', uid())
})
