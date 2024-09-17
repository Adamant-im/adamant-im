<template>
  <div :class="classes.container">
    <AChatFileLoader :partner-id="partnerId" :file="img" :transaction="transaction">
      <template #default="{ fileUrl, width, height }">
        <v-img :src="fileUrl" :width="400" :aspect-ratio="width / height">
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular color="grey-lighten-4" indeterminate />
            </div>
          </template>
        </v-img>
      </template>
    </AChatFileLoader>
  </div>
</template>

<script lang="ts">
import { AChatFileLoader } from './AChatFileLoader.tsx'
import { defineComponent, PropType } from 'vue'
import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'
import { FileAsset } from '@/lib/adamant-api/asset'

const className = 'a-chat-file'
const classes = {
  root: className,
  container: `${className}__container`,
  containerWithElement: `${className}__container-with-element`,
  img: `${className}__img`
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

.a-chat-file {
  border-left: 3px solid map-get($adm-colors, 'attention');
  border-radius: 8px;
  margin: 8px;

  &__container {
    max-width: 230px;
  }

  &__container-with-element {
    display: grid;
    gap: 2px;
    grid-template-columns: repeat(2, minmax(50px, 1fr));
    grid-template-rows: auto;
    max-height: 400px;
  }

  &__img {
    width: 100%;
    height: 100%;

    :deep(.v-img__img) {
      object-fit: fill;
    }
  }

  @if length(img) % 2 != 0 {
    &__img:nth-last-child(1):nth-child(odd) {
      grid-column: span 2;
    }
  }
}

.v-theme--light {
  .a-chat-file {
    background-color: map-get($adm-colors, 'secondary');
    color: map-get($adm-colors, 'regular');
  }
}

.v-theme--dark {
  .a-chat-file {
    background-color: rgba(245, 245, 245, 0.1); // @todo const
    color: #fff;
  }
}
</style>
