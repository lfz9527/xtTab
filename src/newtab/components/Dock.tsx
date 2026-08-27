import { useState } from 'react'
import { ChevronUpIcon, GlobeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import useDockItems, { type DockItem } from '../store/useDockItems'
import useSettings from '../store/useSettings'

/** 入口基础尺寸（px） */
const BASE_SIZE = 48
/** 图标（favicon）尺寸 */
const ICON_SIZE = 36

// 放大倍率 1.1，Tailwind 无对应标准 token，故使用任意值 hover:scale-[1.1]
/** 单个 Dock 图标：纯 CSS hover 放大缩小 */
function DockItem({ item, target }: { item: DockItem; target?: '_blank' }) {
  return (
    <li className='relative flex items-end hover:z-1'>
      <a
        href={item.url}
        target={target}
        rel='noreferrer'
        aria-label={item.name}
        className='flex origin-bottom items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.1]'
        style={{ width: BASE_SIZE, height: BASE_SIZE }}
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
      </a>
    </li>
  )
}

/**
 * 新标签页底部 Mac Dock 风格常用网站入口（fixed 定位，不占文档流），数据来自设置弹窗的常用入口配置
 * 收起态为单行横排（x 轴滚动）；展开态向上生长为 300px 高多行面板（y 轴滚动），
 * 切换箭头固定在 Dock 底部中央，收起时朝上、展开时朝下
 */
export default function Dock() {
  const [dockItems] = useDockItems()
  const [settings] = useSettings()
  const [expanded, setExpanded] = useState(false)
  // 跳转方式：'current' 当前标签页（不设 target），'new' 新标签页
  const target = settings.dockItemTarget === 'current' ? undefined : '_blank'
  // 宽度模式：auto 内容自适应（容器随内容收缩）；full 贴近全屏；fixed 固定宽度居中
  const widthMode = settings.dockWidthMode ?? 'auto'
  const widthValue = settings.dockWidthValue ?? 1200
  const scrollRef = useRef<HTMLDivElement>(null)

  // 收起态：纵向滚轮转为横向滚动，滚动到两端尽头后放行；展开态容器纵向滚动走浏览器原生行为
  useEffect(() => {
    const el = scrollRef.current
    if (!el || expanded) return
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
  }, [expanded])

  // 无常用入口时不展示 Dock 栏
  if (dockItems.list.length === 0) return null

  return (
    <nav
      aria-label='常用网站'
      className={cn(
        'fixed bottom-4 z-40 rounded-3xl border border-white/30 bg-white/25 pb-3 shadow-lg backdrop-blur-2xl',
        // 宽度模式定位：full 两侧 16px / auto 两侧各留 300px（inset-x-75 = 75×0.25rem）/ fixed 居中定宽
        widthMode === 'full' && 'inset-x-4',
        widthMode === 'auto' && 'inset-x-100',
        widthMode === 'fixed' && 'left-1/2 -translate-x-1/2'
      )}
      style={widthMode === 'fixed' ? { width: widthValue } : undefined}
    >
      <div
        ref={scrollRef}
        className={cn(
          // 隐藏滚动条（Tailwind 无对应标准类，使用任意值同时覆盖 Firefox 与 Chromium）
          'w-full px-2 pt-4 scrollbar-none [&::-webkit-scrollbar]:hidden',
          // 展开/收起高度过渡：height 在单行 64px（h-16，pt-4+图标）与 300px 面板（h-75）间过渡
          // 不用 max-height：收起时内容先收缩导致 min() 掩盖动画；固定 height 两方向都生效
          // transition 需指定属性，Tailwind 无标准 token，故使用任意值 transition-[height]
          'transition-[height] duration-500 ease-in-out',
          // 展开：300px 高面板纵向滚动，底部留白给上方箭头与图标；收起：单行横向滚动
          expanded && 'h-75 overflow-y-auto pb-8',
          !expanded && 'h-16 overflow-x-auto'
        )}
      >
        <ul
          className={cn(
            'mx-auto flex gap-2.5',
            // 展开：多行换行网格；收起：单行贴底横排
            expanded ? 'w-full flex-wrap content-start' : 'w-fit items-end'
          )}
        >
          {dockItems.list.map((item) => (
            <DockItem key={item.id} item={item} target={target} />
          ))}
        </ul>
      </div>
      {/* 展开/收起箭头：浮在 Dock 栏上方，间隔 40px（-top-10），水平居中 */}
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? '收起常用入口' : '展开常用入口'}
        className='absolute -top-8 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-full bg-black/40 p-1 text-white transition-colors hover:bg-black/60'
      >
        <ChevronUpIcon
          className={cn(
            'size-4 transition-transform duration-300 ease-out',
            expanded && 'rotate-180'
          )}
        />
      </button>
    </nav>
  )
}
