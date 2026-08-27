import changelogMd from '@@/version-log.md?raw'
import { parseChangelog } from './changelog'

/**
 * 更新日志面板
 * 打包根目录 version-log.md（发版时维护的唯一数据源），按版本从新到旧展示
 */
export default function ChangelogPanel() {
  const versions = parseChangelog(changelogMd)

  return (
    <div className='flex flex-col gap-4 pr-3'>
      {versions.map((v) => (
        <div
          key={v.version}
          className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4'
        >
          <span className='text-sm font-medium text-foreground'>
            {v.version}
          </span>
          {v.categories.map((c) => (
            <div key={c.name} className='flex flex-col gap-1.5'>
              <span className='text-xs text-muted-foreground'>{c.name}</span>
              <ul className='list-disc space-y-1 pl-4 text-sm text-foreground'>
                {c.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
