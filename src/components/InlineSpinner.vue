<template>
  <v-row
    justify="center"
    no-gutters
  >
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
import { defineComponent, defineProps } from 'vue'

export default defineComponent({
  setup () {
    const props = defineProps({
      size: {
        default: 32,
        type: Number
      }
    })

    const spinnerSize = props.size

    return {
      spinnerSize,
      props
    }
  }
})
</script>
