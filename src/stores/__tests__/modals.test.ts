import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useModalsStore } from '@/stores/modals'

describe('modals store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('opens a modal and resolves with the close result', async () => {
    const store = useModalsStore()
    const promise = store.open<string>({ component: 'ChatStartDialog', props: { partnerId: 'U1' } })

    expect(store.stack).toHaveLength(1)
    expect(store.stack[0]).toMatchObject({
      component: 'ChatStartDialog',
      props: { partnerId: 'U1' },
      isOpen: true
    })

    store.close(store.stack[0], 'result')

    await expect(promise).resolves.toBe('result')
  })

  it('keeps a closed modal in the stack until it is removed', () => {
    const store = useModalsStore()
    store.open({ component: 'ChatStartDialog' })
    const [modal] = store.stack

    store.close(modal)
    expect(store.stack[0].isOpen).toBe(false)

    store.remove(modal)
    expect(store.stack).toHaveLength(0)
  })

  it('resolves with undefined on dismiss and ignores repeated closes', async () => {
    const store = useModalsStore()
    const promise = store.open({ component: 'ChatStartDialog' })
    const { id } = store.stack[0]

    store.dismiss(id)
    store.close(id, 'late')

    await expect(promise).resolves.toBeUndefined()
  })

  it('resolves a modal that is removed without being closed', async () => {
    const store = useModalsStore()
    const promise = store.open({ component: 'ChatStartDialog' })

    store.remove(store.stack[0])

    await expect(promise).resolves.toBeUndefined()
    expect(store.stack).toHaveLength(0)
  })

  it('closes every modal and gives each a unique id', async () => {
    const store = useModalsStore()
    const first = store.open({ component: 'ChatStartDialog' })
    const second = store.open({ component: 'ChatStartDialog' })

    expect(store.stack[0].id).not.toBe(store.stack[1].id)

    store.closeAll()

    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined])
    expect(store.stack).toHaveLength(0)
  })
})
