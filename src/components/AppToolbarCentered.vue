<template>
  <v-container fluid class="pa-0">
    <v-layout row wrap justify-center>

      <v-flex xs12 sm12 md8 lg5>

        <v-toolbar
          class="app-toolbar-centered"
          :flat="flat"
          :height="height"
        >
          <v-btn v-if="showBack" @click="goBack" icon>
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>

          <v-toolbar-title v-if="title">
            <div>{{ title }}</div>
            <div v-if="subtitle" class="body-1">{{ subtitle }}</div>
          </v-toolbar-title>
        </v-toolbar>

      </v-flex>

    </v-layout>
  </v-container>
</template>

<script>
export default {
  methods: {
    goBack () {
      this.$router.back()
    }
  },
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
  }
}
</script>
