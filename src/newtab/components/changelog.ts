/** 版本日志条目分类 */
export interface ChangelogCategory {
  name: string
  items: string[]
}

/** 单个版本章节 */
export interface ChangelogVersion {
  version: string
  categories: ChangelogCategory[]
}

/**
 * 解析 version-log.md 文本为结构化版本数据
 * 支持格式：## 版本号 / ### 分类 / - 条目，标题与空行忽略
 */
export function parseChangelog(markdown: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = []
  let currentCategory: ChangelogCategory | null = null

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      const version: ChangelogVersion = {
        version: trimmed.slice(3),
        categories: []
      }
      versions.push(version)
      currentCategory = null
    } else if (trimmed.startsWith('### ') && versions.length) {
      const category: ChangelogCategory = { name: trimmed.slice(4), items: [] }
      currentCategory = category
      versions[versions.length - 1].categories.push(category)
    } else if (trimmed.startsWith('- ') && currentCategory) {
      currentCategory.items.push(trimmed.slice(2))
    }
  }
  return versions
}
