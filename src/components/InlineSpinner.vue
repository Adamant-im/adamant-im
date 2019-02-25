<template>
  <v-layout justify-center>
    <v-progress-circular :size="spinnerSize" :stroke="1" class="progress-circular" color="#4A4A4A"
      indeterminate />
  </v-layout>
</template>

<script>
export default {
  data () {
    return {
      spinnerSize: this.size
    }
  },
  name: 'inline-spinner',
  props: {
    size: {
      default: 32,
      type: Number
    }
  }
}
</script>
