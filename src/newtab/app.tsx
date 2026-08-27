import './styles/index.css'
import '@/styles/globals.css'
import bgImage from './assets/new-tab-bg.webp'
import useShortcuts from './hooks/useShortcuts'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'
import BookmarkDialog from './components/BookmarkDialog'
import PinnedBookmarks from './components/PinnedBookmarks'
import TabsPanel from './components/TabsPanel'
import Dock from './components/Dock'
import { Toaster } from '@/components/ui/toast'
import { useAppStore } from './store/useAppStore'
import useHeaderViews from './store/useHeaderViews'

function App() {
  // 注册全局快捷键（书签/设置弹窗）
  useShortcuts()
  const activeHeaderView = useAppStore((s) => s.activeHeaderView)
  const { viewOrder } = useHeaderViews()
  // 未手动选择时（null）默认展示视图排序首位
  const effectiveView = activeHeaderView ?? viewOrder[0]
  return (
    <div
      className='flex h-full w-full flex-col items-center'
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* 上：顶部导航栏（fixed 定位，不占文档流） */}
      <Header activeView={effectiveView} />
      {/* 中：搜索框（偏上部） */}
      <main className='flex w-full flex-col items-center'>
        <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
          <SearchBar />
        </div>
      </main>
      {/* 下：内容区，由 Header 左侧按钮切换（pins 置顶卡片 / tabs 标签页面板） */}
      {effectiveView === 'pins' && <PinnedBookmarks />}
      {effectiveView === 'tabs' && (
        <div className='w-full px-4'>
          <TabsPanel />
        </div>
      )}
      {/* 底：Mac Dock 风格常用网站入口（fixed 定位，不占文档流） */}
      <Dock />
      {/* 弹窗（fixed 定位，不影响布局） */}
      <SettingsDialog />
      <BookmarkDialog />
      {/* 顶部居中 toast（antd message 风格） */}
      <Toaster />
    </div>
  )
}
export default App
