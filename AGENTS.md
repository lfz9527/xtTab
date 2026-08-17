# xtTab — WXT + React 浏览器扩展

基于 WXT v0.20 的 Chrome 浏览器扩展，使用 React 19 + TypeScript。

## 项目

- **技术栈**: WXT 0.20, React 19, TypeScript, Vite, Vitest, TailwindCSS v4
- **包管理**: pnpm
- **入口**: `src/entries/` 下有 3 个 WXT 入口点 (`srcDir: 'src'`, `entrypointsDir: 'entries'`)
  - `src/entries/background/index.ts` → 转导出 `@/background`
  - `src/entries/newtab/index.html` → 引用 `@/newTab/main.tsx` (替换新标签页)
  - `src/entries/content/index.tsx` → content script (匹配 `<all_urls>`，通过 `createShadowRootUi` 挂载 Shadow DOM UI)
- **路径别名**: `@` → `src/`
- **扩展权限**: `tabs`、`storage`、`bookmarks`、`host_permissions: <all_urls>`
- **国际化**: `default_locale: 'zh_CN'`，语言包位于 `public/_locales/zh_CN/messages.json`；manifest 的 `name`/`description` 使用 `__MSG_extName__`/`__MSG_extDescription__` 占位符，勿直接改回字面文本
- **静态资源**: `public/` 存放不经过 Vite 处理的图片等 (如 `icon/`)
- **发版**: 遵循 `.agents/skills/xttab-release` skill —— 打包后通过 `wxt submit` 自动提交商店审核；商店 API 凭证存于 `.env.submit`（含密钥，已 gitignore 禁止提交，模板见 `.env.submit.example`）

## 命令

```bash
pnpm dev             # 启动开发服务器 (Chrome)
pnpm dev:firefox     # 启动开发服务器 (Firefox)
pnpm build           # 构建生产版本
pnpm build:firefox   # 构建 Firefox 版本
pnpm zip             # 打包 .zip
pnpm zip:firefox     # 打包 Firefox 版本 .zip
pnpm compile         # tsc 类型检查
pnpm test            # vitest 运行测试
pnpm openapi         # 从 swagger 重新生成 src/services/ 接口代码
pnpm clear           # 清除 node_modules + pnpm-lock.yaml
# postinstall 自动执行 wxt prepare（生成 .wxt/ 类型声明）
# 无 lint 脚本；需要时用 `pnpm exec eslint .`
```

测试文件匹配 `src/**/*.test.{ts,tsx}`。

## 架构

入口层 (`entries/`) 与实现层分离：`entries/*/` 仅做 re-export 或简单编排，实际逻辑在 `src/` 对应目录。

| 模块 | 位置 | 职责 |
| --- | --- | --- |
| **background** | `src/background/` | Service Worker — 消息总线注册、suggest 搜索联想 API 代理 |
| **newTab** | `src/newTab/` | 新标签页 React 应用 (SearchBar + SuggestPopover + BookmarkDialog + SettingsDialog + AddEngineDialog + store/ 配置存储) |
| **components** | `src/components/` | shadcn UI 组件 (`ui/` 目录，受组件保护约定约束) |
| **services** | `src/services/` | HTTP 请求封装 (`fetch.ts` Fetch 包装器 + `index.ts` Services 类)，支持请求取消与超时；`pnpm openapi` 从 swagger 重新生成 |
| **messages** | `src/messages/` | 自定义消息总线 (`MessageBus` 单例) + Content 消息类，基于 `browser.runtime.onMessage` |
| **content** | `src/entries/content/` + `src/content/` | content script — 入口编排 (createShadowRootUi 挂载 Shadow DOM、注册 `@/messages/content` 监听、GitLab 回复模板)，实际组件在 `src/content/` |
| **hooks** | `src/hooks/` | React Hooks — `useTabs` (标签页管理)、`useWxtStorage` (WXT storage 包装)、`useDebounceFn`/`useDebounceValue` (防抖)、`useThrottledFn` (节流)、`useEventListener` (通用事件监听)、`useComposing` (中文输入法组合状态)、`useLatest` (最新值引用)、`useUnmount` (卸载回调)、`useCommand` (键盘快捷键)、`useTimeout` (定时器) |
| **constants** | `src/constants/` | 枚举定义体系 (`BaseEnumCls` 抽象类模式)、常量 |
| **types** | `src/types/` | 全局类型定义 (`anyObject`、`Response<T>`) |
| **utils** | `src/utils/` | 通用工具函数 |
| **lib** | `src/lib/` | shadcn 工具 (`cn` class 合并) |
| **styles** | `src/styles/` | 全局样式 (`globals.css`) |

## 约定

- **WXT 自动导入**: `defineBackground`、`browser`、React hooks (`useState`/`useEffect` 等) 无需显式 import，由 WXT 自动生成 (类型声明在 `.wxt/`)
- **状态管理**: `zustand` — `src/newTab/store/` 下的 `use*.ts` store 均为 zustand 写法；`useWxtStorage` hook 负责持久化读写
- **缩进**: 2 空格 (EditorConfig + Prettier) — 注意部分历史文件 (如 `src/background/index.ts`) 为 4 空格，改动时遵循配置
- **引号**: 单引号 (`singleQuote: true`)，JSX 也用单引号 (`jsxSingleQuote: true`)
- **分号**: 无分号 (`semi: false`)
- **尾逗号**: 无 (`trailingComma: 'none'`)
- **行宽**: 80 字符 (`printWidth: 80`)
- **换行**: LF (`endOfLine: 'lf'`)
- **导入别名**: 使用 `@/` 引入 `src/` 下模块
- **枚举模式**: 使用 `BaseEnumCls` 抽象类 + `toArray()`/`get()` 静态方法，而非原生 `enum`
- **命名**: TypeScript 文件使用 `.ts`/`.tsx`；组件文件名小写开头 (如 `useTabs.tsx`、`base.ts`)
- **测试**: Vitest，放置在 `src/**/*.test.{ts,tsx}`，使用 `WxtVitest` 插件
- **WXT 配置**: `wxt.config.ts`，入口目录为 `entries/`，React 模块通过 `@wxt-dev/module-react`
- **组件库**: shadcn v4 (`components.json` 配置，`base-nova` 风格)，图标用 `lucide-react`，工具类用 `cva` (class-variance-authority)
- **组件优先级**: UI 元素优先使用 `src/components/ui/` 下已有的 shadcn 组件，不重复封装；仅当 `ui/` 无现成组件且不适合新增时，才使用原生 Tailwind 或其他方式实现
- **antd 使用**: 已引入 `antd` 依赖，但**仅使用它的 `Masonry` 瀑布流组件**（`import { Masonry } from 'antd'`，数据驱动：`items` + `itemRender`，支持响应式 `columns`/`gutter`）；antd 的其他组件（Button、message、Layout 等）一律不使用，按钮等 UI 元素统一用项目封装组件（shadcn `src/components/ui/`）或原生 Tailwind，不再引入其他瀑布流库
- **组件保护**: 如需修改 `src/components/ui/` 下的 shadcn 组件源码，必须先征得我同意，并明确列出修改内容，经我二次确认后方可执行。默认优先从外部传入 className 或封装 wrapper 组件。
- **TailwindCSS**: 优先使用 Tailwind 规范类（如 `max-w-175`）而非任意值（如 `max-w-[700px]`），避免触发 `tailwindcss(suggestCanonicalClasses)` 警告。若必须使用任意值，需添加注释说明原因
- **类型校验**: 禁止使用 `@ts-ignore`、`@ts-nocheck`、`eslint-disable` 等方式跳过 TypeScript 或 ESLint 类型校验

## Git

- **提交规范**: 遵循 `leju_git_conventions` skill —— 提交信息格式 `<type>: <主题>` + 3-6 条动词开头的要点，分支命名 `<userSlug>/<type>/<snake_keywords>`（仅用下划线，禁短横线）；禁止 `git add .`/`-A` 通配暂存，需过滤后逐个暂存；commit 前必须将完整提交信息展示给用户确认后方可执行
