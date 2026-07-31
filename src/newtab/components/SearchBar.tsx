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
import messageBus from '@/messages/message'
import { SUGGEST_ACTION } from '@/constants/suggest'
import useSearchEngines from '../store/useSearchEngines'
import googleIcon from '../assets/brand-icon/google-icon.png'
import baiduIcon from '../assets/brand-icon/baidu-icon.png'
import bingIcon from '../assets/brand-icon/bing-icon.png'
import githubIcon from '../assets/brand-icon/github-icon.png'

const engineIcons: Record<string, string> = {
  google: googleIcon,
  baidu: baiduIcon,
  bing: bingIcon,
  github: githubIcon
}

export default function SearchBar() {
  const [engines, setEngines] = useSearchEngines()
  const [query, setQuery] = useState('')
  const inputGroupRef = useRef<HTMLDivElement>(null)
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(undefined)
  const [enginePopoverOpen, setEnginePopoverOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const queryRef = useRef({ query: '', engine: '' })

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
  queryRef.current = { query, engine: currentEngine.key }
  const search = (word: string) => {
    const trimmed = word.trim()
    if (!trimmed) return
    window.open(currentEngine.url + encodeURIComponent(trimmed), '_blank')
    setSuggestOpen(false)
    setActiveIndex(-1)
  }

  const handleSearch = () => {
    search(query)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestions.length === 0) return
      setSuggestOpen(true)
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestions.length === 0) return
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setSuggestOpen(false)
      setActiveIndex(-1)
    } else if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing) return
      if (suggestOpen && activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault()
        search(suggestions[activeIndex])
      } else {
        handleSearch()
      }
    }
  }

  const handleEngineChange = (key: string) => {
    setEngines({ ...engines, current: key })
    setEnginePopoverOpen(false)
  }

  // 联想请求：防抖 200ms，响应过期丢弃
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSuggestions([])
      setSuggestOpen(false)
      setActiveIndex(-1)
      return
    }
    setSuggestions([])
    setActiveIndex(-1)
    const timer = setTimeout(async () => {
      const res = await messageBus.send<{ engine: string; query: string }, string[]>(
        SUGGEST_ACTION,
        {
          engine: currentEngine.key,
          query: trimmed
        }
      )
      if (
        queryRef.current.query !== trimmed ||
        queryRef.current.engine !== currentEngine.key
      ) {
        return // 过期响应丢弃
      }
      setSuggestions(res?.data ?? [])
      setSuggestOpen(true)
      setActiveIndex(-1)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, currentEngine])

  return (
    <>
      <InputGroup ref={inputGroupRef} className='h-12 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-2'>
        <InputGroupAddon align="inline-start" className='h-full p-0'>
          <Popover open={enginePopoverOpen} onOpenChange={setEnginePopoverOpen}>
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
      <Popover open={suggestOpen && suggestions.length > 0} onOpenChange={setSuggestOpen}>
        <PopoverContent
          anchor={inputGroupRef}
          align="start"
          alignOffset={-8}
          sideOffset={8}
          className='p-1.5 shadow-none rounded-2xl max-h-[300px] overflow-y-auto'
          style={{ width: popoverWidth }}
        >
          <ul className='flex flex-col'>
            {suggestions.map((s, i) => (
              <li key={s}>
                <button
                  type='button'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => search(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground ${i === activeIndex ? 'bg-muted' : ''}`}
                >
                  <SearchIcon className='size-3.5 shrink-0 text-muted-foreground' />
                  <span className='truncate'>{s}</span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </>
  )
}
