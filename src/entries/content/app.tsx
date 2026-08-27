import type { ContentScriptContext } from './types'
import Content from '@/content'
import ReactDOM from 'react-dom/client'

/**
 * 创建contentApp
 * @param ctx ContentScriptContext
 * @returns
 */
const createApp = async (ctx: ContentScriptContext) => {
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
      root.render(<Content />)
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

export default createApp
