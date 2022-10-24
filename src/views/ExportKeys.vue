<template>
  <div>
    <app-toolbar-centered
      app
      :title="$t('options.export_keys.title')"
      :show-back="true"
      flat
    />
    <v-container
      fluid
      class="px-0"
    >
      <v-row
        justify="center"
        no-gutters
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
