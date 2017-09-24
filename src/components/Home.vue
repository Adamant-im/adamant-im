<template>
  <div class="home">
        <div>Your address is <span v-html="this.$store.state.address"></span></div>
        <div>Your balance is <span v-html="this.$store.state.balance"></span> HZ</div>
  </div>
</template>

<script>
export default {
  name: 'home',
  methods: {
  },
  computed: {
    languageList: function () {
      var messages = require('../i18n').default
      console.log(messages)
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
      passPhrase: '',
      language: 'en',
      showCreate: false
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
