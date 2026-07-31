
import './styles/index.css'
import '@/styles/globals.css'
import SearchBar from './components/SearchBar'

function App() {
  return (
    <div className='flex flex-col items-center gap-12 w-full max-w-160 px-6 py-6 animate-[fadeIn_0.6s_ease-out]'>
      <SearchBar />
    </div>
  )
}
export default App