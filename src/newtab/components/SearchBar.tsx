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
  PopoverTrigger,
  PopoverContent
} from '@/components/ui/popover'
import SuggestPopover, {
  type SuggestPopoverHandle
} from './SuggestPopover'
import EngineIcon from './EngineIcon'
import useSearchEngines from '../store/useSearchEngines'
import useSettings from '../store/useSettings'
import useSearchHistory from '../store/useSearchHistory'

export default function SearchBar() {
  const [engines, setEngines] = useSearchEngines()
  const [settings] = useSettings()
  const openTarget = settings.openTarget ?? 'current'
  // 搜索历史开关：关闭时不记录、不展示历史
  const historyEnabled = settings.searchHistoryEnabled ?? true
  const { history, addHistory, removeHistory, clearHistory } =
    useSearchHistory()
  const [query, setQuery] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const inputGroupRef = useRef<HTMLDivElement>(null)
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(undefined)
  const [enginePopoverOpen, setEnginePopoverOpen] = useState(false)
  const suggestRef = useRef<SuggestPopoverHandle>(null)

  useEffect(() => {
    if (inputGroupRef.current) {
      const w = inputGroupRef.current.offsetWidth
      setPopoverWidth(w)
    }
  }, [])
  const visibleEngines = engines.list.filter((e) => !e.hidden)
  const currentEngine =
    engines.list.find((e) => e.key === engines.current && !e.hidden) ??
    visibleEngines[0] ??
    engines.list[0]
  const search = (word: string) => {
    const trimmed = word.trim()
    if (!trimmed) return
    if (historyEnabled) addHistory(trimmed)
    const keyword = encodeURIComponent(trimmed)
    // 链接含 %s 时替换为关键字（支持指定位置）；否则追加到末尾
    const url = currentEngine.url.includes('%s')
      ? currentEngine.url.replaceAll('%s', keyword)
      : currentEngine.url + keyword
    if (openTarget === 'new') {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
  }

  const handleSearch = () => {
    search(query)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    // 联想列表方向键/回车优先消费；未消费时回车触发搜索
    if (suggestRef.current?.handleKeyDown(e)) return
    if (e.key === 'Enter') handleSearch()
  }

  const handleEngineChange = (key: string) => {
    setEngines({ ...engines, current: key })
    setEnginePopoverOpen(false)
  }

  return (
    <>
      <InputGroup ref={inputGroupRef} className='h-12 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-2 focus-within:!ring-0 focus-within:!border-input'>
        <InputGroupAddon align="inline-start" className='h-full p-0'>
          <Popover open={enginePopoverOpen} onOpenChange={setEnginePopoverOpen}>
            <PopoverTrigger className='group flex h-full w-full cursor-pointer items-center gap-1 px-2 outline-none border-0'>
              <EngineIcon
                engineKey={currentEngine.key}
                name={currentEngine.name}
                icon={currentEngine.icon}
              />
              <ChevronDownIcon className='size-4 text-muted-foreground transition-transform group-aria-expanded:rotate-180' />
            </PopoverTrigger>
            <PopoverContent align="start" alignOffset={-4} sideOffset={8} className='p-2 shadow-none rounded-2xl' style={{ width: popoverWidth }}>
              <div className='flex items-center gap-1'>
                {visibleEngines.map((engine) => (
                  <button
                    key={engine.key}
                    type='button'
                    onClick={(e) => {
                      handleEngineChange(engine.key)
                    }}
                    className='flex flex-col items-center justify-center gap-0.5 rounded-md size-14 text-xs text-foreground hover:bg-muted transition-colors'
                  >
                    <EngineIcon
                      engineKey={engine.key}
                      name={engine.name}
                      icon={engine.icon}
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
          onFocus={() => {
            setInputFocused(true)
            suggestRef.current?.onFocus()
          }}
          onBlur={() => {
            setInputFocused(false)
            suggestRef.current?.close()
          }}
          placeholder='搜索...'
          autoFocus
        />
        <InputGroupAddon align="inline-end">
          <Button type='button' variant='ghost' size='icon-sm' onClick={handleSearch}>
            <SearchIcon className='size-5 text-muted-foreground hover:text-foreground transition-colors' />
          </Button>
        </InputGroupAddon>
      </InputGroup>
      <SuggestPopover
        ref={suggestRef}
        query={query}
        engineKey={currentEngine.key}
        anchor={inputGroupRef}
        width={popoverWidth}
        inputFocused={inputFocused}
        onSearch={search}
        history={historyEnabled ? history : []}
        onRemoveHistory={removeHistory}
        onClearHistory={clearHistory}
      />
    </>
  )
}
