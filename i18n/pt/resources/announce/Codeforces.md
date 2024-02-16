## 1.73

- Independência dos dados localizados do sítio Web como JSON externo para facilitar a manutenção
- Os guiões suportam a internacionalização e utilizam a plataforma crowdin para automatizar a localização.
- Substitua alguns botões por botões de ícones
- Adicione suporte para a API DeepL, incluindo a api-free oficial, api-pro e deeplx, graças a @Vistarin pela sugestão!
- Adicione suporte para deepl e chatgpt para configurar pesquisas de saldo, note que isto também requer que o seu fornecedor de serviços o suporte e forneça as APIs adequadas
- Se suspeitar que se trata de um fragmento de código, não será traduzido automaticamente e ser-lhe-á pedida uma janela pop-up antes de clicar na tradução.
- Adicione a capacidade de selecionar a língua de chegada para os serviços de tradução
- Adicione uma página sobre, bem como um canal de atualização e selecções de fonte de atualização
- 添加调试维护页面，包括缓存刷新，数据清除，导入导出
- 添加自定义选项： ‘代码编辑器提交按钮位置‘ ，默认为底部，感谢 @lishufood 的建议
- 改进翻译功能的相关方法，以及报错信息的显示方式
- 改进自动翻译的性能，以及可能无法自动翻译的问题
- 改进代码样例在线运行的相关代码
- 改进运行结果差异对比方法 codeDiff()
- 改进 dialog 窗口为背景内容不再会随鼠标一起滚动
- 改进代码编辑器固定到右侧，底部，全屏时的样式，感谢 @lishufood 的建议
- 改进 .html2md-panel 面板在 simple 模式下的显示效果
- 改进设置面板中配置页面的样式
- 修复问题页代码编辑器在切换网站的 移动/桌面 版本后报错的问题
- 修复 getMarkdown() 方法的一处错误，其错误的将数据直接存储到 DOM 中，导致页面性能下降
- 修复关闭‘折叠块自动展开’后折叠块内的翻译按钮不显示的问题，感谢 @MoYuToGo 的反馈
- 由于"不等待页面资源完全加载"选项理论上已无意义，故重命名以取消之前可能的选中状态
- 调整大量的代码结构
- **大量的 css class 重命名，因此如果你使用了stylus自定义样式，可能需要调整**
- 一些其他的调整和改进

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

- 在题目页下方添加代码编辑器，支持在线代码测试、代码提交等，具体请阅读 信息 页
- 修复插入脚本按钮、翻译结果时会被当做题目描述更改的问题
- 完善 组合混搭管理 页面的汉化
- 增加 "自动翻译短文本" 功能, 默认关闭
- 改进翻译等待间隔的实现方式，现在等待间隔全局生效
- 改进 "显示目标区域范围" 的实现方式
- 完善黑暗模式，改进样例元素的 hover 样式 感谢 @SUPERLWR 的反馈
- 增加设置面板选项: 翻译-过滤文本中的\*\*号 感谢 @Dog_E 、CreMicro 的反馈
- 修复关闭“显示加载提示信息”后，Clist Rating 无法正常显示的问题，感谢 Vistarin 的反馈
- 一些其他改进和修复
