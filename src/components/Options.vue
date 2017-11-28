<template>
  <div class="settings">
      <md-table>
          <md-table-body>
              <md-table-row>
                  <md-table-cell>{{ $t('options.language_label') }}</md-table-cell>
                  <md-table-cell ><md-input-container class="language_select">
                      <md-select name="language" id="language" v-model="language">
                          <md-option  v-for="(language, code) in languageList" :value="code" :key="code">{{ language.title }}</md-option>
                      </md-select>
                  </md-input-container>
                  </md-table-cell>
              </md-table-row>

              <md-table-row>
                  <md-table-cell class="hide_on_mobile"></md-table-cell>
                  <md-table-cell colspan="2"><md-checkbox  v-model="storeInLS" >{{ $t('options.exit_on_close') }}</md-checkbox>
                  </md-table-cell>
              </md-table-row>
          </md-table-body>
      </md-table>

    <div class="version">{{ $t('options.version') }} 1.0.13</div>
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
    'language' (to, from) {
      this.$i18n.locale = to
      this.$store.commit('change_lang', to)
    }
  },
  data () {
    return {
      storeInLS: !this.$store.state.storeInLocalStorage,
      language: this.$i18n.locale
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
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
    height: calc(100vh - 130px);
    width:100%;
  }
    @media (max-width: 480px) {
        .hide_on_mobile {
            display:none;
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
