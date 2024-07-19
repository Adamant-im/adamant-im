<template>
  <div v-if="files.length" :class="classes.root">
    <div :class="classes.container">
      <div :class="classes.containerScrollbar">
        <div :class="classes.containerWithElement" v-for="(imageUrl, index) in files" :key="index">
          <div :class="classes.positionClose">
            <img
              v-if="imageUrl.isImage"
              :class="classes.img"
              :src="imageUrl.content"
              alt="Selected Image"
            />

            <IconFile
              :class="classes.file"
              :text="formatText(imageUrl.name)"
              :height="80"
              :width="80"
              v-else
            ></IconFile>

            <v-icon size="18" icon="mdi-close" @click="removeItem(index)" :class="classes.close" />
          </div>
          <p :class="classes.fileName">{{ shortenFileName(imageUrl.name) }}</p>
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
import IconFile from '../icons/common/IconFile.vue'
import { defineComponent } from 'vue'

const className = 'a-chat-preview-file'
const classes = {
  root: className,
  container: `${className}__container`,
  containerScrollbar: `${className}__container-scrollbar`,
  containerWithElement: `${className}__container-with-element`,
  file: `${className}__file`,
  fileName: `${className}__file-name`,
  img: `${className}__img`,
  positionClose: `${className}__position-close`,
  close: `${className}__close`,
  closeButton: `${className}__close-button`
}

export default defineComponent({
  components: {
    IconFile
  },
  emits: ['cancel', 'remove-item'],
  props: {
    files: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    const formatText = (fileName) => {
      const regex = /[^.]+$/
      const result = fileName.match(regex)[0]

      return result
    }

    const removeItem = (index) => {
      emit('remove-item', index)
    }

    const shortenFileName = (fileName) => {
      if (fileName.length <= 12) {
        return fileName
      } else {
        const firstPart = fileName.substring(0, 6)
        const lastPart = fileName.substring(fileName.length - 5)
        const shortenedName = `${firstPart}...${lastPart}`
        return shortenedName.replace(/\s+/g, '')
      }
    }
    return {
      classes,
      shortenFileName,
      removeItem,
      formatText
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
  &__container-scrollbar {
    display: flex;
    overflow-x: auto;
  }
  &__container-scrollbar::-webkit-scrollbar {
    width: 0;
    padding: 0 !important;
  }
  &__container-with-element {
    width: 110px;
    height: 110px;
    padding: 0;
  }
  &__position-close {
    position: relative;
    display: inline-block;
  }

  &__img {
    margin-left: 8px;
    margin-right: 8px;
    width: 80px;
    height: 80px;
  }
  &__file-name {
    display: inline;
    margin-right: 8px;
    margin-left: 8px;
    font-size: small;
  }
  &__file {
    display: inline;
    position: relative;
    margin-left: 4px;
    margin-right: 4px;
  }
  &__close {
    position: absolute;
    top: 0;
    right: 0;
    background-color: rgb(148, 148, 148);
    color: white;
    border-radius: 50%;
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
