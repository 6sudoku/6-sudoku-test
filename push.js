/* 6 Sudoku TEST · Web Push: consenso esplicito, registrazione autenticata. */
(() => {
 'use strict';
 const VAPID_PUBLIC = "BOCAnRBh0XgVkwSW8oGXDDkIgDjYA2l9W8i9Suu5qhyPD1BVCiQIeJqdHeEBvReBI5FHzF70D8m9CoS34PJmZO0";
 const fnName = 'push-self-test';
 const $ = id => document.getElementById(id);
 const tr = key => (window.I18N?.[document.getElementById('language')?.value||'it']||window.I18N?.it||{})[key] || key;
 const status = key => { if ($('pushStatus')) $('pushStatus').textContent = tr(key); };
 const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;
 const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
 const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const base64ToBytes = input => {const s=input.replace(/-/g,'+').replace(/_/g,'/');const bin=atob(s+'='.repeat((4-s.length%4)%4));return Uint8Array.from(bin,c=>c.charCodeAt(0));};
 let busy=false;
 async function invoke(payload) {
  const db=await window.SudokuOnline.getClient();
  const {data:{session},error}=await db.auth.getSession();
  if(error||!session) throw Error('No active Supabase session');
  const result=await db.functions.invoke(fnName,{body:payload});
  if(result.error)throw result.error;
  if(result.data?.error)throw Error(result.data.error);
  return result.data;
 }
 async function refresh(){
  if(!$('pushEnableBtn'))return;
  if(!supported()){status('pushUnsupported');return;}
  if(isIOS()&&!installed()){status('pushInstallFirst');return;}
  if(Notification.permission==='denied'){status('pushBlocked');return;}
  if(Notification.permission==='granted'){
   const reg=await navigator.serviceWorker.ready;
   const sub=await reg.pushManager.getSubscription();
   if(sub){status('pushActive');$('pushEnableBtn').classList.add('hidden');$('pushTestBtn').classList.remove('hidden');$('pushDisableBtn').classList.remove('hidden');return;}
  }
  status('pushReady');$('pushEnableBtn').classList.remove('hidden');$('pushTestBtn').classList.add('hidden');$('pushDisableBtn').classList.add('hidden');
 }
 async function enable(){
  if(busy)return;
  if(!$('profileNotif')?.checked){status('pushPreferenceOff');return;}
  if(!supported()){status('pushUnsupported');return;}
  if(isIOS()&&!installed()){status('pushInstallFirst');return;}
  if(Notification.permission==='denied'){status('pushBlocked');return;}
  busy=true;status('pushRegistering');
  try{
   // Richiesta permesso avviata direttamente dal click del giocatore.
   const permission=await Notification.requestPermission();
   if(permission!=='granted'){status('pushNotAllowed');return;}
   if(!window.SudokuOnline?.configured)throw Error('Supabase not configured');
   const db=await window.SudokuOnline.getClient();
   const {data:{session}}=await db.auth.getSession();
   if(!session) {status('pushProfileFirst');return;}
   const reg=await navigator.serviceWorker.ready;
   let sub=await reg.pushManager.getSubscription();
   if(sub){const existingKey=sub.options?.applicationServerKey; if(existingKey){const a=new Uint8Array(existingKey);const b=base64ToBytes(VAPID_PUBLIC);if(a.length!==b.length||a.some((v,i)=>v!==b[i])){await sub.unsubscribe();sub=null;}}}
   if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64ToBytes(VAPID_PUBLIC)});
   await invoke({action:'subscribe',subscription:sub.toJSON()});
   status('pushActive');await refresh();
  }catch(e){console.error('6 Sudoku push subscribe error',e);status('pushError');}
  finally{busy=false;}
 }
 async function test(){if(busy)return;busy=true;status('pushSending');try{await invoke({action:'test'});status('pushSent')}catch(e){console.error('6 Sudoku push test error',e);status('pushError')}finally{busy=false}}
 async function disable(){if(busy)return;busy=true;try{
  const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();
  if(sub){await invoke({action:'unsubscribe',endpoint:sub.endpoint});await sub.unsubscribe()}
  status('pushDisabled');await refresh();
 }catch(e){console.error('6 Sudoku push disable error',e);status('pushError')}finally{busy=false}}
 document.addEventListener('DOMContentLoaded',()=>{
  $('pushEnableBtn')?.addEventListener('click',enable);
  $('pushTestBtn')?.addEventListener('click',test);
  $('pushDisableBtn')?.addEventListener('click',disable);
  $('profileNotif')?.addEventListener('change',()=>{if(!$('profileNotif').checked)status('pushPreferenceOff');else refresh()});
  refresh().catch(()=>{});
 });
 window.SudokuPush={refresh};
})();
