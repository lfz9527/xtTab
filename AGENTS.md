# xtTab — WXT + React 浏览器扩展

基于 WXT v0.20 的 Chrome 浏览器扩展，使用 React 19 + TypeScript。

## 项目

- **技术栈**: WXT 0.20, React 19, TypeScript, Vite, Vitest, TailwindCSS v4
- **包管理**: pnpm
- **入口**: `src/entries/` 下有 4 个 WXT 入口点 (`srcDir: 'src'`, `entrypointsDir: 'entries'`)
  - `src/entries/background/index.ts` → 转导出 `@/background`
  - `src/entries/content/index.tsx` → 注入 ShadowRoot React UI (matches `<all_urls>`)
  - `src/entries/sidePanel/index.html` → 引用 `@/sidePanel`
  - `src/entries/newTab/index.html` → 引用 `@/newTab/main.tsx` (替换新标签页)
- **路径别名**: `@` → `src/`
- **扩展权限**: `activeTab`、`tabs`、`sidePanel`、`storage`、`host_permissions: <all_urls>`
- **静态资源**: `public/` 存放不经过 Vite 处理的图片等 (如 `icon/`)

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
# 无 lint 脚本；需要时用 `pnpm exec eslint .`
```

测试文件匹配 `src/**/*.test.{ts,tsx}`。

## 架构

入口层 (`entries/`) 与实现层分离：`entries/*/` 仅做 re-export 或简单编排，实际逻辑在 `src/` 对应目录。

| 模块 | 位置 | 职责 |
|---|---|---|
| **background** | `src/background/` | Service Worker — 图标点击打开侧边栏、消息总线注册、suggest 搜索联想 API 代理 |
| **content** | `src/content/` | 注入页面的 React 组件 (ShadowRoot UI) |
| **sidePanel** | `src/sidePanel/` | 侧边栏面板 (React 应用) |
| **newTab** | `src/newTab/` | 新标签页 React 应用 (SearchBar + SuggestPopover + useSearchEngines) |
| **services** | `src/services/` | HTTP 请求封装 (Fetch 包装器 + Services 类)，支持请求取消与超时 |
| **messages** | `src/messages/` | 自定义消息总线 (`MessageBus` 单例) + Content 消息类，基于 `browser.runtime.onMessage` |
| **hooks** | `src/hooks/` | React Hooks — `useTabs` (标签页管理)、`useWxtStorage` (WXT storage 包装)、`useDebounceFn`/`useDebounceValue` (防抖)、`useLatest` (最新值引用)、`useUnmount` (卸载回调) |
| **constants** | `src/constants/` | 枚举定义体系 (`BaseEnumCls` 抽象类模式)、常量 |
| **types** | `src/types/` | 全局类型定义 (`anyObject`、`Response<T>`) |
| **utils** | `src/utils/` | 通用工具函数 |
| **lib** | `src/lib/` | shadcn 工具 (`cn` class 合并) |
| **styles** | `src/styles/` | 全局样式 (`globals.css`) |

## 约定

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
- **组件保护**: 严禁直接修改 `src/components/ui/` 下的 shadcn 组件源码。如需调整样式或行为，从外部传入 className 或封装 wrapper 组件。例外需经我明确同意。

## 备注

- 需求/设计文档位于 `docs/reasonix/plans/` 与 `docs/reasonix/specs/` (文档驱动开发)
