<template>
  <div>
    <v-btn @click="veryShort" class="btn" append-icon="mdi-play"
      >Very short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn class="btn" append-icon="mdi-play"
      >Short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn class="btn" append-icon="mdi-play"
      >Medium
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn @click="vibrate.long()" class="btn" append-icon="mdi-play"
      >Long
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn class="btn" append-icon="mdi-play"
      >Double-v-Short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn class="btn" append-icon="mdi-play"
      >Triple-v-Short
      <template v-slot:append>
        <v-icon color="warning"></v-icon>
      </template>
    </v-btn>
    <v-btn class="btn" append-icon="mdi-play"
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
