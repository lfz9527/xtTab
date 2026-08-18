import {
  BookmarkIcon,
  LayoutGridIcon,
  SettingsIcon,
  StarIcon,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore, type HeaderView } from '@/newTab/store/useAppStore'

/**
 * 顶部导航栏：60% 不透明度背景，左侧内容区切换按钮，右侧收纳书签/设置入口
 * 选中态背景色 bg-[#f1f3f3] 为设计稿指定色，非 Tailwind 标准色，故使用任意值
 */
export default function Header({ activeView }: { activeView: HeaderView }) {
  const setActiveHeaderView = useAppStore((s) => s.setActiveHeaderView)
  const setBookmarkOpen = useAppStore((s) => s.setBookmarkOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  const viewButtons: Array<{
    view: HeaderView
    label: string
    ariaLabel: string
    icon: LucideIcon
  }> = [
    { view: 'pins', label: '快捷书签', ariaLabel: '快捷书签', icon: StarIcon },
    { view: 'tabs', label: '标签页', ariaLabel: '标签页面板', icon: LayoutGridIcon },
  ]
  const actionButtons: Array<{
    label: string
    ariaLabel: string
    icon: LucideIcon
    onClick: () => void
  }> = [
    {
      label: '书签',
      ariaLabel: '书签',
      icon: BookmarkIcon,
      onClick: () => setBookmarkOpen(true),
    },
    {
      label: '设置',
      ariaLabel: '设置',
      icon: SettingsIcon,
      onClick: () => setSettingsOpen(true),
    },
  ]

  return (
    <header className='fixed inset-x-0 top-0 z-40 bg-background/60 backdrop-blur-md py-2'>
      <div className='flex items-center justify-between gap-2 pl-3 pr-4'>
        <div className='flex items-center gap-2'>
          {viewButtons.map(({ view, label, ariaLabel, icon: Icon }) => (
            <Button
              key={view}
              type='button'
              variant='ghost'
              aria-label={ariaLabel}
              onClick={() => setActiveHeaderView(view)}
              className={activeView === view ? 'bg-[#f1f3f3]' : undefined}
            >
              <Icon className='size-3.5' />
              {label}
            </Button>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          {actionButtons.map(({ label, ariaLabel, icon: Icon, onClick }) => (
            <Button
              key={label}
              type='button'
              variant='ghost'
              aria-label={ariaLabel}
              onClick={onClick}
            >
              <Icon className='size-3.5' />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </header>
  )
}
