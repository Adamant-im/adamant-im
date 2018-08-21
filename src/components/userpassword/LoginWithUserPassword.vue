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
  </md-layout>
</template>

<script>

import {Base64} from 'js-base64'

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
      console.log('password', this.userPasswordValue)
      console.log('new password', this.$store.getters.getUserPassword)
      if (this.$store.getters.getUserPassword === this.userPasswordValue) {
        let errorFunction = function () {
          // TODO call warning
          console.log('some error has been occurred')
        }
        let passPhrase = ''
        const storedData = JSON.parse(Base64.decode(localStorage.getItem('storedData')))
        if (!storedData) {
          // TODO call warning
          console.log('empty stored data')
          this.close()
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
        console.log('incorrect password')
      }
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
