## 1.15.2

- Entfernen Sie Methoden, die nicht mehr sinnvoll sind：Bestimmen Sie, ob es sich bei dem Text wahrscheinlich um Code handelt

## 1.15.0

- MarkDown-Daten enthalten keine Interline-Codeblöcke mehr
- Verbesserung der Lokalisierungsregeln für Websites
- Verbesserte Methoden zur Bestimmung, ob ein Text ein Codefragment ist
- Behebung eines nicht definierten Fehlers in der Funktion "Codeblock verschönern".
- Behebung von Fehlern bei der Methode `OJB_observeElement()`
- Fix für Website-Lokalisierung Methode `strictTraverseTextNodes()` nicht funktioniert

## 1.14.2

- Behebung eines Styling-Fehlers im Editor im dunklen Modus
- Behebung des Problems, dass der Anfangswert der Sprachauswahl im Code-Editor falsch ist
- Behebung der Ausnahme bei der Initialisierung des Code-Editors in Nicht-Chrom-Browsern

## 1.14.0

- Code-Editor wird in manchen Fällen nicht korrekt geladen Danke an @smart_stupid @acstor für das Feedback!

## 1.13.0

> **Dieses Update synchronisiert Änderungen von Codeforces Better v1.68 - 1.74 mit AtCoder Better**.

- Schaltfläche hinzufügen, um zu VJudge zu springen

- Fügen Sie die Funktion "Codeblock verschönern" hinzu, verwenden Sie den Monaco-Editor, um den vordefinierten Codeblock auf der Seite zu ersetzen, dies wird auch den Effekt der Codeanzeige im dunklen Modus verbessern.

- Verbesserungen an verschiedenen Abfragemethoden in Clist Rating zur Behebung von Problemen beim korrekten Erhalt von Daten

- Verbesserung der Eingabeaufforderung für ChatGPT-Übersetzungen und Behebung eines möglichen Injektionsfehlers, der zu unvollständigen Übersetzungen führen konnte.

- Verbesserungen am LaTeX Replace/Restore-bezogenen Code, der nun bei Mehrfachverschachtelung korrekt wiederhergestellt wird

- Verbesserung der Robustheit von Website-Lokalisierungsmethoden

- Anpassung des Codes in Bezug auf den dunklen Modus unter Verwendung von Variablen, um die Einheitlichkeit des Stils und der Verwaltung zu erleichtern

- Ersetzen Sie das CDN staticfile.org durch staticfile.net

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

------

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

------

- Behebung des Problems, dass das ChatGPT-Konfigurationspanel nicht angezeigt wird, dank des Feedbacks von @caoxuanming!
- Fügen Sie einen Konfigurationsschalter "Mouse Scroll Lock" hinzu, der standardmäßig aktiviert ist. Danke an @liuhao6 für den Vorschlag.

------

- Die API für die Listenbewertung wurde auf v4 aktualisiert, die Art und Weise, wie die Daten auf der Titelseite abgerufen werden, wurde angepasst, damit sie über die API abgerufen werden können. Danke an @wrkwrk für den Vorschlag!
- Hinzufügen der ChatGPT-Übersetzungsoption "Streaming", standardmäßig aktiviert
- Fix Google Translate Ergebnisse sind leer Danke an @shicxin für das Feedback!
- Fügen Sie einen Konfigurationsschalter "Doppelte Bestätigung für Code Commits" hinzu, der standardmäßig aktiviert ist. Danke an @Rikkual für den Vorschlag!
- Schaltflächen zum Hinzufügen kleiner Bereiche zur vollständigen Themenseite
- Das Problem, dass das Übersetzungsergebnis nicht angezeigt wird, wenn die komplette Themenseite zum Drucken mit der rechten Maustaste angeklickt wird, wurde behoben. Danke an @zfs732 für das Feedback!

------

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
