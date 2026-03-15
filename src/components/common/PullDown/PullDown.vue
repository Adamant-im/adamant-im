<template>
  <div
    :class="{
      [classes.root]: true,
      [classes.rootTransition]: pullDownReleased
    }"
    v-touch="{
      move: onSwiping,
      end: onSwipeEnd
    }"
    :style="{
      top: `${elementTopOffset}px`
    }"
  >
    <div :class="classes.loaderContainer">
      <v-progress-circular
        :class="{
          [classes.progressCircular]: true,
          [classes.progressCircularActivated]: pullDownActivated
        }"
        :model-value="progressPercentage"
        :indeterminate="pullDownReleased"
      />
      <div
        v-if="actionText"
        :class="{
          [classes.actionText]: true,
          [classes.actionTextActivated]: pullDownActivated
        }"
      >
        {{ actionText }}
      </div>
    </div>
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { usePullDown } from './hooks/usePullDown'

const className = 'pull-down'
const classes = {
  root: className,
  rootTransition: `${className}--transition`,
  loaderContainer: `${className}__loader-container`,
  progressCircular: `${className}__progress-circular`,
  progressCircularActivated: `${className}__progress-circular--activated`,
  actionText: `${className}__action-text`,
  actionTextActivated: `${className}__action-text--activated`
}

export default defineComponent({
  props: {
    actionText: {
      type: String,
      required: false
    }
  },
  setup(props, { emit }) {
    const {
      onSwiping,
      onSwipeEnd,
      elementTopOffset,
      progressPercentage,
      pullDownActivated,
      pullDownReleased
    } = usePullDown(() => {
      emit('action')
    })

    return {
      classes,
      onSwiping,
      onSwipeEnd,
      elementTopOffset,
      progressPercentage,
      pullDownActivated,
      pullDownReleased
    }
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '@/assets/styles/settings/_colors.scss';
@use 'vuetify/settings';

.pull-down {
  position: relative;

  &--transition {
    transition: all var(--a-pull-down-transition-duration);
  }

  &__loader-container {
    display: flex;
    align-items: center;
    justify-content: space-around;
    flex-direction: column;
    padding: var(--a-pull-down-loader-padding);
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
  }

  &__progress-circular {
    transition: color var(--a-pull-down-progress-transition-duration) ease;

    :deep(.v-progress-circular__overlay) {
      transition: unset;
    }
  }

  &__action-text {
    transition: color var(--a-pull-down-text-transition-duration) ease;

    font-size: var(--a-pull-down-text-font-size);
    font-weight: var(--a-pull-down-text-font-weight);
    margin-top: var(--a-pull-down-text-gap);
  }
}

.v-theme--light {
  .pull-down {
    &__progress-circular {
      color: map.get(colors.$adm-colors, 'grey');

      &--activated {
        color: var(--a-color-text-muted-light);
      }
    }

    &__action-text {
      color: map.get(colors.$adm-colors, 'grey');

      &--activated {
        color: var(--a-color-text-muted-light);
      }
    }
  }
}

.v-theme--dark {
  .pull-down {
    &__progress-circular {
      color: map.get(colors.$adm-colors, 'secondary2-transparent');

      &--activated {
        color: map.get(settings.$shades, 'white');
      }
    }

    &__action-text {
      color: map.get(colors.$adm-colors, 'grey');

      &--activated {
        color: map.get(settings.$shades, 'white');
      }
    }
  }
}
</style>
