![Cargo Deps Inspector](./packages/cargo-deps-inspector/src/public/favicon.svg)

# Cargo Deps Inspector

Cargo 依赖图可视化与诊断工具。它以 `cargo metadata --format-version=1` 为唯一解析来源，支持工作区、feature、target、依赖种类、源码来源和本地源码体积分析。

## 快速开始

本项目仍以 npm 包分发，但分析对象只限 Cargo/Rust 项目：

```bash
pnpm dlx cargo-deps-inspector
# 或
npx cargo-deps-inspector
```

如果可执行文件 `cargo-deps-inspector` 已在 `PATH` 中，也可以使用 Cargo 外部子命令形式：

```bash
cargo deps-inspector
```

默认会执行带 `--locked` 的 `cargo metadata`，因此不会创建或修改 `Cargo.lock`。确实需要 Cargo 更新锁文件时，必须显式传入 `--no-locked`。

常用解析参数：

```bash
cargo deps-inspector --features serde,cli
cargo deps-inspector --all-features
cargo deps-inspector --no-default-features
cargo deps-inspector --filter-platform x86_64-unknown-linux-gnu
cargo deps-inspector --offline
cargo deps-inspector --manifest-path crates/app/Cargo.toml
```

Web UI 提供 grid、graph、chart、compare 和 reports 五类视图。基础分析只读取 Cargo 元数据与本机 crate 源码，不依赖 `cargo-audit` 或 `cargo-outdated`。

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

命令行显式参数优先于配置文件。`excludePackages` 与 `excludeDependenciesOf` 支持 crate 名称、`name@semver`、通配符和谓词函数。

## CLI 报告

```bash
cargo deps-inspector report duplicates
cargo deps-inspector report source-sizes --limit 20
cargo deps-inspector report audit
cargo deps-inspector report outdated
```

所有报告均支持 `--json`。JSON 模式下结果写到 stdout，进度写到 stderr，可安全接入 `jq` 或 CI 管道。

- `duplicates`：同名 crate 被解析为多个版本。
- `source-sizes`：本地 crate 源码目录体积与 Rust/测试/文档等分类。
- `audit`：按需调用 `cargo audit --json` 并展示 RustSec 结果。
- `outdated`：按需调用 `cargo outdated --workspace --format json`。

后两项是可选集成。工具未安装时会返回安装指引，基础图谱仍可正常工作：

```bash
cargo install cargo-audit --locked
cargo install cargo-outdated --locked
```

## 快照与浏览器导入

在线构建不在浏览器内执行 Cargo，而是导入以下任一文件：

```bash
cargo metadata --format-version=1 > metadata.json
cargo deps-inspector snapshot snapshot.json --yes
cargo deps-inspector snapshot snapshot.json --audit --outdated --yes
```

增强快照保留源码体积和可选报告，也会保留 Cargo 返回的绝对路径。交互式导出前会显示隐私确认；非 TTY 环境必须显式传入 `--yes`。分享前请检查文件内容。

运行浏览器导入版：

```bash
pnpm online:dev
pnpm online:build
```

## 静态构建

```bash
cargo deps-inspector build --out-dir dist/cargo-deps
```

该命令生成可由任意静态服务器托管的 SPA，并内嵌本次 Cargo 图谱。`cargo-audit` 与 `cargo-outdated` 仍保持按需执行；纯静态页面不会尝试运行本机命令。

## MCP

```bash
cargo deps-inspector mcp
```

通过 devframe 的 stdio MCP 适配器公开以下只读工具：

- `cargo-deps-inspector:report-duplicates`
- `cargo-deps-inspector:report-source-sizes`
- `cargo-deps-inspector:report-audit`
- `cargo-deps-inspector:report-outdated`

同一进程内会缓存 Cargo 图谱与外部报告；传入 `force` 可刷新按需报告。

## 开发

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

仓库自带 `test/fixtures/cargo-workspace`，开发配置默认检查该 fixture。

## 致谢与许可证

本项目使用 `gpt-5.6-sol xhigh` 基于 Node Modules Inspector Vide 而来，界面与架构保留了原项目及 devframe 的重要设计经验。

[MIT](./LICENSE)
