<template>
  <v-bottom-navigation
    v-model="currentPageIndex"
    app
    :height="APP_NAVIGATION_HEIGHT"
    class="app-navigation"
    :elevation="0"
    :absolute="absolute"
  >
    <!-- Wallet -->
    <v-btn
      v-if="walletShouldBeVisible"
      :class="`${className}__button`"
      to="/home"
      :exact="true"
      draggable="false"
    >
      <v-icon :icon="mdiWallet" />
      <span :class="`${className}__label`">{{ t('bottom.wallet_button') }}</span>
    </v-btn>

    <!-- Chat -->
    <v-btn :class="`${className}__button`" to="/chats" draggable="false">
      <v-badge
        v-if="numOfNewMessages > 0"
        :class="`${className}__badge`"
        :value="numOfNewMessages"
        overlap
        color="primary"
        :content="numOfNewMessages > 99 ? '99+' : numOfNewMessages"
      >
        <v-icon :icon="mdiForum" />
      </v-badge>
      <v-icon v-else :icon="mdiForum" />

      <span :class="`${className}__label`">{{ t('bottom.chats_button') }}</span>
    </v-btn>

    <!-- Settings -->
    <v-btn :class="`${className}__button`" to="/options" draggable="false">
      <v-icon :icon="mdiCog" />
      <span :class="`${className}__label`">{{ t('bottom.settings_button') }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>
<script lang="ts" setup>
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { watch, onMounted, ref, computed } from 'vue'
import { mdiWallet, mdiForum, mdiCog } from '@mdi/js'
import { useI18n } from 'vue-i18n'

defineProps({
  absolute: Boolean
})

const className = 'app-navigation'
const APP_NAVIGATION_HEIGHT = 50

const pages = [
  {
    title: 'wallet',
    link: '/home'
  },
  {
    title: 'chats',
    link: '/chats'
  },
  {
    title: 'settings',
    link: '/options'
  }
]
const currentPageIndex = ref(0)
const store = useStore()
const route = useRoute()
const { t } = useI18n()

const getCurrentPageIndex = () => {
  const currentPage = pages.find((page) => {
    const pattern = new RegExp(`^${page.link}`)
    return route.path.match(pattern)
  })

  return (currentPage && pages.indexOf(currentPage)) || 0
}
const numOfNewMessages = computed(() => store.getters['chat/totalNumOfNewMessages'])

const walletShouldBeVisible = computed(() => {
  return !!store.getters['wallets/getVisibleSymbolsCount']
})

watch(route, () => {
  currentPageIndex.value = getCurrentPageIndex()
})
onMounted(() => {
  currentPageIndex.value = getCurrentPageIndex()
})
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';
@use '@/assets/styles/generic/_variables.scss';

/**
 * 1. Navigation Button.
 *    a. Active
 *    b. Inactive
 */
.app-navigation {
  &.v-bottom-navigation {
    --a-app-navigation-border-width: var(--a-border-width-thin);

    height: var(--a-app-navigation-height) !important;
    min-height: var(--a-app-navigation-height) !important;
    transform: unset !important;
    overflow: visible;

    @media (max-width: map.get(variables.$breakpoints, 'mobile')) {
      bottom: env(safe-area-inset-bottom) !important;
    }
  }

  &__button {
    height: 100%;
    font-weight: var(--a-app-navigation-button-font-weight);
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0;
  }
  &__label {
    font-size: var(--a-app-navigation-label-font-size);
  }
  :deep(.v-btn.v-btn--active) {
    font-size: unset;

    > .v-btn__overlay {
      background-color: unset;
    }
  }
  :deep(.v-btn:not(.v-btn--active)) {
    filter: unset;

    .app-navigation__label {
      font-size: var(--a-app-navigation-label-font-size-inactive);
    }
  }
  :deep(.v-bottom-navigation__content) {
    height: 100%;
  }
  :deep(.app-navigation__badge .v-badge__badge) {
    font-size: var(--a-app-navigation-badge-font-size);
    width: var(--a-app-navigation-badge-size);
    height: var(--a-app-navigation-badge-size);
  }
}

.v-theme--light {
  .app-navigation {
    &__container {
      border-top: var(--a-app-navigation-border-width) solid map.get(settings.$grey, 'lighten-2');
    }
    &.v-bottom-navigation {
      background-color: map.get(settings.$shades, 'white');
    }
    :deep(.v-btn.v-btn--active) {
      color: map.get(colors.$adm-colors, 'regular');
    }
    :deep(.v-btn:not(.v-btn--active)) {
      color: map.get(colors.$adm-colors, 'muted') !important;
    }
    :deep(.v-bottom-navigation__content) {
      border-top: var(--a-app-navigation-border-width) solid map.get(settings.$grey, 'lighten-2');
    }
  }
}

.v-theme--dark {
  .app-navigation {
    &.v-bottom-navigation {
      background-color: map.get(colors.$adm-colors, 'black');
    }
    :deep(.v-btn.v-btn--active) {
      color: map.get(settings.$shades, 'white');
    }
    :deep(.v-btn:not(.v-btn--active)) {
      color: map.get(colors.$adm-colors, 'grey-transparent');
    }
  }
}
</style>
