import type { CargoFileCategory, PackageNodeRaw, PackageSourceSizeInfo } from './types'
import fs from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'

const SKIPPED_DIRECTORIES = new Set(['.git', '.hg', '.svn', 'target', 'node_modules'])

export async function getPackageSourceSize(pkg: PackageNodeRaw): Promise<PackageSourceSizeInfo | undefined> {
  if (!pkg.filepath)
    return undefined

  const files: string[] = []
  async function walk(directory: string): Promise<void> {
    let entries
    try {
      entries = await fs.readdir(directory, { withFileTypes: true })
    }
    catch {
      return
    }
    await Promise.all(entries.map(async (entry) => {
      const path = join(directory, entry.name)
      if (entry.isFile())
        files.push(path)
      else if (entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name))
        await walk(path)
    }))
  }
  await walk(pkg.filepath)
  if (!files.length)
    return undefined

  const categories: PackageSourceSizeInfo['categories'] = {}
  let bytes = 0
  await Promise.all(files.map(async (file) => {
    let size = 0
    try {
      size = (await fs.stat(file)).size
    }
    catch {}
    bytes += size
    const category = guessCargoFileCategory(relative(pkg.filepath, file))
    categories[category] ||= { bytes: 0, count: 0 }
    categories[category]!.bytes += size
    categories[category]!.count += 1
  }))

  return { bytes, files: files.length, categories }
}

export function guessCargoFileCategory(file: string): CargoFileCategory {
  const normalized = file.replaceAll('\\', '/')
  const parts = normalized.split('/')
  const filename = basename(normalized)
  const extension = extname(filename).toLowerCase()
  const directories = parts.slice(0, -1)

  if (directories.includes('tests') || /(?:^|_)test\.rs$/.test(filename))
    return 'tests'
  if (directories.includes('examples'))
    return 'examples'
  if (directories.includes('benches') || directories.includes('benchmarks'))
    return 'benches'
  if (filename === 'build.rs' || directories.includes('build'))
    return 'build'
  if (filename === 'Cargo.toml' || filename === 'Cargo.lock' || extension === '.toml')
    return 'manifest'
  if (extension === '.rs')
    return 'rust'
  if (['.md', '.mdx', '.rst', '.txt'].includes(extension) || /^readme|^license|^changelog|^authors/i.test(filename))
    return 'docs'
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf'].includes(extension))
    return 'assets'
  return 'other'
}
