## 1.80.0

- Aggiunta la funzione personalizzata "Colore del testo della traduzione", che consente di configurare il colore del testo del risultato della traduzione nelle impostazioni, grazie al contributo di **@wrk-123**.
- Aggiunta una finestra di dialogo di conferma per "Salta o no il blocco di codice" durante la traduzione, per evitare di tradurre erroneamente il contenuto del codice.
- Aggiunta scorciatoia Ctrl+Invio per inviare il codice, grazie a **@wrk-123**.
- Correggere le interruzioni di riga ` <br>` mancanti durante la conversione di MarkDown, grazie a **@wrk-123** per il contributo!
- Correggere il problema dell'escape dei caratteri HTML durante la copia di MarkDown (ad esempio `&lt;` `&gt;`), grazie a **@wrk-123** per il contributo!
- Correggere la gestione delle interruzioni di riga per i blocchi di codice (` <pre>`) nelle conversioni MarkDown, grazie a **@wrk-123** per il contributo!
- Correggere la conversione di MarkDown senza filtrare i tag \\\\\\\\\\\` <style>
- Corretto il problema dell'errore di sintassi dei collegamenti Markdown causato dalla regola di sostituzione delle parentesi cinesi, grazie al contributo di **@wrk-123**.
- Correggere il problema della corrispondenza dei casi in PP, grazie a **@awerty-noob** per il contributo!
- Risolvere i problemi di cambio di livello ridondanti, grazie a **@wrk-123** per il contributo!
- Migliorare la robustezza del riconoscimento degli elementi MathJax, supportare più varianti di nomi di classi MathJax, grazie a **@wrk-123**.
- Migliorata la logica di visualizzazione della funzione di abbellimento del blocco di codice, che non mostra più il blocco di codice che era nascosto, grazie al contributo di **@wrk-123**.
- Migliorare l'elemento pulsante aggiungendo l'attributo `type='button'` per evitare falsi invii di moduli.
- Migliorare il testo del pulsante di copia della traduzione quando è disattivato.
- Miglioramento della decisione di argomento non trovato per il salto a Luogu, grazie a **@wrk-123** per il contributo!
- Miglioramento delle regole di localizzazione dei siti web, grazie ai contributi di **@qjwh**, **@wrk-123**

## 1.79.0

- Rimuovere la dipendenza dal repository di script Greasyfork
- Sostituire la fonte di aggiornamento predefinita con AliCloud OSS
- Risolvere il problema dello stile errato dei pulsanti su alcune pagine del titolo
- Miglioramenti：Regolazione della parola di richiesta predefinita di GPT
- Miglioramenti：Fornire una chiara indicazione quando il codice online si esaurisce

## 1.77.0

- Aggiungere l'opzione "Controllo dei risultati dei test campione".
- Correggere l'abbellimento dei blocchi di codice che non cambia correttamente tema quando la modalità scura è "Segui il sistema".
- Risolvere il problema per cui "Sostituzione testo stato di revisione" non viene sostituito correttamente.
- Risolvere il problema dell'errore di traduzione di Arigatou
- Correggere il problema per cui il risultato della traduzione non viene mostrato nella parte di risposta del commento in modalità segmentata
- Risolvere il problema della mancanza dell'ultimo commento nella pagina di differenziazione dei commenti
- Corregge la sovrascrittura del colore LaTeX in modalità scura
- Risolvere il problema dell'intervallo di attesa non valido in modalità "Traduzione segmentata".
- Correzione di un problema durante l'interrogazione dei saldi API, grazie a **@x1uc**.
- Correggere il conflitto tra i nomi delle classi di sovrapposizione
- Miglioramento delle regole di localizzazione del sito web, grazie a **@xiezheyuan**, **@Acfboy** per il loro contributo!

## 1.76.0

- \*_Sostituire il CDN del repository pubblico a [SUSTech Mirror](https://mirrors.sustech.edu.cn/help/cdnjs.html), vedere [issue](https://github.com/beijixiaohu/OJBetter/issues/151)_ per i motivi. \*

- Aggiunta la funzione "Sostituzione del testo dello stato delle recensioni", grazie alla collaborazione di **@wrk-123**.

- Miglioramento della pagina Gestione del Mashup del Portafoglio

## 1.75.0

- Miglioramento di alcune regole di localizzazione dei siti web, grazie al contributo di **@qjwh**.
- Aggiungere le opzioni "Personalizzazione del prompt di traduzione di ChatGPT" e "Come prompt di sistema" Grazie a **@Dawn-Xu-helloworld** per la collaborazione!
- Aggiungere la funzione "Forza conversione Turndown" Grazie a **@wrk-123** per il contributo!
- Aggiungere la finestra pop-up di conferma dell'invio del codice per visualizzare il nome del titolo.
- Aggiungi campione con l'opzione Auto-Commit (disattivata per impostazione predefinita)
- Aggiunta della funzione "Nascondi le etichette delle domande sugli argomenti", disattivata per impostazione predefinita.
- Sostituzione dell'interfaccia di "Yodo Translator"
- Correggere i titoli delle palestre che non saltano al vjudge
- &nbsp;Correggere i simboli ` ` nell'abbellimento dei blocchi di codice
- Risolvere il problema per cui i sorgenti del problemset non possono essere inviati correttamente quando la lunghezza del numero di domanda non è 1 Grazie a **@WindJ0Y** per il contributo!
- Correggere l'editor di Monaco che non applica correttamente il tema quando il tema è impostato su follow Grazie a **@cscnk52** per il contributo!
- Correggere l'editor di codice che non viene caricato correttamente quando i link al titolo sono in minuscolo.
- Correzione di un problema durante l'interrogazione dei saldi API, grazie a **@x1uc**.
- Correggere l'errore durante la ritraduzione di "Raccogli i vecchi risultati".
- Risolvere il problema che il pulsante di copia non funziona nella pagina di invio.
- Correzione dei tag di script non filtrati durante la conversione di MarkDown
- Utilizzare il polyfill per la compatibilità con i browser che non supportano il metodo dialog.showModal() (ad esempio Firefox79).

## 1.74.2

- Corregge i problemi dell'ultima correzione Grazie a @Dechancer per il feedback!

## 1.74.1

- Correggere il pre normale con sfondo bianco in modalità scura quando l'abbellimento dei blocchi di codice non è abilitato

## 1.74.0

- Aggiungi il pulsante per passare a VJudge
- Aggiungere la funzione "abbellimento del blocco di codice", utilizzare l'editor monaco per sostituire il blocco di codice preesistente nella pagina; questo migliorerà anche l'effetto di visualizzazione del codice in modalità scura.
- Miglioramenti a vari metodi di richiesta in Clist Rating per risolvere problemi di mancata ricezione dei dati.
- Miglioramento del prompt delle traduzioni di ChatGPT e correzione di un possibile errore di iniezione che potrebbe portare a traduzioni incomplete.
- Miglioramenti al codice relativo a LaTeX Replace/Restore, che ora ripristina correttamente in caso di annidamento multiplo
- Migliorare la robustezza dei metodi di localizzazione dei siti web
- Adattare il codice relativo alla modalità scura, utilizzando le variabili per facilitare l'uniformità di stile e di gestione.
- Sostituire il CDN staticfile.org con staticfile.net
- I dati di MarkDown non contengono più blocchi di codice interlinea
- Rimuovere i metodi per determinare se il testo è un codice o meno.
- Risolvere il problema per cui la classificazione di alcuni argomenti nella pagina dell'elenco delle domande può essere visualizzata come non trovata.
- Risolvere il problema della visualizzazione anomala dei punteggi della classifica nella pagina delle domande.
- Risolvere il problema degli stili di confronto delle differenze non allineati nei test online del codice
- Risolvere il problema per cui deepl 429 non visualizza correttamente il messaggio di avviso dopo la segnalazione di un errore.
- Corregge un problema per cui il titolo della pagina Clist Rating potrebbe mostrare Not Found (Non trovato).
- Corretto il problema per cui il metodo di salto Rock Valley riportava un errore nelle vecchie versioni di Tampermonkey.
- Correzione di un ciclo morto inatteso che causa il blocco della pagina quando il file della libreria MathJax non viene caricato correttamente
- È stato risolto il problema per cui DeepL non visualizzava correttamente il messaggio di avviso in traduzione quando si traduceva in modalità libera.
- Corregge un problema per cui gli script potrebbero non essere caricati correttamente.
- Corregge un problema per cui la tipografia tra formule LaTeX vicine poteva essere interrotta.
- Altre modifiche e miglioramenti

## 1.73.0

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
- Altri miglioramenti e correzioni

## 1.72.0

- Risolva il problema per cui il pannello di configurazione di ChatGPT non viene visualizzato, grazie al feedback di @caoxuanming!
- Aggiungere un interruttore di configurazione "Blocco dello scorrimento del mouse", attivo per impostazione predefinita, grazie a @liuhao6 per il suggerimento.

## 1.71.0

- Aggiornato l'API per la valutazione clista alla v4, adattato il modo in cui i dati vengono recuperati sulla pagina del titolo per essere recuperati tramite API, grazie a @wrkwrk per il suggerimento!
- Aggiungere l'opzione di traduzione ChatGPT "Streaming", abilitata per impostazione predefinita
- Correggere i risultati di Google Translate sono vuoti Grazie a @shicxin per il feedback!
- Aggiungere un interruttore di configurazione "Doppia conferma per i commit di codice", attivo per impostazione predefinita Grazie a @Rikkual per il suggerimento!
- Pulsanti per aggiungere piccole aree alla pagina completa degli argomenti.
- Risolva il problema per cui il risultato della traduzione non viene mostrato quando si fa clic con il tasto destro del mouse sulla pagina completa del set di argomenti per stampare Grazie a @zfs732 per il feedback!

## 1.70.0

- Aggiungere un editor di codice nella parte inferiore della pagina del titolo, per supportare il test del codice online, l'invio del codice, ecc.
- È stato risolto il problema per cui, quando si inseriscono i pulsanti di script e si traducono i risultati, questi vengono trattati come modifiche alla descrizione del titolo.
- Miglioramento della pagina Gestione del Mashup del Portafoglio
- Aggiungere la funzione "Traduzione automatica di testi brevi", disattivata per impostazione predefinita.
- Miglioramento dell'implementazione degli intervalli di attesa della traduzione, ora gli intervalli di attesa funzionano a livello globale
- Miglioramenti all'implementazione di "Mostra area di destinazione".
- Modalità scura migliorata, stili hover migliorati sugli elementi campione Grazie a @SUPERLWR per il feedback!
- Aggiungere l'opzione del pannello delle impostazioni: Traduzione - Filtrare i segni \*\*nel testo Grazie a @Dog_E, CreMicro per il loro feedback!
- È stato risolto il problema per cui la Valutazione Clist non poteva essere visualizzata correttamente dopo aver disattivato "Mostra avvisi di caricamento", grazie al feedback di Vistarin.
- Altri aggiustamenti e miglioramenti