<template>
  <md-layout md-align="center" style="justify-content: center;">
    <md-layout md-flex="66" md-flex-xsmall="80" md-gutter="16"  style="justify-content: center;">
      <md-input-container class="password_input">
        <md-input v-model="userPasswordValue" ref="passwordInput" :placeholder="$t('login_via_password.user_password_title')" @keyup.native="kp($event)" type="password"></md-input>
      </md-input-container>
      <md-layout md-flex-xsmall="80" md-align="center" md-flex="66">
        <md-button :disabled="disableLoginViaPassword" class="md-raised md-short" v-on:click="loginViaPassword">{{ $t('login_via_password.user_password_unlock') }}</md-button>
      </md-layout>
    </md-layout>
    <md-layout md-flex="66" md-flex-xsmall="80" style="margin-top: 50px">
      <md-layout md-align="center" md-gutter="16">
        <p style="font-weight: 300;margin-bottom: 10px;">{{$t('login_via_password.remove_password_hint')}}</p>
      </md-layout>
    </md-layout>
    <md-layout md-flex="66" md-flex-xsmall="80" style="">
      <md-layout md-align="center" md-gutter="16">
        <a v-on:click="forget" class='create_link'>{{ $t('login_via_password.remove_password') }}</a>
      </md-layout>
    </md-layout>
    <md-snackbar md-position="bottom center" md-accent ref="errorsnackbar" md-duration="2000">
      <span>{{ $t('login_via_password.incorrect_password') }}</span>
    </md-snackbar>
    <Spinner v-if="showSpinnerFlag"></Spinner>
  </md-layout>
</template>

<script>

import ed2curve from 'ed2curve'
import nacl from 'tweetnacl/nacl-fast'
import {Base64} from 'js-base64'
import {decode} from '@stablelib/utf8'
import crypto from 'pbkdf2'
import Spinner from '../Spinner'
import { UserPasswordHashSettings } from '../../lib/constants'

function convertStringToUint8Array () {
  let encryptedStoredData = localStorage.getItem('storedData').split(',')
  let result = []
  for (let i = 0; i < encryptedStoredData.length; i++) {
    result.push(parseInt(encryptedStoredData[i]))
  }
  return Uint8Array.from(result)
}

export default {
  name: 'loginWithUserPassword',
  props: ['openFrom', 'closeTo'],
  components: { Spinner },
  methods: {
    forget () {
      localStorage.removeItem('storedData')
      localStorage.removeItem('adm-persist')
      sessionStorage.removeItem('userPassword')
      this.$store.commit('user_password_exists', false)
      this.$store.commit('change_storage_method', false)
    },
    loginViaPassword () {
      crypto.pbkdf2(this.userPasswordValue, UserPasswordHashSettings.SALT, UserPasswordHashSettings.ITERATIONS, UserPasswordHashSettings.KEYLEN, UserPasswordHashSettings.DIGEST, (err, encodePassword) => {
        let errorFunction = function () {
          this.errorSnackOpen()
          this.showSpinnerFlag = false
        }.bind(this)
        if (err) errorFunction()
        const userPasswordValueHash = encodePassword.toString('hex')
        const nonce = Buffer.allocUnsafe(24)
        const DHSecretKey = ed2curve.convertSecretKey(userPasswordValueHash)
        const decrypted = nacl.secretbox.open(convertStringToUint8Array(), nonce, DHSecretKey)
        let storedData = null
        try {
          storedData = JSON.parse(decode(decrypted))
        } catch (err) {
          errorFunction()
          return
        }
        this.showSpinnerFlag = true
        const passPhrase = Base64.decode(storedData.passPhrase)
        this.getAccountByPassPhrase(passPhrase, function (context) {
          this.$store.dispatch('afterLogin', passPhrase)
          this.$root._router.push('/chats/')
          this.loadChats(true)
          this.$store.commit('mock_messages')
          this.$store.commit('stop_tracking_new')
          this.$store.commit('save_user_password', this.userPasswordValue)
          this.showSpinnerFlag = false
        }, errorFunction)
      })
    },
    errorSnackOpen () {
      this.$refs.errorsnackbar.open()
    },
    kp: function (event) {
      if (event.key === 'Enter') {
        this.loginViaPassword()
      }
    }
  },
  mounted () {
    this.$refs.passwordInput.$el.focus()
  },
  computed: {
    disableLoginViaPassword () {
      return !this.userPasswordValue
    }
  },
  data () {
    return {
      userPasswordValue: null,
      showSpinnerFlag: false
    }
  }
}
</script>
