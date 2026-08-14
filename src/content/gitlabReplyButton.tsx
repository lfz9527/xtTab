import { GITLAB_REPLY_SELECTORS, GITLAB_REPLY_TEMPLATE } from '@/constants'

import './gitlabReplyButton.css'

/**
 * GitLab MR 回复框主题回复按钮
 * 渲染于表单操作区上方 shadow UI 内，点击后经 shadow host
 * 向上定位同表单内的评论输入框，整体替换为模板内容
 */
const GitLabReplyButton = () => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    const button = buttonRef.current
    if (!button) return

    // shadow 内 closest 无法穿透边界，需经 shadowRoot.host 回到页面 DOM
    const host = (button.getRootNode() as ShadowRoot).host as HTMLElement
    const form = host.closest(GITLAB_REPLY_SELECTORS.form)
    const textarea = form?.querySelector<HTMLTextAreaElement>(
      GITLAB_REPLY_SELECTORS.textarea
    )
    if (!textarea) return

    textarea.value = GITLAB_REPLY_TEMPLATE
    // 派发 input 事件让 GitLab 编辑器感知内容变化（已验证提交按钮激活）
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return (
    <div id='gitlab-reply-button-wrap'>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        title="插入主题回复"
        className="gitlab-reply-button"
      >
        主题回复
      </button>
    </div>
  )
}

export default GitLabReplyButton
