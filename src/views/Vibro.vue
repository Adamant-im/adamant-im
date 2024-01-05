<template>
  <div>
    <v-btn @click="veryShort" class="btn" append-icon="mdi-play"
      >Very short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn @click="short" class="btn" append-icon="mdi-play"
      >Short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn @click="medium" class="btn" append-icon="mdi-play"
      >Medium
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn @click="long" class="btn" append-icon="mdi-play"
      >Long
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn @click="doubleVeryShort" class="btn" append-icon="mdi-play"
      >Double-v-Short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn @click="tripleVeryShort" class="btn" append-icon="mdi-play"
      >Triple-v-Short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn @click="doubleVeryShort" class="btn" append-icon="mdi-play"
      >Double-Short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
  </div>
</template>
<script>
import { vibrate } from '@/lib/vibrate.js'
export default {
  methods: {
    veryShort() {
      return vibrate.veryShort()
    },
    short() {
      return vibrate.short()
    },
    medium() {
      return vibrate.medium()
    },
    long() {
      return vibrate.long()
    },
    doubleVeryShort() {
      return vibrate.doubleVeryShort()
    },
    tripleVeryShort() {
      return vibrate.tripleVeryShort()
    },
    doubleShort() {
      return vibrate.doubleShort()
    }
  }
}
</script>
<style lang="scss" scoped>
@import 'vuetify/settings';
@import '@/assets/styles/settings/_colors.scss';
.btn {
  display: flex;
  margin-top: 12px;
  background-color: map-get($adm-colors, 'regular');
}
</style>
