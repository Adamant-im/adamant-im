import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ModalId = number

export type ModalSpec = {
  id: ModalId
  /** Name of the dialog component, resolved by the modals registry */
  component: string
  /** Props passed to the dialog component */
  props?: Record<string, unknown>
  /** Props passed to the underlying `v-dialog` (e.g. `width`, `persistent`) */
  dialogProps?: Record<string, unknown>
}

export type OpenModalOptions = Omit<ModalSpec, 'id'> & {
  id?: ModalId
}

type ModalResolver = {
  resolve: (value?: unknown) => void
}

// Promise resolvers are kept outside of the store state on purpose: functions are not
// serializable and would break devtools inspection and state persistence.
const resolvers = new Map<ModalId, ModalResolver>()

export const useModalsStore = defineStore('modals', () => {
  const stack = ref<ModalSpec[]>([])
  const seq = ref(1)

  const modals = computed(() => stack.value)
  const top = computed(() => stack.value[stack.value.length - 1])
  const hasOpenModals = computed(() => stack.value.length > 0)
  const isOpen = (id: ModalId) => stack.value.some((modal) => modal.id === id)

  /**
   * Open a dialog and await its result. The returned promise resolves with the payload
   * the dialog passes to its `close` event, or with `undefined` when the dialog is
   * dismissed (Escape, backdrop click) or closed programmatically without a result.
   */
  const open = <TResult = unknown>(options: OpenModalOptions): Promise<TResult | undefined> => {
    const id = options.id ?? seq.value++
    const modal: ModalSpec = {
      id,
      component: options.component,
      props: options.props ?? {},
      dialogProps: options.dialogProps ?? {}
    }

    stack.value.push(modal)

    return new Promise<TResult | undefined>((resolve) => {
      resolvers.set(id, { resolve: resolve as (value?: unknown) => void })
    })
  }

  /** Close a dialog, resolving its `open` promise with `result` */
  const close = <TResult = unknown>(spec: ModalId | ModalSpec, result?: TResult) => {
    const id = typeof spec === 'object' ? spec.id : spec

    const index = stack.value.findIndex((modal) => modal.id === id)
    if (index !== -1) {
      stack.value.splice(index, 1)
    }

    const resolver = resolvers.get(id)
    if (resolver) {
      resolvers.delete(id)
      resolver.resolve(result)
    }
  }

  /** Close a dialog without a result, resolving its `open` promise with `undefined` */
  const dismiss = (spec: ModalId | ModalSpec) => {
    close(spec, undefined)
  }

  /** Close every open dialog, resolving each `open` promise with `undefined` */
  const closeAll = () => {
    const ids = stack.value.map((modal) => modal.id)
    stack.value = []

    for (const id of ids) {
      const resolver = resolvers.get(id)
      if (resolver) {
        resolvers.delete(id)
        resolver.resolve(undefined)
      }
    }
  }

  const $reset = () => {
    closeAll()
    seq.value = 1
  }

  return {
    stack,
    seq,

    modals,
    top,
    hasOpenModals,
    isOpen,

    open,
    close,
    dismiss,
    closeAll,
    $reset
  }
})
