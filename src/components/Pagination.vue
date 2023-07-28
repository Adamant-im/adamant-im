<template>
  <div>
    <v-btn
      icon="mdi-chevron-left"
      :disabled="page <= 1"
      variant="text"
      @click="page--"
    />
    <v-btn
      icon="mdi-chevron-right"
      :disabled="page >= pages"
      variant="text"
      @click="page++"
    />
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
