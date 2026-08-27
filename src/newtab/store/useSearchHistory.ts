import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

/** 搜索历史存储：去重、最新在前、最多 10 条 */
const searchHistoryStorage = storage.defineItem<string[]>(
  'local:searchHistory',
  {
    fallback: []
  }
)

export default function useSearchHistory() {
  const [history, setHistory] = useWxtStorage(searchHistoryStorage)

  /** 记录搜索词：已存在则移到最前，否则插入最前；截断到 10 条 */
  const addHistory = (word: string) => {
    const trimmed = word.trim()
    if (!trimmed) return
    setHistory([trimmed, ...history.filter((h) => h !== trimmed)].slice(0, 10))
  }

  /** 删除单条历史 */
  const removeHistory = (word: string) => {
    setHistory(history.filter((h) => h !== word))
  }

  /** 清空全部历史 */
  const clearHistory = () => {
    setHistory([])
  }

  return { history, addHistory, removeHistory, clearHistory }
}
