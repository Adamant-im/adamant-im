<template>
  <v-app :theme="themeName" class="application--linear-gradient">
    <UploadAttachmentExitPrompt />
    <warning-on-addresses-dialog v-model="showWarningOnAddressesDialog" />

    <v-main>
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedRootComponentNames">
          <component :is="Component" v-if="Component && shouldCacheRootComponent(Component)" />
        </keep-alive>
        <component :is="Component" v-if="Component && !shouldCacheRootComponent(Component)" />
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, getCurrentInstance, ref, watch } from 'vue'
import WarningOnAddressesDialog from '@/components/WarningOnAddressesDialog.vue'
import UploadAttachmentExitPrompt from '@/components/UploadAttachmentExitPrompt.vue'
import Notifications from '@/lib/notifications'
import { ThemeName } from './plugins/vuetify'
import { useStore } from 'vuex'
import { useLocale } from 'vuetify'
import { applyLocale } from '@/i18n'
import { useResendPendingMessages } from '@/hooks/useResendPendingMessages'
import { useTrackConnection } from '@/hooks/useTrackConnection'
import { useHealthcheckResume } from '@/hooks/useHealthcheckResume'

useResendPendingMessages()
useTrackConnection()
useHealthcheckResume()

const store = useStore()
const isSnackbarShowing = computed(() => store.state.snackbar.show)
const cachedRootComponentNames = ['AppSidebar']

const showWarningOnAddressesDialog = ref(false)

const notifications = ref<Notifications | null>(null)

const themeName = computed(() => {
  return store.state.options.darkTheme ? ThemeName.Dark : ThemeName.Light
})
const getComponentName = (component: unknown) => {
  if (!component || typeof component !== 'object') {
    return null
  }

  const namedComponent = component as { name?: unknown; __name?: unknown }

  if (typeof namedComponent.name === 'string') {
    return namedComponent.name
  }

  if (typeof namedComponent.__name === 'string') {
    return namedComponent.__name
  }

  return null
}
const shouldCacheRootComponent = (component: unknown) => {
  const componentName = getComponentName(component)
  return componentName !== null && cachedRootComponentNames.includes(componentName)
}

onMounted(() => {
  const instance = getCurrentInstance()

  if (instance?.proxy) {
    notifications.value = new Notifications(instance.proxy)
    notifications.value.start()
  }
})

onBeforeUnmount(() => {
  notifications.value?.stop()
  store.dispatch('stopInterval')
})

const onKeydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isSnackbarShowing.value) {
      e.stopPropagation()
      store.commit('snackbar/changeState', false)
    }
  }
}

const { current: vuetifyLocale } = useLocale()

// The store holds the selected (or restored) locale; apply it on start and on every change.
watch(
  () => store.state.language.currentLocale,
  (currentLocale) => {
    vuetifyLocale.value = applyLocale(currentLocale)
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('keydown', onKeydownHandler, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydownHandler, true)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/themes/adamant/_mixins.scss';

.v-theme--light.application--linear-gradient {
  @include mixins.linear-gradient-light();
}
.v-theme--dark.application--linear-gradient {
  @include mixins.linear-gradient-dark();
}
</style>
