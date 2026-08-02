## 1.73

- Indipendenza dei dati localizzati del sito web come JSON esterno per una facile manutenzione.
- Gli script supportano l'internazionalizzazione e utilizzano la piattaforma crowdin per automatizzare la localizzazione.
- Sostituisca alcuni pulsanti con pulsanti a icona
- Aggiunga il supporto per le API di DeepL, incluse quelle ufficiali api-free, api-pro e deeplx, grazie a @Vistarin per il suggerimento!
- Aggiungere il supporto per deepl e chatgpt per configurare la ricerca del saldo, tenendo presente che questo richiede anche che il suo fornitore di servizi lo supporti e fornisca le API appropriate.
- Aggiungere un giudizio sul testo prima della traduzione; se si sospetta che si tratti di un frammento di codice, non verrà tradotto automaticamente e verrà richiesta una finestra pop-up prima di cliccare sulla traduzione.
- Aggiungere la possibilità di selezionare la lingua di destinazione per i servizi di traduzione.
- Aggiunga una pagina informativa, così come un canale di aggiornamento e le selezioni della fonte di aggiornamento.
- Aggiungere la pagina di manutenzione del debug, compreso l'aggiornamento della cache, la cancellazione dei dati, l'importazione e l'esportazione.
- Aggiunge l'opzione personalizzata： 'Posizione del pulsante di invio dell'editor di codice', predefinita in basso, grazie a @lishufood per il suggerimento!
- Migliorare ogni funzione di caricamento, eliminare alcune relazioni di attesa non necessarie, accelerare il tempo di caricamento dello script.
- Miglioramenti alla funzione di traduzione e alla visualizzazione dei messaggi di errore.
- Miglioramento delle prestazioni della traduzione automatica e il problema che potrebbe non essere tradotto automaticamente
- Miglioramenti ai campioni di codice relativi all'esecuzione online
- Metodo migliorato per confrontare le differenze nei risultati dell'esecuzione codeDiff()
- Il contenuto di sfondo della finestra di dialogo migliorato non scorre più con il mouse.
- Migliora lo stile dell'editor di codice quando è fissato sul lato destro, in basso e a schermo intero, grazie a @lishufood per il suggerimento!
- Miglioramento della visualizzazione del pannello .html2md-panel in modalità semplice
- Migliorare lo stile della pagina di configurazione nel pannello delle impostazioni
- Correggere gli errori dell'editor della pagina del titolo di acmsguru
- Risolvere il problema per cui l'editor di codice della pagina dei problemi riportava un errore dopo aver cambiato la versione mobile/desktop del sito web.
- Correzione di un bug nel metodo getMarkdown(), che memorizzava erroneamente i dati direttamente nel DOM, con conseguente degrado delle prestazioni.
- Risolva il problema che il pulsante di traduzione all'interno del blocco piegato non viene visualizzato dopo aver disattivato 'Espansione automatica del blocco piegato', grazie al feedback di @MoYuToGo!
- Poiché l'opzione "Non attendere il caricamento completo delle risorse della pagina" è teoricamente priva di significato, è stata rinominata per deselezionare lo stato precedentemente possibile
- Regolazione di un gran numero di strutture di codice
- **molte rinominazioni di classi css, quindi potrebbe essere necessario modificare questo aspetto se sta usando gli stili personalizzati di Stylus**.
- Altre modifiche e miglioramenti

## 1.72

- Risolva il problema per cui il pannello di configurazione di ChatGPT non viene visualizzato, grazie al feedback di @caoxuanming!
- Aggiungere un interruttore di configurazione "Blocco dello scorrimento del mouse", attivo per impostazione predefinita, grazie a @liuhao6 per il suggerimento.

## 1.71

- Aggiornato l'API per la valutazione clista alla v4, adattato il modo in cui i dati vengono recuperati sulla pagina del titolo per essere recuperati tramite API, grazie a @wrkwrk per il suggerimento!
- Aggiungere l'opzione di traduzione ChatGPT "Streaming", abilitata per impostazione predefinita
- Correggere i risultati di Google Translate sono vuoti Grazie a @shicxin per il feedback!
- Aggiungere un interruttore di configurazione "Doppia conferma per i commit di codice", attivo per impostazione predefinita Grazie a @Rikkual per il suggerimento!
- Pulsanti per aggiungere piccole aree alla pagina completa degli argomenti.
- Risolva il problema per cui il risultato della traduzione non viene mostrato quando si fa clic con il tasto destro del mouse sulla pagina completa del set di argomenti per stampare Grazie a @zfs732 per il feedback!

## 1.70

- Aggiungere un editor di codice nella parte inferiore della pagina del titolo, per supportare il test del codice online, l'invio del codice, ecc.
- È stato risolto il problema per cui, quando si inseriscono i pulsanti di script e si traducono i risultati, questi vengono trattati come modifiche alla descrizione del titolo.
- Miglioramento della pagina Gestione del Mashup del Portafoglio
- Aggiungere la funzione "Traduzione automatica di testi brevi", disattivata per impostazione predefinita.
- Miglioramento dell'implementazione degli intervalli di attesa della traduzione, ora gli intervalli di attesa funzionano a livello globale
- Miglioramenti all'implementazione di "Mostra area di destinazione".
- Modalità scura migliorata, stili hover migliorati sugli elementi campione Grazie a @SUPERLWR per il feedback!
- Aggiungere l'opzione del pannello delle impostazioni: Traduzione - Filtrare i segni \*\*nel testo Grazie a @Dog_E, CreMicro per il loro feedback!
- È stato risolto il problema per cui la Valutazione Clist non poteva essere visualizzata correttamente dopo aver disattivato "Mostra avvisi di caricamento", grazie al feedback di Vistarin.
- Altri miglioramenti e correzioni
