import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { spawn } from 'node:child_process'

let preview: ReturnType<typeof spawn> | null = null

test.beforeAll(async () => {
  preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    stdio: 'inherit',
    shell: true,
  })
  // wait a bit for server
  await new Promise((r) => setTimeout(r, 2000))
})

test.afterAll(async () => {
  if (preview) {
    preview.kill('SIGTERM')
  }
})

async function runAxe(pageUrl: string) {
  await test.step(`visit ${pageUrl}`, async () => {
    await page.goto(pageUrl)
  })
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['region']) // SPA content often lacks complementary landmarks
    .analyze()

  const serious = accessibilityScanResults.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact || '')
  )
  // Allow only non-contrast minor issues if any
  expect(serious, JSON.stringify(accessibilityScanResults.violations, null, 2)).toHaveLength(0)
}

test('ThemeLab light has no serious a11y issues', async ({ page }) => {
  await runAxe('http://localhost:4173/?lab=1')
})

test('ThemeLab dark has no serious a11y issues', async ({ page }) => {
  await page.goto('http://localhost:4173/?lab=1')
  await page.addStyleTag({ content: ':root { color-scheme: dark; }' })
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['region'])
    .analyze()
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact || ''))
  expect(serious, JSON.stringify(results.violations, null, 2)).toHaveLength(0)
})

