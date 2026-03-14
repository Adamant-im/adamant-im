<template>
  <v-form ref="form" :class="classes.root" @submit.prevent="submit">
    <v-row gap="0">
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
          <v-btn
            @click="togglePasswordVisibility"
            icon
            :ripple="false"
            :size="AUTH_FORM_TOGGLE_BUTTON_SIZE"
            variant="plain"
          >
            <v-icon :icon="showPassword ? mdiEye : mdiEyeOff" :size="AUTH_FORM_TOGGLE_ICON_SIZE" />
          </v-btn>
        </template>
      </v-text-field>
    </v-row>

    <v-row align="center" justify="center" class="login-form__submit-row" gap="0">
      <v-col cols="12">
        <slot name="button">
          <v-btn class="login-form__button a-btn-primary" type="submit">
            <v-progress-circular
              v-show="showSpinner"
              indeterminate
              color="primary"
              :size="AUTH_FORM_SUBMIT_SPINNER_SIZE"
              class="login-form__submit-spinner"
            />
            {{ t('login_via_password.user_password_unlock') }}
          </v-btn>
        </slot>
      </v-col>
      <div :class="classes.passwordHint">
        <h3 :class="classes.passwordHintTitle">
          {{ t('login_via_password.remove_password_hint') }}
        </h3>
        <v-btn
          :class="['a-btn-link', classes.passwordHintAction]"
          variant="text"
          size="small"
          @click="removePassword"
        >
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
import { logger } from '@/utils/devTools/logger'

import { clearDb } from '@/lib/idb'
import { isAllNodesDisabledError, isAllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { mdiEye, mdiEyeOff } from '@mdi/js'
import { useSaveCursor } from '@/hooks/useSaveCursor'
import { useConsiderOffline } from '@/hooks/useConsiderOffline'
import { NodeStatusResult } from '@/lib/nodes/abstract.node'
import {
  AUTH_FORM_SUBMIT_SPINNER_SIZE,
  AUTH_FORM_TOGGLE_BUTTON_SIZE,
  AUTH_FORM_TOGGLE_ICON_SIZE
} from '@/components/Login/helpers/uiMetrics'

const className = 'login-form'
const classes = {
  root: className,
  textField: `${className}__textfield`,
  passwordHint: `${className}__password-hint`,
  passwordHintTitle: `${className}__password-hint-title`,
  passwordHintAction: `${className}__password-hint-action`
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
      logger.log('LoginPasswordForm', 'info', err)
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
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.login-form {
  --a-login-form-passphrase-toggle-size: var(--a-auth-control-button-size);
  --a-login-form-submit-spinner-gap: var(--a-auth-control-inline-gap);
  --a-login-form-passphrase-toggle-offset: calc(var(--a-login-form-passphrase-toggle-size) * -1);
  --a-login-form-passphrase-input-padding-inline: var(--a-control-size-sm);
  --a-login-form-passphrase-input-font-size: var(--a-font-size-md);
  --a-login-form-submit-row-margin-top: var(--a-space-2);
  --a-login-password-hint-block-gap: var(--a-space-10);
  --a-login-password-hint-title-gap: var(--a-space-1);
  --a-login-password-hint-button-margin-top: var(--a-space-2);

  &__textfield {
    &:deep(.v-field__append-inner) {
      padding-left: 0;
      margin-left: var(--a-login-form-passphrase-toggle-offset);
    }

    &:deep(.v-field__input) {
      width: 100%;
      padding-right: var(--a-login-form-passphrase-input-padding-inline);
      padding-left: var(--a-login-form-passphrase-input-padding-inline);
    }

    :deep(input) {
      font-size: var(--a-login-form-passphrase-input-font-size);
    }
  }

  &__submit-row {
    margin-top: var(--a-login-form-submit-row-margin-top);
  }

  &__submit-spinner {
    margin-inline-end: var(--a-login-form-submit-spinner-gap);
  }

  &__password-hint {
    margin-top: var(--a-login-password-hint-block-gap);
    text-align: center;
  }

  &__password-hint-title {
    @include mixins.a-text-regular();
    margin-top: 0;
    margin-bottom: var(--a-login-password-hint-title-gap);
  }

  &__password-hint-action {
    margin-top: var(--a-login-password-hint-button-margin-top);
  }
}
</style>
