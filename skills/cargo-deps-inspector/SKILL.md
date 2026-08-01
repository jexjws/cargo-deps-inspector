---
name: cargo-deps-inspector
description: 使用 cargo metadata 检查 Rust/Cargo 工作区依赖，并生成重复版本、源码体积、RustSec 安全审计和过期依赖报告。用户要求分析 Cargo 依赖图、feature、target、重复 crate、依赖源码占用、cargo-audit、cargo-outdated，或需要通过 CLI/MCP 获取结构化 Cargo 依赖数据时使用。
---

# Cargo Deps Inspector

优先使用结构化 CLI 报告；需要多次查询时使用 MCP，以复用进程内缓存。

## 基础规则

- 在 Cargo 工作区根目录执行，或传入 `--root <dir>` / `--manifest-path <Cargo.toml>`。
- 解析默认带 `--locked`，不会创建或更新 `Cargo.lock`。只有用户明确允许更新锁文件时才传 `--no-locked`。
- `--features a,b`、`--all-features`、`--no-default-features` 与 `--filter-platform <triple>` 会改变解析图，报告时说明所用选项。
- JSON 模式的 stdout 可直接解析；进度日志位于 stderr。

## 报告

```bash
cargo deps-inspector report duplicates --json
cargo deps-inspector report source-sizes --json --limit 20
cargo deps-inspector report audit --json
cargo deps-inspector report outdated --json
```

- `duplicates` 返回 crate 名称、已解析版本和 Cargo 的不透明 package ID。
- `source-sizes` 返回源码目录字节数、文件数与 Rust/manifest/tests/docs 等分类；默认不含 workspace crate，可用 `--include-workspace`。
- `audit` 按需运行 `cargo-audit`。状态为 `missing` 时转告 `installCommand`，不要把它误报为基础解析失败。
- `outdated` 按需运行 `cargo-outdated`，同样接受 `ready`、`missing`、`disabled` 或 `error` 状态。

## MCP

```bash
cargo deps-inspector mcp --root <workspace>
```

公开 `report-duplicates`、`report-source-sizes`、`report-audit`、`report-outdated` 四个命名空间 RPC 工具。适合在同一工作区连续查询。

## 快照

```bash
cargo deps-inspector snapshot snapshot.json --yes
```

增强快照包含绝对本机路径。创建或建议分享快照时必须提醒隐私风险；非交互环境必须显式传 `--yes`。原始 `cargo metadata --format-version=1` JSON 也可以导入浏览器版，但不含源码体积和可选报告。

## 常见失败

- 锁文件缺失或过期：默认不要绕过；建议用户先审查并运行合适的 Cargo 命令更新锁文件，或在明确授权后使用 `--no-locked`。
- `cargo-audit` 缺失：`cargo install cargo-audit --locked`。
- `cargo-outdated` 缺失：`cargo install cargo-outdated --locked`。
- 图过大：用 `--depth`、`--filter-platform` 或 feature 选项缩小范围，并明确说明报告不是默认完整解析。
