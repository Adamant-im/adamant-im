<template>
  <v-bottom-navigation
    v-model="currentPageIndex"
    app
    height="50"
    class="app-navigation"
  >
    <v-layout justify-center>
      <container class="app-navigation__container">
        <v-layout justify-center>
          <!-- Wallet -->
          <v-btn
            to="/home"
            text
          >
            <span>{{ $t('bottom.wallet_button') }}</span>
            <v-icon size="20">
              mdi-wallet
            </v-icon>
          </v-btn>

          <!-- Chat -->
          <v-btn
            to="/chats"
            text
          >
            <span>{{ $t('bottom.chats_button') }}</span>
            <v-badge
              overlap
              color="primary"
            >
              <span
                v-if="numOfNewMessages > 0"
                slot="badge"
              >
                {{ numOfNewMessages > 99 ? '99+' : numOfNewMessages }}
              </span>
              <v-icon size="20">
                mdi-forum
              </v-icon>
            </v-badge>
          </v-btn>

          <!-- Settings -->
          <v-btn
            to="/options"
            text
          >
            <span>{{ $t('bottom.settings_button') }}</span>
            <v-icon size="20">
              mdi-cog
            </v-icon>
          </v-btn>
        </v-layout>
      </container>
    </v-layout>
  </v-bottom-navigation>
</template>

<script>
export default {
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
        icon: 'mdi-cog'
      }
    ],
    currentPageIndex: 0
  }),
  computed: {
    numOfNewMessages () {
      return this.$store.getters['chat/totalNumOfNewMessages']
    }
  },
  watch: {
    '$route.path' () {
      this.currentPageIndex = this.getCurrentPageIndex()
    }
  },
  mounted () {
    this.currentPageIndex = this.getCurrentPageIndex()
  },
  methods: {
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

<style lang="scss" scoped>
@import '~vuetify/src/styles/settings/_colors.scss';
@import '../assets/stylus/settings/_colors.scss';

/**
 * 1. Navigation Button.
 *    a. Active
 *    b. Inactive
 */
.app-navigation {
  &.v-bottom-nav {
    box-shadow: none;
  }
  &.v-bottom-nav .v-btn  {
    font-weight: 300;
    padding-bottom: 8px;
  }
  :deep(.v-btn.v-btn--active)  {
    padding-top: 4px;
  }
  :deep(.v-btn:not(.v-btn--active))  {
    filter: unset;
    padding-top: 6px;
    font-size: 12px;
  }
}

.theme--light {
  .app-navigation {
    &__container {
      border-top: 1px solid map-get($grey, 'lighten-2');
    }
    &.v-bottom-nav {
      background-color: map-get($shades, 'white');
    }
    :deep(.v-btn.v-btn--active)  {
      color: map-get($adm-colors, 'regular');
    }
    :deep(.v-btn:not(.v-btn--active))  {
      color: map-get($adm-colors, 'muted') !important;
    }
  }
}

.theme--dark {
  .app-navigation {
    &.v-bottom-nav {
      background-color: map-get($shades, 'black');
    }
  }
}
</style>
