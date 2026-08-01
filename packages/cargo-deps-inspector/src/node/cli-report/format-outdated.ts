import type { CargoOutdatedEntry, ExternalToolResult } from '../../shared/types'
import c from 'ansis'
import { renderTable } from './format-util'

export function formatOutdated(result: ExternalToolResult<CargoOutdatedEntry[]>): string {
  if (result.status !== 'ready') {
    const install = result.status === 'missing' ? `\n${c.dim(`Install with: ${result.installCommand}`)}` : ''
    return `${result.status === 'error' ? c.red(result.message) : c.yellow(result.message)}${install}\n`
  }
  if (!result.data.length)
    return c.green('No outdated Cargo dependencies found.\n')
  const rows = result.data.map(entry => [
    entry.workspace,
    entry.name,
    entry.project,
    entry.compat,
    entry.latest,
    entry.kind ?? 'normal',
  ])
  return `${renderTable([
    { header: 'Workspace crate' },
    { header: 'Dependency' },
    { header: 'Current' },
    { header: 'Compatible' },
    { header: 'Latest' },
    { header: 'Kind' },
  ], rows)}\n${c.dim(`\n${result.data.length} outdated dependencies\n`)}`
}
