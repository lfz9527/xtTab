---
name: xttab-release
description: xtTab 浏览器扩展（WXT + React）的发版流程。当用户有明确的发版意图（如说"发版"、"发布插件"、"打版本"、"升版本"、"release"、"打包上传"、"上传商店"）时使用。涵盖版本号确认、version-log.md 更新、类型检查、zip 打包（默认 Chrome+Edge，Firefox 需指定）、wxt submit 自动上传商店审核、git 提交与 tag。
---

# xtTab 插件发版

xtTab（WXT 0.20 + React 浏览器扩展）发布新版本的完整流程。一次发版 = 确认版本号 → 更新版本信息 → 构建打包 → wxt submit 自动上传商店 → git 提交与打 tag → 交付说明。

## 发版前确认

动手前先确认三件事，避免打错版本、打错平台或漏配凭证：

1. **版本号**：读取 `package.json` 的 `version` 字段，按 semver 规则给出建议递增（默认 patch+1，新增功能 minor+1，破坏性变更 major+1），与用户确认后再改。正式版本号格式为 `<semver>-g<当前 git HEAD 短 hash>`（如 `1.0.2-g4f8125337`），`-g` 后接发版时 `git rev-parse --short HEAD` 得到的短 hash，可溯源到具体提交。
2. **目标浏览器**：
   - 用户未声明 → 默认 Chrome + Edge（二者均为 mv3，打包指令一致）
   - 用户声明 Firefox → 追加 Firefox 打包（mv2）
   - 用户声明单个浏览器 → 只打该浏览器
3. **商店凭证**：检查项目根目录的 `.env.submit` 是否存在（`wxt submit` 自动读取该文件中的凭证）。不存在说明尚未配置，需先执行 `pnpm exec wxt submit init` 按交互提示一次性配置各商店 API 凭证——Chrome 需 Extension ID + OAuth Client ID/Secret + Refresh Token（Google Cloud 创建），Firefox 需 Extension ID + JWT Issuer/Secret，Edge 需 Product ID + Client ID + API Key（v1.1）。配置完成后 `.env.submit` 本地持久化，后续发版无需重复配置；凭证文件已 gitignore，禁止提交。

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

### 5. 自动上传商店

打包完成后通过 `wxt submit` 自动提交各商店审核（前置：`.env.submit` 凭证已配置，见"发版前确认"）。

1. 先 dry-run 验证凭证与参数（只检查认证，不真实上传）：

   ```bash
   pnpm exec wxt submit --dry-run \
     --chrome-zip .output/xttab-<version>-chrome.zip \
     --edge-zip .output/xttab-<version>-edge.zip
   ```

   用户指定 Firefox 时追加 `--firefox-zip` 与 `--firefox-sources-zip`（`pnpm zip -b firefox` 默认自动生成 sources zip，命名无浏览器后缀）：

   ```bash
   pnpm exec wxt submit --dry-run \
     --chrome-zip .output/xttab-<version>-chrome.zip \
     --edge-zip .output/xttab-<version>-edge.zip \
     --firefox-zip .output/xttab-<version>-firefox.zip \
     --firefox-sources-zip .output/xttab-<version>-sources.zip
   ```

2. dry-run 通过后，将本次要提交的商店与 zip 路径展示给用户确认，确认后去掉 `--dry-run` 正式执行：

   ```bash
   pnpm exec wxt submit \
     --chrome-zip .output/xttab-<version>-chrome.zip \
     --edge-zip .output/xttab-<version>-edge.zip
   # 用户指定 Firefox 时追加 --firefox-zip 与 --firefox-sources-zip（路径同上）
   ```

`wxt submit` 会真实上传 zip 并提交商店审核，审核通过后自动发布上线；正式提交前必须经用户确认。

### 6. Git 提交与打 tag

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

### 7. 交付

自动上传与 git 推送完成后，向用户说明：

- 扩展已通过 `wxt submit` 提交各商店审核，审核通过后自动发布上线，无需再手动上传
- 如需查看审核进度，前往 Chrome Web Store / Edge Add-ons / Firefox Add-ons 开发者后台

## 注意事项

- 不要改 `wxt.config.ts` 中 manifest 的 `__MSG_extName__` / `__MSG_extDescription__` 占位符，也不要在发版时顺手调整无关代码
- 不要手动编辑 `.output/` 下的构建产物，zip 由 `wxt zip` 生成
- 版本号必须在打包前更新，zip 文件名、manifest 版本均取自 package.json
- `.env.submit` 含各商店 API 密钥，已加入 `.gitignore`，严禁提交入库；只在本地保留
- `wxt submit` 是真实上传到商店的外部动作（去掉 `--dry-run` 后不可撤回），正式提交前必须先用 `--dry-run` 验证凭证，并将要提交的商店与 zip 展示给用户确认
- Firefox 打包默认自动生成 sources zip（`xttab-<version>-sources.zip`，无浏览器后缀），Firefox 提交时必须同时传 `--firefox-zip` 与 `--firefox-sources-zip`
