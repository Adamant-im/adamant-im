<template>
  <v-form
    ref="form"
    v-model="validForm"
    class="login-form"
    @submit.prevent="submit"
  >
    <v-layout>
      <slot>
        <v-text-field
          v-model="passphrase"
          :label="$t('login.password_label')"
          browser-autocomplete="current-password"
          class="text-xs-center"
          color="#BBDEFB"
          type="password"
        />
      </slot>

      <slot name="append-outer" />
    </v-layout>

    <v-layout
      row
      wrap
      align-center
      justify-center
    >
      <slot name="button">
        <v-btn
          :disabled="!validForm || disabledButton"
          class="login-form__button a-btn-primary"
          @click="submit"
        >
          <v-progress-circular
            v-show="showSpinner"
            indeterminate
            color="primary"
            size="24"
            class="mr-3"
          />
          {{ $t('login.login_button') }}
        </v-btn>
      </slot>
    </v-layout>

    <transition name="slide-fade">
      <v-layout justify-center>
        <slot name="qrcode-renderer" />
      </v-layout>
    </transition>
  </v-form>
</template>

<script>
import { validateMnemonic } from 'bip39'

export default {
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    validForm: true,
    disabledButton: false,
    showSpinner: false
  }),
  computed: {
    passphrase: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('input', value)
      }
    }
  },
  methods: {
    submit () {
      if (!validateMnemonic(this.passphrase)) {
        return this.$emit('error', 'login.invalid_passphrase')
      }

      this.freeze()
      this.login()
    },
    login () {
      const promise = this.$store.dispatch('login', this.passphrase)

      promise
        .then(() => {
          this.$emit('login')
        })
        .catch(() => {
          this.$emit('error', 'login.invalid_passphrase')
        })
        .finally(() => {
          this.antiFreeze()
        })

      return promise
    },
    freeze () {
      this.disabledButton = true
      this.showSpinner = true
    },
    antiFreeze () {
      this.disabledButton = false
      this.showSpinner = false
    }
  }
}
</script>
