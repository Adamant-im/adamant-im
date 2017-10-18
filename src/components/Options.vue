<template>
  <div class="settings">

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

</style>
