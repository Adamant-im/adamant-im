<template>
  <div class="login">
      <md-input-container class="language_select">
          <md-select name="language" id="language" v-model="language">
              <md-option  v-for="(language, code) in languageList" :value="code" :key="code">{{ language.title }}</md-option>
          </md-select>
      </md-input-container>
      <div class="site-branding container">
          <a href="#" class="custom-logo-link" rel="home" itemprop="url"><img width="256" height="256" src="/static/img/adamant-logo-transparent-512x512.png" class="custom-logo" alt="ADAMANT" itemprop="logo"></a>				<a href="#">
					<span class="site-title">
						ADAMANT					</span>
      </a>
      </div>
      <md-layout md-align="center" md-gutter="16">
      <md-layout md-flex="66" md-flex-xsmall="80">
          <md-input-container class="password_input">
              <label style="text-align: center;width: 100%;">{{ $t('login.password_label') }}</label>
              <md-input v-model="passPhrase" type="password" autocomplete="new-password" @keyup.native="kp($event)"></md-input>
          </md-input-container>
      </md-layout>
          <md-layout md-flex="66" md-flex-xsmall="80">
              <md-layout md-align="center" md-gutter="16">
                  <md-button class="md-raised md-short" v-on:click="logme">{{ $t('login.login_button') }}</md-button>

              </md-layout>
          </md-layout>
          <md-layout md-flex="66" md-flex-xsmall="80" style="margin-top:30px">
              <md-layout md-align="center" md-gutter="16">
                  <p style="font-weight: 300;">{{$t('login.create_address_label')}}</p>
              </md-layout>
          </md-layout>
          <md-layout md-flex="66" md-flex-xsmall="80" style="">
              <md-layout md-align="center" md-gutter="16">
                  <a class='create_link' v-on:click="showCreate = true">{{ $t('login.new_button') }}</a>
              </md-layout>
          </md-layout>
    </md-layout>
      <md-layout v-if="showCreate" md-align="center" md-gutter="16">
          <md-layout md-flex="66" md-flex-xsmall="90" class="newpass_field">
              <md-input-container>
                  <label v-html="$t('login.new_password_label')"></label>
                  <md-textarea v-bind:value="yourPassPhrase" readonly></md-textarea>
                  <md-icon v-clipboard="yourPassPhrase"  @success="copySuccess" style="cursor:pointer;z-index:20;">content_copy</md-icon>
                  <md-icon v-if=!iOS v-on:click.native="saveFile" style="cursor:pointer;z-index:20;">archive</md-icon>

              </md-input-container>

          </md-layout>
      </md-layout>
      <md-snackbar md-position="bottom center" md-accent ref="snackbar" md-duration="2000">
          <span>{{ $t('login.invalid_passphrase') }}</span>
      </md-snackbar>
      <md-snackbar md-position="bottom center" md-accent ref="loginSnackbar" md-duration="2000">
          <span>{{ $t('home.copied') }}</span>
      </md-snackbar>
  </div>

</template>

<script>
export default {
  name: 'login',
  methods: {
    copySuccess (e) {
      this.$refs.loginSnackbar.open()
    },
    kp: function (event) {
      if (event.key === 'Enter') {
        this.logme()
      }
    },
    snackOpen () {
      this.$refs.snackbar.open()
    },
    logme () {
      this.passPhrase = this.passPhrase.toLowerCase().trim()
      if (this.passPhrase.split(' ').length !== 12) {
        this.snackOpen()
        return
      }
      var errorFunction = function () {
        this.snackOpen()
      }.bind(this)
      this.getAccountByPassPhrase(this.passPhrase, function (context) {
        this.$store.commit('save_passphrase', {'passPhrase': this.passPhrase})
        this.$root._router.push('/chats/')
        this.loadChats()
        this.$store.commit('stop_tracking_new')
      }, errorFunction)
    },
    'handleSuccess': function (e) {
      this.snackbar = true
    },
    saveFile () {
      var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      if (!iOS) {
        this.download(this.yourPassPhrase, 'adm-' + btoa(new Date().getTime()).replace('==', '') + '.txt', 'text/plain')
      }
    },
    download (data, filename, type) {
      var file = new Blob([data], {type: type})
      if (window.navigator.msSaveOrOpenBlob) { // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename)
      } else { // Others
        var a = document.createElement('a')
        var url = URL.createObjectURL(file)
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        setTimeout(function () {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }, 0)
      }
    }
  },
  mounted: function () {
    if (this.$store.state.passPhrase) {
      this.$store.commit('leave_chat')
      this.$root._router.push('/chats/')
    }
  },
  computed: {
    iOS: function () {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    },
    languageList: function () {
      var messages = require('../i18n').default
      return messages
    },
    yourPassPhrase: function () {
      var Mnemonic = require('bitcore-mnemonic')
      return new Mnemonic(Mnemonic.Words.ENGLISH).toString()
    }
  },
  watch: {
    'language' (to, from) {
      this.$i18n.locale = to
      this.$store.commit('change_lang', to)
    }
  },
  data () {
    return {
      passPhrase: '',
      language: this.$i18n.locale,
      showCreate: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.site-branding
{
    text-align: center;
    padding: 40px 0 40px;
}

.container {
    width: 800px;
    margin: 0 auto;
}
.container a{
    color: #000;
}
.md-layout .md-button.md-raised.md-short, .md-short {
    min-width: 126px;
}
.md-layout .md-button.md-raised.md-shit, .md-shit {
    background: repeating-linear-gradient( 140deg, lightgray, lightgray 1px, #FEFEFE 1px, #FEFEFE 15px );
    color: #4A4A4A;
}
.md-layout .md-button.md-raised.md-shit:hover,.md-shit:hover {
    background: none;
    background-color: rgba(0, 0, 0, 0.12);
}
p.site-description {
    font-family: 'Exo 2'!important;
    font-style: normal!important;
    font-weight: 100!important;
    margin-top: 10px;
    margin: 10px 0;
    padding: 0px 20px;
}

p.site-description {
    line-height: 20px;
}

p.site-description {
    color: #4a4a4a;
}
p.site-description:before {
    content: ' ';
    display: block;
    margin: auto;
    background: #fff;
    margin-bottom: 10px;
    height: 1px;
    max-width: 470px;
    background: #4a4a4a;
}
.site-title {
    color: #4a4a4a;
    line-height: 40px;
    font-family: 'Exo 2'!important;
    font-style: normal!important;
    font-weight: 100!important;
    font-size: 45px;
    display: inline-block;
    width: 100%;
    padding: 0px 10px;
    padding-bottom: 15px;
}
a.custom-logo-link {
    width: 100%;
    text-align: center;
    display: inline-block;
    margin-bottom: 10px;
    color: #000;
}

a.custom-logo-link img {
    height: auto;
    max-width: 100%
}
.newpass_field label {
    text-align: left;

}
.newpass_field {
    padding-top: 20px!important;
}
.newpass_field textarea {
    padding-top: 20px !important;
}

@media (max-width: 1100px) {
    .container {
        width: 95%;
        margin: 0 auto;
    }
}
@media (max-width: 991px) {
    .site-branding {
        padding: 60px 0 10px;
    }
    .container {
        width: 95%;
        margin: 0 auto;
    }
}
@media (max-width: 767px) {
    .container {
        width: 90%;
        margin: 0 auto;
    }
    p.site-description {
        font-size: 16px;
    }
    .site-title
    {
        font-size: 36px;

    }
}
@media (max-width: 600px) {
    .newpass_field textarea{
        height: 70px!important;
        padding-top: 20px!important;
    }
}
@media (max-width: 480px) {
    .newpass_field .md-icon{
        padding-top: 40px;
    }
    .newpass_field textarea{
        height: 100px!important;
        padding-top: 30px!important;
    }

    .container {
        width: 95%;
    }
}



.language_select .md-select
{
    min-width:150px;
}

.language_select .md-select:not(.md-select-icon):after {
    left: 0;
    transform: translateY(-50%) rotateZ(270deg) scaleY(0.45) scaleX(0.85);
    right:auto;
}
.language_select.md-input-container:after {
    background-color: transparent;
}
.md-input-container.password_input {
    margin-bottom:10px;
}
.md-input-container.language_select {
    position: absolute;
    right: 20px;
    top: 0;
    margin-top: 10px;
    padding-top: 0;
    width: 90px;
    font-weight: 300;
}
.language_select .md-select .md-menu {

}
.md-input-container.language_select .md-select .md-select-value
{
    padding-right: 0px;
}
.md-input-container.language_select .md-select {
    min-width:90px;
}
a.create_link{
   text-decoration: underline!important;
   color: #4a4a4a!important;
   font-weight: 500;
}
</style>
