<template>
  <v-form @submit.prevent="authenticate" class="biometric-login-form">
    <v-row no-gutters>
      <div class="biometric-login-form__icon-container">
        <v-icon
          :icon="mdiFingerprint"
          size="48"
          :class="[
            'biometric-login-form__icon',
            isAuthenticating && 'biometric-login-form__icon--disabled'
          ]"
          @click="!isAuthenticating && authenticate()"
        />
      </div>
    </v-row>

    <v-row align="center" justify="center" class="mt-2" no-gutters>
      <v-col cols="12">
        <v-btn
          class="login-form__button a-btn-primary"
          @click="authenticate"
          :disabled="isAuthenticating"
        >
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
import { ref, onMounted } from 'vue'
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

    await store.dispatch('loginViaBiometricOrPaskkeyAction')

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

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.biometric-login-form {
  &__icon-container {
    width: 100%;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    padding: 0 32px;
  }

  &__icon {
    transition: 0.2s linear;
    cursor: pointer;

    &--disabled {
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.3 !important;
    }
  }
}

.v-theme--light {
  .biometric-login-form {
    &__icon {
      color: map.get(colors.$adm-colors, 'black2');
      opacity: 0.62;

      &:hover {
        opacity: 1;
      }
    }
  }
}

.v-theme--dark {
  .biometric-login-form {
    &__icon {
      color: map.get(colors.$adm-colors, 'grey-transparent');

      &:hover {
        color: map.get(colors.$adm-colors, 'secondary');
        opacity: 1;
      }
    }
  }
}
</style>
