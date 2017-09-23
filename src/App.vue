<template>
  <div id="app">
      <md-theme md-name="purple">
          <md-toolbar>
            <h1 class="md-title">Haze</h1>
          </md-toolbar>
    <main>
      <router-view></router-view>
    </main>
      <footer>
          <div class="bottom-fixed">
              <md-bottom-bar v-if="logged">
                  <md-bottom-bar-item md-icon="account_balance_wallet" md-active>{{$t('bottom.wallet_button')}}</md-bottom-bar-item>
                  <md-bottom-bar-item md-icon="forum" >{{$t('bottom.chats_button')}}</md-bottom-bar-item>
                  <md-bottom-bar-item md-icon="settings">{{$t('bottom.settings_button')}}</md-bottom-bar-item>
              </md-bottom-bar>
          </div>
      </footer>
      </md-theme>
  </div>
</template>

<script>
export default {
  name: 'app',
  computed: {
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
  background-color: #35495E;
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
