<template>
  <div class="login">
      <md-input-container class="language_select">
          <md-select name="language" id="language" v-model="language">
              <md-option  v-for="(language, code) in languageList" :value="code" :key="code">{{ language.title }}</md-option>
          </md-select>
      </md-input-container>
      <div class="site-branding container">
          <span class="custom-logo-link" rel="home" itemprop="url"><img  src="/static/img/adamant-logo-transparent-512x512.png" class="custom-logo" alt="ADAMANT" itemprop="logo"></span>
            <span href="#">
              <span class="site-title">
                {{ language === 'ru' ? 'АДАМАНТ' : 'ADAMANT' }}
              </span>
            </span>
          <p class="site-description">{{ $t('login.subheader') }}</p>
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
          <md-layout md-flex="66"
                     md-flex-xsmall="80"
                     md-align="center"
                     class="qr-code-buttons">
            <md-button classs="md-ripple md-disabled"
                       :title="$t('login.scan_qr_code_button_tooltip')"
                       @click="scanQRCode">
              <Icon name="qrCodeLense" />
            </md-button>
            <md-button classs="md-ripple md-disabled"
                       @click.prevent="saveQRCode">
              <Icon name="qrCode" />
            </md-button>

          </md-layout>
          <md-layout md-flex="66" md-flex-xsmall="80" md-align="center">
            <p v-if="message">{{message}}</p>
            <p>
              <a href="#"
                 @click.prevent="downloadQRCode"
                 v-if="showQRCode">
                <qr-code :text="passPhrase" ref="qrCode"></qr-code>
              </a>
            </p>
          </md-layout>
          <md-layout md-flex="66" md-flex-xsmall="80" style="margin-top:30px">
              <md-layout md-align="center" md-gutter="16">
                  <p style="font-weight: 300;margin-bottom: 10px;">{{$t('login.create_address_label')}}</p>
              </md-layout>
          </md-layout>
          <md-layout md-flex="66" md-flex-xsmall="80" style="">
              <md-layout md-align="center" md-gutter="16">
                  <a class='create_link' v-on:click="showCreate = true; scrollToBottom()">{{ $t('login.new_button') }}</a>
              </md-layout>
          </md-layout>
    </md-layout>
      <md-layout v-if="showCreate" md-align="center" md-gutter="16">
          <md-layout md-flex="66" md-flex-xsmall="90" class="newpass_field">

              <md-input-container>
                  <label v-html="$t('login.new_password_label')"></label>
                  <md-textarea v-bind:value="yourPassPhrase" readonly></md-textarea>
                  <md-icon v-clipboard="yourPassPhrase"  @success="copySuccess" style="cursor:pointer;z-index:20;" :title="$t('login.copy_button_tooltip')">content_copy</md-icon>
                  <md-icon v-if=!iOS v-on:click.native="saveFile" style="cursor:pointer;z-index:20;" :title="$t('login.save_button_tooltip')">archive</md-icon>

              </md-input-container>

          </md-layout>
      </md-layout>

      <md-snackbar md-position="bottom center" md-accent ref="snackbar" md-duration="2000">
          <span>{{ $t('login.invalid_passphrase') }}</span>
      </md-snackbar>
      <md-snackbar md-position="bottom center" md-accent ref="loginSnackbar" md-duration="2000">
          <span>{{ $t('home.copied') }}</span>
      </md-snackbar>
    <QRScan v-if="showModal" :modal="showModal" @hide-modal="showModal = false" @code-grabbed="savePassPhrase"/>
    <Spinner v-if="showSpinnerFlag"></Spinner>
  </div>
</template>

<script>
import b64toBlob from 'b64-to-blob'
import FileSaver from 'file-saver'
import Icon from '@/components/Icon'
import QRScan from '@/components/QRScan'
import Spinner from '../components/Spinner'

export default {
  name: 'login',
  components: {
    Icon,
    QRScan,
    Spinner
  },
  methods: {
    showSpinner: function () {
      this.showSpinnerFlag = true
    },
    scrollToBottom: function () {
      this.$root.$nextTick(function () {
        window.scrollTo(0, document.body.scrollHeight)
      })
    },
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
    downloadQRCode () {
      const imgUrl = this.$refs.qrCode.$el.querySelector('img').src
      const base64Data = imgUrl.slice(22, imgUrl.length)
      const byteCharacters = b64toBlob(base64Data)
      const blob = new Blob([byteCharacters], {type: 'image/png'})

      FileSaver.saveAs(blob, 'adamant-im.png')
    },
    saveQRCode () {
      if (!this.passPhrase.length) {
        this.message = 'Please enter passphrase first'
        return
      }

      this.message = ''
      this.showQRCode = true
    },
    scanQRCode () {
      this.showModal = true
    },
    savePassPhrase (payload) {
      this.passPhrase = payload
      this.logme()
    },
    logme () {
      this.passPhrase = this.passPhrase.toLowerCase().trim()
      this.showSpinnerFlag = true
      var errorFunction = function () {
        this.snackOpen()
        this.showSpinnerFlag = false
      }.bind(this)
      if (this.passPhrase.split(' ').length !== 12) {
        errorFunction()
        return
      }
      this.getAccountByPassPhrase(this.passPhrase, function (context) {
        this.$store.dispatch('afterLogin', this.passPhrase)
        this.$root._router.push('/chats/')
        this.loadChats(true)
        this.$store.commit('mock_messages')
        this.$store.commit('stop_tracking_new')
        this.showSpinner = false
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
    if (this.$store.getters.getPassPhrase) {
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
    },
    qrCodePassPhrase: function () {
      // return this.passPhrase
      return this.$store.getters.getPassPhrase
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
      passPhrase: this.qrCodePassPhrase || '',
      language: this.$i18n.locale,
      showCreate: false,
      message: '',
      showQRCode: false,
      showModal: false,
      showSpinnerFlag: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

.qr-code-buttons button {
  min-width: auto;
  padding: 0;
}

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
    background-color: #FFFFFF;
}
.md-layout .md-button.md-raised.md-shit, .md-shit {
    background: repeating-linear-gradient( 140deg, lightgray, lightgray 1px, #FEFEFE 1px, #FEFEFE 15px );
    color: #4A4A4A;
}
.md-button:hover:not([disabled]).md-raised {
  background-color: #dfdfdf !important;
}
.md-layout .md-button.md-raised.md-shit:hover,.md-shit:hover {
    background-color: #dfdfdf !important;
}
p.site-description {
    font-family: 'Exo 2'!important;
    font-style: normal!important;
    font-weight: 100!important;
    margin: 10px 0;
    margin-top: 0px;
    padding: 0px 20px;
    font-size: 18px;
}

p.site-description {
    line-height: 20px;
}

p.site-description {
    color: #4a4a4a;
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
    line-height: 18px;

}
.newpass_field {
    padding-top: 20px!important;
}
.newpass_field textarea {
    padding-top: 20px !important;
}

.custom-logo-link img {
    width: 301px;
    height: 301px;
}

.site-branding {
    padding: 66px 0 10px;
}
.newpass_field textarea{
    height: 90px!important;
    padding-top: 30px!important;
}
.newpass_field .md-icon{
    padding-top: 40px;
}
@media (max-width: 1100px) {
    .container {
        width: 95%;
        margin: 0 auto;
    }
}
@media (max-width: 991px) {
    .site-branding {
        padding: 61px 0 10px;
    }
    .container {
        width: 95%;
        margin: 0 auto;
    }
    .newpass_field textarea{
        height: 90px!important;
        padding-top: 30px!important;
    }
    .newpass_field .md-icon{
        padding-top: 40px;
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
    .newpass_field textarea{
        height: 100px!important;
        padding-top: 40px!important;
    }
    .newpass_field .md-icon{
        padding-top: 50px;
    }
}

@media (max-width: 600px) {
    .newpass_field textarea{
        height: 90px!important;
        padding-top: 30px!important;
    }
    .site-description {
        display:none;
    }
    .newpass_field .md-icon{
        padding-top: 30px;
    }
}
@media (max-width: 480px) {
    .newpass_field .md-icon{
        padding-top: 50px;
    }
    .custom-logo-link img {
        width: 213px;
        height: 213px;
    }

    .newpass_field textarea{
        height: 115px!important;
        padding-top: 50px!important;
    }
    .container {
        width: 95%;
    }
    .site-description {
        display:none;
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

.login .md-input-container.language_select .md-select .md-select-value {
    padding-right: 0px;
}

.md-input-container.language_select {
    position: absolute;
    right: 13px;
    top: 0;
    margin-top: 9px;
    padding-top: 0;
    width: auto;
    font-weight: 300;
    max-width: 120px;
    min-width: 70px;
}
.password_input input {
    text-align: center;
}
.login .md-input-container.language_select .md-select .md-select-value
{
    text-align: right;
}

.language_select .md-select .md-menu {

}
.md-input-container.language_select .md-select .md-select-value
{
    padding-right: 0px;
}
.md-input-container.language_select .md-select {
    min-width: 70px;
    max-width: 120px;
}
a.create_link {
   text-decoration: underline!important;
   color: #4a4a4a!important;
   font-weight: 500;
   cursor:pointer;
    font-size: 16px;
    font-family:  'Exo 2'!important;
    letter-spacing: 0;
    margin-bottom: 40px;
}
</style>
