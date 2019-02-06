<template>
  <div class="progress-fog" v-if="show">
    <v-progress-circular :size="150" :stroke="1" class="progress-circular" color="#4A4A4A"
      indeterminate />
  </div>
</template>

<script>
export default {
  props: {
    show: {
      default: false,
      type: Boolean
    }
  }
}
</script>

<style lang="stylus" scoped>
.progress-circular {
  left: 50%;
  margin: 0px -75px;
  position: fixed
}
.progress-fog {
  background: rgba(0,0,0,0.3);
  height: 100%;
  left: 0;
  min-height: 100vh;
  padding-top: 15%;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 10;
}
</style>
