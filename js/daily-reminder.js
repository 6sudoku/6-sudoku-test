/* 6 Sudoku TEST v0.12.8.9 - optional daily reminder with chosen local hour. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const locale = () => $('language')?.value || 'it';
 const tr = key => window.I18N?.[locale()]?.[key] || window.I18N?.it?.[key] || key;
 const cb = () => $('dailyReminderOptIn');
 const hour = () => $('dailyReminderHour');
 const row = () => $('dailyReminderHourRow');
 let busy=false, revision=0;
 const message = (key) => { const target=$('dailyReminderStatus'); if(target)target.textContent=tr(key); };
 const clock = n => String(n).padStart(2,'0')+':00';
 async function context(){
   if(!window.SudokuOnline?.configured)return null;
   const db=await window.SudokuOnline.getClient();
   const {data:{user},error}=await db.auth.getUser();
   return error||!user?null:{db,id:user.id};
 }
 function show(enabled){
   if(row())row().hidden=!enabled;
   if(hour())hour().disabled=!enabled || busy;
 }
 function status(){
   const t=$('dailyReminderStatus');if(!t)return;
   if(!cb()?.checked){message('dailyReminderOff');return;}
   t.textContent=tr('dailyReminderOnTime').replace('{time}',clock(Number(hour()?.value||18)));
   if(!('Notification' in window)||Notification.permission!=='granted')t.textContent+=' '+tr('dailyReminderEnablePush');
 }
 async function refresh(){
   if(busy||!cb()||!hour())return;
   const id=++revision;
   cb().disabled=true;hour().disabled=true;message('dailyReminderLoading');
   try{
    const ctx=await context();if(id!==revision)return;
    if(!ctx){cb().checked=false;show(false);message('dailyReminderSignIn');return;}
    const {data,error}=await ctx.db.from('profile_settings').select('notify_daily,reminder_hour').eq('user_id',ctx.id).maybeSingle();
    if(error)throw error;
    if(id!==revision)return;
    if(!data){cb().checked=false;show(false);message('dailyReminderSignIn');return;}
    cb().checked=data.notify_daily===true;
    hour().value=String(Number.isInteger(data.reminder_hour)?data.reminder_hour:18);
    show(cb().checked);status();cb().disabled=false;
   }catch(e){console.error('Reminder preference read',e);message('dailyReminderError');cb().disabled=true;hour().disabled=true;}
 }
 async function change(){
   if(busy||!cb()||!hour())return;
   const desired=cb().checked, selected=Number(hour().value);
   if(!Number.isInteger(selected)||selected<0||selected>23)return;
   busy=true;cb().disabled=true;hour().disabled=true;message('dailyReminderSaving');
   try{
    const ctx=await context();if(!ctx)throw Error('Sign in required');
    const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
    const patch={notify_daily:desired,reminder_hour:selected};
    if(/^[A-Za-z0-9_+\/-]{1,64}$/.test(tz))patch.time_zone=tz;
    const {data,error}=await ctx.db.from('profile_settings').update(patch).eq('user_id',ctx.id).select('notify_daily,reminder_hour').single();
    if(error)throw error;
    cb().checked=data.notify_daily===true;hour().value=String(data.reminder_hour);
    show(cb().checked);status();
   }catch(e){console.error('Reminder preference save',e);message('dailyReminderError');cb().checked=!desired;}
   finally{busy=false;cb().disabled=false;show(cb().checked);}
 }
 document.addEventListener('DOMContentLoaded',()=>{
   if(hour()){
     hour().replaceChildren();
     for(let i=0;i<24;i++){
       const option=document.createElement('option');option.value=String(i);option.textContent=clock(i);if(i===18)option.selected=true;hour().appendChild(option);
     }
     hour().addEventListener('change',change);
   }
   cb()?.addEventListener('change',change);
 });
 window.SudokuReminderPrefs={refresh};
})();
