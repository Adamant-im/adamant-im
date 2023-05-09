<template>
  <v-icon
    v-if="voted"
    :class="classes.icon"
    :icon="votes.upVote"
    size="large"
    @click="handleDownVote"
  />
  <v-icon
    v-else
    :class="classes.icon"
    :icon="votes.downVote"
    size="large"
    @click="handleUpVote"
  />
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  props: {
    delegate: {
      type: Object,
      required: true
    }
  },
  setup: function (props) {
    const {delegate} = props
    const store = useStore()

    const className = 'delegate-vote-checkbox'
    const voteName = 'mdi-thumb'
    const classes = {
      root: className,
      icon: `${className}__icon`
    }
    const votes = {
      root: voteName,
      upVote: `${voteName}-up`,
      downVote: `${voteName}-up-outline`
    }

    const voted = computed(() => delegate._voted)
    const originalVoted = voted.value;
    const address = computed(() => delegate.address)

    const handleUpVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/upVote', address.value)
      if (originalVoted) {
        classes.icon = `${className}__icon`
      } else {
        classes.icon = `${className}__upvote`
      }
    }
    const handleDownVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/downVote', address.value)

      if (originalVoted) {
        classes.icon = `${className}__downvote`
        votes.downVote = `${voteName}-down-outline`
      } else {
        classes.icon = `${className}__icon`
      }
    }

    return {
      voted,
      handleUpVote,
      handleDownVote,
      classes,
      votes
    }
  }
}
</script>

<style lang="scss">
@import 'vuetify/settings';
@import '../../assets/styles/themes/adamant/_mixins.scss';
@import '../../assets/styles/settings/_colors.scss';

.delegate-vote-checkbox {
  &__icon {
    font-size: 24px !important;
    height: 24px !important;
  }
  &__upvote {
    color: map-get($adm-colors, 'good');
  }
  &__downvote {
    color: map-get($adm-colors, 'danger');
  }
}

.v-theme--light {
  .delegate-vote-checkbox {
    &__icon {
      color: map-get($adm-colors, 'muted');
    }
  }
}

.dark {
  .delegate-vote-checkbox {
    &__icon {
    }
  }
}
</style>
