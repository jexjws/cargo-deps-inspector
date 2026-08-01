import type { CargoAuditReport, ExternalToolResult } from '../../shared/types'
import c from 'ansis'
import { renderTable } from './format-util'

export function formatAudit(result: ExternalToolResult<CargoAuditReport>): string {
  if (result.status !== 'ready') {
    const install = result.status === 'missing' ? `\n${c.dim(`Install with: ${result.installCommand}`)}` : ''
    return `${result.status === 'error' ? c.red(result.message) : c.yellow(result.message)}${install}\n`
  }
  const findings = result.data.vulnerabilities.list
  if (!findings.length)
    return c.green('No known RustSec vulnerabilities found.\n')
  const rows = findings.map(finding => [
    finding.advisory.id,
    `${finding.package.name}@${finding.package.version}`,
    finding.advisory.title,
    finding.versions?.patched?.join(', ') || '—',
  ])
  return `${renderTable([
    { header: 'Advisory' },
    { header: 'Crate' },
    { header: 'Title' },
    { header: 'Patched versions' },
  ], rows)}\n${c.red(`\n${findings.length} known vulnerabilities\n`)}`
}
