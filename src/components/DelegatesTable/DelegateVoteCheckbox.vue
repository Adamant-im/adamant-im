<template>
  <v-icon
    v-if="voted"
    :class="{
      [classes.icon]: true,
      [classes.iconGood]: !originalVoted
    }"
    :icon="originalVoted ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
    size="large"
    @click="handleDownVote"
  />

  <v-icon
    v-else
    :class="{
      [classes.icon]: true,
      [classes.iconDanger]: originalVoted
    }"
    :icon="originalVoted ? 'mdi-thumb-down-outline' : 'mdi-thumb-up-outline'"
    size="large"
    @click="handleUpVote"
  />
</template>

<script>
import { computed, toRefs } from 'vue'
import { useStore } from 'vuex'

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
      classes
    }
  }
}
</script>

<style lang="scss">
@import 'vuetify/settings';
@import '@/assets/styles/themes/adamant/_mixins.scss';
@import '@/assets/styles/settings/_colors.scss';

.delegate-vote-checkbox {
  &__icon {
    font-size: 24px !important;
    height: 24px !important;

    &--good {
      color: map-get($adm-colors, 'good');
    }

    &--danger {
      color: map-get($adm-colors, 'danger');
    }
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
