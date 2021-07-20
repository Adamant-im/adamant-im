<template>
  <v-container
    :class="[classes, className]"
    fluid
  >
    <v-layout
      row
      wrap
      justify-center
    >
      <container>
        <v-toolbar
          ref="toolbar"
          :flat="flat"
          :height="height"
        >
          <v-btn
            v-if="showBack"
            icon
            small
            @click="goBack"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>

          <v-toolbar-title
            v-if="title"
            class="a-text-regular-enlarged"
          >
            <div>{{ title }}</div>
            <div
              v-if="subtitle"
              class="body-1"
            >
              {{ subtitle }}
            </div>
          </v-toolbar-title>
        </v-toolbar>
      </container>
    </v-layout>
  </v-container>
</template>

<script>
import Applicationable from 'vuetify/es5/mixins/applicationable'

export default {
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
      default: 56
    },
    showBack: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    classes () {
      return {
        'v-toolbar--fixed': this.app
      }
    },
    className: () => 'app-toolbar-centered'
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
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '../assets/stylus/settings/_colors.styl'

.app-toolbar-centered
  padding: 0

  >>> .v-toolbar__title:not(:first-child)
    margin-left: 0px

/** Themes **/
.theme--light
  .app-toolbar-centered
    .v-toolbar
      background-color: $adm-colors.secondary2-transparent

.theme--dark
  .app-toolbar-centered
    .v-toolbar
      background-color: $shades.black
</style>
