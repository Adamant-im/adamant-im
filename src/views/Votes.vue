<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('votes.page_title')"
      flat
      fixed
    />

    <v-container
      fluid
      class="px-0 container--with-app-toolbar"
    >
      <v-row
        justify="center"
        no-gutters
      >
        <container>
          <v-card
            flat
            color="transparent"
          >
            <v-card-title class="py-0 pl-4 pr-4">
              <v-text-field
                v-model="search"
                append-inner-icon="mdi-magnify"
                :label="$t('votes.search')"
                :class="`${className}__search`"
                single-line
                hide-details
                variant="underlined"
                class="a-input"
              />
            </v-card-title>

            <div :class="`${className}__spacer`" />

            <delegates-table
              :page="pagination.page"
              :per-page="pagination.rowsPerPage"
              :search-query="search"
            />

            <v-row
              :class="`${className}__review`"
              align="center"
              justify="space-between"
              no-gutters
            >
              <pagination
                v-if="showPagination"
                v-model="pagination.page"
                :pages="pages"
              />

              <v-btn
                :disabled="reviewButtonDisabled"
                class="a-btn-primary ma-2"
                @click="showConfirmationDialog"
              >
                {{ $t('votes.summary_title') }}
              </v-btn>
            </v-row>
          </v-card>
        </container>
      </v-row>
    </v-container>

    <v-dialog
      v-model="dialog"
      width="500"
    >
      <v-card>
        <v-card-title
          :class="`${className}__dialog-title`"
        >
          {{ $t('votes.summary_title') }}
        </v-card-title>

        <v-divider :class="`${className}__divider`" />

        <v-row
          no-gutters
          class="pa-4"
        >
          <div :class="`${className}__dialog-summary`">
            {{ $t('votes.upvotes') }}: <strong>{{ numOfUpvotes }}</strong>,&nbsp;
            {{ $t('votes.downvotes') }}: <strong>{{ numOfDownvotes }}</strong>,&nbsp;
            {{ $t('votes.total_new_votes') }}: <strong>{{ numOfUpvotes + numOfDownvotes }} / {{ voteRequestLimit }}</strong>,&nbsp;
            {{ $t('votes.total_votes') }}: <strong>{{ totalVotes }} / {{ delegates.length }}</strong>
          </div>
          <!-- eslint-disable vue/no-v-html -- Safe internal content -->
          <div
            :class="`${className}__dialog-info`"
            v-html="$t('votes.summary_info')"
          />
          <!-- eslint-enable vue/no-v-html -->
        </v-row>

        <v-card-actions>
          <v-spacer />

          <v-btn
            variant="text"
            class="a-btn-regular"
            @click="dialog = false"
          >
            {{ $t('transfer.confirm_cancel') }}
          </v-btn>

          <v-btn
            variant="text"
            class="a-btn-regular"
            @click="sendVotes"
          >
            {{ $t('votes.vote_button_text') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import AppToolbarCentered from '@/components/AppToolbarCentered'
import Pagination from '@/components/Pagination'
import { explorerUriToOnion } from '@/lib/uri'
import DelegatesTable from '@/components/DelegatesTable/DelegatesTable'

export default {
  components: {
    DelegatesTable,
    AppToolbarCentered,
    Pagination
  },
  data: () => ({
    voteRequestLimit: 30,
    search: '',
    pagination: {
      rowsPerPage: 50,
      sortBy: 'rank',
      page: 1
    },
    expanded: [],
    waitingForConfirmation: false,
    dialog: false
  }),
  computed: {
    className: () => 'delegates-view',
    delegates () {
      const delegates = this.$store.state.delegates.delegates || {}

      return Object.values(delegates)
    },
    numOfUpvotes () {
      return this.delegates
        .filter(delegate => delegate.upvoted && !delegate.voted)
        .length
    },
    numOfDownvotes () {
      return this.delegates
        .filter(delegate => delegate.downvoted && delegate.voted)
        .length
    },
    totalVotes () {
      return this.delegates.filter(delegate => delegate._voted).length
    },
    pages () {
      if (this.delegates.length <= 0) {
        return 0
      }

      return Math.ceil(this.delegates.length / this.pagination.rowsPerPage)
    },
    showPagination () {
      return this.search.length === 0
    },
    reviewButtonDisabled () {
      return (this.numOfUpvotes + this.numOfDownvotes) === 0
    }
  },
  mounted () {
    this.$store.dispatch('delegates/getDelegates', {
      address: this.$store.state.address
    })
  },
  methods: {
    getExplorerUrl () {
      return explorerUriToOnion('https://explorer.adamant.im/delegate/')
    },
    upVote (id) {
      this.$store.commit('delegates/upVote', id)
    },
    downVote (id) {
      this.$store.commit('delegates/downVote', id)
    },
    sendVotes () {
      if (!this.validateVotes()) {
        return
      }

      const upVotes = this.delegates
        .filter(delegate => delegate.upvoted && !delegate.voted)
        .map(delegate => `+${delegate.publicKey}`)
      const downVotes = this.delegates
        .filter(delegate => delegate.downvoted && delegate.voted)
        .map(delegate => `-${delegate.publicKey}`)
      const allVotes = [...upVotes, ...downVotes]

      if (allVotes.length <= 0) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('votes.select_delegates')
        })

        return
      }

      this.waitingForConfirmation = true
      this.dialog = false

      this.$store.dispatch('delegates/voteForDelegates', {
        votes: [...upVotes, ...downVotes],
        address: this.$store.state.address
      })

      this.$store.dispatch('snackbar/show', {
        message: this.$t('votes.sent')
      })
    },
    validateVotes () {
      if (this.upvotedCount + this.downvotedCount > this.voteRequestLimit) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('votes.vote_request_limit', { limit: this.voteRequestLimit })
        })

        return false
      }

      if (this.$store.state.balance < 50) {
        this.$store.dispatch('snackbar/show', {
          message: this.$t('votes.no_money')
        })

        return false
      }

      return true
    },
    showConfirmationDialog () {
      this.dialog = true
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/styles/themes/adamant/_mixins.scss';
@import '~vuetify/settings';
@import '../assets/styles/settings/_colors.scss';

.delegates-view {
  &__body {
    font-size: 14px;
    font-weight: 300;
    padding: 0 16px !important;
  }
  &__dialog-title {
    @include a-text-header();
  }
  &__dialog-summary {
    @include a-text-regular-enlarged();
  }
  &__dialog-info {
    @include a-text-regular-enlarged();
    margin-top: 16px;
    :deep(a) {
      text-decoration-line: none;&:hover {
        text-decoration-line: underline;
      }
    }
  }
  &__review {
    padding-top: 15px !important;
    padding-bottom: 15px !important;
  }
  &__search {
    :deep(.v-input__slot) {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
  &__spacer {
    height: 20px;
    margin-top: 5px;
  }
}

/** Themes **/
.v-theme--light {
  .delegates-view {
    &__body {
      color: map-get($adm-colors, 'regular');
    }
    &__dialog-title {
      color: map-get($adm-colors, 'regular');
    }
    &__dialog-summary {
      color: map-get($adm-colors, 'regular');
    }
    &__dialog-info {
      color: map-get($adm-colors, 'regular');
    }
    &__divider {
      border-color: map-get($adm-colors, 'secondary');
    }
    :deep(.v-table) tbody tr:not(:last-child) {
      border-bottom: 1px solid, map-get($adm-colors, 'secondary2');
    }
  }
}
.v-theme--dark {
  .delegates-view {
  }
}
</style>
