<template>
  <v-container :class="[classes, className]" fluid>
    <v-row justify="center" gap="0">
      <container :disableMaxWidth="disableMaxWidth">
        <v-toolbar ref="toolbar" :flat="flat" :height="height">
          <back-button v-if="showBack" @click="goBack" />
          <v-toolbar-title v-if="title" :class="`${className}__title`">
            <div :class="`${className}__title-text`">{{ title }}</div>
            <div v-if="subtitle" :class="`${className}__subtitle`">
              {{ subtitle }}
            </div>
          </v-toolbar-title>
          <v-progress-circular
            class="spinner"
            v-show="consideredOffline && hasSpinner"
            indeterminate
            :size="COMMON_INLINE_SPINNER_SIZE"
          />
        </v-toolbar>
      </container>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import BackButton from '@/components/common/BackButton/BackButton.vue'
import { computed, inject, nextTick, Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useConsiderOffline } from '@/hooks/useConsiderOffline'
import { filterRouteParams } from '@/router/filterRouteParams'
import { COMMON_INLINE_SPINNER_SIZE } from '@/components/common/helpers/uiMetrics'
import { sidebarLayoutKey } from '@/lib/constants'

type Props = {
  title?: string
  subtitle?: string
  flat?: boolean
  app?: boolean
  fixed?: boolean
  height?: number
  showBack?: boolean
  hasSpinner?: boolean
  disableMaxWidth?: boolean
  sticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  flat: false,
  app: false,
  fixed: false,
  height: 56,
  showBack: true,
  hasSpinner: false,
  disableMaxWidth: false,
  sticky: false
})

const store = useStore()
const route = useRoute()
const router = useRouter()
const sidebarLayoutRef = inject<Ref>(sidebarLayoutKey)

const className = 'app-toolbar-centered'

const { consideredOffline } = useConsiderOffline()
const SETTINGS_PATH_PREFIX = '/options'
const SETTINGS_ROUTE_PATHS = ['/votes']

const isSettingsPath = (path?: string) => {
  return !!path && (path.startsWith(SETTINGS_PATH_PREFIX) || SETTINGS_ROUTE_PATHS.includes(path))
}

const classes = computed(() => {
  return {
    'v-toolbar--fixed': props.app,
    'app-toolbar--fixed': props.fixed,
    'app-toolbar--sticky': props.sticky
  }
})

const goBack = () => {
  if (route.query.from?.includes('chats')) {
    router.push(route.query.from as string)
    return
  }

  if (route.query.fromChat) {
    router.back()
    return
  }

  if (route.name === 'DevAdamantWallets' || route.name === 'DevVibrations') {
    router.push('/options/dev-screens')
    return
  }

  const parentRoute = route.matched.length > 1 ? route.matched.at(-2) : null

  if (parentRoute) {
    const params = filterRouteParams(parentRoute.path, route.params)
    const targetRoute = {
      name: parentRoute.name,
      ...(Object.keys(params).length > 0 ? { params } : {})
    }
    const targetPath = router.resolve(targetRoute).path

    if (isSettingsPath(route.path) && isSettingsPath(targetPath) && sidebarLayoutRef?.value) {
      store.commit('options/setSettingsLastRoute', route.path)
      store.commit('options/setSettingsScrollPosition', {
        path: route.path,
        top: sidebarLayoutRef.value.scrollTop
      })

      const targetTop = store.getters['options/settingsScrollPosition'](targetPath)

      router.push(targetRoute).then(async () => {
        await nextTick()
        await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
        sidebarLayoutRef.value?.scrollTo({ top: targetTop })
        await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))
        sidebarLayoutRef.value?.scrollTo({ top: targetTop })
      })
      return
    }

    router.push(targetRoute)
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
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;
@use 'vuetify/settings';

.app-toolbar-centered {
  --a-app-toolbar-title-letter-spacing: var(--a-letter-spacing-caps-subtle);

  padding: 0;

  :deep(.v-toolbar-title) {
    letter-spacing: var(--a-app-toolbar-title-letter-spacing);
  }

  &__title-text {
    @include mixins.a-text-regular-enlarged();
  }

  &__subtitle {
    @include mixins.a-text-regular();
  }

  .spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.2s ease;
  }

  :deep(.v-toolbar-title:not(:first-child)) {
    margin-inline-start: 0;
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
