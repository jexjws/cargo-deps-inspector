import type { Command } from 'cac'
import type { InspectorDevframeFlags } from './devframe'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import process from 'node:process'
import readline from 'node:readline/promises'
import c from 'ansis'
import cac from 'cac'
import { createDevServer, resolveDevServerPort } from 'devframe/adapters/dev'
import {
  DEVFRAME_CONNECTION_META_FILENAME,
  DEVFRAME_RPC_DUMP_DIRNAME,
  DEVFRAME_RPC_DUMP_MANIFEST_FILENAME,
} from 'devframe/constants'
import { createH3DevframeHost, createHostContext } from 'devframe/node'
import { strictJsonStringify } from 'devframe/rpc'
import { collectStaticRpcDump } from 'devframe/rpc/dump'
import { structuredCloneStringify } from 'devframe/utils/structured-clone'
import { dirname, relative, resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { version } from '../../package.json'
import { distDir } from '../dirs'
import { createSnapshot } from '../shared/snapshot'
import { MARK_CARGO, MARK_CHECK } from './constants'
import devframe from './devframe'

interface CliCargoOptions {
  root: string
  config?: string
  depth?: number | string
  manifestPath?: string
  cargo?: string
  features?: string
  allFeatures?: boolean
  defaultFeatures?: boolean
  filterPlatform?: string
  locked?: boolean
  offline?: boolean
  frozen?: boolean
}

function addCargoOptions(command: Command): Command {
  return command
    .option('--root <dir>', 'Cargo workspace root', { default: process.cwd() })
    .option('--config <file>', 'Inspector config file')
    .option('--depth <depth>', 'Maximum dependency depth (omit for full graph)')
    .option('--manifest-path <path>', 'Path to Cargo.toml')
    .option('--cargo <path>', 'Cargo executable or absolute path')
    .option('--features <features>', 'Comma-separated Cargo features')
    .option('--all-features', 'Activate all available features')
    .option('--no-default-features', 'Do not activate default features')
    .option('--filter-platform <triple>', 'Resolve for one target triple')
    .option('--no-locked', 'Allow Cargo.lock to be created or updated')
    .option('--offline', 'Run Cargo without network access')
    .option('--frozen', 'Equivalent to Cargo --locked plus --offline')
}

function toFlags(options: CliCargoOptions): InspectorDevframeFlags {
  return {
    root: options.root,
    config: options.config,
    depth: options.depth == null ? undefined : Number(options.depth),
    manifestPath: options.manifestPath,
    cargoPath: options.cargo,
    features: options.features?.split(',').map(value => value.trim()).filter(Boolean),
    allFeatures: options.allFeatures,
    noDefaultFeatures: options.defaultFeatures === false ? true : undefined,
    filterPlatform: options.filterPlatform,
    locked: options.locked === false ? false : undefined,
    offline: options.offline,
    frozen: options.frozen,
  }
}

function setMcpEnvironment(flags: InspectorDevframeFlags): void {
  const values: Record<string, string | undefined> = {
    CDI_CLI_ROOT: flags.root,
    CDI_CLI_CONFIG: flags.config,
    CDI_CLI_DEPTH: flags.depth == null ? undefined : String(flags.depth),
    CDI_CLI_MANIFEST_PATH: flags.manifestPath,
    CDI_CLI_CARGO_PATH: flags.cargoPath,
    CDI_CLI_FEATURES: flags.features?.join(','),
    CDI_CLI_ALL_FEATURES: flags.allFeatures ? '1' : undefined,
    CDI_CLI_NO_DEFAULT_FEATURES: flags.noDefaultFeatures ? '1' : undefined,
    CDI_CLI_FILTER_PLATFORM: flags.filterPlatform,
    CDI_CLI_LOCKED: flags.locked == null ? undefined : flags.locked ? '1' : '0',
    CDI_CLI_OFFLINE: flags.offline ? '1' : undefined,
    CDI_CLI_FROZEN: flags.frozen ? '1' : undefined,
    CDI_CLI_QUIET: '1',
  }
  for (const [name, value] of Object.entries(values)) {
    if (value != null)
      process.env[name] = value
  }
}

async function confirmPrivateSnapshot(): Promise<boolean> {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stderr })
  try {
    const answer = await prompt.question(c.yellow('增强快照会包含本机绝对路径。确认导出？[y/N] '))
    return /^y(?:es)?$/i.test(answer.trim())
  }
  finally {
    prompt.close()
  }
}

// Cargo invokes external subcommands as `cargo-deps-inspector deps-inspector ...`.
if (process.argv[2] === 'deps-inspector')
  process.argv.splice(2, 1)

const cli = cac('cargo-deps-inspector')
cli.version(version)

addCargoOptions(cli.command('build', 'Build a static Cargo dependency inspector'))
  .option('--base <baseURL>', 'Base URL for deployment', { default: '/' })
  .option('--out-dir <dir>', 'Output directory', { default: 'dist/__cargo-deps-inspector' })
  .action(async (options: CliCargoOptions & { base: string, outDir: string }) => {
    console.log(c.cyan`${MARK_CARGO} Building static Cargo Deps Inspector...`)
    const flags = toFlags(options)
    const cwd = flags.root!
    const outDir = resolve(cwd, options.outDir)
    let baseURL = options.base
    if (!baseURL.endsWith('/'))
      baseURL += '/'
    if (!baseURL.startsWith('/'))
      baseURL = `/${baseURL}`
    baseURL = baseURL.replace(/\/+/g, '/')

    if (existsSync(outDir))
      await fs.rm(outDir, { recursive: true })
    await fs.mkdir(outDir, { recursive: true })
    await fs.cp(distDir, outDir, { recursive: true })

    const ctx = await createHostContext({
      cwd,
      mode: 'build',
      host: createH3DevframeHost({ origin: 'http://localhost', appName: devframe.id }),
    })
    await devframe.setup(ctx, { flags: flags as unknown as Record<string, unknown> })
    await fs.mkdir(resolve(outDir, DEVFRAME_RPC_DUMP_DIRNAME), { recursive: true })

    const jsonSerializableMethods = [...ctx.rpc.definitions.values()]
      .filter(definition => definition.jsonSerializable === true)
      .map(definition => definition.name)
    await fs.writeFile(
      resolve(outDir, DEVFRAME_CONNECTION_META_FILENAME),
      JSON.stringify({ backend: 'static', jsonSerializableMethods }, null, 2),
      'utf8',
    )

    const dump = await collectStaticRpcDump(ctx.rpc.definitions.values(), ctx)
    for (const [filepath, file] of Object.entries(dump.files)) {
      const fullpath = resolve(outDir, filepath)
      await fs.mkdir(dirname(fullpath), { recursive: true })
      const text = file.serialization === 'structured-clone'
        ? structuredCloneStringify(file.data)
        : strictJsonStringify(file.data, file.fnName)
      await fs.writeFile(fullpath, text, 'utf8')
    }
    await fs.writeFile(
      resolve(outDir, DEVFRAME_RPC_DUMP_MANIFEST_FILENAME),
      JSON.stringify(dump.manifest, null, 2),
      'utf8',
    )

    if (baseURL !== '/') {
      const htmlFiles = await glob('**/*.html', { cwd: outDir, onlyFiles: true, dot: true, expandDirectories: false })
      for (const file of htmlFiles) {
        const filePath = resolve(outDir, file)
        const content = await fs.readFile(filePath, 'utf8')
        await fs.writeFile(filePath, content
          .replaceAll(/\s(href|src)="\//g, ` $1="${baseURL}`)
          .replaceAll('"/_nuxt/', `"${baseURL}_nuxt/`)
          .replaceAll('baseURL:"/"', `baseURL:"${baseURL}"`), 'utf8')
      }
    }
    console.log(c.green`${MARK_CHECK} Built to ${relative(cwd, outDir)}`)
  })

addCargoOptions(cli.command('check', 'Resolve and validate the Cargo dependency graph for CI'))
  .action(async (options: CliCargoOptions) => {
    const flags = toFlags(options)
    const { createInspectorRpcHandlers } = await import('./rpc/handlers')
    const handlers = createInspectorRpcHandlers({ ...flags, cwd: flags.root!, configFile: flags.config, mode: 'build' })
    await handlers.getPayload()
  })

addCargoOptions(cli.command('report <type>', 'Run a report: duplicates | source-sizes | audit | outdated'))
  .option('--json', 'Emit machine-readable JSON')
  .option('--limit <n>', 'Cap returned entries')
  .option('--min-versions <n>', '[duplicates] Minimum resolved versions', { default: 2 })
  .option('--include-workspace', '[source-sizes] Include workspace crates')
  .option('--force', '[audit/outdated] Ignore the in-process report cache')
  .action(async (type: string, options: CliCargoOptions & Record<string, any>) => {
    const valid = ['duplicates', 'source-sizes', 'audit', 'outdated'] as const
    if (!valid.includes(type as typeof valid[number]))
      throw new Error(`Unknown report type "${type}". Expected one of: ${valid.join(', ')}.`)
    const { runReport } = await import('./cli-report/run-report')
    await runReport({
      ...toFlags(options),
      type: type as typeof valid[number],
      root: options.root,
      config: options.config,
      json: Boolean(options.json),
      limit: options.limit == null ? undefined : Number(options.limit),
      minVersions: Number(options.minVersions),
      includeWorkspace: Boolean(options.includeWorkspace),
      force: Boolean(options.force),
    })
  })

addCargoOptions(cli.command('snapshot [file]', 'Export an enhanced snapshot for the hosted importer'))
  .option('--audit', 'Include an on-demand cargo-audit result')
  .option('--outdated', 'Include an on-demand cargo-outdated result')
  .option('--yes', 'Acknowledge that the snapshot contains absolute local paths')
  .action(async (file: string | undefined, options: CliCargoOptions & { audit?: boolean, outdated?: boolean, yes?: boolean }) => {
    if (!options.yes) {
      if (!process.stdin.isTTY)
        throw new Error('增强快照包含本机绝对路径；非交互环境必须显式传入 --yes。')
      if (!await confirmPrivateSnapshot())
        return
    }
    const flags = toFlags(options)
    const { createInspectorRpcHandlers } = await import('./rpc/handlers')
    const handlers = createInspectorRpcHandlers({ ...flags, cwd: flags.root!, configFile: flags.config, mode: 'build', quiet: true })
    const payload = await handlers.getPayload()
    const [audit, outdated] = await Promise.all([
      options.audit ? handlers.getAudit() : undefined,
      options.outdated ? handlers.getOutdated() : undefined,
    ])
    const snapshot = createSnapshot(payload, { generatorVersion: version, audit, outdated })
    const output = `${JSON.stringify(snapshot, null, 2)}\n`
    if (!file || file === '-') {
      process.stdout.write(output)
    }
    else {
      const filepath = resolve(process.cwd(), file)
      await fs.writeFile(filepath, output, 'utf8')
      console.error(c.green`${MARK_CHECK} Snapshot written to ${filepath}`)
    }
  })

addCargoOptions(cli.command('mcp', 'Start an MCP stdio server exposing Cargo reports'))
  .action(async (options: CliCargoOptions) => {
    const flags = toFlags(options)
    setMcpEnvironment(flags)
    const { createMcpServer } = await import('devframe/adapters/mcp')
    await createMcpServer(devframe, {
      transport: 'stdio',
      onReady: ({ transport }) => {
        console.error(c.green`${MARK_CHECK} ${devframe.id} MCP server ready (${transport})`)
      },
    })
  })

addCargoOptions(cli.command('', 'Start the interactive Cargo dependency inspector'))
  .option('--host <host>', 'Host', { default: process.env.HOST || '127.0.0.1' })
  .option('--port <port>', 'Port', { default: process.env.PORT || 9999 })
  .option('--open', 'Open browser', { default: true })
  .option('--auth', 'Require one-time-code authentication before RPC calls')
  .action(async (options: CliCargoOptions & { host: string, port: string | number, open: boolean, auth?: boolean }) => {
    const flags = toFlags(options)
    const host = options.host
    const auth = options.auth ?? (host === '0.0.0.0' || host === '::')
    const port = await resolveDevServerPort(devframe, { host, defaultPort: Number(options.port) })
    const url = `http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`
    console.log(c.green`${MARK_CARGO} Starting Cargo Deps Inspector at`, c.green(url), '\n')
    const server = await createDevServer(devframe, {
      host,
      port,
      flags: { ...flags, auth },
      openBrowser: options.open ? url : false,
    })
    const functions = server.rpcGroup.functions as unknown as Record<string, Promise<(...args: unknown[]) => unknown> | undefined>
    functions['cargo-deps-inspector:get-payload']?.then(handler => handler?.()).catch(() => {})
  })

cli.help()
cli.parse(process.argv, { run: false })
try {
  await cli.runMatchedCommand()
}
catch (error: any) {
  console.error(c.red`${MARK_CARGO} ${error?.message || error}`)
  process.exitCode = 1
}
