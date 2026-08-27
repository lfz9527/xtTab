import { useState } from 'react'
import uid from 'tiny-uid'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useDockItems, { type DockItem } from '../store/useDockItems'

/**
 * 添加/编辑常用入口弹窗：名称/链接必填，图片链接选填
 * editingItem 传入时进入编辑模式（按 id 更新），否则为添加模式
 * 表单按 editingItem 初始化；组件由外部 key 控制重挂载，确保每次打开都重新初始化
 */
export default function AddDockItemDialog({
  open,
  onOpenChange,
  editingItem
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 编辑目标；null/undefined 时为添加模式 */
  editingItem?: DockItem | null
}) {
  const [dockItems, setDockItems] = useDockItems()
  const [form, setForm] = useState({
    name: editingItem?.name ?? '',
    url: editingItem?.url ?? '',
    icon: editingItem?.icon ?? ''
  })

  const saveItem = () => {
    const name = form.name.trim()
    const url = form.url.trim()
    if (!name || !url) return
    const icon = form.icon.trim() || undefined
    if (editingItem) {
      setDockItems({
        ...dockItems,
        list: dockItems.list.map((item) =>
          item.id === editingItem.id ? { ...item, name, url, icon } : item
        )
      })
    } else {
      setDockItems({
        ...dockItems,
        list: [...dockItems.list, { id: uid(), name, url, icon }]
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayForceRender className='max-w-150 sm:max-w-150'>
        <DialogTitle>
          {editingItem ? '编辑常用入口' : '添加常用入口'}
        </DialogTitle>
        <div className='flex flex-col gap-2'>
          <Input
            placeholder='名称'
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder='链接（如 https://www.baidu.com）'
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <Input
            placeholder='图片链接（可选）'
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
        </div>
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={saveItem}
            disabled={!form.name.trim() || !form.url.trim()}
          >
            {editingItem ? '保存' : '添加'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
