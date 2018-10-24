<template>
  <v-snackbar :timeout="message.timeout" :color="message.color"
    v-model="message.snackbar_visibility"
    class="text-xs-center">{{message.text}}</v-snackbar>
</template>

<script>
export default {
  name: 'Snackbar',
  props: ['message']
}
</script>

<style scoped>

</style>
