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

      <v-card v-if="!isLoginViaPassword" flat color="transparent" class="text-xs-center mt-3">
        <v-layout justify-center>
          <v-flex xs12 sm8 md8 lg6>

            <login-form
              v-model="passphrase"
              @login="onLogin"
              @error="onLoginError"
            >
              <template slot="append-outer">
                <icon
                  class="ml-2"
                  :width="24"
                  :height="24"
                  shape-rendering="crispEdges"
                  :color="showQrcodeRenderer ? this.$vuetify.theme.primary : ''"
                  @click="toggleQrcodeRenderer"
                >
                  <qr-code-icon/>
                </icon>
              </template>

              <template slot="qrcode-renderer">
                <div @click="saveQrcode" :style="{ cursor: 'pointer' }">
                  <transition name="slide-fade">
                    <QrcodeRenderer v-if="showQrcodeRenderer" :text="passphrase"
                      ref="qrcode" />
                  </transition>
                </div>
              </template>
            </login-form>

          </v-flex>
        </v-layout>

        <v-layout justify-center>
          <v-btn
            icon
            flat
            large
            fab
            @click="showQrcodeScanner = true"
            :title="$t('login.scan_qr_code_button_tooltip')"
          >
            <icon><qr-code-scan-icon/></icon>
          </v-btn>

          <v-btn @click="openFileDialog" :title="$t('login.login_by_qr_code_tooltip')" icon flat large fab>
            <icon><file-icon/></icon>
          </v-btn>

          <qrcode-capture @detect="onDetect" ref="qrcodeCapture" style="display: none"/>
        </v-layout>
      </v-card>

      <v-layout v-if="!isLoginViaPassword" justify-center class="mt-2">
        <v-flex xs12 sm8 md8 lg6>
          <passphrase-generator
            @copy="onCopyPassphraze"
          />
        </v-flex>
      </v-layout>

      <v-card v-if="isLoginViaPassword" flat color="transparent" class="text-xs-center mt-3">
        <v-layout justify-center>
          <v-flex xs12 sm8 md8 lg6>

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

    </v-flex>

  </v-layout>
</template>

<script>
import b64toBlob from 'b64-to-blob'
import FileSaver from 'file-saver'
import { QrcodeCapture } from 'vue-qrcode-reader'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import PassphraseGenerator from '@/components/PassphraseGenerator'
import LoginForm from '@/components/LoginForm'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'
import QrcodeRenderer from '@/components/QrcodeRenderer'
import Icon from '@/components/icons/BaseIcon'
import QrCodeIcon from '@/components/icons/common/QrCode'
import QrCodeScanIcon from '@/components/icons/common/QrCodeScan'
import FileIcon from '@/components/icons/common/File'
import LoginPasswordForm from '@/components/LoginPasswordForm'
import AppInterval from '@/lib/AppInterval'

export default {
  computed: {
    showQrcodeRenderer () {
      return this.isQrcodeRendererActive && this.passphrase
    },
    isLoginViaPassword () {
      return this.$store.getters['options/isLoginViaPassword']
    }
  },
  data: () => ({
    passphrase: '',
    password: '',
    showQrcodeScanner: false,
    isQrcodeRendererActive: false,
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
    },
    openFileDialog () {
      this.$refs.qrcodeCapture.$el.click()
    },
    saveQrcode () {
      const imgUrl = this.$refs.qrcode.$el.src
      const base64Data = imgUrl.slice(22, imgUrl.length)
      const byteCharacters = b64toBlob(base64Data)
      const blob = new Blob([byteCharacters], { type: 'image/png' })
      FileSaver.saveAs(blob, 'adamant-im.png')
    },
    toggleQrcodeRenderer () {
      this.isQrcodeRendererActive = !this.isQrcodeRendererActive
    }
  },
  components: {
    LanguageSwitcher,
    PassphraseGenerator,
    LoginForm,
    QrcodeScannerDialog,
    QrcodeRenderer,
    QrcodeCapture,
    Icon,
    QrCodeIcon,
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

.logo
  width: 213px
  height: 213px

@media $display-breakpoints.sm-and-up
  .logo
    width: 300px
    height: 300px
</style>
