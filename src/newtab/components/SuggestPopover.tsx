import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type RefObject
} from 'react'
import { SearchIcon } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import messageBus from '@/messages/message'
import { SUGGEST_ACTION } from '@/constants/suggest'

export interface SuggestPopoverHandle {
  /** 输入框聚焦时，如果有联想词则展开下拉 */
  onFocus: () => void
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
  const [composing, setComposing] = useState(false)
  const queryRef = useRef({ query: '', engine: '' })
  queryRef.current = { query, engine: engineKey }

  // 监听输入法组合输入
  useEffect(() => {
    const onStart = () => setComposing(true)
    const onEnd = () => setComposing(false)
    document.addEventListener('compositionstart', onStart)
    document.addEventListener('compositionend', onEnd)
    return () => {
      document.removeEventListener('compositionstart', onStart)
      document.removeEventListener('compositionend', onEnd)
    }
  }, [])

  // 联想请求：防抖 200ms
  useEffect(() => {
    if (composing) return
    const trimmed = query.trim()
    if (!trimmed) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    setSuggestions([])
    const timer = setTimeout(async () => {
      const res = await messageBus.send<{ engine: string; query: string }, string[]>(
        SUGGEST_ACTION,
        { engine: engineKey, query: trimmed }
      )
      if (queryRef.current.query !== trimmed || queryRef.current.engine !== engineKey) return
      setSuggestions(res?.data ?? [])
      setSuggestOpen(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, engineKey, composing])

  const search = (word: string) => {
    onSearch(word)
    setSuggestOpen(false)
  }

  const onFocus = () => {
    if (suggestions.length > 0) {
      setTimeout(() => setSuggestOpen(true), 200)
    }
  }

  useImperativeHandle(ref, () => ({ onFocus }))

  return (
    <Popover open={suggestOpen && suggestions.length > 0} onOpenChange={setSuggestOpen}>
      <PopoverContent
        anchor={anchor}
        align="center"
        sideOffset={8}
        initialFocus={false}
        finalFocus={false}
        className='p-1.5 shadow-none rounded-2xl max-h-[300px] overflow-y-auto'
        style={{ width }}
      >
        <ul className='flex flex-col'>
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type='button'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => search(s)}
                className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted'
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
