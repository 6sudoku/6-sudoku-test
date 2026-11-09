6 SUDOKU v0.12.5 - AMBIENTE DI PROVA

URL: https://6sudoku.github.io/6-sudoku-test/
Caricare il CONTENUTO di questa cartella nella radice del repository 6-sudoku-test; non caricare la cartella esterna.

ISOLAMENTO:
- Service Worker limitato alla sottocartella /6-sudoku-test/, per via della posizione del file.
- Cache denominata 6-sudoku-test-v0125-1; la pulizia riguarda soltanto cache 6-sudoku-test-*.
- localStorage delle partite, lingua, nickname, notifiche con prefisso 6sudoku-test-.
- Sessione Supabase JS con storageKey 6sudoku-test-supabase-auth.
- Manifest e nome installazione 6 Sudoku TEST per distinguere le due icone.

ATTENZIONE: LA CONNESSIONE SUPABASE NON E' ISOLATA. La versione TEST usa il progetto Supabase configurato, quindi creare un profilo di prova significa registrarlo DAVVERO sullo stesso backend. Usare nickname di prova riconoscibili; non utilizzare credenziali segrete nel repository.

Il CAPTCHA di Supabase deve restare DISATTIVATO finche' il flusso Turnstile non viene testato. Il codice puo' comunque mostrare la verifica Cloudflare al primo accesso se e' configurata la site key.

Verifica: apri /6-sudoku-test/, vai al profilo, salva nickname e Paese, poi verifica Supabase > Authentication > Users e Table Editor > profiles / profile_settings.

NOTA: v0.12.5 non ha ancora classifiche vere, email di recupero né push; le sfide quotidiane restano locali.

Se il browser mostra una versione vecchia, chiudi il sito TEST e riaprilo. Non cancellare i dati dell'app ufficiale.
