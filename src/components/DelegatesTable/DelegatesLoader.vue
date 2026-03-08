<template>
  <tr :class="classes.root">
    <td colspan="3">
      <v-row :class="classes.content" align="center" justify="center">
        <v-progress-circular :class="classes.spinner" indeterminate color="primary" size="24" />
        <div :class="classes.text" class="a-text-regular">
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
      classes
    }
  }
})
</script>

<style lang="scss">
.delegates-loader {
  &__content {
    gap: var(--a-delegates-loader-gap);
    padding-block: var(--a-delegates-loader-padding-block);
  }

  &__spinner {
    flex-shrink: 0;
  }

  &__text {
    line-height: var(--a-delegates-loader-line-height);
  }
}
</style>
