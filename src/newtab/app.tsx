
import './styles/index.css'
import '@/styles/globals.css'
import TimeDisplay from './components/TimeDisplay'
import SearchBar from './components/SearchBar'

function App() {
  return (
    <div className='flex flex-col items-center gap-12 w-full max-w-[640px] px-6 py-6 animate-[fadeIn_0.6s_ease-out]'>
      <TimeDisplay />
      <SearchBar />
      <p className='text-[#b0b3b9] text-xs tracking-[0.3px] animate-[fadeIn_0.8s_ease-out_0.3s_both]'>按 Enter 搜索 · 切换引擎直接搜索</p>
    </div>
  )
}
export default App