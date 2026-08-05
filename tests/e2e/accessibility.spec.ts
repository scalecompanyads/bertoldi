import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function verificarAcessibilidade(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const graves = resultado.violations.filter(item =>
    item.impact === 'critical' || item.impact === 'serious'
  )
  expect(graves, JSON.stringify(graves, null, 2)).toEqual([])
}

async function loginEquipe(page: Page) {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Equipe' }).click()
  await page.getByLabel('E-mail').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.getByLabel('Senha').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar como equipe' }).click()
  await expect(page).toHaveURL(/\/admin/)
}

async function loginCliente(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar com e-mail' }).click()
  await page.getByLabel('E-mail').fill(process.env.E2E_CLIENT_EMAIL!)
  await page.getByLabel('Senha').fill(process.env.E2E_CLIENT_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar como cliente' }).click()
  await expect(page).toHaveURL(/\/cliente/)
}

test('login atende WCAG AA sem violações graves', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await verificarAcessibilidade(page)
})

test.describe('rotas críticas da equipe', () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    'Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD.'
  )

  test.beforeEach(async ({ page }) => loginEquipe(page))

  for (const rota of ['/admin', '/admin/clientes', '/admin/processos', '/admin/importar', '/admin/calendarios']) {
    test(`${rota} atende WCAG AA e possui foco navegável`, async ({ page }) => {
      await page.goto(rota)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
      await verificarAcessibilidade(page)
    })
  }
})

test.describe('rotas críticas do cliente', () => {
  test.skip(
    !process.env.E2E_CLIENT_EMAIL || !process.env.E2E_CLIENT_PASSWORD,
    'Defina E2E_CLIENT_EMAIL e E2E_CLIENT_PASSWORD.'
  )

  test.beforeEach(async ({ page }) => loginCliente(page))

  for (const rota of ['/cliente', '/cliente/comunicados', '/cliente/perfil']) {
    test(`${rota} atende WCAG AA`, async ({ page }) => {
      await page.goto(rota)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await verificarAcessibilidade(page)
    })
  }

  test('detalhe do processo atende WCAG AA quando fixture é informada', async ({ page }) => {
    test.skip(!process.env.E2E_CLIENT_PROCESSO_ID, 'Defina E2E_CLIENT_PROCESSO_ID.')
    await page.goto(`/cliente/processos/${process.env.E2E_CLIENT_PROCESSO_ID}`)
    await verificarAcessibilidade(page)
  })
})
