import { BookmarkIcon, SettingsIcon, StarIcon } from 'lucide-react'
import { useAppStore } from '@/newTab/store/useAppStore'

/**
 * 顶部导航栏：60% 不透明度背景，左侧快捷书签切换按钮，右侧收纳书签/设置入口
 */
export default function Header() {
  const activeHeaderView = useAppStore((s) => s.activeHeaderView)
  const setActiveHeaderView = useAppStore((s) => s.setActiveHeaderView)
  const setBookmarkOpen = useAppStore((s) => s.setBookmarkOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  return (
    <header className='fixed inset-x-0 top-0 z-40 bg-background/60'>
      <div className='flex items-center justify-between gap-2 p-2 pl-3 pr-4'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            aria-label='快捷书签'
            onClick={() => setActiveHeaderView('quick')}
            className={`flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground ${activeHeaderView === 'quick' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          >
            <StarIcon className='size-5' />
          </button>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            aria-label='书签'
            onClick={() => setBookmarkOpen(true)}
            className='flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <BookmarkIcon className='size-5' />
          </button>
          <button
            type='button'
            aria-label='设置'
            onClick={() => setSettingsOpen(true)}
            className='flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <SettingsIcon className='size-5' />
          </button>
        </div>
      </div>
    </header>
  )
}
