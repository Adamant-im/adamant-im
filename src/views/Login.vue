<template>
  <v-layout
    row
    fill-height
    justify-center
    :class="className"
  >
    <container>
      <div class="text-right">
        <language-switcher>
          <v-icon
            slot="prepend"
            size="18"
          >
            mdi-chevron-right
          </v-icon>
        </language-switcher>
      </div>

      <v-card
        flat
        color="transparent"
        class="text-center mt-3"
      >
        <logo style="width: 300px;" />

        <h1 :class="`${className}__title`">
          {{ $t('login.brand_title') }}
        </h1>
        <h2
          :class="`${className}__subtitle`"
          class="hidden-sm-and-down mt-3"
        >
          {{ $t('login.subheader') }}
        </h2>
      </v-card>

      <v-card
        v-if="!isLoginViaPassword"
        flat
        color="transparent"
        class="text-center mt-3"
      >
        <v-layout justify-center>
          <v-flex
            xs12
            sm8
            md8
            lg8
          >
            <login-form
              ref="loginForm"
              v-model="passphrase"
              @login="onLogin"
              @error="onLoginError"
            />
          </v-flex>
        </v-layout>

        <v-layout
          justify-center
          class="mt-2"
        >
          <v-btn
            :title="$t('login.scan_qr_code_button_tooltip')"
            icon
            text
            :class="`${className}__icon`"
            @click="showQrcodeScanner = true"
          >
            <icon><qr-code-scan-icon /></icon>
          </v-btn>

          <qrcode-capture
            @detect="onDetectQrcode"
            @error="onDetectQrcodeError"
          >
            <v-btn
              :title="$t('login.login_by_qr_code_tooltip')"
              icon
              text
              :class="`${className}__icon`"
            >
              <icon><file-icon /></icon>
            </v-btn>
          </qrcode-capture>
        </v-layout>
      </v-card>

      <v-layout
        v-if="!isLoginViaPassword"
        justify-center
        class="mt-5"
      >
        <v-flex
          xs12
          sm8
          md8
          lg8
        >
          <passphrase-generator
            @copy="onCopyPassphrase"
          />
        </v-flex>
      </v-layout>

      <v-card
        v-if="isLoginViaPassword"
        flat
        color="transparent"
        class="text-center mt-3"
      >
        <v-layout justify-center>
          <v-flex
            xs12
            sm8
            md8
            lg8
          >
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
import QrcodeCapture from '@/components/QrcodeCapture'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import PassphraseGenerator from '@/components/PassphraseGenerator'
import LoginForm from '@/components/LoginForm'
import QrcodeScannerDialog from '@/components/QrcodeScannerDialog'
import Icon from '@/components/icons/BaseIcon'
import QrCodeScanIcon from '@/components/icons/common/QrCodeScan'
import FileIcon from '@/components/icons/common/File'
import LoginPasswordForm from '@/components/LoginPasswordForm'
import Logo from '@/components/icons/common/Logo'
import { navigateByURI } from '@/router/navigationGuard'

export default {
  components: {
    LanguageSwitcher,
    PassphraseGenerator,
    LoginForm,
    QrcodeScannerDialog,
    QrcodeCapture,
    Icon,
    QrCodeScanIcon,
    FileIcon,
    LoginPasswordForm,
    Logo
  },
  data: () => ({
    passphrase: '',
    password: '',
    showQrcodeScanner: false,
    logo: '/img/adamant-logo-transparent-512x512.png'
  }),
  computed: {
    className () {
      return 'login-page'
    },
    isLoginViaPassword () {
      return this.$store.getters['options/isLoginViaPassword']
    }
  },
  methods: {
    onDetectQrcode (passphrase) {
      this.onScanQrcode(passphrase)
    },
    onDetectQrcodeError (err) {
      this.passphrase = ''
      this.$store.dispatch('snackbar/show', {
        message: this.$t('login.invalid_qr_code')
      })
      console.warn(err)
    },
    onLogin () {
      if (!this.$store.state.chat.isFulfilled) {
        this.$store.commit('chat/createAdamantChats')
        this.$store.dispatch('chat/loadChats')
          .then(() => this.$store.dispatch('startInterval'))
      } else {
        this.$store.dispatch('startInterval')
      }

      navigateByURI()
    },
    onLoginError (key) {
      this.$store.dispatch('snackbar/show', {
        message: this.$t(key)
      })
    },
    onCopyPassphrase () {
      this.$store.dispatch('snackbar/show', {
        message: this.$t('home.copied'),
        timeout: 2000
      })
    },
    onScanQrcode (passphrase) {
      this.passphrase = passphrase
      this.$nextTick(() => this.$refs.loginForm.submit())
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/settings/_variables.scss';
@import '~vuetify/src/styles/settings/_colors.scss';
@import '../assets/stylus/settings/_colors.scss';

.login-page {
  &__title {
    font-family: 'Exo 2';
    font-weight: 100;
    font-size: 40px;
    line-height: 40px;
    text-transform: uppercase;
  }
  &__subtitle {
    font-family: 'Exo 2';
    font-weight: 100;
    font-size: 18px;
  }
  &__icon {
    transition: 0.2s linear;
  }
}

/** Themes **/
.theme--light {
  .login-page {
    &__icon, &__title, &__subtitle {
      color: map-get($adm-colors, 'regular');
    }
  }
}
.theme--dark {
  .login-page {
    &__icon {
      color: map-get($shades, 'white');
    }
  }
}
</style>
