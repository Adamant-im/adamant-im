<template>
  <v-dialog
    v-model="show"
    width="500"
  >
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text>{{ text }}</v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          flat="flat"
          @click="show = false"
        >
          {{ $t('chats.ok') }}
        </v-btn>
      </v-card-actions>
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
    },
    title: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    }
  }
}
</script>
