import useWxtStorage from '@/hooks/useWxtStorage'
import { storage } from '@wxt-dev/storage'

export interface DockItem {
  id: string
  name: string
  url: string
  /** 图标图片链接（可选），缺省时 Dock 用默认图标占位 */
  icon?: string
}

export interface DockItemsState {
  list: DockItem[]
}

/** 常用网站入口的默认数据（首次使用填充，可在设置弹窗中增删） */
const dockItemsStorage = storage.defineItem<DockItemsState>('local:dockItems', {
  fallback: {
    list: [
      {
        id: 'xiaohongshu',
        name: '小红书',
        url: 'https://www.xiaohongshu.com',
        icon: 'https://www.google.com/s2/favicons?domain=xiaohongshu.com&sz=64'
      },
      {
        id: 'zhihu',
        name: '知乎',
        url: 'https://www.zhihu.com',
        icon: 'https://www.google.com/s2/favicons?domain=zhihu.com&sz=64'
      },
      {
        id: 'juejin',
        name: '掘金',
        url: 'https://juejin.cn',
        icon: 'https://www.google.com/s2/favicons?domain=juejin.cn&sz=64'
      },
      {
        id: 'taobao',
        name: '淘宝',
        url: 'https://www.taobao.com',
        icon: 'https://www.google.com/s2/favicons?domain=taobao.com&sz=64'
      },
      {
        id: 'jd',
        name: '京东',
        url: 'https://www.jd.com',
        icon: 'https://www.google.com/s2/favicons?domain=jd.com&sz=64'
      },
      {
        id: 'baidu',
        name: '百度',
        url: 'https://www.baidu.com',
        icon: 'https://www.google.com/s2/favicons?domain=baidu.com&sz=64'
      },
      {
        id: 'bilibili',
        name: '哔哩哔哩',
        url: 'https://www.bilibili.com',
        icon: 'https://www.google.com/s2/favicons?domain=bilibili.com&sz=64'
      },
      {
        id: 'weibo',
        name: '微博',
        url: 'https://weibo.com',
        icon: 'https://www.google.com/s2/favicons?domain=weibo.com&sz=64'
      },
      {
        id: 'douyin',
        name: '抖音',
        url: 'https://www.douyin.com',
        icon: 'https://www.google.com/s2/favicons?domain=douyin.com&sz=64'
      },
      {
        id: 'weixin',
        name: '微信',
        url: 'https://weixin.qq.com',
        icon: 'https://www.google.com/s2/favicons?domain=weixin.qq.com&sz=64'
      },
      {
        id: 'csdn',
        name: 'CSDN',
        url: 'https://www.csdn.net',
        icon: 'https://www.google.com/s2/favicons?domain=csdn.net&sz=64'
      },
      {
        id: 'netease-music',
        name: '网易云音乐',
        url: 'https://music.163.com',
        icon: 'https://www.google.com/s2/favicons?domain=music.163.com&sz=64'
      },
      {
        id: 'tencent-video',
        name: '腾讯视频',
        url: 'https://v.qq.com',
        icon: 'https://www.google.com/s2/favicons?domain=v.qq.com&sz=64'
      },
      {
        id: 'douban',
        name: '豆瓣',
        url: 'https://www.douban.com',
        icon: 'https://www.google.com/s2/favicons?domain=douban.com&sz=64'
      },
      {
        id: 'meituan',
        name: '美团',
        url: 'https://www.meituan.com',
        icon: 'https://www.google.com/s2/favicons?domain=meituan.com&sz=64'
      }
    ]
  }
})

export default function useDockItems() {
  return useWxtStorage(dockItemsStorage)
}
