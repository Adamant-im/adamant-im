<template>
  <v-icon
    v-if="voted"
    :class="[
      classes.root,
      classes.icon,
      {
        [classes.iconGood]: !originalVoted
      }
    ]"
    :icon="originalVoted ? mdiThumbUp : mdiThumbUpOutline"
    @click="handleDownVote"
  />

  <v-icon
    v-else
    :class="[
      classes.root,
      classes.icon,
      {
        [classes.iconDanger]: originalVoted
      }
    ]"
    :icon="originalVoted ? mdiThumbDownOutline : mdiThumbUpOutline"
    @click="handleUpVote"
  />
</template>

<script>
import { computed, toRefs } from 'vue'
import { useStore } from 'vuex'

import { mdiThumbUp, mdiThumbUpOutline, mdiThumbDownOutline } from '@mdi/js'

const className = 'delegate-vote-checkbox'
const classes = {
  root: className,
  icon: `${className}__icon`,
  iconGood: `${className}__icon--good`,
  iconDanger: `${className}__icon--danger`
}

export default {
  props: {
    delegate: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const { delegate } = toRefs(props)
    const store = useStore()

    const voted = computed(() => delegate.value._voted)
    const originalVoted = computed(() => delegate.value.voted)
    const address = computed(() => delegate.value.address)

    const handleUpVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/upVote', address.value)
    }
    const handleDownVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/downVote', address.value)
    }

    return {
      originalVoted,
      voted,
      handleUpVote,
      handleDownVote,
      classes,
      mdiThumbDownOutline,
      mdiThumbUp,
      mdiThumbUpOutline
    }
  }
}
</script>

<style lang="scss">
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use '@/assets/styles/themes/adamant/_mixins.scss';
@use 'vuetify/settings';

.delegate-vote-checkbox {
  --a-delegate-vote-checkbox-icon-size: var(--a-space-6);

  &__icon {
    font-size: var(--a-delegate-vote-checkbox-icon-size);
    inline-size: var(--a-delegate-vote-checkbox-icon-size);
    block-size: var(--a-delegate-vote-checkbox-icon-size);
  }
}

/** Themes **/
.v-theme--light {
  .delegate-vote-checkbox {
    &__icon {
      color: var(--a-color-text-muted-light);
      &--good {
        color: map.get(colors.$adm-colors, 'good');
      }

      &--danger {
        color: map.get(colors.$adm-colors, 'danger');
      }
    }
  }
}

.v-theme--dark {
  .delegate-vote-checkbox {
    &__icon {
      &--good {
        color: map.get(colors.$adm-colors, 'good');
      }

      &--danger {
        color: map.get(colors.$adm-colors, 'danger');
      }
    }
  }
}
</style>
