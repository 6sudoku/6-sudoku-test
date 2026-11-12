6 Sudoku v0.12.8.7 TEST — cancellazione volontaria del profilo

Carica i file di questa cartella SOLO nella repository 6-sudoku-test.
Supabase: riutilizza la Edge Function delete-profile già testata e la migrazione SQL già eseguita.
NON sono necessarie altre modifiche al database.

La cancellazione ora è disponibile per qualunque giocatore che abbia un profilo e una sessione autenticata valida; la funzione server elimina SOLO l’account identificato dal token autenticato.
Prima di cancellare: l'app mostra una finestra, richiede una spunta esplicita e il server richiede un ulteriore valore di conferma nella chiamata.
Dopo cancellazione riuscita: rimuove dati competitivi locali e sottoscrizione push di questo browser, ma conserva le partite libere.

ATTENZIONE: operazione irreversibile; non fare test distruttivi su giocatori reali.
Verifiche consigliate: 1) versione 0.12.8.7; 2) traduzioni in tutte le otto lingue; 3) pulsante disabilitato senza profilo; 4) profilo reale solo visualizza la finestra senza confermare.

Prima del lancio pubblico sono ancora da verificare privacy legale, età e il caso di sfide private attive; inoltre valutare re-autenticazione per account recuperabili via email.
