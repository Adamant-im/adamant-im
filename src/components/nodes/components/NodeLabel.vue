<template>
  <v-chip :class="className" label>{{ label }}</v-chip>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const className = 'blockchain-label'

export default defineComponent({
  props: {
    label: {
      type: String,
      required: true
    }
  },
  setup() {
    return {
      className
    }
  }
})
</script>

<style lang="scss" scoped>
.blockchain-label {
  --v-chip-height: 18px;
  padding: 0 4px;
}
</style>
