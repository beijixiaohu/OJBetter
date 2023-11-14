// ==UserScript==
// @name         Nowcoder Better!
// @namespace    https://greasyfork.org/users/747162
// @version      1.11
// @description  牛客竞赛题目题解markdown一键复制
// @author       北极小狐
// @match        https://ac.nowcoder.com/*
// @connect      www2.deepl.com
// @connect      m.youdao.com
// @connect      translate.google.com
// @connect      openai.api2d.net
// @connect      api.openai.com
// @connect      www.luogu.com.cn
// @connect      greasyfork.org
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @icon         https://aowuucdn.oss-cn-beijing.aliyuncs.com/nowcoder.png
// @require      https://cdn.staticfile.org/turndown/7.1.2/turndown.min.js
// @require      https://cdn.staticfile.org/markdown-it/13.0.1/markdown-it.min.js
// @license      GPL3
// @compatible	 Chrome
// @compatible	 Firefox
// @compatible	 Edge
// ==/UserScript==

// 状态与初始化
const getGMValue = (key, defaultValue) => {
    const value = GM_getValue(key);
    if (value === undefined || value === "") {
        GM_setValue(key, defaultValue);
        return defaultValue;
    }
    return value;
};
const hoverTargetAreaDisplay = getGMValue("hoverTargetAreaDisplay", false);
var enableSegmentedTranslation = getGMValue("enableSegmentedTranslation", false);
var translation = getGMValue("translation", "deepl");
//openai
var openai_model, openai_key, openai_proxy, openai_header, openai_data;
var opneaiConfig = getGMValue("chatgpt-config", {
    "choice": -1,
    "configurations": []
});
if (opneaiConfig.choice !== -1 && opneaiConfig.configurations.length !== 0) {
    const configAtIndex = opneaiConfig.configurations[opneaiConfig.choice];

    if (configAtIndex == undefined) {
        let existingConfig = GM_getValue('chatgpt-config');
        existingConfig.choice = 0;
        GM_setValue('chatgpt-config', existingConfig);
        location.reload();
    }
    
    openai_model = configAtIndex.model;
    openai_key = configAtIndex.key;
    openai_proxy = configAtIndex.proxy;
    openai_header = configAtIndex._header ?
        configAtIndex._header.split("\n").map(header => {
            const [key, value] = header.split(":");
            return { [key.trim()]: value.trim() };
        }) : [];
    openai_data = configAtIndex._data ?
        configAtIndex._data.split("\n").map(header => {
            const [key, value] = header.split(":");
            return { [key.trim()]: value.trim() };
        }) : [];
}

// 常量
const helpCircleHTML = '<div class="help-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592 0-42.944-14.08-76.736-42.24-101.376-28.16-25.344-65.472-37.312-111.232-37.312zm-12.672 406.208a54.272 54.272 0 0 0-38.72 14.784 49.408 49.408 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.848 54.848 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.968 51.968 0 0 0-15.488-38.016 55.936 55.936 0 0 0-39.424-14.784z"></path></svg></div>';
const darkenPageStyle = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 9999; }`;
const darkenPageStyle2 = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 10000; }`;

// 语言判断
const isEnglishLanguage = (function () {
    var metaElement = $('meta[http-equiv="Content-Language"]');
    var contentValue = metaElement.attr('content');
    return (contentValue === 'en');
})();

// 样式
GM_addStyle(`
:root {
    --vp-font-family-base: "Chinese Quotes", "Inter var", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
span.mdViewContent {
    white-space: pre-wrap;
}
/*翻译区域提示*/
.overlay {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(135deg, #97e7cacc, #97e7cacc 30px, #e9fbf1cc 0px, #e9fbf1cc 55px);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00695C;
    font-size: 16px;
    font-weight: bold;
    text-shadow: 0px 0px 2px #edfcf4;
}
/*翻译div*/
.translate-problem-statement {
    justify-items: start;
    letter-spacing: 1.8px;
    color: #059669;
    background-color: #f9f9fa;
    border: 1px solid #10b981;
    border-radius: 0.3rem;
    padding: 5px;
    margin: 10px 0px;
    width: 100%;
    box-sizing: border-box;
    font-size: 13px;
}
.translate-problem-statement.error_translate {
  color: red;
  border-color: red;
}

.translate-problem-statement h2, .translate-problem-statement h3 {
  font-size: 16px;
}

.translate-problem-statement ul {
  line-height: 100%;
}

.translate-problem-statement a {
    color: #10b981;
    font-weight: 600;
    background: 0 0;
    text-decoration: none;
}
.translate-problem-statement p {
    font-size: 14px !important;
}
.translate-problem-statement img {
    max-width: 100.0%;
    max-height: 100.0%;
}

.translate-problem-statement .katex  {
  font-size: 14px;
}
.translate-problem-statement a:hover {
    text-decoration: revert;
}
.html2md-panel {
    display: flex;
    justify-content: flex-end;
}
.html2md-panel a {
    text-decoration: none;
}
button.html2mdButton {
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: #ffffff;
    color: #606266;
    height: 22px;
    width: auto;
    font-size: 13px;
    border-radius: 0.3rem;
    padding: 1px 5px;
    margin: 5px;
    border: 1px solid #dcdfe6;
}
button.html2mdButton:hover {
    color: #409eff;
    border-color: #409eff;
}
button.html2mdButton.copied {
    background-color: #f0f9eb;
    color: #67c23e;
    border: 1px solid #b3e19d;
}
button.html2mdButton.mdViewed {
    background-color: #fdf6ec;
    color: #e6a23c;
    border: 1px solid #f3d19e;
}
button.html2mdButton.error {
    background-color: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fab6b6;
}
button.translated {
    cursor: not-allowed;
    background-color: #f0f9eb;
    color: #67c23e;
    border: 1px solid #b3e19d;
}
button.html2mdButton.reTranslation {
    background-color: #f4f4f5;
    color: #909399;
    border: 1px solid #c8c9cc;
}
.translate-problem-statement table {
    border: 1px #ccc solid !important;
    margin: 1.5em 0 !important;
    color: #059669 !important;
}
.translate-problem-statement table thead th {
    border: 1px #ccc solid !important;
    color: #059669 !important;
}
.translate-problem-statement table td {
    border-right: 1px solid #ccc;
    border-top: 1px solid #ccc;
    padding: 0.7143em 0.5em;
}
.translate-problem-statement table th {
    padding: 0.7143em 0.5em;
}
.translate-problem-statement p:not(:first-child) {
    margin: 1.5em 0 0;
}
/*设置面板*/
header .enter-or-register-box, header .languages {
    position: absolute;
    right: 170px;
}
button.html2mdButton.NowcoderBetter_setting {
    float: right;
    height: 30px;
    background: #25bb9b;
    color: white;
    margin: 10px;
    border: 0px;
}

button.html2mdButton.NowcoderBetter_setting.open {
  background-color: #e6e6e61f;
  color: #727378;
  cursor: not-allowed;
}
.NowcoderBetter_setting_menu {
    z-index: 9999;
    box-shadow: 0px 0px 0px 4px #ffffff;
    display: grid;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    transform: translate(-50%, -50%);
    border-radius: 6px;
    background-color: #edf1ff;
    border-collapse: collapse;
    border: 1px solid #ffffff;
    color: #697e91;
    font-family: var(--vp-font-family-base);
    padding: 10px 20px 20px 20px;
    box-sizing: content-box;
}
.NowcoderBetter_setting_menu h4,.NowcoderBetter_setting_menu h5 {
    font-weight: 600;
    margin: 5px 0px;
}
.NowcoderBetter_setting_menu h4 {
    font-size: 17px;
}
.NowcoderBetter_setting_menu h5 {
    font-size: 16px;
}
.NowcoderBetter_setting_menu h3 {
    margin-top: 10px;
    font-weight: 600;
    font-size: 18px;
}
.NowcoderBetter_setting_menu hr {
    border: none;
    height: 1px;
    background-color: #ccc;
    margin: 10px 0;
}
/*设置面板-关闭按钮*/
.NowcoderBetter_setting_menu .tool-box {
    position: absolute;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    overflow: hidden;
    border-radius: 10px;
    top: 3px;
    right: 3px;
}

.NowcoderBetter_setting_menu .btn-close {
    display: flex;
    text-align: center;
    width: 20px;
    height: 20px;
    color: transparent;
    font-size: 0;
    cursor: pointer;
    background-color: #ff000080;
    border: none;
    margin: 0px;
    padding: 0px;
    overflow: hidden;
    transition: .15s ease all;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.NowcoderBetter_setting_menu .btn-close:hover {
    width: 20px;
    height: 20px !important;
    font-size: 17px;
    color: #ffffff;
    background-color: #ff0000cc;
    box-shadow: 0 5px 5px 0 #00000026;
}

.NowcoderBetter_setting_menu .btn-close:active {
    width: 20px;
    height: 20px;
    font-size: 1px;
    color: #ffffffde;
    --shadow-btn-close: 0 3px 3px 0 #00000026;
    box-shadow: var(--shadow-btn-close);
}

/*设置面板-checkbox*/
.NowcoderBetter_setting_menu input[type=checkbox]:focus {
    outline: 0px;
}

.NowcoderBetter_setting_menu input[type="checkbox"] {
    margin: 0px;
	appearance: none;
    -webkit-appearance: none;
	width: 40px;
	height: 20px !important;
	border: 1.5px solid #D7CCC8;
    padding: 0px !important;
	border-radius: 20px;
	background: #efebe978;
	position: relative;
	box-sizing: border-box;
}

.NowcoderBetter_setting_menu input[type="checkbox"]::before {
	content: "";
	width: 14px;
	height: 14px;
	background: #D7CCC8;
	border: 1.5px solid #BCAAA4;
	border-radius: 50%;
	position: absolute;
	top: 0;
	left: 0;
	transform: translate(2%, 2%);
	transition: all 0.3s ease-in-out;
  -webkit-box-sizing: content-box;
    -moz-box-sizing: content-box;
    box-sizing: content-box;
}

.NowcoderBetter_setting_menu input[type="checkbox"]::after {
	content: url("data:image/svg+xml,%3Csvg xmlns='://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.55021 5.84315L17.1568 16.4498L16.4497 17.1569L5.84311 6.55026L6.55021 5.84315Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17.1567 6.55021L6.55012 17.1568L5.84302 16.4497L16.4496 5.84311L17.1567 6.55021Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3C/svg%3E");
	position: absolute;
	top: 0;
	left: 24px;
}

.NowcoderBetter_setting_menu input[type="checkbox"]:checked {
	border: 1.5px solid #C5CAE9;
	background: #E8EAF6;
}

.NowcoderBetter_setting_menu input[type="checkbox"]:checked::before {
	background: #C5CAE9;
	border: 1.5px solid #7986CB;
	transform: translate(122%, 2%);
	transition: all 0.3s ease-in-out;
}

.NowcoderBetter_setting_menu input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    position: absolute;
    top: 1.5px;
    left: 4.5px;
}

.NowcoderBetter_setting_menu label {
    font-size: 16px;
    font-weight: initial;
    margin-bottom: 0px;
}

.NowcoderBetter_setting_list {
    display: flex;
    align-items: center;
    padding: 10px;
    margin: 5px 0px;
    background-color: #ffffff;
    border-bottom: 1px solid #c9c6c696;
    border-radius: 8px;
    justify-content: space-between;
}

/*设置面板-radio*/
.NowcoderBetter_setting_menu>label {
    display: flex;
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 0px;
    align-items: center;
    margin: 3px 0px;
}

.NowcoderBetter_setting_menu_label_text {
    display: flex;
    border: 1px dashed #00aeeccc;
    height: 35px;
    width: 100%;
    color: gray;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 2px;
    padding: 7px;
    align-items: center;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}

input[type="radio"]:checked+.NowcoderBetter_setting_menu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    font-weight: 500;
}

.NowcoderBetter_setting_menu>label input[type="radio"] {
    -webkit-appearance: none;
    appearance: none;
    list-style: none;
    padding: 0px !important;
    margin: 0px;
}

.NowcoderBetter_setting_menu input[type="text"] {
    display: block;
    height: 25px !important;
    width: 100%;
    background-color: #ffffff;
    color: #727378;
    font-size: 12px;
    border-radius: 0.3rem;
    padding: 1px 5px !important;
    box-sizing: border-box;
    margin: 5px 0px 5px 0px;
    border: 1px solid #00aeeccc;
    box-shadow: 0 0 1px #0000004d;
}

.NowcoderBetter_setting_menu input[type="text"]:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}

.NowcoderBetter_setting_menu_input {
    width: 100%;
    display: grid;
    margin-top: 5px;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
.NowcoderBetter_setting_menu input::placeholder {
    color: #727378;
}
.NowcoderBetter_setting_menu input.no_default::placeholder{
    color: #BDBDBD;
}
.NowcoderBetter_setting_menu input.is_null::placeholder{
    color: red;
    border-width: 1.5px;
}
.NowcoderBetter_setting_menu input.is_null{
    border-color: red;
}
.NowcoderBetter_setting_menu textarea {
    display: block;
    width: 100%;
    height: 60px;
    background-color: #ffffff;
    color: #727378;
    font-size: 12px;
    padding: 1px 5px !important;
    box-sizing: border-box;
    margin: 5px 0px 5px 0px;
    border: 1px solid #00aeeccc;
    box-shadow: 0 0 1px #0000004d;
}
.NowcoderBetter_setting_menu textarea:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}
.NowcoderBetter_setting_menu textarea::placeholder{
    color: #BDBDBD;
    font-size: 14px;
}

.NowcoderBetter_setting_menu #save {
    cursor: pointer;
	display: inline-flex;
    padding: 5px;
	background-color: #1aa06d;
	color: #ffffff;
	font-size: 14px;
	line-height: 1.5rem;
	font-weight: 500;
	justify-content: center;
	width: 100%;
	border-radius: 0.375rem;
	border: none;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    margin-top: 20px
}
.NowcoderBetter_setting_menu button#debug_button.debug_button {
    width: 18%;
}

.NowcoderBetter_setting_menu span.tip {
    color: #999;
    font-size: 12px;
    font-weight: 500;
    padding: 5px 0px;
}
/*设置面板-tip*/
.help_tip {
    margin-right: auto;
}
.help_tip .tip_text {
    display: none;
    position: absolute;
    color: #697e91;
    font-weight: 400;
    letter-spacing: 0px;
    background-color: #ffffff;
    padding: 10px;
    margin: 5px 0px;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    box-shadow: 0px 0px 12px rgba(0, 0, 0, .12);
    z-index: 999;
}
.help_tip .tip_text p {
    margin-bottom: 5px;
}
.help_tip .tip_text:before {
    content: "";
    position: absolute;
    top: -20px;
    right: -10px;
    bottom: -10px;
    left: -10px;
    z-index: -1;
}
.help-icon {
    cursor: help;
    width: 15px;
    color: rgb(255, 153, 0);
    margin-left: 5px;
    margin-top: 3px;
}
#CFBetter_setting_menu .CFBetter_setting_menu_label_text .help_tip .help-icon {
    color: #7fbeb2;
}
.help_tip .help-icon:hover + .tip_text, .help_tip .tip_text:hover {
    display: block;
    cursor: help;
    width: 250px;
}
/*确认弹窗*/
.wordsExceeded {
    z-index: 99999;
    box-shadow: 0px 0px 5px 1px rgb(0 0 0 / 10%), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: grid;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    background-color: #ffffff;
    border: 1px solid #e4e7ed;
    color: #697e91;
    font-family: var(--vp-font-family-base);
    padding: 10px 20px 20px 20px;
}
.wordsExceeded button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    text-align: center;
    box-sizing: border-box;
    outline: none;
    transition: .1s;
    user-select: none;
    vertical-align: middle;
    -webkit-appearance: none;
    height: 24px;
    padding: 5px 11px;
    font-size: 12px;
    border-radius: 4px;
    color: #ffffff;
    background: #409eff;
    border-color: #409eff;
    border: none;
    margin-right: 12px;
}
.wordsExceeded button:hover{
    background-color:#79bbff;
}
.wordsExceeded .help-icon {
    margin: 0px 8px 0px 0px;
    height: 1em;
    width: 1em;
    line-height: 1em;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    fill: currentColor;
    font-size: inherit;
}
.wordsExceeded p {
    margin: 5px 0px;
}
/*更新检查*/
div#update_panel {
    z-index: 9999;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 240px;
    transform: translate(-50%, -50%);
    box-shadow: 0px 0px 4px 0px #0000004d;
    padding: 10px 20px 20px 20px;
    color: #444242;
    background-color: #f5f5f5;
    border: 1px solid #848484;
    border-radius: 8px;
}
div#update_panel #updating {
    cursor: pointer;
	display: inline-flex;
	padding: 3px;
	background-color: #1aa06d;
	color: #ffffff;
	font-size: 14px;
	line-height: 1.5rem;
	font-weight: 500;
	justify-content: center;
	width: 100%;
	border-radius: 0.375rem;
	border: none;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
div#update_panel #updating a {
    text-decoration: none;
    color: white;
    display: flex;
    position: inherit;
    top: 0;
    left: 0;
    width: 100%;
    height: 22px;
    font-size: 14px;
    justify-content: center;
    align-items: center;
}
#skip_menu {
    display: flex;
    margin-top: 10px;
    justify-content: flex-end;
    align-items: center;
}
#skip_menu .help_tip {
    margin-right: 5px;
    margin-left: -5px;
}
#skip_menu .help-icon {
    color: #f44336;
}
/* 配置管理 */
.embed-responsive {
    height: max-content;
    padding-bottom: 0px;
}
.config_bar {
    height: 70px;
    width: 100%;
    display: flex;
    justify-content: space-between;
}
li#add_button {
    cursor: pointer;
    height: 40px;
    border: 1px dashed #BDBDBD;
    border-radius: 8px;
    background-color: #fcfbfb36;
    color: #bdbdbd;
    font-size: 14px;
    align-items: center;
    justify-content: center;
}
li#add_button:hover {
    border: 1px dashed #03A9F4;
    background-color: #d7f0fb8c;
    color: #03A9F4;
}
div#config_bar_list {
    display: flex;
    width: 480px;
    border: 1px solid #c5cae9;
    border-radius: 8px;
    background-color: #f0f8ff;
    box-sizing: border-box;
}
div#config_bar_list input[type="radio"] {
    appearance: none;
    width: 0;
    height: 0;
    overflow: hidden;
}
div#config_bar_list input[type="radio"] {
    margin: 0px;
}
div#config_bar_list input[type=radio]:focus {
    outline: 0px;
}
label.config_bar_ul_li_text {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    height: 40px;
    overflow-x: auto;
    font-size: 14px;
    font-weight: 400;
    margin: 0px 4px;
    padding: 3px;
    border: 1px solid #dedede;
    border-radius: 10px;
    box-shadow: 0px 2px 4px 0px rgba(0,0,0,.05);
    box-sizing: border-box;
}
ul#config_bar_ul li button {
    background-color: #e6e6e6;
    color: #727378;
    height: 23px;
    font-size: 14px;
    border-radius: 0.3rem;
    padding: 1px 5px;
    margin: 5px;
    border: none;
    box-shadow: 0 0 1px #0000004d;
}
ul#config_bar_ul {
    display: flex;
    align-items: center;
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 0px;
}
ul#config_bar_ul li {
    width: 80px;
    display: grid;
    margin: 4px 4px;
    min-width: 100px;
    box-sizing: border-box;
}
label.config_bar_ul_li_text:hover {
    background-color: #eae4dc24;
}
input[type="radio"]:checked + .config_bar_ul_li_text {
    background: #41b3e430;
    border: 1px solid #5e7ce0;
    color: #5e7ce0;
}
ul#config_bar_ul::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}
ul#config_bar_ul::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
    border-radius: 8px;
}
ul#config_bar_ul::-webkit-scrollbar-button:start:decrement {
    width: 4px;
    background-color: transparent;
}
ul#config_bar_ul::-webkit-scrollbar-button:end:increment {
    width: 4px;
    background-color: transparent; 
}
ul#config_bar_ul::-webkit-scrollbar-track {
    background-color: #f1f1f1;
    border-radius: 5px;
}
label.config_bar_ul_li_text::-webkit-scrollbar {
    width: 5px;
    height: 7px;
    background-color: #aaa;
}
label.config_bar_ul_li_text::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
}
label.config_bar_ul_li_text::-webkit-scrollbar-track {
    background-color: #f1f1f1;
}
.config_bar_list_add_div {
    display: flex;
    height: 40px;
    margin: 4px 2px;
}
/* 修改菜单 */
div#config_bar_menu {
    z-index: 99999;
    position: absolute;
    width: 60px;
    background: #ffffff;
    box-shadow: 1px 1px 4px 0px #0000004d;
    border: 0px solid rgba(0,0,0,0.04);
    border-radius: 4px;
    padding: 8px 0;
}
div.config_bar_menu_item {
    cursor: pointer;
    padding: 2px 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 32px;
    color: rgba(0,0,0,0.75);
    font-size: 14px;
    font-weight: 500;
    box-shadow: inset 0px 0px 0px 0px #8bb2d9;
}
div#config_bar_menu_edit:hover {
    background-color: #00aeec;
    color: white;
}
div#config_bar_menu_delete:hover {
    background-color: #FF5722;
    color: white;
}
/* 配置页面 */
#config_edit_menu {
    z-index: 11000;
    width: 450px; 
}
`);

// 获取cookie
function getCookie(name) {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        const [cookieName, cookieValue] = cookie.split("=");

        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return "";
}

// 防抖函数
function debounce(callback) {
    let timer;
    let immediateExecuted = false;
    const delay = 500;
    return function () {
        clearTimeout(timer);
        if (!immediateExecuted) { callback.call(this); immediateExecuted = true; }
        timer = setTimeout(() => { immediateExecuted = false; }, delay);
    };
}

// 为元素添加鼠标拖动
function addDraggable(element) {
    let isDragging = false;
    let initialX, initialY; // 元素的初始位置
    let startX, startY, offsetX, offsetY; // 鼠标起始位置，移动偏移量
    let isSpecialMouseDown = false; // 选取某些元素时不拖动

    element.on('mousedown', function (e) {
        var elem = $(this);
        var elemOffset = elem.offset();
        var centerX = elemOffset.left + elem.outerWidth() / 2;
        var centerY = elemOffset.top + elem.outerHeight() / 2;
        initialX = centerX - window.pageXOffset;
        initialY = centerY - window.pageYOffset;

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        isSpecialMouseDown = $(e.target).is('label, p, input, textarea, span');

        $('body').css('cursor', 'all-scroll');
    });


    $(document).on('mousemove', function (e) {
        if (!isDragging) return;
        // 不执行拖动操作
        if ($(e.target).is('label, p, input, textarea, span') || isSpecialMouseDown && !$(e.target).is('input, textarea')) return;
        e.preventDefault();
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        element.css({ top: initialY + offsetY + 'px', left: initialX + offsetX + 'px' });
    });

    $(document).on('mouseup', function () {
        isDragging = false;
        isSpecialMouseDown = false;
        $('body').css('cursor', 'default');
    });
}

// 更新检查
(function checkScriptVersion() {
    function compareVersions(version1 = "0", version2 = "0") {
        const v1Array = String(version1).split(".");
        const v2Array = String(version2).split(".");
        const minLength = Math.min(v1Array.length, v2Array.length);
        let result = 0;
        for (let i = 0; i < minLength; i++) {
            const curV1 = Number(v1Array[i]);
            const curV2 = Number(v2Array[i]);
            if (curV1 > curV2) {
                result = 1;
                break;
            } else if (curV1 < curV2) {
                result = -1;
                break;
            }
        }
        if (result === 0 && v1Array.length !== v2Array.length) {
            const v1IsBigger = v1Array.length > v2Array.length;
            const maxLenArray = v1IsBigger ? v1Array : v2Array;
            for (let i = minLength; i < maxLenArray.length; i++) {
                const curVersion = Number(maxLenArray[i]);
                if (curVersion > 0) {
                    v1IsBigger ? result = 1 : result = -1;
                    break;
                }
            }
        }
        return result;
    }

    GM_xmlhttpRequest({
        method: "GET",
        url: "https://greasyfork.org/zh-CN/scripts/473210.json",
        timeout: 10 * 1e3,
        onload: function (response) {
            const scriptData = JSON.parse(response.responseText);
            const skipUpdate = getCookie("skipUpdate");

            if (
                scriptData.name === GM_info.script.name &&
                compareVersions(scriptData.version, GM_info.script.version) === 1 &&
                skipUpdate !== "true"
            ) {
                const styleElement = GM_addStyle(darkenPageStyle);
                $("body").append(`
                    <div id='update_panel'>
                        <h3>${GM_info.script.name}有新版本！</h3>
                        <hr>
                        <div class='update_panel_menu'>
                            <span class ='tip'>版本信息：${GM_info.script.version} → ${scriptData.version}</span>
                        </div>
                        <br>
                        <div id="skip_menu">
                            <div class="help_tip">
                                `+ helpCircleHTML + `
                                <div class="tip_text">
                                    <p><b>更新遇到了问题？</b></p>
                                    <p>由于 Greasyfork 平台的原因，当新版本刚发布时，点击 Greasyfork 上的更新按钮<u>可能</u>会出现<u>实际更新/安装的却是上一个版本</u>的情况</p>
                                    <p>通常你只需要稍等几分钟，然后再次前往更新/安装即可</p>
                                    <p>你也可以<u>点击下方按钮，在本次浏览器会话期间将不再提示更新</u></p>
                                    <button id='skip_update' class='html2mdButton'>暂不更新</button>
                                </div>
                            </div>
                            <button id='updating'><a target="_blank" href="${scriptData.url}">更新</a></button>
                        </div>
                    </div>
                `);

                $("#skip_update").click(function () {
                    document.cookie = "skipUpdate=true; expires=session; path=/";
                    styleElement.remove();
                    $("#update_panel").remove();
                });
            }
        }
    });

})();

// 设置面板
$(document).ready(function () {
    var htmlContent = "<button class='html2mdButton NowcoderBetter_setting'>Nowcoder Better设置</button>";
    if ($('.acm-nav-info').length > 0) $('.acm-nav-info > li:last-child').after("<li class='dropdown'>" + htmlContent + "</li>");
    else $('.header-bar .header-right > :last-child').after(htmlContent);
});

// 配置管理函数
function setupConfigManagement(element, tempConfig, structure, configHTML, checkable) {
    let counter = 0;
    createControlBar();
    createContextMenu();

    // 键值对校验
    function valiKeyValue(value) {
        const keyValuePairs = value.split('\n');
        const regex = /^[a-zA-Z0-9_-]+\s*:\s*[a-zA-Z0-9_-]+$/;
        for (let i = 0; i < keyValuePairs.length; i++) {
            if (!regex.test(keyValuePairs[i])) {
                return false;
            }
        }
        return true;
    }

    // 新增数据
    function onAdd() {
        const styleElement = createWindow();

        const settingMenu = $("#config_edit_menu");
        settingMenu.on("click", "#save", () => {
            const config = {};
            let allFieldsValid = true;
            for (const key in structure) {
                let value = $(key).val();
                if (value || $(key).attr('require') === 'false') {
                    config[structure[key]] = $(key).val();
                    $(key).removeClass('is_null');
                } else {
                    $(key).addClass('is_null');
                    allFieldsValid = false;
                }
            }

            // 校验提示
            for (let i = 0, len = checkable.length; i < len; i++) {
                let value = $(checkable[i]).val();
                if (value && !valiKeyValue(value)) {
                    if (!$(checkable[i]).prev('span.text-error').length) {
                        $(checkable[i]).before('<span class="text-error" style="color: red;">格式不符或存在非法字符</span>');
                    }
                    allFieldsValid = false;
                } else {
                    $(checkable[i]).prev('span.text-error').remove();
                }
            }

            if (!allFieldsValid) return;
            tempConfig.configurations.push(config);

            const list = $("#config_bar_ul");
            createListItemElement(config[structure['#note']]).insertBefore($('#add_button'));

            settingMenu.remove();
            $(styleElement).remove();
        });

        settingMenu.on("click", ".btn-close", () => {
            settingMenu.remove();
            $(styleElement).remove();
        });
    }

    // 编辑数据
    function onEdit() {
        const menu = $("#config_bar_menu");
        menu.css({ display: "none" });

        const list = $("#config_bar_ul");
        const index = Array.from(list.children()).indexOf(this);

        const styleElement = createWindow();

        const settingMenu = $("#config_edit_menu");
        const configAtIndex = tempConfig.configurations[index];

        if (configAtIndex) {
            for (const key in structure) {
                $(key).val(configAtIndex[structure[key]]);
            }
        }

        settingMenu.on("click", "#save", () => {
            const config = {};
            let allFieldsValid = true;
            for (const key in structure) {
                let value = $(key).val();
                if (value || $(key).attr('require') === 'false') {
                    config[structure[key]] = $(key).val();
                    $(key).removeClass('is_null');
                } else {
                    $(key).addClass('is_null');
                    allFieldsValid = false;
                }
            }
            
            // 校验提示
            for (let i = 0, len = checkable.length; i < len; i++) {
                let value = $(checkable[i]).val();
                if (value && !valiKeyValue(value)) {
                    if (!$(checkable[i]).prev('span.text-error').length) {
                        $(checkable[i]).before('<span class="text-error" style="color: red;">格式不符或存在非法字符</span>');
                    }
                    allFieldsValid = false;
                } else {
                    $(checkable[i]).prev('span.text-error').remove();
                }
            }

            if (!allFieldsValid) return;
            tempConfig.configurations[index] = config;

            settingMenu.remove();
            $(styleElement).remove();
            menu.css({ display: "none" });

            list.children().eq(index).find("label").text(config.note);
        });

        // 关闭按钮
        settingMenu.on("click", ".btn-close", () => {
            settingMenu.remove();
            $(styleElement).remove();
        });
    }

    // 删除数据
    function onDelete() {
        const menu = $("#config_bar_menu");
        menu.css({ display: "none" });

        const list = $("#config_bar_ul");
        const index = Array.from(list.children()).indexOf(this);

        tempConfig.configurations.splice(index, 1);

        list.children().eq(index).remove();
    }

    // 创建编辑窗口
    function createWindow() {
        const styleElement = GM_addStyle(darkenPageStyle2);
        $("body").append(configHTML);
        addDraggable($('#config_edit_menu'));
        return styleElement;
    }

    // 创建控制面板
    function createControlBar() {
        $(element).append(`
            <div id='configControlTip' style='color:red;'></div>
            <div class='config_bar'>
                <div class='config_bar_list' id='config_bar_list'>
                    <ul class='config_bar_ul' id='config_bar_ul'></ul>
                </div>
            </div>
        `);
    }

    // 创建右键菜单
    function createContextMenu() {
        const menu = $("<div id='config_bar_menu' style='display: none;'></div>");
        menu.html(`
			<div class='config_bar_menu_item' id='config_bar_menu_edit'>修改</div>
			<div class='config_bar_menu_item' id='config_bar_menu_delete'>删除</div>
		`);
        $("body").append(menu);
    }

    // 创建新的li元素
    function createListItemElement(text) {
        const li = $("<li></li>");
        const radio = $("<input type='radio' name='config_item'></input>").appendTo(li);
        radio.attr("value", counter).attr("id", counter++);
        const label = $("<label class='config_bar_ul_li_text'></label>").text(text).attr("for", radio.attr("value")).appendTo(li);

        // 添加右键菜单
        li.on("contextmenu", function (event) {
            event.preventDefault();
            const menu = $("#config_bar_menu");
            menu.css({ display: "block", left: event.pageX, top: event.pageY });

            const deleteItem = $("#config_bar_menu_delete");
            const editItem = $("#config_bar_menu_edit");

            // 移除旧事件
            deleteItem.off("click");
            editItem.off("click");

            deleteItem.on("click", onDelete.bind(this));
            editItem.on("click", onEdit.bind(this));

            $(document).one("click", (event) => {
                if (!menu.get(0).contains(event.target)) {
                    menu.css({ display: "none" });
                    deleteItem.off("click", onDelete);
                    editItem.off("click", onEdit);
                }
            });
        });


        return li;
    }

    // 渲染列表
    function renderList() {
        const listContainer = $("#config_bar_list");
        const list = $("#config_bar_ul");
        list.empty();
        tempConfig.configurations.forEach((item) => {
            list.append(createListItemElement(item[structure['#note']]));
        });

        list.append(`
            <li id='add_button'>
                <span>+ 添加</span>
            </li>
        `);
        const addItem = $('#add_button');
        addItem.on("click", onAdd);
    };

    renderList();
    return tempConfig;
}

const NowcoderBetterSettingMenuHTML = `
    <div id='NowcoderBetter_setting_menu' class='NowcoderBetter_setting_menu'>
    <div class="tool-box">
        <button class="btn-close">×</button>
    </div>
    <h3>基本设置</h3>
    <hr>
    <div class='NowcoderBetter_setting_list'>
        <label for="hoverTargetAreaDisplay">显示目标区域范围</label>
        <div class="help_tip">
            `+ helpCircleHTML + `
            <div class="tip_text">
            <p>开启后当鼠标悬浮在 MD视图/复制/翻译 按钮上时，会显示其目标区域的范围</p>
            </div>
        </div>
        <input type="checkbox" id="hoverTargetAreaDisplay" name="hoverTargetAreaDisplay">
    </div>
    <div class='NowcoderBetter_setting_list'>
        <label for="enableSegmentedTranslation">分段翻译</label>
        <div class="help_tip">
            `+ helpCircleHTML + `
            <div class="tip_text">
            <p>分段翻译会对区域内的每一个&#60;&#112;&#47;&#62;和&#60;&#105;&#47;&#62;标签依次进行翻译，</p>
            <p>这通常在翻译<strong>长篇博客</strong>或者<strong>超长的题目</strong>时很有用。</p>
            <p><u>注意：开启分段翻译会产生如下问题：</u></p>
            <p>- 使得翻译接口无法知晓整个文本的上下文信息，会降低翻译质量。</p>
            <p>- 会有<strong>部分内容不会被翻译</strong>，因为它们不是&#60;&#112;&#47;&#62;或&#60;&#105;&#47;&#62;标签</p>
            </div>
        </div>
        <input type="checkbox" id="enableSegmentedTranslation" name="enableSegmentedTranslation">
    </div>
    <h3>翻译设置</h3>
    <hr>
    <label>
        <input type='radio' name='translation' value='deepl'>
        <span class='NowcoderBetter_setting_menu_label_text'>deepl翻译</span>
    </label>
    <label>
        <input type='radio' name='translation' value='youdao'>
        <span class='NowcoderBetter_setting_menu_label_text'>有道翻译</span>
    </label>
    <label>
        <input type='radio' name='translation' value='google'>
        <span class='NowcoderBetter_setting_menu_label_text'>Google翻译</span>
    </label>
    <label>
        <input type='radio' name='translation' value='openai'>
        <span class='NowcoderBetter_setting_menu_label_text'>使用ChatGPT翻译(API)
            <div class="help_tip">
                `+ helpCircleHTML + `
                <div class="tip_text">
                <p><b>请在下方选定你想使用的配置信息</b></p>
                <p>脚本的所有请求均在本地完成</p>
                </div>
            </div>
        </span>
    </label>
    <div class='NowcoderBetter_setting_menu_input' id='openai' style='display: none;'>
        <div id="chatgpt-config"></div>
    </div>
    <button id='save'>保存</button>
    </div>
`;

const chatgptConfigEditHTML = `
    <div class='NowcoderBetter_setting_menu' id='config_edit_menu'>
        <div class="tool-box">
            <button class="btn-close">×</button>
        </div>
        <h4>配置</h4>
        <h5>基本</h5>
        <hr>
        <label for='note'>
            <span class="input_label">备注:</span>
        </label>
        <input type='text' id='note' class='no_default' placeholder='请为该配置取一个备注名' require = true>
        <label for='openai_model'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">模型:</span>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                    <p>留空则默认为：gpt-3.5-turbo</p>
                    <p>模型列表请查阅<a target="_blank" href="https://platform.openai.com/docs/models">OpenAI官方文档</a></p>
                    <p><strong>此外，如果您使用的是服务商提供的代理API，请确认服务商是否支持对应模型</strong></p>
                    </div>
                </div>
            </div>
        </label>
        <input type='text' id='openai_model' placeholder='gpt-3.5-turbo' require = false>
        <label for='openai_key'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">KEY:</span>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                    <p>您需要输入自己的OpenAI key，<a target="_blank" href="https://platform.openai.com/account/usage">官网</a></p>
                    <p><b>如果您使用的是服务商提供的代理API，则应该填写服务商提供的 Key</b></p>
                    </div>
                </div>
            </div>
        </label>
        <input type='text' id='openai_key' class='no_default' placeholder='请输入KEY' require = true>
        <label for='openai_proxy'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">Proxy API:</span>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                        <p>留空则默认为OpenAI官方API</p>
                        <p>您也可以填写指定的API来代理访问OpenAI的API，</p>
                        <p>如果您使用的是服务商提供的代理API和KEY，则这里应该填写其提供的<strong>完整</strong>API地址，详请阅读脚本说明</p>
                        <p><strong>由于您指定了自定义的API，Tampermonkey会对您的跨域请求进行警告，您需要自行授权</strong></p>
                    </div>
                </div>
            </div>
        </label>
        <input type='text' id='openai_proxy' placeholder='https://api.openai.com/v1/chat/completions' require = false>
        <h5>高级</h5>
        <hr>
        <label for='_header'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">自定义header</span>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                        <p>格式样例：</p>
                        <div style="border: 1px solid #795548; padding: 10px;">
                            <p>name1 : 123<br>name2 : cccc</p>
                        </div>
                    </div>
                </div>
            </div>
        </label>
        <textarea id="_header" placeholder='（选填）您可以在这里填写向请求header中额外添加的键值对' require = false></textarea>
        <label for='_data'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">自定义data</span>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                        <p>格式样例：</p>
                        <div style="border: 1px solid #795548; padding: 10px;">
                            <p>name1 : 123<br>name2 : cccc</p>
                        </div>
                    </div>
                </div>
            </div>
        </label>
        <textarea id="_data" placeholder='（选填）您可以在这里填写向请求data中额外添加的键值对' require = false></textarea>
        <button id='save'>保存</button>
    </div>
`;

$(document).ready(function () {
    const $settingBtns = $(".NowcoderBetter_setting");
    $settingBtns.click(() => {
        const styleElement = GM_addStyle(darkenPageStyle);
        $settingBtns.prop("disabled", true).addClass("open");
        $("body").append(NowcoderBetterSettingMenuHTML);

        // 窗口初始化
        addDraggable($('#NowcoderBetter_setting_menu'));
        const chatgptStructure = {
            '#note': 'note',
            '#openai_model': 'model',
            '#openai_key': 'key',
            '#openai_proxy': 'proxy',
            '#_header': '_header',
            '#_data': '_data',
        }
        const checkable = [
            '#_header',
            '#_data',
        ]

        // 缓存配置信息
        let tempConfig = GM_getValue('chatgpt-config');
        tempConfig = setupConfigManagement('#chatgpt-config', tempConfig, chatgptStructure, chatgptConfigEditHTML, checkable);

        // 状态切换
        $("#enableSegmentedTranslation").prop("checked", GM_getValue("enableSegmentedTranslation") === true);
        $("#hoverTargetAreaDisplay").prop("checked", GM_getValue("hoverTargetAreaDisplay") === true);
        $("input[name='translation'][value='" + translation + "']").prop("checked", true);
        $("input[name='translation']").css("color", "gray");
        if (translation == "openai") {
            $("#openai").show();
            if (tempConfig) {
                $("input[name='config_item'][value='" + tempConfig.choice + "']").prop("checked", true);
            }
        } 

        // 翻译选择情况监听
        $("input[name='translation']").change(function () {
            var selected = $(this).val(); // 获取当前选中的值
            if (selected === "openai") {
                $("#openai").show();
                if (tempConfig) {
                    $("input[name='config_item'][value='" + tempConfig.choice + "']").prop("checked", true);
                }
            } else {
                $("#openai").hide();
            }
        });
        
        // 配置选择情况监听
        $("input[name='config_item']").change(function () {
            var selected = $(this).val(); // 获取当前选中的值
            tempConfig.choice = selected;
        });

        const $settingMenu = $(".NowcoderBetter_setting_menu");

        $("#save").click(debounce(function () {
            const settings = {
                hoverTargetAreaDisplay: $("#hoverTargetAreaDisplay").prop("checked"),
                enableSegmentedTranslation: $("#enableSegmentedTranslation").prop("checked"),
                translation: $("input[name='translation']:checked").val()
            };
            if (settings.translation === "openai") {
                var selectedIndex = $('input[name="config_item"]:checked').closest('li').index();
                if (selectedIndex === -1) {
                    $('#configControlTip').text('请选择一项配置！')
                    return;
                }
            }
            GM_setValue('chatgpt-config', tempConfig);
            let refreshPage = false; // 是否需要刷新页面
            for (const [key, value] of Object.entries(settings)) {
                if (!refreshPage && !(key == 'enableSegmentedTranslation' || key == 'translation')) {
                    if (GM_getValue(key) != value) refreshPage = true;
                }
                GM_setValue(key, value);
            }
            
            if (refreshPage) location.reload();
            else {
                // 更新配置信息
                enableSegmentedTranslation = settings.enableSegmentedTranslation;
                translation = settings.translation;
                if (settings.translation === "openai") {
                    var selectedIndex = $('#config_bar_ul li input[type="radio"]:checked').closest('li').index();
                    if (selectedIndex !== opneaiConfig.choice) {
                        opneaiConfig = GM_getValue("chatgpt-config");
                        const configAtIndex = opneaiConfig.configurations[selectedIndex];
                        openai_model = configAtIndex.model;
                        openai_key = configAtIndex.key;
                        openai_proxy = configAtIndex.proxy;
                        openai_header = configAtIndex._header ?
                            configAtIndex._header.split("\n").map(header => {
                                const [key, value] = header.split(":");
                                return { [key.trim()]: value.trim() };
                            }) : [];
                        openai_data = configAtIndex._data ?
                            configAtIndex._data.split("\n").map(header => {
                                const [key, value] = header.split(":");
                                return { [key.trim()]: value.trim() };
                            }) : [];
                    }
                }
            }

            $settingMenu.remove();
            $settingBtns.prop("disabled", false).removeClass("open");
            $(styleElement).remove();
        }));

        // 关闭
        $settingMenu.on("click", ".btn-close", () => {
            $settingMenu.remove();
            $settingBtns.prop("disabled", false).removeClass("open");
            $(styleElement).remove();
        });
    });
});

// html2md转换/处理规则
var turndownService = new TurndownService({ bulletListMarker: '-', escape: (text) => text });
var turndown = turndownService.turndown;

// 保留原始
turndownService.keep(['del']);

turndownService.addRule('removeByClass', {
    filter: function (node) {
        return node.classList.contains('html2md-panel') ||
            node.classList.contains('div-btn-copy') ||
            node.classList.contains('btn-copy') ||
            node.classList.contains('code-copy-btn') ||
            node.classList.contains('overlay')
    },
    replacement: function () {
        return '';
    }
});

// inline math
turndownService.addRule('inline-math1', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex";
    },
    replacement: function (content, node) {
        var text = $(node).find('annotation').text();
        if (text == "") {
            text = $(node).find('math').contents().filter(function () {
                return this.nodeType === Node.TEXT_NODE;
            }).text();
        }
        return "$" + text + "$";
    }
});
turndownService.addRule('inline-math2', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex-mathml";
    },
    replacement: function (content, node) {
        var text = "";
        $(node).contents().each(function () {
            if (this.nodeType === Node.TEXT_NODE) {
                text += $(this).text();
            }
        });
        return "$" + text + "$";
    }
});

// block math
turndownService.addRule('block-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex-display";
    },
    replacement: function (content, node) {
        return "\n$$\n" + $(node).find('annotation').text() + "\n$$\n";
    }
});

// pre
turndownService.addRule('pre', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "pre";
    },
    replacement: function (content, node) {
        return "```\n" + content + "```\n";
    }
});

// bordertable
turndownService.addRule('bordertable', {
    filter: 'table',
    replacement: function (content, node) {
        if (node.classList.contains('table')) {
            var output = [],
                thead = '',
                trs = node.querySelectorAll('tr');
            if (trs.length > 0) {
                var ths = trs[0].querySelectorAll('th');
                if (ths.length > 0) {
                    thead = '| ' + Array.from(ths).map(th => turndownService.turndown(th.innerHTML.trim())).join(' | ') + ' |\n'
                        + '| ' + Array.from(ths).map(() => ' --- ').join('|') + ' |\n';
                }
            }
            var rows = node.querySelectorAll('tr');
            Array.from(rows).forEach(function (row, i) {
                if (i > 0) {
                    var cells = row.querySelectorAll('td,th');
                    var trow = '| ' + Array.from(cells).map(cell => turndownService.turndown(cell.innerHTML.trim())).join(' | ') + ' |';
                    output.push(trow);
                }
            });
            return thead + output.join('\n');
        } else {
            return content;
        }
    }
});


// 随机数生成
function getRandomNumber(numDigits) {
    let min = Math.pow(10, numDigits - 1);
    let max = Math.pow(10, numDigits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 按钮面板
function addButtonPanel(parent, suffix, type, is_simple = false) {
    let htmlString = `<div class='html2md-panel'>
    <button class='html2mdButton html2md-view${suffix}'>MarkDown视图</button>
    <button class='html2mdButton html2md-cb${suffix}'>Copy</button>
    <button class='html2mdButton translateButton${suffix}'>翻译</button>
  </div>`;
    if (type === "this_level") {
        $(parent).before(htmlString);
    } else if (type === "child_level") {
        $(parent).prepend(htmlString);
    }
    if (is_simple) {
        $('.html2md-panel').find('.html2mdButton.html2md-view' + suffix + ', .html2mdButton.html2md-cb' + suffix).remove();
    }
}

function addButtonWithHTML2MD(parent, suffix, type) {
    $(document).on("click", ".html2md-view" + suffix, function () {
        var target, removedChildren = $();
        if (type === "this_level") {
            target = $(".html2md-view" + suffix).parent().next().get(0);
        } else if (type === "child_level") {
            target = $(".html2md-view" + suffix).parent().parent().get(0);
            removedChildren = $(".html2md-view" + suffix).parent().parent().children(':first').detach();
        }
        if (target.viewmd) {
            target.viewmd = false;
            $(this).text("MarkDown视图");
            $(this).removeClass("mdViewed");
            $(target).html(target.original_html);
        } else {
            target.viewmd = true;
            if (!target.original_html) {
                target.original_html = $(target).html();
            }
            if (!target.markdown) {
                target.markdown = turndownService.turndown($(target).html());
            }
            $(this).text("原始内容");
            $(this).addClass("mdViewed");
            $(target).html(`<span class="mdViewContent" oninput="$(this).parent().get(0).markdown=this.value;" style="width:auto; height:auto;">${target.markdown}</span>`);
        }
        // 恢复删除的元素
        if (removedChildren) $(target).prepend(removedChildren);
    });
}

function addButtonWithHTML2MD(parent, suffix, type) {
    $(document).on("click", ".html2md-view" + suffix, debounce(function () {
        var target, removedChildren = $();
        if (type === "this_level") {
            target = $(".html2md-view" + suffix).parent().next().get(0);
        } else if (type === "child_level") {
            target = $(".html2md-view" + suffix).parent().parent().get(0);
            removedChildren = $(".html2md-view" + suffix).parent().parent().children(':first').detach();
        }
        if (target.viewmd) {
            target.viewmd = false;
            $(this).text("MarkDown视图");
            $(this).removeClass("mdViewed");
            $(target).html(target.original_html);
        } else {
            target.viewmd = true;
            if (!target.original_html) {
                target.original_html = $(target).html();
            }
            if (!target.markdown) {
                target.markdown = turndownService.turndown($(target).html());
            }
            $(this).text("原始内容");
            $(this).addClass("mdViewed");
            $(target).html(`<span class="mdViewContent" oninput="$(this).parent().get(0).markdown=this.value;" style="width:auto; height:auto;">${target.markdown}</span>`);
        }
        // 恢复删除的元素
        if (removedChildren) $(target).prepend(removedChildren);
    }));

    if (hoverTargetAreaDisplay) {
        var previousCSS;
        $(document).on("mouseover", ".html2md-view" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".html2md-view" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".html2md-view" + suffix).parent().parent().get(0);
            }

            $(target).append('<div class="overlay">目标转换区域</div>');
            
            previousCSS = {
                "position": $(target).css("position"),
                "display": $(target).css("display")
            };
            $(target).css({
                "position": "relative",
                "display": "block"
            });

            $(".html2md-view" + suffix).parent().css({
                "position": "relative",
                "z-index": "99999"
            })
        });

        $(document).on("mouseout", ".html2md-view" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".html2md-view" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".html2md-view" + suffix).parent().parent().get(0);
            }

            $(target).find('.overlay').remove();
            $(target).css(previousCSS);
            $(".html2md-view" + suffix).parent().css({
                "position": "static"
            })
        });
    }
}

function addButtonWithCopy(parent, suffix, type) {
    $(document).on("click", ".html2md-cb" + suffix, debounce(function () {
        var target, removedChildren;
        if (type === "this_level") {
            target = $(".translateButton" + suffix).parent().next().eq(0).clone();
        } else if (type === "child_level") {
            target = $(".translateButton" + suffix).parent().parent().eq(0).clone();
            $(target).children(':first').remove();
        }
        if ($(target).find('.mdViewContent').length <= 0) {
            text = turndownService.turndown($(target).html());
        } else {
            text = $(target).find('.mdViewContent').text();
        }
        GM_setClipboard(text);
        $(this).addClass("copied");
        $(this).text("Copied");
        // 更新复制按钮文本
        setTimeout(() => {
            $(this).removeClass("copied");
            $(this).text("Copy");
        }, 2000);
        $(target).remove();
    }));

    if (hoverTargetAreaDisplay) {
        var previousCSS;
        $(document).on("mouseover", ".html2md-cb" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".html2md-cb" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".html2md-cb" + suffix).parent().parent().get(0);
            }

            $(target).append('<div class="overlay">目标复制区域</div>');
            previousCSS = {
                "position": $(target).css("position"),
                "display": $(target).css("display")
            };

            $(target).css({
                "position": "relative",
                "display": "block"
            });
            $(".html2md-cb" + suffix).parent().css({
                "position": "relative",
                "z-index": "99999"
            })
        });

        $(document).on("mouseout", ".html2md-cb" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".html2md-cb" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".html2md-cb" + suffix).parent().parent().get(0);
            }

            $(target).find('.overlay').remove();
            $(target).css(previousCSS);
            $(".html2md-cb" + suffix).parent().css({
                "position": "static"
            })
        });
    }
}

async function addButtonWithTranslation(parent, suffix, type) {
    var result;
    $(document).on('click', '.translateButton' + suffix, debounce(async function () {
        $(this).trigger('mouseout');
        $(this).removeClass("translated");
        $(this).text("翻译中");
        $(this).css("cursor", "not-allowed");
        $(this).prop("disabled", true);
        var target, element_node, block, errerNum = 0;
        if (type === "this_level") block = $(".translateButton" + suffix).parent().next();
        else if (type === "child_level") block = $(".translateButton" + suffix).parent().parent();

        // 重新翻译
        if (result) {
            if (result.translateDiv) {
                $(result.translateDiv).remove();
            }
            if (result.copyDiv) {
                $(result.copyDiv).remove();
            }
            if (result.copyButton) {
                $(result.copyButton).remove();
            }
            // 移除旧的事件
            $(document).off("mouseover", ".translateButton" + suffix);
            $(document).off("mouseout", ".translateButton" + suffix);
            // 重新绑定悬停事件
            if (hoverTargetAreaDisplay) bindHoverEvents(suffix, type);
        }

        // 分段翻译
        if (enableSegmentedTranslation) {
            var pElements = block.find("p, li");
            for (let i = 0; i < pElements.length; i++) {
                target = $(pElements[i]).eq(0).clone();
                if (type === "child_level") $(target).children(':first').remove();
                element_node = pElements[i];
                if (type === "child_level") {
                    $(pElements[i]).append("<div></div>");
                    element_node = $(pElements[i]).find("div:last-child").get(0);
                }
                result = await blockProcessing(target, element_node, $(".translateButton" + suffix));
                if (result.status) errerNum += 1;
                $(target).remove();
                if (translation == "deepl") await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } else {
            target = block.eq(0).clone();
            if (type === "child_level") $(target).children(':first').remove();
            element_node = $(block).get(0);
            if (type === "child_level") {
                $(parent).append("<div></div>");
                element_node = $(parent).find("div:last-child").get(0);
            }
            //是否跳过折叠块
            if ($(target).find('.spoiler').length > 0) {
                const shouldSkip = await skiFoldingBlocks();
                if (shouldSkip) {
                    $(target).find('.spoiler').remove();
                } else {
                    $(target).find('.html2md-panel').remove();
                }
            }
            result = await blockProcessing(target, element_node, $(".translateButton" + suffix));
            if (result.status) errerNum += 1;
            $(target).remove();
        }
        if (!errerNum) {
            $(this).addClass("translated")
                .text("已翻译")
                .css("cursor", "pointer")
                .removeClass("error")
                .prop("disabled", false);
        } else {
            $(this).prop("disabled", false);
        }

        // 重新翻译
        let currentText, is_error;
        $(document).on("mouseover", ".translateButton" + suffix, function () {
            currentText = $(this).text();
            $(this).text("重新翻译");
            if ($(this).hasClass("error")) {
                is_error = true;
                $(this).removeClass("error");
            }
        });

        $(document).on("mouseout", ".translateButton" + suffix, function () {
            $(this).text(currentText);
            if (is_error) $(this).addClass("error");
        });
    }));

    // 目标区域指示
    function bindHoverEvents(suffix, type) {
        var previousCSS;

        $(document).on("mouseover", ".translateButton" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".translateButton" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".translateButton" + suffix).parent().parent().get(0);
            }

            $(target).append('<div class="overlay">目标翻译区域</div>');
            previousCSS = {
                "position": $(target).css("position"),
                "display": $(target).css("display")
            };
            $(target).css({
                "position": "relative",
                "display": "block"
            });
            $(".translateButton" + suffix).parent().css({
                "position": "relative",
                "z-index": "99999"
            });
        });

        $(document).on("mouseout", ".translateButton" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".translateButton" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".translateButton" + suffix).parent().parent().get(0);
            }

            $(target).find('.overlay').remove();
            if (previousCSS) {
                $(target).css(previousCSS);
            }
            $(".translateButton" + suffix).parent().css({
                "position": "static"
            });
        });
    }

    if (hoverTargetAreaDisplay) bindHoverEvents(suffix, type);
}

// 块处理
async function blockProcessing(target, element_node, button) {
    if (!target.markdown) {
        target.markdown = turndownService.turndown($(target).html());
    }
    const textarea = document.createElement('textarea');
    textarea.value = target.markdown;
    var result = await translateProblemStatement(textarea.value, element_node, $(button));
    //
    if (result.status == 1) {
        $(button).addClass("error")
            .text("翻译中止")
            .css("cursor", "pointer")
            .prop("disabled", false);
        $(result.translateDiv).remove();
        $(target).remove();
    } else if (result.status == 2) {
        result.translateDiv.classList.add("error_translate");
        $(button).addClass("error")
            .text("翻译出错")
            .css("cursor", "pointer")
            .prop("disabled", false);
        $(target).remove();
    }
    return result;
}

function addConversionButton() {
    // 添加按钮到题目部分
    $('.subject-question').each(function () {
        let id = "_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
        addButtonWithTranslation(this, id, "this_level");
    });

    // 添加按钮到question-oi-bd部分
    $('.question-oi-bd').each(function () {
        let id = "_question-oi-bd_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
        addButtonWithTranslation(this, id, "this_level");
    });

    // 添加按钮到pre部分
    var selectorList = ['.question-oi-bd', '.CodeMirror'];//排除有这些祖宗节点的pre
    $('pre').each(function () {
        for (var i = 0; i < selectorList.length; i++) {
            if ($(this).closest(selectorList[i]).length > 0) {
                return true;
            }
        }
        let id = "_pre_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
        addButtonWithTranslation(this, id, "this_level");
    });

    // 添加按钮到题解部分
    $('div.nc-post-content').each(function () {
        let id = "_nc-post-content_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
        addButtonWithTranslation(this, id, "this_level");
    });
    // 监听展开按钮
    $(document).on('click', '.more-unfold', function (event) {
        var interval = setInterval(function () {
            if ($("div.nc-post-content:not(div.html2md-panel + div.nc-post-content)").length > 0) {
                $("div.nc-post-content:not(div.html2md-panel + div.nc-post-content)").each(function () {
                    let id = "_nc-post-content_" + getRandomNumber(8);
                    addButtonPanel(this, id, "this_level");
                    addButtonWithHTML2MD(this, id, "this_level");
                    addButtonWithCopy(this, id, "this_level");
                    addButtonWithTranslation(this, id, "this_level");
                });
                clearInterval(interval);
            }
        }, 1000);       
    });
};

$(document).ready(function () {
    var tip_SegmentedTranslation = $("<div></div>")
        .addClass("alert alert-danger")
        .html(`
        Nowcoder Better! —— 注意！分段翻译已开启，这会造成负面效果，
        <p>除非你现在需要翻译超长篇的博客或者题目，否则请前往设置关闭分段翻译</p>
      `)
        .css({
            margin: "1em",
            "text-align": "center",
            "font-weight": "600",
            position: "relative",
        });

    if (enableSegmentedTranslation)
        $(".content-board").before(tip_SegmentedTranslation); //显示分段翻译警告

    addConversionButton();
});

// 字数超限确认
function showWordsExceededDialog(button) {
    return new Promise(resolve => {
        const styleElement = GM_addStyle(darkenPageStyle);
        $(button).removeClass("translated");
        $(button).text("字数超限");
        $(button).css("cursor", "not-allowed");
        $(button).prop("disabled", true);
        let htmlString = `
    <div class="wordsExceeded">
        <h3>字数超限!</h3>
        <p>注意，即将翻译的内容字数超过了4950个字符，您可能选择了错误的翻译按钮</p>
        <div style="display:flex; padding:5px 0px; align-items: center;">
    `+ helpCircleHTML + `
          <p>
          由于实现方式，区域中会出现多个翻译按钮，请点击更小的子区域中的翻译按钮，
          <br>或者在设置面板中开启 分段翻译 后重试。
          </p>
        </div>
        <p>对于免费的接口，大量请求可能导致你的IP被暂时禁止访问，对于GPT，会消耗大量的token</p>
        <p>您确定要继续翻译吗？</p>
        <div style="display:flex; padding-top:10px">
          <button id="continueButton">继续</button><button id="cancelButton">取消</button>
        </div>
    </div>
    `;
        $('body').before(htmlString);
        $("#continueButton").click(function () {
            $(styleElement).remove();
            $('.wordsExceeded').remove();
            resolve(true);
        });
        $("#cancelButton").click(function () {
            $(styleElement).remove();
            $('.wordsExceeded').remove();
            resolve(false);
        });
    });
}

// 跳过折叠块确认
function skiFoldingBlocks() {
    return new Promise(resolve => {
        const styleElement = GM_addStyle(darkenPageStyle);
        let htmlString = `
    <div class="wordsExceeded">
        <h3>是否跳过折叠块？</h3>
        <p></p>
        <div style="display:grid; padding:5px 0px; align-items: center;">
          <p>
          即将翻译的区域中包含折叠块，可能不需要翻译，现在您需要选择是否跳过这些折叠块，
          </p>
          <p>
          如果其中有您需要翻译的折叠块，可以稍后再单独点击这些折叠块内的翻译按钮进行翻译
          </p>
        </div>
        <p>要跳过折叠块吗？（建议选择跳过）</p>
        <div style="display:flex; padding-top:10px">
          <button id="cancelButton">否</button><button id="skipButton">跳过</button>
        </div>
    </div>
    `;
        $('body').before(htmlString);
        $("#skipButton").click(function () {
            $(styleElement).remove();
            $('.wordsExceeded').remove();
            resolve(true);
        });
        $("#cancelButton").click(function () {
            $(styleElement).remove();
            $('.wordsExceeded').remove();
            resolve(false);
        });
    });
}

// 翻译框/翻译处理器
var translatedText = "";
async function translateProblemStatement(text, element_node, button) {
    let status = 0;
    let id = getRandomNumber(8);
    let matches = [];
    let replacements = {};
    // 创建元素并放在element_node的后面
    const translateDiv = document.createElement('div');
    translateDiv.setAttribute('id', id);
    translateDiv.classList.add('translate-problem-statement');
    const spanElement = document.createElement('span');
    translateDiv.appendChild(spanElement);
    element_node.insertAdjacentElement('afterend', translateDiv);
    // 替换latex公式
    if (translation != "openai") {
        // 使用GPT翻译时不必替换latex公式
        let i = 0;
        // 块公式
        matches = matches.concat(text.match(/\$\$([\s\S]*?)\$\$/g));
        try {
            for (i; i < matches.length; i++) {
                let match = matches[i];
                text = text.replace(match, `【${i + 1}】`);
                replacements[`【${i + 1}】`] = match;
            }
        } catch (e) { }
        // 行内公式
        matches = matches.concat(text.match(/\$(.*?)\$/g));
        try {
            for (i; i < matches.length; i++) {
                let match = matches[i];
                text = text.replace(match, `【${i + 1}】`);
                replacements[`【${i + 1}】`] = match;
            }
        } catch (e) { }
    }
    if (text.length > 4950) {
        const shouldContinue = await showWordsExceededDialog(button);
        if (!shouldContinue) {
            status = 1;
            return {
                translateDiv: translateDiv,
                status: status
            };
        }
    }
    // 翻译
    if (translation == "deepl") {
        translateDiv.innerHTML = "正在使用 deepl 翻译中……请稍等";
        translatedText = await translate_deepl(text);
    } else if (translation == "youdao") {
        translateDiv.innerHTML = "正在使用 有道 翻译中……请稍等";
        translatedText = await translate_youdao_mobile(text);
    } else if (translation == "google") {
        translateDiv.innerHTML = "正在使用 google 翻译中……请稍等";
        translatedText = await translate_gg(text);
    } else if (translation == "openai") {
        try {
            translateDiv.innerHTML = "正在使用 ChatGPT 翻译中……" +
                "<br><br>应用的配置：" + opneaiConfig.configurations[opneaiConfig.choice].note +
                "<br><br>使用 ChatGPT 翻译需要很长的时间，请耐心等待";
            translatedText = await translate_openai(text);
        } catch (error) {
            status = 2;
            translatedText = error;
        }
    } 
    if (/^翻译出错/.test(translatedText)) status = 2;
    // 还原latex公式
    translatedText = translatedText.replace(/】【/g, '】 【');
    if (translation != "openai") {
        try {
            for (let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let replacement = replacements[`【${i + 1}】`];
                let regex;
                regex = new RegExp(`【\\s*${i + 1}\\s*】`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`\\[\\s*${i + 1}\\s*\\]`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`【\\s*${i + 1}(?![】\\d])`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`(?<![【\\d])${i + 1}\\s*】`, 'g');
                translatedText = translatedText.replace(regex, " " + replacement);
            }
        } catch (e) { }
    }

    // 创建一个隐藏的元素来保存 translatedText 的值
    var textElement = document.createElement("div");
    textElement.style.display = "none";
    textElement.textContent = translatedText;
    translateDiv.parentNode.insertBefore(textElement, translateDiv);

    // 翻译复制按钮
    var copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    var wrapperDiv = document.createElement("div");
    $(wrapperDiv).css({
        display: "flex",
        justifyContent: "flex-end"
    });
    $(wrapperDiv).append(copyButton);
    $(copyButton).addClass("html2mdButton html2md-cb");

    copyButton.addEventListener("click", function () {
        var translatedText = textElement.textContent;
        GM_setClipboard(translatedText);
        $(this).addClass("copied").text("Copied");
        // 更新复制按钮文本
        setTimeout(() => {
            $(this).removeClass("copied");
            $(this).text("Copy");
        }, 2000);
    });
    translateDiv.parentNode.insertBefore(wrapperDiv, translateDiv);

    // 转义LaTex中的特殊符号
    const escapeRules = [
        { pattern: /(?<!\\)>(?!\s)/g, replacement: " &gt; " }, // >符号
        { pattern: /(?<!\\)</g, replacement: " &lt; " }, // <符号
        { pattern: /(?<!\\)\*/g, replacement: " &#42; " }, // *符号
        { pattern: /(?<!\\)&(?=\s)/g, replacement: "\\&" }, // &符号
        { pattern: /\\&/g, replacement: "\\\\&" }, // &符号
    ];

    let latexMatches = [...translatedText.matchAll(/\$\$([\s\S]*?)\$\$|\$(.*?)\$/g)];

    for (const match of latexMatches) {
        const matchedText = match[0];

        for (const rule of escapeRules) {
            const escapedText = matchedText.replaceAll(rule.pattern, rule.replacement);
            translatedText = translatedText.replace(matchedText, escapedText);
        }
    }

    // 渲染MarkDown
    var md = window.markdownit();
    var html = md.render(translatedText);
    translateDiv.innerHTML = html;
    // 渲染Latex
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(translateDiv, {
            delimiters: [{
                left: "$$",
                right: "$$",
                display: true
            }, {
                left: "$",
                right: "$",
                display: false
            }]
        });
    }
    return {
        translateDiv: translateDiv,
        status: status,
        copyDiv: textElement,
        copyButton: copyButton
    };

}

// ChatGPT
async function translate_openai(raw) {
    var openai_retext = "";
    var data = {
        model:  (openai_model !== null && openai_model !== "") ? openai_model : 'gpt-3.5-turbo',
        messages: [{
            role: "user",
            content: "请将下面的文本翻译为中文，这是一道编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的latex公式不翻译，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw 
        }],
        temperature: 0.7,
        ...Object.assign({}, ...openai_data)
    };
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: (openai_proxy !== null && openai_proxy !== "") ? openai_proxy : 'https://api.openai.com/v1/chat/completions',

            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + openai_key,
                ...Object.assign({}, ...openai_header)
            },
            responseType: 'json',
            onload: function (response) {
                if (!response.response) {
                    reject("发生了未知的错误，如果你启用了代理API，请确认是否填写正确，并确保代理能够正常工作。\n\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/471106/feedback 反馈 请注意打码响应报文的敏感部分\n\n响应报文：" + JSON.stringify(response));
                }
                else if (!response.response.choices || response.response.choices.length < 1 || !response.response.choices[0].message) {
                    resolve("翻译出错，请重试\n\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/471106/feedback 反馈\n\n报错信息：" + JSON.stringify(response.response, null, ''));
                } else {
                    openai_retext = response.response.choices[0].message.content;
                    resolve(openai_retext);
                }
            },
            onerror: function (response) {
                reject("发生了未知的错误，请确认你是否能正常访问OpenAi的接口，如果使用代理API，请检查是否正常工作\n\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/471106/feedback 反馈 请注意打码响应报文的敏感部分\n\n响应报文：" + JSON.stringify(response));
            },
        });

    });
}

//--谷歌翻译--start
async function translate_gg(raw) {
    return new Promise((resolve, reject) => {
        const url = 'https://translate.google.com/m';
        const params = `tl=zh-CN&q=${encodeURIComponent(raw)}`;

        GM_xmlhttpRequest({
            method: 'GET',
            url: `${url}?${params}`,
            onload: function (response) {
                const html = response.responseText;
                const translatedText = $(html).find('.result-container').text();
                resolve(translatedText);
            },
            onerror: function (error) {
                console.error('Error:', error);
                reject(error);
            }
        });
    });
}
//--谷歌翻译--end

//--有道翻译m--start
async function translate_youdao_mobile(raw) {
    const options = {
        method: "POST",
        url: 'http://m.youdao.com/translate',
        data: "inputtext=" + encodeURIComponent(raw) + "&type=AUTO",
        anonymous: true,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            'Host': 'm.youdao.com',
            'Origin': 'http://m.youdao.com',
            'Referer': 'http://m.youdao.com/translate',
        }
    }
    return await BaseTranslate('有道翻译mobile', raw, options, res => /id="translateResult">\s*?<li>([\s\S]*?)<\/li>\s*?<\/ul/.exec(res)[1])
}
//--有道翻译m--end

//--Deepl翻译--start
function getTimeStamp(iCount) {
    const ts = Date.now();
    if (iCount !== 0) {
        iCount = iCount + 1;
        return ts - (ts % iCount) + iCount;
    } else {
        return ts;
    }
}

async function translate_deepl(raw) {
    const id = (Math.floor(Math.random() * 99999) + 100000) * 1000;
    const data = {
        jsonrpc: '2.0',
        method: 'LMT_handle_texts',
        id,
        params: {
            splitting: 'newlines',
            lang: {
                source_lang_user_selected: 'auto',
                target_lang: 'ZH',
            },
            texts: [{
                text: raw,
                requestAlternatives: 3
            }],
            timestamp: getTimeStamp(raw.split('i').length - 1)
        }
    }
    let postData = JSON.stringify(data);
    if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
        postData = postData.replace('"method":"', '"method" : "');
    } else {
        postData = postData.replace('"method":"', '"method": "');
    }
    const options = {
        method: 'POST',
        url: 'https://www2.deepl.com/jsonrpc',
        data: postData,
        headers: {
            'Content-Type': 'application/json',
            'Host': 'www2.deepl.com',
            'Origin': 'https://www.deepl.com',
            'Referer': 'https://www.deepl.com/',
        },
        anonymous: true,
        nocache: true,
    }
    return await BaseTranslate('Deepl翻译', raw, options, res => JSON.parse(res).result.texts[0].text)
}

//--Deepl翻译--end

//--异步请求包装工具--start
async function PromiseRetryWrap(task, options, ...values) {
    const { RetryTimes, ErrProcesser } = options || {};
    let retryTimes = RetryTimes || 5;
    const usedErrProcesser = ErrProcesser || (err => { throw err });
    if (!task) return;
    while (true) {
        try {
            return await task(...values);
        } catch (err) {
            if (!--retryTimes) {
                console.log(err);
                return usedErrProcesser(err);
            }
        }
    }
}

async function BaseTranslate(name, raw, options, processer) {
    let errtext;
    const toDo = async () => {
        var tmp;
        try {
            const data = await Request(options);
            tmp = data.responseText;
            const result = await processer(tmp);
            if (result) sessionStorage.setItem(name + '-' + raw, result);
            return result
        } catch (err) {
            errtext = tmp;
            throw {
                responseText: tmp,
                err: err
            }
        }
    }
    return await PromiseRetryWrap(toDo, { RetryTimes: 3, ErrProcesser: () => "翻译出错，请重试或更换翻译接口\n\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/471106/feedback 反馈  请注意打码报错信息的敏感部分\n\n报错信息：" + errtext })
}


function Request(options) {
    return new Promise((reslove, reject) => GM_xmlhttpRequest({ ...options, onload: reslove, onerror: reject }))
}

//--异步请求包装工具--end


// 配置自动迁移代码（将在10个小版本后移除-1.20）
if (GM_getValue("openai_key") || GM_getValue("api2d_key")) {
    const newConfig = { "choice": -1, "configurations": [] };
    if (GM_getValue("openai_key")) {
        let config1 = {
            "note": "我的配置1",
            "model": GM_getValue("openai_model"),
            "key": GM_getValue("openai_key"),
            "proxy": GM_getValue("openai_proxy"),
            "_header": "",
            "_data": ""
        }
        if (GM_getValue("translation") === "openai") newConfig.choice = 0;
        newConfig.configurations.push(config1);
    }
    if (GM_getValue("api2d_key")) {
        let config2 = {
            "note": "api2d",
            "model": GM_getValue("api2d_model"),
            "key": GM_getValue("api2d_key"),
            "proxy": GM_getValue("api2d_request_entry") + '/v1/chat/completions',
            "_header": GM_getValue("x_api2d_no_cache") ? "" : " x-api2d-no-cache : 1",
            "_data": ""
        }
        if (GM_getValue("translation") === "api2d") {
            if (GM_getValue("openai_key")) newConfig.choice = 1;
            else newConfig.choice = 0;
        }
        newConfig.configurations.push(config2);
    }
    GM_setValue("chatgpt-config", newConfig);
    const keysToDelete = ["openai_key", "openai_model", "openai_proxy", "api2d_key", "api2d_model", "api2d_request_entry", "x_api2d_no_cache", "showOpneAiAdvanced"];
    keysToDelete.forEach(key => {
        if (GM_getValue(key) != undefined) GM_deleteValue(key);
    });
    if (GM_getValue("translation") === "api2d") GM_setValue("translation", "openai");
    location.reload();
}
