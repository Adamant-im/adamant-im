<template>
  <v-bottom-nav
    :active.sync="currentPageIndex"
    :value="showNav"
    app
  >
    <v-btn
      v-for="page in pages"
      :key="page.title"
      :to="page.link"
      color="black"
      flat
    >
      <span>{{ page.title }}</span>
      <v-icon>{{ page.icon }}</v-icon>
    </v-btn>

    <v-btn @click="logout" flat>
      <span>Logout</span>
      <v-icon>mdi-logout-variant</v-icon>
    </v-btn>
  </v-bottom-nav>
</template>

<script>
export default {
  mounted () {
    this.currentPageIndex = this.getCurrentPageIndex()
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
    currentPageIndex: 0,
    activeBtn: 1,
    showNav: true
  }),
  methods: {
    logout () {
      this.$store.commit('logout')
      this.$store.dispatch('reset')
      this.$router.push('/')
    },
    getCurrentPageIndex () {
      const currentPage = this.pages.find(page => page.link === this.$route.path)

      return this.pages.indexOf(currentPage)
    }
  }
}
</script>

<style scoped>
</style>
