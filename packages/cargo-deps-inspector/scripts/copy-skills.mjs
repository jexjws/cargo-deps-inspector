// Copy only this package's canonical skill. The repo-root `skills/` directory
// may also contain symlinks installed by skills-npm; those are not publishable
// package content.

import { existsSync } from 'node:fs'
import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../../../skills/cargo-deps-inspector')
const dest = resolve(here, '../skills/cargo-deps-inspector')

if (!existsSync(src)) {
  console.error(`[copy-skills] source not found: ${src}`)
  process.exit(1)
}

const destRoot = dirname(dest)
if (existsSync(destRoot))
  await rm(destRoot, { recursive: true })
await mkdir(destRoot, { recursive: true })
await cp(src, dest, { recursive: true })

console.log(`[copy-skills] ${src} → ${dest}`)
