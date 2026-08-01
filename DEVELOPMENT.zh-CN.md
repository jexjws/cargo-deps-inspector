# 开发指南

[English](./DEVELOPMENT.md) | [简体中文](./DEVELOPMENT.zh-CN.md)

本文档介绍仓库开发、验证、发布和网站部署。最终用户的使用方法请参阅[中文 README](./README.zh-CN.md)。

## 环境要求

- 根目录 `package.json` 的 engines 字段所接受的 Node.js 版本。
- 与根目录 `packageManager` 字段一致的 pnpm。
- 用于依赖分析和 fixture 工作区的 Rust 与 Cargo。
- 运行端到端测试时，需要通过 Playwright 安装 Chromium。
- 只有开发可选集成功能时才需要 `cargo-audit` 和 `cargo-outdated`。

## 仓库结构

- `packages/cargo-deps-inspector/`：CLI、Nuxt SPA 与 devframe RPC/MCP 服务。
- `packages/cargo-deps-tools/`：Cargo metadata 执行、解析、图结构与源码体积分析。
- `test/fixtures/cargo-workspace/`：开发和测试使用的 Rust 工作区。
- `test/e2e/`：Playwright 端到端测试。

## 安装与运行

```bash
pnpm install
pnpm dev
```

开发配置默认检查 `test/fixtures/cargo-workspace`。

开发不执行本机命令的浏览器导入版时，使用：

```bash
pnpm online:dev
```

## 命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动能够执行本机 Cargo 命令的完整开发服务器。 |
| `pnpm online:dev` | 启动纯浏览器 metadata 导入版。 |
| `pnpm build` | 构建所有工作区包与完整应用。 |
| `pnpm online:build` | 构建通用的纯浏览器应用。 |
| `pnpm pages:build` | 构建用于 Cloudflare Pages 的纯浏览器应用。 |
| `pnpm test` | 运行 Vitest 单元测试。 |
| `pnpm test:e2e` | 使用单 worker 运行 Playwright 端到端测试。 |
| `pnpm typecheck` | 运行 Vue 与 TypeScript 类型检查。 |
| `pnpm lint` | 运行仓库代码规范检查。 |

需要时先安装 Playwright 浏览器：

```bash
pnpm test:e2e:install
```

提交变更前，应按改动范围运行相应检查。完整的本地验证命令为：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## 构建模式

完整构建使用本机后端，可以执行 Cargo 命令。在线构建使用导入后端，只在浏览器内接收 Cargo metadata 或增强快照。

`pnpm pages:build` 会设置 `CDI_DEPLOY_TARGET=cloudflare-pages`，并将可部署站点写入：

```text
packages/cargo-deps-inspector/dist/public
```

Pages 专用构建会移除生成的顶层 `404.html`，让 Cloudflare Pages 启用 SPA 回退。其他构建模式仍然保留 Nuxt 生成的 404 页面。

在本地预览已完成的静态构建：

```bash
node test/e2e/utils/serve.mjs packages/cargo-deps-inspector/dist/public 4173
```

然后打开 `http://127.0.0.1:4173`。

## npm 与 GitHub Release

根目录发布命令用于更新工作区版本：

```bash
pnpm release
```

推送前需要检查生成的版本变更和标签。`v*` 标签到达 GitHub 后会触发 Release workflow：其中的可复用 Release job 使用 trusted publishing 发布 npm 包，Pages 部署会等待该任务成功。

## Cloudflare Pages 部署

Release workflow 使用 Cloudflare Pages Direct Upload，使 production 部署跟随成功发布，而不是跟随 `main` 的每次提交。缺少项目变量或任一 Cloudflare 仓库 Secret 时，部署会自动跳过，不影响 npm 发布。

### 一次性项目配置

创建项目名为 `cargo-deps-inspector`、production branch 为 `main` 的 Direct Upload 项目：

```bash
pnpm dlx wrangler@4.118.0 login
pnpm dlx wrangler@4.118.0 pages project create cargo-deps-inspector --production-branch=main
```

配置 GitHub 仓库变量：

```bash
gh variable set CLOUDFLARE_PAGES_PROJECT_NAME \
  --repo jexjws/cargo-deps-inspector \
  --body cargo-deps-inspector
```

配置以下 GitHub 仓库 Secret：

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID \
  --repo jexjws/cargo-deps-inspector

gh secret set CLOUDFLARE_API_TOKEN \
  --repo jexjws/cargo-deps-inspector
```

API Token 只需 `Account / Cloudflare Pages / Edit` 权限。工作流会把部署地址记录到 `cloudflare-pages` GitHub environment。自定义域名需要在 Pages 项目的 Custom domains 中单独配置。

### Release 部署顺序

```text
推送 v* 标签
    -> npm 与 GitHub Release 成功
    -> 构建并验证纯浏览器 SPA
    -> 将同一标签对应的提交部署到 Pages production
```
