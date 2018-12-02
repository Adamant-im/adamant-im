<template>
  <v-toolbar flat height="64">
    <v-btn @click="goBack" icon>
      <v-icon>arrow_back</v-icon>
    </v-btn>

    <v-toolbar-title>
      <div>{{ title }}</div>
      <div class="body-1">{{ subtitle }}</div>
    </v-toolbar-title>

    <v-spacer></v-spacer>

  </v-toolbar>
</template>

<script>
export default {
  methods: {
    goBack () {
      this.$router.back()
    }
  },
  props: ['title', 'subtitle']
}
</script>
