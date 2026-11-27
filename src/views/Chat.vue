<template>
  <v-row justify="center" gap="0" class="chat-view">
    <container>
      <chat
        :key="partnerId"
        :message-text="messageText"
        :partner-id="partnerId"
        @click:chat-avatar="onClickChatAvatar"
      />

      <ProgressIndicator v-if="!isFulfilled" :show-spinner="isMobileView" />
    </container>
  </v-row>
</template>

<script>
import Chat from '@/components/Chat/Chat.vue'
import partnerName from '@/mixins/partnerName'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { useScreenSize } from '@/hooks/useScreenSize'
import { useModalsStore } from '@/stores/modals'

export default {
  components: {
    ProgressIndicator,
    Chat
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
  setup() {
    const { isMobileView } = useScreenSize()

    const modalsStore = useModalsStore()

    return {
      isMobileView,
      modalsStore
    }
  },
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
      this.modalsStore.open({
        component: 'PartnerInfo',
        props: {
          address,
          name: this.getPartnerName(address),
          ownerAddress: this.address
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.chat-view {
  width: 100%;
  margin: 0;
}
</style>
