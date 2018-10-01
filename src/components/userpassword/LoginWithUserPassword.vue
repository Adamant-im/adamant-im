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

import crypto from 'pbkdf2'
import Vue from 'vue'
import Spinner from '../Spinner'
import { UserPasswordHashSettings } from '../../lib/constants'
import {
  clearDb,
  decryptData,
  getAdmDataBase,
  getChatItem,
  getCommonItem,
  getContactItem,
  getPassPhrase,
  updateUserPassword
} from '../../lib/indexedDb'

export default {
  name: 'loginWithUserPassword',
  props: ['openFrom', 'closeTo'],
  components: { Spinner },
  methods: {
    forget () {
      getAdmDataBase().then((db) => {
        clearDb(db)
      })
      sessionStorage.removeItem('userPassword')
      this.$store.commit('user_password_exists', false)
      this.$store.commit('change_storage_method', false)
    },
    loginViaPassword: function () {
      crypto.pbkdf2(this.userPasswordValue, UserPasswordHashSettings.SALT, UserPasswordHashSettings.ITERATIONS,
        UserPasswordHashSettings.KEYLEN, UserPasswordHashSettings.DIGEST, (err, encodePassword) => {
          let errorFunction = function () {
            this.errorSnackOpen()
            this.showSpinnerFlag = false
          }.bind(this)
          if (err) errorFunction()
          getAdmDataBase().then((db) => {
            updateUserPassword(encodePassword)
            getCommonItem(db).then((encryptedCommonItem) => {
              decryptData(encryptedCommonItem.value).then((decryptedCommonItem) => {
                try {
                  let state = JSON.parse(decryptedCommonItem)
                  this.$store.commit('set_state', state)
                  getChatItem(db).then((encryptedChats) => {
                    this.showSpinnerFlag = true
                    encryptedChats.forEach((chat) => {
                      decryptData(chat.value).then((decryptedChat) => {
                        Vue.set(this.$store.getters.getChats, chat.name, JSON.parse(decryptedChat))
                      })
                    })
                  })
                  getContactItem(db).then((encryptedContacts) => {
                    decryptData(encryptedContacts.value).then((decryptedContacts) => {
                      this.$store.commit('partners/contactList', JSON.parse(decryptedContacts))
                    })
                  })
                  getPassPhrase(db).then((encryptedPassPhrase) => {
                    decryptData(encryptedPassPhrase.value).then((passPhrase) => {
                      sessionStorage.setItem('storeInLocalStorage', 'true')
                      sessionStorage.removeItem('adm-persist')
                      this.$store.dispatch('afterLogin', passPhrase)
                      this.$root._router.push('/chats/')
                      this.$store.commit('mock_messages')
                      this.$store.commit('stop_tracking_new')
                      this.$store.commit('save_user_password', this.userPasswordValue)
                      this.$store.commit('change_storage_method', true)
                      this.showSpinnerFlag = false
                    })
                  })
                } catch (e) {
                  errorFunction()
                }
              })
            })
          })
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
