<template>
  <v-form v-model="validForm" @submit.prevent="submit" ref="form" class="login-form">

    <v-layout>
      <v-text-field
        v-model="passphrase"
        :rules="passphraseRules"
        :label="$t('login.password_label')"
        browser-autocomplete="current-password"
        class="text-xs-center"
        type="password"
      />
      <v-icon
        class="ml-2"
        :color="showQrcodeRenderer ? 'primary' : ''"
        @click="toggleQrcodeRenderer"
      >
        mdi-qrcode
      </v-icon>
    </v-layout>

    <v-layout row wrap align-center justify-center class="mt-2">
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
    </v-layout>

    <transition name="slide-fade">
      <v-layout v-if="showQrcodeRenderer && passphrase" justify-center class="mt-3">
        <qrcode-renderer :text="passphrase"/>
      </v-layout>
    </transition>

  </v-form>
</template>

<script>
import QrcodeRenderer from 'vue-qrcode-component'

export default {
  computed: {
    passphraseRules () {
      return [
        v => !!v || this.$t('rules.passphraseRequired'),
        v => v.split(' ').length === 12 || this.$t('rules.passphraseValid')
      ]
    }
  },
  data: () => ({
    validForm: true,
    disabledButton: false,
    passphrase: '',
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

      const promise = this.$store.dispatch('login', passphrase)

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

/**
 * Slide Fade animation.
 */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all .3s ease;
}
.slide-fade-enter, .slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>

<i18n>
{
  "en": {
    "rules": {
      "passphraseRequired": "Passphrase is required",
      "passphraseValid": "Passphrase must be valid"
    }
  },
  "ru": {
    "rules": {
      "passphraseRequired": "Введите пассфразу",
      "passphraseValid": "Неправильная пассфраза"
    }
  }
}
</i18n>
