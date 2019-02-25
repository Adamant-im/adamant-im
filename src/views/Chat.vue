<template>
  <v-layout row wrap justify-center>

    <container>

      <chat :partner-id="partnerId" @partner-info="partnerInfoValue = true"/>
      <PartnerInfo :address="partnerId" :name="partnerName" v-if="!isChatReadOnly" v-model="partnerInfoValue" />

    </container>

  </v-layout>
</template>

<script>
import Chat from '@/components/Chat/Chat'
import PartnerInfo from '@/components/PartnerInfo'

export default {
  computed: {
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId)
    },
    isChatReadOnly () {
      return this.$store.getters['chat/isChatReadOnly'](this.partnerId)
    }
  },
  components: {
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
