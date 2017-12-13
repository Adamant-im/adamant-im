<template>
  <div class="chats" style="position:relative">
      <md-layout class='chat_loads' v-if="firstLoading">
          <md-spinner :md-size="150" :md-stroke="1" md-indeterminate class="md-accent" style="margin: 0 auto"></md-spinner>
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

            <md-list-item v-for="(chat, address) in chatList" :key="chat.partner" v-on:click="$router.push('/chats/' + chat.partner + '/')">
                <md-avatar class="md-avatar-icon" style="overflow: visible;">
                    <md-icon>library_books</md-icon>
                    <div class="new-icon" v-if="newMessages(chat.partner)">{{ newMessages(chat.partner) }}</div>
                </md-avatar>

                <div class="md-list-text-container">
                    <span>{{ chatName(chat.partner) }}</span>
                    <p v-html="chat.last_message.message"></p>
                    <span class="dt">{{ dateFormat(chat.last_message.timestamp) }}</span>
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
      this.loadChats(true)
    },
    send () {
      this.encodeMessageForAddress(this.message, this.targetAddress)
    },
    newMessages (address) {
      if (this.$store.state.newChats[address]) {
        return this.$store.state.newChats[address]
      }
      return 0
    },
    chatName (address) {
      if (this.$store.state.partners[address]) {
        return this.$store.state.partners[address]
      }
      return address
    },
    getTime: function (date) {
      var hours = date.getHours()
      var time = ''
      if (hours < 10) {
        time = '0' + hours
      } else {
        time = '' + hours
      }
      time = time + ':'
      var minutes = date.getMinutes()
      if (minutes < 10) {
        time = time + '0' + minutes
      } else {
        time = time + '' + minutes
      }
      return time
    },
    dateFormat: function (timestamp) {
      if (!parseInt(timestamp)) {
        return ''
      }
      var date = new Date(parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0))
      var options = {'weekday': 'short'}
      if ((Date.now() - (parseInt(timestamp) * 1000 + Date.UTC(2017, 8, 2, 17, 0, 0, 0))) > (4 * 3600 * 24 * 1000)) {
        options = {'day': 'numeric', 'month': 'short'}
      }
      return date.toLocaleDateString(this.$t('region'), options) + ', ' + this.getTime(date)
    }
  },
  computed: {
    firstLoading: function () {
      return this.$store.state.firstChatLoad
    },
    chatList: function () {
      function compare (a, b) {
        if (a.last_message.timestamp < b.last_message.timestamp) {
          return 1
        }
        if (a.last_message.timestamp > b.last_message.timestamp) {
          return -1
        }
        return 0
      }
      if (this.$store.state.chats) {
        return Object.values(this.$store.state.chats).sort(compare)
      }
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
    .chat_loads {
        position: absolute;
        background: rgba(0,0,0,0.3);
        height: 100%;
        width: 100%;
        top: 0;
        left: 0;
        height: 100vh;
        padding-top: 15%;
        z-index: 10;
    }
    .md-list-text-container .dt {
        position: absolute;
        top: 3px;
        right: 5px;
        font-size: 8px!important;
        font-style: italic;
        line-height:10px;
    }
    .md-avatar .new-icon {
        position: absolute;
        right: -5px;
        bottom: -5px;
        color: #4A4A4A;
        width: 20px;
        height: 20px;
        background: #BAD3FF;
        border-radius: 10px;
        line-height: 20px;
        text-align: center;
        z-index: 100;
    }
    .md-avatar {
        overflow: visible;
    }
    .md-spinner.md-accent .md-spinner-path
    {
        stroke: #4A4A4A;
    }
    .md-list-text-container p {
        max-height:25px;
    }
    .md-list-text-container p p
    {
        padding: 0;
        margin: 0;
    }
</style>
