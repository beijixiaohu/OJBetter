## 1.73

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
- Melhorias na função de tradução e na visualização de mensagens de erro.
- Melhoria do desempenho da tradução automática e o problema de não poder ser traduzido automaticamente
- Melhorias nas amostras de código relacionadas com a execução em linha
- Método melhorado para comparar diferenças nos resultados da execução codeDiff()
- O conteúdo de fundo da janela de diálogo melhorado já não se desloca com o rato.
- Melhore o estilo do editor de código quando este está fixo no lado direito, em baixo e em ecrã inteiro, graças a @lishufood pela sugestão!
- Melhoria da apresentação do painel .html2md-panel no modo simples
- Melhore o estilo da página de configuração no painel de definições
- Corrija o problema em que o editor de código da página de problemas reportava um erro depois de mudar a versão móvel/desktop do sítio Web.
- Corrigir um erro no método getMarkdown(), que armazenava incorretamente dados diretamente no DOM, resultando numa degradação do desempenho.
- Corrija o problema de o botão de tradução dentro do bloco dobrado não ser apresentado depois de desativar a "Expansão automática do bloco dobrado", graças ao feedback de @MoYuToGo!
- Uma vez que a opção "Não esperar que os recursos da página sejam totalmente carregados" é teoricamente sem sentido, foi renomeada para desmarcar o estado anteriormente possível
- Adaptação de um grande número de estruturas de código
- **muitas renomeações de classes css, pelo que poderá ter de as ajustar se estiver a utilizar estilos personalizados do stylus**
- Alguns outros ajustes e melhorias

## 1.72

- Corrija o problema de o painel de configuração do ChatGPT não aparecer, graças ao feedback de @caoxuanming!
- Adicione um interrutor de configuração "Mouse Scroll Lock", ativado por predefinição, graças a @liuhao6 pela sugestão.

## 1.71

- Actualizou a API para a classificação da lista para a v4, ajustou a forma como os dados são obtidos na página de título para serem obtidos através da API, graças a @wrkwrk pela sugestão!
- Adicione a opção "Streaming" da tradução do ChatGPT, activada por predefinição
- Corrigir os resultados do Google Translate que estão vazios Obrigado a @shicxin pelo feedback!
- Adicione um interrutor de configuração "Confirmação dupla para commits de código", ativado por predefinição Obrigado a @Rikkual pela sugestão!
- Botões para adicionar pequenas áreas à página completa do conjunto de tópicos
- Corrija o problema de o resultado da tradução não ser mostrado quando se clica com o botão direito do rato na página completa do conjunto de tópicos para imprimir.

## 1.70

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
