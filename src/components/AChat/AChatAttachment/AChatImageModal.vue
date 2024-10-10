<template>
  <v-dialog v-model="show" fullscreen :class="classes.root" @keydown="handleKeydown">
    <v-card :class="classes.container">
      <v-toolbar color="transparent">
        <v-btn icon="mdi-close" @click="closeModal" />

        <div :class="classes.imageCounter">{{ slide + 1 }} of {{ files.length }}</div>

        <v-btn icon="mdi-arrow-collapse-down" :class="classes.saveButton" />
      </v-toolbar>

      <v-carousel v-model="slide" :class="classes.carousel" height="100%" hide-delimiters>
        <v-carousel-item v-for="(item, i) in files" :key="i">
          <AChatImageModalItem :transaction="transaction" :file="item" />
        </v-carousel-item>

        <template #prev="{ props }">
          <v-btn icon variant="plain" @click="props.onClick">
            <v-icon icon="mdi-chevron-left" size="x-large" />
          </v-btn>
        </template>
        <template #next="{ props }">
          <v-btn icon variant="plain" @click="props.onClick">
            <v-icon icon="mdi-chevron-right" size="x-large" />
          </v-btn>
        </template>
      </v-carousel>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { FileAsset } from '@/lib/adamant-api/asset'
import { ref, computed, onMounted, PropType } from 'vue'

import AChatImageModalItem from './AChatImageModalItem.vue'
import { LocalFile, NormalizedChatMessageTransaction } from '@/lib/chat/helpers'

const className = 'a-chat-image-modal'
const classes = {
  root: className,
  container: `${className}__container`,
  carousel: `${className}__carousel`,
  saveButton: `${className}__save-btn`,
  closeButton: `${className}__close-btn`,
  imageCounter: `${className}__img-counter`
}

export default {
  props: {
    transaction: {
      type: Object as PropType<NormalizedChatMessageTransaction>,
      required: true
    },
    files: {
      type: Array as PropType<Array<FileAsset | LocalFile>>,
      required: true
    },
    /**
     * Index of the current image in the image slider.
     */
    index: {
      // @todo default index
      type: Number,
      required: true
    },
    /**
     * Modal visibility state
     */
    modal: {
      type: Boolean,
      required: true
    }
  },
  components: {
    AChatImageModalItem
  },
  emits: ['close', 'update:modal'],
  setup(props, { emit }) {
    const slide = ref(0)

    onMounted(() => {
      slide.value = props.index
    })

    const show = computed({
      get() {
        return props.modal
      },
      set(value) {
        emit('update:modal', value)
      }
    })

    const closeModal = () => {
      emit('close')
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && slide.value > 0) {
        slide.value = slide.value - 1
      } else if (e.key === 'ArrowRight' && slide.value < props.files.length - 1) {
        slide.value = slide.value + 1
      }
    }

    return {
      slide,
      show,
      closeModal,
      handleKeydown,
      classes
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
@import '@/assets/styles/themes/adamant/_mixins.scss';
@import '@/assets/styles/settings/_colors.scss';

.a-chat-image-modal {
  &__container {
    position: relative;
    padding-bottom: 32px;
  }
  &__close-btn {
  }
  &__save-btn {
  }
  &__carousel {
  }
  &__img-counter {
    @include a-text-header();
    flex-grow: 1;
    flex-shrink: 1;
    margin-inline-start: 0;
    text-align: center;
  }
}

.v-theme--dark {
  .a-chat-image-modal {
    &__container {
      background-color: map-get($adm-colors, 'muted');
    }
  }
}

.v-theme--light {
  .a-chat-image-modal {
    &__container {
      background-color: map-get($adm-colors, 'grey-transparent');
    }
  }
}
</style>
