## 1.80.0

- Ajout de la fonction personnalisée "Couleur du texte de la traduction", vous pouvez configurer la couleur du texte du résultat de la traduction dans les paramètres, merci pour la contribution de **@wrk-123**.
- Ajout d'une boîte de dialogue de confirmation pour "Sauter le bloc de code ou non" lors de la traduction afin d'éviter de mal traduire le contenu du code.
- Ajout du raccourci Ctrl+Enter pour soumettre le code, merci à **@wrk-123**.
- Corrige les sauts de ligne ` <br>` manquants lors de la conversion MarkDown, merci à **@wrk-123** pour sa contribution !
- Correction du problème des caractères d'échappement HTML lors de la copie de MarkDown (par exemple `&lt;` `&gt;`), merci à **@wrk-123** pour sa contribution !
- Correction de la gestion des sauts de ligne pour les blocs de code (` <pre>`) dans les conversions MarkDown, merci à **@wrk-123** pour sa contribution !
- Correction de la conversion MarkDown sans filtrage des balises ` <style>`.
- Correction du problème d'erreur de syntaxe des liens Markdown causé par la règle chinoise de remplacement des crochets, grâce à la contribution de **@wrk-123**.
- Correction de la logique de jugement du code d'état HTTP de Yodo Translator, grâce à la contribution de **@wrk-123**.
- Correction d'un problème de correspondance des cas de PP, merci à **@awerty-noob** pour sa contribution !
- Corriger les problèmes redondants de changement de niveau, merci à **@wrk-123** pour sa contribution !
- Amélioration de la robustesse de la reconnaissance des éléments MathJax, prise en charge d'un plus grand nombre de variantes de noms de classes MathJax, grâce à **@wrk-123**.
- Amélioration de la logique d'affichage de la fonction d'embellissement du bloc de code, n'affichant plus le bloc de code qui était caché, grâce à la contribution de **@wrk-123**.
- Améliorer l'élément button en ajoutant l'attribut `type='button'` pour éviter les fausses soumissions de formulaire.
- Améliorer le texte du bouton de copie de traduction lorsqu'il est désactivé.
- Amélioration de la décision "topic not found" pour le saut à Luogu, merci à **@wrk-123** pour sa contribution !
- Amélioration des règles de localisation des sites web, grâce aux contributions de **@qjwh**, **@wrk-123**.

## 1.79.0

- Suppression de la dépendance au dépôt de scripts Greasyfork
- Remplacer la source de mise à jour par défaut par AliCloud OSS
- Correction du problème de style incorrect des boutons sur certaines pages de titre
- Améliorations：Ajustement du mot-guide par défaut de GPT
- Améliorations：Donner une indication claire lorsque le code en ligne est épuisé

## 1.77.0

- Ajouter l'option "Vérificateur de résultats de tests d'échantillons".
- Correction de l'embellissement des blocs de code qui ne change pas de thème correctement lorsque le mode sombre est "Follow System".
- Correction du problème de remplacement du texte de l'état d'avancement de l'examen.
- Corriger le problème de l'erreur de traduction d'Arigatou
- Correction du problème d'affichage du résultat de la traduction dans la partie réponse du commentaire en mode segmenté
- Correction du problème de disparition du dernier commentaire sur la page de différenciation des commentaires
- Correction de l'écrasement des couleurs LaTeX en mode sombre
- Correction du problème d'invalidité de l'intervalle d'attente en mode "Traduction segmentée".
- Correction d'un problème lors de l'interrogation des soldes de l'API, grâce à **@x1uc**.
- Correction d'un conflit de nom de classe de superposition
- Amélioration des règles de localisation des sites web, merci à **@xiezheyuan**, **@Acfboy** pour leur contribution !

## 1.76.0

- \*_Remplacer le CDN du dépôt public vers [SUSTech Mirror](https://mirrors.sustech.edu.cn/help/cdnjs.html), voir [issue](https://github.com/beijixiaohu/OJBetter/issues/151)_ pour des raisons. \*

- Ajout de la fonctionnalité "Remplacement du texte de l'état de l'examen", grâce à la collaboration de **@wrk-123**.

- Ajustement de la structure de la page des paramètres

## 1.75.0

- Amélioration de certaines règles de localisation de sites web, grâce à la contribution de **@qjwh**.
- Ajouter les options "ChatGPT Translation Prompt Customisation" et "As System Prompt" Merci à **@Dawn-Xu-helloworld** pour sa collaboration !
- Ajouter la fonctionnalité "Force Turndown conversion" Merci à **@wrk-123** pour sa contribution !
- Ajouter une fenêtre pop-up de confirmation de soumission de code pour afficher le nom du titre.
- Ajouter un échantillon par l'option Auto-Commit (désactivée par défaut)
- Ajout de la fonctionnalité "Masquer les étiquettes des questions", désactivée par défaut.
- Remplacement de l'interface de "Yodo Translator"
- Correction des titres de gymnase qui ne sautent pas en vjudge
- &nbsp;Correction des symboles ` ` dans l'embellissement des blocs de code
- Corriger le problème que les sources de problemset ne peuvent pas être soumises correctement lorsque la longueur du numéro de la question n'est pas 1 Merci à **@WindJ0Y** pour sa contribution !
- Correction de l'éditeur Monaco qui n'applique pas le thème correctement lorsque le thème est défini sur follow Merci à **@cscnk52** pour sa contribution !
- Correction de l'éditeur de code qui ne se charge pas correctement lorsque les liens de l'ensemble des titres sont en minuscules
- Corrige le fait que LaTeX ne remplace pas correctement les lignes, corrige les problèmes de performance avec les règles associées.
- Correction d'une erreur lors de la traduction de "Collecter les anciens résultats".
- Corriger le problème du bouton de copie qui ne fonctionne pas dans la page de soumission
- Correction des balises de script non filtrées lors de la conversion MarkDown
- Utiliser le polyfill pour la compatibilité avec les navigateurs qui ne supportent pas la méthode dialog.showModal() (par exemple Firefox79).

## 1.74.2

- Corrige les problèmes de la dernière correction Merci à @Dechancer pour son feedback !

## 1.74.1

- Correction d'un pré normal avec un fond blanc en mode sombre lorsque l'embellissement des blocs de code n'est pas activé

## 1.74.0

- Ajouter un bouton pour accéder à VJudge
- Ajout de la fonction "embellir le bloc de code", utiliser l'éditeur monaco pour remplacer le bloc de pré-code sur la page, cela améliorera également l'effet d'affichage du code en mode sombre.
- Améliorations apportées à diverses méthodes de requête dans Clist Rating afin de résoudre les problèmes liés à l'obtention incorrecte des données
- Amélioration de la rapidité des traductions de ChatGPT et correction d'une erreur d'injection pouvant entraîner des traductions incomplètes.
- Amélioration du code LaTeX de remplacement/restauration, qui restaure maintenant correctement dans les cas d'imbrication multiple.
- Améliorer la robustesse des méthodes de localisation des sites web
- Ajustement du code relatif au mode sombre, en utilisant des variables pour faciliter l'uniformité du style et de la gestion
- Remplacer le CDN staticfile.org par staticfile.net
- Les données MarkDown ne contiennent plus de blocs de codes interlignes
- Supprimer les méthodes permettant de déterminer si un texte est un code ou non
- Correction d'un problème d'affichage de la classification de certains sujets sur la page de la liste des questions comme n'étant pas trouvée.
- Correction du problème d'affichage anormal des scores de la liste sur la page de la série de questions.
- Correction du problème des styles de comparaison de différences non alignées dans les tests en ligne de code
- Correction du problème qui fait que deepl 429 n'affiche pas correctement le message d'alerte après avoir signalé une erreur.
- Correction d'un problème où la page de titre Clist Rating pouvait afficher "non trouvé".
- Correction du problème de la méthode de saut de la vallée de la roche qui signalait une erreur dans les anciennes versions de Tampermonkey.
- Correction d'une boucle morte inattendue entraînant le blocage de la page lorsque le fichier de la bibliothèque MathJax n'est pas correctement chargé.
- Correction du problème qui faisait que DeepL n'affichait pas correctement le message d'alerte en cours de traduction lors de la traduction en mode libre.
- Correction d'un problème où les scripts peuvent ne pas se charger correctement
- Corrige un problème de typographie entre des formules LaTeX voisines.
- Quelques autres ajustements et améliorations

## 1.73.0

- Indépendance des données localisées du site web en tant que JSON externe pour faciliter la maintenance
- Les scripts prennent en charge l'internationalisation et utilisent la plateforme crowdin pour automatiser la localisation.
- Remplacer certains boutons par des boutons icônes
- Ajouter la prise en charge de l'API DeepL, y compris les API officielles api-free, api-pro et deeplx, merci à @Vistarin pour la suggestion !
- Ajouter la prise en charge de deepl et chatgpt pour configurer les recherches de soldes, notez que cela nécessite également que votre fournisseur de services le prenne en charge et fournisse les API appropriées.
- Ajoutez un jugement sur le texte avant la traduction, s'il est suspecté d'être un extrait de code, il ne sera pas automatiquement traduit, et une fenêtre pop-up sera demandée avant de cliquer sur la traduction.
- Ajouter la possibilité de sélectionner la langue cible pour les services de traduction
- Ajoutez une page "à propos", ainsi qu'un canal de mise à jour et des sélections de sources de mise à jour.
- Ajout d'une page de maintenance de débogage, comprenant l'actualisation du cache, l'effacement des données, l'importation et l'exportation.
- Ajouter l'option personnalisée： 'Code Editor Submit Button Position', par défaut en bas, merci à @lishufood pour sa suggestion !
- Amélioration de chaque fonction de chargement, suppression de certaines relations d'attente inutiles, accélération du temps de chargement des scripts.
- Amélioration de la fonction de traduction et de l'affichage des messages d'erreur.
- Amélioration des performances de la traduction automatique et problème de la traduction non automatique
- Amélioration des exemples de code relatifs à l'exécution en ligne
- Méthode améliorée pour comparer les différences dans les résultats d'exécution codeDiff()
- Amélioration du contenu de l'arrière-plan de la fenêtre de dialogue qui ne défile plus avec la souris.
- Améliorer le style de l'éditeur de code lorsqu'il est fixé sur le côté droit, en bas et en plein écran, merci à @lishufood pour la suggestion !
- Amélioration de l'affichage du panneau .html2md-panel en mode simple
- Améliorer le style de la page de configuration dans le panneau de configuration
- Corriger les erreurs de l'éditeur de la page de titre d'acmsguru
- Correction d'une erreur dans l'éditeur de code de la page de problèmes après le passage de la version mobile à la version de bureau du site web.
- Correction d'un bogue dans la méthode getMarkdown(), qui stockait incorrectement les données directement dans le DOM, ce qui entraînait une dégradation des performances.
- Correction du problème d'affichage du bouton de traduction à l'intérieur du bloc plié après avoir désactivé la fonction 'Folded Block Auto Expand', grâce au feedback de @MoYuToGo !
- L'option "Ne pas attendre le chargement complet des ressources de la page" n'ayant théoriquement aucun sens, elle a été renommée pour décocher l'état précédemment possible.
- Adaptation d'un grand nombre de structures de code
- **beaucoup de renommage de classes css, donc vous aurez peut-être besoin de modifier cela si vous utilisez les styles personnalisés de stylus**.
- Autres ajustements et améliorations

## 1.72.0

- Correction du problème d'affichage du panneau de configuration de ChatGPT, grâce au feedback de @caoxuanming !
- Ajout d'un interrupteur de configuration "Mouse Scroll Lock", activé par défaut, merci à @liuhao6 pour la suggestion.

## 1.71.0

- Mise à jour de l'API pour l'évaluation des listes en v4, ajustement de la façon dont les données sont récupérées sur la page de titre pour être récupérées via l'API, merci à @wrkwrk pour la suggestion !
- Ajouter l'option "Streaming" de la traduction de ChatGPT, activée par défaut
- Corriger les résultats de Google Translate sont vides Merci à @shicxin pour le feedback !
- Ajouter un interrupteur de configuration "Double confirmation pour les commits de code", activé par défaut Merci à @Rikkual pour la suggestion !
- Boutons permettant d'ajouter de petites zones à la page complète de l'ensemble des sujets
- Corrige le problème d'affichage du résultat de la traduction lorsque l'on clique avec le bouton droit de la souris sur la page de l'ensemble des thèmes pour l'imprimer Merci à @zfs732 pour ses commentaires !

## 1.70.0

- Ajout d'un éditeur de code au bas de la page de titre pour permettre les tests de code en ligne, la soumission de code, etc. Pour plus de détails, veuillez lire la page d'information.
- Correction d'un problème qui, lors de l'insertion de boutons de script et de la traduction des résultats, était traité comme une modification de la description du titre.
- Amélioration de la page Portfolio Mashup Management
- Ajout de la fonction "Traduire automatiquement un texte court", désactivée par défaut.
- Amélioration de la mise en œuvre des intervalles d'attente de traduction, les intervalles d'attente fonctionnent désormais globalement.
- Amélioration de la mise en œuvre de l'option "Afficher la zone cible".
- Amélioration du mode sombre, amélioration des styles de survol sur les éléments de l'échantillon Merci à @SUPERLWR pour son feedback !
- Ajout d'une option dans le panneau de configuration : Translation - Filter \*\*signs in text Merci à @Dog_E, CreMicro pour leurs commentaires !
- Correction d'un problème qui empêchait l'affichage correct du classement de la liste après avoir désactivé l'option "Afficher les alertes de chargement", grâce aux commentaires de Vistarin.
- Autres améliorations et corrections