<template>
  <md-spinner
    :md-size="spinnerSize"
    :md-stroke="1"
    md-indeterminate
    class="inline-spinner md-accent"
  />
</template>

<script>
export default {
  name: 'inline-spinner',
  props: ['size'],
  data () {
    return {
      spinnerSize: this.size || 32
    }
  }
}
</script>

<style>
  .inline-spinner.md-accent .md-spinner-path {
    stroke: #4A4A4A;
  }
</style>
