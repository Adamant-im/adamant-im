<template>
  <v-container fluid class="app-toolbar-centered" :class="classes">
    <v-layout row wrap justify-center>

      <container>

        <v-toolbar
          :flat="flat"
          :height="height"
          ref="toolbar"
        >
          <v-btn v-if="showBack" @click="goBack" icon>
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>

          <v-toolbar-title v-if="title">
            <div>{{ title }}</div>
            <div v-if="subtitle" class="body-1">{{ subtitle }}</div>
          </v-toolbar-title>
        </v-toolbar>

      </container>

    </v-layout>
  </v-container>
</template>

<script>
import Applicationable from 'vuetify/es5/mixins/applicationable'

export default {
  computed: {
    classes () {
      return {
        'v-toolbar--fixed': this.app
      }
    }
  },
  methods: {
    goBack () {
      this.$router.back()
    },
    updateApplication () {
      // Forward function call from `Applicationable` mixin to `VToolbar`
      //
      // 1. Do not `updateApplication` when created() because VToolbar is not mounted,
      // it will be called again when mounted().
      if (this.$refs.toolbar) { // [1]
        return this.$refs.toolbar.updateApplication()
      }
    }
  },
  mixins: [
    Applicationable('top', [
      'clippedLeft',
      'clippedRight',
      'computedHeight',
      'invertedScroll',
      'manualScroll'
    ])
  ],
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

<style lang="stylus" scoped>
.app-toolbar-centered
  padding: 0
</style>
