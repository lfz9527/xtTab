import { SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import googleIcon from '../assets/brand-icon/google-icon.png'
import baiduIcon from '../assets/brand-icon/baidu-icon.png'
import bingIcon from '../assets/brand-icon/bing-icon.png'
import githubIcon from '../assets/brand-icon/github-icon.png'
import juejinIcon from '../assets/brand-icon/juejin-icon.svg'

const engineIcons: Record<string, string> = {
  google: googleIcon,
  baidu: baiduIcon,
  bing: bingIcon,
  github: githubIcon,
  juejin: juejinIcon
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
  if (icon) {
    return <img src={icon} alt={name} className={imgClassName} />
  }
  return engineIcons[engineKey] ? (
    <img src={engineIcons[engineKey]} alt={name} className={imgClassName} />
  ) : (
    <SearchIcon className={cn('text-muted-foreground', imgClassName)} />
  )
}
