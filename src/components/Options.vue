<template>
  <div class="settings">
      <div style="max-width:95%; margin:auto;">
      <md-card class='settings-card' style="box-shadow:none">
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
                          <md-table-cell ><md-input-container class="language_select">
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

      <md-card class='settings-card' style="box-shadow:none">
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
                          <md-table-cell colspan="2"  style="text-align:left;"><md-checkbox  v-model="storeInLS" >{{ $t('options.exit_on_close') }}</md-checkbox></md-table-cell>
                      </md-table-row>
                  </md-table-body>
              </md-table>
          </md-card-content>

      </md-card>
      <md-card class='settings-card' style="box-shadow:none">
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
                          <md-table-cell style="text-align:left;" colspan="2"><md-checkbox  v-model="notifySound" >{{ $t('options.enable_sound') }}</md-checkbox></md-table-cell>
                      </md-table-row>
                      <md-table-row>
                          <md-table-cell class="hide_on_mobile"></md-table-cell>
                          <md-table-cell style="text-align:left;" colspan="2"><md-checkbox  v-model="notifyBar" >{{ $t('options.enable_bar') }}</md-checkbox></md-table-cell>
                      </md-table-row>
                      <md-table-row>
                          <md-table-cell class="hide_on_mobile"></md-table-cell>
                          <md-table-cell style="text-align:left;" colspan="2"><md-checkbox  v-model="notifyDesktop" disabled>{{ $t('options.enable_desktop') }}</md-checkbox></md-table-cell>
                      </md-table-row>
                  </md-table-body>
              </md-table>
          </md-card-content>

      </md-card>


    <div class="version" style=" margin-bottom: -1rem; right:1rem;">{{ $t('options.version') }} 1.0.15</div>
      </div>

  </div>
</template>

<script>
export default {
  name: 'settings',
  methods: {
  },
  computed: {
    languageList: function () {
      var messages = require('../i18n').default
      return messages
    }
  },
  watch: {
    'storeInLS' (to, from) {
      this.$store.commit('change_storage_method', !to)
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
    }
  },
  data () {
    return {
      storeInLS: !this.$store.state.storeInLocalStorage,
      notifySound: this.$store.state.notifySound,
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
