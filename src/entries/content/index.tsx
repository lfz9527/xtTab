import contentMessages from '@/messages/content'
import type { ContentScriptContext } from './types'

import createGitLabReplyTemplate from './gitLabReplyContent'
import createApp from './app'


export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx: ContentScriptContext) {
    console.log('content 脚本加载成功')
    // 注册全局监听器
    contentMessages.registerListener()
    createApp(ctx)
    createGitLabReplyTemplate(ctx)
  }
})
