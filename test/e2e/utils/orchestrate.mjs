#!/usr/bin/env node
import { execSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const scriptDirectory = path.dirname(new URL(import.meta.url).pathname)
const root = path.resolve(scriptDirectory, '../../..')
const fixtures = path.join(scriptDirectory, '..', '.fixtures')
const fixtureBuild = path.join(fixtures, 'build')
const fixtureBuildSubbase = path.join(fixtures, 'build-subbase')
const fixtureBuildSubbaseOutput = path.join(fixtureBuildSubbase, '__cargo-deps-inspector')
const force = Boolean(process.env.E2E_REBUILD)
const portDev = Number(process.env.E2E_PORT_DEV || 13001)
const portBuild = Number(process.env.E2E_PORT_BUILD || 13002)
const portBuildSubbase = Number(process.env.E2E_PORT_BUILD_SUBBASE || 13004)

function run(command) {
  console.log(`[e2e] $ ${command}`)
  execSync(command, { cwd: root, stdio: 'inherit' })
}

async function buildFixtures() {
  await fs.mkdir(fixtures, { recursive: true })
  if (force || !existsSync(path.join(fixtureBuild, 'index.html'))) {
    run('pnpm --filter cargo-deps-tools build')
    run('pnpm --filter cargo-deps-inspector build')
    await fs.rm(fixtureBuild, { recursive: true, force: true })
    run(`node packages/cargo-deps-inspector/bin.mjs build --out-dir ${path.relative(root, fixtureBuild)}`)
  }
  if (force || !existsSync(path.join(fixtureBuildSubbaseOutput, 'index.html'))) {
    await fs.rm(fixtureBuildSubbase, { recursive: true, force: true })
    await fs.mkdir(fixtureBuildSubbase, { recursive: true })
    run(`node packages/cargo-deps-inspector/bin.mjs build --out-dir ${path.relative(root, fixtureBuildSubbaseOutput)} --base /__cargo-deps-inspector/`)
  }
}

function start(label, command, args) {
  const child = spawn(command, args, { cwd: root, env: process.env, stdio: 'inherit' })
  child.on('exit', (code) => {
    console.error(`[e2e] ${label} exited (${code})`)
    process.exit(code ?? 1)
  })
  return child
}

await buildFixtures()
const children = [
  start('dev', 'node', [
    'packages/cargo-deps-inspector/bin.mjs',
    '--root',
    'test/fixtures/cargo-workspace',
    '--port',
    String(portDev),
    '--host',
    '127.0.0.1',
    '--no-open',
  ]),
  start('build', 'node', [path.join(scriptDirectory, 'serve.mjs'), path.relative(root, fixtureBuild), String(portBuild)]),
  start('build-subbase', 'node', [
    path.join(scriptDirectory, 'serve.mjs'),
    path.relative(root, fixtureBuildSubbase),
    String(portBuildSubbase),
    '--spa-base',
    '/__cargo-deps-inspector/',
  ]),
]

function shutdown(signal) {
  for (const child of children)
    child.kill(signal)
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
