<template>
  <v-row justify="center" no-gutters>
    <v-progress-circular
      :size="spinnerSize"
      :stroke="1"
      class="progress-circular"
      color="#4A4A4A"
      indeterminate
    />
  </v-row>
</template>

<script>
import { defineComponent, toRefs } from 'vue'

export default defineComponent({
  props: {
    size: {
      default: 32,
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
