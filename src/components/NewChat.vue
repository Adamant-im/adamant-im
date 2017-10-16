<template>
  <div class="chats">
    <md-layout md-align="center" md-gutter="16">
      <md-layout md-flex="66" sm-flex="90">
          <md-input-container>
              <label>Address</label>
              <md-textarea v-model="targetAddress">U14345892393468009728</md-textarea>
          </md-input-container>
          <md-input-container>
              <label>MESSAGE</label>
              <md-textarea v-model="message"></md-textarea>
          </md-input-container>
          <md-layout md-align="center" md-gutter="16">
          <md-button class="md-raised md-primary" v-on:click="send">SEND</md-button>

          </md-layout>
      </md-layout>
    </md-layout>
  </div>
</template>

<script>
export default {
  name: 'chats',
  methods: {
    send () {
      this.encodeMessageForAddress(this.message, this.targetAddress)
    }
  },
  computed: {
  },
  watch: {
  },
  data () {
    return {
      targetAddress: 'U14345892393468009728',
      message: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
