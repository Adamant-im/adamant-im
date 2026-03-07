<template>
  <tr :class="classes.root">
    <td colspan="3">
      <v-row align="center" justify="center">
        <v-progress-circular indeterminate color="primary" size="24" class="mr-3" />
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
  &__text {
    line-height: 1;
  }
}
</style>
