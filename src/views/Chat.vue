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

      <ProgressIndicator :show="!isFulfilled" :hide-spinner="!isMobileView" />
    </container>
  </v-row>
</template>

<script>
import Chat from '@/components/Chat/Chat.vue'
import PartnerInfo from '@/components/PartnerInfo.vue'
import partnerName from '@/mixins/partnerName'
import ProgressIndicator from '@/components/ProgressIndicator.vue'
import { useScreenSize } from '@/hooks/useScreenSize'
import { computed } from 'vue'
import { useStore } from 'vuex'

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
    const store = useStore()

    const { isMobileView } = useScreenSize()

    const isShowPartnerInfoDialog = computed({
      get() {
        return store.state.chat.isShowPartnerInfoDialog
      },
      set(value) {
        store.commit('chat/setIsShowPartnerInfoDialog', value)
      }
    })

    return {
      isMobileView,
      isShowPartnerInfoDialog
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
      this.isShowPartnerInfoDialog = true
    }
  }
}
</script>
