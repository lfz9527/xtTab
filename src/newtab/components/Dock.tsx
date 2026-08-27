import baiduIcon from '../assets/brand-icon/baidu-icon.png'
import juejinIcon from '../assets/brand-icon/juejin-icon.svg'
import taobaoIcon from '../assets/brand-icon/taobao-icon.svg'
import jdIcon from '../assets/brand-icon/jd-icon.svg'
import xiaohongshuIcon from '../assets/brand-icon/xiaohongshu-icon.svg'

/** 入口基础尺寸（px） */
const BASE_SIZE = 48
/** 图标（favicon）尺寸 */
const ICON_SIZE = 36

/** Mock 数据：常用网站 Dock 入口（演示用硬编码，后续可替换为真实配置），全部为国内网站 */
const DOCK_ITEMS = [
  { name: '小红书', url: 'https://www.xiaohongshu.com', icon: xiaohongshuIcon },
  {
    name: '知乎',
    url: 'https://www.zhihu.com',
    icon: 'https://www.google.com/s2/favicons?domain=zhihu.com&sz=64'
  },
  { name: '掘金', url: 'https://juejin.cn', icon: juejinIcon },
  { name: '淘宝', url: 'https://www.taobao.com', icon: taobaoIcon },
  { name: '京东', url: 'https://www.jd.com', icon: jdIcon },
  { name: '百度', url: 'https://www.baidu.com', icon: baiduIcon },
  {
    name: '哔哩哔哩',
    url: 'https://www.bilibili.com',
    icon: 'https://www.google.com/s2/favicons?domain=bilibili.com&sz=64'
  },
  {
    name: '微博',
    url: 'https://weibo.com',
    icon: 'https://www.google.com/s2/favicons?domain=weibo.com&sz=64'
  },
  {
    name: '抖音',
    url: 'https://www.douyin.com',
    icon: 'https://www.google.com/s2/favicons?domain=douyin.com&sz=64'
  },
  {
    name: '微信',
    url: 'https://weixin.qq.com',
    icon: 'https://www.google.com/s2/favicons?domain=weixin.qq.com&sz=64'
  },
  {
    name: 'CSDN',
    url: 'https://www.csdn.net',
    icon: 'https://www.google.com/s2/favicons?domain=csdn.net&sz=64'
  },
  {
    name: '网易云音乐',
    url: 'https://music.163.com',
    icon: 'https://www.google.com/s2/favicons?domain=music.163.com&sz=64'
  },
  {
    name: '腾讯视频',
    url: 'https://v.qq.com',
    icon: 'https://www.google.com/s2/favicons?domain=v.qq.com&sz=64'
  },
  {
    name: '豆瓣',
    url: 'https://www.douban.com',
    icon: 'https://www.google.com/s2/favicons?domain=douban.com&sz=64'
  },
  {
    name: '美团',
    url: 'https://www.meituan.com',
    icon: 'https://www.google.com/s2/favicons?domain=meituan.com&sz=64'
  }
]

type DockItem = (typeof DOCK_ITEMS)[number]

// 放大倍率 1.3 沿用此前 JS 方案确认的手感，Tailwind 无对应标准 token，故使用任意值 hover:scale-[1.3]
/** 单个 Dock 图标：纯 CSS hover 放大缩小，悬停显示名称气泡 */
function DockItem({ item }: { item: DockItem }) {
  return (
    <li className='group relative flex items-end hover:z-10'>
      <a
        href={item.url}
        target='_blank'
        rel='noreferrer'
        aria-label={item.name}
        className='flex origin-bottom items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.3]'
        style={{ width: BASE_SIZE, height: BASE_SIZE }}
      >
        <img
          src={item.icon}
          alt={item.name}
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
        />
      </a>
      <span className='pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/75 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100'>
        {item.name}
      </span>
    </li>
  )
}

/** 新标签页底部 Mac Dock 风格常用网站入口（fixed 定位，不占文档流） */
export default function Dock() {
  return (
    <nav
      aria-label='常用网站'
      className='fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-3xl border border-white/30 bg-white/25 px-5 py-3 shadow-lg backdrop-blur-2xl'
    >
      <ul className='flex items-end gap-2.5'>
        {DOCK_ITEMS.map((item) => (
          <DockItem key={item.url} item={item} />
        ))}
      </ul>
    </nav>
  )
}
