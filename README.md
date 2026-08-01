![Cargo Deps Inspector](./packages/cargo-deps-inspector/src/public/favicon.svg)

# Cargo Deps Inspector

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

English | [简体中文](./README.zh-CN.md)

Visualize and diagnose resolved Cargo dependency graphs. Cargo Deps Inspector uses `cargo metadata --format-version=1` as its source of truth and understands workspaces, features, targets, dependency kinds, package sources, duplicate versions, and local source sizes.

[Open the browser-only application](https://cargo-deps-inspector.pages.dev/)

## Features

- Explore dependencies in grid, graph, chart, compare, and report views.
- Inspect resolved features, targets, normal/build/dev dependencies, and package sources.
- Find crates resolved to multiple versions.
- Measure local crate source sizes by source, test, documentation, and other files.
- Run optional RustSec and outdated-dependency reports through `cargo-audit` and `cargo-outdated`.
- Export an offline static site or import metadata into the browser-only application.
- Expose read-only reports to agents through MCP.
- Use the interface in English or Simplified Chinese.

## Quick start

The application is distributed as an npm package, but it only analyzes Cargo/Rust projects:

```bash
# Change to the directory containing Cargo.toml before running
pnpm dlx cargo-deps-inspector
# or
npx cargo-deps-inspector
# or
bunx cargo-deps-inspector
```

If `cargo-deps-inspector` is already available in `PATH`, it can also be invoked as a Cargo external subcommand:

```bash
cargo deps-inspector
```

By default, the inspector runs `cargo metadata` with `--locked`, so it will not create or modify `Cargo.lock`. Pass `--no-locked` explicitly when Cargo is allowed to update the lockfile.

Common dependency-resolution options:

```bash
cargo deps-inspector --features serde,cli
cargo deps-inspector --all-features
cargo deps-inspector --no-default-features
cargo deps-inspector --filter-platform x86_64-unknown-linux-gnu
cargo deps-inspector --offline
cargo deps-inspector --manifest-path crates/app/Cargo.toml
```

The base dependency graph only reads Cargo metadata and local crate sources. It does not require `cargo-audit` or `cargo-outdated`.

## Configuration

Create `cargo-deps-inspector.config.ts` in the project root:

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

Explicit command-line options override the configuration file. `excludePackages` and `excludeDependenciesOf` accept crate names, `name@semver` selectors, glob patterns, and predicate functions.

## CLI reports

```bash
cargo deps-inspector report duplicates
cargo deps-inspector report source-sizes --limit 20
cargo deps-inspector report audit
cargo deps-inspector report outdated
```

Every report supports `--json`. In JSON mode, results are written to stdout and progress is written to stderr, making the command safe to use with `jq` or in CI pipelines.

- `duplicates`: crates with the same name resolved to multiple versions.
- `source-sizes`: local crate directory sizes grouped into Rust source, tests, documentation, and other files.
- `audit`: invokes `cargo audit --json` on demand and displays RustSec findings.
- `outdated`: invokes `cargo outdated --workspace --format json` on demand.

The last two integrations are optional. If a tool is unavailable, the inspector returns installation guidance while the base graph remains usable:

```bash
cargo install cargo-audit --locked
cargo install cargo-outdated --locked
```

## Snapshots and browser import

The browser-only application cannot execute Cargo. Import either raw Cargo metadata or an enhanced inspector snapshot:

```bash
cargo metadata --format-version=1 > metadata.json
cargo deps-inspector snapshot snapshot.json --yes
cargo deps-inspector snapshot snapshot.json --audit --outdated --yes
```

Enhanced snapshots retain source-size information and optional reports. They also contain absolute paths returned by Cargo. Interactive exports display a privacy confirmation, while non-TTY environments must pass `--yes`. Review a snapshot before sharing it.

Imported files are parsed locally in the browser and are not uploaded to a server.

## Static export

```bash
cargo deps-inspector build --out-dir dist/cargo-deps
```

This creates a static SPA that can be hosted by any static file server, with the current Cargo graph embedded. Optional `cargo-audit` and `cargo-outdated` reports still run only when requested; the generated site never attempts to execute local commands.

## MCP

```bash
cargo deps-inspector mcp
```

The devframe stdio MCP adapter exposes these read-only tools:

- `cargo-deps-inspector:report-duplicates`
- `cargo-deps-inspector:report-source-sizes`
- `cargo-deps-inspector:report-audit`
- `cargo-deps-inspector:report-outdated`

The Cargo graph and external reports are cached within the process. Pass `force` to refresh an on-demand report.

## Documentation

- [Development, testing, release, and deployment guide](./DEVELOPMENT.md)
- [中文开发指南](./DEVELOPMENT.zh-CN.md)

## Acknowledgements

Cargo Deps Inspector began as an adaptation of [Node Modules Inspector](https://github.com/antfu/node-modules-inspector), developed with assistance from `gpt-5.6-sol xhigh`. Its interface and architecture retain important ideas from the original project and devframe.

## License

[MIT](./LICENSE.md)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/cargo-deps-inspector?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/cargo-deps-inspector
[npm-downloads-src]: https://img.shields.io/npm/dm/cargo-deps-inspector?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/cargo-deps-inspector
