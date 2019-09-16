<template>
  <v-layout row wrap justify-center>

    <container>

      <chat
        :message-text="messageText"
        :partner-id="partnerId"
        @click:chat-avatar="onClickChatAvatar"
      />

      <PartnerInfo
        v-if="contactAddress"
        v-model="show"
        :address="contactAddress"
        :name="contactName"
        :owner-address="address"
      />

      <ProgressIndicator :show="!isFulfilled" />

    </container>

  </v-layout>
</template>

<script>
import Chat from '@/components/Chat/Chat'
import PartnerInfo from '@/components/PartnerInfo'
import ProgressIndicator from '@/components/ProgressIndicator'

export default {
  computed: {
    address () {
      return this.$store.state.address
    },
    isFulfilled () {
      return this.$store.state.chat.isFulfilled
    }
  },
  components: {
    ProgressIndicator,
    Chat,
    PartnerInfo
  },
  data: () => ({
    show: false,
    contactAddress: '',
    contactName: ''
  }),
  methods: {
    /**
     * @param {string} address ADAMANT address
     */
    onClickChatAvatar (address) {
      this.contactAddress = address
      this.contactName = this.$store.getters['partners/displayName'](address) || ''

      this.show = true
    }
  },
  props: {
    messageText: {
      default: '',
      type: String
    },
    partnerId: {
      required: true,
      type: String
    }
  }
}
</script>
