<template>
  <md-dialog class="user-password" :md-open-from="openFrom" :md-close-to="closeTo" v-on:close="onClose" ref="set_user_password">
    <div v-if="showSpinnerFlag">
      <md-dialog-title class="encoding-title">{{ $t('login_via_password.encoding_data_title') }}</md-dialog-title>
      <Spinner class="inner-spinner"></Spinner>
    </div>
    <div v-else>
      <md-dialog-title>
        {{$t('login_via_password.popup_title')}}
      </md-dialog-title>
      <md-dialog-content md-flex="66" sm-flex="90" style="margin-top: -15px;">
        <md-input-container>
          <md-input v-model="userPasswordValue" autocomplete="off" type="password" :placeholder="$t('login_via_password.popup_hint')"></md-input>
        </md-input-container>
        <div style="display: flex; flex-direction: row;">
          <div class="middle-align-text">
            <div>{{$t('login_via_password.agreement_hint')}} <a target="_blank" v-bind:href="userPasswordAgreementLink">{{$t('login_via_password.agreement')}}</a></div>
          </div>
        </div>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button v-on:click="close">{{ $t('transfer.confirm_cancel') }}</md-button>
        <md-button :disabled="disableSetPassword" v-on:click="setPassword">{{ $t('login_via_password.popup_confirm_text') }}</md-button>
      </md-dialog-actions>
    </div>
  </md-dialog>
</template>

<script>

import {UserPasswordAgreementLink, UserPasswordHashSettings} from '../../lib/constants'
import crypto from 'pbkdf2'
import {
  encryptData,
  getAdmDataBase,
  updateChatItem,
  updateCommonItem, updateContactItem,
  updatePassPhrase,
  updateUserPassword
} from '../../lib/indexedDb'
import Spinner from '../Spinner'

export default {
  name: 'setUserPassword',
  components: { Spinner },
  props: ['openFrom', 'closeTo'],
  methods: {
    open () {
      this.$refs['set_user_password'].open()
    },
    close () {
      this.$refs['set_user_password'].close()
      this.$store.commit('change_storage_method', this.$store.state.storeInLocalStorage)
    },
    setPassword () {
      this.showSpinnerFlag = true
      sessionStorage.removeItem('adm-persist')
      crypto.pbkdf2(this.userPasswordValue, UserPasswordHashSettings.SALT, UserPasswordHashSettings.ITERATIONS,
        UserPasswordHashSettings.KEYLEN, UserPasswordHashSettings.DIGEST, (err, encryptedPassword) => {
          if (err) throw err
          getAdmDataBase().then((db) => {
            updateUserPassword(encryptedPassword)
            // Save passphrase
            updatePassPhrase(db, encryptData(this.$store.getters.getPassPhrase))
            // Exclude contact list, chats, passphrase from common store
            let copyState = Object.assign({}, this.$store.state)
            delete copyState.partners
            delete copyState.chats
            delete copyState.passPhrase
            updateCommonItem(db, encryptData(JSON.stringify(copyState)))
            // Save chats
            const chats = this.$store.getters.getChats
            for (let chat in chats) {
              if (chats.hasOwnProperty(chat) && !chats[chat].hasOwnProperty('readOnly')) {
                const encryptedChatName = encryptData(chat)
                let transactions = this.$store.getters['adm/partnerTransactions'](chat)
                let messages = Object.values(chats[chat].messages)
                messages = messages.concat(transactions)
                messages = messages.sort((a, b) => a.timestamp - b.timestamp)
                messages.forEach(message => {
                  chats[chat].messages[message.id] = message
                })
                updateChatItem(db, encryptedChatName.toString(), encryptData(JSON.stringify(chats[chat])))
              }
            }
            // Save contacts
            updateContactItem(db, encryptData(JSON.stringify(this.$store.getters.getContacts)))
            this.userPasswordValue = null
            this.$store.commit('user_password_exists', true)
            this.$store.commit('change_storage_method', true)
            this.showSpinnerFlag = false
            this.close()
          })
        })
    },
    onClose () {
      this.$emit('close', this.$store.state.storeInLocalStorage)
    }
  },
  updated () {
    const userPasswordValue = this.userPasswordValue
    this.disableSetPassword = !userPasswordValue || userPasswordValue.length < 1
  },
  data () {
    return {
      disableSetPassword: true,
      userPasswordValue: null,
      userPasswordAgreementLink: UserPasswordAgreementLink,
      showSpinnerFlag: false
    }
  }
}
</script>

<style>
  .user-password .md-checkbox .md-checkbox-container:after {
      border: 2px solid gray;
      border-top: 0;
      border-left: 0;
  }
  .md-checkbox-label {
    height: auto !important;
  }
  .middle-align-text {
    display: flex;
    justify-content: center;
    flex-direction: column;
  }

  .encoding-title {
    height: 200px;
  }

  .inner-spinner {
    position: absolute;
    top: 15px;
    background: rgba(0,0,0,0.0);
  }
</style>
