# xtTab — WXT + React 浏览器扩展

基于 WXT v0.20 的 Chrome 浏览器扩展，使用 React 19 + TypeScript。

## 项目

- **技术栈**: WXT 0.20, React 19, TypeScript, Vite, Vitest
- **包管理**: pnpm
- **入口**: `src/entries/` 下有 `background/` (后台脚本)、`content/` (内容脚本)、`sidePanel/` (侧边栏)
  - `src/entries/background/index.ts` → 转导出 `@/background`
  - `src/entries/content/index.tsx` → 注入 React 根节点 (ShadowRoot UI)
  - `src/entries/sidePanel/index.html` → 引用 `@/sidePanel`
- **路径别名**: `@` → `src/`
- **扩展权限**: `activeTab`、`tabs`、`sidePanel`、`storage`

## 命令

```bash
pnpm dev             # 启动开发服务器 (Chrome)
pnpm dev:firefox     # 启动开发服务器 (Firefox)
pnpm build           # 构建生产版本
pnpm build:firefox   # 构建 Firefox 版本
pnpm zip             # 打包 .zip
pnpm compile         # tsc 类型检查
pnpm test            # vitest 运行测试
pnpm lint            # (通过 ESLint)
```

测试文件匹配 `src/**/*.test.{ts,tsx}`。

## 架构

| 模块 | 位置 | 职责 |
|---|---|---|
| **entries (入口)** | `src/entries/` | WXT 入口点 — background / content / sidePanel |
| **background** | `src/background/` | Service Worker 后台逻辑 |
| **content** | `src/content/` | 注入页面的 React 内容脚本 (ShadowRoot UI) |
| **sidePanel** | `src/sidePanel/` | 侧边栏面板 (React 应用) |
| **services** | `src/services/` | HTTP 请求封装 (Fetch 包装器 + Services 类)，支持请求取消 |
| **messages** | `src/messages/` | 基于 `@webext-core/messaging` 的跨上下文消息总线 (content ↔ background ↔ sidePanel) |
| **hooks** | `src/hooks/` | React Hooks — `useTabs` (管理标签页)、`useWxtStorage` (WXT storage 包装) |
| **constants** | `src/constants/` | 枚举定义体系 (`BaseEnumCls` 抽象类模式)、常量 |
| **types** | `src/types/` | 全局类型定义 (`anyObject`、`Response<T>`) |
| **utils** | `src/utils/` | 通用工具函数 |

## 约定

- **缩进**: 2 空格 (EditorConfig + Prettier)
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

## 备注

(留空供后续补充)
