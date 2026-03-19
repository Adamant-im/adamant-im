const LEGACY_GUARD_COMPAT_PATCH_FLAG = '__legacyGuardCompatPatched'

const isPromiseLike = (value) => {
  return !!value && typeof value.then === 'function'
}

const hasLegacyNextSignature = (guard) => {
  return typeof guard === 'function' && guard.length > 2
}

/**
 * Adapts callback-style navigation guards (`to, from, next`) to return-based guards
 * required by vue-router@5
 *
 * This is needed for third-party integrations (e.g., Vuetify 4 overlay back-button handler)
 * that still register legacy guards.
 *
 * @param {import('vue-router').NavigationGuardWithThis<undefined>} guard
 * @returns {import('vue-router').NavigationGuardWithThis<undefined>}
 */
export const adaptLegacyGuard = (guard) => {
  if (!hasLegacyNextSignature(guard)) {
    return guard
  }

  return (to, from) =>
    new Promise((resolve, reject) => {
      let settled = false

      const next = (value) => {
        if (settled) return
        settled = true
        resolve(value)
      }

      try {
        const result = guard(to, from, next)

        if (isPromiseLike(result)) {
          result
            .then((resolvedValue) => {
              if (!settled) {
                settled = true
                resolve(resolvedValue)
              }
            })
            .catch(reject)
          return
        }

        if (result !== undefined && !settled) {
          settled = true
          resolve(result)
        }
      } catch (error) {
        reject(error)
      }
    })
}

/**
 * Patches router guard registrars to transparently wrap legacy callback-style guards
 *
 * @param {import('vue-router').Router} router
 */
export const patchLegacyNavigationGuards = (router) => {
  if (router[LEGACY_GUARD_COMPAT_PATCH_FLAG]) {
    return
  }

  const registerBeforeEach = router.beforeEach.bind(router)
  const registerBeforeResolve = router.beforeResolve.bind(router)

  router.beforeEach = (guard) => registerBeforeEach(adaptLegacyGuard(guard))
  router.beforeResolve = (guard) => registerBeforeResolve(adaptLegacyGuard(guard))

  router[LEGACY_GUARD_COMPAT_PATCH_FLAG] = true
}
