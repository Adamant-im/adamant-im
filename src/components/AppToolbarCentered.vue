<template>
  <v-container :class="[classes, className]" fluid>
    <v-row justify="center" no-gutters>
      <container>
        <v-toolbar ref="toolbar" :flat="flat" :height="height">
          <v-btn v-if="showBack" icon size="small" @click="goBack">
            <v-icon :icon="mdiArrowLeft" size="x-large" />
          </v-btn>

          <v-toolbar-title ref="title" v-if="title" class="a-text-regular-enlarged flex-0-1">
            <div>{{ title }}</div>
            <div v-if="subtitle" class="body-1">
              {{ subtitle }}
            </div>
          </v-toolbar-title>
          <!-- Waiting for spinnerPosition and transformSpinner to be calculated in order to
               escape jerking of the spinner -->
          <v-progress-circular
            class="spinner"
            v-show="!isOnline && hasSpinner && spinnerPosition && transformSpinner"
            indeterminate
            :size="24"
            :style="{ left: spinnerPosition, transform: transformSpinner }"
          />
        </v-toolbar>
      </container>
    </v-row>
  </v-container>
</template>

<script>
import { mdiArrowLeft } from '@mdi/js'

export default {
  data: () => ({
    spinnerPosition: '',
    transformSpinner: ''
  }),
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
    app: {
      type: Boolean,
      default: false
    },
    fixed: {
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
    },
    hasSpinner: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    return {
      mdiArrowLeft
    }
  },
  mounted() {
    window.addEventListener('resize', this.calculateSpinnerPosition)
    this.calculateSpinnerPosition()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.calculateSpinnerPosition)
  },
  computed: {
    isOnline() {
      return this.$store.getters['isOnline']
    },
    classes() {
      return {
        'v-toolbar--fixed': this.app,
        'app-toolbar--fixed': this.fixed
      }
    },
    className: () => 'app-toolbar-centered'
  },
  methods: {
    calculateSpinnerPosition() {
      const titleEl = this.$refs.title?.$el
      const toolbarEl = this.$refs.toolbar?.$el

      if (!titleEl || !toolbarEl) return

      const titleRect = titleEl.getBoundingClientRect()
      const toolbarRect = toolbarEl.getBoundingClientRect()
      const titleEnd = titleRect.right - toolbarRect.left + 16

      const center = toolbarRect.width / 2

      this.spinnerPosition = titleEnd > center ? `${titleEnd}px` : '50%'
      this.transformSpinner = titleEnd > center ? 'translate(-50%, -40%)' : 'translate(-50%, -50%)'
    },
    goBack() {
      // there are no pages in history to go back
      if (history.length === 1) {
        this.$router.replace('/')
        return
      }

      this.$router.back()
    }
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.app-toolbar-centered {
  padding: 0;

  :deep(.v-toolbar-title) {
    letter-spacing: 0.02em;
  }

  .spinner {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.2s ease;
  }

  :deep(.v-toolbar-title:not(:first-child)) {
    margin-inline-start: 0;
  }

  :deep(.v-toolbar__content > .v-btn:first-child) {
    margin-inline-start: 4px;
  }

  :deep(.v-btn:hover) {
    > .v-btn__overlay {
      opacity: 0;
    }
  }
}

.app-toolbar--fixed {
  position: fixed;
  z-index: 2;
}

/** Themes **/
.v-theme--light {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map.get(colors.$adm-colors, 'secondary2');
    }

    .spinner {
      color: map.get(colors.$adm-colors, 'grey');
    }
  }
}

.v-theme--dark {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map.get(colors.$adm-colors, 'black');
      color: map.get(settings.$shades, 'white');
    }

    .spinner {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
</style>
