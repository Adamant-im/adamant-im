<template>
  <div
    class="a-chat__message-container"
    :class="{ 'a-chat__message-container--right': sender.id === userId }"
  >
    <div
      class="a-chat__message"
    >
      <div class="a-chat__message-card">
        <div class="a-chat__message-card-header">
          <div
            :title="timeTitle"
            class="a-chat__timestamp"
          >
            {{ time }}
          </div>
          <div class="a-chat__status">
            <v-icon
              size="13"
              :title="i18n.statuses[status]"
              :color="statusColor"
              :style="statusUpdatable ? 'cursor: pointer;': 'cursor: default;'"
              @click="updateStatus"
            >
              {{ statusIcon }}
            </v-icon>
          </div>
        </div>

        <div>
          <div class="a-chat__direction a-text-regular-bold">
            {{ sender.id === userId ? i18n.sent : i18n.received }}
          </div>
          <div
            class="a-chat__amount"
            :class="isClickable ? 'a-chat__amount--clickable': ''"
            @click="onClickAmount"
          >
            <v-layout align-center>
              <slot name="crypto" />
              <span class="ml-2">{{ amount }}</span>
            </v-layout>
          </div>
        </div>

        <div class="a-chat__message-card-body">
          <div class="a-chat__message-text mb-1 a-text-regular-enlarged">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tsIcon, tsUpdatable, tsColor } from '@/lib/constants'

export default {
  props: {
    id: {
      type: null,
      required: true
    },
    currency: {
      type: String,
      default: ''
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
          confirmed: '',
          delivered: '',
          pending: '',
          rejected: '',
          invalid: '',
          unknown: ''
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
      validator: v => ['confirmed', 'delivered', 'pending', 'rejected', 'invalid', 'unknown'].includes(v)
    },
    isClickable: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    statusIcon () {
      return tsIcon(this.status)
    },
    statusUpdatable () {
      return tsUpdatable(this.status, this.currency)
    },
    statusColor () {
      return tsColor(this.status)
    }
  },
  mounted () {
    this.$emit('mount')
  },
  methods: {
    onClickAmount () {
      if (this.isClickable) {
        this.$emit('click:transaction', this.id)
      }
    },
    updateStatus () {
      if (this.statusUpdatable) {
        this.$emit('click:transactionStatus', this.id)
      }
    }
  }
}
</script>
