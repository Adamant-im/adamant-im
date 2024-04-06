<template>
  <div v-if="img.length" :class="classes.container">
    <div :class="classes.containerWithElement">
      <v-img
        @click="openModal(index)"
        v-for="(imageUrl, index) in img"
        :key="index"
        :class="classes.img"
        :src="imageUrl.content"
        alt="Selected Image"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
          </div>
        </template>
      </v-img>
    </div>
  </div>
  <AChatImageModal
    :images="img"
    :index="currentIndex"
    :modal="isModalOpen"
    v-if="isModalOpen"
    @close="closeModal"
    @update:modal="closeModal"
  />
</template>

<script>
import AChatImageModal from './AChatImageModal.vue'
import { defineComponent, ref } from 'vue'

const className = 'a-chat-file'
const classes = {
  root: className,
  container: `${className}__container`,
  containerWithElement: `${className}__containerWithElement`,
  img: `${className}__img`
}

export default defineComponent({
  props: {
    img: {
      type: [Array, null],
      required: true
    }
  },
  components: {
    AChatImageModal
  },
  setup() {
    const currentIndex = ref(0)
    const isModalOpen = ref(false)

    const openModal = (index) => {
      currentIndex.value = index
      isModalOpen.value = true
    }

    const closeModal = () => {
      isModalOpen.value = false
    }

    return {
      classes,
      currentIndex,
      isModalOpen,
      openModal,
      closeModal
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
    max-height: 300px;
    max-width: 260px;
    padding: 8px 16px;

    background-color: rgb(16, 16, 16);
    border-radius: 8px;
  }

  &__containerWithElement {
    max-height: 250px;
    max-width: 220px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 10px;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    margin: 2px;
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
