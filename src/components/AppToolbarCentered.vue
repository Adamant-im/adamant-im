<template>
  <v-container :class="[classes, className]" fluid>
    <v-row justify="center" no-gutters>
      <container :noMaxWidth="noMaxWidth">
        <v-toolbar ref="toolbar" :flat="flat" :height="height">
          <v-btn v-if="showBack" icon size="small" @click="goBack">
            <v-icon :icon="mdiArrowLeft" size="x-large" />
          </v-btn>

          <v-toolbar-title v-if="title" class="a-text-regular-enlarged">
            <div>{{ title }}</div>
            <div v-if="subtitle" class="body-1">
              {{ subtitle }}
            </div>
          </v-toolbar-title>
        </v-toolbar>
      </container>
    </v-row>
  </v-container>
</template>

<script>
import { mdiArrowLeft } from '@mdi/js'
import { useRoute, useRouter } from 'vue-router'
import { onBeforeUnmount } from 'vue'

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
    noMaxWidth: {
      type: Boolean,
      default: false
    },
    sticky: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const route = useRoute()
    const router = useRouter()

    const className = 'app-toolbar-centered'

    const goBack = () => {
      if (route.query?.from?.includes('chats')) {
        router.push(route.query?.from)
        return
      }

      if (route.query?.fromChat) {
        router.back()
        return
      }

      const parentRoute = route.matched.length > 1 ? route.matched[route.matched.length - 2] : null

      if (parentRoute) {
        router.push(parentRoute)
        return
      }

      if (history.state?.back.includes('chats')) {
        router.push({
          name: 'Chats'
        })
        return
      }

      // there are no pages in history to go back
      if (history.length === 1) {
        router.replace('/')
        return
      }

      router.back()
    }

    const onKeydownHandler = (event) => {
      if (event.key === 'Escape') {
        if (route.query?.from?.includes('chats')) {
          goBack()
        }
      }
    }

    document.addEventListener('keydown', onKeydownHandler)

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeydownHandler)
    })

    return {
      className,
      mdiArrowLeft,
      goBack
    }
  },
  computed: {
    classes() {
      return {
        'v-toolbar--fixed': this.app,
        'app-toolbar--fixed': this.fixed,
        'app-toolbar--sticky': this.sticky
      }
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

  :deep(.v-toolbar-title:not(:first-child)) {
    margin-inline-start: 0;
  }

  :deep(.v-toolbar__content) {
    top: 0;
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

.app-toolbar--sticky {
  position: sticky;
  top: 0;
  z-index: 2;
}

/** Themes **/
.v-theme--light {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map.get(colors.$adm-colors, 'secondary2');
    }
  }
}

.v-theme--dark {
  .app-toolbar-centered {
    .v-toolbar {
      background-color: map.get(colors.$adm-colors, 'black');
      color: map.get(settings.$shades, 'white');
    }
  }
}
</style>
