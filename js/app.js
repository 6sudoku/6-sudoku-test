/* 6 Sudoku TEST v0.12.6: game engine plus optional Supabase authentication. */
(() => {
'use strict';
const $=id=>document.getElementById(id), E=window.SudokuEngine;
const APP_VERSION='0.12.8.7', VERSION_URL='./version.json';
const STORE='6sudoku-test-v012-state', LANGKEY='6sudoku-test-lang', PROFILEKEY='6sudoku-test-profile';
const LEVELS=['beginner','intermediate','advanced','hero'];
const LEVEL_LABELS={beginner:'🌱 ZEN',intermediate:'⚡ FOCUS',advanced:'💪 MASTER',hero:'👑 HERO'};
const levelLabel=key=>LEVEL_LABELS[key]||key;
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
let remoteDailyBusy=false, lastRankingPayload=null, dailyShareRecord=null;
const rankMessages={
 it:['Caricamento classifica mondiale…','Nessun risultato registrato oggi.','Classifica temporaneamente non disponibile.','Registra prima il tuo profilo per consultare la classifica.','Tempo ufficiale calcolato dal server.','Connessione necessaria per la Sfida quotidiana online.','Il server non ha confermato il risultato. Controlla la connessione e completa nuovamente l’ultima casella.'],
 en:['Loading worldwide ranking…','No results today.','Ranking temporarily unavailable.','Create your profile to view the ranking.','Official time measured by the server.','Online connection required for the daily challenge.','The server did not confirm the result. Check your connection and complete the last cell again.'],
 de:['Weltrangliste wird geladen…','Heute noch keine Ergebnisse.','Rangliste vorübergehend nicht verfügbar.','Erstelle zuerst dein Profil.','Offizielle Zeit vom Server gemessen.','Online-Verbindung für die Tagesaufgabe erforderlich.','Ergebnis nicht bestätigt. Verbindung prüfen und letztes Feld erneut ausfüllen.'],
 fr:['Chargement du classement mondial…','Aucun résultat aujourd’hui.','Classement temporairement indisponible.','Créez votre profil pour voir le classement.','Temps officiel mesuré par le serveur.','Connexion requise pour le défi quotidien.','Résultat non confirmé. Vérifiez la connexion et remplissez la dernière case à nouveau.'],
 zh:['正在加载世界排行榜…','今日暂无成绩。','排行榜暂时不可用。','请先创建个人资料。','官方时间由服务器计时。','每日挑战需要网络连接。','服务器未确认成绩。检查网络并重新填写最后一格。'],
 ru:['Загрузка мирового рейтинга…','Сегодня результатов нет.','Рейтинг временно недоступен.','Сначала создайте профиль.','Официальное время измеряется сервером.','Для ежедневного задания нужен интернет.','Сервер не подтвердил результат. Проверьте связь и повторно заполните последнюю клетку.'],
 ro:['Se încarcă clasamentul mondial…','Niciun rezultat astăzi.','Clasamentul nu este disponibil momentan.','Creează mai întâi un profil.','Timpul oficial este măsurat de server.','Este necesară conexiunea pentru provocarea zilnică.','Serverul nu a confirmat rezultatul. Verifică conexiunea și completează din nou ultima celulă.'],
 pl:['Ładowanie rankingu światowego…','Brak wyników na dziś.','Ranking chwilowo niedostępny.','Najpierw utwórz profil.','Oficjalny czas mierzy serwer.','Wyzwanie dnia wymaga połączenia z siecią.','Serwer nie potwierdził wyniku. Sprawdź sieć i ponownie wypełnij ostatnie pole.']
};
const uiStrings={"it":{"launch":"🔥 Lancia la sfida!","viewRank":"Visualizza classifica mondiale","alreadyTitle":"Hai già completato la sfida {level} di oggi!","alreadyBody":"Il tuo tempo è registrato nella classifica mondiale. Torna domani per una nuova sfida!","winDaily":"Complimenti! Hai completato {level}. Il tuo risultato è nella classifica mondiale.","totalPlayers":"Giocatori oggi: {count}","yourPosition":"La tua posizione","topTen":"I primi 10","dailyShareTitle":"La tua sfida di oggi","shareLine1":"🧩 Pensi di essere più veloce di me? 😏","shareLine2":"Ho appena completato {level} di 6 Sudoku!","shareLine3":"⏱️ Il mio tempo ufficiale: {time}","shareLine4":"🏆 Riesci a battermi nella classifica mondiale?","shareLine5":"6 numeri. Una sfida. Vediamo chi è il migliore! 💪","inviteTitle":"{name} ti ha lanciato una sfida!","inviteBody":"Riesci a battere il tempo di {time} in {level}?","joinChallenge":"Partecipa alla sfida","oldInvitation":"La sfida condivisa è di un altro giorno. Puoi giocare quella di oggi!","backRanking":"Torna alla classifica","notFinished":"Non hai ancora completato la sfida di oggi."},"en":{"launch":"🔥 Challenge your friends!","viewRank":"View world ranking","alreadyTitle":"You already completed today’s {level} challenge!","alreadyBody":"Your result is in the world ranking. Come back tomorrow!","winDaily":"Congratulations! You completed {level}. Your result is in the world ranking.","totalPlayers":"Players today: {count}","yourPosition":"Your position","topTen":"Top 10","dailyShareTitle":"Your daily challenge","shareLine1":"🧩 Think you can beat my time? 😏","shareLine2":"I just completed {level} on 6 Sudoku!","shareLine3":"⏱️ My official time: {time}","shareLine4":"🏆 Can you beat me on the world ranking?","shareLine5":"6 numbers. One challenge. Let’s see who is best! 💪","inviteTitle":"{name} challenged you!","inviteBody":"Can you beat {time} on {level}?","joinChallenge":"Join the challenge","oldInvitation":"This invitation is from a previous day. You can play today’s challenge!","backRanking":"Back to ranking","notFinished":"You haven’t finished today’s challenge yet."},"de":{"launch":"🔥 Fordere Freunde heraus!","viewRank":"Weltrangliste ansehen","alreadyTitle":"Du hast die heutige {level}-Challenge bereits abgeschlossen!","alreadyBody":"Dein Ergebnis steht in der Weltrangliste. Komm morgen wieder!","winDaily":"Glückwunsch! {level} geschafft. Dein Ergebnis steht in der Weltrangliste.","totalPlayers":"Spieler heute: {count}","yourPosition":"Dein Platz","topTen":"Top 10","dailyShareTitle":"Deine Tageschallenge","shareLine1":"🧩 Glaubst du, du bist schneller als ich? 😏","shareLine2":"Ich habe {level} bei 6 Sudoku geschafft!","shareLine3":"⏱️ Meine offizielle Zeit: {time}","shareLine4":"🏆 Kannst du mich in der Weltrangliste schlagen?","shareLine5":"6 Zahlen. Eine Challenge. Wer ist der Beste? 💪","inviteTitle":"{name} fordert dich heraus!","inviteBody":"Schaffst du {time} bei {level}?","joinChallenge":"Challenge starten","oldInvitation":"Diese Einladung ist von einem anderen Tag. Spiele die heutige Challenge!","backRanking":"Zur Rangliste","notFinished":"Du hast die heutige Challenge noch nicht abgeschlossen."},"fr":{"launch":"🔥 Lance le défi !","viewRank":"Voir le classement mondial","alreadyTitle":"Tu as déjà terminé le défi {level} du jour !","alreadyBody":"Ton résultat est enregistré. Reviens demain !","winDaily":"Bravo ! Tu as terminé {level}. Ton résultat est au classement mondial.","totalPlayers":"Joueurs aujourd’hui : {count}","yourPosition":"Ta position","topTen":"Top 10","dailyShareTitle":"Ton défi quotidien","shareLine1":"🧩 Tu penses être plus rapide que moi ? 😏","shareLine2":"Je viens de terminer {level} sur 6 Sudoku !","shareLine3":"⏱️ Mon temps officiel : {time}","shareLine4":"🏆 Peux-tu me battre au classement mondial ?","shareLine5":"6 chiffres. Un défi. À qui la victoire ? 💪","inviteTitle":"{name} t’a lancé un défi !","inviteBody":"Peux-tu battre {time} en {level} ?","joinChallenge":"Participer au défi","oldInvitation":"Ce défi date d’un autre jour. Tu peux jouer celui d’aujourd’hui !","backRanking":"Retour au classement","notFinished":"Tu n’as pas encore terminé le défi du jour."},"zh":{"launch":"🔥 发起挑战！","viewRank":"查看世界排行榜","alreadyTitle":"你今天已经完成 {level} 挑战！","alreadyBody":"成绩已记录在世界排行榜。明天再来！","winDaily":"恭喜！你完成了 {level}，成绩已记录。","totalPlayers":"今日玩家：{count}","yourPosition":"你的排名","topTen":"前十名","dailyShareTitle":"今日挑战","shareLine1":"🧩 你能比我更快吗？😏","shareLine2":"我刚完成 6 Sudoku 的 {level}！","shareLine3":"⏱️ 我的官方成绩：{time}","shareLine4":"🏆 你能在排行榜上超过我吗？","shareLine5":"6个数字，一场挑战！💪","inviteTitle":"{name} 向你发起挑战！","inviteBody":"你能在 {level} 打破 {time} 吗？","joinChallenge":"参加挑战","oldInvitation":"这条邀请来自之前的日期。欢迎挑战今天的题目！","backRanking":"返回排行榜","notFinished":"你还没有完成今天的挑战。"},"ru":{"launch":"🔥 Брось вызов!","viewRank":"Открыть мировой рейтинг","alreadyTitle":"Сегодняшний {level} уже пройден!","alreadyBody":"Результат сохранён. Возвращайся завтра!","winDaily":"Поздравляем! {level} пройден, результат в мировом рейтинге.","totalPlayers":"Игроков сегодня: {count}","yourPosition":"Твоя позиция","topTen":"Топ-10","dailyShareTitle":"Твой ежедневный вызов","shareLine1":"🧩 Думаешь, ты быстрее меня? 😏","shareLine2":"Я прошёл {level} в 6 Sudoku!","shareLine3":"⏱️ Моё официальное время: {time}","shareLine4":"🏆 Сможешь обойти меня в мировом рейтинге?","shareLine5":"6 цифр. Один вызов! 💪","inviteTitle":"{name} бросил тебе вызов!","inviteBody":"Сможешь побить {time} в {level}?","joinChallenge":"Принять вызов","oldInvitation":"Это приглашение за другой день. Играй сегодня!","backRanking":"Назад к рейтингу","notFinished":"Сегодняшнее задание ещё не завершено."},"ro":{"launch":"🔥 Lansează provocarea!","viewRank":"Vezi clasamentul mondial","alreadyTitle":"Ai terminat deja provocarea {level} de azi!","alreadyBody":"Rezultatul tău este în clasament. Revino mâine!","winDaily":"Felicitări! Ai terminat {level}. Rezultatul este în clasament.","totalPlayers":"Jucători azi: {count}","yourPosition":"Poziția ta","topTen":"Top 10","dailyShareTitle":"Provocarea zilnică","shareLine1":"🧩 Crezi că ești mai rapid? 😏","shareLine2":"Am terminat {level} la 6 Sudoku!","shareLine3":"⏱️ Timpul meu oficial: {time}","shareLine4":"🏆 Mă poți întrece în clasamentul mondial?","shareLine5":"6 numere. O provocare! 💪","inviteTitle":"{name} te-a provocat!","inviteBody":"Poți depăși {time} la {level}?","joinChallenge":"Acceptă provocarea","oldInvitation":"Invitația este pentru altă zi. Joacă provocarea de azi!","backRanking":"Înapoi la clasament","notFinished":"Nu ai terminat încă provocarea de azi."},"pl":{"launch":"🔥 Rzuć wyzwanie!","viewRank":"Zobacz ranking światowy","alreadyTitle":"Dzisiejsze wyzwanie {level} jest już ukończone!","alreadyBody":"Twój wynik jest w rankingu. Wróć jutro!","winDaily":"Gratulacje! Ukończono {level}. Wynik jest w rankingu.","totalPlayers":"Graczy dzisiaj: {count}","yourPosition":"Twoja pozycja","topTen":"Top 10","dailyShareTitle":"Dzisiejsze wyzwanie","shareLine1":"🧩 Myślisz, że jesteś szybszy? 😏","shareLine2":"Właśnie ukończyłem {level} w 6 Sudoku!","shareLine3":"⏱️ Mój oficjalny czas: {time}","shareLine4":"🏆 Pokonasz mnie w rankingu światowym?","shareLine5":"6 cyfr. Jedno wyzwanie! 💪","inviteTitle":"{name} rzuca ci wyzwanie!","inviteBody":"Pobijesz {time} w {level}?","joinChallenge":"Dołącz do wyzwania","oldInvitation":"Zaproszenie dotyczy innego dnia. Zagraj dzisiaj!","backRanking":"Wróć do rankingu","notFinished":"Nie ukończyłeś jeszcze dzisiejszego wyzwania."}};
for(const [locale,msg] of Object.entries({"it": "⏰ Questa sfida è terminata! Ma ce n’è una nuova oggi. Vuoi giocare?", "en": "⏰ This challenge has ended! There’s a new one today. Want to play?", "de": "⏰ Diese Challenge ist vorbei! Heute gibt es eine neue. Spielst du mit?", "fr": "⏰ Ce défi est terminé ! Il y en a un nouveau aujourd’hui. Tu joues ?", "zh": "⏰ 这场挑战已结束！今天有新挑战，来玩吗？", "ru": "⏰ Этот вызов завершён! Сегодня есть новый. Сыграем?", "ro": "⏰ Provocarea s-a încheiat! Azi te așteaptă una nouă. Vrei să joci?", "pl": "⏰ To wyzwanie już się skończyło! Dzisiaj jest nowe. Zagracie?"}))uiStrings[locale].oldInvitation=msg;
const ui=(key,params={})=>(uiStrings[lang]||uiStrings.it)[key].replace(/\{(\w+)\}/g,(_,k)=>params[k]??'');
const rankText=n=>(rankMessages[lang]||rankMessages.it)[n];
async function dailyApi(action,difficulty,values){
 if(!window.SudokuOnline?.configured||!navigator.onLine)throw Error('Offline or no Supabase');
 const db=await window.SudokuOnline.getClient();
 const {data:{session},error}=await db.auth.getSession();
 if(error||!session)throw Error('Player profile not connected');
 const {data,response,error:err}=await db.functions.invoke('daily-ranking',{body:{action,difficulty,...(values?{values}:{})}});
 if(err)throw err;
 if(data?.error)throw Error(data.error);
 return data;
}
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
function changeLanguage(next){if(!window.I18N[next])return;const unsavedCountry=$('profileDialog').open?$('country').value:null;lang=next;save(LANGKEY,lang);applyTexts();if(current){$('gameTitle').textContent=gameTitle();drawBoard();}if($('ranking').classList.contains('active'))drawRanking();if($('rulesDialog').open)renderRules();if($('installDialog').open)drawStep();if($('profileDialog').open){drawProfile();if(unsavedCountry!==null){$('country').value=unsavedCountry;updatePreview()}if(emailStatusKey)showEmailStatus(emailStatusKey,emailStatusParams)}if($('dailyInviteDialog').open&&isIOSBrowser()){for(const id of ['iosInviteHelp','iosInviteQuestion','iosInviteCopy','iosInviteNew','iosStepOne','iosStepTwo','iosStepThree'])$(id).textContent=tr(id)}drawDailyFeature();if($('dailyConfirmDialog').open)drawDailyConfirm();if($('updateDialog').open&&pendingVersion)$('updateDescription').textContent=tr('updateDescription',{version:pendingVersion});if($('updateFeedback').textContent)updateFeedback(pendingVersion?'updateReady':'')}
function applyTexts(){document.documentElement.lang=lang;$('language').value=lang;document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=tr(el.dataset.t)});$('notesBtn').textContent=tr(noteMode?'notesOn':'notesOff');document.querySelectorAll('[data-level]').forEach(el=>{const node=el.querySelector('.level-copy strong');if(node)node.textContent=levelLabel(el.dataset.level)});document.querySelectorAll('[data-rank]').forEach(el=>{el.textContent=levelLabel(el.dataset.rank)});$('dailyConfirmLevel').textContent=levelLabel(level);$('rankShareBtn').textContent=ui('launch');$('winShare').textContent=current?.mode==='daily'?ui('launch'):tr('challengeFriend');$('winRanking').textContent=ui('viewRank');$('dailyAlreadyShare').textContent=ui('launch');$('dailyAlreadyRanking').textContent=ui('viewRank');$('inviteStart').textContent=invitationFromPast?tr('playTodaysDaily'):ui('joinChallenge');document.querySelectorAll('[data-level]').forEach(el=>el.classList.toggle('active',el.dataset.level===level));document.querySelectorAll('[data-rank]').forEach(el=>el.classList.toggle('active',el.dataset.rank===rankedLevel));}
function show(id){if(id==='home'){drawDailyFeature();setTimeout(showUpdateIfReady,0)}document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===id));window.scrollTo?.(0,0);if(id==='ranking')drawRanking();if(id==='statsScreen')drawStats()}
function openDialog(id){if(!$(id).open)$(id).showModal()}
function closeDialog(id){if($(id).open)$(id).close()}
function todayKey(chosen=level){return date()+'|'+chosen}
function activeDaily(chosen=level){const a=state.active;return a?.mode==='daily'&&a.day===date()&&a.level===chosen&&!a.finished&&Array.isArray(a.values)&&a.values.length===36}
function dailyStatus(chosen=level){const key=todayKey(chosen);return state.daily[key]?'dailyStatusDone':activeDaily(chosen)?'dailyStatusActive':state.attempts?.[key]?'dailyStatusSpent':'dailyStatusNew'}
function drawDailyFeature(){const el=$('dailyFeatureStatus');if(el)el.textContent=tr(dailyStatus(),{level:tr(level)})}
function drawDailyConfirm(){$('dailyConfirmLevel').textContent=levelLabel(level);$('dailyConfirmStart').textContent=tr('dailyStart')}
function askDaily(){if(!isInstalled()){step=0;openInstall();return}if(!profile?.name){pendingDaily=true;drawProfile();openDialog('profileDialog');return}
 const key=todayKey();if(state.daily[key]){showAlreadyDone(level,state.daily[key].score);return}
 if(activeDaily()){current=state.active;enterGame();return}
 if(state.attempts[key]){alert(tr('dailyAlreadyStarted'));rankedLevel=level;show('ranking');return}
 drawDailyConfirm();openDialog('dailyConfirmDialog')}
async function confirmDaily(){
 if(remoteDailyBusy)return;
 const key=todayKey();if(state.attempts[key]||state.daily[key]){closeDialog('dailyConfirmDialog');askDaily();return}
 remoteDailyBusy=true;$('dailyConfirmStart').disabled=true;
 try{
  const started=await dailyApi('start',level);
  if(started.day!==date())throw Error('Date changed');
  if(started.status!=='in_progress'){closeDialog('dailyConfirmDialog');if(started.status==='completed'){showAlreadyDone(level,started.elapsed_ms?Math.ceil(started.elapsed_ms/1000):null)}else{alert(tr('dailyAlreadyStarted'));rankedLevel=level;show('ranking')}return}
  if(!/^[0-6]{36}$/.test(started.puzzle))throw Error('Invalid puzzle response');
  const nums=Array.from(started.puzzle,Number);
  const g={mode:'daily',seed:'online-'+started.day,level,puzzle:nums,solution:null,values:[...nums],notes:Array.from({length:36},()=>[]),elapsed:0,hints:0,day:started.day,target:null,finished:false,dailyOnline:true};
  state.attempts[key]={startedAt:started.started_at,online:true};current=g;state.active=g;saveState();closeDialog('dailyConfirmDialog');enterGame();
 }catch(err){console.error('Daily challenge start error',err);alert(rankText(5)+'\n'+(err?.message||''))}
 finally{remoteDailyBusy=false;$('dailyConfirmStart').disabled=false}
}
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
function enterNumber(n){if(!current||selected<0){$('feedback').textContent=tr('selectCell');return}if(current.puzzle[selected])return;if(noteMode){let vals=new Set(current.notes[selected]);if(vals.has(n))vals.delete(n);else vals.add(n);current.notes[selected]=[...vals].sort();drawBoard();saveState();return}current.values[selected]=n;current.notes[selected]=[];drawBoard();saveState();if(current.mode==='daily'&&current.dailyOnline?current.values.every(v=>v>=1)&&E.valid(current.values):current.values.every((v,i)=>v===current.solution[i]))win()}
function erase(){if(!current||selected<0||current.puzzle[selected])return;current.values[selected]=0;current.notes[selected]=[];$('feedback').textContent='';drawBoard();saveState()}
function hint(){if(!current)return;if(current.mode==='daily'){$('feedback').textContent=tr('noHintDaily');return}let i=selected;if(i<0||current.values[i]===current.solution[i])i=current.values.findIndex((v,j)=>v!==current.solution[j]);if(i<0)return;current.values[i]=current.solution[i];current.notes[i]=[];current.hints++;current.elapsed+=30;$('timer').textContent=format(current.elapsed);$('feedback').textContent=tr('hintUsed');drawBoard();saveState();if(current.values.every((v,j)=>v===current.solution[j]))win()}
async function win(){
 if(remoteDailyBusy)return;
 if(current?.mode==='daily'&&current.dailyOnline){
  remoteDailyBusy=true;clearInterval(timer);
  try{
   const confirmed=await dailyApi('finish',current.level,current.values.join(''));
   if(confirmed.status!=='completed')throw Error('Unconfirmed result');
   current.elapsed=Math.ceil(confirmed.elapsed_ms/1000);dailyShareRecord={level:current.level,score:current.elapsed,day:confirmed.day||date()};
  }catch(err){
   console.error('Daily challenge finish error',err);
   alert(rankText(6)+'\n'+(err?.message||''));
   // Non registrare tempi non confermati e mantieni la partita riprendibile.
   remoteDailyBusy=false;startTimer();saveState();return;
  }
  remoteDailyBusy=false;
 }
 clearInterval(timer);current.finished=true;let result={day:date(),mode:current.mode,level:current.level,score:current.elapsed,hints:current.hints,seed:current.seed};state.stats.push(result);state.stats=state.stats.slice(-500);if(current.mode==='daily'){const key=current.day+'|'+current.level;if(!state.daily[key])state.daily[key]=result;if(!state.attempts[key])state.attempts[key]={startedAt:new Date().toISOString()}}state.active=null;save(STORE,state);$('winTime').textContent=format(current.elapsed);$('winDetails').textContent=current.mode==='daily'?ui('winDaily',{level:levelLabel(current.level)}):tr('finishedDetail',{level:tr(current.level),hints:current.hints});$('winRanking').classList.toggle('hidden',current.mode!=='daily');$('winNew').classList.toggle('hidden',current.mode==='daily');$('winShare').textContent=current.mode==='daily'?ui('launch'):tr('challengeFriend');let comparison='';if(current.target!==null){comparison=current.elapsed<current.target?tr('winBeat'):current.elapsed>current.target?tr('winLost'):tr('winTie')}$('winCompare').textContent=comparison;openDialog('winDialog')}
function goHome(){pauseTimer();show('home')}
function drawStats(){let all=state.stats||[],today=all.filter(s=>s.day===date()),best=all.length?Math.min(...all.map(s=>s.score)):null;$('statWins').textContent=all.length;$('statToday').textContent=today.length;$('statBest').textContent=best===null?'—':format(best);$('statDaily').textContent=all.filter(s=>s.mode==='daily').length}
function showAlreadyDone(chosen,score){
 rankedLevel=chosen;dailyShareRecord=Number.isFinite(score)?{level:chosen,score,day:date()}:null;
 $('dailyAlreadyTitle').textContent=ui('alreadyTitle',{level:levelLabel(chosen)});
 $('dailyAlreadyBody').textContent=ui('alreadyBody');
 $('dailyAlreadyTime').textContent=Number.isFinite(score)?format(score):'—:—';
 $('dailyAlreadyShare').classList.toggle('hidden',!Number.isFinite(score));
 closeDialog('dailyConfirmDialog');openDialog('dailyAlreadyDialog');
}
function drawRanking(){
 const key=date()+'|'+rankedLevel,r=state.daily[key];lastRankingPayload=null;
 $('rankingDate').textContent=date()+' · UTC';
 $('rankName').textContent=profile?.name||'—';
 $('rankCountry').textContent=profile?.country?countryEmoji(profile.country):'';
 $('rankTime').textContent=r?format(r.score):'—:—';
 $('ranking').querySelector('.you').classList.toggle('hidden',!r||!profile);
 $('rankStatus').textContent=r?tr('dailyDoneMsg'):tr(profile?'noDaily':'noProfile');
 $('rankShareBtn').classList.toggle('hidden',!r);
 document.querySelectorAll('[data-rank]').forEach(b=>b.classList.toggle('active',b.dataset.rank===rankedLevel));
 loadRemoteRanking(rankedLevel);
}
let rankRequest=0;
function rankRow(entry){
 const row=document.createElement('div');row.className='online-rank-row'+(entry.you?' online-rank-you':'');
 const place=document.createElement('span');place.textContent='#'+entry.rank;
 const name=document.createElement('span');name.textContent=(countryEmoji(entry.country)||'🌍')+' '+entry.name+(entry.you?' · '+tr('you'):'');
 const score=document.createElement('strong');score.textContent=format(Math.ceil(entry.elapsed_ms/1000));
 row.append(place,name,score);return row;
}
async function loadRemoteRanking(chosen){
 const el=$('onlineRanking');if(!el)return;
 const request=++rankRequest;el.textContent=rankText(0);
 if(!profile?.name){el.textContent=rankText(3);return}
 try{
  const result=await dailyApi('ranking',chosen);
  if(request!==rankRequest||chosen!==rankedLevel||!$('ranking').classList.contains('active'))return;
  lastRankingPayload={...result,level:chosen};el.replaceChildren();
  const entries=(result.entries||[]).slice(0,10);
  const total=Number.isInteger(result.total)?result.total:entries.length;
  const counter=document.createElement('p');counter.className='ranking-count';counter.textContent=ui('totalPlayers',{count:total.toLocaleString(lang)});el.append(counter);
  if(!entries.length){const empty=document.createElement('p');empty.textContent=rankText(1);el.append(empty)}
  else{
   const heading=document.createElement('div');heading.className='ranking-group-title';heading.textContent=ui('topTen');el.append(heading);
   entries.forEach(entry=>el.append(rankRow(entry)));
  }
  const mine=result.self;
  if(mine?.status==='completed'&&Number.isFinite(mine.elapsed_ms)){
   const seconds=Math.ceil(mine.elapsed_ms/1000);
   $('rankTime').textContent=format(seconds);
   $('rankStatus').textContent=tr('dailyDoneMsg');
   $('ranking').querySelector('.you').classList.remove('hidden');
   $('rankShareBtn').classList.remove('hidden');
   if(mine.rank>10){
    const heading=document.createElement('div');heading.className='ranking-group-title ranking-self-title';heading.textContent=ui('yourPosition');el.append(heading);
    el.append(rankRow({rank:mine.rank,name:profile?.name||mine.name||'Giocatore',country:profile?.country||mine.country||'ZZ',elapsed_ms:mine.elapsed_ms,you:true}));
   }
  }
  const note=document.createElement('p');note.className='small-muted';note.textContent=rankText(4);el.append(note);
 }catch(err){console.error('Daily ranking error',err);if(request===rankRequest)el.textContent=rankText(2)}
}
function getDailyShare(chosen,score,day=date()){
 if(!Number.isFinite(score))return null;
 const name=profile?.name||'6 Sudoku';
 const url=new URL('./',location.href);
 url.searchParams.set('daily',day);url.searchParams.set('level',chosen);url.searchParams.set('from',name.slice(0,20));url.searchParams.set('time',String(Math.max(0,Math.round(score))));
 const time=format(score),lvl=levelLabel(chosen);
 const message=[ui('shareLine1'),'',name+' — '+ui('shareLine2',{level:lvl}),ui('shareLine3',{time}),'',ui('shareLine4'),'',ui('shareLine5'),'',url.href].join('\n');
 return {url:url.href,message};
}
function shareDailyFromRanking(){
 const mine=lastRankingPayload?.level===rankedLevel?lastRankingPayload.self:null;
 const record=state.daily[todayKey(rankedLevel)];
 const seconds=mine?.status==='completed'&&Number.isFinite(mine.elapsed_ms)?Math.ceil(mine.elapsed_ms/1000):record?.score;
 const content=getDailyShare(rankedLevel,seconds);
 if(!content){alert(ui('notFinished'));return}
 shareData=content;openDialog('shareDialog');
}

let pendingInviteLink='';
let invitationFromPast=false;
const isIOSBrowser=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)&&!isInstalled();
async function copyDailyInvitation(){
 if(!pendingInviteLink)return;
 try{await navigator.clipboard.writeText(pendingInviteLink);alert(tr('iosInviteCopied'))}
 catch(_){window.prompt(tr('iosInviteCopy'),pendingInviteLink)}
}
function openReceivedInvitation(){
 const raw=window.prompt(tr('pasteInvitePrompt'));if(raw===null)return;
 let parsed;try{parsed=new URL(raw.trim());}catch(_){alert(tr('invalidInviteLink'));return}
 if(parsed.origin!==location.origin||parsed.pathname!==new URL('./',location.href).pathname||!parsed.searchParams.has('daily')||!LEVELS.includes(parsed.searchParams.get('level'))){alert(tr('invalidInviteLink'));return}
 const params=parsed.searchParams;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(params.get('daily')||'')||!/^\d{1,5}$/.test(params.get('time')||'')){alert(tr('invalidInviteLink'));return}
 const replacement=new URL(location.href);replacement.search=params.toString();history.replaceState(null,'',replacement.href);
 if(!showDailyInvitation())alert(tr('invalidInviteLink'));
}

function showDailyInvitation(){
 const q=new URLSearchParams(location.search),day=q.get('daily'),chosen=q.get('level');
 if(!day||!LEVELS.includes(chosen))return false;
 const from=(q.get('from')||'6 Sudoku').slice(0,20);
 const secs=Number(q.get('time'));if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isInteger(secs)||secs<0||secs>86400)return false;
 level=chosen;rankedLevel=chosen;applyTexts();drawDailyFeature();
 $('inviteTitle').textContent=ui('inviteTitle',{name:from});
 invitationFromPast=day!==date();
 $('inviteBody').textContent=invitationFromPast?ui('oldInvitation'):ui('inviteBody',{time:format(secs),level:levelLabel(chosen)});
 $('inviteStart').textContent=invitationFromPast?tr('playTodaysDaily'):ui('joinChallenge');
 const handoff=isIOSBrowser();
 $('iosInviteHandoff').classList.toggle('hidden',!handoff);
 $('inviteStart').classList.toggle('hidden',handoff);
 $('iosInviteHelp').textContent=tr('iosInviteHelp');
 $('iosInviteQuestion').textContent=tr('iosInviteQuestion');
 $('iosInviteCopy').textContent=tr('iosInviteCopy');
 $('iosInviteNew').textContent=tr('iosInviteNew');for(const id of ['iosStepOne','iosStepTwo','iosStepThree'])$(id).textContent=tr(id);
 pendingInviteLink=location.href;
 openDialog('dailyInviteDialog');
 history.replaceState(null,'',new URL('./',location.href).pathname);
 return true;
}

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

function drawProfile(){refreshEmailUI();if($('profileNotif'))$('profileNotif').checked=read('6sudoku-test-notifications',true);refreshProfileConnection();const el=$('country');el.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='🌍 '+tr('countryNone');el.append(none);const names=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames([lang],{type:'region'}):null;const sorter=new Intl.Collator(lang,{usage:'sort',sensitivity:'base',numeric:true});const countries=(window.COUNTRIES||[]).filter(item=>item[0]).map(([code,emoji])=>({code,emoji,name:names?.of(code)||code})).sort((a,b)=>sorter.compare(a.name,b.name)||a.code.localeCompare(b.code));for(const {code,emoji,name} of countries){const o=document.createElement('option');o.value=code;o.textContent=emoji+' '+name;el.append(o)}$('nickname').value=profile?.name||'';$('country').value=profile?.country||'';updatePreview()}
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
function openShare(appOnly){if(!appOnly&&current?.mode==='daily'&&current.finished){shareData=getDailyShare(current.level,current.elapsed,current.day)}else shareData=buildShare(appOnly);if(shareData)openDialog('shareDialog')}
async function shareWhatsApp(){
 if(!shareData)return;
 const text=shareData.message;
 // Nelle PWA mobili window.open(wa.me) può lasciare una finestra vuota.
 // Il pannello nativo mantiene la PWA aperta: selezionare WhatsApp dall'elenco.
 if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)&&typeof navigator.share==='function'){
  try{
   await navigator.share({text});
   closeDialog('shareDialog');
   return;
  }catch(err){
   if(err?.name==='AbortError')return; // Nessuna navigazione se si annulla.
   console.warn('6 Sudoku: condivisione nativa non disponibile',err);
  }
 }
 const link=document.createElement('a');
 link.href='https://wa.me/?text='+encodeURIComponent(text);
 link.target='_blank';link.rel='noopener noreferrer external';
 document.body.append(link);link.click();link.remove();
 closeDialog('shareDialog');
}
async function shareNative(){if(!shareData)return;try{if(navigator.share){await navigator.share({title:'6 Sudoku',text:shareData.message});return}}catch(e){if(e.name==='AbortError')return}await copyLink()}
async function copyLink(){if(!shareData)return;try{await navigator.clipboard.writeText(shareData.url);alert(tr('copied'))}catch(_){window.prompt(tr('copyFail'),shareData.url)}}
// Eliminazione volontaria del solo profilo autenticato.
// Il server verifica l'identità tramite access token, non riceve alcun user_id dal browser.
let deletingProfile=false;
function canDeleteProfile(){return !!profile?.id && !!window.SudokuOnline?.configured}
function showDeleteProfile(){
 if(!canDeleteProfile()){alert(tr('deleteProfileNeedProfile'));return;}
 $('deleteProfileAgree').checked=false;
 $('deleteProfileStatus').textContent='';
 $('deleteProfileConfirmBtn').disabled=true;
 closeDialog('privacyDialog');openDialog('deleteProfileDialog');
}
async function confirmDeleteProfile(){
 if(deletingProfile||!$('deleteProfileAgree').checked||!canDeleteProfile())return;
 deletingProfile=true;
 const button=$('deleteProfileConfirmBtn');button.disabled=true;
 $('deleteProfileStatus').textContent=tr('deleteProfileBusy');
 try{
  if(!navigator.onLine||!window.SudokuOnline?.configured)throw Error('Offline or Supabase unavailable');
  const db=await window.SudokuOnline.getClient();
  const {data:{session},error:sessionError}=await db.auth.getSession();
  if(sessionError||!session||session.user.id!==profile.id)throw Error(tr('deleteProfileUnauthorized'));
  const result=await db.functions.invoke('delete-profile',{body:{confirmation:'DELETE_MY_6_SUDOKU_PROFILE'}});
  if(result.error||result.data?.deleted!==true)throw result.error||Error(result.data?.error||'Deletion was not confirmed');
  // Da qui in poi l'account è già stato eliminato sul server.
  try{const reg=await navigator.serviceWorker.ready;const subscription=await reg.pushManager?.getSubscription();if(subscription)await subscription.unsubscribe()}catch(e){console.warn('Push cleanup:',e)}
  try{await db.auth.signOut({scope:'local'})}catch(e){console.warn('Local sign out:',e)}
  try{localStorage.removeItem(PROFILEKEY);localStorage.removeItem('6sudoku-test-notifications');}catch(_){}
  profile=null;pendingDaily=false;dailyShareRecord=null;lastRankingPayload=null;
  // Conserva soltanto la cronologia delle partite libere, non i dati competitivi dell'account cancellato.
  state.stats=(state.stats||[]).filter(s=>s.mode==='free');state.daily={};state.attempts={};
  if(state.active?.mode==='daily')state.active=null;
  if(current?.mode==='daily'){clearInterval(timer);current=null;}
  save(STORE,state);
  closeDialog('deleteProfileDialog');show('home');drawDailyFeature();
  alert(tr('deleteProfileSuccess'));
 }catch(err){console.error('6 Sudoku delete-profile error:',err);$('deleteProfileStatus').textContent=tr('deleteProfileError')+(err?.message?' ('+err.message+')':'');}
 finally{deletingProfile=false;button.disabled=!$('deleteProfileAgree').checked;}
}
function refreshDeleteProfileGuard(){
 const button=$('deleteProfileOpenBtn');if(button)button.disabled=!canDeleteProfile();
 const note=$('deleteProfileGuard');if(note)note.textContent=tr(canDeleteProfile()?'deleteProfileSafety':'deleteProfileNeedProfile');
}
function wire(){LANGS.forEach(([code,name])=>{let opt=document.createElement('option');opt.value=code;opt.textContent=name;$('language').append(opt)});$('language').onchange=e=>changeLanguage(e.target.value);document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=b.dataset.level;applyTexts();drawDailyFeature()});$('freeBtn').onclick=()=>start('free');$('dailyBtn').onclick=askDaily;$('dailyConfirmStart').onclick=confirmDaily;$('rankingBtn').onclick=()=>show('ranking');$('statsBtn').onclick=()=>show('statsScreen');$('rulesBtn').onclick=$('rulesGameBtn').onclick=()=>{renderRules();openDialog('rulesDialog')};$('shareAppBtn').onclick=()=>openShare(true);$('deleteProfileOpenBtn').onclick=showDeleteProfile;$('deleteProfileAgree').onchange=()=>{$('deleteProfileConfirmBtn').disabled=deletingProfile||!$('deleteProfileAgree').checked};$('deleteProfileConfirmBtn').onclick=confirmDeleteProfile;$('deleteProfileCancelBtn').onclick=()=>{if(!deletingProfile)closeDialog('deleteProfileDialog')};$('privacyHomeBtn').onclick=()=>{refreshDeleteProfileGuard();openDialog('privacyDialog')};$('privacyProfileBtn').onclick=()=>{closeDialog('profileDialog');refreshDeleteProfileGuard();openDialog('privacyDialog')};$('checkUpdatesBtn').onclick=()=>checkForUpdate(false);$('updateLater').onclick=()=>closeDialog('updateDialog');$('updateNow').onclick=applyUpdate;$('installBtn').onclick=openInstall;document.querySelectorAll('[data-back]').forEach(b=>b.onclick=goHome);$('rankingTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{rankedLevel=b.dataset.rank;drawRanking()});$('editProfileBtn').onclick=()=>{drawProfile();openDialog('profileDialog');window.SudokuPush?.refresh().catch(()=>{})};$('rankDailyBtn').onclick=()=>{level=rankedLevel;applyTexts();start('daily')};$('rankShareBtn').onclick=shareDailyFromRanking;$('winRanking').onclick=()=>{closeDialog('winDialog');rankedLevel=current?.level||level;show('ranking')};$('dailyAlreadyShare').onclick=()=>{const key=state.daily[todayKey(rankedLevel)];const score=dailyShareRecord?.score??key?.score;if(!Number.isFinite(score)){closeDialog('dailyAlreadyDialog');show('ranking');return}shareData=getDailyShare(rankedLevel,score);closeDialog('dailyAlreadyDialog');openDialog('shareDialog')};$('dailyAlreadyRanking').onclick=()=>{closeDialog('dailyAlreadyDialog');show('ranking')};$('inviteStart').onclick=()=>{closeDialog('dailyInviteDialog');askDaily()};$('iosInviteCopy').onclick=copyDailyInvitation;$('openReceivedInviteBtn').onclick=openReceivedInvitation;$('dailyAlreadyHome').onclick=()=>{closeDialog('dailyAlreadyDialog');show('home')};$('inviteHome').onclick=()=>{closeDialog('dailyInviteDialog');show('home')};$('profileForm').onsubmit=saveProfile;$('linkEmailBtn').onclick=linkProfileEmail;$('recoverEmailBtn').onclick=recoverProfileEmail;$('nickname').addEventListener('input',updatePreview);$('country').addEventListener('change',updatePreview);document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));$('numkeys').innerHTML=Array.from({length:6},(_,i)=>`<button type="button">${i+1}</button>`).join('');$('numkeys').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>enterNumber(i+1));$('eraseBtn').onclick=erase;$('notesBtn').onclick=()=>{noteMode=!noteMode;applyTexts();$('notesBtn').classList.toggle('active',noteMode)};$('hintBtn').onclick=hint;$('stepPrev').onclick=()=>{step=Math.max(0,step-1);drawStep()};$('stepNext').onclick=()=>{if(step===4)closeDialog('installDialog');else{step++;drawStep()}};$('installConfirm').onclick=requestInstall;$('winNew').onclick=()=>{closeDialog('winDialog');start('free')};$('winHome').onclick=()=>{closeDialog('winDialog');show('home')};$('winShare').onclick=()=>{closeDialog('winDialog');openShare(false)};$('whatsappBtn').onclick=shareWhatsApp;$('nativeShareBtn').onclick=shareNative;$('copyLinkBtn').onclick=copyLink;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e});window.addEventListener('appinstalled',()=>{$('installBanner').classList.add('hidden');closeDialog('installDialog')});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseTimer();else if(current&&!current.finished&&$('game').classList.contains('active'))startTimer()});window.addEventListener('pagehide',()=>{pauseTimer();saveState()})}
function init(){normalizeState();refreshDeleteProfileGuard();if(window.SudokuOnline?.configured){reconcileOnlineIdentity();window.SudokuOnline.watchAuth(()=>reconcileOnlineIdentity()).catch(()=>{});}initPreview();wire();$('openReceivedInviteBtn').classList.toggle('hidden',!isInstalled());applyTexts();drawDailyFeature();$('installBanner').classList.toggle('hidden',isInstalled());deepLink=getChallengeParams();if(deepLink?.invalid){alert(tr('invalidLink'))}else if(deepLink){level=deepLink.level;applyTexts();start('challenge')}else if(showDailyInvitation()){}else if(state.active&&!state.active.finished){const a=state.active;if(a.mode==='daily'&&a.day!==date()){state.active=null;saveState();return}if(a.mode==='daily'&&!isInstalled()){openInstall();return}if(Array.isArray(a.values)&&a.values.length===36&&((a.dailyOnline&&a.solution===null)||(Array.isArray(a.solution)&&a.solution.length===36))){current=a;enterGame()}}initPullRefresh();watchServiceWorker();}
init();
})();
