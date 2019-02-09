<template>
  <v-layout row wrap justify-center>

    <v-flex xs12 sm12 md8 lg5>

      <chat :partner-id="partnerId" @partner-info="partnerInfoValue = true"/>
      <PartnerInfo :address="partnerId" :name="partnerName" v-model="partnerInfoValue" />

    </v-flex>

  </v-layout>
</template>

<script>
import Chat from '@/components/Chat/Chat'
import PartnerInfo from '@/components/PartnerInfo'

export default {
  computed: {
    partnerId () {
      return this.$route.params.partner
    },
    partnerName () {
      return this.$store.getters['contacts/contactName'](this.partnerId)
    }
  },
  components: {
    Chat,
    PartnerInfo
  },
  data: () => ({
    partnerInfoValue: false
  })
}
</script>
