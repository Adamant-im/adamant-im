<template>
  <v-form v-model="validForm" @submit.prevent="submit" ref="form" class="login-form">

    <v-layout>
      <slot>
        <v-text-field
          v-model="passphrase"
          :label="$t('login.password_label')"
          browser-autocomplete="current-password"
          class="text-xs-center"
          color="primary"
          type="password"
        />
      </slot>

      <slot name="append-outer"></slot>
    </v-layout>

    <v-layout row wrap align-center justify-center>
      <slot name="button">
        <v-btn
          :disabled="!validForm || disabledButton"
          class="login-form__button v-btn--primary"
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
        <slot name="qrcode-renderer"/>
      </v-layout>
    </transition>
  </v-form>
</template>

<script>
export default {
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
  data: () => ({
    validForm: true,
    disabledButton: false,
    showSpinner: false
  }),
  methods: {
    submit () {
      if (!this.$refs.form.validate()) return false

      this.freeze()
      this.login()
    },
    login () {
      const passphrase = this.passphrase.toLowerCase().trim()

      const promise = this.$store.dispatch('login', passphrase)

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
  },
  props: {
    value: {
      type: String,
      default: ''
    }
  }
}
</script>
