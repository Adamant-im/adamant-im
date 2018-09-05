<template>
  <md-layout md-flex="66" md-flex-xsmall="80">
    <md-input-container class="password_input">
      <label style="text-align: center;width: 100%;">{{ $t('login.password_label') }}</label>
      <md-input v-model="userPasswordValue" type="password"></md-input>
    </md-input-container>
    <md-layout md-align="center" md-gutter="16">
      <md-button class="md-raised md-short" v-on:click="forget">{{ $t('login_via_password.user_password_forget') }}</md-button>
      <md-button :disabled="disableLoginViaPassword" class="md-raised md-short" v-on:click="loginViaPassword">{{ $t('login_via_password.user_password_unlock') }}</md-button>
    </md-layout>
    <md-snackbar md-position="bottom center" md-accent ref="errorsnackbar" md-duration="2000">
      <span>{{ $t('login_via_password.incorrect_password') }}</span>
    </md-snackbar>
  </md-layout>
</template>

<script>

import ed2curve from 'ed2curve'
import nacl from 'tweetnacl/nacl-fast'
import {Base64} from 'js-base64'
import {decode} from '@stablelib/utf8'

export default {
  name: 'loginWithUserPassword',
  props: ['openFrom', 'closeTo'],
  methods: {
    forget () {
      localStorage.removeItem('storedData')
      localStorage.removeItem('adm-persist')
      sessionStorage.removeItem('userPassword')
      this.$store.commit('user_password_exists', false)
      this.$store.commit('change_storage_method', false)
    },
    loginViaPassword () {
      let userPassword = this.$store.getters.getUserPassword
      if (userPassword === this.userPasswordValue) {
        let errorFunction = function () {
          this.errorSnackOpen()
        }
        let encryptedStoredData = localStorage.getItem('storedData').split(',')
        let result = []
        for (let i = 0; i < encryptedStoredData.length; i++) {
          result.push(parseInt(encryptedStoredData[i]))
        }
        result = Uint8Array.from(result)
        let passPhrase = ''
        const nonce = Buffer.allocUnsafe(24)
        const DHSecretKey = ed2curve.convertSecretKey(userPassword)
        const decrypted = nacl.secretbox.open(result, nonce, DHSecretKey)
        const storedData = JSON.parse(decode(decrypted))
        if (!storedData) {
          this.errorSnackOpen()
          return
        }
        passPhrase = Base64.decode(storedData.passPhrase)
        this.getAccountByPassPhrase(passPhrase, function (context) {
          this.$store.dispatch('afterLogin', passPhrase)
          this.$root._router.push('/chats/')
          this.loadChats(true)
          this.$store.commit('mock_messages')
          this.$store.commit('stop_tracking_new')
        }, errorFunction)
      } else {
        this.errorSnackOpen()
      }
    },
    errorSnackOpen () {
      this.$refs.errorsnackbar.open()
    }
  },
  computed: {
    disableLoginViaPassword () {
      return !this.userPasswordValue
    }
  },
  data () {
    return {
      userPasswordValue: null
    }
  }
}
</script>
