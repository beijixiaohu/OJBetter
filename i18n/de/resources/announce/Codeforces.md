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
