## 1.73

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
- Verbesserungen bei der Übersetzungsfunktion und der Anzeige von Fehlermeldungen.
- Verbesserung der Leistung der automatischen Übersetzung und des Problems, dass sie nicht automatisch übersetzt werden darf
- Verbesserungen an Codebeispielen im Zusammenhang mit der Online-Ausführung
- Verbesserte Methode zum Vergleichen von Unterschieden in Laufergebnissen codeDiff()
- Der Hintergrundinhalt des Dialogfensters scrollt nicht mehr mit der Maus.
- Verbessern Sie den Stil des Code-Editors, wenn er auf der rechten Seite, unten und im Vollbildmodus fixiert ist. Danke an @lishufood für den Vorschlag!
- Verbesserte Anzeige des Panels .html2md-panel im einfachen Modus
- Verbessern Sie den Stil der Konfigurationsseite im Einstellungsfenster
- Behebung des Problems, dass der Code-Editor der Ausgabeseite einen Fehler meldete, wenn Sie die Mobil-/Desktop-Version der Website umschalteten.
- Behebung eines Fehlers in der Methode getMarkdown(), durch den Daten fälschlicherweise direkt im DOM gespeichert wurden, was zu einer Leistungsverschlechterung führte.
- Beheben Sie das Problem, dass die Übersetzungsschaltfläche innerhalb des gefalteten Blocks nicht angezeigt wird, nachdem Sie 'Folded Block Auto Expand' deaktiviert haben, dank des Feedbacks von @MoYuToGo!
- Da die Option "Nicht warten, bis die Seitenressourcen vollständig geladen sind" theoretisch bedeutungslos ist, wurde sie umbenannt, um den zuvor möglichen Zustand zu deaktivieren
- Anpassung einer großen Anzahl von Codestrukturen
- **Viele Umbenennungen von CSS-Klassen, so dass Sie diese möglicherweise anpassen müssen, wenn Sie die benutzerdefinierten Stile von Stylus verwenden**.
- Einige andere Optimierungen und Verbesserungen

## 1.72

- Behebung des Problems, dass das ChatGPT-Konfigurationspanel nicht angezeigt wird, dank des Feedbacks von @caoxuanming!
- Fügen Sie einen Konfigurationsschalter "Mouse Scroll Lock" hinzu, der standardmäßig aktiviert ist. Danke an @liuhao6 für den Vorschlag.

## 1.71

- Die API für die Listenbewertung wurde auf v4 aktualisiert, die Art und Weise, wie die Daten auf der Titelseite abgerufen werden, wurde angepasst, damit sie über die API abgerufen werden können. Danke an @wrkwrk für den Vorschlag!
- Hinzufügen der ChatGPT-Übersetzungsoption "Streaming", standardmäßig aktiviert
- Fix Google Translate Ergebnisse sind leer Danke an @shicxin für das Feedback!
- Fügen Sie einen Konfigurationsschalter "Doppelte Bestätigung für Code Commits" hinzu, der standardmäßig aktiviert ist. Danke an @Rikkual für den Vorschlag!
- Schaltflächen zum Hinzufügen kleiner Bereiche zur vollständigen Themenseite
- Das Problem, dass das Übersetzungsergebnis nicht angezeigt wird, wenn die komplette Themenseite zum Drucken mit der rechten Maustaste angeklickt wird, wurde behoben. Danke an @zfs732 für das Feedback!

## 1.70

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
