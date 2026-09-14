'use client';

import { useEffect } from 'react';
import { isCapacitorApp } from '@/lib/mobile/capacitor';

/**
 * Initializes safe native-only services.
 * Web builds remain untouched.
 */
export default function MobileSetup() {
  useEffect(() => {
    if (!isCapacitorApp()) {
      return;
    }

    let listener: { remove: () => Promise<void> } | null = null;
    let cancelled = false;

    const setup = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const { StatusBar, Style } = await import('@capacitor/status-bar');

        if (cancelled) {
          return;
        }

        await StatusBar.setStyle({
          style: Style.Light,
        });

        listener = await App.addListener('appUrlOpen', () => {
          // Deep-link handling can be added here later.
        });
      } catch (error) {
        console.error('Mobile setup failed:', error);
      }
    };

    void setup();

    return () => {
      cancelled = true;

      if (listener) {
        void listener.remove();
      }
    };
  }, []);

  return null;
}