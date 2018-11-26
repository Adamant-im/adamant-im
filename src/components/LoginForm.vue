<template>
  <v-form v-model="validForm" @submit.prevent="submit" ref="form" class="login-form">
    <v-text-field
      v-model="passphrase"
      :rules="passphraseRules"
      :label="$t('login.password_label')"
      append-outer-icon="mdi-qrcode"
      @click:append-outer="toggleQrcodeRenderer"
      class="text-xs-center"
      type="password"
    />

    <v-btn
      :disabled="!validForm || disabledButton"
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

    <v-layout v-if="showQrcodeRenderer" justify-center class="mt-3">
      <qrcode-renderer :text="passphrase"/>
    </v-layout>
  </v-form>
</template>

<script>
import QrcodeRenderer from 'vue-qrcode-component'

export default {
  data: () => ({
    validForm: true,
    disabledButton: false,
    passphrase: '',
    passphraseRules: [
      v => !!v || 'Passphrase is required', // @todo translations
      v => v.split(' ').length === 12 || 'Passphrase must be valid'
    ],
    showSpinner: false,
    showQrcodeRenderer: false
  }),
  methods: {
    submit () {
      if (!this.$refs.form.validate()) return false

      this.freeze()
      this.login()
    },
    login () {
      const passphrase = this.passphrase.toLowerCase().trim()

      const promise = this.$store.dispatch('login', {
        passphrase
      })

      promise
        .then(() => {
          this.$emit('login')
        })
        .catch(err => {
          this.$emit('error', err)
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
    },
    toggleQrcodeRenderer () {
      this.showQrcodeRenderer = !this.showQrcodeRenderer
    }
  },
  components: {
    QrcodeRenderer
  }
}
</script>

<style lang="css" scoped>
/**
 * Centering input text and label.
 *
 * 1. Override `style` attribute.
 * 2. Align input text to center.
 * 3. Fix label centering after `scaleY` animation, using `transition font-size` instead.
 */
.login-form >>> .v-label { /* [1] */
  width: 100% !important;
  max-width: 100% !important;
  left: 0;
}
.login-form >>> .v-input input {
  text-align: center; /* [2] */
}
.login-form >>> .v-input .v-label--active { /* [3] */
  transition: font .3s ease;
  transform: translateY(-18px);
  -webkit-transform: translateY(-18px);
  font-size: 12px;
}
</style>
