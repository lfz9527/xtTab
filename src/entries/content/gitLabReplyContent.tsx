import type { ContentScriptContext } from './types'
import ReactDOM from 'react-dom/client'

/**
 * 创建gitlab回复模板content
 * @param ctx ContentScriptContext
 * @returns
 */
const createGitLabReplyTemplate = async (ctx: ContentScriptContext) => {
  const App = await createShadowRootUi(ctx, {
    name: 'xt-tab',
    position: 'inline',
    anchor: 'body',
    append: 'first',
    onMount(container) {
      const wrapper = document.createElement('div')
      wrapper.id = 'app'
      container.append(wrapper)
      const root = ReactDOM.createRoot(wrapper)
      root.render(<div>223</div>)
      return {
        root,
        wrapper
      }
    },
    onRemove: (elements) => {
      elements?.root.unmount()
      elements?.wrapper.remove()
    }
  })
  App.mount()
  return App
}

export default createGitLabReplyTemplate