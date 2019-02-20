<template>
  <v-layout row wrap justify-center>

    <container>

      <chat :partner-id="partnerId" @partner-info="partnerInfoValue = true"/>
      <PartnerInfo :address="partnerId" :name="partnerName" v-model="partnerInfoValue" />

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
