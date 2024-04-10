<template>
  <div>
    <v-dialog :class="className" v-model="show">
      <div :class="`${className}__container`">
        <v-btn icon="mdi-arrow-collapse-down" :class="`${className}__btn-save`"></v-btn>
        <v-btn
          icon="mdi-window-close"
          :class="`${className}__btn-close`"
          @click="closeModal"
        ></v-btn>
        <p :class="`${className}__number-of-img`">{{ slide + 1 }} of {{ images.length }}</p>
        <v-carousel v-model="slide" :class="`${className}__carousel`" hide-delimiters>
          <v-carousel-item v-for="(item, i) in images" :key="i">
            <v-img :class="`${className}__modal-img`" :src="item.content" alt="Image" />
          </v-carousel-item>
        </v-carousel>
      </div>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    images: Array,
    index: Number,
    modal: Boolean
  },
  emits: ['close', 'update:modal'],
  data: () => ({
    slide: null
  }),
  mounted() {
    this.slide = this.index
  },
  computed: {
    className: () => 'modal',
    show: {
      get() {
        return this.modal
      },
      set(value) {
        this.$emit('update:modal', value)
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'vuetify/settings';
.modal {
  z-index: 9999;
  max-width: 800px;

  &__container {
    position: relative;
    background-color: rgba(0, 0, 0, 0.54);
    width: 100%;
    margin: auto;
  }
  &__btn-close {
    position: absolute;
    right: 0;
    top: 0;
    margin: 4px;
    background-color: transparent;
  }
  &__btn-save {
    position: absolute;
    right: 0px;
    bottom: 0;
    margin: 4px;
    background-color: transparent;
  }
  &__carousel {
    margin-top: 40px;
    margin-bottom: 40px;
  }
  &__number-of-img {
    text-align: center;
    line-height: 50px;
    height: 50px;
  }
  &__modal-img {
    height: 100%;
    width: 100%;
  }
}
</style>
