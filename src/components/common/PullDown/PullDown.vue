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
    transition: all 0.6s;
  }

  &__loader-container {
    display: flex;
    align-items: center;
    justify-content: space-around;
    flex-direction: column;
    padding: 16px;
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
  }

  &__progress-circular {
    transition: color 0.5s ease;

    :deep(.v-progress-circular__overlay) {
      transition: unset;
    }
  }

  &__action-text {
    transition: color 0.2s ease;

    font-size: 14px;
    font-weight: 500;
    margin-top: 8px;
  }
}

.v-theme--light {
  .pull-down {
    &__progress-circular {
      color: map.get(colors.$adm-colors, 'grey');

      &--activated {
        color: map.get(colors.$adm-colors, 'muted');
      }
    }

    &__action-text {
      color: map.get(colors.$adm-colors, 'grey');

      &--activated {
        color: map.get(colors.$adm-colors, 'muted');
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
