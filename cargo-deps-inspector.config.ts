import { defineConfig } from './packages/cargo-deps-inspector/src/node/index'

export default defineConfig({
  name: 'cargo-deps-inspector',
  cargo: {
    manifestPath: '/home/voyage200/Projects/FlightStudio/third-party/rust/Cargo.toml',
    locked: true,
  },
  externalTools: {
    audit: true,
    outdated: true,
  },
})
