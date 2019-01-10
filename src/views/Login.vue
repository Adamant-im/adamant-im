<template>
  <v-layout row fill-height justify-center class="login-page">

    <v-flex xs12 sm12 md8 lg8>

      <div class="text-xs-right">
        <language-switcher/>
      </div>

      <v-card flat color="transparent" class="text-xs-center mt-3">
        <img
          :src="logo"
          class="logo"
        />

        <h1 class="login-page__title">{{ $t('login.brand_title') }}</h1>
        <h2 class="hidden-sm-and-down login-page__subtitle mt-3">{{ $t('login.subheader') }}</h2>
      </v-card>

      <v-card flat color="transparent" class="text-xs-center mt-3">
        <v-layout justify-center>
          <v-flex xs12 sm8 md8 lg6>
            <login-form
              @login="onLogin"
              @error="onLoginError"
              :qrcodePassphrase="decodedPassphrase"
            />
          </v-flex>
        </v-layout>
        <qrcode-capture @decode="onDecode"/>
        <v-layout justify-center>
          <v-btn
            icon
            flat
            large
            fab
            @click="showQrcodeScanner = true"
            :title="$t('login.scan_qr_code_button_tooltip')"
          >
            <v-icon>mdi-qrcode-scan</v-icon>
          </v-btn>
          <!--v-btn :title="$t('login.login_by_qr_code_tooltip')" icon flat large fab>
            <v-icon>mdi-file-upload-outline</v-icon>
          </v-btn-->
        </v-layout>
      </v-card>

      <v-layout justify-center class="mt-2">
        <v-flex xs12 sm8 md8 lg6>
          <passphrase-generator
            @copy="onCopyPassphraze"
          />
        </v-flex>
      </v-layout>

      <qrcode-scanner
        v-if="showQrcodeScanner"
        v-model="showQrcodeScanner"
        @scan="onScanQrcode"
      />

    </v-flex>

  </v-layout>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'
import PassphraseGenerator from '@/components/PassphraseGenerator'
import LoginForm from '@/components/LoginForm'
import QrcodeScanner from '@/components/QrcodeScanner'
import { QrcodeCapture } from 'vue-qrcode-reader'

export default {
  data: () => ({
    showQrcodeScanner: false,
    logo: '/img/adamant-logo-transparent-512x512.png', // @todo maybe svg will be better
    decodedPassphrase: ''
  }),
  methods: {
    onDecode (result) {
      this.decodedPassphrase = result
    },
    onLogin () {
      this.$router.push('/chats')
    },
    onLoginError (err) {
      this.$store.dispatch('snackbar/show', {
        message: this.$t('login.invalid_passphrase')
      })
      console.error(err)
    },
    onCopyPassphraze () {
      this.$store.dispatch('snackbar/show', {
        message: this.$t('home.copied'),
        timeout: 1500
      })
    },
    onScanQrcode (passphrase) {
      this.$store.dispatch('login', passphrase)
        .then(() => {
          this.onLogin()
        })
        .catch(err => {
          this.onLoginError(err)
        })
    }
  },
  components: {
    LanguageSwitcher,
    PassphraseGenerator,
    LoginForm,
    QrcodeScanner,
    QrcodeCapture
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_variables.styl'

.login-page
  &__title
    font-family: 'Exo 2'
    font-weight: 100
    font-size: 45px
    line-height: 40px
    text-transform: uppercase
  &__subtitle
    font-family: 'Exo 2'
    font-weight: 100
    font-size: 18px

.logo
  width: 213px
  height: 213px

@media $display-breakpoints.sm-and-up
  .logo
    width: 300px
    height: 300px
</style>
