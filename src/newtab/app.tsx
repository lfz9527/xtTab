import './styles/index.css'
import '@/styles/globals.css'
import bgImage from './assets/new-tab-bg.webp'
import useShortcuts from './hooks/useShortcuts'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'
import PinnedBookmarks from './components/PinnedBookmarks'

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  return (
    <div
      className='flex h-full w-full flex-col items-center'
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 上：顶部导航栏（fixed 定位，不占文档流） */}
      <Header />
      {/* 中：搜索框（偏上部） */}
      <main className='flex w-full flex-1 flex-col items-center'>
        <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
          <SearchBar />
        </div>
      </main>
      {/* 下：置顶书签卡片区（flex-1 撑开中间，卡片区自然沉底，外层 items-center 保持居中） */}
      <PinnedBookmarks />
      {/* 弹窗（fixed 定位，不影响布局） */}
      <SettingsDialog />
      <BookmarkDialog />
    </div>
  )
}
export default App
