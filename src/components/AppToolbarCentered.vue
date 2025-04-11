<template>
  <v-container :class="[classes, className]" fluid>
    <v-row justify="center" no-gutters>
      <container>
        <v-toolbar ref="toolbar" :flat="flat" :height="height">
          <back-button v-if="showBack" @click="goBack" />
          <v-toolbar-title v-if="title" class="a-text-regular-enlarged">
            <div>{{ title }}</div>
            <div v-if="subtitle" class="body-1">
              {{ subtitle }}
            </div>
          </v-toolbar-title>
          <v-progress-circular
            class="spinner"
            v-show="!isOnline && hasSpinner"
            indeterminate
            :size="24"
          />
        </v-toolbar>
      </container>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BackButton from '@/components/common/BackButton/BackButton.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    flat?: boolean
    app?: boolean
    fixed?: boolean
    height?: number
    showBack?: boolean
    hasSpinner?: boolean
  }>(),
  {
    title: undefined,
    subtitle: undefined,
    flat: false,
    app: false,
    fixed: false,
    height: 56,
    showBack: true,
    hasSpinner: false
  }
)

const store = useStore()
const router = useRouter()

const className = 'app-toolbar-centered'

const isOnline = computed(() => store.getters['isOnline'])
const classes = computed(() => ({
  'v-toolbar--fixed': props.app,
  'app-toolbar--fixed': props.fixed
}))

const goBack = () => {
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
@use 'vuetify/settings';

.app-toolbar-centered {
  padding: 0;

  :deep(.v-toolbar-title) {
    letter-spacing: 0.02em;
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
