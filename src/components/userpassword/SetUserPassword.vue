<template>
  <div>
    <md-dialog :md-open-from="openFrom" :md-close-to="closeTo" ref="set_user_password">
      <md-dialog-content>
        <h3>{{$t('login_via_password.popup_title')}}</h3>
        <md-layout md-flex="66" sm-flex="90">
          <md-input-container>
            <md-input v-model="userPasswordValue" :placeholder="$t('login_via_password.popup_hint')"></md-input>
          </md-input-container>
        </md-layout>
        <input type="checkbox" value="" v-model="userPasswordCheckbox"/>
        {{$t('login_via_password.agreement_hint')}} <a target="_blank" v-bind:href="userPasswordAgreementLink">{{$t('login_via_password.agreement')}}</a>
        <md-layout md-flex="66" sm-flex="90">
          <md-layout md-align="center" md-gutter="16">
            <md-button v-on:click="close" class="md-flat md-primary">{{ $t('transfer.confirm_cancel') }}</md-button>
            <md-button :disabled="disableSetPassword" v-on:click="setPassword" class="md-flat md-primary">{{ $t('login_via_password.popup_confirm_text') }}</md-button>
          </md-layout>
        </md-layout>
      </md-dialog-content>
    </md-dialog>
  </div>
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
      // TODO need encrypt password
      this.$store.commit('save_user_password', this.userPasswordValue)
      this.$store.commit('user_password_exists', true)
      this.userPasswordValue = null
      this.userPasswordCheckbox = false
      this.close()
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

<style scoped>

</style>
