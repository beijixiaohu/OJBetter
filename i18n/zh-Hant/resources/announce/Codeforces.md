## 1.73

- 將網站在地化的資料獨立為外部JSON，以便於維護
- 腳本支援國際化，同時使用crowdin 平台以自動化在地化工作
- 更換一些按鈕為圖示按鈕
- 添加對DeepL API 的支持，包括官方的api-free、api-pro 和deeplx，感謝@Vistarin 的建議
- 加上對deepl 和chatgpt 配置餘額查詢的支持，注意這還需要你的服務商支援並提供相應的API
- 新增對翻譯前的文字判斷，如果其疑似程式碼片段，則不會自動翻譯，且點擊翻譯前也會彈窗提示
- 新增選擇翻譯服務目標語言的功能
- 新增關於頁面，以及更新頻道、更新來源選擇項
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

- 修復ChatGPT 配置面板不顯示的問題，感謝@caoxuanming 的回饋
- 新增一個配置開關"滑鼠滾動鎖定" ，預設開啟， 感謝 @liuhao6 的建議

## 1.71

- 更新clist rating 的API為v4，調整題目頁的資料取得方式為透過API獲取，感謝@wrkwrk 的建議
- 新增ChatGPT 翻譯「串流」 選項，預設開啟
- 修復Google 翻譯結果為空的問題感謝@shicxin 的回饋
- 新增一個設定開關"代碼提交是否二次確認" ，預設開啟感謝@Rikkual 的建議
- 在完整題目集頁中新增小區域的按鈕
- 修正完整題目集頁右鍵列印時不顯示翻譯結果的問題感謝@zfs732 的回饋

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