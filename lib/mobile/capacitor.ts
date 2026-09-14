'use client';
import {Preferences} from '@capacitor/preferences';
export function isCapacitorApp(){if(typeof window==='undefined')return false;return Boolean((window as any).Capacitor);}
export async function setupNativeBackButton(){if(!isCapacitorApp())return()=>{};const {App}=await import('@capacitor/app');const registration=await App.addListener('backButton',({canGoBack})=>{if(canGoBack&&window.history.length>1)window.history.back();else void App.exitApp()});return()=>registration.remove();}
export async function captureProductPhoto(){if(!isCapacitorApp())return null;const {Camera,CameraResultType,CameraSource}=await import('@capacitor/camera');return Camera.getPhoto({quality:85,resultType:CameraResultType.Uri,source:CameraSource.Prompt,allowEditing:false});}
const KEY='talikhata:offline-queue';
export async function queueOfflineCommand(payload:unknown){const raw=(await Preferences.get({key:KEY})).value;const q=raw?JSON.parse(raw):[];q.push({id:crypto.randomUUID(),payload,createdAt:new Date().toISOString()});await Preferences.set({key:KEY,value:JSON.stringify(q)});return q.length;}
export async function getOfflineQueue(){const raw=(await Preferences.get({key:KEY})).value;return raw?JSON.parse(raw):[];}
export async function flushOfflineCommands(){if(typeof navigator!=='undefined'&&!navigator.onLine)return 0;const q=await getOfflineQueue();let done=0;for(const item of q){try{const r=await fetch('/api/voice-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(item.payload)});if(r.ok)done++;}catch{break;}}if(done){const left=q.slice(done);await Preferences.set({key:KEY,value:JSON.stringify(left)});}return done;}
export const isNativeApp=isCapacitorApp;