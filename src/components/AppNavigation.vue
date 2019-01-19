<template>
  <v-bottom-nav
    :active.sync="currentPageIndex"
    :value="showNav"
    app
    class="app-navigation"
  >

    <!-- Wallet -->
    <v-btn to="/home" flat>
      <span>{{ $t('bottom.wallet_button') }}</span>
      <v-icon>mdi-wallet</v-icon>
    </v-btn>

    <!-- Chat -->
    <v-btn to="/chats" flat>
      <span>{{ $t('bottom.chats_button') }}</span>
      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages > 0" slot="badge">{{ numOfNewMessages }}</span>
        <v-icon>mdi-forum</v-icon>
      </v-badge>
    </v-btn>

    <!-- Settings -->
    <v-btn to="/options" flat>
      <span>{{ $t('bottom.settings_button') }}</span>
      <v-icon>mdi-settings</v-icon>
    </v-btn>

    <!-- Logout -->
    <v-btn @click="logout" flat>
      <span>{{ $t('bottom.exit_button') }}</span>
      <v-icon>mdi-logout-variant</v-icon>
    </v-btn>

  </v-bottom-nav>
</template>

<script>
export default {
  mounted () {
    this.currentPageIndex = this.getCurrentPageIndex()
  },
  watch: {
    '$route.path' () {
      this.currentPageIndex = this.getCurrentPageIndex()
    }
  },
  computed: {
    numOfNewMessages () {
      return this.$store.getters['chat/totalNumOfNewMessages']
    }
  },
  data: () => ({
    pages: [
      {
        title: 'wallet',
        link: '/home',
        icon: 'mdi-wallet'
      },
      {
        title: 'chats',
        link: '/chats',
        icon: 'mdi-forum'
      },
      {
        title: 'settings',
        link: '/options',
        icon: 'mdi-settings'
      }
    ],
    currentPageIndex: 0,
    showNav: true
  }),
  methods: {
    logout () {
      this.$store.dispatch('logout')
      this.$store.dispatch('reset')
      this.$router.push('/')
    },
    getCurrentPageIndex () {
      const currentPage = this.pages.find(page => {
        const pattern = new RegExp(`^${page.link}`)

        return this.$route.path.match(pattern)
      })

      return this.pages.indexOf(currentPage)
    }
  }
}
</script>

<style lang="stylus" scoped>
/**
 * Disable grayscale filter.
 */
.app-navigation >>> .v-btn:not(.v-btn--active) {
  filter: unset;
}

/**
 * 1. Add linear-gradient for active navigation element.
 */
.theme--dark
  .app-navigation >>> .v-btn.v-btn--active
    background: repeating-linear-gradient( // [1]
      140deg,
      #191919,
      #191919 1px,
      #212121 0,
      #212121 5px
    ) !important
</style>
