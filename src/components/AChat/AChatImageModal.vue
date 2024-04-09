<template>
  <div>
    <v-dialog class="modal-wrapper" v-model="show">
      <div class="container">
        <v-btn icon="mdi-arrow-collapse-down" class="buttonSave"></v-btn>
        <v-btn icon="mdi-window-close" class="button" @click="closeModal"></v-btn>
        <p class="ok">{{ slide + 1 }} of {{ images.length }}</p>
        <v-carousel v-model="slide" class="carousel" hide-delimiters>
          <v-carousel-item v-for="(item, i) in images" :key="i">
            <v-img class="modalImg" :src="item.content" alt="Image" />
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

<style scoped>
.modal-wrapper {
  z-index: 9999;
  max-width: 800px;
}
.container {
  position: relative;
  background-color: rgba(0, 0, 0, 0.54);
  width: 100%;
  margin: auto;
}
.button {
  position: absolute;
  right: 0;
  top: 0;
  margin: 4px;
  background-color: transparent;
}
.buttonSave {
  position: absolute;
  right: 0px;
  bottom: 0;
  margin: 4px;
  background-color: transparent;
}
.carousel {
  margin-top: 40px;
  margin-bottom: 40px;
}
.ok {
  text-align: center;
  line-height: 50px;
  height: 50px;
}
.modalImg {
  height: 100%;
  width: 100%;
}
</style>
