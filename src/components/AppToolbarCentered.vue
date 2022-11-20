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
            :class="`${className}__back-button`"
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
@import '~vuetify/settings';
@import '../assets/styles/settings/_colors.scss';

.app-toolbar-centered {
  padding: 0;

  :deep(.v-toolbar__title:not(:first-child)) {
    padding-left: 0 !important;
  }

  &__back-button {
    margin: 6px 6px 6px -6px !important;
  }
}

/** Themes **/
.v-theme--light {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map-get($adm-colors, 'secondary2-transparent')
    }
  }
}

.v-theme--dark {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map-get($shades, 'black');
    }
  }
}
</style>
