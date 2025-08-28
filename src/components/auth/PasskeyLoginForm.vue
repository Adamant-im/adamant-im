<template>
  <div class="passkey-login-form">
    <v-row align="center" justify="center" no-gutters>
      <v-col cols="12" class="text-center">
        <v-icon icon="mdi-key" size="64" :color="iconColor" class="mb-4" />

        <h3 class="mb-4">{{ statusText }}</h3>

        <v-btn v-if="showRetryButton" class="a-btn-primary" @click="authenticate">
          {{ t('passkey_login.try_again') }}
        </v-btn>

        <div class="text-center mt-6">
          <h3 class="a-text-regular">
            {{ t('passkey_login.use_passphrase_hint') }}
          </h3>
          <v-btn class="a-btn-link mt-2" variant="text" size="small" @click="switchToPassphrase">
            {{ t('passkey_login.use_passphrase') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { passkeyAuth } from '@/lib/auth'
import { AuthenticationResult } from '@/lib/auth/types'
import { useStore } from 'vuex'

const { t } = useI18n()
const store = useStore()

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'error', error: string): void
}>()

const isAuthenticating = ref(false)
const showRetryButton = ref(false)
const hasError = ref(false)

const iconColor = computed(() => {
  if (isAuthenticating.value) return 'primary'
  if (hasError.value) return 'error'
  return 'primary'
})

const statusText = computed(() => {
  if (isAuthenticating.value) return t('passkey_login.authenticating')
  if (hasError.value) return t('passkey_login.authentication_failed')
  return t('passkey_login.touch_sensor')
})

const handleAuthError = (errorMessage: string) => {
  showRetryButton.value = true
  hasError.value = true
  emit('error', errorMessage)
}

const authenticate = async () => {
  isAuthenticating.value = true
  showRetryButton.value = false
  hasError.value = false

  try {
    const passkeyResult = await passkeyAuth.authorizeUser()

    if (passkeyResult === AuthenticationResult.Cancel) {
      showRetryButton.value = true
      return
    }

    if (passkeyResult !== AuthenticationResult.Success) {
      handleAuthError(t('passkey_login.authentication_failed'))
      return
    }

    await store.dispatch('loginViaAuthentication')

    emit('login')
  } catch (error) {
    handleAuthError(error instanceof Error ? error.message : t('passkey_login.authentication_failed'))
  } finally {
    isAuthenticating.value = false
  }
}

const switchToPassphrase = () => {
  store.commit('options/updateOption', { key: 'stayLoggedIn', value: false })
  store.commit('options/updateOption', { key: 'authenticationMethod', value: null })
}

onMounted(() => {
  authenticate()
})
</script>
