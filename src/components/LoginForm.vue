<template>
  <v-form ref="form" class="login-form" @submit.prevent="submit">
    <v-row no-gutters>
      <slot>
        <v-text-field
          v-model="passphrase"
          :label="$t('login.password_label')"
          autocomplete="current-password"
          class="text-center"
          color="white"
          :type="showPassphrase ? 'text' : 'password'"
          variant="underlined"
        >
          <template #append-inner>
            <v-btn
              @click="togglePassphraseVisibility"
              icon
              :ripple="false"
              :size="28"
              variant="plain"
            >
              <v-icon :icon="showPassphrase ? 'mdi-eye' : 'mdi-eye-off'" :size="24" />
            </v-btn>
          </template>
        </v-text-field>
      </slot>

      <slot name="append-outer" />
    </v-row>

    <v-row align="center" justify="center" no-gutters>
      <slot name="button">
        <v-btn class="login-form__button a-btn-primary" @click="submit">
          <v-progress-circular
            v-show="showSpinner"
            indeterminate
            color="primary"
            size="24"
            class="mr-4"
          />
          {{ $t('login.login_button') }}
        </v-btn>
      </slot>
    </v-row>

    <transition name="slide-fade">
      <v-row justify="center" no-gutters>
        <slot name="qrcode-renderer" />
      </v-row>
    </transition>
  </v-form>
</template>

<script>
import { validateMnemonic } from 'bip39'
import { computed, ref, defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['login', 'error', 'update:modelValue'],
  setup(props, { emit }) {
    const store = useStore()
    const showSpinner = ref(false)

    const showPassphrase = ref(false)
    const togglePassphraseVisibility = () => {
      showPassphrase.value = !showPassphrase.value
    }

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
        return emit('error', 'login.invalid_passphrase')
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
        .catch(() => {
          emit('error', 'login.invalid_passphrase')
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

    return {
      showSpinner,
      passphrase,
      showPassphrase,
      togglePassphraseVisibility,
      submit,
      freeze,
      antiFreeze,
      login
    }
  }
})
</script>
