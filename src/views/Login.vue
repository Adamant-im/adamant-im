<template>
  <div class="login-page">

    <v-layout row justify-center class="mb-3">
      <v-flex xs12 md5 class="text-xs-right">
        <language-switcher/>
      </v-flex>
    </v-layout>

    <v-layout row wrap justify-center>
      <v-flex xs12 md5>
        <v-card flat color="transparent" class="text-xs-center">
          <img
            :src="logo"
            width="300"
            height="300"
          />

          <h1 class="login-page__title">{{ $t('brandTitle') }}</h1>
          <h2 class="login-page__subtitle mt-3">{{ $t('brandSubtitle') }}</h2>
        </v-card>
      </v-flex>
    </v-layout>

    <v-layout row justify-center>
      <v-flex xs12 md5>
        <v-card flat color="transparent" class="text-xs-center mt-3">

          <v-layout justify-center>
            <v-flex xs12 md8>
              <login-form
                v-model="passphrase"
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
      </v-flex>
    </v-layout>

    <v-layout row justify-center class="mt-3">
      <v-flex xs12 md4>
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
  </div>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'
import PassphraseGenerator from '@/components/PassphraseGenerator'
import LoginForm from '@/components/LoginForm'
import QrcodeScanner from '@/components/QrcodeScanner'

export default {
  data: () => ({
    passphrase: '',
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
        .catch(err => {
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
/* @todo <main> shouldn't have text-align: center by default */
main {
  text-align: left;
}

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
</style>

<i18n>
{
  "en": {
    "brandTitle": "ADAMANT",
    "brandSubtitle": "A top-notch anonymous messenger encrypted with a Blockchain",
    "passwordPlaceholder": "Input your passphrase to login",
    "Invalid passphraze": "Invalid passphraze",
    "Copied": "Copied"
  },
  "ru": {
    "brandTitle": "АДАМАНТ",
    "brandSubtitle": "Самый анонимный мессенджер, зашифрованный в Blockchain",
    "passwordPlaceholder": "Введите пароль, чтобы войти"
  }
}
</i18n>
