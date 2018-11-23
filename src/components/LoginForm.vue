<template>
  <v-form v-model="validForm" @submit.prevent="submit" ref="form" class="login-form">
    <v-text-field
      v-model="passphrase"
      :rules="passphraseRules"
      class="text-xs-center"
      type="password"
      :label="$t('Input your passphrase to login')"
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
      {{ $t('Login') }}
    </v-btn>
  </v-form>
</template>

<script>
export default {
  data: () => ({
    validForm: true,
    disabledButton: false,
    passphrase: '',
    passphraseRules: [
      v => !!v || 'Passphrase is required', // @todo translations
      v => v.split(' ').length === 12 || 'Passphrase must be valid'
    ],
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

      this.$store.dispatch('login', {
        passphrase
      })
        .then(() => {
          this.$emit('login')
        })
        .catch(err => {
          this.$emit('error', err)
          console.log(err)
        })
        .finally(() => {
          this.antiFreeze()
        })
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

<i18n>
{
  "en": {
    "Input your passphrase to login": "Input your passphrase to login",
    "Login": "Login",
    "Passphrase is required": "Passphrase is required"
  }
}
</i18n>
