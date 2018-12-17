<template>
  <v-bottom-nav
    :active.sync="currentPageIndex"
    :value="showNav"
    app
    class="app-navigation"
  >

    <!-- Wallet -->
    <v-btn to="/home" color="black" flat>
      <span>{{ $t('wallet') }}</span>
      <v-icon>mdi-wallet</v-icon>
    </v-btn>

    <!-- Chat -->
    <v-btn to="/chats" color="black" flat>
      <span>{{ $t('chats') }}</span>
      <v-badge overlap color="primary">
        <span v-if="numOfNewMessages > 0" slot="badge">{{ numOfNewMessages }}</span>
        <v-icon>mdi-forum</v-icon>
      </v-badge>
    </v-btn>

    <!-- Settings -->
    <v-btn to="/options" color="black" flat>
      <span>{{ $t('settings') }}</span>
      <v-icon>mdi-settings</v-icon>
    </v-btn>

    <!-- Logout -->
    <v-btn @click="logout" flat>
      <span>{{ $t('logout') }}</span>
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

<style scoped>
/**
 * Disable grayscale filter.
 */
.app-navigation >>> .v-btn:not(.v-btn--active) {
  filter: unset;
}
</style>

<i18n>
{
  "en": {
    "wallet": "Wallet",
    "chats": "Chat",
    "settings": "Settings",
    "logout": "Logout"
  },
  "ru": {
    "wallet": "Кошелек",
    "chats": "Чаты",
    "settings": "Настройки",
    "logout": "Выйти"
  }
}
</i18n>
