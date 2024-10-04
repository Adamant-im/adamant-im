<template>
  <AChatFileLoader :partner-id="partnerId" :file="img" :transaction="transaction">
    <template #default="{ fileUrl, width, height, error }">
      <v-img v-if="error" :aspect-ratio="width / height" cover>
        <div :class="classes.error">ERROR</div>
      </v-img>

      <v-img v-else :src="fileUrl" :aspect-ratio="width / height" cover @click="$emit('click')">
        <template #placeholder>
          <div :class="classes.placeholder" class="d-flex align-center justify-center fill-height">
            <v-progress-circular color="grey-lighten-4" indeterminate />
          </div>
        </template>
      </v-img>
    </template>
  </AChatFileLoader>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { AChatFileLoader } from './AChatFileLoader.tsx'
import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'

const className = 'a-chat-image'
const classes = {
  root: className,
  border: `${className}--border`,
  placeholder: `${className}__placeholder`,
  error: `${className}__error`
}

export default defineComponent({
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    img: {
      type: Object as PropType<FileAsset | LocalFile>,
      required: true
    },
    partnerId: {
      type: String,
      required: true
    }
  },
  components: { AChatFileLoader },
  setup() {
    return {
      classes
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/settings/_colors.scss';
@import '@/assets/styles/themes/adamant/_mixins.scss';

.a-chat-image {
  &__placeholder {
  }

  &__error {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    height: 100%;
    font-weight: 400;
  }
}

.v-theme--light {
  .a-chat-image {
    &__placeholder {
      background-color: map-get($adm-colors, 'secondary2');
    }

    &__error {
      background-color: map-get($adm-colors, 'secondary2');
    }
  }
}

.v-theme--dark {
  .a-chat-image {
    &__placeholder {
      background-color: map-get($adm-colors, 'secondary2-slightly-transparent');
    }

    &__error {
      background-color: map-get($adm-colors, 'secondary2-slightly-transparent');
    }
  }
}
</style>
