<template>
  <div :class="classes.root">
    {{ asset.react_message }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ReactionAsset } from '@/lib/adamant-api/asset'

const className = 'a-chat-reaction'
const classes = {
  root: className
}

export default defineComponent({
  props: {
    asset: {
      type: Object,
      required: true
    } as PropType<ReactionAsset>
  },
  setup() {
    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';

.a-chat-reaction {
  border-radius: 8px;
  padding: 2px 4px;
  display: inline-block;
  position: absolute;
  bottom: 0;
  right: -8px;
  font-size: 16px;
}

.v-theme--light {
  .a-chat-reaction {
    background-color: map-get($shades, 'white');
  }
}

.v-theme--dark {
  .a-chat-reaction {
    background-color: map-get($shades, 'white');
  }
}
</style>
