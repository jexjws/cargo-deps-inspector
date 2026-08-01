# AGENTS.md

本项目是 Cargo 依赖分析 CLI、Nuxt Web UI 与 devframe RPC/MCP 服务。解析结果以 `cargo metadata --format-version=1` 为准；`cargo-audit` 和 `cargo-outdated` 仅作为按需、可选的报告来源。

## 目录

- `packages/cargo-deps-inspector/`：CLI、Nuxt SPA、devframe RPC 服务。
- `packages/cargo-deps-tools/`：Cargo metadata 执行、解析、图结构与源码体积核心库。
- `test/fixtures/cargo-workspace/`：开发和测试用 Rust 工作区。
- `test/e2e/`：Playwright 端到端测试。

RPC 位于 `packages/cargo-deps-inspector/src/node/rpc/<name>.ts`，每个文件只定义一个 RPC，并在 `devframe.ts` 注册。

## 命令

- `pnpm dev`：开发服务器。
- `pnpm online:dev`：仅导入 JSON 的浏览器版本。
- `pnpm build`：完整构建。
- `pnpm test` / `pnpm test:e2e`：Vitest / Playwright。
- `pnpm lint` / `pnpm typecheck`：代码规范与类型检查。

## 约定

- 仅使用 TypeScript；Vue 采用 Composition API 与 `<script setup lang="ts">`。
- 使用 pnpm 11 catalog；新增依赖写入 `pnpm-workspace.yaml`，包内引用 `catalog:<name>`。
- RPC 通过 `ctx.scope('cargo-deps-inspector')` 注册裸名称。
- `cargo metadata` 默认带 `--locked`；只能通过显式 `--no-locked` 放开。
- 基础图谱不得依赖可选 Cargo 子命令。外部工具缺失时返回安装指引。
- 增强快照包含绝对路径，导出必须提示隐私风险并要求确认。
- E2E 使用单 worker，避免共享 WebSocket 后端状态冲突。
- `AGENTS.md` 是项目约定的唯一来源；`CLAUDE.md` 是指向它的符号链接。
