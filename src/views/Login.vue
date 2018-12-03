<template>
  <v-layout row fill-height justify-center class="login-page">

    <v-flex md5 sm8 xs12>

      <div class="text-xs-right">
        <language-switcher/>
      </div>

      <v-card flat color="transparent" class="text-xs-center mt-3">
        <img
          :src="logo"
          class="logo"
        />

        <h1 class="login-page__title">{{ $t('brandTitle') }}</h1>
        <h2 class="hidden-sm-and-down login-page__subtitle mt-3">{{ $t('brandSubtitle') }}</h2>
      </v-card>

      <v-card flat color="transparent" class="text-xs-center mt-3">
        <v-layout justify-center>
          <v-flex xs12 md8>
            <login-form
              @login="onLogin"
              @error="onLoginError"
            />
          </v-flex>
        </v-layout>

        <v-layout justify-center>
          <v-btn @click="showQrcodeScanner = true" icon flat large fab>
            <v-icon>mdi-qrcode-scan</v-icon>
          </v-btn>
        </v-layout>
      </v-card>

      <div>
        <v-layout justify-center>
          <v-flex xs12 md8>
            <passphrase-generator
              @copy="onCopyPassphraze"
            />
          </v-flex>
        </v-layout>
      </div>

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

export default {
  data: () => ({
    showQrcodeScanner: false,
    logo: '/img/adamant-logo-transparent-512x512.png' // @todo maybe svg will be better
  }),
  methods: {
    onLogin () {
      this.$router.push('/chats')
    },
    onLoginError () {
      this.$store.dispatch('snackbar/show', {
        message: this.$t('Invalid passphraze')
      })
    },
    onCopyPassphraze () {
      this.$store.dispatch('snackbar/show', {
        message: this.$t('Copied'),
        timeout: 1500
      })
    },
    onScanQrcode (passphrase) {
      this.$store.dispatch('login', {
        passphrase
      })
        .then(() => {
          this.onLogin()
        })
        .catch(() => {
          this.onLoginError()
        })
    }
  },
  components: {
    LanguageSwitcher,
    PassphraseGenerator,
    LoginForm,
    QrcodeScanner
  }
}
</script>

<style>
.login-page {}
.login-page__title {
  color: #4a4a4a;
  font-family: 'Exo 2';
  font-weight: 100;
  font-size: 45px;
  line-height: 40px;
  text-transform: uppercase;
}
.login-page__subtitle {
  font-family: 'Exo 2';
  font-weight: 100;
  font-size: 18px;
}

.logo {
  width: 213px;
  height: 213px;
}

/* sm-and-up */
@media only screen and (min-width : 600px) {
  .logo {
    width: 300px;
    height: 300px;
  }
}
</style>

<i18n>
{
  "en": {
    "brandTitle": "ADAMANT",
    "brandSubtitle": "A top-notch anonymous messenger encrypted with a Blockchain"
  },
  "ru": {
    "brandTitle": "АДАМАНТ",
    "brandSubtitle": "Самый анонимный мессенджер, зашифрованный в Blockchain"
  }
}
</i18n>
