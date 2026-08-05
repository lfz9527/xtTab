import { BookmarkIcon, SettingsIcon } from 'lucide-react'
import { useAppStore } from '@/newTab/store/useAppStore'

/**
 * 顶部导航栏：透明 + 毛玻璃模糊，右侧收纳书签/设置入口
 */
export default function Header() {
  const setBookmarkOpen = useAppStore((s) => s.setBookmarkOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  return (
    <header className='fixed inset-x-0 top-0 z-40 bg-transparent backdrop-blur-md'>
      <div className='flex items-center justify-end gap-2 p-2 pr-4'>
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
    </header>
  )
}
