import { defineConfig } from './packages/cargo-deps-inspector/src/node/index'

export default defineConfig({
  name: 'cargo-deps-inspector',
  cargo: {
    manifestPath: 'test/fixtures/cargo-workspace/Cargo.toml',
    locked: true,
  },
  externalTools: {
    audit: true,
    outdated: true,
  },
})
