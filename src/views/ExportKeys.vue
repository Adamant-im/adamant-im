<template>
  <div>
    <app-toolbar-centered
      app
      :title="$t('options.export_keys.title')"
      :show-back="true"
      flat
      fixed
    />
    <v-container
      fluid
      class="px-0 container--with-app-toolbar"
    >
      <v-row
        justify="center"
        no-gutters
        class="mt-6"
      >
        <container padding>
          <export-keys-form />
        </container>
      </v-row>
    </v-container>
  </div>
</template>
<script>
import AppToolbarCentered from '@/components/AppToolbarCentered'
import ExportKeysForm from '@/components/ExportKeysForm'

export default {
  components: {
    AppToolbarCentered,
    ExportKeysForm
  }
}
</script>
