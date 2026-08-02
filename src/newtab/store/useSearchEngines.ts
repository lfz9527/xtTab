import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface SearchEngine {
  key: string
  name: string
  url: string
  /** 自定义图标图片链接（可选） */
  icon?: string
  /** 是否在搜索引擎切换菜单中隐藏 */
  hidden?: boolean
}

export interface SearchEnginesState {
  current: string
  list: SearchEngine[]
}

const searchEnginesStorage = storage.defineItem<SearchEnginesState>(
  'local:searchEngines',
  {
    fallback: {
      current: 'baidu',
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
        },
        {
          key: 'github',
          name: 'GitHub',
          url: 'https://github.com/search?q='
        },
        {
          key: 'juejin',
          name: '掘金',
          url: 'https://juejin.cn/search?query='
        },
        {
          key: 'taobao',
          name: '淘宝',
          url: 'https://s.taobao.com/search?q='
        },
        {
          key: 'jd',
          name: '京东',
          url: 'https://search.jd.com/Search?keyword='
        },
        {
          key: 'xiaohongshu',
          name: '小红书',
          url: 'https://www.xiaohongshu.com/search_result?keyword='
        }
      ]
    }
  }
)

export default function useSearchEngines() {
  return useWxtStorage(searchEnginesStorage)
}
