<template>
  <v-form ref="form" class="login-form" @submit.prevent="submit">
    <v-row no-gutters>
      <v-text-field
        ref="passwordField"
        v-model="password"
        autofocus
        autocomplete="new-password"
        :label="$t('login_via_password.user_password_title')"
        :name="Date.now()"
        :type="showPassword ? 'text' : 'password'"
        class="text-center"
        variant="underlined"
      >
        <template #append-inner>
          <v-btn
            @click="togglePasswordVisibility"
            icon
            :ripple="false"
            :size="28"
            variant="plain"
          >
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
            {{ $t('login_via_password.user_password_unlock') }}
          </v-btn>
        </slot>
      </v-col>
      <v-col cols="12" class="a-text-regular mt-8">
        {{ $t('login_via_password.remove_password_hint') }}
      </v-col>
      <v-col cols="12">
        <v-btn class="a-btn-link" variant="text" size="small" @click="removePassword">
          {{ $t('login_via_password.remove_password') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script>
import { isAxiosError } from 'axios'
import { computed, defineComponent, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

import { clearDb } from '@/lib/idb'
import { isAllNodesDisabledError, isAllNodesOfflineError } from '@/lib/nodes/utils/errors'
import { mdiEye, mdiEyeOff } from '@mdi/js'

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['login', 'error', 'update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter()
    const store = useStore()
    const { t } = useI18n()
    const passwordField = ref(null)
    const showSpinner = ref(false)
    const showPassword = ref(false)
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const password = computed({
      get() {
        return props.modelValue
      },
      set(value) {
        emit('update:modelValue', value)
      }
    })

    const isOnline = computed(() => store.getters['isOnline'])

    const submit = () => {
      showSpinner.value = true

      return store
        .dispatch('loginViaPassword', password.value)
        .then(() => {
          emit('login')
        })
        .catch((err) => {
          if (!isOnline.value) {
            emit('error', t('connection.offline'))
            router.push({ name: 'Nodes' })
          } else if (err?.message === 'Invalid password') {
            emit('error', t('login_via_password.incorrect_password'))
          } else if (isAxiosError(err)) {
            emit('error', t('login.invalid_passphrase'))
          } else if (isAllNodesOfflineError(err)) {
            emit('error', t('errors.all_nodes_offline', { crypto: err.nodeLabel.toUpperCase() }))
          } else if (isAllNodesDisabledError(err)) {
            emit('error', t('errors.all_nodes_disabled', { crypto: err.nodeLabel.toUpperCase() }))
            router.push({ name: 'Nodes' })
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

    watch(showPassword, () => {
      const inputElement = this.passwordField.$el.querySelector('input');
      if (inputElement) {
        const cursorPosition = inputElement.selectionStart || 0;

        requestAnimationFrame(() => {
          inputElement.setSelectionRange(cursorPosition, cursorPosition);
          inputElement.focus();
        });
      }
    })

    return {
      passwordField,
      showSpinner,
      password,
      showPassword,
      mdiEye,
      mdiEyeOff,
      togglePasswordVisibility,
      submit,
      removePassword
    }
  }
})
</script>
