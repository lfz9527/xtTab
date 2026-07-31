import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
  type RefObject
} from 'react'
import { SearchIcon } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import messageBus from '@/messages/message'
import { SUGGEST_ACTION } from '@/constants/suggest'

export interface SuggestPopoverHandle {
  /**
   * 处理输入框键盘事件，返回 true 表示已消费（联想导航/选中），false 表示未消费
   */
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => boolean
}

interface SuggestPopoverProps {
  query: string
  engineKey: string
  anchor: RefObject<HTMLDivElement | null>
  width?: number
  onSearch: (word: string) => void
  ref?: Ref<SuggestPopoverHandle>
}

export default function SuggestPopover({
  query,
  engineKey,
  anchor,
  width,
  onSearch,
  ref
}: SuggestPopoverProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const queryRef = useRef({ query: '', engine: '' })
  queryRef.current = { query, engine: engineKey }

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
          engine: engineKey,
          query: trimmed
        }
      )
      if (
        queryRef.current.query !== trimmed ||
        queryRef.current.engine !== engineKey
      ) {
        return // 过期响应丢弃
      }
      setSuggestions(res?.data ?? [])
      setSuggestOpen(true)
      setActiveIndex(-1)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, engineKey])

  const search = (word: string) => {
    onSearch(word)
    setSuggestOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): boolean => {
    if (e.key === 'Escape') {
      setSuggestOpen(false)
      setActiveIndex(-1)
      return true
    }
    return false
  }

  useImperativeHandle(ref, () => ({ handleKeyDown }))

  return (
    <Popover open={suggestOpen && suggestions.length > 0} onOpenChange={setSuggestOpen}>
      <PopoverContent
        anchor={anchor}
        align="center"
        sideOffset={8}
        initialFocus={false}
        className='p-1.5 shadow-none rounded-2xl max-h-[300px] overflow-y-auto'
        style={{ width }}
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
  )
}
