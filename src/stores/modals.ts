import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ModalId = number

export type ModalSpec = {
  id: ModalId
  /** Name of a dialog registered in `@/components/modals/registry` */
  component: string
  /** Props passed to the dialog component */
  props: Record<string, unknown>
  /** Props passed to the dialog `v-dialog`, e.g. `persistent` */
  dialogProps: Record<string, unknown>
  /** `false` once the modal is closed and waits for its leave transition to finish */
  isOpen: boolean
}

export type OpenModalOptions = {
  component: string
  props?: Record<string, unknown>
  dialogProps?: Record<string, unknown>
}

// Promise resolvers are not serializable, so they live outside of the Pinia state
const resolvers = new Map<ModalId, (result?: unknown) => void>()

let sequence = 0

export const useModalsStore = defineStore('modals', () => {
  const stack = ref<ModalSpec[]>([])

  /**
   * Opens a modal and resolves with its result, or with `undefined` when it is dismissed.
   */
  const open = <TResult = unknown>(options: OpenModalOptions): Promise<TResult | undefined> => {
    const id = ++sequence

    return new Promise((resolve) => {
      resolvers.set(id, resolve as (result?: unknown) => void)
      stack.value.push({
        id,
        component: options.component,
        props: options.props ?? {},
        dialogProps: options.dialogProps ?? {},
        isOpen: true
      })
    })
  }

  const findIndex = (spec: ModalId | { id: ModalId }) => {
    const id = typeof spec === 'object' ? spec.id : spec

    return stack.value.findIndex((modal) => modal.id === id)
  }

  /**
   * Closes a modal and resolves its promise. The modal stays in the stack until `remove`
   * is called, so the leave transition can play. Repeated calls are ignored.
   */
  const close = <TResult = unknown>(spec: ModalId | { id: ModalId }, result?: TResult) => {
    const modal = stack.value[findIndex(spec)]

    if (!modal || !modal.isOpen) return

    modal.isOpen = false

    const resolve = resolvers.get(modal.id)
    resolvers.delete(modal.id)
    resolve?.(result)
  }

  const dismiss = (spec: ModalId | { id: ModalId }) => close(spec, undefined)

  /**
   * Removes a closed modal from the stack, normally after its leave transition.
   */
  const remove = (spec: ModalId | { id: ModalId }) => {
    const index = findIndex(spec)

    if (index === -1) return

    close(spec)
    stack.value.splice(index, 1)
  }

  /**
   * Dismisses and removes every modal at once.
   */
  const closeAll = () => {
    const modals = [...stack.value]

    modals.forEach((modal) => remove(modal))
  }

  return {
    stack,
    open,
    close,
    dismiss,
    remove,
    closeAll
  }
})
