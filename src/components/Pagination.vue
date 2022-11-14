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
    modelValue: {
      type: Number,
      required: true
    },
    pages: {
      type: Number,
      required: true
    }
  },
  emits: ['update:modelValue'],
  computed: {
    page: {
      get () {
        return this.modelValue
      },
      set (value) {
        if (value > this.pages || value < 1) {
          return
        }

        this.$emit('update:modelValue', value)
      }
    }
  }
}
</script>
