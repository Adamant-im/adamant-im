<template>
  <div :class="className">
    <SettingsTableShell :class="`${className}__layout`">
      <template #before>
        <v-text-field
          v-model="search"
          :append-inner-icon="mdiMagnify"
          :label="t('votes.search')"
          :class="`${className}__search`"
          single-line
          hide-details
          variant="underlined"
          class="a-input"
          color="primary"
        />
        <div :class="`${className}__info`" v-html="t('votes.stake_info')" />
      </template>

      <delegates-table
        :page="pagination.page"
        :per-page="pagination.rowsPerPage"
        :search-query="search"
        :waiting-for-confirmation="waitingForConfirmation"
      />

      <template #after>
        <v-row align="center" :class="`${className}__review`">
          <pagination-component
            v-if="showPagination"
            v-model="pagination.page"
            :pages="pages"
            :class="`${className}__pagination`"
          />
          <v-spacer />

          <v-btn
            :disabled="reviewButtonDisabled"
            class="a-btn-primary"
            :class="`${className}__review-button`"
            @click="showConfirmationDialog"
          >
            {{ t('votes.summary_title') }}
          </v-btn>
        </v-row>
      </template>
    </SettingsTableShell>

    <v-dialog v-model="dialog" width="var(--a-secondary-dialog-width)" :class="summaryDialogClass">
      <v-card>
        <v-card-title :class="`${summaryDialogClass}__dialog-title`">
          {{ t('votes.summary_title') }}
        </v-card-title>

        <v-divider :class="`${summaryDialogClass}__divider`" />

        <v-card-text :class="`${summaryDialogClass}__dialog-body`">
          <div :class="`${summaryDialogClass}__dialog-summary`">
            {{ t('votes.upvotes') }}: <strong>{{ numOfUpvotes }}</strong
            >,&nbsp; {{ t('votes.downvotes') }}: <strong>{{ numOfDownvotes }}</strong
            >,&nbsp; {{ t('votes.total_new_votes') }}:
            <strong>{{ numOfUpvotes + numOfDownvotes }} / {{ VOTE_REQUEST_LIMIT }}</strong
            >,&nbsp; {{ t('votes.total_votes') }}:
            <strong>{{ totalVotes }} / {{ delegates.length }}</strong>
          </div>
          <!-- eslint-disable vue/no-v-html -- Safe internal content -->
          <div :class="`${summaryDialogClass}__dialog-info`" v-html="t('votes.summary_info')" />
          <!-- eslint-enable vue/no-v-html -->
        </v-card-text>

        <v-card-actions :class="`${summaryDialogClass}__dialog-actions`">
          <v-spacer />

          <v-btn variant="text" class="a-btn-regular" @click="dialog = false">
            {{ t('transfer.confirm_cancel') }}
          </v-btn>

          <v-btn variant="text" class="a-btn-regular" @click="sendVotes">
            {{ t('votes.vote_button_text') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import PaginationComponent from '@/components/Pagination.vue'
import DelegatesTable from '@/components/DelegatesTable/DelegatesTable.vue'
import { computed, onMounted, ref, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { mdiMagnify } from '@mdi/js'
import { DelegateDto } from '@/lib/schema/client'
import SettingsTableShell from '@/components/common/SettingsTableShell.vue'

const VOTE_REQUEST_LIMIT = 30
const summaryDialogClass = 'delegates-summary-dialog'

const store = useStore()
const { t } = useI18n()
const search = ref('')
const pagination = reactive({
  rowsPerPage: 50,
  sortBy: 'rank',
  page: 1
})
const waitingForConfirmation = ref(false)
const dialog = ref(false)
const className = 'delegates-view'

interface ExtendedDto extends DelegateDto {
  upvoted?: unknown
  voted?: unknown
  downvoted?: unknown
  _voted?: unknown
}

const delegates = computed(() => {
  const delegates = store.state.delegates.delegates || {}

  return Object.values(delegates) as ExtendedDto[]
})
const numOfUpvotes = computed(() => {
  return delegates.value.filter((delegate) => delegate.upvoted && !delegate.voted).length
})
const numOfDownvotes = computed(() => {
  return delegates.value.filter((delegate) => delegate.downvoted && delegate.voted).length
})
const totalVotes = computed(() => {
  return delegates.value.filter((delegate) => delegate._voted).length
})
const pages = computed(() => {
  if (delegates.value.length <= 0) {
    return 0
  }

  return Math.ceil(delegates.value.length / pagination.rowsPerPage)
})
watch(search, (newValue) => {
  if (newValue.length > 0) {
    pagination.page = 1
  }
})

const showPagination = computed(() => search.value.length === 0)
const reviewButtonDisabled = computed(() => {
  return numOfUpvotes.value + numOfDownvotes.value === 0
})

onMounted(() => {
  store.dispatch('delegates/getDelegates', {
    address: store.state.address
  })
})

const validateVotes = () => {
  if (numOfUpvotes.value + numOfDownvotes.value > VOTE_REQUEST_LIMIT) {
    store.dispatch('snackbar/show', {
      message: t('votes.vote_request_limit', { limit: VOTE_REQUEST_LIMIT })
    })

    return false
  }
  if (store.state.balance < 50) {
    store.dispatch('snackbar/show', {
      message: t('votes.no_money')
    })

    return false
  }

  return true
}
const sendVotes = () => {
  if (!validateVotes()) {
    return
  }

  const upVotes = delegates.value
    .filter((delegate) => delegate.upvoted && !delegate.voted)
    .map((delegate) => `+${delegate.publicKey}`)
  const downVotes = delegates.value
    .filter((delegate) => delegate.downvoted && delegate.voted)
    .map((delegate) => `-${delegate.publicKey}`)
  const allVotes = [...upVotes, ...downVotes]

  if (allVotes.length <= 0) {
    store.dispatch('snackbar/show', {
      message: t('votes.select_delegates')
    })

    return
  }

  waitingForConfirmation.value = true
  dialog.value = false

  store.dispatch('delegates/voteForDelegates', {
    votes: [...upVotes, ...downVotes],
    address: store.state.address
  })

  store.dispatch('snackbar/show', {
    message: t('votes.sent')
  })
}
const showConfirmationDialog = () => {
  dialog.value = true
}
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/components/_secondary-dialog.scss' as secondaryDialog;
@use '@/assets/styles/components/_text-content.scss' as textContent;
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';

.delegates-view {
  position: relative;
  --a-delegates-review-button-margin: var(--a-space-2);
  width: 100%;

  &__info {
    @include textContent.a-content-explanatory-copy();
    padding: var(--a-space-5) 0;
    @include textContent.a-content-inline-links();
  }
  &__review.v-row {
    margin: 0;
    padding-top: var(--a-space-4);
    padding-bottom: var(--a-space-4);
  }
  &__review-button {
    margin: var(--a-delegates-review-button-margin);
  }
  &__pagination {
    margin-inline-start: calc(var(--a-space-4) * -1);
  }
  &__search {
    :deep(.v-field) {
      padding-left: var(--a-space-4);
      padding-right: var(--a-space-4);
    }
  }
}

.delegates-summary-dialog {
  @include secondaryDialog.a-secondary-dialog-card-frame();

  &__dialog-title {
    @include mixins.a-text-header();
  }

  &__dialog-summary {
    @include textContent.a-content-body-copy();
  }

  &__dialog-info {
    @include textContent.a-content-body-copy();
    margin-top: var(--a-space-4);
    @include textContent.a-content-inline-links();
  }
}

/** Themes **/
.v-theme--light {
  .delegates-summary-dialog {
    &__dialog-title {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__dialog-summary {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__dialog-info {
      color: map.get(colors.$adm-colors, 'regular');
    }
    &__divider {
      border-color: map.get(colors.$adm-colors, 'regular');
    }
  }

  .delegates-view :deep(.settings-data-table) tbody tr:not(:last-child) {
    border-bottom:
      var(--a-border-width-thin) solid,
      map.get(colors.$adm-colors, 'secondary2');
  }
}
.v-theme--dark {
  .delegates-view {
  }
}
</style>
