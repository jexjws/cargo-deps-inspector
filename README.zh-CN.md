![Cargo Deps Inspector](./packages/cargo-deps-inspector/src/public/favicon.svg)

# Cargo Deps Inspector

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

[English](./README.md) | 简体中文

Cargo 依赖图可视化与诊断工具。Cargo Deps Inspector 以 `cargo metadata --format-version=1` 为唯一解析来源，支持工作区、feature、target、依赖种类、包来源、重复版本和本地源码体积分析。

[打开纯浏览器在线应用](https://cargo-deps-inspector.pages.dev/)

## 功能

- 通过 grid、graph、chart、compare 和 reports 五类视图探索依赖。
- 检查已解析的 feature、target、普通/构建/开发依赖和包来源。
- 查找被解析为多个版本的同名 crate。
- 按 Rust 源码、测试、文档和其他文件统计本地 crate 源码体积。
- 通过 `cargo-audit` 和 `cargo-outdated` 按需生成 RustSec 与过期依赖报告。
- 导出离线静态站点，或者在纯浏览器应用中导入元数据。
- 通过 MCP 向 Agent 提供只读报告。
- 使用 English 或简体中文界面。

## 快速开始

本项目通过 npm 包分发，但只分析 Cargo/Rust 项目：

```bash
# 切换到 Cargo.toml 所在的文件夹后运行
pnpm dlx cargo-deps-inspector
# 或
npx cargo-deps-inspector
# 或
bunx cargo-deps-inspector
```

如果 `cargo-deps-inspector` 已在 `PATH` 中，也可以使用 Cargo 外部子命令形式：

```bash
cargo deps-inspector
```

默认会执行带 `--locked` 的 `cargo metadata`，因此不会创建或修改 `Cargo.lock`。确实允许 Cargo 更新锁文件时，必须显式传入 `--no-locked`。

常用依赖解析参数：

```bash
cargo deps-inspector --features serde,cli
cargo deps-inspector --all-features
cargo deps-inspector --no-default-features
cargo deps-inspector --filter-platform x86_64-unknown-linux-gnu
cargo deps-inspector --offline
cargo deps-inspector --manifest-path crates/app/Cargo.toml
```

基础依赖图只读取 Cargo 元数据与本机 crate 源码，不依赖 `cargo-audit` 或 `cargo-outdated`。

## 配置

在项目根目录创建 `cargo-deps-inspector.config.ts`：

```ts
import { defineConfig } from 'cargo-deps-inspector'

export default defineConfig({
  name: 'my-rust-workspace',
  cargo: {
    locked: true,
    features: ['cli'],
    filterPlatform: 'x86_64-unknown-linux-gnu',
  },
  excludePackages: ['windows-*'],
  externalTools: {
    audit: { noFetch: true },
    outdated: { offline: true },
  },
})
```

命令行显式参数优先于配置文件。`excludePackages` 与 `excludeDependenciesOf` 支持 crate 名称、`name@semver` 选择器、通配符和谓词函数。

## CLI 报告

```bash
cargo deps-inspector report duplicates
cargo deps-inspector report source-sizes --limit 20
cargo deps-inspector report audit
cargo deps-inspector report outdated
```

所有报告均支持 `--json`。JSON 模式下结果写入 stdout，进度写入 stderr，可以安全接入 `jq` 或 CI 管道。

- `duplicates`：同名 crate 被解析为多个版本。
- `source-sizes`：按 Rust 源码、测试、文档和其他文件统计本地 crate 目录体积。
- `audit`：按需调用 `cargo audit --json` 并展示 RustSec 结果。
- `outdated`：按需调用 `cargo outdated --workspace --format json`。

后两项是可选集成。工具未安装时，检查器会返回安装指引，基础图谱仍可正常使用：

```bash
cargo install cargo-audit --locked
cargo install cargo-outdated --locked
```

## 快照与浏览器导入

纯浏览器应用无法执行 Cargo，需要导入原始 Cargo metadata 或增强快照：

```bash
cargo metadata --format-version=1 > metadata.json
cargo deps-inspector snapshot snapshot.json --yes
cargo deps-inspector snapshot snapshot.json --audit --outdated --yes
```

增强快照保留源码体积和可选报告，也会包含 Cargo 返回的绝对路径。交互式导出前会显示隐私确认；非 TTY 环境必须显式传入 `--yes`。分享快照前请检查文件内容。

导入的文件只在浏览器本地解析，不会上传到服务器。

## 静态导出

```bash
cargo deps-inspector build --out-dir dist/cargo-deps
```

该命令生成可由任意静态服务器托管的 SPA，并内嵌当前 Cargo 图谱。`cargo-audit` 与 `cargo-outdated` 仍然只会按需执行；生成的站点不会尝试运行本机命令。

## MCP

```bash
cargo deps-inspector mcp
```

devframe 的 stdio MCP 适配器会公开以下只读工具：

- `cargo-deps-inspector:report-duplicates`
- `cargo-deps-inspector:report-source-sizes`
- `cargo-deps-inspector:report-audit`
- `cargo-deps-inspector:report-outdated`

同一进程内会缓存 Cargo 图谱与外部报告；传入 `force` 可以刷新按需报告。

## 文档

- [开发、测试、发布与部署指南](./DEVELOPMENT.zh-CN.md)
- [Development guide](./DEVELOPMENT.md)

## 致谢

本项目最初由 `gpt-5.6-sol xhigh` 协助，基于 [Node Modules Inspector](https://github.com/antfu/node-modules-inspector) 改造而来；界面与架构保留了原项目及 devframe 的重要设计经验。

## 许可证

[MIT](./LICENSE.md)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/cargo-deps-inspector?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/cargo-deps-inspector
[npm-downloads-src]: https://img.shields.io/npm/dm/cargo-deps-inspector?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/cargo-deps-inspector
