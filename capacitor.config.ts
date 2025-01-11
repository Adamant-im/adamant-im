import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'im.adamant.adamantmessengerpwa',
  appName: 'ADAMANT Messenger',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      androidScaleType: 'CENTER_CROP' // fix logo stretching
    }
  },
  android: {
    // This option allows making requests from HTTPS to HTTP.
    // Android 9.0 (Pie) introduced restrictions on cleartext (HTTP) traffic, which is enabled by default.
    // Even allowing mixed content, the app will still block these requests due to cleartext restrictions.
    // To bypass this, we have a whitelist of HTTP domains/IPs.
    // See android/app/src/main/res/xml/network_security_config.xml
    allowMixedContent: true
  }
}

export default config
