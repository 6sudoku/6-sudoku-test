6 SUDOKU v0.12.6 TEST — Collegamento email e recupero profilo

Sito: https://6sudoku.github.io/6-sudoku-test/

PASSAGGI PRIMA DEL TEST
1. Supabase Authentication > Sign In / Providers > Allow manual linking: ON, Save.
2. Supabase Authentication > URL Configuration: Site URL https://6sudoku.github.io/6-sudoku-test/ ; Redirect URLs include https://6sudoku.github.io/6-sudoku-test/** .
3. SMTP Gmail già configurato e verificato. Turnstile attivo e site key presente nel file pubblico js/supabase-config.js.
4. Caricare il contenuto dello ZIP nella RADICE del repository 6-sudoku-test, sovrascrivendo i file della precedente versione TEST.
5. Attendere aggiornamento Service Worker, ricaricare e verificare la scritta v0.12.6.

TEST EMAIL
Aprire Classifica mondiale > Profilo. Con il giocatore già registrato, inserire l'email facoltativa e premere Invia link di verifica.
Aprire il link ricevuto dalla STESSA app/browser in cui si vuole confermare l'indirizzo. Rientrare nel Profilo e verificare lo stato email.
Per il recupero su altro dispositivo, aprire il profilo, inserire l'email nel campo Recupera profilo, ricevere link di accesso e aprirlo sul nuovo dispositivo. Verificare che l'ID del giocatore coincida in Supabase.
Usare un'email di prova non collegata ad altri utenti Supabase e NON la email usata per il test Invite user in Authentication (se ha creato un altro account).

NOTA: la registrazione rimane senza email obbligatoria; non sono ancora attivi push, classifiche online o sincronizzazione dei risultati locali. Non cancellare la PWA ufficiale o i suoi dati. Il progetto TEST usa lo stesso database Supabase del sito futuro.

SICUREZZA: mai mettere Gmail app password, Supabase secret/service_role o Cloudflare secret key nel repository.
