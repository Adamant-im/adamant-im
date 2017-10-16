<template>
  <div class="chats">
    <md-layout md-align="center" md-gutter="16">
        <div class="md-toolbar-container">

        <h2 class="md-title">{{ $t('chats.title') }} </h2>
        </div>
    </md-layout>
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
            <md-list-item v-for="(chat, address) in chatList" :key="address" v-on:click="$router.push('/chats/' + address + '/')">
                <md-avatar class="md-avatar-icon">
                    <md-icon>library_books</md-icon>
                </md-avatar>

                <div class="md-list-text-container">
                    <span>{{ address }}</span>
                    <p>{{ chat.last_message.message }}</p>
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
    }
  },
  computed: {
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

</style>
