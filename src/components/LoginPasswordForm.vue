<template>
  <v-form ref="form" :class="classes.root" @submit.prevent="submit">
    <v-row no-gutters>
      <v-text-field
        ref="passwordInput"
        v-model="password"
        autocomplete="new-password"
        autofocus
        :class="classes.textField"
        :label="t('login_via_password.user_password_title')"
        :name="Date.now().toString()"
        :type="showPassword ? 'text' : 'password'"
        variant="underlined"
      >
        <template #append-inner>
          <v-btn @click="togglePasswordVisibility" icon :ripple="false" :size="28" variant="plain">
            <v-icon :icon="showPassword ? mdiEye : mdiEyeOff" :size="24" />
          </v-btn>
        </template>
      </v-text-field>
    </v-row>

    <v-row align="center" justify="center" class="mt-2" no-gutters>
      <v-col cols="12">
        <slot name="button">
          <v-btn class="login-form__button a-btn-primary" @click="submit">
            <v-progress-circular
              v-show="showSpinner"
              indeterminate
              color="primary"
              size="24"
              class="mr-4"
            />
            {{ t('login_via_password.user_password_unlock') }}
          </v-btn>
        </slot>
      </v-col>
      <div class="text-center mt-11">
        <h3 class="a-text-regular">
          {{ t('login_via_password.remove_password_hint') }}
        </h3>
        <v-btn class="a-btn-link mt-2" variant="text" size="small" @click="removePassword">
          {{ t('login_via_password.remove_password') }}
        </v-btn>
      </div>
    </v-row>
  </v-form>
</template>

<script lang="ts" setup>
import { isAxiosError } from 'axios'
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

import { clearDb } from '@/lib/idb'
import { isAllNodesDisabledError, isAllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { mdiEye, mdiEyeOff } from '@mdi/js'
import { useSaveCursor } from '@/hooks/useSaveCursor'
import { useConsiderOffline } from '@/hooks/useConsiderOffline'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'

const className = 'login-form'
const classes = {
  root: className,
  textField: `${className}__textfield`
}

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'error', error: string): void
  (e: 'update:modelValue', value: string): void
}>()

const router = useRouter()
const store = useStore()
const { t } = useI18n()
const { consideredOffline } = useConsiderOffline()

const passwordInput = useTemplateRef('passwordInput')
const showSpinner = ref(false)
const showPassword = ref(false)
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

useSaveCursor(passwordInput, showPassword)

const password = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const admNodes = computed<NodeStatusResult[]>(() => store.getters['nodes/adm'])
const admNodesDisabled = computed(() => admNodes.value.some((node) => node.status === 'disabled'))

const submit = () => {
  showSpinner.value = true

  return store
    .dispatch('loginViaPassword', password.value)
    .then(() => {
      emit('login')
    })
    .catch((err) => {
      if (err?.message === 'Invalid password') {
        emit('error', t('login_via_password.incorrect_password'))
      } else if (consideredOffline.value) {
        emit('error', t('connection.offline'))
        emit('login')

        router.push({ name: 'Chats' })
      } else if (isAxiosError(err)) {
        emit('error', t('login.invalid_passphrase'))
      } else if (isAllNodesOfflineError(err)) {
        if (admNodesDisabled.value) {
          emit('error', t('errors.all_nodes_offline', { crypto: err.nodeLabel.toUpperCase() }))
        }
        emit('login')

        router.push({ name: 'Chats' })
      } else if (isAllNodesDisabledError(err)) {
        emit('error', t('errors.all_nodes_disabled', { crypto: err.nodeLabel.toUpperCase() }))
        emit('login')

        router.push({ name: 'Chats' })
      } else {
        emit('error', t('errors.something_went_wrong'))
      }
      console.log(err)
    })
    .finally(() => {
      showSpinner.value = false
    })
}

const removePassword = () => {
  clearDb().finally(() => {
    store.dispatch('removePassword')
  })
}
</script>

<style lang="scss" scoped>
.login-form {
  &__textfield {
    &:deep(.v-field__append-inner) {
      padding-left: 0;
      margin-left: -28px; // compensate the append-inner icon
    }

    &:deep(.v-field__input) {
      width: 100%;
      padding-right: 32px;
      padding-left: 32px;
    }

    :deep(input) {
      font-size: 16px !important;
    }
  }
}
</style>
