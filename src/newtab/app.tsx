
import './styles/index.css'
import '@/styles/globals.css'
import SearchBar from './components/SearchBar'
import SettingsDialog from './components/SettingsDialog'

function App() {
  return (
    <div className='flex w-full max-w-160 flex-col items-center gap-12 px-6 pt-50 pb-6'>
      <SearchBar />
      <SettingsDialog />
    </div>
  )
}
export default App