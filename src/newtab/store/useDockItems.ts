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

/** 生成 favicon 图标地址 */
const favicon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

/** 生成入口数据 */
const item = (id: string, name: string, domain: string): DockItem => ({
  id,
  name,
  url: `https://${domain}`,
  icon: favicon(domain)
})

/** 常用网站入口的默认数据（演示用 mock，共 50 个，均可在设置弹窗中增删改） */
const DEFAULT_DOCK_ITEMS: DockItem[] = [
  item('xiaohongshu', '小红书', 'www.xiaohongshu.com'),
  item('zhihu', '知乎', 'www.zhihu.com'),
  item('juejin', '掘金', 'juejin.cn'),
  item('taobao', '淘宝', 'www.taobao.com'),
  item('jd', '京东', 'www.jd.com'),
  item('baidu', '百度', 'www.baidu.com'),
  item('bilibili', '哔哩哔哩', 'www.bilibili.com'),
  item('weibo', '微博', 'weibo.com'),
  item('douyin', '抖音', 'www.douyin.com'),
  item('weixin', '微信', 'weixin.qq.com'),
  item('csdn', 'CSDN', 'www.csdn.net'),
  item('netease-music', '网易云音乐', 'music.163.com'),
  item('tencent-video', '腾讯视频', 'v.qq.com'),
  item('douban', '豆瓣', 'www.douban.com'),
  item('meituan', '美团', 'www.meituan.com'),
  item('tmall', '天猫', 'www.tmall.com'),
  item('pinduoduo', '拼多多', 'www.pinduoduo.com'),
  item('suning', '苏宁易购', 'www.suning.com'),
  item('vip', '唯品会', 'www.vip.com'),
  item('yanxuan', '网易严选', 'you.163.com'),
  item('eleme', '饿了么', 'www.ele.me'),
  item('dianping', '大众点评', 'www.dianping.com'),
  item('ctrip', '携程', 'www.ctrip.com'),
  item('qunar', '去哪儿', 'www.qunar.com'),
  item('fliggy', '飞猪', 'www.fliggy.com'),
  item('alipay', '支付宝', 'www.alipay.com'),
  item('mi', '小米商城', 'www.mi.com'),
  item('vmall', '华为商城', 'www.vmall.com'),
  item('youku', '优酷', 'www.youku.com'),
  item('iqiyi', '爱奇艺', 'www.iqiyi.com'),
  item('mgtv', '芒果TV', 'www.mgtv.com'),
  item('sohu', '搜狐', 'www.sohu.com'),
  item('sogou', '搜狗', 'www.sogou.com'),
  item('so360', '360搜索', 'www.so.com'),
  item('cctv', '央视网', 'www.cctv.com'),
  item('netease-news', '网易新闻', 'news.163.com'),
  item('ifeng', '凤凰网', 'www.ifeng.com'),
  item('thepaper', '澎湃新闻', 'www.thepaper.cn'),
  item('hupu', '虎扑', 'www.hupu.com'),
  item('huya', '虎牙直播', 'www.huya.com'),
  item('douyu', '斗鱼直播', 'www.douyu.com'),
  item('jianshu', '简书', 'www.jianshu.com'),
  item('imooc', '慕课网', 'www.imooc.com'),
  item('oschina', '开源中国', 'www.oschina.net'),
  item('segmentfault', 'SegmentFault', 'segmentfault.com'),
  item('v2ex', 'V2EX', 'www.v2ex.com'),
  item('cnblogs', '博客园', 'www.cnblogs.com'),
  item('51cto', '51CTO', 'www.51cto.com'),
  item('eastmoney', '东方财富', 'www.eastmoney.com'),
  item('xueqiu', '雪球', 'xueqiu.com')
]

const dockItemsStorage = storage.defineItem<DockItemsState>('local:dockItems', {
  fallback: { list: DEFAULT_DOCK_ITEMS }
})

export default function useDockItems() {
  return useWxtStorage(dockItemsStorage)
}
