import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react'
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
import AddEngineDialog from './AddEngineDialog'
import { useEventListener } from '@/hooks/useEventListener'
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
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const suggestRef = useRef<SuggestPopoverHandle>(null)

  useEffect(() => {
    if (inputGroupRef.current) {
      const w = inputGroupRef.current.offsetWidth
      setPopoverWidth(w)
    }
  }, [])

  // 页面缩小时同步更新弹层宽度，与搜索框保持一致
  useEventListener('resize', () => {
    if (inputGroupRef.current) {
      setPopoverWidth(inputGroupRef.current.offsetWidth)
    }
  })
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

  /** 删除引擎（当前使用的引擎不允许删除） */
  const removeEngine = (key: string) => {
    setEngines({
      ...engines,
      list: engines.list.filter((e) => e.key !== key)
    })
  }

  return (
    <>
      <InputGroup ref={inputGroupRef} className='h-12 rounded-2xl bg-white/60 backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-2 border-0 focus-within:ring-0!'>
        <InputGroupAddon align="inline-start" className='h-full p-0'>
          <Popover open={enginePopoverOpen} onOpenChange={setEnginePopoverOpen}>
            <PopoverTrigger className='group flex h-full w-full cursor-pointer items-center gap-1 px-2 outline-none border-0'>
              <EngineIcon
                engineKey={currentEngine.key}
                name={currentEngine.name}
                icon={currentEngine.icon}
                showBg={false}
              />
              <ChevronDownIcon className='size-4 text-muted-foreground transition-transform group-aria-expanded:rotate-180' />
            </PopoverTrigger>
            <PopoverContent align="start" alignOffset={-4} sideOffset={8} className='bg-background/50 backdrop-blur-md p-2 shadow-none rounded-2xl' style={{ width: popoverWidth }}>
              <div className='flex flex-wrap items-center gap-2'>
                {visibleEngines.map((engine) => {
                  const isCurrent = engine.key === engines.current
                  return (
                    <div
                      key={engine.key}
                      onClick={() => handleEngineChange(engine.key)}
                      className='group relative flex size-16 cursor-pointer flex-col items-center justify-center rounded-md text-xs text-foreground transition-colors hover:bg-muted'
                    >
                      {!isCurrent && (
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            removeEngine(engine.key)
                          }}
                          aria-label={`删除${engine.name}`}
                          className='absolute -right-0.5 -top-0.5 z-10 rounded-full bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-destructive'
                        >
                          <XIcon className='size-3' />
                        </button>
                      )}
                      <EngineIcon
                        engineKey={engine.key}
                        name={engine.name}
                        icon={engine.icon}
                        className='size-4.5'
                      />
                      <span>{engine.name}</span>
                    </div>
                  )
                })}
                <button
                  type='button'
                  onClick={() => {
                    setEnginePopoverOpen(false)
                    setAddDialogOpen(true)
                  }}
                  className='flex flex-col items-center justify-center rounded-md size-16 text-xs text-foreground hover:bg-muted transition-colors'
                >
                  <span className='flex size-9 items-center justify-center rounded-md bg-white'>
                    <PlusIcon className='size-4.5 text-muted-foreground' />
                  </span>
                  <span>添加</span>
                </button>
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
      <AddEngineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </>
  )
}
