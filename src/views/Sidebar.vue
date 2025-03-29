<template>
  <div :class="{ [`${className} d-flex justify-center ma-auto`]: true }">
    <aside
      v-if="needAside"
      :class="{
        [`${className}__aside`]: true,
        [`${className}__aside--has-view`]: hasView
      }"
    >
      <left-side />
    </aside>
    <div
      class="d-flex justify-center align-center"
      :class="{
        [`${className}__router-view`]: true,
        [`${className}__router-view--no-aside`]: !needAside
      }"
    >
      <img v-show="showLogo" src="/img/adamant-logo-transparent-512x512.png" />

      <router-view :key="route.path" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useStore } from 'vuex'
import LeftSide from '@/LeftSide.vue'

const className = 'sidebar'

defineProps<{
  readyToShow?: boolean
}>()

const route = useRoute()
const store = useStore()

const hasView = computed(() => {
  return route.matched.length > 1
})

const needAside = computed(() => {
  return store.getters.isLogged
})

const showLogo = computed(() => {
  return !hasView.value
})
</script>
<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/settings';
@use '@/assets/styles/settings/_colors.scss';

.sidebar {
  display: flex;
  max-width: 1300px;

  &__aside {
    width: 33%;
    min-height: 100%;
    height: calc(100vh - var(--v-layout-bottom));
    border-right: 2px solid black;

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      width: 100%;
    }

    &--has-view {
      @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
        display: none;
      }
    }
  }

  &__router-view {
    flex: 1;

    &--no-aside {
      width: 100%;
      max-width: 800px;
    }

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      img {
        display: none;
      }
    }
  }
}

.v-theme--dark {
  .sidebar {
    &__router-view {
      img {
        filter: invert(1) brightness(0.4);
        mix-blend-mode: lighten;
      }
    }
  }
}

.v-theme--light {
  .sidebar {
    &__aside {
      border-right-color: map.get(colors.$adm-colors, 'secondary2');
    }

    &__router-view {
      img {
        filter: brightness(0.8);
        mix-blend-mode: hard-light;
      }
    }
  }
}
</style>
