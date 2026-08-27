import type { ReactNode } from 'react'
import { CheckCircle2Icon, InfoIcon, XCircleIcon } from 'lucide-react'
import { Toaster as Sonner, toast as sonnerToast } from 'sonner'

/**
 * sonner 封装（antd message 风格）：
 * - 顶部居中、无边框卡片、纯文本条 + 彩色小图标，自动消失
 * - 调用方式仿 antd：toast.success('内容') / toast.error() / toast.info()
 *
 * 挂载：在应用根部渲染 <Toaster /> 一次
 */
function Toaster() {
  return (
    <Sonner
      position='top-center'
      offset={72}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex items-center gap-2 rounded-md bg-popover px-4 py-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10'
        }
      }}
    />
  )
}

/** 渲染单条 toast：容器样式 + 彩色图标 + 文字（sonner custom 需要传入渲染函数） */
function renderToast(icon: ReactNode, message: string) {
  return () => (
    <div className='flex items-center gap-2'>
      {icon}
      <span>{message}</span>
    </div>
  )
}

/** 仿 antd message 的轻量调用对象 */
export const toast = {
  success: (message: string) =>
    sonnerToast.custom(
      renderToast(
        <CheckCircle2Icon className='size-4 shrink-0 text-emerald-500' />,
        message
      )
    ),
  error: (message: string) =>
    sonnerToast.custom(
      renderToast(
        <XCircleIcon className='size-4 shrink-0 text-red-500' />,
        message
      )
    ),
  info: (message: string) =>
    sonnerToast.custom(
      renderToast(
        <InfoIcon className='size-4 shrink-0 text-sky-500' />,
        message
      )
    )
}

export { Toaster }
