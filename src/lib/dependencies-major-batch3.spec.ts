import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { createRouter, createMemoryHistory } from 'vue-router'
import { createVuetify } from 'vuetify'

describe('major dependency batch 3 usage', () => {
  it('vue-router 5 keeps router factory and in-memory navigation flow', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>home</div>' } },
        { path: '/wallets', name: 'wallets', component: { template: '<div>wallets</div>' } }
      ]
    })

    await router.push('/wallets')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/wallets')
    expect(router.resolve({ name: 'home' }).path).toBe('/')
  })

  it('vuetify 4 keeps createVuetify plugin API used in app bootstrap', () => {
    const vuetify = createVuetify()
    const pluginSource = readFileSync(path.resolve(process.cwd(), 'src/plugins/vuetify.ts'), 'utf8')

    expect(typeof vuetify.install).toBe('function')
    expect(pluginSource).toContain("import { createVuetify, ThemeDefinition } from 'vuetify'")
    expect(pluginSource).toContain('export const vuetify = createVuetify({')
  })

  it('project route setup still uses vue-router createRouter API', () => {
    const routerSource = readFileSync(path.resolve(process.cwd(), 'src/router/index.js'), 'utf8')

    expect(routerSource).toContain(
      "import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'"
    )
    expect(routerSource).toContain('const router = createRouter({')
  })

  it('router guards are migrated to return-based API instead of next() callback', () => {
    const guardFiles = [
      'src/middlewares/isLogged.js',
      'src/middlewares/auth.js',
      'src/middlewares/title.js',
      'src/middlewares/walletGuard.ts',
      'src/middlewares/keepSendFunds.ts',
      'src/router/navigationGuard.js'
    ]

    guardFiles.forEach((relativePath) => {
      const source = readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
      expect(source).not.toContain('next(')
    })
  })

  it('router guards use modern signatures without callback-style third argument', () => {
    const guardFiles = [
      'src/middlewares/isLogged.js',
      'src/middlewares/auth.js',
      'src/middlewares/title.js',
      'src/middlewares/walletGuard.ts',
      'src/middlewares/keepSendFunds.ts',
      'src/router/navigationGuard.js',
      'src/views/Transactions.vue',
      'src/views/SendFunds.vue'
    ]

    const callbackGuardRegex = /\(\s*[^,)\n]+\s*,\s*[^,)\n]+\s*,\s*[^)\n]+\s*\)\s*=>/g

    guardFiles.forEach((relativePath) => {
      const source = readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
      expect(source).not.toMatch(callbackGuardRegex)
    })
  })

  it('AppSnackbar no longer uses removed Vuetify v-snackbar multi-line prop', () => {
    const snackbarSource = readFileSync(
      path.resolve(process.cwd(), 'src/components/AppSnackbar.vue'),
      'utf8'
    )

    expect(snackbarSource).not.toContain(':multi-line=')
  })
})
