<template>
  <div :class="className">
    <app-toolbar-centered
      app
      :title="$t('options.page_title')"
      :show-back="true"
      flat
    />

    <v-container fluid>
      <v-layout row wrap justify-center>

        <container>

          <!-- General -->
          <h3
            :class="`${className}__title`"
            class="mt-3 mb-3"
          >
            {{ $t('options.general_title') }}
          </h3>
          <v-layout row wrap align-center>
            <v-flex xs6>
              <v-subheader
                :class="`${className}__label`"
                class="pa-0"
              >
                {{ $t('options.language_label') }}
              </v-subheader>
            </v-flex>
            <v-flex xs6 class="text-xs-right">
              <language-switcher
                append-icon="mdi-chevron-down"
              />
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
          <h3
            :class="`${className}__title`"
            class="mt-4 mb-4"
          >
            {{ $t('options.security_title') }}
          </h3>
          <v-layout row wrap align-center>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.exit_on_close')"
                :title="$t('options.exit_on_close_tooltip')"
                color="grey darken-1"
                :input-value="logoutOnTabClose"
                @click="onCheckLogoutOnTabClose"
                readonly
              />

              <password-set-dialog v-model="passwordDialog" @password="onSetPassword" />
            </v-flex>
          </v-layout>

          <!-- Chats -->
          <h3
            :class="`${className}__title`"
            class="mt-4 mb-4"
          >
            {{ $t('options.chats_title') }}
          </h3>
          <v-layout row wrap align-center>
            <v-flex xs12>
              <v-checkbox
                :label="$t('options.send_on_enter')"
                :title="$t('options.send_on_enter_tooltip')"
                color="grey darken-1"
                v-model="sendMessageOnEnter"
              />
              <v-checkbox
                :label="$t('options.format_messages')"
                :title="$t('options.format_messages_tooltip')"
                color="grey darken-1"
                v-model="formatMessages"
              />
            </v-flex>
          </v-layout>

          <!-- Notifications -->
          <h3
            :class="`${className}__title`"
            class="mt-4 mb-4"
          >
            {{ $t('options.notification_title') }}
          </h3>
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
                :label="$t('options.enable_push')"
                :title="$t('options.enable_push_tooltip')"
                color="grey darken-1"
                v-model="allowPushNotifications"
              />
            </v-flex>
          </v-layout>

          <!-- Actions -->
          <h3
            :class="`${className}__title`"
            class="mt-4 mb-4"
          >
            {{ $t('options.actions') }}
          </h3>
          <v-layout row wrap>
            <v-flex xs12>
              <a
                @click="$router.push('/options/nodes')"
                :class="`${className}__action`"
              >
                {{ $t('options.nodes_list') }}
              </a>
            </v-flex>

            <v-flex xs12>
              <a
                @click="$router.push('/votes')"
                :class="`${className}__action`"
                class="text-xs-left"
              >
                {{ $t('options.vote_for_delegates_button') }}
              </a>
            </v-flex>
          </v-layout>
          <v-layout row wrap align-center>
            <!-- Logout -->
            <v-btn @click="logout" flat>
              <v-icon left>mdi-logout-variant</v-icon>
              <span>{{ $t('bottom.exit_button') }}</span>
            </v-btn>
          </v-layout>

          <v-layout>
            <div
              class="a-text-explanation ml-auto"
            >
              {{ $t('options.version') }} {{ this.$root.$options.version }}
            </div>
          </v-layout>

        </container>

      </v-layout>
    </v-container>
  </div>
</template>

<script>
import LanguageSwitcher from '@/components/LanguageSwitcher'
import AppToolbarCentered from '@/components/AppToolbarCentered'
import PasswordSetDialog from '@/components/PasswordSetDialog'
import { clearDb, db as isIDBSupported } from '@/lib/idb'
import AppInterval from '@/lib/AppInterval'

export default {
  computed: {
    className: () => 'settings-view',
    logoutOnTabClose () {
      return this.$store.state.options.logoutOnTabClose
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
    formatMessages: {
      get () {
        return this.$store.state.options.formatMessages
      },
      set (value) {
        this.$store.commit('options/updateOption', {
          key: 'formatMessages',
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
    },
    isLoginViaPassword () {
      return this.$store.getters['options/isLoginViaPassword']
    }
  },
  data: () => ({
    passwordDialog: false
  }),
  methods: {
    onSetPassword (password) {
      this.$store.commit('options/updateOption', {
        key: 'logoutOnTabClose',
        value: false
      })
    },
    onCheckLogoutOnTabClose () {
      if (this.logoutOnTabClose) {
        isIDBSupported
          .then(() => {
            this.passwordDialog = true
          })
          .catch(() => {
            this.$store.dispatch('snackbar/show', {
              message: this.$t('options.idb_not_supported'),
              timeout: 5000
            })
          })
      } else {
        clearDb().then(() => {
          this.$store.commit('options/updateOption', {
            key: 'logoutOnTabClose',
            value: true
          })

          this.$store.commit('resetPassword')
        })
      }
    },
    logout () {
      AppInterval.unsubscribe()
      this.$store.dispatch('logout')

      if (this.isLoginViaPassword) {
        return clearDb()
          .catch(err => {
            console.error(err)
          })
          .finally(() => {
            // turn off `loginViaPassword` option
            this.$store.commit('options/updateOption', { key: 'logoutOnTabClose', value: true })

            this.$router.push('/')
          })
      } else {
        return Promise.resolve(this.$router.push('/'))
      }
    }
  },
  components: {
    LanguageSwitcher,
    AppToolbarCentered,
    PasswordSetDialog
  }
}
</script>

<style lang="stylus" scoped>
@import '~vuetify/src/stylus/settings/_colors.styl'
@import '../assets/stylus/settings/_colors.styl'

.settings-view
  &__title
    font-size: 16px
    font-weight: 500
  &__action
    display: block
    font-size: 16px
    font-weight: 500
    text-decoration-line: underline
    margin: 6px 8px
    padding: 0 16px
  >>> .v-input--selection-controls
    margin-top: 0
  >>> .v-label, &__label
    font-size: 14px
    font-weight: 300

/** Themes **/
.theme--light
  .settings-view
    &__title
      background-color: $adm-colors.secondary2
      color: $adm-colors.regular
    &__action
      color: $adm-colors.regular
    >>> .v-label, &__label
      color: $adm-colors.regular
.theme--dark
  .settings-view
    &__action
      color: $shades.white
</style>
