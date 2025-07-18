<template>
  <v-row justify="center" no-gutters>
    <container>
      <chat
        :key="partnerId"
        :message-text="messageText"
        :partner-id="partnerId"
        @click:chat-avatar="onClickChatAvatar"
      />

      <PartnerInfo
        v-if="contactAddress"
        v-model="isShowPartnerInfoDialog"
        :address="contactAddress"
        :name="contactName"
        :owner-address="address"
      />

      <ProgressIndicator v-if="!isFulfilled" :show-spinner="isMobileView" />
    </container>
  </v-row>
</template>

<script>
import { computed } from 'vue'

import Chat from '@/components/Chat/Chat.vue'
import PartnerInfo from '@/components/PartnerInfo.vue'
import partnerName from '@/mixins/partnerName'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { useScreenSize } from '@/hooks/useScreenSize'
import { useChatStateStore } from '@/stores/modal-state'

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
  setup() {
    const { isMobileView } = useScreenSize()

    const chatStateStore = useChatStateStore()

    const { setShowPartnerInfoDialog } = chatStateStore

    const isShowPartnerInfoDialog = computed({
      get() {
        return chatStateStore.isShowPartnerInfoDialog
      },
      set(value) {
        setShowPartnerInfoDialog(value)
      }
    })

    return {
      isMobileView,
      isShowPartnerInfoDialog,
      setShowPartnerInfoDialog
    }
  },
  data: () => ({
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
      this.setShowPartnerInfoDialog(true)
    }
  }
}
</script>
