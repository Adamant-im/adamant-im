<template>
  <div class="options-page">
    <app-toolbar-centered
      :title="$t('options.page_title')"
      :show-back="true"
      flat
    />

    <v-container fluid>
      <v-layout row wrap justify-center>

        <v-flex xs12 sm12 md8 lg5>

          <!-- General -->
          <h3 class="title mt-3 mb-3">{{ $t('options.general_title') }}</h3>
          <v-layout row wrap align-center>
            <v-flex xs6>
              <v-subheader class="pa-0">{{ $t('options.language_label') }}</v-subheader>
            </v-flex>
            <v-flex xs6 class="text-xs-right">
              <language-switcher/>
            </v-flex>
            <v-flex xs12 class="mt-2">
              <v-checkbox
                :label="$t('options.dark_theme')"
                color="grey darken-1"
                v-model="darkTheme"
              />
            </v-flex>
          </v-layout>

          <!-- Security -->
          <h3 class="title mt-4 mb-4">{{ $t('options.security_title') }}</h3>
          <v-layout row wrap align-center>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.exit_on_close')"
                :title="$t('options.exit_on_close_tooltip')"
                color="grey darken-1"
                v-model="logoutOnTabClose"
              />
            </v-flex>
          </v-layout>

          <!-- Chats -->
          <h3 class="title mt-4 mb-4">{{ $t('options.chats_title') }}</h3>
          <v-layout row wrap align-center>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.send_on_enter')"
                :title="$t('options.send_on_enter_tooltip')"
                color="grey darken-1"
                v-model="sendMessageOnEnter"
              />
            </v-flex>
          </v-layout>

          <!-- Notifications -->
          <h3 class="title mt-4 mb-4">{{ $t('options.notification_title') }}</h3>
          <v-layout row wrap align-center>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.enable_sound')"
                :title="$t('options.enable_sound_tooltip')"
                color="grey darken-1"
                v-model="allowSoundNotifications"
              />
            </v-flex>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.enable_bar')"
                :title="$t('options.enable_bar_tooltip')"
                color="grey darken-1"
                v-model="allowTabNotifications"
              />
            </v-flex>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.allow_push')"
                color="grey darken-1"
                v-model="allowPushNotifications"
              />
            </v-flex>
          </v-layout>

          <!-- Delegates -->
          <h3 class="title mt-4 mb-4">{{ $t('options.other') }}</h3>
          <v-layout row wrap align-center>
           <v-flex xs12>
             <v-btn flat @click="$router.push('/options/nodes')">{{ $t('options.nodes_list') }}</v-btn>

             <v-btn flat class="text-xs-left" @click="$router.push('/votes')">
               {{ $t('options.vote_for_delegates_button') }}
             </v-btn>

             <div class="text-xs-right">{{ $t('options.version') }} {{ this.$root.$options.version }}</div>
           </v-flex>
          </v-layout>

        </v-flex>

      </v-layout>
    </v-container>
  </div>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'
import AppToolbarCentered from '@/components/AppToolbarCentered'

export default {
  computed: {
    logoutOnTabClose: {
      get () {
        return this.$store.state.options.logoutOnTabClose
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'logoutOnTabClose',
          value
        })
      }
    },
    sendMessageOnEnter: {
      get () {
        return this.$store.state.options.sendMessageOnEnter
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'sendMessageOnEnter',
          value
        })
      }
    },
    allowSoundNotifications: {
      get () {
        return this.$store.state.options.allowSoundNotifications
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'allowSoundNotifications',
          value
        })
      }
    },
    allowTabNotifications: {
      get () {
        return this.$store.state.options.allowTabNotifications
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'allowTabNotifications',
          value
        })
      }
    },
    allowPushNotifications: {
      get () {
        return this.$store.state.options.allowPushNotifications
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'allowPushNotifications',
          value
        })
      }
    },
    darkTheme: {
      get () {
        return this.$store.state.options.darkTheme
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'darkTheme',
          value
        })
      }
    }
  },
  data: () => ({
  }),
  components: {
    LanguageSwitcher,
    AppToolbarCentered
  }
}
</script>
