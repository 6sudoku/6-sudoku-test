6 Sudoku v0.12.9.5.6 TEST
Correzioni: sfida completata non blocca nuova sfida; risultato precedente conservato localmente; notifica su iPhone con messaggio alla app aperta; stato risultato distinto da Partita registrata; larghezza dialog adattiva.
Importante: una sola sfida attiva; la disponibilita di una nuova sfida dipende anche dai controlli della funzione Supabase create-1vs1 gia pubblicata.
Pubblicare tutti i file nella cartella TEST di GitHub Pages, senza modificare la versione ufficiale.

Aggiornamenti: corretta discrepanza tra APP_VERSION e version.json che generava avviso continuo.
Dopo il caricamento verificare che TUTTI i file della cartella TEST siano sostituiti e che https://<dominio>/<cartella-TEST>/version.json restituisca 0.12.9.5.6.

AGGIORNAMENTO 5.4: Service Worker con navigazione network-first e attivazione automatica; il pulsante verifica il numero del nuovo worker prima di ricaricare. Non disinstallare l'app: potrebbe perdere la registrazione delle notifiche.

Novità 5.5: nel risultato del creatore appaiono avversario e posta concordata, anche quando il risultato si apre da una notifica.

0.12.9.5.6: SÌ notifica sfida abilita impostazione del profilo e tenta la registrazione push; testo in 8 lingue; griglia 6x6 iOS con righe ad altezza fissa e uguale.
