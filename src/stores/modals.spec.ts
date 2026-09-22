import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useModalsStore } from './modals'

describe('Store: modals', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a modal to the stack and assigns sequential ids', () => {
    const modals = useModalsStore()

    modals.open({ component: 'ChatStartDialog' })
    modals.open({ component: 'ChatStartDialog' })

    expect(modals.modals).toHaveLength(2)
    expect(modals.modals[0].id).not.toBe(modals.modals[1].id)
    expect(modals.hasOpenModals).toBe(true)
    expect(modals.top?.id).toBe(modals.modals[1].id)
  })

  it('normalizes optional props and dialogProps', () => {
    const modals = useModalsStore()

    modals.open({ component: 'ChatStartDialog' })

    expect(modals.modals[0].props).toEqual({})
    expect(modals.modals[0].dialogProps).toEqual({})
  })

  it('resolves the open promise with the close result', async () => {
    const modals = useModalsStore()

    const promise = modals.open<{ partnerId: string }>({
      component: 'ChatStartDialog',
      props: { partnerId: 'U123' }
    })

    const modal = modals.top
    modals.close(modal, { partnerId: 'U123' })

    await expect(promise).resolves.toEqual({ partnerId: 'U123' })
    expect(modals.modals).toHaveLength(0)
    expect(modals.hasOpenModals).toBe(false)
  })

  it('closes a modal by id', async () => {
    const modals = useModalsStore()

    const promise = modals.open({ component: 'ChatStartDialog' })
    const id = modals.top.id

    modals.close(id, 'result')

    await expect(promise).resolves.toBe('result')
    expect(modals.isOpen(id)).toBe(false)
  })

  it('resolves dismissed modals with undefined', async () => {
    const modals = useModalsStore()

    const promise = modals.open({ component: 'ChatStartDialog' })
    const modal = modals.top

    modals.dismiss(modal)

    await expect(promise).resolves.toBeUndefined()
    expect(modals.modals).toHaveLength(0)
  })

  it('closing an unknown modal does not throw', () => {
    const modals = useModalsStore()

    expect(() => modals.close(9999)).not.toThrow()
  })

  it('closeAll resolves every open promise with undefined and clears the stack', async () => {
    const modals = useModalsStore()

    const first = modals.open({ component: 'ChatStartDialog' })
    const second = modals.open({ component: 'ChatStartDialog' })

    modals.closeAll()

    await Promise.all([
      expect(first).resolves.toBeUndefined(),
      expect(second).resolves.toBeUndefined()
    ])
    expect(modals.modals).toHaveLength(0)
  })

  it('$reset closes all modals and restarts id sequence', async () => {
    const modals = useModalsStore()

    const promise = modals.open({ component: 'ChatStartDialog' })
    modals.open({ component: 'ChatStartDialog' })

    modals.$reset()

    await expect(promise).resolves.toBeUndefined()
    expect(modals.modals).toHaveLength(0)

    modals.open({ component: 'ChatStartDialog' })
    expect(modals.top.id).toBe(1)
  })

  it('keeps promise resolvers out of the store state', async () => {
    const modals = useModalsStore()

    modals.open({ component: 'ChatStartDialog' })

    // Functions are not serializable: resolvers must live outside the state so that
    // devtools inspection and state persistence keep working.
    expect(JSON.stringify(modals.$state)).not.toMatch(/resolve/)

    modals.closeAll()
  })
})
