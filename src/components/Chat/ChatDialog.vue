<template>
  <v-dialog v-model="show" width="500">
    <v-card>
      <v-card-title class="a-text-header">
        {{ title }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-4">{{ text }}</v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" class="a-btn-regular" @click="show = false">
          {{ $t('chats.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  computed: {
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  }
}
</script>
