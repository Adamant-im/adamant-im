<template>
  <v-icon
    v-if="voted"
    :class="classes.icon"
    icon="mdi-thumb-up"
    size="large"
    @click="handleDownVote"
  />
  <v-icon
    v-else
    :class="classes.icon"
    icon="mdi-thumb-up-outline"
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
  setup (props) {
    const { delegate } = props
    const store = useStore()

    const className = 'delegate-vote-checkbox'
    const classes = {
      root: className,
      icon: `${className}__icon`
    }

    const voted = computed(() => delegate._voted)
    const address = computed(() => delegate.address)

    const handleUpVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/upVote', address.value)
    }
    const handleDownVote = (event) => {
      event.stopPropagation()
      store.commit('delegates/downVote', address.value)
    }

    return {
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
@import '../../assets/styles/themes/adamant/_mixins.scss';
@import '../../assets/styles/settings/_colors.scss';

.delegate-vote-checkbox {
  &__icon {
    font-size: 24px !important;
    height: 24px !important;
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
