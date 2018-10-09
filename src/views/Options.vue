<template>
  <div class="settings">
      <div style="max-width:95%; margin:auto;">
      <md-card class="settings-card md-transparent" style="box-shadow:none">
          <md-card-area md-inset>
              <md-card-header>
                  <h2 class="md-title" style="text-align:left; font-size:20px">{{ $t('options.general_title') }}</h2>
              </md-card-header>
          </md-card-area>
          <md-card-content>
              <md-table>
                  <md-table-body>
                      <md-table-row>
                          <md-table-cell style="text-align: left;">{{ $t('options.language_label') }}</md-table-cell>
                          <md-table-cell ><md-input-container class="language_selector">
                              <md-select name="language" id="language" v-model="language">
                                  <md-option  v-for="(language, code) in languageList" :value="code" :key="code">{{ language.title }}</md-option>
                              </md-select>
                          </md-input-container>
                          </md-table-cell>
                      </md-table-row>
                  </md-table-body>
              </md-table>
          </md-card-content>
      </md-card>

      <md-card class='settings-card md-transparent' style="box-shadow:none">
          <md-card-area md-inset>
              <md-card-header>
                  <h2 class="md-title" style="text-align:left; font-size:20px">{{ $t('options.security_title') }}</h2>
              </md-card-header>
          </md-card-area>

          <md-card-content>
              <md-table>
                  <md-table-body>
                      <md-table-row>
                          <md-table-cell class="hide_on_mobile"></md-table-cell>
                          <md-table-cell colspan="2"  style="text-align:left;">
                            <md-checkbox v-on:change="storeInLocalStorage" v-model="clearOnExit">
                              {{ $t('options.exit_on_close') }}
                            </md-checkbox>
                          </md-table-cell>
                      </md-table-row>
                  </md-table-body>
              </md-table>
          </md-card-content>

      </md-card>
          <md-card class='settings-card md-transparent' style="box-shadow:none">
              <md-card-area md-inset>
                  <md-card-header>
                      <h2 class="md-title" style="text-align:left; font-size:20px">{{ $t('options.chats_title') }}</h2>
                  </md-card-header>
              </md-card-area>

              <md-card-content>
                  <md-table>
                      <md-table-body>
                          <md-table-row>
                              <md-table-cell class="hide_on_mobile"></md-table-cell>
                              <md-table-cell colspan="2"  style="text-align:left;"><md-checkbox  v-model="sendOnEnter" :title="$t('options.send_on_enter_tooltip')">{{ $t('options.send_on_enter') }}</md-checkbox></md-table-cell>
                          </md-table-row>
                      </md-table-body>
                  </md-table>
              </md-card-content>

          </md-card>

      <md-card class='settings-card md-transparent' style="box-shadow:none">
          <md-card-area md-inset>
              <md-card-header>
                  <h2 class="md-title" style="text-align:left; font-size:20px">{{ $t('options.notification_title') }}</h2>
              </md-card-header>
          </md-card-area>

          <md-card-content>
              <md-table>
                  <md-table-body>
                      <md-table-row>
                          <md-table-cell class="hide_on_mobile"></md-table-cell>
                          <md-table-cell style="text-align:left;" colspan="2"><md-checkbox  v-model="notifySound" :title="$t('options.enable_sound_tooltip')">{{ $t('options.enable_sound') }}</md-checkbox></md-table-cell>
                      </md-table-row>
                      <md-table-row>
                          <md-table-cell class="hide_on_mobile"></md-table-cell>
                          <md-table-cell style="text-align:left;" colspan="2"><md-checkbox  v-model="notifyBar" :title="$t('options.enable_bar_tooltip')">{{ $t('options.enable_bar') }}</md-checkbox></md-table-cell>
                      </md-table-row>
                      <md-table-row style="display:none">
                          <md-table-cell class="hide_on_mobile"></md-table-cell>
                          <md-table-cell style="text-align:left;" colspan="2"><md-checkbox  v-model="notifyDesktop" disabled :title="$t('options.enable_desktop_tooltip')">{{ $t('options.enable_desktop') }}</md-checkbox></md-table-cell>
                      </md-table-row>
                  </md-table-body>
              </md-table>
          </md-card-content>

      </md-card>

      <md-card class='settings-card md-transparent' style="box-shadow:none">
        <md-card-area md-inset>
          <md-card-header>
            <h2 class="md-title" style="text-align:left; font-size:20px">{{ $t('options.delegates_title') }}</h2>
          </md-card-header>
          </md-card-area>
          <md-card-content>
            <div class="md-table md-theme-grey">
              <md-button class="votes-button" @click="$router.push('/votes/')">{{ $t('options.vote_for_delegates_button') }}</md-button>
            </div>
          </md-card-content>
      </md-card>
      <setUserPassword openFrom="#setUserPassword" closeTo="#setUserPassword" ref="set_user_password" v-on:close="onPwdDialogClose"></setUserPassword>
      <div class="version" style=" margin-bottom: -1rem; right:1rem;">{{ $t('options.version') }} {{ this.$root.$options.version }}</div>
    </div>
  </div>
</template>

<script>
import i18n from '../i18n'
import setUserPassword from '@/components/userpassword/SetUserPassword.vue'
import {
  clearDb,
  getAdmDataBase
} from '../lib/indexedDb'

export default {
  name: 'settings',
  components: {setUserPassword},
  methods: {
    storeInLocalStorage (e) {
      if (!this.$store.state.storeInLocalStorage) {
        this.$refs['set_user_password'].open()
      } else {
        getAdmDataBase().then((db) => {
          clearDb(db)
        })
        this.$store.commit('change_storage_method', false)
        this.$store.dispatch('clearUserPassword')
      }
    },
    onPwdDialogClose (payload) {
      this.clearOnExit = !payload
    }
  },
  computed: {
    languageList: function () {
      return i18n.messages
    }
  },
  mounted () {
    this.$store.commit('last_visited_chat', null)
  },
  watch: {
    'sendOnEnter' (to, from) {
      this.$store.commit('change_send_on_enter', to)
    },
    'notifySound' (to, from) {
      this.$store.commit('change_notify_sound', to)
    },
    'notifyBar' (to, from) {
      this.$store.commit('change_notify_bar', to)
    },
    'notifyDesktop' (to, from) {
      this.$store.commit('change_notify_desktop', to)
    },
    'language' (to, from) {
      this.$i18n.locale = to
      this.$store.commit('change_lang', to)
      document.title = this.$i18n.t('app_title')
    }
  },
  data () {
    return {
      clearOnExit: !this.$store.state.storeInLocalStorage,
      notifySound: this.$store.state.notifySound,
      sendOnEnter: this.$store.state.sendOnEnter,
      notifyBar: this.$store.state.notifyBar,
      notifyDesktop: this.$store.state.notifyDesktop,
      language: this.$i18n.locale
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
    .settings-card .md-table .md-table-cell .md-table-cell-container {
        padding: 0;
    }
    .md-theme-grey.md-card.settings-card.md-transparent {
      background-color: transparent;
    }
    .md-card>.md-card-area:after {
        background-color: rgba(0, 0, 0, .12);
    }
    .settings .md-table .md-table-cell {
        font-size: 16px;
    }
    .settings .md-table .md-select-value, .settings .md-table .md-option {
        font-size: 16px;
    }
  .settings .md-checkbox .md-checkbox-container:after {
      border: 2px solid gray;
      border-top: 0;
      border-left: 0;
  }
  .settings {
    position:relative;
    width:100%;
  }
  .settings .md-card .md-card-header:last-child {
      margin-bottom: 0;
  }
  .votes-button {
      width: 100% !important;
      font-size: 16px !important;
      font-weight: 400 !important;
      height: 48px !important;
      text-transform: none !important;
      padding: 0 !important;
      margin: 0 !important;
      text-align: left !important;
      line-height: 48px !important;
      color: rgba(0,0,0,.87) !important;
  }
  @media (max-width: 480px) {
      .hide_on_mobile {
          display:none;
      }
      #notification {
          max-width:150px;
      }
      .settings {
          padding-left: 1rem;
          padding-right: 1rem;
      }
      .settings .version {
          right: 1rem;
      }
  }
</style>
