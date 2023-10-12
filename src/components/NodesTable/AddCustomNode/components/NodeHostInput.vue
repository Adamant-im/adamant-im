<template>
  <v-text-field
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    autofocus
    color="primary"
    class="a-input"
    variant="underlined"
    :label="$t('nodes.custom_node.form.host_input.label')"
    :hint="$t('nodes.custom_node.form.host_input.hint')"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    modelValue: {
      type: String
    }
  },
  emits: ['update:modelValue']
})
</script>
