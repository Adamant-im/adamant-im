<template>
  <v-dialog
    v-model="show"
    width="500"
  >
    <v-card>
      <v-layout
        justify-center
        align-center
        class="pa-5"
      >
        Start new chat
      </v-layout>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  computed: {
    show: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  },
  props: {
    value: {
      type: Boolean,
      required: true
    }
  }
}
</script>
