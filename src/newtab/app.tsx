import './styles/index.css'
import '@/styles/globals.css'
import bgImage from './assets/new-tab-bg.webp'
import useShortcuts from './hooks/useShortcuts'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'
import PinnedBookmarks from './components/PinnedBookmarks'
import QuickBookmarksView from './components/QuickBookmarksView'
import { useAppStore } from './store/useAppStore'

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  const activeHeaderView = useAppStore((s) => s.activeHeaderView)
  return (
    <div
      className='flex h-full w-full flex-col items-center'
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 上：顶部导航栏（fixed 定位，不占文档流） */}
      <Header />
      {/* 中：搜索框（偏上部） */}
      <main className='flex w-full flex-col items-center'>
        <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
          <SearchBar />
        </div>
      </main>
      {/* 下：内容区，由 Header 左侧快捷书签按钮切换（pins 置顶卡片 / quick 快捷书签列表） */}
      {activeHeaderView === 'pins' && <PinnedBookmarks />}
      {activeHeaderView === 'quick' && <QuickBookmarksView />}
      {/* 弹窗（fixed 定位，不影响布局） */}
      <SettingsDialog />
      <BookmarkDialog />
    </div>
  )
}
export default App
