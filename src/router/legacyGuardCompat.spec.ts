import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { patchLegacyNavigationGuards } from '@/router/legacyGuardCompat'

describe('legacy router guard compatibility', () => {
  it('keeps callback-style guards working without vue-router@5 deprecation warning', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>home</div>' } },
        { path: '/target', component: { template: '<div>target</div>' } }
      ]
    })

    patchLegacyNavigationGuards(router)

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    router.beforeEach((_to, _from, next) => {
      setTimeout(() => next(), 0)
    })

    await router.push('/target')
    await router.isReady()

    const hasLegacyNextWarning = warnSpy.mock.calls.some(([message]) =>
      String(message).includes('next() callback in navigation guards is deprecated')
    )

    warnSpy.mockRestore()

    expect(hasLegacyNextWarning).toBe(false)
    expect(router.currentRoute.value.path).toBe('/target')
  })
})
