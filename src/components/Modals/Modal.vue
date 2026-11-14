<template>
  <v-dialog
    v-bind="modal.dialogProps"
    :model-value="isOpen"
    @update:model-value="onUpdateModelValue"
    @after-leave="removeFromStore"
  >
    <component :is="dialog" v-bind="modal.props" @close="onClose" @dismiss="onDismiss" />
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { getDialog } from './dialogs'
import { useModalsStore, type ModalSpec } from '@/stores/modals'

const props = defineProps<{
  modal: ModalSpec
}>()

const modalsStore = useModalsStore()

const dialog = computed(() => getDialog(props.modal.component))

// The dialog is kept mounted until its leave transition finishes, so closing it
// (programmatically, via Escape or a backdrop click) still animates out.
const isOpen = ref(true)
const pendingResult = ref<unknown>()

const close = (result?: unknown) => {
  pendingResult.value = result
  isOpen.value = false
}

const onUpdateModelValue = (value: boolean) => {
  if (value) {
    isOpen.value = true
    return
  }

  // Only a user-initiated close (Escape, backdrop click) arrives while the dialog is
  // still considered open; echoes of a programmatic close must not drop the result.
  if (isOpen.value) {
    pendingResult.value = undefined
    isOpen.value = false
  }
}

const onClose = (result?: unknown) => {
  close(result)
}

const onDismiss = () => {
  close(undefined)
}

const removeFromStore = () => {
  modalsStore.close(props.modal, pendingResult.value)
}
</script>
