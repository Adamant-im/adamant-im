<template>
  <v-dialog v-model="show" width="320">
    <v-card>
      <v-card-title class="a-text-header">
        {{ t('login.signin_options.title') }}
      </v-card-title>

      <v-divider class="a-divider" />

      <v-card-text class="pa-0">
        <v-list>
          <v-list-item
            avatar
            :disabled="!biometricOption.available"
            @click="selectAuthMethod(AuthenticationMethod.Biometric)"
          >
            <template #prepend>
              <v-icon :icon="mdiFingerprint" />
            </template>

            <v-list-item-title>{{ t('login.signin_options.biometric.title') }}</v-list-item-title>
            <v-list-item-subtitle>{{ biometricOption.subtitle }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item
            avatar
            :disabled="!passkeyOption.available"
            @click="selectAuthMethod(AuthenticationMethod.Passkey)"
          >
            <template #prepend>
              <v-icon :icon="mdiKeyVariant" />
            </template>

            <v-list-item-title>{{ t('login.signin_options.passkey.title') }}</v-list-item-title>
            <v-list-item-subtitle>{{ passkeyOption.subtitle }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item
            avatar
            :disabled="!passwordOption.available"
            @click="selectAuthMethod(AuthenticationMethod.Password)"
          >
            <template #prepend>
              <v-icon :icon="mdiLock" />
            </template>

            <v-list-item-title>{{ t('login.signin_options.password.title') }}</v-list-item-title>
            <v-list-item-subtitle>{{ passwordOption.subtitle }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { mdiFingerprint, mdiKeyVariant, mdiLock } from '@mdi/js'

import { AuthenticationMethod } from '@/lib/auth/types'
import { db as isIDBSupported } from '@/lib/idb'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select-auth-method', method: AuthenticationMethod): void
}>()

const { t } = useI18n()

const show = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const biometricOption = computed(() => {
  const isNative = Capacitor.isNativePlatform()

  if (!isNative) {
    return {
      available: false,
      subtitle: t('login.signin_options.biometric.only_native')
    }
  }

  return {
    available: true,
    subtitle: t('login.signin_options.biometric.device_touchid_faceid')
  }
})

const passkeyOption = computed(() => {
  const isNative = Capacitor.isNativePlatform()
  const hasWebAuthn = !!(navigator.credentials && window.PublicKeyCredential)

  if (isNative) {
    return {
      available: false,
      subtitle: t('login.signin_options.passkey.only_web')
    }
  }

  if (!hasWebAuthn) {
    return {
      available: false,
      subtitle: t('login.signin_options.not_available')
    }
  }

  return {
    available: true,
    subtitle: t('login.signin_options.passkey.secure_login')
  }
})

const isPasswordAvailable = ref(true)

const passwordOption = computed(() => {
  return {
    available: isPasswordAvailable.value,
    subtitle: isPasswordAvailable.value
      ? t('login.signin_options.password.secure_login')
      : t('login.signin_options.not_available')
  }
})

onMounted(async () => {
  try {
    await isIDBSupported
    isPasswordAvailable.value = true
  } catch {
    isPasswordAvailable.value = false
  }
})

const selectAuthMethod = (method: AuthenticationMethod) => {
  emit('select-auth-method', method)
  show.value = false
}
</script>

<style scoped>
:deep(.v-list-item-subtitle) {
  display: block;
}
</style>
