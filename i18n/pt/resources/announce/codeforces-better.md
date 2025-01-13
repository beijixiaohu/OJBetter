## 1.77.0

- Adicionar a opção "Verificador de resultados de testes de amostras
- Correção do embelezamento do bloco de código que não muda corretamente de tema quando o modo escuro é "Seguir o sistema"
- Corrigir o problema de a "Substituição do texto do estado da revisão" não ser substituída corretamente.
- Corrigir o problema do erro de tradução do Arigatou
- Corrigir o problema de o resultado da tradução não ser apresentado na parte de resposta do comentário em modo segmentado
- Corrigir o problema da falta do último comentário na página de diferenciação de comentários
- Corrige a sobreposição de cores LaTeX no Modo Escuro
- Corrigir o problema de o intervalo de espera ser inválido no modo "Tradução segmentada".
- Correção de um problema ao consultar os saldos da API, graças a **@x1uc**.
- Corrigir conflito de nome de classe de sobreposição
- Melhoria das regras de localização do sítio Web, graças a **@xiezheyuan**, **@Acfboy** pela sua contribuição!

## 1.76.0

- \*_Substituir o CDN do repositório público para [SUSTech Mirror](https://mirrors.sustech.edu.cn/help/cdnjs.html), ver [issue](https://github.com/beijixiaohu/OJBetter/issues/151)_ por motivos. \*

- Adicionada a funcionalidade "Substituição de texto do estado da revisão", graças à colaboração de **@wrk-123**.

- Ajustar a estrutura do esquema da página de definições

## 1.75.0

- Melhoria de algumas regras de localização de sítios Web, graças à contribuição de **@qjwh**.
- Adicionar as opções "Personalização do prompt de tradução do ChatGPT" e "Como prompt do sistema" Obrigado a **@Dawn-Xu-helloworld** pela colaboração!
- Adicionar a funcionalidade "Forçar conversão de redução" Obrigado a **@wrk-123** pela contribuição!
- Adicionar janela pop-up de confirmação de envio de código para exibir o nome do título.
- Adicionar amostra através da opção Auto-Commit (desactivada por predefinição)
- Adicionar a funcionalidade "Ocultar etiquetas de perguntas de tópicos", desactivada por predefinição.
- Substituição da interface do "Yodo Translator"
- Correção de títulos de ginásio que não saltam para vjudge
- &nbsp;Correção de símbolos ` ` no embelezamento de blocos de código
- Corrigir o problema de não ser possível submeter corretamente as fontes do conjunto de problemas quando o comprimento do número da pergunta não é 1.
- Corrigir o editor do Monaco que não aplica o tema corretamente quando o tema está definido para seguir Obrigado a **@cscnk52** pela contribuição!
- Correção do editor de código que não carrega corretamente quando as hiperligações do título do conjunto de títulos estão em minúsculas
- Corrige o LaTeX que não substitui corretamente entre linhas, corrige problemas de desempenho com regras relacionadas
- Correção do erro ao retraduzir "Recolher resultados antigos".
- Corrigir o problema de o botão de cópia não funcionar na página de envio
- Correção de etiquetas de script não filtradas durante a conversão MarkDown
- Utilize o polyfill para compatibilidade com navegadores que não suportam o método dialog.showModal() (por exemplo, Firefox79).

## 1.74.2

- Corrige problemas da última correção Obrigado a @Dechancer pelo feedback!

## 1.74.1

- Correção de um pre normal com fundo branco no modo escuro quando o embelezamento do bloco de código não está ativado

## 1.74.0

- Adicionar botão para saltar para VJudge
- Adicionar a função "embelezar bloco de código", utilizar o editor monaco para substituir o bloco de código anterior na página, o que também melhorará o efeito de visualização do código no modo escuro.
- Melhorias em vários métodos de pedido no Clist Rating para resolver problemas de não obtenção correcta de dados
- Melhorar a prontidão das traduções do ChatGPT e corrigir um possível erro de injeção que poderia levar a traduções incompletas.
- Melhorias no código relacionado com a substituição/restauro do LaTeX, que agora restaura corretamente no caso de múltiplos aninhamentos
- Aumentar a robustez dos métodos de localização de sítios Web
- Ajustar o código relativo ao modo escuro, utilizando variáveis para facilitar a uniformidade do estilo e da gestão
- Substituir CDN staticfile.org por staticfile.net
- Os dados de MarkDown já não contêm blocos de códigos entre linhas
- Remover métodos relacionados com a determinação do facto de o texto ser ou não código
- Correção do problema em que a classificação da lista de alguns tópicos na página da lista de perguntas pode ser apresentada como não encontrada.
- Corrigir o problema de apresentação anormal das pontuações do clist na página do conjunto de perguntas.
- Corrigir o problema de estilos de comparação de diferenças não alinhados em testes online de código
- Corrigir o problema de o deepl 429 não apresentar corretamente a mensagem de alerta após comunicar um erro.
- Corrige um problema em que a página de título Clist Rating pode mostrar não encontrado
- Corrigido o problema em que o método de salto de Rock Valley reportava um erro em versões mais antigas do Tampermonkey
- Correção de um ciclo morto inesperado que faz com que a página fique bloqueada quando o ficheiro da biblioteca MathJax não é carregado corretamente
- Foi corrigido o problema em que DeepL não apresentava corretamente a mensagem de alerta na tradução quando traduzia em modo livre.
- Corrige o problema em que os scripts podem não ser carregados corretamente
- Corrige um problema em que a tipografia entre fórmulas LaTeX vizinhas podia ser quebrada
- Alguns outros ajustes e melhorias

## 1.73.0

- Independência dos dados localizados do sítio Web como JSON externo para facilitar a manutenção
- Os guiões suportam a internacionalização e utilizam a plataforma crowdin para automatizar a localização.
- Substitua alguns botões por botões de ícones
- Adicione suporte para a API DeepL, incluindo a api-free oficial, api-pro e deeplx, graças a @Vistarin pela sugestão!
- Adicione suporte para deepl e chatgpt para configurar pesquisas de saldo, note que isto também requer que o seu fornecedor de serviços o suporte e forneça as APIs adequadas
- Se suspeitar que se trata de um fragmento de código, não será traduzido automaticamente e ser-lhe-á pedida uma janela pop-up antes de clicar na tradução.
- Adicione a capacidade de selecionar a língua de chegada para os serviços de tradução
- Adicione uma página sobre, bem como um canal de atualização e selecções de fonte de atualização
- Adicione a página de manutenção de depuração, incluindo a atualização da cache, a limpeza de dados, a importação e a exportação.
- Adicione a opção personalizada： 'Code Editor Submit Button Position' (Posição do botão de envio do editor de código), a predefinição é inferior, graças a @lishufood pela sugestão!
- Melhore cada função de carregamento, remova algumas relações de espera desnecessárias, acelere o tempo de carregamento do script
- Melhorias na função de tradução e na visualização de mensagens de erro.
- Melhoria do desempenho da tradução automática e o problema de não poder ser traduzido automaticamente
- Melhorias nas amostras de código relacionadas com a execução em linha
- Método melhorado para comparar diferenças nos resultados da execução codeDiff()
- O conteúdo de fundo da janela de diálogo melhorado já não se desloca com o rato.
- Melhore o estilo do editor de código quando este está fixo no lado direito, em baixo e em ecrã inteiro, graças a @lishufood pela sugestão!
- Melhoria da apresentação do painel .html2md-panel no modo simples
- Melhore o estilo da página de configuração no painel de definições
- Corrija os erros do editor de páginas de título do acmsguru
- Corrija o problema em que o editor de código da página de problemas reportava um erro depois de mudar a versão móvel/desktop do sítio Web.
- Corrigir um erro no método getMarkdown(), que armazenava incorretamente dados diretamente no DOM, resultando numa degradação do desempenho.
- Corrija o problema de o botão de tradução dentro do bloco dobrado não ser apresentado depois de desativar a "Expansão automática do bloco dobrado", graças ao feedback de @MoYuToGo!
- Uma vez que a opção "Não esperar que os recursos da página sejam totalmente carregados" é teoricamente sem sentido, foi renomeada para desmarcar o estado anteriormente possível
- Adaptação de um grande número de estruturas de código
- **muitas renomeações de classes css, pelo que poderá ter de as ajustar se estiver a utilizar estilos personalizados do stylus**
- Alguns outros ajustamentos e melhorias

## 1.72.0

- Corrija o problema de o painel de configuração do ChatGPT não aparecer, graças ao feedback de @caoxuanming!
- Adicione um interrutor de configuração "Mouse Scroll Lock", ativado por predefinição, graças a @liuhao6 pela sugestão.

## 1.71.0

- Actualizou a API para a classificação da lista para a v4, ajustou a forma como os dados são obtidos na página de título para serem obtidos através da API, graças a @wrkwrk pela sugestão!
- Adicione a opção "Streaming" da tradução do ChatGPT, activada por predefinição
- Corrigir os resultados do Google Translate que estão vazios Obrigado a @shicxin pelo feedback!
- Adicione um interrutor de configuração "Confirmação dupla para commits de código", ativado por predefinição Obrigado a @Rikkual pela sugestão!
- Botões para adicionar pequenas áreas à página completa do conjunto de tópicos
- Corrija o problema de o resultado da tradução não ser mostrado quando se clica com o botão direito do rato na página completa do conjunto de tópicos para imprimir.

## 1.70.0

- Adicione um editor de código na parte inferior da página de título para suportar testes de código online, submissão de código, etc. Para mais informações, leia a página de informações.
- Foi corrigido o problema em que, ao inserir botões de script e traduzir resultados, estes eram tratados como alterações à descrição do título.
- Melhoria da página Gestão do Mashup de Portefólio
- Adicione a função "Tradução automática de texto curto", desactivada por predefinição.
- Implementação melhorada dos intervalos de espera de tradução, agora os intervalos de espera funcionam globalmente
- Melhorias na implementação de "mostrar a área de alcance do alvo"
- Modo escuro melhorado, estilos de foco melhorados em elementos de amostra Obrigado a @SUPERLWR pelo feedback!
- Adicionar a opção do painel de definições: Tradução - Filtrar \*\*sinais no texto Agradecimentos a @Dog_E, CreMicro pelos seus comentários!
- Foi corrigido o problema em que a Classificação da Lista não era apresentada corretamente depois de desativar a opção "Mostrar alertas de carregamento", graças ao feedback de Vistarin.
- Algumas outras melhorias e correcções
