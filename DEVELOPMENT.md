# Development guide

[English](./DEVELOPMENT.md) | [简体中文](./DEVELOPMENT.zh-CN.md)

This document covers repository development, validation, releases, and website deployment. See the [main README](./README.md) for end-user usage.

## Requirements

- A Node.js version accepted by the root `package.json` engines field.
- pnpm matching the root `packageManager` field.
- Rust and Cargo for dependency analysis and the fixture workspace.
- Chromium installed through Playwright when running end-to-end tests.
- `cargo-audit` and `cargo-outdated` only when developing their optional integrations.

## Repository layout

- `packages/cargo-deps-inspector/`: CLI, Nuxt SPA, and devframe RPC/MCP service.
- `packages/cargo-deps-tools/`: Cargo metadata execution, parsing, graph structures, and source-size analysis.
- `test/fixtures/cargo-workspace/`: Rust workspace used during development and tests.
- `test/e2e/`: Playwright end-to-end tests.

## Install and run

```bash
pnpm install
pnpm dev
```

The development configuration inspects `test/fixtures/cargo-workspace` by default.

Use the browser-import backend when developing the hosted, command-free application:

```bash
pnpm online:dev
```

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the full development server backed by local Cargo commands. |
| `pnpm online:dev` | Start the browser-only metadata importer. |
| `pnpm build` | Build every workspace package and the full application. |
| `pnpm online:build` | Build the generic browser-only application. |
| `pnpm pages:build` | Build the browser-only application for Cloudflare Pages. |
| `pnpm test` | Run Vitest unit tests. |
| `pnpm test:e2e` | Run Playwright end-to-end tests with one worker. |
| `pnpm typecheck` | Run Vue and TypeScript type checking. |
| `pnpm lint` | Run the repository linters. |

Install the Playwright browser once when necessary:

```bash
pnpm test:e2e:install
```

Before submitting a change, run checks proportionate to its scope. The complete local validation set is:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Build modes

The full build uses the local backend and may run Cargo commands. The online build uses the import backend and only accepts Cargo metadata or enhanced snapshots in the browser.

`pnpm pages:build` sets `CDI_DEPLOY_TARGET=cloudflare-pages` and writes the deployable site to:

```text
packages/cargo-deps-inspector/dist/public
```

The Pages-specific build removes the generated top-level `404.html`, allowing Cloudflare Pages to apply its SPA fallback. Other build modes retain Nuxt's generated 404 page.

To preview a completed static build locally:

```bash
node test/e2e/utils/serve.mjs packages/cargo-deps-inspector/dist/public 4173
```

Then open `http://127.0.0.1:4173`.

## npm and GitHub releases

The root release command updates workspace versions:

```bash
pnpm release
```

Review the generated version changes and tag before pushing. The GitHub Release workflow starts when a `v*` tag reaches GitHub. Its reusable release job publishes the npm package with trusted publishing, and the Pages deployment waits for that job to succeed.

## Cloudflare Pages deployment

The release workflow uses Cloudflare Pages Direct Upload so production deployments follow successful releases rather than every commit on `main`. If the project variable or either Cloudflare repository secret is missing, deployment is skipped without affecting npm publishing.

### One-time project setup

Create the `cargo-deps-inspector` Direct Upload project with `main` as its production branch:

```bash
pnpm dlx wrangler@4.118.0 login
pnpm dlx wrangler@4.118.0 pages project create cargo-deps-inspector --production-branch=main
```

Configure the GitHub repository variable:

```bash
gh variable set CLOUDFLARE_PAGES_PROJECT_NAME \
  --repo jexjws/cargo-deps-inspector \
  --body cargo-deps-inspector
```

Configure these GitHub repository secrets:

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID \
  --repo jexjws/cargo-deps-inspector

gh secret set CLOUDFLARE_API_TOKEN \
  --repo jexjws/cargo-deps-inspector
```

The API token only needs the `Account / Cloudflare Pages / Edit` permission. The workflow records the resulting deployment URL in the `cloudflare-pages` GitHub environment. Configure a custom hostname separately under the Pages project's Custom domains settings.

### Release deployment sequence

```text
v* tag pushed
    -> npm and GitHub release succeeds
    -> browser-only SPA is built and verified
    -> the same tagged commit is deployed to Pages production
```
