<template>
  <div class="app-toolbar">
    <v-layout justify-center row wrap class="app-toolbar__body">

      <v-flex xs12><v-divider></v-divider></v-flex>

      <v-flex
        v-for="page in pages"
        :key="page.title"
        xs3
      >
        <v-btn
          flat
          :ripple="false"
          :class="{ 'v-btn--active': currentPage === page.link }"
          @click="$router.replace(page.link)"
        >
          <v-icon medium left>{{ page.icon }}</v-icon>
          <span class="hidden-sm-and-down">{{ page.title }}</span>
        </v-btn>
      </v-flex>

      <v-flex xs3>
        <v-btn
          flat
          :ripple="false"
          @click="logout"
        >
          <v-icon medium left>mdi-logout-variant</v-icon>
          <span class="hidden-sm-and-down">Logout</span>
        </v-btn>
      </v-flex>

    </v-layout>
  </div>
</template>

<script>
export default {
  mounted () {
    this.currentPage = this.$route.path
  },
  watch: {
    '$route' (to, from) {
      this.currentPage = to.path
    }
  },
  data: () => ({
    pages: [
      {
        title: 'Wallet',
        link: '/home',
        icon: 'mdi-wallet'
      },
      {
        title: 'Chats',
        link: '/chats',
        icon: 'mdi-forum'
      },
      {
        title: 'Settings',
        link: '/options',
        icon: 'mdi-settings'
      }
    ],
    currentPage: '/home'
  }),
  methods: {
    logout () {
      this.$store.commit('logout')
      this.$store.dispatch('reset')
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.app-toolbar {
  width: 100%;
  height: 55px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  position: fixed;
  bottom: 0;
  left: 0;
  background-color: #FFF
}
.app-toolbar__body {
  max-width: 800px
}

/**
 * Unset button background-color on hover.
 */
.app-toolbar >>> .v-btn--active:before,
.app-toolbar >>> .v-btn:focus:before,
.app-toolbar >>> .v-btn:hover:before {
  background-color: unset;
}

/**
 * Set button color on hover.
 */
.app-toolbar >>> .v-btn {
  color: #757575; /* grey darken-1 */
}
.app-toolbar >>> .v-btn--active,
.app-toolbar >>> .v-btn:focus,
.app-toolbar >>> .v-btn:hover {
  color: #212121; /* grey darken-4 */
}
</style>
