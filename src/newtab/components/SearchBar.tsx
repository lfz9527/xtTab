import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, SearchIcon } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group'
import {
  Popover,
  PopoverArrow,
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
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
  const inputGroupRef = useRef<HTMLDivElement>(null)
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (inputGroupRef.current) {
      const w = inputGroupRef.current.offsetWidth
      console.log('InputGroup width:', w)
      setPopoverWidth(w)
    }
  }, [])
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
    <InputGroup ref={inputGroupRef} className='h-12 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-2'>
      <InputGroupAddon align="inline-start" className='h-full p-0'>
        <Popover>
          <PopoverTrigger className='group flex h-full w-full cursor-pointer items-center gap-1 px-2 outline-none border-0'>
            <img
              src={engineIcons[currentEngine.key]}
              alt={currentEngine.name}
              className='size-5'
            />
            <ChevronDownIcon className='size-4 text-muted-foreground transition-transform group-aria-expanded:rotate-180' />
          </PopoverTrigger>
          <PopoverContent align="start" alignOffset={-4} sideOffset={8} className='p-2 shadow-none rounded-[16px]' style={{ width: popoverWidth }}>
            <div className='flex items-center gap-1'>
              {engines.list.map((engine) => (
                <button
                  key={engine.key}
                  type='button'
                  onClick={() => handleEngineChange(engine.key)}
                  className='flex flex-col items-center justify-center gap-0.5 rounded-md size-14 text-xs text-foreground hover:bg-muted transition-colors'
                >
                  <img
                    src={engineIcons[engine.key]}
                    alt={engine.name}
                    className='size-5'
                  />
                  <span>{engine.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupInput
        className='px-3'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='搜索...'
        autoFocus
      />
      <InputGroupAddon align="inline-end">
        <Button type='button' variant='ghost' size='icon-sm' onClick={handleSearch}>
          <SearchIcon className='size-5 text-muted-foreground hover:text-foreground transition-colors' />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}
