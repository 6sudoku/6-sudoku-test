/* 6 Sudoku TEST v0.12.8.8 — preferenza promemoria quotidiano, OFF di default. */
(() => {
  'use strict';
  const cb = () => document.getElementById('dailyReminderOptIn');
  const output = () => document.getElementById('dailyReminderStatus');
  const locale = () => document.getElementById('language')?.value || 'it';
  const tr = (key) => window.I18N?.[locale()]?.[key] || window.I18N?.it?.[key] || key;
  const status = key => { if (output()) output().textContent = tr(key); };
  let working = false, revision = 0;
  const get = async () => {
    if (!window.SudokuOnline?.configured) return null;
    const db = await window.SudokuOnline.getClient();
    const { data: { user }, error: e } = await db.auth.getUser();
    if (e || !user) return null;
    return {db, id: user.id};
  };
  async function refresh() {
    const input = cb(); if (!input || working) return;
    const id = ++revision;
    input.disabled = true; status('dailyReminderLoading');
    try {
      const ctx = await get(); if (id !== revision) return;
      if (!ctx) { input.checked = false; status('dailyReminderSignIn'); return; }
      const { data, error } = await ctx.db.from('profile_settings').select('notify_daily').eq('user_id',ctx.id).maybeSingle();
      if (error) throw error;
      if (id !== revision) return;
      if (!data) { input.checked = false; status('dailyReminderSignIn'); return; }
      input.checked = data.notify_daily === true;
      status(input.checked ? 'dailyReminderOn' : 'dailyReminderOff');
      input.disabled = false;
    } catch(e) { console.error('Reminder preference read',e);status('dailyReminderError');input.disabled=true; }
  }
  async function change() {
    const input=cb(); if (!input || working) return;
    const desired=input.checked; working=true;input.disabled=true;status('dailyReminderSaving');
    try {
      const ctx=await get(); if(!ctx) throw new Error('Sign in required');
      const tz=Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const patch={notify_daily:desired};
      if(desired && /^[A-Za-z0-9_+\/-]{1,64}$/.test(tz)) patch.time_zone=tz;
      const {data,error}=await ctx.db.from('profile_settings').update(patch).eq('user_id',ctx.id).select('notify_daily').single();
      if(error) throw error;
      input.checked=data.notify_daily===true;
      status(input.checked ? 'dailyReminderOn':'dailyReminderOff');
      if(input.checked && (!('Notification' in window) || Notification.permission!=='granted')) {
        const el=output();if(el)el.textContent += ' '+tr('dailyReminderEnablePush');
      }
    } catch(e) {input.checked=!desired;status('dailyReminderError');console.error('Reminder preference update',e);}
    finally {input.disabled=false;working=false;}
  }
  document.addEventListener('DOMContentLoaded',()=>{cb()?.addEventListener('change',change);});
  window.SudokuReminderPrefs={refresh};
})();
