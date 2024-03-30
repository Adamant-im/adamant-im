<template>
  <div v-if="file.length" :class="classes.root">
    <div :class="classes.container">
      <div :class="classes.containerScrollbar">
        <div :class="classes.containerWithElement" v-for="(imageUrl, index) in file" :key="index">
          <img
            v-if="imageUrl.isImage"
            :class="classes.img"
            :src="imageUrl.content"
            alt="Selected Image"
          />
          <v-icon
            v-else
            size="50"
            :class="classes.file"
            icon="mdi-file"
            style="position: relative"
          />
          <v-icon size="15" icon="mdi-close" @click="removeItem(index)" :class="classes.close" />

          <!-- <p :class="classes.fileName">{{ shortenFileName(imageUrl.name) }}</p> -->
        </div>
      </div>

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
  containerScrollbar: `${className}__containerScrollbar`,
  containerWithElement: `${className}__containerWithElement`,
  file: `${className}__file`,
  fileName: `${className}__fileName`,
  img: `${className}__img`,
  close: `${className}__close`,
  closeButton: `${className}__close-button`
}

export default defineComponent({
  emits: ['cancel', 'remove-item'],
  props: {
    file: {
      type: [Array, null],
      required: true
    }
  },
  setup(props, { emit }) {
    const removeItem = (index) => {
      emit('remove-item', index)
    }

    const shortenFileName = (fileName) => {
      if (fileName.length <= 20) {
        return fileName
      } else {
        const firstPart = fileName.substring(0, 10)
        const lastPart = fileName.substring(fileName.length - 10)
        const shortenedName = `${firstPart}...${lastPart}`
        return shortenedName.replace(/\s+/g, '')
      }
    }
    return {
      classes,
      shortenFileName,
      removeItem
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
    padding: 8px 16px 8px 16px;
    position: relative;
    display: flex;
  }
  &__containerScrollbar {
    display: flex;
    overflow-x: auto;
  }
  &__containerScrollbar::-webkit-scrollbar {
    width: 0;
    padding: 0 !important;
  }
  &__containerWithElement {
    position: relative;
    display: inline-block;
    height: 50px;
    padding: 0;
  }

  &__img {
    margin-left: 4px;
    margin-right: 4px;
    width: 50px;
    height: 50px;
  }
  &__fileName {
    display: inline;
    margin-right: 16px;
  }
  &__file {
    display: inline;
    margin-left: 4px;
    margin-right: 4px;
    width: 50px;
    height: 50px;
  }
  &__close {
    position: absolute;
    top: 0;
    right: 0;
    background-color: rgb(148, 148, 148);
    color: white;
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
