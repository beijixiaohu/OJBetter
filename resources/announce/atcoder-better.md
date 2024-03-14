## 1.13

> 本次更新同步了 Codeforces Better v1.68 - 1.74 的更改到 AtCoder Better
>

- 增加跳转到 VJudge 的按钮
- 增加“美化代码块”功能，使用monaco编辑器替换页面上的pre代码块，这也会改善黑暗模式下的代码显示效果
- 改进 Clist Rating 的各个请求方法，以解决没有正确获取数据的问题 
- 改进 ChatGPT 翻译的 prompt，并修复可能产生的注入错误导致翻译结果不全的问题
- 改进 LaTeX 替换/还原的相关代码，现在其可以在多重嵌套的情况下正确还原
- 增强网站本地化方法的健壮性
- 调整黑暗模式的相关代码，使用变量以便于统一样式和管理
- 更换 CDN staticfile.org 为 staticfile.net
- 修复题单页面一些题目的 clist rating 可能显示未找到的问题

- 修复题目集页面 clist 分数显示异常的问题
- 修复代码在线测试中差异对比样式未对齐的问题
- 修复 deepl 429 报错后未正确显示提示信息的问题
- 修复题目页 Clist Rating 可能会显示未找到的问题
- 修复洛谷跳转方法在旧版本 Tampermonkey 中报错的问题

- 修复当 MathJax 库文件未正确加载时，会发生意外的死循环导致页面卡死的问题
- 修复 DeepL 免费模式翻译时未正确显示 翻译中提示信息 的问题
- 修复脚本可能未正确加载的问题
- 修复相邻的 LaTeX 公式间的排版可能被破坏的问题

- 一些其他调整和改进

------

- 将网站本地化的数据独立为外部 JSON，以便于维护
- 脚本支持国际化，同时使用 crowdin 平台以自动化本地化工作
- 更换一些按钮为图标按钮
- 添加对 DeepL API 的支持，包括官方的 api-free、api-pro 和 deeplx，感谢 @Vistarin 的建议
- 添加对 deepl 和 chatgpt 配置余额查询的支持，注意这还需要你的服务商支持并提供相应的 API
- 添加对翻译前的文本判断，如果其疑似代码片段，则不会自动翻译，且点击翻译前也会弹窗提示
- 添加选择翻译服务目标语言的功能
- 添加关于页面，以及更新频道、更新源选择项
- 添加调试维护页面，包括缓存刷新，数据清除，导入导出
- 添加自定义选项： "‘代码编辑器提交按钮位置" ，默认为底部，感谢 @lishufood 的建议
- 改进各个加载函数，移除一些不必要的等待关系，加快脚本加载时间
- 改进翻译功能的相关方法，以及报错信息的显示方式
- 改进自动翻译的性能，以及可能无法自动翻译的问题
- 改进代码样例在线运行的相关代码
- 改进运行结果差异对比方法 codeDiff()
- 改进 dialog 窗口为背景内容不再会随鼠标一起滚动
- 改进代码编辑器固定到右侧，底部，全屏时的样式，感谢 @lishufood 的建议
- 改进 .html2md-panel 面板在 simple 模式下的显示效果
- 改进设置面板中配置页面的样式
- 修复 acmsguru 题目题目页编辑器报错的问题
- 修复问题页代码编辑器在切换网站的 移动/桌面 版本后报错的问题
- 修复 getMarkdown() 方法的一处错误，其错误的将数据直接存储到 DOM 中，导致页面性能下降
- 修复关闭‘折叠块自动展开’后折叠块内的翻译按钮不显示的问题，感谢 @MoYuToGo 的反馈
- 由于"不等待页面资源完全加载"选项理论上已无意义，故重命名以取消之前可能的选中状态
- 调整了大量的代码结构
- **大量的 css class 重命名，因此如果你使用了stylus自定义样式，可能需要调整**
- 一些其他的调整和改进

------

- 修复 ChatGPT 配置面板不显示的问题，感谢 @caoxuanming 的反馈
- 添加一个配置开关 "鼠标滚动锁定" ，默认开启， 感谢 @liuhao6 的建议

------

- 更新 clist rating 的API为v4，调整题目页的数据获取方式为通过API获取，感谢 @wrkwrk 的建议
- 添加 ChatGPT 翻译 “流式传输” 选项，默认开启
- 修复 Google 翻译结果为空的问题 感谢 @shicxin 的反馈
- 添加一个配置开关 "代码提交是否二次确认" ，默认开启 感谢 @Rikkual 的建议
- 在完整题目集页中添加小区域的按钮
- 修复完整题目集页右键打印时不显示翻译结果的问题 感谢 @zfs732 的反馈

------

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