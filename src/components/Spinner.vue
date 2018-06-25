<template>
  <md-layout class='spinner'>
    <md-spinner
      :md-size="150"
      :md-stroke="1"
      md-indeterminate
      class="md-accent"
      style="margin: 0px -75px;position: fixed;left: 50%;"
    />
  </md-layout>
</template>

<script>
export default {
  name: 'spinner',
  data () {
    return { }
  }
}
</script>

<style>
  .spinner {
    position: absolute;
    background: rgba(0,0,0,0.3);
    height: 100%;
    width: 100%;
    min-height: 100vh;
    left: 0;
    padding-top: 15%;
    z-index: 10;
    top: -25px;
  }

  .spinner .md-spinner.md-accent .md-spinner-path {
    stroke: #4A4A4A;
  }
</style>
