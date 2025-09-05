<template>
  <v-form @submit.prevent="authenticate">
    <v-row no-gutters>
      <div class="text-center" style="width: 100%; padding: 32px 32px 16px">
        <v-icon :icon="mdiFingerprint" size="48" :color="iconColor" @click="authenticate" />
      </div>
    </v-row>

    <v-row align="center" justify="center" class="mt-2" no-gutters>
      <v-col cols="12">
        <v-btn class="a-btn-primary" @click="authenticate" :disabled="isAuthenticating">
          <v-progress-circular
            v-show="isAuthenticating"
            indeterminate
            color="primary"
            size="24"
            class="mr-4"
          />
          {{ t('login_via_password.user_password_unlock') }}
        </v-btn>
      </v-col>
      <div class="text-center mt-11">
        <h3 class="a-text-regular">
          {{ t('login.use_passphrase_hint') }}
        </h3>
        <v-btn class="a-btn-link mt-2" variant="text" size="small" @click="switchToPassphrase">
          {{ t('login.use_passphrase') }}
        </v-btn>
      </div>
    </v-row>
  </v-form>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiFingerprint } from '@mdi/js'
import { biometricAuth } from '@/lib/auth'
import { AuthenticationResult } from '@/lib/auth/types'
import { useStore } from 'vuex'

const { t } = useI18n()
const store = useStore()

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'error', error: string): void
}>()

const isAuthenticating = ref(false)
const hasError = ref(false)

const iconColor = computed(() => {
  if (isAuthenticating.value) return 'primary'
  if (hasError.value) return 'error'
  return 'primary'
})

const handleAuthError = (errorMessage: string) => {
  hasError.value = true
  emit('error', errorMessage)
}

const authenticate = async () => {
  isAuthenticating.value = true
  hasError.value = false

  try {
    const biometricResult = await biometricAuth.authorizeUser()

    if (biometricResult === AuthenticationResult.Cancel) {
      return
    }

    if (biometricResult !== AuthenticationResult.Success) {
      handleAuthError(t('login.authentication_failed'))
      return
    }

    await store.dispatch('loginViaAuthentication')

    emit('login')
  } catch (error) {
    handleAuthError(error instanceof Error ? error.message : t('login.authentication_failed'))
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
