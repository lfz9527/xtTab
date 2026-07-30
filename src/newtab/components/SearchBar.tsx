import { useState, type KeyboardEvent } from 'react'
import useSearchEngines from '../store/useSearchEngines'

export default function SearchBar() {
  const [engines, setEngines] = useSearchEngines()
  const [query, setQuery] = useState('')

  const currentEngine = engines.list.find(
    (e) => e.key === engines.current
  ) ?? engines.list[0]

  const handleSearch = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    window.open(currentEngine.url + encodeURIComponent(trimmed), '_blank')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleEngineChange = (key: string) => {
    setEngines({ ...engines, current: key })
  }

  return (
    <>
      <select
        className='shrink-0 appearance-none border-none bg-transparent text-[#6b6f78] text-sm font-inherit pl-1 pr-5 outline-none cursor-pointer transition-colors duration-200 hover:text-[#1a1a2e] bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 fill=%27none%27%3E%3Cpath d=%27M1 1l4 4 4-4%27 stroke=%27rgba(0,0,0,0.3)%27 stroke-width=%271.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_4px_center]'
        value={engines.current}
        onChange={(e) => handleEngineChange(e.target.value)}
      >
        {engines.list.map((engine) => (
          <option key={engine.key} value={engine.key} className='text-[#1a1a2e] bg-white'>
            {engine.name}
          </option>
        ))}
      </select>
      <span className='shrink-0 w-px h-6 bg-[#e2e4e8] mx-1' />
      <input
        className='flex-1 border-none bg-transparent text-[#1a1a2e] text-base font-inherit px-5 pl-3 outline-none min-w-0 placeholder:text-[#b0b3b9]'
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='搜索...'
        autoFocus
      />
    </>
  )
}
