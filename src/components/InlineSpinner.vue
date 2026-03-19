<template>
  <v-row justify="center" gap="0">
    <v-progress-circular
      :size="spinnerSize"
      :stroke="1"
      class="progress-circular"
      color="var(--a-spinner-neutral-color)"
      indeterminate
    />
  </v-row>
</template>

<script>
import { defineComponent, toRefs } from 'vue'

const INLINE_SPINNER_SIZE_DEFAULT = 32

export default defineComponent({
  props: {
    size: {
      default: INLINE_SPINNER_SIZE_DEFAULT,
      type: Number
    }
  },
  setup(props) {
    const { size: spinnerSize } = toRefs(props)

    return {
      spinnerSize
    }
  }
})
</script>
