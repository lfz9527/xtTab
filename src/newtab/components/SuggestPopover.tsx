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
import { useDebounceFn } from '@/hooks/useDebounceFn'

export interface SuggestPopoverHandle {
  /** 输入框聚焦时，如果有联想词则展开下拉 */
  onFocus: () => void
}

interface SuggestPopoverProps {
  query: string
  engineKey: string
  anchor: RefObject<HTMLDivElement | null>
  width?: number
  /** 输入框当前是否聚焦，用于拦截点击输入框触发的 outside-press 关闭 */
  inputFocused: boolean
  onSearch: (word: string) => void
  ref?: Ref<SuggestPopoverHandle>
}

export default function SuggestPopover({
  query,
  engineKey,
  anchor,
  width,
  inputFocused,
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
  const { run: runSuggest, cancel: cancelSuggest } = useDebounceFn(
    async (trimmed: string) => {
      const res = await messageBus.send<{ engine: string; query: string }, string[]>(
        SUGGEST_ACTION,
        { engine: engineKey, query: trimmed }
      )
      if (queryRef.current.query !== trimmed || queryRef.current.engine !== engineKey) return
      setSuggestions(res?.data ?? [])
      setSuggestOpen(true)
    },
    { delay: 200 }
  )

  useEffect(() => {
    if (composing) {
      cancelSuggest()
      return
    }
    const trimmed = query.trim()
    if (!trimmed) {
      cancelSuggest()
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    setSuggestions([])
    runSuggest(trimmed)
  }, [query, engineKey, composing, runSuggest, cancelSuggest])

  const search = (word: string) => {
    onSearch(word)
    setSuggestOpen(false)
  }

  const onFocus = () => {
    if (suggestOpen) return
    if (suggestions.length > 0) {
      setTimeout(() => setSuggestOpen(true), 200)
    }
  }

  useImperativeHandle(ref, () => ({ onFocus }))

  return (
    <Popover
      open={suggestOpen && suggestions.length > 0}
      onOpenChange={(open, details) => {
        // 点击输入框（仍聚焦输入）触发的 outside-press 关闭应被忽略，否则连续点击输入框会误关联想列表
        // 'outside-press' 为 @base-ui/react 内部 REASONS.outsidePress 的值，未从包根公开导出，故用字面量
        if (!open && details.reason === 'outside-press' && inputFocused) return
        setSuggestOpen(open)
      }}
    >
      <PopoverContent
        anchor={anchor}
        align="center"
        sideOffset={8}
        initialFocus={false}
        finalFocus={false}
        className='p-1.5 shadow-none rounded-2xl'
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
