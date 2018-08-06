<template>
  <div>
    <md-dialog :md-open-from="openFrom" :md-close-to="closeTo" ref="login_with_user_password">
      <md-dialog-content>
        <h3>{{$t('login_via_password.enter_password')}}</h3>
        <md-layout md-flex="66" sm-flex="90">
          <md-input-container>
            <md-input v-model="userPasswordValue" :placeholder="$t('login_via_password.user_password_hint')"></md-input>
          </md-input-container>
        </md-layout>
        <md-layout md-flex="66" sm-flex="90">
          <md-layout md-align="center" md-gutter="16">
            <md-button v-on:click="closeAndForget" class="md-flat md-primary">{{ $t('login_via_password.user_password_forget') }}</md-button>
            <md-button :disabled="disableLoginViaPassword" v-on:click="loginViaPassword" class="md-flat md-primary">{{ $t('login_via_password.user_password_unlock') }}</md-button>
          </md-layout>
        </md-layout>
      </md-dialog-content>
    </md-dialog>
  </div>
</template>

<script>

import {Base64} from 'js-base64'

export default {
  name: 'loginWithUserPassword',
  props: ['openFrom', 'closeTo'],
  methods: {
    open () {
      this.$refs['login_with_user_password'].open()
    },
    close () {
      this.$refs['login_with_user_password'].close()
    },
    closeAndForget () {
      this.forget()
      this.close()
    },
    forget () {
      localStorage.removeItem('storedData')
      localStorage.removeItem('adm-persist')
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
        const storedData = JSON.parse(localStorage.getItem('storedData'))
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
