import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import googleIcon from '../assets/brand-icon/google-icon.png'
import baiduIcon from '../assets/brand-icon/baidu-icon.png'
import bingIcon from '../assets/brand-icon/bing-icon.png'
import githubIcon from '../assets/brand-icon/github-icon.png'
import juejinIcon from '../assets/brand-icon/juejin-icon.svg'
import taobaoIcon from '../assets/brand-icon/taobao-icon.svg'
import jdIcon from '../assets/brand-icon/jd-icon.svg'
import xiaohongshuIcon from '../assets/brand-icon/xiaohongshu-icon.svg'

const engineIcons: Record<string, string> = {
  google: googleIcon,
  baidu: baiduIcon,
  bing: bingIcon,
  github: githubIcon,
  juejin: juejinIcon,
  taobao: taobaoIcon,
  jd: jdIcon,
  xiaohongshu: xiaohongshuIcon
}

/** 渲染引擎图标：优先自定义图片链接，其次内置品牌图标，最后默认 Search 图标 */
export default function EngineIcon({
  engineKey,
  name,
  icon,
  className
}: {
  engineKey: string
  name: string
  /** 自定义图标图片链接 */
  icon?: string
  className?: string
}) {
  const imgClassName = className ?? 'size-5'
  const src = icon ?? engineIcons[engineKey]
  return (
    <span className='flex size-9 items-center justify-center rounded-md bg-white'>
      {src ? (
        <img src={src} alt={name} className={imgClassName} />
      ) : (
        <SearchIcon className={cn('text-muted-foreground', imgClassName)} />
      )}
    </span>
  )
}
