<template>
  <div>
    <v-btn
      icon
      :disabled="page <= 1"
      @click="page--"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-btn
      icon
      :disabled="page >= pages"
      @click="page++"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Number,
      required: true
    },
    pages: {
      type: Number,
      required: true
    }
  },
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
  }
}
</script>
