import {
  useEffect,
  useImperativeHandle,
  useState,
  type KeyboardEvent,
  type Ref,
  type RefObject
} from 'react'
import { HistoryIcon, SearchIcon, XIcon } from 'lucide-react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import messageBus from '@/messages/message'
import { SUGGEST_ACTION } from '@/constants/suggest'
import { useDebounceFn } from '@/hooks/useDebounceFn'
import { useLatest } from '@/hooks/useLatest'

export interface SuggestPopoverHandle {
  /** 输入框聚焦时，如果有联想词或历史记录则展开下拉 */
  onFocus: () => void
  /** 方向键切换高亮、回车搜索高亮项；返回 true 表示事件已被消费 */
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => boolean
}

interface SuggestPopoverProps {
  query: string
  engineKey: string
  anchor: RefObject<HTMLDivElement | null>
  width?: number
  /** 输入框当前是否聚焦，用于拦截点击输入框触发的 outside-press 关闭 */
  inputFocused: boolean
  onSearch: (word: string) => void
  /** 搜索历史：输入框为空时展示 */
  history: string[]
  onRemoveHistory: (word: string) => void
  onClearHistory: () => void
  ref?: Ref<SuggestPopoverHandle>
}

export default function SuggestPopover({
  query,
  engineKey,
  anchor,
  width,
  inputFocused,
  onSearch,
  history,
  onRemoveHistory,
  onClearHistory,
  ref
}: SuggestPopoverProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [composing, setComposing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const queryRef = useLatest({ query, engine: engineKey, history })

  // 输入为空时展示历史，否则展示联想词
  const trimmed = query.trim()
  const isHistoryMode = !trimmed
  const items = isHistoryMode ? history : suggestions

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
      // 输入清空时回到历史模式：仅聚焦且有历史时展开，失焦时收起
      setSuggestOpen(inputFocused && history.length > 0)
      return
    }
    setSuggestions([])
    runSuggest(trimmed)
    // 仅输入框内容变化时触发查询；切换搜索引擎不重新查询联想，避免无谓展开列表
  }, [query, composing, inputFocused, runSuggest, cancelSuggest])

  const search = (word: string) => {
    onSearch(word)
    setSuggestOpen(false)
    setActiveIndex(-1)
  }

  // 列表刷新后重置高亮
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions, history])

  // 方向键切换高亮、回车搜索高亮项；返回 true 表示事件已被消费
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestOpen || items.length === 0) return false
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % items.length)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1))
      return true
    }
    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      search(items[activeIndex])
      return true
    }
    return false
  }

  const onFocus = () => {
    if (suggestOpen) return
    const hasItems = trimmed ? suggestions.length > 0 : history.length > 0
    if (hasItems) {
      setTimeout(() => setSuggestOpen(true), 200)
    }
  }

  useImperativeHandle(ref, () => ({ onFocus, handleKeyDown }))

  return (
    <Popover
      open={suggestOpen && items.length > 0}
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
        {isHistoryMode ? (
          <>
            <ul className='flex flex-col'>
              {history.map((h, index) => (
                <li key={h} className='group/history flex items-center gap-1 rounded-md hover:bg-muted'>
                  <button
                    type='button'
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => search(h)}
                    className={`flex w-full min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground ${
                      index === activeIndex ? 'bg-muted' : ''
                    }`}
                  >
                    <HistoryIcon className='size-3.5 shrink-0 text-muted-foreground' />
                    <span className='truncate'>{h}</span>
                  </button>
                  <button
                    type='button'
                    aria-label={`删除历史${h}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onRemoveHistory(h)}
                    className='mr-1.5 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/history:opacity-100'
                  >
                    <XIcon className='size-3.5' />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type='button'
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClearHistory}
              className='w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              清空历史
            </button>
          </>
        ) : (
          <ul className='flex flex-col'>
            {suggestions.map((s, index) => (
              <li key={s}>
                <button
                  type='button'
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => search(s)}
                  className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors duration-500 hover:bg-muted ${
                    index === activeIndex ? 'bg-muted' : ''
                  }`}
                >
                  <SearchIcon className={`size-3.5 shrink-0 text-muted-foreground transition-all duration-500 group-hover:text-foreground group-hover:translate-x-2.5 ${
                    index === activeIndex ? 'text-foreground translate-x-2.5' : ''
                  }`} />
                  <span className={`truncate transition-transform duration-500 group-hover:translate-x-2.5 ${
                    index === activeIndex ? 'translate-x-2.5' : ''
                  }`}>{s}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
