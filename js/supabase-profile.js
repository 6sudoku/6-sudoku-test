/* 6 Sudoku — collegamento profilo protetto da RLS; caricato solo se configurato. */
(() => {
 'use strict';
 const config=window.SUDOKU_SUPABASE||{};
 const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url||'') && /^(sb_publishable_|eyJ)/.test(config.publishableKey||'');
 let client=null, loading=null;
 function loadScript(src,globalName){return new Promise((resolve,reject)=>{
   if(window[globalName])return resolve();
   const tag=document.createElement('script');tag.src=src;tag.async=true;
   tag.onload=()=>window[globalName]?resolve():reject(new Error('Script unavailable'));
   tag.onerror=()=>reject(new Error('Service not reachable'));document.head.appendChild(tag);
 });}
 async function getClient(){if(!configured)throw Error('Configurazione mancante');
   if(client)return client;
   if(!loading)loading=loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','supabase').then(()=>{
     client=window.supabase.createClient(config.url,config.publishableKey,{auth:{storageKey:'6sudoku-test-supabase-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client;
   }).catch(e=>{loading=null;throw e});return loading;
 }
 async function obtainCaptcha(){if(!config.turnstileSiteKey)return null;
  await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit','turnstile');
  const node=document.getElementById('profileCaptcha');if(!node)throw Error('CAPTCHA container missing');
  node.replaceChildren();return new Promise((resolve,reject)=>{
   try{window.turnstile.render(node,{sitekey:config.turnstileSiteKey,appearance:'interaction-only',callback:token=>resolve(token),'error-callback':()=>reject(new Error('CAPTCHA failed'))})}catch(e){reject(e)}
  });
 }
 async function restore(){if(!configured||!navigator.onLine)return null;const db=await getClient();
  const {data:{session},error}=await db.auth.getSession();if(error||!session)return null;
  const {data,error:e}=await db.from('profiles').select('user_id,nickname,country_code').eq('user_id',session.user.id).maybeSingle();
  if(e)throw e;return data;
 }
 async function saveProfile({name,country,language,notify}){
  if(!navigator.onLine)throw Error('Offline');const db=await getClient();
  let {data:{session},error:e}=await db.auth.getSession();if(e)throw e;
  if(!session){const captchaToken=await obtainCaptcha();
    const r=await db.auth.signInAnonymously(captchaToken?{options:{captchaToken}}:{});if(r.error)throw r.error;session=r.data.session;
    if(!session)throw Error('Session unavailable');}
  const uid=session.user.id;
  const {data:existing,error:lookError}=await db.from('profiles').select('user_id').eq('user_id',uid).maybeSingle();if(lookError)throw lookError;
  const payload={nickname:name,country_code:country||'ZZ'};
  const result=existing?await db.from('profiles').update(payload).eq('user_id',uid):await db.from('profiles').insert({user_id:uid,...payload});
  if(result.error)throw result.error;
  const {data:existingSettings,error:settingError}=await db.from('profile_settings').select('user_id').eq('user_id',uid).maybeSingle();if(settingError)throw settingError;
  const prefs={language_code:language,notify_invites:notify,notify_results:notify,notify_rematches:notify,notify_daily:notify,notify_important:notify};
  const r2=existingSettings?await db.from('profile_settings').update(prefs).eq('user_id',uid):await db.from('profile_settings').insert({user_id:uid,...prefs});
  if(r2.error)throw r2.error;
  return {userId:uid};
 }
 window.SudokuOnline={configured,get connected(){return !!client},restore,saveProfile};
})();
