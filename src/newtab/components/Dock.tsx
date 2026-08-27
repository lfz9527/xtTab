import { GlobeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import useDockItems, { type DockItem } from '../store/useDockItems'
import useSettings from '../store/useSettings'

/** 入口基础尺寸（px） */
const BASE_SIZE = 48
/** 图标（favicon）尺寸 */
const ICON_SIZE = 36

// 放大倍率 1.3 沿用此前 JS 方案确认的手感，Tailwind 无对应标准 token，故使用任意值 hover:scale-[1.3]
/** 单个 Dock 图标：纯 CSS hover 放大缩小，悬停显示名称气泡 */
function DockItem({ item, target }: { item: DockItem; target?: '_blank' }) {
  return (
    <li className='group relative flex items-end hover:z-10'>
      <a
        href={item.url}
        target={target}
        rel='noreferrer'
        aria-label={item.name}
        className='flex origin-bottom items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.3]'
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
      <span className='pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/75 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>
        {item.name}
      </span>
    </li>
  )
}

/** 新标签页底部 Mac Dock 风格常用网站入口（fixed 定位，不占文档流），数据来自设置弹窗的常用入口配置 */
export default function Dock() {
  const [dockItems] = useDockItems()
  const [settings] = useSettings()
  // 跳转方式：'current' 当前标签页（不设 target），'new' 新标签页
  const target = settings.dockItemTarget === 'current' ? undefined : '_blank'
  // 宽度模式：auto 内容自适应（容器随内容收缩）；full 贴近全屏；fixed 固定宽度居中
  const widthMode = settings.dockWidthMode ?? 'auto'
  const widthValue = settings.dockWidthValue ?? 1200

  return (
    <nav
      aria-label='常用网站'
      className={cn(
        'fixed bottom-4 z-40 rounded-3xl border border-white/30 bg-white/25 px-5 py-3 shadow-lg backdrop-blur-2xl',
        // 全屏模式两侧留 16px 边距，其余模式水平居中
        widthMode === 'full' ? 'inset-x-4' : 'left-1/2 -translate-x-1/2'
      )}
      style={widthMode === 'fixed' ? { width: widthValue } : undefined}
    >
      <ul
        className={cn(
          'flex items-end gap-2.5',
          widthMode !== 'auto' && 'w-full justify-center'
        )}
      >
        {dockItems.list.map((item) => (
          <DockItem key={item.id} item={item} target={target} />
        ))}
      </ul>
    </nav>
  )
}
