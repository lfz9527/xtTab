import type { ContentScriptContext } from './types'
import ReactDOM from 'react-dom/client'

import GitLabReplyButton from '@/content/gitlabReplyButton'
import { GITLAB_REPLY_SELECTORS } from '@/constants'

type ShadowUi = Awaited<ReturnType<typeof createShadowRootUi>>

// 同步挂载标记：挂载前立即打在操作区上，防止 MutationObserver 回调
// 与异步挂载之间的竞态导致重复注入容器
const INJECTED_FLAG = 'data-xt-gitlab-reply-injected'

const mountButton = async (actionBar: HTMLElement, ctx: ContentScriptContext) => {
  const App = await createShadowRootUi(ctx, {
    name: 'gitlab-reply-template-container',
    position: 'inline',
    anchor: actionBar,
    append: 'before',
    onMount(container) {
      // 官方推荐：React 不直接 root 到容器，加一层 div 包裹
      const app = document.createElement('div')
      container.append(app)
      const root = ReactDOM.createRoot(app)
      root.render(<GitLabReplyButton />)
      return root
    },
    onRemove: (root) => {
      root?.unmount()
    }
  })
  App.mount()
  return App
}

/**
 * 创建gitlab回复模板content
 * 监听页面 DOM，在线程回复框的表单操作区上方以 shadow UI 挂载
 * div 容器并渲染主题回复按钮，回复框移除时同步卸载
 * @param ctx ContentScriptContext
 */
const createGitLabReplyTemplate = async (ctx: ContentScriptContext) => {
  // 已挂载的操作区，用于断链清理（去重由 INJECTED_FLAG 同步标记保证）
  const mounted = new Map<HTMLElement, ShadowUi>()



  const scan = () => {
    // 清理已脱离文档的挂载（remove 会触发 onRemove 卸载 React root）
    mounted.forEach((ui, actionBar) => {
      if (!actionBar.isConnected) {
        ui.remove()
        mounted.delete(actionBar)
      }
    })

    document
      .querySelectorAll(GITLAB_REPLY_SELECTORS.replyHolder)
      .forEach((holder) => {
        const actionBar = holder.querySelector<HTMLElement>(
          GITLAB_REPLY_SELECTORS.actionBar
        )
        if (!actionBar || actionBar.hasAttribute(INJECTED_FLAG)) return
        // 先打标记再异步挂载，避免挂载引发的 DOM 变化触发重复注入
        actionBar.setAttribute(INJECTED_FLAG, '')
        mountButton(actionBar, ctx).then((ui) => {
          if (actionBar.isConnected) mounted.set(actionBar, ui)
        })
      })
  }

  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
}

export default createGitLabReplyTemplate
