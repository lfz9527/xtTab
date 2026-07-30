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
    <div className='search-bar'>
      <select
        value={engines.current}
        onChange={(e) => handleEngineChange(e.target.value)}
      >
        {engines.list.map((engine) => (
          <option key={engine.key} value={engine.key}>
            {engine.name}
          </option>
        ))}
      </select>
      <input
        type='text'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='搜索...'
      />
    </div>
  )
}
