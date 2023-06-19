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
import { computed, reactive } from 'vue'
import { useStore } from 'vuex'

export default {
  props: {
    delegate: {
      type: Object,
      required: true
    }
  },
  setup (props) {
    const { delegate } = props
    const store = useStore()

    const className = 'delegate-vote-checkbox'
    const classes = reactive({
      root: className,
      icon: `${className}__icon`
    })
    const votes = reactive({
      upVote: 'mdi-thumb-up',
      downVote: 'mdi-thumb-up-outline'
    })

    const voted = computed(() => delegate._voted)
    const originalVoted = voted.value;
    const address = computed(() => delegate.address)

    const handleUpVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/upVote', address.value)
      if (originalVoted) {
        classes.icon = `${className}__icon`
      } else {
        classes.icon = `${className}-good`
      }
    }
    const handleDownVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/downVote', address.value)

      if (originalVoted) {
        classes.icon = `${className}-danger`
        votes.downVote = 'mdi-thumb-down-outline'
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
  &-good {
    color: map-get($adm-colors, 'good');
  }
  &-danger {
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
