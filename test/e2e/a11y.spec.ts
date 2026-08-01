import type { Page } from '@playwright/test'
import type { AxeResults } from 'axe-core'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Runs against the static build server (port 13002) — deterministic rendered DOM,
// no websocket loading races. See `playwright.config.ts`.

type Mode = 'light' | 'dark'

const MODES: Mode[] = ['light', 'dark']

const PAGES = ['/grid/depth', '/graph', '/chart/treemap', '/report/source-size', '/compare'] as const

const navLink = (href: string) => `a[href^="${href}"]`

async function setMode(page: Page, mode: Mode): Promise<void> {
  // VueUse `useDark` reads from `vueuse-color-scheme` by default.
  await page.addInitScript((m) => {
    try {
      localStorage.setItem('vueuse-color-scheme', m)
    }
    catch {}
  }, mode)
}

async function gotoAndReady(page: Page, path: string): Promise<void> {
  await page.goto(path)
  // Nav rail mounts only after the static backend resolves the rpc dump.
  await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })
}

async function ensureMode(page: Page, mode: Mode): Promise<void> {
  await expect.poll(async () => page.evaluate(
    m => document.documentElement.classList.contains('dark') === (m === 'dark'),
    mode,
  )).toBe(true)
}

async function scanContrast(page: Page): Promise<AxeResults> {
  return new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .exclude('[data-a11y-skip]')
    .analyze()
}

function formatViolations(results: AxeResults): string {
  return JSON.stringify(
    results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map(n => ({
        target: n.target,
        failureSummary: n.failureSummary,
      })),
    })),
    null,
    2,
  )
}

for (const mode of MODES) {
  for (const path of PAGES) {
    test(`a11y: ${path} has no color-contrast violations in ${mode} mode`, async ({ page }) => {
      await setMode(page, mode)
      await gotoAndReady(page, path)
      await ensureMode(page, mode)

      const results = await scanContrast(page)
      expect.soft(results.violations, formatViolations(results)).toEqual([])
    })
  }

  test(`a11y: package details has no color-contrast violations in ${mode} mode`, async ({ page }) => {
    await setMode(page, mode)
    await gotoAndReady(page, '/grid/depth')
    await ensureMode(page, mode)

    const item = page.locator('.crate-card').first()
    await item.click()
    await expect(page.locator('.details-drawer')).toBeVisible()

    const results = await scanContrast(page)
    expect.soft(results.violations, formatViolations(results)).toEqual([])
  })
}
