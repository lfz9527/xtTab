---
name: xttab-release
description: xtTab 浏览器扩展（WXT + React）的发版流程。当用户有明确的发版意图（如说"发版"、"发布插件"、"打版本"、"升版本"、"release"、"打包上传"、"上传商店"）时使用。涵盖版本号确认、version-log.md 更新、类型检查、zip 打包（默认 Chrome+Edge，Firefox 需指定）、git 提交与 tag。
---

# xtTab 插件发版

xtTab（WXT 0.20 + React 浏览器扩展）发布新版本的完整流程。一次发版 = 确认版本号 → 更新版本信息 → 构建打包 → git 提交与打 tag → 交付 zip。

## 发版前确认

动手前先确认两件事，避免打错版本或打错平台：

1. **版本号**：读取 `package.json` 的 `version` 字段，按 semver 规则给出建议递增（默认 patch+1，新增功能 minor+1，破坏性变更 major+1），与用户确认后再改。正式版本号格式为 `<semver>-g<当前 git HEAD 短 hash>`（如 `1.0.2-g4f8125337`），`-g` 后接发版时 `git rev-parse --short HEAD` 得到的短 hash，可溯源到具体提交。
2. **目标浏览器**：
   - 用户未声明 → 默认 Chrome + Edge（二者均为 mv3，打包指令一致）
   - 用户声明 Firefox → 追加 Firefox 打包（mv2）
   - 用户声明单个浏览器 → 只打该浏览器

## 发版流程

### 1. 前置检查

```bash
pnpm compile
```

类型检查必须通过才能继续，报错先修复。若本次变更涉及业务逻辑且项目存在相关测试用例，再执行 `pnpm test`（不是每次发版都必须跑）。

### 2. 更新版本号

执行 `git rev-parse --short HEAD` 取当前提交短 hash，与确认后的 semver 版本号拼接为 `<semver>-g<短hash>`，修改 `package.json` 的 `version` 字段（如 `1.0.2-g4f8125337`）。WXT 构建时自动把 manifest 的正式 `version` 简化为纯数字 `1.0.2`（商店要求），`version_name` 保留完整带 hash 后缀。

### 3. 更新版本日志

在 `version-log.md` 顶部新增版本章节，格式参照已有 v1.0.0 记录：

```markdown
## vX.Y.Z

### 分类

- 变更点 1
- 变更点 2
```

分类按功能模块（如"搜索"、"书签"、"设置"、"其他"），条目从本次发版涉及的实际变更中提炼（参考最近的 git 提交），不要空写。

### 4. 构建打包

```bash
pnpm zip            # Chrome → .output/xttab-<version>-chrome.zip
pnpm zip -b edge    # Edge   → .output/xttab-<version>-edge.zip
# 用户指定 Firefox 时：
pnpm zip -b firefox # Firefox → .output/xttab-<version>-firefox.zip
```

注意：`wxt zip` 一次只打一个浏览器，多平台必须分别执行（Chrome 与 Edge 打包指令一致，Firefox 用 `-b firefox`）。产物统一在 `.output/` 目录，命名规则为 `xttab-<version>-<browser>.zip`，其中 `<version>` 是带 hash 的完整版本号（如 `xttab-1.0.2-g4f8125337-chrome.zip`）。先更新版本号再打包，否则 zip 文件名还是旧版本。

### 5. Git 提交与打 tag

遵循 `leju_git_conventions` / `git-conventions` skill 的规范：

1. 逐个暂存 `package.json`、`version-log.md`（禁止 `git add .`），如有其他本次发版相关文件一并暂存
2. 提交类型用 `release:`，主题含版本号，要点说明具体变更，例如：

   ```
   release: v1.0.2 发版

   - 更新 package.json 版本号至 1.0.2-g4f8125337
   - version-log.md 新增 v1.0.2 版本记录
   - 构建并打包 Chrome/Edge zip 产物
   ```

3. 提交前将完整提交信息展示给用户确认
4. 打 tag：`git tag vX.Y.Z`（用纯 semver 版本号，不带 hash 后缀——tag 指向发版提交，提交 hash 即 version 后缀 hash，tag 已能完整定位）
5. 推送：`git push && git push --tags`

### 6. 交付

打包与推送完成后，向用户说明 zip 产物位置并提示手动上传：

- Chrome Web Store：上传 `.output/xttab-<version>-chrome.zip`
- Edge Add-ons 商店：上传 `.output/xttab-<version>-edge.zip`

## 注意事项

- 不要改 `wxt.config.ts` 中 manifest 的 `__MSG_extName__` / `__MSG_extDescription__` 占位符，也不要在发版时顺手调整无关代码
- 不要手动编辑 `.output/` 下的构建产物，zip 由 `wxt zip` 生成
- 版本号必须在打包前更新，zip 文件名、manifest 版本均取自 package.json
