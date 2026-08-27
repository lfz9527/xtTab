import { useState } from 'react'
import uid from 'tiny-uid'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useSearchEngines from '../store/useSearchEngines'

/** 自定义搜索引擎添加弹窗：SettingsDialog 与引擎选择面板共用 */
export default function AddEngineDialog({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [engines, setEngines] = useSearchEngines()
  /** 新增引擎表单状态：名称/链接必填，图片链接选填 */
  const [newEngine, setNewEngine] = useState({ name: '', url: '', icon: '' })

  /** 添加搜索引擎 */
  const addEngine = () => {
    const name = newEngine.name.trim()
    const url = newEngine.url.trim()
    if (!name || !url) return
    setEngines({
      ...engines,
      list: [
        ...engines.list,
        {
          key: uid(),
          name,
          url,
          icon: newEngine.icon.trim() || undefined
        }
      ]
    })
    setNewEngine({ name: '', url: '', icon: '' })
    onOpenChange(false)
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayForceRender className='max-w-150 sm:max-w-150'>
        <DialogTitle>自定义搜索引擎</DialogTitle>
        <div className='flex flex-col gap-2'>
          <Input
            placeholder='名称'
            value={newEngine.name}
            onChange={(e) =>
              setNewEngine({ ...newEngine, name: e.target.value })
            }
          />
          <Input
            placeholder='链接（搜索地址，可用 %s 指定关键字位置，如 https://www.baidu.com/s?wd=%s）'
            value={newEngine.url}
            onChange={(e) =>
              setNewEngine({ ...newEngine, url: e.target.value })
            }
          />
          <Input
            placeholder='图片链接（可选）'
            value={newEngine.icon}
            onChange={(e) =>
              setNewEngine({ ...newEngine, icon: e.target.value })
            }
          />
        </div>
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={addEngine}
            disabled={!newEngine.name.trim() || !newEngine.url.trim()}
          >
            添加
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
