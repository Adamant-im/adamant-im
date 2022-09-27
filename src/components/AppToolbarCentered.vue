<template>
  <v-container
    :class="[classes, className]"
    fluid
  >
    <v-row
      justify="center"
      no-gutters
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
    </v-row>
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
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/settings/_colors.scss';
@import '../assets/stylus/settings/_colors.scss';

.app-toolbar-centered {
  padding: 0;

  :deep(..v-toolbar__title:not(:first-child)) {
    padding-left: 0;
  }
}

/** Themes **/
.theme--light {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map-get($adm-colors, 'secondary2-transparent')
    }
  }
}

.theme--dark {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map-get($shades, 'black');
    }
  }
}
</style>
