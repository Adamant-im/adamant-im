<template>
  <v-list-tile avatar @click="onClickTransaction">
    <v-list-tile-avatar>
      <v-icon>{{ direction === 'from' ? 'mdi-airplane-takeoff' : 'mdi-airplane-landing' }}</v-icon>
    </v-list-tile-avatar>

    <v-list-tile-content>
      <v-list-tile-title v-if="partnerName">
        {{ partnerName }}
        <span class="body-1 grey--text text--darken-1">({{ partnerId }})</span>
      </v-list-tile-title>
      <v-list-tile-title v-else>
        {{ partnerId }}
      </v-list-tile-title>
      <v-list-tile-sub-title>{{ timeAgo }}</v-list-tile-sub-title>
    </v-list-tile-content>

    <v-list-tile-action>
      <v-btn icon ripple @click.stop="onClickIcon">
        <v-icon color="grey darken-2">
          {{ hasMessages ? 'mdi-comment' : 'mdi-comment-outline' }}
        </v-icon>
      </v-btn>
    </v-list-tile-action>
  </v-list-tile>
</template>

<script>
export default {
  computed: {
    partnerName () {
      return this.$store.getters['partners/displayName'](this.partnerId) || ''
    },
    timeAgo () {
      return this.$formatDate(this.timestamp)
    },
    hasMessages () {
      const chat = this.$store.state.chats[this.partnerId]
      return chat && chat.messages && Object.keys(chat.messages).length > 0
    }
  },
  methods: {
    onClickTransaction () {
      this.$emit('click:transaction', this.id)
    },
    onClickIcon () {
      this.$emit('click:icon', this.partnerId)
    }
  },
  props: ['id', 'direction', 'senderId', 'partnerId', 'timestamp']
}
</script>
