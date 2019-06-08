<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': sender.id === userId }"
  >
    <div
      class="a-chat__message"
    >
      <div class="a-chat__message-card">
        <div>
          <div class="a-chat__direction a-text-regular-bold">
            {{ sender.id === userId ? i18n.sent : i18n.received }}
          </div>
          <div
            @click="onClickAmount"
            class="a-chat__amount"
            :class="isClickable ? 'a-chat__amount--clickable': ''"
          >
            <v-layout align-center>
              <slot name="crypto"></slot>
              <span class="ml-2">{{ amount }}</span>
            </v-layout>
          </div>
        </div>

        <div class="a-chat__message-card-body">
          <div class="a-chat__message-text mb-1 a-text-regular-enlarged">
            {{ message }}
          </div>
        </div>

        <div class="a-chat__message-card-header">
          <div :title="timeTitle" class="a-chat__timestamp">{{ time }}</div>
          <div class="a-chat__status">
            <v-icon
              size="15"
              :title="i18n.statuses[status]"
              :color="statusColor"
            >{{ statusIcon }}</v-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  mounted () {
    this.$emit('mount')
  },
  computed: {
    statusIcon () {
      if (this.status === 'delivered') {
        return 'mdi-check'
      } else if (this.status === 'pending') {
        return 'mdi-clock-outline'
      } else if (this.status === 'rejected') {
        return 'mdi-close-circle-outline'
      } else {
        return 'mdi-alert-outline'
      }
    },
    statusColor () {
      if (this.status === 'rejected') {
        return 'red'
      } else if (this.status === 'invalid') {
        return 'yellow'
      }

      return ''
    }
  },
  methods: {
    onClickAmount () {
      if (this.isClickable) {
        this.$emit('click:transaction', this.id)
      }
    }
  },
  props: {
    id: {
      type: null,
      required: true
    },
    message: {
      type: String,
      default: ''
    },
    time: {
      type: String,
      default: ''
    },
    timeTitle: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
    sender: {
      type: Object,
      required: true
    },
    amount: {
      type: [Number, String],
      default: 0
    },
    i18n: {
      type: Object,
      default: () => ({
        sent: 'Sent',
        received: 'Received',
        statuses: {
          delivered: '',
          pending: '',
          rejected: '',
          invalid: ''
        }
      })
    },
    locale: {
      type: String,
      default: 'en'
    },
    status: {
      type: String,
      default: 'confirmed',
      validator: v => ['delivered', 'pending', 'rejected', 'invalid'].includes(v)
    },
    isClickable: {
      type: Boolean,
      default: false
    }
  }
}
</script>
