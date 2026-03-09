<template>
  <v-form ref="form" :class="classes.root" @submit.prevent="submit">
    <!-- Hidden input with username to prevent Chrome warning in console -->
    <input type="text" name="username" autocomplete="username" style="display: none" />
    <v-row gap="0">
      <slot>
        <!--     Todo: check src/components/PasswordSetDialog.vue component and consider the possibility to move common code to new component  -->
        <v-text-field
          ref="passphraseInput"
          v-model="passphrase"
          @keydown.enter.prevent="submit"
          :label="t('login.password_label')"
          autocomplete="current-password"
          :class="classes.textField"
          class="text-center"
          :type="showPassphrase ? 'text' : 'password'"
          variant="underlined"
        >
          <template #append-inner>
            <v-btn
              @click="togglePassphraseVisibility"
              icon
              :ripple="false"
              :size="AUTH_FORM_TOGGLE_BUTTON_SIZE"
              variant="plain"
            >
              <v-icon
                :icon="showPassphrase ? mdiEye : mdiEyeOff"
                :size="AUTH_FORM_TOGGLE_ICON_SIZE"
              />
            </v-btn>
          </template>
        </v-text-field>
      </slot>

      <slot name="append-outer" />
    </v-row>

    <v-row align="center" justify="center" gap="0" class="login-form__submit-row">
      <slot name="button">
        <v-btn class="login-form__button a-btn-primary" type="submit">
          <v-progress-circular
            v-show="showSpinner"
            indeterminate
            color="primary"
            :size="AUTH_FORM_SUBMIT_SPINNER_SIZE"
            class="login-form__submit-spinner"
          />
          {{ t('login.login_button') }}
        </v-btn>
      </slot>
    </v-row>

    <transition name="slide-fade">
      <v-row justify="center" gap="0">
        <slot name="qrcode-renderer" />
      </v-row>
    </transition>
  </v-form>
</template>

<script setup lang="ts">
import { validateMnemonic } from 'bip39'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import { isAllNodesOfflineError, isAllNodesDisabledError } from '@/lib/nodes/utils/errors'
import { mdiEye, mdiEyeOff } from '@mdi/js'
import { useSaveCursor } from '@/hooks/useSaveCursor'
import { logger } from '@/utils/devTools/logger'
import {
  AUTH_FORM_SUBMIT_SPINNER_SIZE,
  AUTH_FORM_TOGGLE_BUTTON_SIZE,
  AUTH_FORM_TOGGLE_ICON_SIZE
} from '@/components/Login/helpers/uiMetrics'

const className = 'login-form'
const classes = {
  root: className,
  textField: `${className}__textfield`
}

type Props = {
  modelValue: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'error', errorMessage: string): void
  (e: 'update:modelValue', value: string): void
}>()

const router = useRouter()
const store = useStore()
const { t } = useI18n()
const showSpinner = ref(false)
const showPassphrase = ref(false)
const passphraseInput = useTemplateRef('passphraseInput')

const togglePassphraseVisibility = () => {
  showPassphrase.value = !showPassphrase.value
}

useSaveCursor(passphraseInput, showPassphrase)

const passphrase = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const submit = () => {
  if (!validateMnemonic(passphrase.value)) {
    return emit('error', t('login.invalid_passphrase'))
  }
  freeze()
  login()
}
const login = () => {
  const promise = store.dispatch('login', passphrase.value)
  promise
    .then(() => {
      emit('login')
    })
    .catch((err) => {
      if (isAxiosError(err)) {
        emit('error', t('login.invalid_passphrase'))
      } else if (isAllNodesOfflineError(err)) {
        emit('error', t('errors.all_nodes_offline', { crypto: err.nodeLabel.toUpperCase() }))
      } else if (isAllNodesDisabledError(err)) {
        emit('error', t('errors.all_nodes_disabled', { crypto: err.nodeLabel.toUpperCase() }))
        router.push({ name: 'Nodes' })
      } else {
        emit('error', t('errors.something_went_wrong'))
      }
      logger.log('LoginForm', 'info', err)
    })
    .finally(() => {
      antiFreeze()
    })

  return promise
}
const freeze = () => {
  showSpinner.value = true
}
const antiFreeze = () => {
  showSpinner.value = false
}

defineExpose({
  submit
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.login-form {
  --a-login-form-passphrase-toggle-size: var(--a-auth-control-button-size);
  --a-login-form-submit-spinner-gap: var(--a-auth-control-inline-gap);
  --a-login-form-passphrase-toggle-offset: calc(var(--a-login-form-passphrase-toggle-size) * -1);
  --a-login-form-passphrase-input-padding-inline: var(--a-control-size-sm);
  --a-login-form-submit-row-margin-top: var(--a-space-2);

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
  }

  &__submit-row {
    margin-top: var(--a-login-form-submit-row-margin-top);
  }

  &__submit-spinner {
    margin-inline-end: var(--a-login-form-submit-spinner-gap);
  }
}

/** Themes **/
.v-theme--light {
  .login-form {
    &__textfield {
      color: map.get(colors.$adm-colors, 'regular');
    }
  }
}
.v-theme--dark {
  .login-form {
    &__textfield {
      color: map.get(settings.$shades, 'white');
    }
  }
}
</style>
