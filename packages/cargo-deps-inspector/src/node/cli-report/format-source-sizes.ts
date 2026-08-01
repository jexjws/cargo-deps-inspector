import type { SourceSizesEntry } from '../../shared/reports/dto'
import c from 'ansis'
import { formatBytes, renderTable } from './format-util'

function topCategory(entry: SourceSizesEntry): string {
  const top = Object.entries(entry.categories)
    .filter((entry): entry is [string, { bytes: number, count: number }] => Boolean(entry[1]))
    .sort((a, b) => b[1].bytes - a[1].bytes)[0]
  if (!top)
    return ''
  const percentage = entry.bytes ? Math.round((top[1].bytes / entry.bytes) * 100) : 0
  return `${top[0]} ${c.dim(`(${percentage}%)`)}`
}

export function formatSourceSizes(entries: SourceSizesEntry[]): string {
  if (!entries.length)
    return c.dim('No Cargo source-size data available.\n')

  const rows = entries.map(entry => [
    `${entry.name}@${entry.version}`,
    entry.sourceKind,
    formatBytes(entry.bytes),
    String(entry.files),
    topCategory(entry),
  ])

  const table = renderTable([
    { header: 'Crate' },
    { header: 'Source' },
    { header: 'Size', align: 'right' },
    { header: 'Files', align: 'right' },
    { header: 'Largest category' },
  ], rows)
  const total = entries.reduce((sum, entry) => sum + entry.bytes, 0)
  return `${table}\n${c.dim(`\n${entries.length} crates · total ${formatBytes(total)}\n`)}`
}
