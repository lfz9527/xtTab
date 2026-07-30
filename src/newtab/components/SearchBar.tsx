import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import useSearchEngines from '../store/useSearchEngines'
import googleIcon from '../assets/brand-icon/google-icon.png'
import baiduIcon from '../assets/brand-icon/baidu-icon.png'
import bingIcon from '../assets/brand-icon/bing-icon.png'

const engineIcons: Record<string, string> = {
  google: googleIcon,
  baidu: baiduIcon,
  bing: bingIcon
}

export default function SearchBar() {
  const [engines, setEngines] = useSearchEngines()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentEngine = engines.list.find(
    (e) => e.key === engines.current
  ) ?? engines.list[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    setOpen(false)
  }

  return (
    <>
      <div className='relative shrink-0' ref={ref}>
        <button
          type='button'
          onClick={() => setOpen(!open)}
          className='flex items-center gap-1.5 pl-5 pr-5 cursor-pointer outline-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 fill=%27none%27%3E%3Cpath d=%27M1 1l4 4 4-4%27 stroke=%27rgba(0,0,0,0.3)%27 stroke-width=%271.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_4px_center]'
        >
          <img
            src={engineIcons[currentEngine.key]}
            alt={currentEngine.name}
            className='w-5 h-5'
          />
        </button>
        {open && (
          <div className='absolute top-full left-0 mt-2 bg-white rounded-xl border border-[#e2e4e8] shadow-lg py-1 min-w-[56px] z-10'>
            {engines.list.map((engine) => (
              <button
                key={engine.key}
                type='button'
                onClick={() => handleEngineChange(engine.key)}
                className='flex items-center justify-center w-full px-2 py-2 hover:bg-[#f5f6f8] transition-colors'
              >
                <img
                  src={engineIcons[engine.key]}
                  alt={engine.name}
                  className='w-5 h-5'
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <span className='shrink-0 w-px h-6 bg-[#e2e4e8] mx-1' />
      <input
        className='flex-1 border-none bg-transparent text-[#1a1a2e] text-base font-inherit pl-3 pr-5 outline-none min-w-0 placeholder:text-[#b0b3b9]'
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
