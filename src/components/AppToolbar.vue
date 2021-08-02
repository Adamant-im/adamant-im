<template>
  <v-toolbar
    :flat="flat"
    :height="height"
    app
  >
    <v-btn
      v-if="showBack"
      icon
      @click="goBack"
    >
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>

    <v-toolbar-title v-if="title">
      <div>{{ title }}</div>
      <div
        v-if="subtitle"
        class="body-1"
      >
        {{ subtitle }}
      </div>
    </v-toolbar-title>
  </v-toolbar>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: undefined
    },
    subtitle: {
      type: String,
      default: undefined
    },
    flat: {
      type: Boolean,
      default: false
    },
    height: {
      type: Number,
      default: 64
    },
    showBack: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    goBack () {
      this.$router.back()
    }
  }
}
</script>
