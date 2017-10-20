<template>
  <div id="app">
      <md-theme md-name="grey">
          <md-toolbar v-if="isTopPanelShown">
              <md-button class="md-icon-button" v-on:click="gotochats">
                  <md-icon >keyboard_backspace</md-icon>
              </md-button>
            <h1 class="md-title">
                <md-input-container>
                    <label>{{ partnerName }}</label>
                    <md-input :value="userDisplayName" @change="setUserName"></md-input>
                </md-input-container>
                </h1>
          </md-toolbar>
    <main>
        <md-progress class="aloader" md-indeterminate v-if="isAjax"></md-progress>

        <router-view></router-view>
    </main>
      <footer>
          <div class="bottom-fixed">
              <md-bottom-bar v-if="logged && isBottomPanelShown">
                  <md-bottom-bar-item md-icon="account_balance_wallet" v-on:click="$router.push('/home/')">{{$t('bottom.wallet_button')}}</md-bottom-bar-item>
                  <md-bottom-bar-item md-icon="forum" v-on:click="$router.push('/chats/')" md-active>{{$t('bottom.chats_button')}}</md-bottom-bar-item>
                  <md-bottom-bar-item md-icon="settings" v-on:click="$router.push('/options/')">{{$t('bottom.settings_button')}}</md-bottom-bar-item>
                  <md-bottom-bar-item md-icon="exit_to_app" v-on:click="exitme">{{$t('bottom.exit_button')}}</md-bottom-bar-item>
              </md-bottom-bar>
          </div>
      </footer>
      </md-theme>
  </div>
</template>

<script>
export default {
  name: 'app',
  mounted: function () {
    setInterval(
      (function (self) {
        return function () {
          self.updateCurrentValues()
        }
      })(this),
      5000
    )
  },
  methods: {
    setUserName (val) {
      this.$store.commit('change_partner_name', val)
    },
    gotochats () {
      this.$store.commit('leave_chat')
      this.$router.push('/chats/')
    },
    exitme () {
      this.$store.commit('logout')
      this.$router.push('/')
    }
  },
  computed: {
    userDisplayName () {
      return this.$store.state.partnerDisplayName
    },
    partnerName () {
      return this.$store.state.partnerName
    },
    isTopPanelShown () {
      return this.$store.state.showPanel
    },
    isBottomPanelShown () {
      return this.$store.state.showBottom
    },
    isAjax () {
      return this.$store.state.ajaxIsOngoing
    },
    logged () {
      return this.$store.state.passPhrase
    }
  },
  data () {
    return {
    }
  }
}
</script>

<style>
body {
  margin: 0;

}
html {
    background-color: #fefefe;
}
body.md-theme-default {
    background-color: #fefefe;
}
footer {
    height: 100px;
}
.aloader {
    position: fixed!important;
    top: 0;
}
.md-toolbar .md-title
{
    min-width: 70%;
}
.md-toolbar .md-title .md-input-container:after {
    background: none ;
}
.md-toolbar .md-title .md-input-container.md-input-focused:after {
    background-color: rgba(0, 0, 0, 0.12);
}
.md-toolbar .md-title .md-input-container
{
    padding-top: 16px;
    min-height: 48px;
}
.md-toolbar .md-title .md-input-container label
{
    top: 13px;
    font-size: 18px;
}
.md-toolbar .md-title .md-input-container.md-input-focused label, .md-toolbar .md-title .md-input-container.md-has-value label {
    top: 0;
    font-size: 12px;
}
.bottom-fixed{
    position:fixed;
    bottom:0;
    width:100%;
    max-width: 800px;
    margin: 0 auto;
    left: 0;
    right: 0;
}

.bottom-fixed .md-bottom-bar {
    box-shadow: none;
    border-top: 1px solid lightgray;
}
.chat, .home, .chats, .settings {
    max-width: 800px;
    margin: 0 auto;
    margin-top: 25px;
}

.chats .md-list {
    max-width: 90%;
}


#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #4A4A4A;
  font-family: 'Exo 2', sans-serif;
    overflow: hidden;
    max-width: 100%;
    height: 100%;

    max-width: 1024px;
    margin-left: auto;
    margin-right: auto;
}
.md-bottom-bar-item.md-active
{
    background-color: #BAD3FF;
    background: repeating-linear-gradient( 140deg, lightgray, lightgray 1px, #FEFEFE 1px, #FEFEFE 15px );
    color: #4A4A4A;
}

main {
  text-align: center;

}

header {
  margin: 0;
  height: 56px;
  padding: 0 16px 0 24px;
  background-color: #484848;
  color: #ffffff;
}
.md-list-item.md-menu-item
{
    background-color:rgba(255,255,255,0.9);
}
.md-primary
{
    background-color: #4A4A4A;
    color: #ffffff;
}
.md-toolbar.md-theme-grey
{
    color: #4A4A4A;
    border-bottom: 1px solid #4A4A4A;
    background-color: #ffffff;
}
header span {
  display: block;
  position: relative;
  font-size: 20px;
  line-height: 1;
  letter-spacing: .02em;
  font-weight: 400;
  box-sizing: border-box;
  padding-top: 16px;
}
</style>
