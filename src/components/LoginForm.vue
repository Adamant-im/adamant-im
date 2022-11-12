<template>
  <v-form
    ref="form"
    v-model="validForm"
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
          :disabled="!validForm || disabledButton"
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

export default {
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  emits: ['login', 'error'],
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
