import { test, expect } from '@playwright/test'

const PROD = process.env.PROD_URL || 'https://attendance-dashboard.pages.dev/'

test.describe('Production exports', () => {
  test('Month tab: Export CSV and PDF', async ({ page, context }) => {
    await page.goto(PROD)
    // Switch to Month tab
    await page.getByRole('tab', { name: /รายเดือน/ }).click()
    // CSV
    const csv = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export CSV/ }).first().click(),
    ])
    expect((await csv[0].path()) !== null).toBeTruthy()
    // PDF
    const pdf = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export PDF/ }).first().click(),
    ])
    expect((await pdf[0].path()) !== null).toBeTruthy()
  })

  test('Person tab: pick employee and Export CSV/PDF', async ({ page }) => {
    await page.goto(PROD)
    await page.getByRole('tab', { name: /รายบุคคล/ }).click()
    // pick first employee from dropdown
    await page.getByLabel('ชื่อพนักงาน').locator('..').getByRole('combobox').click()
    await page.getByRole('option').first().click()
    // CSV
    const csv = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export CSV/ }).first().click(),
    ])
    expect((await csv[0].path()) !== null).toBeTruthy()
    // PDF
    const pdf = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Export PDF/ }).first().click(),
    ])
    expect((await pdf[0].path()) !== null).toBeTruthy()
  })
})

test('Daily tab shows at least one employee name', async ({ page }) => {
  await page.goto(PROD)
  // Ensure on day tab
  await page.getByRole('tab', { name: /รายวัน/ }).click({ timeout: 5000 }).catch(()=>{})
  const names = ['เจ','กอล์ฟ','ปอง','เจ้าสัว','ปริม','จ๊าบ','รีน','เช็ค','เบนซ์']
  let found = false
  for (const n of names) {
    if (await page.getByText(n, { exact: true }).first().isVisible().catch(()=>false)) {
      found = true; break
    }
  }
  expect(found).toBeTruthy()
})

