import type { Page } from '@playwright/test'

/**
 * Navigates without reloading the document. Authenticated E2E flows must use the application router
 * because production deliberately no longer restores passphrases after a full page refresh.
 */
export const navigateInApp = async (page: Page, target: string, _options?: unknown) => {
  await page.evaluate(async (route) => {
    const appRoot = document.querySelector('#app') as HTMLElement & {
      __vue_app__?: {
        config: {
          globalProperties: {
            $router?: {
              push: (target: string) => Promise<unknown>
              isReady: () => Promise<void>
            }
          }
        }
      }
    }
    const router = appRoot.__vue_app__?.config.globalProperties.$router

    if (!router) {
      throw new Error('Application router is unavailable')
    }

    await router.push(route)
    await router.isReady()
  }, target)
}
