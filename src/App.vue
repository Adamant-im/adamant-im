<template>
  <div id="app">
      <md-theme md-name="grey">
          <md-toolbar v-if="isTopPanelShown">
              <md-button class="md-icon-button" v-on:click="gotochats">
                  <md-icon >keyboard_backspace</md-icon>
              </md-button>
            <h1 class="md-title">{{ partnerName }}</h1>
              <md-button class="md-icon-button">
                  <md-icon >edit</md-icon>
              </md-button>
          </md-toolbar>
    <main>
        <md-progress md-indeterminate v-if="isAjax"></md-progress>

        <router-view></router-view>
    </main>
      <footer>
          <div class="bottom-fixed">
              <md-bottom-bar v-if="logged && isBottomPanelShown">
                  <md-bottom-bar-item md-icon="account_balance_wallet" v-on:click="$router.push('/home/')" md-active>{{$t('bottom.wallet_button')}}</md-bottom-bar-item>
                  <md-bottom-bar-item md-icon="send" v-on:click="$router.push('/transfer/')">{{$t('bottom.send_button')}}</md-bottom-bar-item>
                  <md-bottom-bar-item md-icon="forum" v-on:click="$router.push('/chats/')">{{$t('bottom.chats_button')}}</md-bottom-bar-item>
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
          self.updateCurrentValues() // Thing you wanted to run as non-window 'this'
        }
      })(this),
      50000
    )
  },
  methods: {
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
  }
}
</script>

<style>
body {
  margin: 0;
}
footer {
    height: 100px;
}
.bottom-fixed{
    position:fixed;
    bottom:0;
    width:100%;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

main {
  text-align: center;
  margin-top: 40px;
}

header {
  margin: 0;
  height: 56px;
  padding: 0 16px 0 24px;
  background-color: #484848;
  color: #ffffff;
}
.md-primary
{
    background-color: #484848;
    color: #ffffff;
}
.md-toolbar.md-theme-grey
{
    background-color: #484848;
    color: #ffffff;
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
