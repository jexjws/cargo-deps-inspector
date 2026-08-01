import type { ListPackageDependenciesOptions } from 'cargo-deps-tools'
import type {
  CargoAuditFinding,
  CargoAuditOptions,
  CargoAuditReport,
  CargoDepsInspectorConfig,
  CargoDepsInspectorPayload,
  CargoOutdatedEntry,
  CargoOutdatedOptions,
  ExternalToolResult,
} from '../../shared/types'
import process from 'node:process'
import c from 'ansis'
import { constructPackageFilters, listPackageDependencies } from 'cargo-deps-tools'
import { launchEditor } from 'devframe/utils/launch-editor'
import { open } from 'devframe/utils/open'
import { hash as getHash } from 'ohash'
import { dirname, isAbsolute, resolve } from 'pathe'
import { x } from 'tinyexec'
import { loadConfig } from 'unconfig'
import { MARK_CARGO, MARK_CHECK } from '../constants'

export interface CreateInspectorRpcHandlersOptions extends Partial<ListPackageDependenciesOptions> {
  mode: 'dev' | 'build'
  configFile?: string
  /** Route progress logs to stderr so stdout remains valid JSON/MCP output. */
  quiet?: boolean
}

export interface InspectorRpcHandlers {
  getPayload: (force?: boolean) => Promise<CargoDepsInspectorPayload>
  getAudit: (force?: boolean) => Promise<ExternalToolResult<CargoAuditReport>>
  getOutdated: (force?: boolean) => Promise<ExternalToolResult<CargoOutdatedEntry[]>>
  openInEditor: (filename: string) => Promise<void>
  openInFinder: (filename: string) => Promise<void>
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' ? value as Record<string, any> : {}
}

function toStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : undefined
}

function normalizeAuditFinding(value: unknown): CargoAuditFinding {
  const finding = asRecord(value)
  const advisory = asRecord(finding.advisory)
  const pkg = asRecord(finding.package)
  const versions = asRecord(finding.versions)
  return {
    advisory: {
      id: String(advisory.id ?? 'unknown'),
      title: String(advisory.title ?? 'Untitled advisory'),
      description: typeof advisory.description === 'string' ? advisory.description : undefined,
      date: typeof advisory.date === 'string' ? advisory.date : undefined,
      url: typeof advisory.url === 'string' ? advisory.url : undefined,
      informational: typeof advisory.informational === 'string' ? advisory.informational : undefined,
      categories: toStringArray(advisory.categories),
      keywords: toStringArray(advisory.keywords),
      cvss: typeof advisory.cvss === 'string' ? advisory.cvss : undefined,
    },
    package: {
      name: String(pkg.name ?? 'unknown'),
      version: String(pkg.version ?? 'unknown'),
      source: typeof pkg.source === 'string' ? pkg.source : undefined,
    },
    versions: {
      patched: toStringArray(versions.patched),
      unaffected: toStringArray(versions.unaffected),
    },
  }
}

function normalizeAuditReport(value: unknown): CargoAuditReport {
  const raw = asRecord(value)
  const database = asRecord(raw.database)
  const vulnerabilities = asRecord(raw.vulnerabilities)
  const list = Array.isArray(vulnerabilities.list)
    ? vulnerabilities.list.map(normalizeAuditFinding)
    : []
  const warnings: Record<string, CargoAuditFinding[]> = {}
  for (const [kind, findings] of Object.entries(asRecord(raw.warnings))) {
    warnings[kind] = Array.isArray(findings)
      ? findings.map(normalizeAuditFinding)
      : []
  }
  return {
    database: {
      'advisory-count': typeof database['advisory-count'] === 'number' ? database['advisory-count'] : undefined,
      'last-commit': typeof database['last-commit'] === 'string' ? database['last-commit'] : null,
      'last-updated': typeof database['last-updated'] === 'string' ? database['last-updated'] : null,
    },
    vulnerabilities: {
      found: vulnerabilities.found === true || list.length > 0,
      count: typeof vulnerabilities.count === 'number' ? vulnerabilities.count : list.length,
      list,
    },
    warnings,
  }
}

function parseOutdatedOutput(stdout: string): CargoOutdatedEntry[] {
  const entries: CargoOutdatedEntry[] = []
  for (const line of stdout.split(/\r?\n/).map(value => value.trim()).filter(Boolean)) {
    let document: Record<string, any>
    try {
      document = asRecord(JSON.parse(line))
    }
    catch {
      continue
    }
    const workspace = String(document.crate_name ?? document.name ?? 'workspace')
    if (!Array.isArray(document.dependencies))
      continue
    for (const dependency of document.dependencies) {
      const item = asRecord(dependency)
      entries.push({
        workspace,
        name: String(item.name ?? 'unknown'),
        project: String(item.project ?? ''),
        compat: String(item.compat ?? ''),
        latest: String(item.latest ?? ''),
        kind: typeof item.kind === 'string' ? item.kind : null,
        platform: typeof item.platform === 'string' ? item.platform : null,
      })
    }
  }
  return entries
}

function toolMissing(stderr: string, tool: 'audit' | 'outdated'): boolean {
  return stderr.includes(`no such command: \`${tool}\``)
    || stderr.includes(`no such command: '${tool}'`)
    || stderr.includes('ENOENT')
}

function option<T extends { enabled?: boolean }>(value: boolean | T | undefined): T | false {
  if (value === false)
    return false
  if (value === true || value == null)
    return {} as T
  return value
}

export function createInspectorRpcHandlers(options: CreateInspectorRpcHandlersOptions): InspectorRpcHandlers {
  const cwd = resolve(options.cwd ?? process.cwd())
  const log = options.quiet
    ? (message: string) => process.stderr.write(`${message}\n`)
    : (message: string) => console.log(message)

  let configPromise: Promise<CargoDepsInspectorConfig> | undefined
  let payloadPromise: Promise<CargoDepsInspectorPayload> | undefined
  let auditPromise: Promise<ExternalToolResult<CargoAuditReport>> | undefined
  let outdatedPromise: Promise<ExternalToolResult<CargoOutdatedEntry[]>> | undefined

  async function loadInspectorConfig(force = false): Promise<CargoDepsInspectorConfig> {
    if (force)
      configPromise = undefined
    configPromise ||= (async () => {
      const result = await loadConfig<CargoDepsInspectorConfig>({
        cwd,
        sources: [{ files: options.configFile || 'cargo-deps-inspector.config' }],
        defaults: {
          cargo: { locked: true },
          externalTools: { audit: true, outdated: true },
        },
        merge: true,
      })
      if (result.sources.length)
        log(c.green`${MARK_CHECK} Config loaded from ${result.sources.join(', ')}`)
      const manifestPath = result.config.cargo?.manifestPath
      if (manifestPath && !isAbsolute(manifestPath) && result.sources[0]) {
        result.config.cargo = {
          ...result.config.cargo,
          manifestPath: resolve(dirname(result.sources[0]), manifestPath),
        }
      }
      return result.config
    })()
    return configPromise
  }

  async function createPayload(): Promise<CargoDepsInspectorPayload> {
    const config = await loadInspectorConfig()
    const excludeFilter = constructPackageFilters(config.excludePackages || [], 'some')
    const depsFilter = constructPackageFilters(config.excludeDependenciesOf || [], 'some')
    const cliCargo = Object.fromEntries(Object.entries({
      cargoPath: options.cargoPath,
      manifestPath: options.manifestPath,
      features: options.features,
      allFeatures: options.allFeatures,
      noDefaultFeatures: options.noDefaultFeatures,
      filterPlatform: options.filterPlatform,
      locked: options.locked,
      offline: options.offline,
      frozen: options.frozen,
    }).filter(([, value]) => value !== undefined))
    log(c.cyan`${MARK_CARGO} Running cargo metadata and measuring crate sources...`)
    const result = await listPackageDependencies({
      cwd,
      depth: options.depth,
      ...config.cargo,
      ...cliCargo,
      traverseFilter: node => !excludeFilter(node),
      dependenciesFilter: node => !depsFilter(node),
    })
    const payload: CargoDepsInspectorPayload = {
      hash: getHash([...result.packages.keys()].sort()),
      timestamp: Date.now(),
      ...result,
      config,
    }
    if (config.onPayloadReady) {
      log(c.cyan`${MARK_CARGO} Running config hook...`)
      await config.onPayloadReady(payload)
    }
    log(c.green`${MARK_CHECK} Cargo dependency graph ready (${result.packages.size} crates)`)
    return payload
  }

  async function runAudit(): Promise<ExternalToolResult<CargoAuditReport>> {
    const [config, payload] = await Promise.all([loadInspectorConfig(), getPayload()])
    const audit = option<CargoAuditOptions>(config.externalTools?.audit)
    if (audit === false || audit.enabled === false)
      return { status: 'disabled', message: 'cargo-audit integration is disabled in the inspector config.' }

    const args = ['audit', '--json', '--file', resolve(payload.root, 'Cargo.lock')]
    if (audit.noFetch || config.cargo?.offline || options.offline)
      args.push('--no-fetch')
    if (audit.stale)
      args.push('--stale')
    for (const advisory of audit.ignore ?? [])
      args.push('--ignore', advisory)

    log(c.cyan`${MARK_CARGO} Running cargo audit...`)
    try {
      const result = await x(options.cargoPath ?? config.cargo?.cargoPath ?? 'cargo', args, {
        throwOnError: false,
        timeout: audit.timeoutMs ?? 120_000,
        nodeOptions: { cwd: payload.root },
      })
      if (toolMissing(result.stderr, 'audit')) {
        return {
          status: 'missing',
          message: 'cargo-audit is not installed. Core Cargo dependency inspection is still available.',
          installCommand: 'cargo install cargo-audit --locked',
        }
      }
      try {
        const data = normalizeAuditReport(JSON.parse(result.stdout))
        log(c.green`${MARK_CHECK} cargo audit finished (${data.vulnerabilities.count} vulnerabilities)`)
        return { status: 'ready', generatedAt: Date.now(), data }
      }
      catch {
        return { status: 'error', message: result.stderr.trim() || 'cargo audit returned invalid JSON.' }
      }
    }
    catch (error: any) {
      const message = error?.message || String(error)
      if (toolMissing(message, 'audit')) {
        return {
          status: 'missing',
          message: 'cargo-audit is not installed. Core Cargo dependency inspection is still available.',
          installCommand: 'cargo install cargo-audit --locked',
        }
      }
      return { status: 'error', message }
    }
  }

  async function runOutdated(): Promise<ExternalToolResult<CargoOutdatedEntry[]>> {
    const [config, payload] = await Promise.all([loadInspectorConfig(), getPayload()])
    const outdated = option<CargoOutdatedOptions>(config.externalTools?.outdated)
    if (outdated === false || outdated.enabled === false)
      return { status: 'disabled', message: 'cargo-outdated integration is disabled in the inspector config.' }

    const manifestPath = options.manifestPath ?? config.cargo?.manifestPath ?? resolve(payload.root, 'Cargo.toml')
    const args = ['outdated', '--workspace', '--format', 'json', '--manifest-path', manifestPath]
    if (outdated.offline || config.cargo?.offline || options.offline)
      args.push('--offline')
    if (outdated.depth != null)
      args.push('--depth', String(outdated.depth))
    if (outdated.rootDepsOnly)
      args.push('--root-deps-only')

    log(c.cyan`${MARK_CARGO} Running cargo outdated...`)
    try {
      const result = await x(options.cargoPath ?? config.cargo?.cargoPath ?? 'cargo', args, {
        throwOnError: false,
        timeout: outdated.timeoutMs ?? 120_000,
        nodeOptions: { cwd: payload.root },
      })
      if (toolMissing(result.stderr, 'outdated')) {
        return {
          status: 'missing',
          message: 'cargo-outdated is not installed. Core Cargo dependency inspection is still available.',
          installCommand: 'cargo install cargo-outdated --locked',
        }
      }
      const data = parseOutdatedOutput(result.stdout)
      if (result.exitCode && data.length === 0)
        return { status: 'error', message: result.stderr.trim() || `cargo outdated exited with code ${result.exitCode}.` }
      log(c.green`${MARK_CHECK} cargo outdated finished (${data.length} entries)`)
      return { status: 'ready', generatedAt: Date.now(), data }
    }
    catch (error: any) {
      const message = error?.message || String(error)
      if (toolMissing(message, 'outdated')) {
        return {
          status: 'missing',
          message: 'cargo-outdated is not installed. Core Cargo dependency inspection is still available.',
          installCommand: 'cargo install cargo-outdated --locked',
        }
      }
      return { status: 'error', message }
    }
  }

  function getPayload(force = false): Promise<CargoDepsInspectorPayload> {
    if (force) {
      configPromise = undefined
      payloadPromise = undefined
      auditPromise = undefined
      outdatedPromise = undefined
    }
    payloadPromise ||= createPayload()
    return payloadPromise
  }

  function getAudit(force = false): Promise<ExternalToolResult<CargoAuditReport>> {
    if (force)
      auditPromise = undefined
    auditPromise ||= runAudit()
    return auditPromise
  }

  function getOutdated(force = false): Promise<ExternalToolResult<CargoOutdatedEntry[]>> {
    if (force)
      outdatedPromise = undefined
    outdatedPromise ||= runOutdated()
    return outdatedPromise
  }

  return {
    getPayload,
    getAudit,
    getOutdated,
    async openInEditor(filename) {
      launchEditor(filename)
    },
    async openInFinder(filename) {
      await open(filename)
    },
  }
}
