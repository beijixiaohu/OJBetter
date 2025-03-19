## 1.78.0

- Abhängigkeit von Greasyfork-Skript-Repository entfernen
- Ersetzen Sie die Standard-Aktualisierungsquelle durch AliCloud OSS
- Behebung des Problems des falschen Stils der Schaltflächen auf einigen Titelseiten
- Verbesserungen：Anpassen des GPT-Standard-Eingabeworts
- Verbesserungen：Deutlicher Hinweis, wenn die Zeit für den Online-Code abgelaufen ist

## 1.77.0

- Hinzufügen der Option "Prüfen der Testergebnisse".
- Korrektur der Codeblockverschönerung, die das Thema nicht korrekt umschaltet, wenn der dunkle Modus "System folgen" ist
- Behebung des Problems, dass "Review Status Text Replacement" nicht korrekt ersetzt wird.
- Behebung des Yodo-Übersetzungsfehlers
- Behebung des Problems, dass das Übersetzungsergebnis nicht im Antwortteil des Kommentars im segmentierten Modus angezeigt wird
- Behebung des Problems des fehlenden letzten Kommentars auf der Seite zur Unterscheidung der Kommentare
- Behebt das Überschreiben von LaTeX-Farben im Dark Mode
- Behebung des Problems, dass das Warteintervall im Modus "Segmentierte Übersetzung" ungültig ist.
- Behebung eines Problems bei der Abfrage von API-Salden, danke an **@x1uc**.
- Namenskonflikt der Overlay-Klasse beheben
- Verbesserung der Website-Lokalisierungsregeln, Dank an **@xiezheyuan**, **@Acfboy** für ihren Beitrag!

## 1.76.0

- \*_Ersetzen Sie das CDN des öffentlichen Repositorys durch [SUSTech Mirror](https://mirrors.sustech.edu.cn/help/cdnjs.html), siehe [issue](https://github.com/beijixiaohu/OJBetter/issues/151)_ für Gründe. \*

- Dank der Mitarbeit von **@wrk-123** wurde die Funktion "Ersetzung des Überprüfungsstatus-Textes" hinzugefügt.

- Anpassen der Layout-Struktur der Einstellungsseite

## 1.75.0

- Verbesserung einiger Website-Lokalisierungsregeln, dank des Beitrags von **@qjwh**.
- Hinzufügen der Optionen "ChatGPT Translation Prompt Customization" und "As System Prompt" Danke an **@Dawn-Xu-helloworld** für die Zusammenarbeit!
- Hinzufügen der Funktion "Umwandlung erzwingen" Danke an **@wrk-123** für den Beitrag!
- Fügen Sie ein Popup-Fenster zur Bestätigung der Codeübermittlung hinzu, um den Titelnamen anzuzeigen.
- Probe mit der Option Auto-Commit hinzufügen (standardmäßig ausgeschaltet)
- Hinzufügen der Funktion "Themenfragenbeschriftungen ausblenden", die standardmäßig deaktiviert ist.
- Ersetzung der Schnittstelle des "Yodo Translator"
- Turnhallentitel springen nicht zu vjudge
- &nbsp;Korrektur der ` `-Symbole in der Code-Block-Verschönerung
- Behebung des Problems, dass Problemset-Quellen nicht korrekt übermittelt werden können, wenn die Länge der Fragenummer nicht 1 ist Danke an **@WindJ0Y** für den Beitrag!
- Der Monaco-Editor wendet das Thema nicht korrekt an, wenn das Thema auf "Folgen" eingestellt ist. Danke an **@cscnk52** für den Beitrag!
- Der Code-Editor wird nicht mehr korrekt geladen, wenn die Titel-Links in Kleinbuchstaben gesetzt sind
- Behebt, dass LaTeX nicht korrekt zwischen Zeilen ersetzt, behebt Leistungsprobleme mit verwandten Regeln
- Fehler bei der Neuübersetzung von "Alte Ergebnisse sammeln" behoben.
- Behebung des Problems, dass die Kopierschaltfläche auf der Anmeldeseite nicht funktioniert
- Skript-Tags werden bei der MarkDown-Konvertierung nicht mehr gefiltert
- Verwenden Sie Polyfill für die Kompatibilität mit Browsern, die die Methode dialog.showModal() nicht unterstützen (z. B. Firefox79).

## 1.74.2

- Behebt Probleme aus dem letzten Fix Danke an @Dechancer für das Feedback!

## 1.74.1

- Normales Pre mit weißem Hintergrund im dunklen Modus korrigiert, wenn die Codeblockverschönerung nicht aktiviert ist

## 1.74.0

- Schaltfläche hinzufügen, um zu VJudge zu springen
- Fügen Sie die Funktion "Codeblock verschönern" hinzu, verwenden Sie den Monaco-Editor, um den vordefinierten Codeblock auf der Seite zu ersetzen, dies wird auch den Effekt der Codeanzeige im dunklen Modus verbessern.
- Verbesserungen an verschiedenen Abfragemethoden in Clist Rating zur Behebung von Problemen beim korrekten Erhalt von Daten
- Verbesserung der Eingabeaufforderung für ChatGPT-Übersetzungen und Behebung eines möglichen Injektionsfehlers, der zu unvollständigen Übersetzungen führen konnte.
- Verbesserungen am LaTeX Replace/Restore-bezogenen Code, der nun bei Mehrfachverschachtelung korrekt wiederhergestellt wird
- Verbesserung der Robustheit von Website-Lokalisierungsmethoden
- Anpassung des Codes in Bezug auf den dunklen Modus unter Verwendung von Variablen, um die Einheitlichkeit des Stils und der Verwaltung zu erleichtern
- Ersetzen Sie das CDN staticfile.org durch staticfile.net
- MarkDown-Daten enthalten keine Interline-Codeblöcke mehr
- Methoden zur Bestimmung, ob Text Code ist oder nicht, entfernen
- Behebung des Problems, dass die Listenbewertung einiger Themen auf der Seite mit der Fragenliste als nicht gefunden angezeigt werden kann.
- Behebung des Problems der abnormalen Anzeige von Listenpunkten auf der Seite mit den Fragensätzen.
- Behebung des Problems der nicht ausgerichteten Differenzvergleichsstile beim Online-Test von Code
- Behebung des Problems, dass deepl 429 die Warnmeldung nach der Meldung eines Fehlers nicht korrekt anzeigt.
- Behebt ein Problem, bei dem auf der Titelseite "Clist Rating" als "Nicht gefunden" angezeigt werden kann
- Das Problem, dass die Rock Valley Sprungmethode in älteren Versionen von Tampermonkey einen Fehler meldete, wurde behoben.
- Behebung einer unerwarteten Sackgasse, die dazu führt, dass die Seite hängen bleibt, wenn die MathJax-Bibliotheksdatei nicht korrekt geladen ist
- Das Problem, dass DeepL die Warnmeldung während der Übersetzung nicht korrekt anzeigt, wenn im freien Modus übersetzt wird, wurde behoben.
- Behebt ein Problem, bei dem Skripte möglicherweise nicht korrekt geladen werden
- Behebt ein Problem, bei dem die Typografie zwischen benachbarten LaTeX-Formeln unterbrochen werden konnte
- Einige andere Optimierungen und Verbesserungen

## 1.73.0

- Unabhängigkeit der lokalisierten Daten der Website als externes JSON für eine einfache Pflege
- Skripte unterstützen die Internationalisierung und nutzen die Crowdin-Plattform, um die Lokalisierung zu automatisieren.
- Ersetzen Sie einige Schaltflächen durch Symbolschaltflächen
- Fügen Sie Unterstützung für die DeepL API hinzu, einschließlich der offiziellen api-free, api-pro und deeplx. Danke an @Vistarin für den Vorschlag!
- Fügen Sie Unterstützung für deepl und chatgpt hinzu, um Saldenabfragen zu konfigurieren. Beachten Sie, dass dies auch erfordert, dass Ihr Dienstanbieter dies unterstützt und die entsprechenden APIs bereitstellt.
- Fügen Sie eine Beurteilung des Textes vor der Übersetzung hinzu. Wenn der Verdacht besteht, dass es sich um einen Codeschnipsel handelt, wird er nicht automatisch übersetzt, sondern es wird ein Popup-Fenster angezeigt, bevor Sie auf die Übersetzung klicken.
- Hinzufügen der Möglichkeit, die Zielsprache für Übersetzungsdienste auszuwählen
- Fügen Sie eine Info-Seite sowie einen Aktualisierungskanal und eine Auswahl von Aktualisierungsquellen hinzu.
- Hinzufügen einer Wartungsseite zur Fehlersuche, einschließlich Cache-Aktualisierung, Datenlöschung, Import und Export.
- Fügen Sie die benutzerdefinierte Option： 'Position der Einreichungsschaltfläche des Code-Editors' hinzu, Standardeinstellung ist unten, danke an @lishufood für den Vorschlag!
- Verbessern Sie jede Ladefunktion, entfernen Sie einige unnötige Wartebeziehungen, beschleunigen Sie die Ladezeit des Skripts
- Verbesserungen bei der Übersetzungsfunktion und der Anzeige von Fehlermeldungen.
- Verbesserung der Leistung der automatischen Übersetzung und des Problems, dass sie nicht automatisch übersetzt werden darf
- Verbesserungen an Codebeispielen im Zusammenhang mit der Online-Ausführung
- Verbesserte Methode zum Vergleichen von Unterschieden in Laufergebnissen codeDiff()
- Der Hintergrundinhalt des Dialogfensters scrollt nicht mehr mit der Maus.
- Verbessern Sie den Stil des Code-Editors, wenn er auf der rechten Seite, unten und im Vollbildmodus fixiert ist. Danke an @lishufood für den Vorschlag!
- Verbesserte Anzeige des Panels .html2md-panel im einfachen Modus
- Verbessern Sie den Stil der Konfigurationsseite im Einstellungsfenster
- Fehler im acmsguru Titelseiteneditor beheben
- Behebung des Problems, dass der Code-Editor der Ausgabeseite einen Fehler meldete, wenn Sie die Mobil-/Desktop-Version der Website umschalteten.
- Behebung eines Fehlers in der Methode getMarkdown(), durch den Daten fälschlicherweise direkt im DOM gespeichert wurden, was zu einer Leistungsverschlechterung führte.
- Beheben Sie das Problem, dass die Übersetzungsschaltfläche innerhalb des gefalteten Blocks nicht angezeigt wird, nachdem Sie 'Folded Block Auto Expand' deaktiviert haben, dank des Feedbacks von @MoYuToGo!
- Da die Option "Nicht warten, bis die Seitenressourcen vollständig geladen sind" theoretisch bedeutungslos ist, wurde sie umbenannt, um den zuvor möglichen Zustand zu deaktivieren
- Anpassung einer großen Anzahl von Codestrukturen
- **Viele Umbenennungen von CSS-Klassen, so dass Sie diese möglicherweise anpassen müssen, wenn Sie die benutzerdefinierten Stile von Stylus verwenden**.
- Einige andere Anpassungen und Verbesserungen

## 1.72.0

- Behebung des Problems, dass das ChatGPT-Konfigurationspanel nicht angezeigt wird, dank des Feedbacks von @caoxuanming!
- Fügen Sie einen Konfigurationsschalter "Mouse Scroll Lock" hinzu, der standardmäßig aktiviert ist. Danke an @liuhao6 für den Vorschlag.

## 1.71.0

- Die API für die Listenbewertung wurde auf v4 aktualisiert, die Art und Weise, wie die Daten auf der Titelseite abgerufen werden, wurde angepasst, damit sie über die API abgerufen werden können. Danke an @wrkwrk für den Vorschlag!
- Hinzufügen der ChatGPT-Übersetzungsoption "Streaming", standardmäßig aktiviert
- Fix Google Translate Ergebnisse sind leer Danke an @shicxin für das Feedback!
- Fügen Sie einen Konfigurationsschalter "Doppelte Bestätigung für Code Commits" hinzu, der standardmäßig aktiviert ist. Danke an @Rikkual für den Vorschlag!
- Schaltflächen zum Hinzufügen kleiner Bereiche zur vollständigen Themenseite
- Das Problem, dass das Übersetzungsergebnis nicht angezeigt wird, wenn die komplette Themenseite zum Drucken mit der rechten Maustaste angeklickt wird, wurde behoben. Danke an @zfs732 für das Feedback!

## 1.70.0

- Fügen Sie unten auf der Titelseite einen Code-Editor hinzu, um das Testen von Online-Code, die Übermittlung von Code usw. zu unterstützen. Details finden Sie auf der Informationsseite.
- Das Problem wurde behoben, dass beim Einfügen von Skript-Schaltflächen und beim Übersetzen von Ergebnissen diese als Änderungen an der Titelbeschreibung behandelt wurden.
- Verbesserung der Seite Portfolio Mashup Management
- Fügen Sie die Funktion "Kurztext automatisch übersetzen" hinzu, die standardmäßig deaktiviert ist.
- Verbesserte Implementierung von Warteintervallen für Übersetzungen, jetzt funktionieren Warteintervalle global
- Verbesserungen bei der Implementierung von "Zielbereich anzeigen".
- Verbesserter dunkler Modus, verbesserte Hover-Stile für Beispielelemente Danke an @SUPERLWR für das Feedback!
- Option des Einstellungsfeldes hinzufügen: Übersetzung - Zeichen im Text filtern Danke an @Dog_E, CreMicro für ihr Feedback!
- Dank des Feedbacks von Vistarin wurde das Problem behoben, dass die Clist-Bewertung nicht korrekt angezeigt wurde, nachdem die Option "Ladewarnungen anzeigen" deaktiviert wurde.
- Einige andere Verbesserungen und Korrekturen