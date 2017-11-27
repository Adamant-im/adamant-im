<template>
  <div class="chats">

        <md-layout md-align="center" md-gutter="16">

        <md-list class="md-double-line">
            <md-list-item v-on:click="$router.push('/chats/new')">
                <md-avatar class="md-avatar-icon">
                    <md-icon>add</md-icon>
                </md-avatar>

                <div class="md-list-text-container">
                    <span>{{ $t('chats.new_chat') }} </span>
                    <p></p>
                </div>


            </md-list-item>
            <md-list-item v-if="firstLoading">
                <md-spinner :md-size="150" :md-stroke="1" md-indeterminate class="md-accent"></md-spinner>
            </md-list-item>
            <md-list-item v-for="(chat, address) in chatList" :key="address" v-on:click="$router.push('/chats/' + address + '/')">
                <md-avatar class="md-avatar-icon">
                    <md-icon>library_books</md-icon>
                </md-avatar>

                <div class="md-list-text-container">
                    <span>{{ chatName(address) }}</span>
                    <p v-html="chat.last_message.message"></p>
                </div>


            </md-list-item>
        </md-list>
    </md-layout>
  </div>
</template>

<script>
export default {
  name: 'chats',
  methods: {
    load () {
      this.loadChats()
    },
    send () {
      this.encodeMessageForAddress(this.message, this.targetAddress)
    },
    chatName (address) {
      if (this.$store.state.partners[address]) {
        return this.$store.state.partners[address]
      }
      return address
    }
  },
  computed: {
    firstLoading: function () {
      return this.$store.state.firstChatLoad
    },
    chatList: function () {
      return this.$store.state.chats
    }
  },
  watch: {
  },
  data () {
    return {
      targetAddress: '',
      message: ''
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
    .md-spinner.md-accent .md-spinner-path
    {
        stroke: #4A4A4A;
    }
    .md-list-text-container p {
        max-height:45px;
    }
    .md-list-text-container p p
    {
        padding: 0;
        margin: 0;
    }
</style>
