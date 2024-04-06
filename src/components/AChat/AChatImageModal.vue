<template>
  <div>
    <v-dialog class="modal-wrapper" v-model="show">
      <div class="container">
        <div>
          <v-btn icon="mdi-close-thick" class="button" @click="closeModal"></v-btn>
        </div>
        <v-carousel class="carousel" hide-delimiters>
          <v-carousel-item v-for="(item, i) in images" :key="i">
            <v-img class="modalImg" :src="item.content" alt="Image" @click="openModal(i)" />
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
  data: () => ({}),
  computed: {
    show: {
      get() {
        return this.modal
      },
      set(value) {
        console.log('set', value)
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
  background-color: rgba(0, 0, 0, 0.739);
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
.carousel {
  margin-top: 40px;
  margin-bottom: 40px;
}

.modalImg {
  height: 100%;
  width: 100%;
}
</style>
