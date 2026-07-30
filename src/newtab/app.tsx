
import './styles/index.css'
import './styles/tailwind.css'
import TimeDisplay from './components/TimeDisplay'
import SearchBar from './components/SearchBar'

function App() {
  return (
    <div className='flex flex-col items-center gap-12 w-full max-w-[640px] px-6 py-6 animate-[fadeIn_0.6s_ease-out]'>
      <TimeDisplay />
      <div className='relative flex items-center w-full h-14 bg-white border border-[#e2e4e8] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-250 overflow-hidden focus-within:border-[#818cf8] focus-within:shadow-[0_0_0_3px_rgba(129,140,248,0.2),0_4px_16px_rgba(0,0,0,0.04)]'>
        <SearchBar />
      </div>
      <p className='text-[#b0b3b9] text-xs tracking-[0.3px] animate-[fadeIn_0.8s_ease-out_0.3s_both]'>按 Enter 搜索 · 切换引擎直接搜索</p>
    </div>
  )
}
export default App