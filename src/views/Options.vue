<template>
  <v-layout row wrap justify-center>
    <v-flex xs12 md4>

      <!-- General -->
      <h3 class="title grey--text text--darken-3 mb-3">General</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs6>
          <v-subheader class="pa-0">Language</v-subheader>
        </v-flex>
        <v-flex xs6 class="text-xs-right">
          <language-switcher/>
        </v-flex>
      </v-layout>

      <!-- Security -->
      <h3 class="title grey--text text--darken-3 mb-3">Security</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            label="Logout on tab close"
            color="grey darken-1"
            v-model="logoutOnTabClose"
          ></v-checkbox>
        </v-flex>
      </v-layout>

      <!-- Chats -->
      <h3 class="title grey--text text--darken-3 mb-3">Chats</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            label="Send message on Enter"
            color="grey darken-1"
            v-model="sendMessageOnEnter"
          ></v-checkbox>
        </v-flex>
      </v-layout>

      <!-- Notifications -->
      <h3 class="title grey--text text--darken-3 mb-3">Notifications</h3>
      <v-layout row wrap align-center class="mb-5">
        <v-flex xs12>
          <v-checkbox
            label="Sound"
            color="grey darken-1"
            v-model="notifySound"
          ></v-checkbox>
        </v-flex>
        <v-flex xs12>
          <v-checkbox
            label="Change browser tab title"
            color="grey darken-1"
            v-model="changeBrowserTabTitle"
          ></v-checkbox>
        </v-flex>
      </v-layout>

      <!-- Other -->
      <h3 class="title grey--text text--darken-3 mb-3">Other</h3>
      <v-layout row wrap align-center>
        <v-flex xs12>
          <v-btn @click="$router.push('/options/nodes')">Node list</v-btn>
          <v-btn @click="$router.push('/votes')">Vote for delegates</v-btn>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default {
  computed: {
    logoutOnTabClose: {
      get () {
        return !this.$store.state.storeInLocalStorage
      },
      set (value) {
        this.$store.commit('change_storage_method', !value)
      }
    },
    sendMessageOnEnter: {
      get () {
        return this.$store.state.sendOnEnter
      },
      set (value) {
        this.$store.commit('change_send_on_enter', value)
      }
    },
    notifySound: {
      get () {
        return this.$store.state.notifySound
      },
      set (value) {
        this.$store.commit('change_notify_sound', value)
      }
    },
    changeBrowserTabTitle: {
      get () {
        return this.$store.state.notifyBar
      },
      set (value) {
        this.$store.commit('change_notify_bar', value)
      }
    }
  },
  data: () => ({
  }),
  components: {
    LanguageSwitcher
  }
}
</script>
