'use client';
import {useEffect} from 'react';
import {isCapacitorApp} from '@/lib/mobile/capacitor';
/** Initializes safe native-only services. Web builds remain untouched. */
export default function MobileSetup(){useEffect(()=>{if(!isCapacitorApp())return;let cleanup=()=>{};(async()=>{const {App}=await import('@capacitor/app');const {StatusBar,Style}=await import('@capacitor/status-bar');await StatusBar.setStyle({style:Style.Light});const listener=await App.addListener('appUrlOpen',()=>{});cleanup=()=>listener.remove()})();return()=>cleanup()},[]);return null}
