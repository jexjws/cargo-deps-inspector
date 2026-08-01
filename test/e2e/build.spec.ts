import { expect, test } from '@playwright/test'

// "Build mode" = the static export produced by `cargo-deps-inspector build`.
// No backend; data is baked into api/rpc-dump.json and api/metadata.json
// reports `backend: 'static'`. Served from a plain static file server.

const navLink = (href: string) => `a[href^="${href}"]`

test.describe('build mode (static export)', () => {
  test('serves the static landing and exposes a static connection meta', async ({ page, request }) => {
    const res = await request.get('/__connection.json')
    expect(res.ok()).toBe(true)
    expect(await res.json()).toMatchObject({ backend: 'static' })

    const manifest = await request.get('/__rpc-dump/index.json')
    expect(manifest.ok()).toBe(true)
    const manifestBody = await manifest.json()
    expect(manifestBody).toHaveProperty('cargo-deps-inspector:get-payload')

    await page.goto('/')
    await expect(page).toHaveTitle(/Cargo Deps Inspector/)
  })

  test('renders the inspector UI from the prebuilt RPC dump', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/grid\//, { timeout: 30_000 })
    // Nav rail mounts only after the static backend resolves the rpc dump.
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })
  })

  test('navigates between views without a backend round-trip', async ({ page }) => {
    await page.goto('/grid/depth')
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })

    await page.locator(navLink('/graph')).first().click()
    await expect(page).toHaveURL(/\/graph/)

    await page.locator(navLink('/chart')).first().click()
    await expect(page).toHaveURL(/\/chart/)
  })

  test('switches language in place and persists the selection', async ({ page }) => {
    await page.goto('/grid/depth')
    await expect(page.locator(navLink('/grid')).first()).toBeVisible({ timeout: 30_000 })

    const languageButton = page.getByRole('button', { name: '语言' })
    const darkModeButton = page.getByRole('button', { name: '切换深色模式' })
    const [languageBox, darkModeBox] = await Promise.all([
      languageButton.boundingBox(),
      darkModeButton.boundingBox(),
    ])
    expect(languageBox).not.toBeNull()
    expect(darkModeBox).not.toBeNull()
    expect(languageBox!.x).toBeLessThan(darkModeBox!.x)

    await languageButton.click()
    await expect(page.getByRole('menuitemradio', { name: '简体中文' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('menuitemradio', { name: 'English' }).click()
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator(navLink('/graph')).first()).toHaveAttribute('title', 'Graph View')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('cargo-deps-inspector-locale'))).toBe('en')

    await page.reload()
    await expect(page.getByRole('button', { name: 'Language' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.getByRole('button', { name: 'Language' }).click()
    await expect(page.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('menuitemradio', { name: '简体中文' }).click()
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.locator(navLink('/graph')).first()).toHaveAttribute('title', '依赖图')
  })
})
