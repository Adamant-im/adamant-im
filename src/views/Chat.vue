<template>
  <v-layout row wrap justify-center>

    <container>

      <chat :partner-id="partnerId" @partner-info="partnerInfoValue = true"/>
      <PartnerInfo :address="partnerId" :name="partnerName" v-if="!isChatReadOnly" v-model="partnerInfoValue" />
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
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId)
    },
    isChatReadOnly () {
      return this.$store.getters['chat/isChatReadOnly'](this.partnerId)
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
    partnerInfoValue: false
  }),
  props: {
    partnerId: {
      required: true,
      type: String
    }
  }
}
</script>
