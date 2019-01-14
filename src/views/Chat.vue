<template>
  <v-layout row wrap justify-center>

    <v-flex xs12 sm12 md8 lg5>

      <chat :partner-id="partnerId"/>

    </v-flex>

  </v-layout>
</template>

<script>
import Chat from '@/components/Chat/Chat'

export default {
  computed: {
    partnerId () {
      return this.$route.params.partner
    }
  },
  components: {
    Chat
  }
}
</script>
