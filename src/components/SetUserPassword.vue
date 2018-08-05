<template>
  <div>
    <md-dialog :md-open-from="openFrom" :md-close-to="closeTo" ref="set_user_password">
      <md-dialog-content>
        <h3>{{$t('login_via_password.popup_title')}}</h3>
        <md-layout md-flex="66" sm-flex="90">
          <md-input-container>
            <md-input :placeholder="$t('login_via_password.popup_hint')"></md-input>
          </md-input-container>
        </md-layout>
        <md-checkbox v-model="userPasswordCheckbox">
          {{$t('login_via_password.agreement')}}
        </md-checkbox>
        <md-layout md-flex="66" sm-flex="90">
          <md-layout md-align="center" md-gutter="16">
            <md-button class="md-flat md-primary">{{ $t('transfer.confirm_cancel') }}</md-button>
            <md-button disabled class="md-flat md-primary">{{ $t('login_via_password.popup_confirm_text') }}</md-button>
          </md-layout>
        </md-layout>
      </md-dialog-content>
    </md-dialog>
  </div>
</template>

<script>
export default {
  name: 'setUserPassword',
  props: ['openFrom', 'closeTo'],
  methods: {
    open () {
      this.$refs['set_user_password'].open()
    }
  },
  data () {
    return {
      userPasswordCheckbox: null
    }
  }
}
</script>

<style scoped>

</style>
