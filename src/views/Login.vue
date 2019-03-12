<template>
  <v-layout row fill-height justify-center :class="className">

    <container>

      <div class="text-xs-right">
        <language-switcher>
          <v-icon slot="prepend" size="18">mdi-chevron-right</v-icon>
        </language-switcher>
      </div>

      <v-card flat color="transparent" class="text-xs-center mt-3">
        <img
          :src="logo"
          class="logo"
        />

        <h1 :class="`${className}__title`">{{ $t('login.brand_title') }}</h1>
        <h2 :class="`${className}__subtitle`" class="hidden-sm-and-down mt-3">{{ $t('login.subheader') }}</h2>
      </v-card>

      <v-card v-if="!isLoginViaPassword" flat color="transparent" class="text-xs-center mt-3">
        <v-layout justify-center>
          <v-flex xs12 sm8 md8 lg8>

            <login-form
              v-model="passphrase"
              @login="onLogin"
              @error="onLoginError"
            />

          </v-flex>
        </v-layout>

        <v-layout justify-center class="mt-2">
          <v-btn
            @click="showQrcodeScanner = true"
            :title="$t('login.scan_qr_code_button_tooltip')"
            icon
            flat
            :class="`${className}__icon`"
          >
            <icon><qr-code-scan-icon/></icon>
          </v-btn>

          <v-btn
            @click="openFileDialog"
            :title="$t('login.login_by_qr_code_tooltip')"
            icon
            flat
            :class="`${className}__icon`"
          >
            <icon><file-icon/></icon>
          </v-btn>

          <qrcode-capture @detect="onDetect" ref="qrcodeCapture" style="display: none"/>
        </v-layout>
      </v-card>

      <v-layout v-if="!isLoginViaPassword" justify-center class="mt-5">
        <v-flex xs12 sm8 md8 lg8>

          <passphrase-generator
            @copy="onCopyPassphrase"
          />

        </v-flex>
      </v-layout>

      <v-card v-if="isLoginViaPassword" flat color="transparent" class="text-xs-center mt-3">
        <v-layout justify-center>
          <v-flex xs12 sm8 md8 lg8>

            <login-password-form
              v-model="password"
              @login="onLogin"
              @error="onLoginError"
            />

          </v-flex>
        </v-layout>
      </v-card>

      <qrcode-scanner-dialog
        v-if="showQrcodeScanner"
        v-model="showQrcodeScanner"
        @scan="onScanQrcode"
      />

    </container>

  </v-layout>
</template>

<script>
import { QrcodeCapture } from 'vue-qrcode-reader'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import PassphraseGenerator from '@/components/PassphraseGenerator'
import LoginForm from '@/components/LoginForm'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'
import Icon from '@/components/icons/BaseIcon'
import QrCodeScanIcon from '@/components/icons/common/QrCodeScan'
import FileIcon from '@/components/icons/common/File'
import LoginPasswordForm from '@/components/LoginPasswordForm'
import AppInterval from '@/lib/AppInterval'

export default {
  computed: {
    className () {
      return 'login-page'
    },
    isLoginViaPassword () {
      return this.$store.getters['options/isLoginViaPassword']
    }
  },
  data: () => ({
    passphrase: '',
    password: '',
    showQrcodeScanner: false,
    logo: '/img/adamant-logo-transparent-512x512.png'
  }),
  methods: {
    async onDetect (promise) {
      try {
        const { content } = await promise // Decoded string or null
        if (content && /^([a-z]{3,8}\x20){11}[A-z]{3,8}$/i.test(content.trim())) {
          this.passphrase = content
        } else {
          this.passphrase = ''
          this.$store.dispatch('snackbar/show', {
            message: this.$t('login.invalid_qr_code')
          })
        }
      } catch (error) {
        console.error(error)
      }
    },
    onLogin () {
      this.$router.push('/chats')

      if (!this.$store.state.chat.isFulfilled) {
        this.$store.commit('chat/createAdamantChats')
        this.$store.dispatch('chat/loadChats')
          .then(() => AppInterval.subscribe())
      } else {
        AppInterval.subscribe()
      }
    },
    onLoginError (key) {
      this.$store.dispatch('snackbar/show', {
        message: this.$t(key)
      })
    },
    onCopyPassphrase () {
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
    },
    openFileDialog () {
      this.$refs.qrcodeCapture.$el.click()
    }
  },
  components: {
    LanguageSwitcher,
    PassphraseGenerator,
    LoginForm,
    QrcodeScannerDialog,
    QrcodeCapture,
    Icon,
    QrCodeScanIcon,
    FileIcon,
    LoginPasswordForm
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
.login-page__icon, .v-icon--link
  opacity:0.7
  transition: 0.2s linear
  &:hover
    opacity:1    
.v-menu__activator
  .mdi-chevron-right:before
    transition: 0.2s linear
.v-menu__activator--active 
  .mdi-chevron-right:before
    transform: rotate(90deg)    
.logo
  width: 213px
  height: 213px

@media $display-breakpoints.sm-and-up
  .logo
    width: 300px
    height: 300px

/** Themes **/
.theme--light
  .login-page
    &__icon
      color: $grey.darken-3

.theme--dark
  .login-page
    &__icon
      color: $shades.white
</style>
