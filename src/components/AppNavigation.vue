<template>
  <v-bottom-nav
    :active.sync="currentPageIndex"
    :value="showNav"
    app
    class="app-navigation"
  >
    <v-layout justify-center>
      <v-flex xs12 sm12 md8 lg5 class="app-navigation__container">

        <v-layout justify-center>
          <!-- Wallet -->
          <v-btn to="/home" flat>
            <span>{{ $t('bottom.wallet_button') }}</span>
            <v-icon>mdi-wallet</v-icon>
          </v-btn>

          <!-- Chat -->
          <v-btn to="/chats" flat>
            <span>{{ $t('bottom.chats_button') }}</span>
            <v-badge overlap color="primary">
              <span v-if="numOfNewMessages > 0" slot="badge">
                {{ numOfNewMessages > 99 ? '99+' : numOfNewMessages }}
              </span>
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
        </v-layout>

      </v-flex>
    </v-layout>
  </v-bottom-nav>
</template>

<script>
import { clearDb } from '@/lib/idb'
import AppInterval from '@/lib/AppInterval'

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
    },
    isLoginViaPassword () {
      return this.$store.getters['options/isLoginViaPassword']
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
      AppInterval.unsubscribe()
      this.$store.dispatch('logout')

      if (this.isLoginViaPassword) {
        return clearDb().finally(() => {
          // turn off `loginViaPassword` option
          this.$store.commit('options/updateOption', { key: 'logoutOnTabClose', value: true })

          this.$router.push('/')
        })
      } else {
        return Promise.resolve(this.$router.push('/'))
      }
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
</style>
