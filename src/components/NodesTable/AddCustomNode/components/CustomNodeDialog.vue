<template>
  <v-dialog v-model="open" :width="500">
    <template #activator="{ props }">
      <slot name="activator" :props="props" />
    </template>

    <v-card>
      <v-card-title class="a-text-header">
        {{ $t('nodes.custom_node.dialog_title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-4">
        <slot name="input" />
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer />

        <v-btn variant="text" class="a-btn-regular" @click="open = false">
          {{ $t('transfer.confirm_cancel') }}
        </v-btn>

        <slot name="submit" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const open = computed({
      get() {
        return props.modelValue
      },
      set(value) {
        emit('update:modelValue', value)
      }
    })

    return {
      open
    }
  }
})
</script>
