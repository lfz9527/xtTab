import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface SearchEngine {
  key: string
  name: string
  url: string
}

export interface SearchEnginesState {
  current: string
  list: SearchEngine[]
}

const searchEnginesStorage = storage.defineItem<SearchEnginesState>(
  'local:searchEngines',
  {
    fallback: {
      current: 'google',
      list: [
        {
          key: 'google',
          name: 'Google',
          url: 'https://www.google.com/search?q='
        },
        {
          key: 'baidu',
          name: '百度',
          url: 'https://www.baidu.com/s?wd='
        },
        {
          key: 'bing',
          name: 'Bing',
          url: 'https://www.bing.com/search?q='
        }
      ]
    }
  }
)

export default function useSearchEngines() {
  return useWxtStorage(searchEnginesStorage)
}
