<template>
  <v-form
    ref="form"
    v-model="isValidForm"
    class="login-form"
    @submit.prevent="submit"
  >
    <v-row no-gutters>
      <slot>
        <v-text-field
          v-model="passphrase"
          :label="$t('login.password_label')"
          autocomplete="current-password"
          class="text-center"
          color="#BBDEFB"
          type="password"
          variant="underlined"
        />
      </slot>

      <slot name="append-outer" />
    </v-row>

    <v-row
      align="center"
      justify="center"
      no-gutters
    >
      <slot name="button">
        <v-btn
          :disabled="!isValidForm || disabledButton"
          class="login-form__button a-btn-primary"
          @click="submit"
        >
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
      <v-row
        justify="center"
        no-gutters
      >
        <slot name="qrcode-renderer" />
      </v-row>
    </transition>
  </v-form>
</template>

<script>
import { validateMnemonic } from 'bip39'
import { computed, ref, defineComponent } from 'vue';
import { useStore } from 'vuex';

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
    const disabledButton = ref(false)
    const showSpinner = ref(false)

    const passphrase = computed({
      get () {
        return props.modelValue
      },
      set (value) {
        emit('update:modelValue', value)
      }
    })
    const isValidForm = computed(() => passphrase.value.length > 0)

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
      disabledButton.value = true
      showSpinner.value = true
    }
    const antiFreeze = () => {
      disabledButton.value = false
      showSpinner.value = false
    }

    return {
      isValidForm,
      disabledButton,
      showSpinner,
      passphrase,
      submit,
      freeze,
      antiFreeze,
      login
    }
  }
})
</script>
