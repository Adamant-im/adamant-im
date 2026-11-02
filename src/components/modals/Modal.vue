<template>
  <component
    :is="dialog"
    v-if="dialog"
    v-bind="{ ...modal.props, ...modal.dialogProps }"
    :model-value="modal.isOpen"
    @update:model-value="onUpdateModelValue"
    @close="onClose"
    @dismiss="onDismiss"
    @after-leave="onAfterLeave"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { modalRegistry } from './registry'
import { useModalsStore, type ModalSpec } from '@/stores/modals'

const props = defineProps<{
  modal: ModalSpec
}>()

const modalsStore = useModalsStore()

const dialog = computed(() => modalRegistry[props.modal.component])

const onClose = (result?: unknown) => {
  modalsStore.close(props.modal, result)
}

const onDismiss = () => {
  modalsStore.dismiss(props.modal)
}

const onUpdateModelValue = (value: boolean) => {
  if (!value) {
    onDismiss()
  }
}

// Remove the modal only after its leave transition, so it does not vanish abruptly
const onAfterLeave = () => {
  modalsStore.remove(props.modal)
}
</script>
