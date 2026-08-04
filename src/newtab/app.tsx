
import './styles/index.css'
import '@/styles/globals.css'
import bgImage from './assets/new-tab-bg.webp'
import useShortcuts from './hooks/useShortcuts'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'
import PinnedBookmarks from './components/PinnedBookmarks'

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  return (
    <div
      className='flex h-full w-full flex-col items-center gap-10'
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
        <SearchBar />
        <SettingsDialog />
        <BookmarkDialog />
      </div>
      {/* 置顶卡片区脱离 max-w-160 容器，独立居中展示（max-w-300） */}
      <PinnedBookmarks />
    </div>
  )
}
export default App