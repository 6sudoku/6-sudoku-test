/* 6 Sudoku TEST v0.12.6: game engine plus optional Supabase authentication. */
(() => {
'use strict';
const $=id=>document.getElementById(id), E=window.SudokuEngine;
const APP_VERSION='0.12.7', VERSION_URL='./version.json';
const STORE='6sudoku-test-v012-state', LANGKEY='6sudoku-test-lang', PROFILEKEY='6sudoku-test-profile';
const LEVELS=['beginner','intermediate','advanced','hero'];
const LANGS=[['it','🇮🇹 Italiano'],['en','🇬🇧 English'],['de','🇩🇪 Deutsch'],['fr','🇫🇷 Français'],['zh','🇨🇳 中文'],['ru','🇷🇺 Русский'],['ro','🇷🇴 Română'],['pl','🇵🇱 Polski']];
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch(_){return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}};
const safeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const countryEmoji=code=>((window.COUNTRIES||[]).find(c=>c[0]===code)||['','🌍'])[1];
const isInstalled=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const format=secs=>{secs=Math.max(0,Math.floor(secs));return String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')};
const date=()=>E.dateUTC();
const defaultLang=()=>{let l=(navigator.language||'it').toLowerCase().slice(0,2);return window.I18N[l]?l:'en'};
let lang=read(LANGKEY,defaultLang()), level='beginner', rankedLevel='beginner', current=null, selected=-1, noteMode=false, timer=null, lastTick=0;
let state=read(STORE,{stats:[],daily:{},attempts:{},active:null}), profile=read(PROFILEKEY,null), pendingDaily=false, installEvent=null, step=0, shareData=null;
let deepLink=null;
let swRegistration=null, pendingVersion=null, checking=false, updating=false, updateCheckOnHome=false, updateControllerSeen=false;
const versionParts=v=>String(v).split('.').map(x=>Number(x)||0);
const isNewer=v=>{const a=versionParts(v),b=versionParts(APP_VERSION);return a.some((n,i)=>n>(b[i]||0)&&a.slice(0,i).every((q,j)=>q===(b[j]||0)))};
function updateFeedback(key){const el=$('updateFeedback');if(el)el.textContent=key?tr(key):''}
function activeGame(){return !!(current&&!current.finished&&$('game').classList.contains('active'))}
function refreshAllowed(){return $('home').classList.contains('active')&&!document.querySelector('dialog[open]')}
function showUpdateIfReady(){if(!pendingVersion||!refreshAllowed())return;if(activeGame())return;$('updateDescription').textContent=tr('updateDescription',{version:pendingVersion});openDialog('updateDialog')}
async function checkForUpdate(silent=false){
 if(checking||updating)return;
 checking=true;if(!silent)updateFeedback('checkingUpdates');
 try{
  if(!navigator.onLine)throw Error('offline');
  const response=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('status '+response.status);
  const info=await response.json();if(!info||typeof info.version!=='string')throw Error('invalid version');
  if(isNewer(info.version)){
   pendingVersion=info.version;
   if(swRegistration)await swRegistration.update();
   updateFeedback('updateReady');showUpdateIfReady();
  }else if(!silent)updateFeedback('alreadyLatest');
 }catch(_){if(!silent)updateFeedback('updateOffline')}
 finally{checking=false}
}
function watchServiceWorker(){
 if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(updating&&!updateControllerSeen){updateControllerSeen=true;location.reload()}
 });
 navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).then(reg=>{
  swRegistration=reg;
  reg.addEventListener('updatefound',()=>{
   const worker=reg.installing;if(!worker)return;
   worker.addEventListener('statechange',()=>{
    if(worker.state==='installed'&&navigator.serviceWorker.controller&&pendingVersion)showUpdateIfReady();
   });
  });
  // Primo accesso da una PWA precedente: eseguiamo il controllo ma senza riavviare una partita.
  checkForUpdate(true);
 }).catch(()=>{checkForUpdate(true)});
}
async function applyUpdate(){
 if(activeGame()||!$('home').classList.contains('active')){updateFeedback('updateInGame');closeDialog('updateDialog');return}
 updating=true;closeDialog('updateDialog');updateFeedback('updatePreparing');
 try{
  if(!swRegistration||!navigator.serviceWorker.controller)throw Error('No active worker');
  await swRegistration.update();
  const worker=swRegistration.waiting;
  if(!worker)throw Error('Update not ready');
  worker.postMessage({type:'SKIP_WAITING'});
  // controllerchange effettua il riavvio soltanto se la nuova cache è pronta.
 }catch(_){updating=false;updateFeedback('updateFailed')}
}
function initPullRefresh(){
 const indicator=document.createElement('div');indicator.className='update-pull';indicator.setAttribute('aria-hidden','true');document.body.append(indicator);
 let startY=null,tracking=false;
 document.addEventListener('touchstart',ev=>{
  if(ev.touches.length!==1||!refreshAllowed()||window.scrollY>2||checking||updating){tracking=false;return}
  startY=ev.touches[0].clientY;tracking=true;
 },{passive:true});
 document.addEventListener('touchmove',ev=>{
  if(!tracking||!refreshAllowed()||ev.touches.length!==1)return;
  const distance=ev.touches[0].clientY-startY;
  if(distance>20){indicator.classList.add('visible');indicator.textContent=tr(distance>=85?'releaseUpdate':'pullUpdate')}
  else indicator.classList.remove('visible');
 },{passive:true});
 document.addEventListener('touchend',ev=>{
  if(!tracking)return;tracking=false;
  const distance=(ev.changedTouches[0]?.clientY||startY)-startY;
  indicator.classList.remove('visible');
  if(distance>=85&&refreshAllowed())checkForUpdate(false);
 },{passive:true});
 document.addEventListener('touchcancel',()=>{tracking=false;indicator.classList.remove('visible')},{passive:true});
}

const tr=(k,params={})=>{let s=window.I18N[lang]?.[k]??window.I18N.it[k]??k;return s.replace(/\{(\w+)\}/g,(_,key)=>params[key]??'')};
function changeLanguage(next){if(!window.I18N[next])return;lang=next;save(LANGKEY,lang);applyTexts();if(current){$('gameTitle').textContent=gameTitle();drawBoard();}if($('ranking').classList.contains('active'))drawRanking();if($('rulesDialog').open)renderRules();if($('installDialog').open)drawStep();if($('profileDialog').open){drawProfile();if(emailStatusKey)showEmailStatus(emailStatusKey,emailStatusParams)}drawDailyFeature();if($('dailyConfirmDialog').open)drawDailyConfirm();if($('updateDialog').open&&pendingVersion)$('updateDescription').textContent=tr('updateDescription',{version:pendingVersion});if($('updateFeedback').textContent)updateFeedback(pendingVersion?'updateReady':'')}
function applyTexts(){document.documentElement.lang=lang;$('language').value=lang;document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=tr(el.dataset.t)});$('notesBtn').textContent=tr(noteMode?'notesOn':'notesOff');document.querySelectorAll('[data-level]').forEach(el=>el.classList.toggle('active',el.dataset.level===level));document.querySelectorAll('[data-rank]').forEach(el=>el.classList.toggle('active',el.dataset.rank===rankedLevel));}
function show(id){if(id==='home'){drawDailyFeature();setTimeout(showUpdateIfReady,0)}document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===id));window.scrollTo?.(0,0);if(id==='ranking')drawRanking();if(id==='statsScreen')drawStats()}
function openDialog(id){if(!$(id).open)$(id).showModal()}
function closeDialog(id){if($(id).open)$(id).close()}
function todayKey(chosen=level){return date()+'|'+chosen}
function activeDaily(chosen=level){const a=state.active;return a?.mode==='daily'&&a.day===date()&&a.level===chosen&&!a.finished&&Array.isArray(a.values)&&a.values.length===36}
function dailyStatus(chosen=level){const key=todayKey(chosen);return state.daily[key]?'dailyStatusDone':activeDaily(chosen)?'dailyStatusActive':state.attempts?.[key]?'dailyStatusSpent':'dailyStatusNew'}
function drawDailyFeature(){const el=$('dailyFeatureStatus');if(el)el.textContent=tr(dailyStatus(),{level:tr(level)})}
function drawDailyConfirm(){$('dailyConfirmLevel').textContent=tr(level);$('dailyConfirmStart').textContent=tr('dailyStart')}
function askDaily(){if(!isInstalled()){step=0;openInstall();return}if(!profile?.name){pendingDaily=true;drawProfile();openDialog('profileDialog');return}
 const key=todayKey();if(state.daily[key]){rankedLevel=level;show('ranking');return}
 if(activeDaily()){current=state.active;enterGame();return}
 if(state.attempts[key]){alert(tr('dailyAlreadyStarted'));rankedLevel=level;show('ranking');return}
 drawDailyConfirm();openDialog('dailyConfirmDialog')}
function confirmDaily(){closeDialog('dailyConfirmDialog');const key=todayKey();if(state.attempts[key]||state.daily[key]){askDaily();return}const g=buildGame('daily',level,'daily-'+date());state.attempts[key]={startedAt:new Date().toISOString()};current=g;state.active=g;saveState();enterGame()}
function initPreview(){const nums=[2,0,5,1,0,6,0,4,0,3,2,0,4,1,0,6,0,3,0,6,2,0,5,1,3,0,4,2,0,5,0,5,1,0,6,4];$('previewGrid').innerHTML=nums.map((n,i)=>`<span class="preview-cell ${n&&i%3?'tint':''}">${n||''}</span>`).join('')}
function normalizeState(){if(!state||typeof state!=='object')state={};if(!Array.isArray(state.stats))state.stats=[];if(!state.daily||typeof state.daily!=='object')state.daily={};if(!state.attempts||typeof state.attempts!=='object')state.attempts={};if(!state.active||typeof state.active!=='object')state.active=null;}
function saveState(){if(current&&!current.finished){state.active={...current,notes:current.notes.map(a=>[...a])}}save(STORE,state)}
function getChallengeParams(){const q=new URLSearchParams(location.search),s=q.get('s'),d=q.get('d'),t=q.get('t');if(!s&&!d&&!t)return null;if(!s||!LEVELS.includes(d)||!/^[a-zA-Z0-9_\-]{1,60}$/.test(s)){return {invalid:true}}const time=t!==null&&/^\d{1,6}$/.test(t)?Math.min(86400,Number(t)):null;return {seed:s,level:d,target:time}}
function newSeed(){if(crypto?.getRandomValues){let arr=new Uint32Array(2);crypto.getRandomValues(arr);return Array.from(arr,n=>n.toString(36)).join('')}return Math.random().toString(36).slice(2,14)}
function buildGame(mode,chosen,seed,target=null){let grid=E.create(seed,chosen);return {mode,seed,level:chosen,puzzle:grid.puzzle,solution:grid.solution,values:[...grid.puzzle],notes:Array.from({length:36},()=>[]),elapsed:0,hints:0,day:mode==='daily'?date():null,target,finished:false}}
function gameTitle(){return current.mode==='daily'?tr('daily'):current.mode==='challenge'?tr('friendChallenge'):tr(current.level)}
function start(mode){if(mode==='daily'){askDaily();return}
 if(mode==='challenge'){if(!deepLink||deepLink.invalid){alert(tr('invalidLink'));return}current=buildGame('challenge',deepLink.level,deepLink.seed,deepLink.target)}
 else{current=buildGame('free',level,newSeed())}
 state.active=current;saveState();enterGame()}
function enterGame(){selected=-1;noteMode=false;lastTick=Date.now();$('gameTitle').textContent=gameTitle();$('timer').textContent=format(current.elapsed);$('challengeBox').classList.toggle('hidden',current.target===null||current.target===undefined);$('beatTime').textContent=current.target===null?'':format(current.target);$('hintBtn').hidden=current.mode==='daily';$('feedback').textContent='';applyTexts();drawBoard();show('game');startTimer()}
function startTimer(){clearInterval(timer);lastTick=Date.now();timer=setInterval(()=>{if(!current||current.finished||$('game').classList.contains('active')===false)return;if(document.visibilityState==='hidden'){lastTick=Date.now();return}const now=Date.now();const seconds=Math.floor((now-lastTick)/1000);if(seconds>0){current.elapsed+=seconds;lastTick+=seconds*1000;$('timer').textContent=format(current.elapsed);if(seconds||current.elapsed%5===0)saveState()}},250)}
function pauseTimer(){clearInterval(timer);if(current&&!current.finished&&$('game').classList.contains('active')){let now=Date.now(),delta=document.visibilityState==='visible'?Math.floor((now-lastTick)/1000):0;if(delta>0)current.elapsed+=delta;saveState()}}
function drawBoard(){if(!current)return;const el=$('board');el.replaceChildren();current.values.forEach((num,i)=>{const b=document.createElement('button');b.type='button';b.className='cell';b.setAttribute('role','gridcell');b.setAttribute('aria-label',`R${Math.floor(i/6)+1} C${i%6+1} ${num||'-'}`);if(current.puzzle[i])b.classList.add('fixed');if(i===selected)b.classList.add('selected');else if(selected>=0&&(Math.floor(i/6)===Math.floor(selected/6)||i%6===selected%6))b.classList.add('related');if(num&&E.candidates([...current.values.slice(0,i),0,...current.values.slice(i+1)],i).indexOf(num)<0)b.classList.add('wrong');if(num)b.textContent=num;else if(current.notes[i]?.length){const notes=document.createElement('span');notes.className='notes-grid';for(let n=1;n<=6;n++){const t=document.createElement('span');t.textContent=current.notes[i].includes(n)?n:'';notes.append(t)}b.append(notes)}b.addEventListener('click',()=>{selected=i;drawBoard()});el.append(b)})}
function enterNumber(n){if(!current||selected<0){$('feedback').textContent=tr('selectCell');return}if(current.puzzle[selected])return;if(noteMode){let vals=new Set(current.notes[selected]);if(vals.has(n))vals.delete(n);else vals.add(n);current.notes[selected]=[...vals].sort();drawBoard();saveState();return}current.values[selected]=n;current.notes[selected]=[];drawBoard();saveState();if(current.values.every((v,i)=>v===current.solution[i]))win()}
function erase(){if(!current||selected<0||current.puzzle[selected])return;current.values[selected]=0;current.notes[selected]=[];$('feedback').textContent='';drawBoard();saveState()}
function hint(){if(!current)return;if(current.mode==='daily'){$('feedback').textContent=tr('noHintDaily');return}let i=selected;if(i<0||current.values[i]===current.solution[i])i=current.values.findIndex((v,j)=>v!==current.solution[j]);if(i<0)return;current.values[i]=current.solution[i];current.notes[i]=[];current.hints++;current.elapsed+=30;$('timer').textContent=format(current.elapsed);$('feedback').textContent=tr('hintUsed');drawBoard();saveState();if(current.values.every((v,j)=>v===current.solution[j]))win()}
function win(){clearInterval(timer);current.finished=true;let result={day:date(),mode:current.mode,level:current.level,score:current.elapsed,hints:current.hints,seed:current.seed};state.stats.push(result);state.stats=state.stats.slice(-500);if(current.mode==='daily'){const key=current.day+'|'+current.level;if(!state.daily[key])state.daily[key]=result;if(!state.attempts[key])state.attempts[key]={startedAt:new Date().toISOString()}}state.active=null;save(STORE,state);$('winTime').textContent=format(current.elapsed);$('winDetails').textContent=tr('finishedDetail',{level:tr(current.level),hints:current.hints});let comparison='';if(current.target!==null){comparison=current.elapsed<current.target?tr('winBeat'):current.elapsed>current.target?tr('winLost'):tr('winTie')}$('winCompare').textContent=comparison;openDialog('winDialog')}
function goHome(){pauseTimer();show('home')}
function drawStats(){let all=state.stats||[],today=all.filter(s=>s.day===date()),best=all.length?Math.min(...all.map(s=>s.score)):null;$('statWins').textContent=all.length;$('statToday').textContent=today.length;$('statBest').textContent=best===null?'—':format(best);$('statDaily').textContent=all.filter(s=>s.mode==='daily').length}
function drawRanking(){const key=date()+'|'+rankedLevel,r=state.daily[key];$('rankingDate').textContent=date()+' · UTC';$('rankName').textContent=profile?.name||'—';$('rankCountry').textContent=profile?.country?countryEmoji(profile.country):'';$('rankTime').textContent=r?format(r.score):'—:—';$('ranking').querySelector('.you').classList.toggle('hidden',!r||!profile);$('rankStatus').textContent=r?tr('dailyDoneMsg'):tr(profile?'noDaily':'noProfile');document.querySelectorAll('[data-rank]').forEach(b=>b.classList.toggle('active',b.dataset.rank===rankedLevel))}

let emailStatusKey='', emailStatusParams={};
async function refreshEmailUI(){
 const online=window.SudokuOnline;
 if(!online?.configured){$('emailProtectionStatus').textContent=tr('profileLocalOnly');return}
 try{
  const info=await online.accountState();
  const verified=info.verified&&info.email;
  if(verified){$('profileEmail').value=info.email;$('emailProtectionStatus').textContent=tr('emailVerified');}
  else if(info.userId){$('emailProtectionStatus').textContent=tr('emailNotVerified');}
  else $('emailProtectionStatus').textContent=tr('emailNeedProfile');
  $('linkEmailBtn').disabled=!info.userId||verified;
  $('profileEmail').disabled=!!verified;
 }catch(_){$('emailProtectionStatus').textContent=tr('emailNetworkError')}
}
async function linkProfileEmail(){
 const address=$('profileEmail').value.trim();if(!$('profileEmail').checkValidity()||!address){showEmailStatus('emailInvalid');return}
 const btn=$('linkEmailBtn');btn.disabled=true;showEmailStatus('emailSending');
 try{
  const info=await window.SudokuOnline.accountState();
  if(!info.userId){showEmailStatus('emailNeedProfile');return}
  const result=await window.SudokuOnline.linkEmail(address);
  if(result.already){showEmailStatus('emailVerified');return}
  save('6sudoku-test-email-pending',{userId:result.userId,email:address});showEmailStatus('emailSent');
 }catch(e){showEmailStatus('emailFailed',{error:e.message||''})}
 finally{btn.disabled=false}
}
async function recoverProfileEmail(){
 const address=$('recoveryEmail').value.trim();if(!$('recoveryEmail').checkValidity()||!address){showEmailStatus('emailInvalid');return}
 const btn=$('recoverEmailBtn');btn.disabled=true;showEmailStatus('emailSending');
 try{await window.SudokuOnline.sendRecovery(address);showEmailStatus('emailRecoverySent')}
 catch(e){showEmailStatus('emailFailed',{error:e.message||''})}
 finally{btn.disabled=false}
}
function showEmailStatus(key,params={}){emailStatusKey=key;emailStatusParams=params;$('emailProtectionStatus').textContent=tr(key,params)}
let lastRecoveredId=null;
async function reconcileOnlineIdentity(){
 if(!window.SudokuOnline?.configured)return;
 try{
  const p=await window.SudokuOnline.fetchVerifiedProfile();
  if(!p)return;
  if(lastRecoveredId===p.user_id)return;
  const changed=profile?.id!==p.user_id;
  lastRecoveredId=p.user_id;
  profile={id:p.user_id,name:p.nickname,country:p.country_code==='ZZ'?'':p.country_code};
  save(PROFILEKEY,profile);drawRanking();
  const pending=read('6sudoku-test-email-pending',null);
  const info=await window.SudokuOnline.accountState();
  if(pending&&pending.userId===p.user_id&&info.verified){localStorage.removeItem('6sudoku-test-email-pending');showEmailStatus('emailVerified')}
  if(changed){if($('profileDialog').open){drawProfile();showEmailStatus('emailRecovered')}}
 }catch(_){/* Il gioco libero resta disponibile anche quando Supabase è offline. */}
}

function drawProfile(){refreshEmailUI();if($('profileNotif'))$('profileNotif').checked=read('6sudoku-test-notifications',true);refreshProfileConnection();const el=$('country');el.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='🌍 '+tr('countryNone');el.append(none);for(const [code,emoji] of window.COUNTRIES||[]){if(!code)continue;const o=document.createElement('option');o.value=code;o.textContent=emoji+' '+code;el.append(o)}$('nickname').value=profile?.name||'';$('country').value=profile?.country||'';updatePreview()}
function updatePreview(){let name=$('nickname').value.trim()||'—',country=$('country').value;$('namePreview').textContent=name+' '+(country?countryEmoji(country):'')}
function refreshProfileConnection(message){const el=$('profileConnection');if(!el)return;const online=window.SudokuOnline;el.textContent=message||tr(!online?.configured?'profileLocalOnly':online.connected?'profileConnected':'profileReady');}
async function saveProfile(event){event.preventDefault();const name=$('nickname').value.trim();if(name.length<2||name.length>20){alert(tr('chooseNickname'));return}
 const country=$('country').value;const notify=$('profileNotif').checked;save('6sudoku-test-notifications',notify);
 const btn=$('saveProfileBtn');btn.disabled=true;
 let onlineId=null;
 try{if(window.SudokuOnline?.configured){refreshProfileConnection(tr('profileConnecting'));const result=await window.SudokuOnline.saveProfile({name,country,language:lang,notify});onlineId=result.userId;}}
 catch(err){btn.disabled=false;refreshProfileConnection(tr('profileSyncFailed')+(err?.message?' ('+err.message+')':''));return}
 finally{btn.disabled=false}
 profile={id:onlineId||profile?.id||'p-'+newSeed(),name,country};save(PROFILEKEY,profile);closeDialog('profileDialog');drawRanking();if(pendingDaily){pendingDaily=false;askDaily()}}
function renderRules(){const box=$('rulesContent');box.replaceChildren();(window.RULES[lang]||window.RULES.it).forEach(([title,body],i)=>{const section=document.createElement('section');section.className='rules-section';const h=document.createElement('h3');h.textContent=(i+1)+'. '+title;const p=document.createElement('p');p.textContent=body;section.append(h,p);box.append(section)})}
function openInstall(){if(isInstalled())return;$('installSteps').classList.remove('hidden');$('androidInstall').classList.add('hidden');if(!/iPad|iPhone|iPod/.test(navigator.userAgent)){if(installEvent||/Android/i.test(navigator.userAgent)){$('installSteps').classList.add('hidden');$('androidInstall').classList.remove('hidden')}}drawStep();openDialog('installDialog')}
function drawStep(){const icons=['🌐','📤','➕','📲','🧩'];$('stepIllustration').textContent=icons[step];$('stepCount').textContent=tr('stepOf',{current:step+1});$('stepTitle').textContent=tr('stepTitle'+(step+1));$('stepBody').textContent=tr('stepBody'+(step+1));$('stepPrev').disabled=step===0;$('stepNext').textContent=step===4?tr('understood'):tr('next')}
async function requestInstall(){if(installEvent){installEvent.prompt();try{await installEvent.userChoice}catch(_){}installEvent=null;closeDialog('installDialog')}else openInstall()}
function challengeURL(){const u=new URL('./',location.href);if(!current)return u.href;u.searchParams.set('s',current.seed);u.searchParams.set('d',current.level);if(current.finished)u.searchParams.set('t',String(current.elapsed));return u.href}
function buildShare(appOnly){const url=appOnly?new URL('./',location.href).href:challengeURL();const vars={url,time:current?format(current.elapsed):'',level:current?tr(current.level):'',hints:current?.hints?tr('shareWithHints',{count:current.hints}):''};return {url,message:tr(appOnly?'shareAppMessage':current?.finished?'shareChallengeMessage':'shareOpenMessage',vars)}}
function openShare(appOnly){shareData=buildShare(appOnly);openDialog('shareDialog')}
function shareWhatsApp(){if(!shareData)return;const text=shareData.message;window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener,noreferrer')}
async function shareNative(){if(!shareData)return;try{if(navigator.share){await navigator.share({title:'6 Sudoku',text:shareData.message});return}}catch(e){if(e.name==='AbortError')return}await copyLink()}
async function copyLink(){if(!shareData)return;try{await navigator.clipboard.writeText(shareData.url);alert(tr('copied'))}catch(_){window.prompt(tr('copyFail'),shareData.url)}}
function wire(){LANGS.forEach(([code,name])=>{let opt=document.createElement('option');opt.value=code;opt.textContent=name;$('language').append(opt)});$('language').onchange=e=>changeLanguage(e.target.value);document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=b.dataset.level;applyTexts();drawDailyFeature()});$('freeBtn').onclick=()=>start('free');$('dailyBtn').onclick=askDaily;$('dailyConfirmStart').onclick=confirmDaily;$('rankingBtn').onclick=()=>show('ranking');$('statsBtn').onclick=()=>show('statsScreen');$('rulesBtn').onclick=$('rulesGameBtn').onclick=()=>{renderRules();openDialog('rulesDialog')};$('shareAppBtn').onclick=()=>openShare(true);$('checkUpdatesBtn').onclick=()=>checkForUpdate(false);$('updateLater').onclick=()=>closeDialog('updateDialog');$('updateNow').onclick=applyUpdate;$('installBtn').onclick=openInstall;document.querySelectorAll('[data-back]').forEach(b=>b.onclick=goHome);$('rankingTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{rankedLevel=b.dataset.rank;drawRanking()});$('editProfileBtn').onclick=()=>{drawProfile();openDialog('profileDialog');window.SudokuPush?.refresh().catch(()=>{})};$('rankDailyBtn').onclick=()=>{level=rankedLevel;applyTexts();start('daily')};$('profileForm').onsubmit=saveProfile;$('linkEmailBtn').onclick=linkProfileEmail;$('recoverEmailBtn').onclick=recoverProfileEmail;$('nickname').addEventListener('input',updatePreview);$('country').addEventListener('change',updatePreview);document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));$('numkeys').innerHTML=Array.from({length:6},(_,i)=>`<button type="button">${i+1}</button>`).join('');$('numkeys').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>enterNumber(i+1));$('eraseBtn').onclick=erase;$('notesBtn').onclick=()=>{noteMode=!noteMode;applyTexts();$('notesBtn').classList.toggle('active',noteMode)};$('hintBtn').onclick=hint;$('stepPrev').onclick=()=>{step=Math.max(0,step-1);drawStep()};$('stepNext').onclick=()=>{if(step===4)closeDialog('installDialog');else{step++;drawStep()}};$('installConfirm').onclick=requestInstall;$('winNew').onclick=()=>{closeDialog('winDialog');start('free')};$('winHome').onclick=()=>{closeDialog('winDialog');show('home')};$('winShare').onclick=()=>{closeDialog('winDialog');openShare(false)};$('whatsappBtn').onclick=shareWhatsApp;$('nativeShareBtn').onclick=shareNative;$('copyLinkBtn').onclick=copyLink;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e});window.addEventListener('appinstalled',()=>{$('installBanner').classList.add('hidden');closeDialog('installDialog')});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseTimer();else if(current&&!current.finished&&$('game').classList.contains('active'))startTimer()});window.addEventListener('pagehide',()=>{pauseTimer();saveState()})}
function init(){normalizeState();if(window.SudokuOnline?.configured){reconcileOnlineIdentity();window.SudokuOnline.watchAuth(()=>reconcileOnlineIdentity()).catch(()=>{});}initPreview();wire();applyTexts();drawDailyFeature();$('installBanner').classList.toggle('hidden',isInstalled());deepLink=getChallengeParams();if(deepLink?.invalid){alert(tr('invalidLink'))}else if(deepLink){level=deepLink.level;applyTexts();start('challenge')}else if(state.active&&!state.active.finished){const a=state.active;if(a.mode==='daily'&&a.day!==date()){state.active=null;saveState();return}if(a.mode==='daily'&&!isInstalled()){openInstall();return}if(Array.isArray(a.values)&&a.values.length===36&&Array.isArray(a.solution)&&a.solution.length===36){current=a;enterGame()}}initPullRefresh();watchServiceWorker();}
init();
})();
