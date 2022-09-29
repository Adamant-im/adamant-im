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
export default {
  name: 'InlineSpinner',
  props: {
    size: {
      default: 32,
      type: Number
    }
  },
  data () {
    return {
      spinnerSize: this.size
    }
  }
}
</script>
