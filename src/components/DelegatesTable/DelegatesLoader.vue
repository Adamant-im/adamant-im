<template>
  <tr :class="classes.root">
    <td colspan="3">
      <v-row :class="classes.content" align="center" justify="center">
        <v-progress-circular
          :class="classes.spinner"
          indeterminate
          color="primary"
          :size="COMMON_INLINE_SPINNER_SIZE"
        />
        <div :class="classes.text">
          {{
            waitingForConfirmation
              ? $t('votes.waiting_confirmations')
              : $t('votes.loading_delegates')
          }}
        </div>
      </v-row>
    </td>
  </tr>
</template>

<script>
import { defineComponent } from 'vue'
import { COMMON_INLINE_SPINNER_SIZE } from '@/components/common/helpers/uiMetrics'

export default defineComponent({
  props: {
    waitingForConfirmation: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    const className = 'delegates-loader'
    const classes = {
      root: className,
      content: `${className}__content`,
      spinner: `${className}__spinner`,
      text: `${className}__text`
    }

    return {
      classes,
      COMMON_INLINE_SPINNER_SIZE
    }
  }
})
</script>

<style lang="scss">
@use '@/assets/styles/themes/adamant/_mixins.scss' as mixins;

.delegates-loader {
  &__content {
    gap: var(--a-delegates-loader-gap);
    padding-block: var(--a-delegates-loader-padding-block);
  }

  &__spinner {
    flex-shrink: 0;
  }

  &__text {
    @include mixins.a-text-regular();
    line-height: var(--a-delegates-loader-line-height);
  }
}
</style>
