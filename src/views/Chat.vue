<template>
  <v-row justify="center" no-gutters>
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
  </v-row>
</template>

<script>
import Chat from '@/components/Chat/Chat.vue'
import PartnerInfo from '@/components/PartnerInfo.vue'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import partnerName from '@/mixins/partnerName'

export default {
  components: {
    ProgressIndicator,
    Chat,
    PartnerInfo
  },
  mixins: [partnerName],
  props: {
    messageText: {
      default: '',
      type: String
    },
    partnerId: {
      required: true,
      type: String
    }
  },
  data: () => ({
    show: false,
    contactAddress: '',
    contactName: ''
  }),
  computed: {
    address() {
      return this.$store.state.address
    },
    isFulfilled() {
      return this.$store.state.chat.isFulfilled
    }
  },
  methods: {
    /**
     * @param {string} address ADAMANT address
     */
    onClickChatAvatar(address) {
      this.contactAddress = address
      this.contactName = this.getPartnerName(address)
      this.show = true
    }
  }
}
</script>
