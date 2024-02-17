## 1.73

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
- Quelques autres ajustements et améliorations

## 1.72

- Correction du problème d'affichage du panneau de configuration de ChatGPT, grâce au feedback de @caoxuanming !
- Ajout d'un interrupteur de configuration "Mouse Scroll Lock", activé par défaut, merci à @liuhao6 pour la suggestion.

## 1.71

- Mise à jour de l'API pour l'évaluation des listes en v4, ajustement de la façon dont les données sont récupérées sur la page de titre pour être récupérées via l'API, merci à @wrkwrk pour la suggestion !
- Ajouter l'option "Streaming" de la traduction de ChatGPT, activée par défaut
- Corriger les résultats de Google Translate sont vides Merci à @shicxin pour le feedback !
- Ajouter un interrupteur de configuration "Double confirmation pour les commits de code", activé par défaut Merci à @Rikkual pour la suggestion !
- Boutons permettant d'ajouter de petites zones à la page complète de l'ensemble des sujets
- Corrige le problème d'affichage du résultat de la traduction lorsque l'on clique avec le bouton droit de la souris sur la page de l'ensemble des thèmes pour l'imprimer Merci à @zfs732 pour ses commentaires !

## 1.70

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
