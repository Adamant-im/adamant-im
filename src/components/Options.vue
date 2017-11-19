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
          </md-table-body>
      </md-table>

    <div class="version">{{ $t('options.version') }} 1.0.7</div>
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
    'language' (to, from) {
      this.$i18n.locale = to
    }
  },
  data () {
    return {
      language: 'en'
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
    .version {
        position:absolute;
        bottom:0;
        right:0;
    }
  .settings {
    position:relative;
    height: calc(100vh - 130px);
    width:100%;
  }
</style>
