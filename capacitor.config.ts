import type { CapacitorConfig } from '@capacitor/cli';

/**
 * TaliKhata Voice — Capacitor configuration.
 *
 * The Next.js app remains the backend/web application. The native shell loads
 * the deployed HTTPS application URL so MongoDB credentials and Auth.js
 * secrets never ship inside the APK/IPA.
 *
 * Set CAP_SERVER_URL when building the native application, for example:
 *   CAP_SERVER_URL=https://your-domain.com
 */
const serverUrl = process.env.CAP_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.talikhata.voice',
  appName: 'TaliKhata Voice',
  webDir: 'public',
  bundledWebRuntime: false,
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith('http://localhost') || serverUrl.startsWith('http://10.') || serverUrl.startsWith('http://192.168.'),
      }
    : undefined,
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
    },
  },
};

export default config;
