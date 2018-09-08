<template>
  <md-dialog class="user-password" :md-open-from="openFrom" :md-close-to="closeTo" v-on:close="onClose" ref="set_user_password">
    <md-dialog-content style="padding: 10px 10px 0px 20px">
      <h3>{{$t('login_via_password.popup_title')}}</h3>
      <md-layout md-flex="66" sm-flex="90" style="margin-top: -15px;">
        <md-input-container>
          <md-input v-model="userPasswordValue" :placeholder="$t('login_via_password.popup_hint')"></md-input>
        </md-input-container>
      </md-layout>
      <md-layout>
        <md-checkbox v-model="userPasswordCheckbox" style="display: flex; align-items: center">
        </md-checkbox>
        <md-layout>
          <div class="middle-align-text">
            <div>{{$t('login_via_password.agreement_hint')}} <a target="_blank" v-bind:href="userPasswordAgreementLink">{{$t('login_via_password.agreement')}}</a></div>
          </div>
        </md-layout>
      </md-layout>
      <md-layout md-align="end" md-gutter="16">
        <md-button v-on:click="close" class="md-flat md-primary">{{ $t('transfer.confirm_cancel') }}</md-button>
        <md-button :disabled="disableSetPassword" v-on:click="setPassword" class="md-flat md-primary">{{ $t('login_via_password.popup_confirm_text') }}</md-button>
      </md-layout>
    </md-dialog-content>
  </md-dialog>
</template>

<script>
import {UserPasswordAgreementLink} from '../../lib/constants'

export default {
  name: 'setUserPassword',
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
      this.$store.commit('change_storage_method', true)
      this.$store.commit('save_user_password', this.userPasswordValue)
      this.$store.commit('user_password_exists', true)
      this.userPasswordValue = null
      this.userPasswordCheckbox = false
      this.close()
    },
    onClose () {
      this.$emit('close', this.$store.state.storeInLocalStorage)
    }
  },
  updated () {
    const userPasswordValue = this.userPasswordValue
    this.disableSetPassword = !userPasswordValue || userPasswordValue.length < 1 || !this.userPasswordCheckbox
  },
  data () {
    return {
      userPasswordCheckbox: false,
      disableSetPassword: true,
      userPasswordValue: null,
      userPasswordAgreementLink: UserPasswordAgreementLink
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
</style>
