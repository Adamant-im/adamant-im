<template>
  <div v-if="file" :class="classes.root">
    <div :class="classes.container">
      <img
        :class="classes.file"
        v-for="(imageUrl, index) in file"
        :key="index"
        :src="imageUrl.content"
        alt="Selected Image"
      />

      <v-btn
        @click="$emit('cancel')"
        :class="classes.closeButton"
        icon="mdi-close"
        size="24"
        variant="plain"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

const className = 'a-chat-preview-file'
const classes = {
  root: className,
  container: `${className}__container`,
  file: `${className}__file`,
  closeButton: `${className}__close-button`
}

export default defineComponent({
  emits: ['cancel'],
  props: {
    file: {
      type: [Array, null],
      required: true
    }
  },
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

.a-chat-preview-file {
  border-left: 3px solid map-get($adm-colors, 'attention');
  border-radius: 8px;
  margin: 8px;

  &__container {
    padding: 8px 16px;
    position: relative;
    display: flex;
  }

  &__file {
    margin-left: 8px;
    margin-right: 8px;
    width: 40px;
    height: 40px;
  }

  &__close-button {
    position: absolute;
    right: 0;
    top: 0;
    margin-right: 4px;
    margin-top: 4px;
  }
}

.v-theme--light {
  .a-chat-preview-file {
    background-color: map-get($adm-colors, 'secondary');
    color: map-get($adm-colors, 'regular');
  }
}

.v-theme--dark {
  .a-chat-preview-file {
    background-color: rgba(245, 245, 245, 0.1); // @todo const
    color: #fff;
  }
}
</style>
