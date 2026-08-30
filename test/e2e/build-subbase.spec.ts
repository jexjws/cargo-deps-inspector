import { expect, test } from '@playwright/test'

// "Build mode (sub-base)" = static export produced by
// `cargo-deps-inspector build --base /__cargo-deps-inspector/`,
// served from a parent dir so the inspector lives at the sub-path.
// Verifies that the build CLI's HTML rewrite retargets the absolute
// /_nuxt/* asset paths so the SPA loads without 404s when the deploy
// root sits one level above the inspector dir.

const SUB = '/__cargo-deps-inspector/'
const navLink = (href: string) => `a[href^="${SUB}${href.replace(/^\//, '')}"]`

test.describe('build mode (static export, sub-base)', () => {
  test('exposes connection meta and rpc dump under the sub-base', async ({ request }) => {
    const meta = await request.get(`${SUB}__connection.json`)
    expect(meta.ok()).toBe(true)
    expect(await meta.json()).toMatchObject({ backend: 'static' })

    const manifest = await request.get(`${SUB}__rpc-dump/index.json`)
    expect(manifest.ok()).toBe(true)
    expect(await manifest.json()).toHaveProperty('cargo-deps-inspector:get-payload')
  })

  test('loads critical assets (JS / CSS / JSON) without 4xx/5xx responses', async ({ page }) => {
    // The point of `--base /__cargo-deps-inspector/` is that every
    // /_nuxt/* href, src, and importmap entry in the prerendered HTML gets
    // rewritten to /__cargo-deps-inspector/_nuxt/* — a regression here
    // would silently 404 on JS chunks or the rpc-dump and the inspector
    // would never hydrate.
    const failures: string[] = []
    page.on('response', (r) => {
      if (r.status() < 400)
        return
      const ext = new URL(r.url()).pathname.split('.').pop() ?? ''
      if (['js', 'mjs', 'css', 'json', 'html', 'png', 'woff', 'woff2'].includes(ext))
        failures.push(`${r.status()} ${r.url()}`)
    })

    await page.goto(SUB)

    await expect(page).toHaveURL(new RegExp(`${SUB.replace(/\//g, '\\/')}report`), { timeout: 30_000 })
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })

    expect(failures, `Asset failures under ${SUB}: ${failures.join(', ')}`).toEqual([])
  })

  test('navigates between views within the sub-base', async ({ page }) => {
    await page.goto(`${SUB}grid/depth`)
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })

    await page.locator(navLink('/chart')).first().click()
    await expect(page).toHaveURL(new RegExp(`${SUB.replace(/\//g, '\\/')}chart`))
  })
})
