<template>
  <v-layout row wrap justify-center>

    <v-flex lg5 md5 sm12 xs12>

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
