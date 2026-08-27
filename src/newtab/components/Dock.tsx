import { GlobeIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import useDockItems, { type DockItem } from '../store/useDockItems'
import useSettings from '../store/useSettings'

/** 入口基础尺寸（px） */
const BASE_SIZE = 48
/** 图标（favicon）尺寸 */
const ICON_SIZE = 36

// 放大倍率 1.1，Tailwind 无对应标准 token，故使用任意值 hover:scale-[1.1]
/** 单个 Dock 图标：纯 CSS hover 放大缩小，悬停用 ui/tooltip 显示名称 */
function DockItem({ item, target }: { item: DockItem; target?: '_blank' }) {
  return (
    <li className='relative flex items-end hover:z-1'>
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={item.url}
              target={target}
              rel='noreferrer'
              aria-label={item.name}
              className='flex origin-bottom items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.1]'
              style={{ width: BASE_SIZE, height: BASE_SIZE }}
            />
          }
        >
          {item.icon ? (
            <img
              src={item.icon}
              alt={item.name}
              style={{ width: ICON_SIZE, height: ICON_SIZE }}
            />
          ) : (
            <GlobeIcon className='size-9 text-muted-foreground' />
          )}
        </TooltipTrigger>
        <TooltipContent>{item.name}</TooltipContent>
      </Tooltip>
    </li>
  )
}

/**
 * 新标签页底部 Mac Dock 风格常用网站入口（fixed 定位，不占文档流），数据来自设置弹窗的常用入口配置
 * 入口过多时横向滚动（滚动条隐藏，滚轮控制）；名称气泡走 Tooltip Portal 不受裁剪，
 * 滚动容器的 padding 仅承载 hover 放大图标的视觉溢出（顶部/两侧约 15px）
 */
export default function Dock() {
  const [dockItems] = useDockItems()
  const [settings] = useSettings()
  // 跳转方式：'current' 当前标签页（不设 target），'new' 新标签页
  const target = settings.dockItemTarget === 'current' ? undefined : '_blank'
  // 宽度模式：auto 内容自适应（容器随内容收缩）；full 贴近全屏；fixed 固定宽度居中
  const widthMode = settings.dockWidthMode ?? 'auto'
  const widthValue = settings.dockWidthValue ?? 1200
  const scrollRef = useRef<HTMLDivElement>(null)

  // 鼠标悬停 Dock 时纵向滚轮转为横向滚动；滚动到两端尽头后放行，不再拦截页面滚动
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const canScroll =
        e.deltaY > 0
          ? el.scrollLeft < el.scrollWidth - el.clientWidth - 1
          : el.scrollLeft > 1
      if (canScroll) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <nav
      aria-label='常用网站'
      className={cn(
        'fixed bottom-4 z-40 rounded-3xl border border-white/30 bg-white/25 pb-3 shadow-lg backdrop-blur-2xl',
        // 全屏模式两侧留 16px 边距，其余模式水平居中
        widthMode === 'full' ? 'inset-x-4' : 'left-1/2 -translate-x-1/2'
      )}
      style={widthMode === 'fixed' ? { width: widthValue } : undefined}
    >
      <div
        ref={scrollRef}
        className={cn(
          // 隐藏滚动条（Tailwind 无对应标准类，使用任意值同时覆盖 Firefox 与 Chromium）
          'overflow-x-auto px-2 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // 自适应模式限制在视口内（两侧各留 16px），full/fixed 模式占满 nav 宽度
          widthMode === 'auto' ? 'max-w-[calc(100vw-2rem)]' : 'w-full'
        )}
      >
        <ul
          className={cn(
            'flex w-fit items-end gap-2.5',
            // full/fixed 模式内容不足一行时居中
            widthMode !== 'auto' && 'mx-auto'
          )}
        >
          {dockItems.list.map((item) => (
            <DockItem key={item.id} item={item} target={target} />
          ))}
        </ul>
      </div>
    </nav>
  )
}
