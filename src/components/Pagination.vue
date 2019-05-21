<template>
  <div>
    <v-btn icon @click="page--" :disabled="page <= 1">
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-btn icon @click="page++" :disabled="page >= pages">
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  computed: {
    page: {
      get () {
        return this.value
      },
      set (value) {
        if (value > this.pages || value < 1) {
          return
        }

        this.$emit('input', value)
      }
    }
  },
  props: {
    value: {
      type: Number,
      required: true
    },
    pages: {
      type: Number,
      required: true
    }
  }
}
</script>
