// ==UserScript==
// @name         Codeforces Better!
// @namespace    https://greasyfork.org/users/747162
// @version      1.53
// @description  Codeforces界面汉化、题目翻译，markdown视图，一键复制题目，跳转到洛谷
// @author       北极小狐
// @match        *://*.codeforces.com/*
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
// @grant        GM_addStyle
// @grant        GM_cookie
// @grant        GM_setClipboard
// @icon         https://aowuucdn.oss-cn-beijing.aliyuncs.com/codeforces.png
// @require      https://cdn.staticfile.org/turndown/7.1.2/turndown.min.js
// @require      https://cdn.staticfile.org/markdown-it/13.0.1/markdown-it.min.js
// @license      MIT
// @compatible	 Chrome
// @compatible	 Firefox
// @compatible	 Edge
// ==/UserScript==

// 状态与初始化
const getGMValue = (key, defaultValue) => {
    const value = GM_getValue(key);
    if (value === undefined) {
        GM_setValue(key, defaultValue);
        return defaultValue;
    }
    return value;
};
const is_mSite = window.location.hostname.startsWith('m');
const is_acmsguru = window.location.href.includes("acmsguru");
const is_oldLatex = $('.tex-span').length;
const bottomZh_CN = getGMValue("bottomZh_CN", true);
const showLoading = getGMValue("showLoading", true);
const loaded = getGMValue("loaded", false);
const translation = getGMValue("translation", "deepl");
const expandFoldingblocks = getGMValue("expandFoldingblocks", true);
const enableSegmentedTranslation = getGMValue("enableSegmentedTranslation", false);
const showJumpToLuogu = getGMValue("showJumpToLuogu", true);
const hoverTargetAreaDisplay = getGMValue("hoverTargetAreaDisplay", false);
var x_api2d_no_cache = getGMValue("x_api2d_no_cache", true);
var showOpneAiAdvanced = getGMValue("showOpneAiAdvanced", false);

// 常量
const helpCircleHTML = '<div class="help-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592 0-42.944-14.08-76.736-42.24-101.376-28.16-25.344-65.472-37.312-111.232-37.312zm-12.672 406.208a54.272 54.272 0 0 0-38.72 14.784 49.408 49.408 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.848 54.848 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.968 51.968 0 0 0-15.488-38.016 55.936 55.936 0 0 0-39.424-14.784z"></path></svg></div>';
const darkenPageStyle = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 999; }`;

// 报错信息捕获
/*let errorMessages = "";
const defaultError = console.error.bind(console);
console.error = (message) => {
    const error = new Error();
    const stack = error.stack.split("\n").slice(2).join("\n");
    const now = new Date().toLocaleString();
    errorMessages += "\n## " + message + "\n### time: " + now +"\n" + stack + "\n";
    defaultError(message);
};
window.onerror = (message, source, lineno, colno, error) => {
    const now = new Date().toLocaleString();
    errorMessages += "\n## " + message + "\n### time: " + now +"\n" + error.stack + "\n";
    defaultError(message);
    return true;
};*/

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
    display: grid;
    justify-items: start;
    white-space: pre-wrap;
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
.translate-problem-statement a {
    color: #10b981;
    font-weight: 600;
    background: 0 0;
    text-decoration: none;
}
.translate-problem-statement p {
    margin: 8px 0 !important;
}
.translate-problem-statement ol, .translate-problem-statement ul {
    display: grid;
    margin-inline-start: 0.8em;
    margin-block-start: 0em;
    margin: 0.5em 0 0 3em;
}
.translate-problem-statement li {
    display: list-item;
    height: auto;
    word-wrap: break-word;
}
.translate-problem-statement ol li {
    list-style-type: auto;
}
.translate-problem-statement ul li {
    list-style-type: disc;
}
.translate-problem-statement li p {
    margin: -20px 0px 0px 0px !important;
    padding: 0 !important;
}
.translate-problem-statement img {
    max-width: 100.0%;
    max-height: 100.0%;
}
.ttypography .translate-problem-statement .MathJax {
    color: #059669!important;
}
.translate-problem-statement span.math {
    margin: 0px 2.5px !important;
}
.translate-problem-statement a:hover {
    background-color: #800;
    color: #fff;
    text-decoration: none;
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
    background-color: #f1f8ff;
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
    border: 1px #ccc solid;
    border-collapse: collapse;
    margin: 1.3571em 0 0;
    color: #222;
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
button.html2mdButton.CFBetter_setting {
    float: right;
    height: 30px;
    background: #60a5fa;
    color: white;
    margin: 10px;
    border: 0px;
}

button.html2mdButton.CFBetter_setting.open {
    background-color: #e6e6e6;
    color: #727378;
    cursor: not-allowed;
}

#CFBetter_setting_menu {
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
}
#CFBetter_setting_menu h3 {
    margin-top: 10px;
}
#CFBetter_setting_menu hr {
    border: none;
    height: 1px;
    background-color: #ccc;
    margin: 10px 0;
}
/*设置面板-关闭按钮*/
#CFBetter_setting_menu .tool-box {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  top: 3px;
  right: 3px;
}

#CFBetter_setting_menu .btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px !important;
  width: 1px;
  height: 1px !important;
  color: transparent;
  font-size: 0;
  cursor: pointer;
  background-color: #ff000080;
  border: none;
  border-radius: 10px;
  transition: .15s ease all;
}

#CFBetter_setting_menu .btn-close:hover {
    width: 20px;
    height: 20px !important;
    font-size: 17px;
    color: #ffffff;
    background-color: #ff0000cc;
    box-shadow: 0 5px 5px 0 #00000026;
}

#CFBetter_setting_menu .btn-close:active {
  width: .9rem;
  height: .9rem;
  font-size: 1px;
  color: #ffffffde;
  --shadow-btn-close: 0 3px 3px 0 #00000026;
  box-shadow: var(--shadow-btn-close);
}

/*设置面板-checkbox*/
#CFBetter_setting_menu input[type=checkbox]:focus {
    outline: 0px;
}

#CFBetter_setting_menu input[type="checkbox"] {
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

#CFBetter_setting_menu input[type="checkbox"]::before {
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
}

#CFBetter_setting_menu input[type="checkbox"]::after {
	content: url("data:image/svg+xml,%3Csvg xmlns='://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.55021 5.84315L17.1568 16.4498L16.4497 17.1569L5.84311 6.55026L6.55021 5.84315Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17.1567 6.55021L6.55012 17.1568L5.84302 16.4497L16.4496 5.84311L17.1567 6.55021Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3C/svg%3E");
	position: absolute;
	top: 0;
	left: 24px;
}

#CFBetter_setting_menu input[type="checkbox"]:checked {
	border: 1.5px solid #C5CAE9;
	background: #E8EAF6;
}

#CFBetter_setting_menu input[type="checkbox"]:checked::before {
	background: #C5CAE9;
	border: 1.5px solid #7986CB;
	transform: translate(122%, 2%);
	transition: all 0.3s ease-in-out;
}

#CFBetter_setting_menu input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    position: absolute;
    top: 1.5px;
    left: 4.5px;
}

#CFBetter_setting_menu label {
    font-size: 16px;
}

.CFBetter_setting_list {
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
#CFBetter_setting_menu>label {
    display: flex;
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 0px;
    align-items: center;
    margin: 3px 0px;
}

.CFBetter_setting_menu_label_text {
    display: flex;
    border: 1px dashed #00aeeccc;
    height: 20px;
    width: 100%;
    color: gray;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 2px;
    padding: 7px;
    align-items: center;
}

input[type="radio"]:checked+.CFBetter_setting_menu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    font-weight: 500;
}

#CFBetter_setting_menu>label input[type="radio"] {
    -webkit-appearance: none;
    appearance: none;
    list-style: none;
    padding: 0px !important;
    margin: 0px;
}

#CFBetter_setting_menu input[type="text"] {
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

.CFBetter_setting_menu_input {
    width: 100%;
    display: grid;
    margin-top: 5px;
}

#CFBetter_setting_menu #save {
    cursor: pointer;
	display: inline-flex;
	padding: 0.5rem 1rem;
	background-color: #1aa06d;
	color: #ffffff;
	font-size: 1rem;
	line-height: 1.5rem;
	font-weight: 500;
	justify-content: center;
	width: 100%;
	border-radius: 0.375rem;
	border: none;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
#CFBetter_setting_menu button#debug_button.debug_button {
    width: 18%;
}

#CFBetter_setting_menu span.tip {
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
    display: flex;
    cursor: help;
    width: 15px;
    color: rgb(255, 153, 0);
    margin-left: 5px;
}
#CFBetter_setting_menu .CFBetter_setting_menu_label_text .help_tip .help-icon {
    color: #7fbeb2;
}
.help_tip .help-icon:hover + .tip_text, .help_tip .tip_text:hover {
    display: block;
    cursor: help;
    width: 250px;
}

/*设置面板-展开*/
#is_showOpneAiAdvanced{
    width: 100%;
    background-color: aliceblue;
    padding: 8px;
    box-sizing: border-box;
    border-radius: 10px;
}
/*确认弹窗*/
.wordsExceeded {
    z-index: 9999;
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
	font-size: 1rem;
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
        url: "https://greasyfork.org/zh-CN/scripts/465777.json",
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

// 汉化替换
(function () {
    if (!bottomZh_CN) return;
    // 设置语言为zh
    var htmlTag = document.getElementsByTagName("html")[0];
    htmlTag.setAttribute("lang", "zh-CN");

    // 文本节点遍历替换
    $(document).ready(function () {
        function traverseTextNodes(node, rules) {
            if (!node) return;
            if (node.nodeType === Node.TEXT_NODE) {
                rules.forEach(rule => {
                    const regex = new RegExp(rule.match, 'g');
                    node.textContent = node.textContent.replace(regex, rule.replace);
                });
            } else {
                $(node).contents().each((_, child) => traverseTextNodes(child, rules));
            }
        }

        const rules1 = [
            { match: 'Virtual participation', replace: '参加虚拟重现赛' },
            { match: 'Enter', replace: '进入' },
            { match: 'Current standings', replace: '当前榜单' },
            { match: 'Final standings', replace: '最终榜单' },
            { match: 'Preliminary results', replace: '初步结果' },
            { match: 'open hacking:', replace: '公开黑客攻击中（即尝试提交数据加强，对已通过的代码重测）' },
            { match: 'School/University/City/Region Championship', replace: '学校/大学/城市/区域比赛' },
            { match: 'Official School Contest', replace: '学校官方比赛' },
            { match: 'Training Contest', replace: '训练赛' },
            { match: 'Training Camp Contest', replace: '训练营比赛' },
            { match: 'Official ICPC Contest', replace: 'ICPC官方比赛' },
            { match: 'Official International Personal Contest', replace: '官方国际个人赛' },
            { match: 'China', replace: '中国' },
            { match: 'Statements', replace: '题目描述' },
            { match: 'in Chinese', replace: '中文' },
            { match: 'Trainings', replace: '训练' },
            { match: 'Prepared by', replace: '编写人' },
            { match: 'Current or upcoming contests', replace: '当前或即将举行的比赛' },
            { match: 'Past contests', replace: '过去的比赛' },
            { match: 'Exclusions', replace: '排除' },
            { match: 'Before start', replace: '距比赛开始还有' },
            { match: 'Before registration', replace: '距报名开始还有' },
            { match: 'Until closing ', replace: '距报名结束还有' },
            { match: 'Before extra registration', replace: '额外报名还未开始' },
            { match: 'Register', replace: '报名' },
            { match: 'Registration completed', replace: '已报名' },
            { match: 'Registration closed', replace: '报名已结束' },
            { match: 'Problems', replace: '问题集' },
            { match: 'Questions about problems', replace: '关于问题的提问' },
            { match: 'Contest status', replace: '比赛状态' },
        ];
        traverseTextNodes($('.datatable'), rules1);

        const rules2 = [
            { match: 'Home', replace: '主页' },
            { match: 'Top', replace: '热门' },
            { match: 'Catalog', replace: '指南目录' },
            { match: 'Contests', replace: '比赛' },
            { match: 'Gym', replace: '训练营' },
            { match: 'Problemset', replace: '题单' },
            { match: 'Groups', replace: '团体' },
            { match: 'Rating', replace: 'Rating(评级)排行榜' },
            { match: 'Edu', replace: '培训' },
            { match: 'Calendar', replace: '日历' },
            { match: 'Help', replace: '帮助' }
        ];
        traverseTextNodes($('.menu-list.main-menu-list'), rules2);

        const rules3 = [
            { match: 'Settings', replace: '设置' },
            { match: 'Blog', replace: '博客' },
            { match: 'Teams', replace: '队伍' },
            { match: 'Submissions', replace: '提交' },
            { match: 'Favourites', replace: '收藏' },
            { match: 'Talks', replace: '私信' },
            { match: 'Contests', replace: '比赛' },
        ];
        traverseTextNodes($('.nav-links'), rules3);

        const rules4 = [
            { match: 'Before contest', replace: '即将进行的比赛' },
            { match: 'Contest is running', replace: '比赛进行中' },
        ];
        traverseTextNodes($('.contest-state-phase'), rules4);

        const rules5 = [
            { match: 'has extra registration', replace: '有额外的报名时期' },
            { match: 'If you are late to register in 5 minutes before the start, you can register later during the extra registration. Extra registration opens 10 minutes after the contest starts and lasts 25 minutes.', replace: '如果您在比赛开始前5分钟前还未报名，您可以在额外的报名期间稍后报名。额外的报名将在比赛开始后10分钟开放，并持续25分钟。' },
        ];
        traverseTextNodes($('.notice'), rules5);

        const rules6 = [
            { match: 'Contribution', replace: '贡献' },
        ];
        traverseTextNodes($('.propertyLinks'), rules6);

        const rules7 = [
            { match: 'Contest history', replace: '比赛历史' },
        ];
        traverseTextNodes($('.contests-table'), rules7);

        const rules8 = [
            { match: 'Register now', replace: '现在报名' },
            { match: 'No tag edit access', replace: '没有标签编辑权限' },
            { match: 'Language:', replace: '语言:' },
            { match: 'Choose file:', replace: '选择文件:' },
        ];
        traverseTextNodes($('.roundbox.sidebox.borderTopRound '), rules8);

        const rules9 = [
            { match: 'Add to exclusions', replace: '添加到排除列表' },
        ];
        traverseTextNodes($('.icon-eye-close.icon-large'), rules9);

        const rules10 = [
            { match: 'Add to exclusions for gym contests filter', replace: '添加训练营过滤器的排除项' },
        ];
        traverseTextNodes($("._ContestFilterExclusionsManageFrame_addExclusionLink"), rules10);

        const rules11 = [
            { match: 'Announcement', replace: '公告' },
            { match: 'Statements', replace: '统计报表' },
            { match: 'Tutorial', replace: '题解' },
        ];
        traverseTextNodes($('.roundbox.sidebox.sidebar-menu.borderTopRound '), rules11);

        const rules12 = [
            { match: 'Problems', replace: '问题' },
            { match: 'Submit Code', replace: '提交代码' },
            { match: 'My Submissions', replace: '我的提交' },
            { match: 'Status', replace: '状态' },
            { match: 'Standings', replace: '榜单' },
            { match: 'Custom Invocation', replace: '自定义调试' },
            { match: 'Common standings', replace: '全部排行' },
            { match: 'Friends standings', replace: '只看朋友' },
            { match: 'Submit', replace: '提交' },
            { match: 'Hacks', replace: '黑客' },
            { match: 'Room', replace: '房间' },
            { match: 'Custom test', replace: '自定义测试' },
            { match: 'Blog', replace: '博客' },
            { match: 'Teams', replace: '队伍' },
            { match: 'Submissions', replace: '提交记录' },
            { match: 'Groups', replace: '团体' },
            { match: 'Favourites', replace: '收藏' },
            { match: 'Contests', replace: '比赛' },
            { match: 'Members', replace: '成员' },
            { match: '问题etting', replace: '参与编写的问题' },
            { match: 'Streams', replace: '直播' },
            { match: 'Gym', replace: '训练营' },
            { match: 'Mashups', replace: '组合混搭' },
            { match: 'Posts', replace: '帖子' },
            { match: 'Comments', replace: '回复' },
            { match: 'Main', replace: '主要的' },
            { match: 'Settings', replace: '设置' },
            { match: 'Lists', replace: '列表' },
            { match: 'General', replace: '基本' },
            { match: 'Sidebar', replace: '侧边栏' },
            { match: 'Social', replace: '社会信息' },
            { match: 'Address', replace: '地址' },
            { match: 'Wallets', replace: '钱包' },
        ];
        traverseTextNodes($('.second-level-menu'), rules12);
        if (is_mSite) {
            traverseTextNodes($('nav'), rules12);
        }

        const rules13 = [
            { match: 'Expand', replace: '展开' }
        ];
        traverseTextNodes($('.topic-toggle-collapse'), rules13);

        const rules14 = [
            { match: 'Full text and comments', replace: '阅读全文/评论' }
        ];
        traverseTextNodes($('.topic-read-more'), rules14);

        const rules15 = [
            { match: 'Switch off editor', replace: '关闭编辑器语法高亮' }
        ];
        traverseTextNodes($('.toggleEditorCheckboxLabel'), rules15);

        const rules16 = [
            { match: 'Registration for the contest', replace: '比赛报名' }
        ];
        traverseTextNodes($('.submit'), rules16);

        const rules17 = [
            { match: 'Difficulty:', replace: '难度:' },
        ];
        traverseTextNodes($('._FilterByTagsFrame_difficulty'), rules17);

        const rules18 = [
            { match: 'Add tag', replace: '添加标签' }
        ];
        traverseTextNodes($('._FilterByTagsFrame_addTagLink'), rules18);

        const rules19 = [
            { match: 'Rating changes for last rounds are temporarily rolled back. They will be returned soon.', replace: '上一轮的评级变化暂时回滚。它们将很快恢复。' },
            { match: 'Reminder: in case of any technical issues, you can use the lightweight website', replace: '提醒：如果出现任何技术问题，您可以使用轻量网站' }
        ];
        traverseTextNodes($('.alert'), rules19);

        const rules20 = [
            { match: 'Enter', replace: '登录' },
            { match: 'Register', replace: '注册' },
            { match: 'Contest rating', replace: '测试 rating' },
            { match: 'Logout', replace: '退出登录' }
        ];
        traverseTextNodes($('.lang-chooser'), rules20);

        const rules21 = [
            { match: 'Change photo', replace: '更换图片' },
            { match: 'Contest rating', replace: '比赛Rating' },
            { match: 'Contribution', replace: '贡献' },
            { match: 'My friends', replace: '我的好友' },
            { match: 'Change settings', replace: '改变设置' },
            { match: 'Last visit', replace: '最后访问' },
            { match: 'Registered', replace: '注册于' },
            { match: 'Blog entries', replace: '博客条目' },
            { match: 'comments', replace: '评论' },
            { match: 'Write new entry', replace: '编写新条目' },
            { match: 'View my talks', replace: '查看我的私信' },
            { match: 'Talks', replace: '私信' },
            { match: 'Send message', replace: '发送消息' },
        ];
        traverseTextNodes($('.userbox'), rules21);

        const rules22 = [
            { match: 'Reset', replace: '重置' },
        ];
        traverseTextNodes($('#vote-reset-filterDifficultyLowerBorder'), rules22);
        traverseTextNodes($('#vote-reset-filterDifficultyUpperBorder'), rules22);

        const rules23 = [
            { match: 'The problem statement has recently been changed.', replace: '题目描述最近已被更改。\n（说明：如果是进入该页面后立即显示的，这通常是Codeforces Better!插入翻译按钮导致的）' },
            { match: 'View the changes.', replace: '查看更改' },
        ];
        traverseTextNodes($('.alert.alert-info'), rules23);

        const rules24 = [
            { match: 'Fill in the form to login into Codeforces.', replace: '填写表单以登录到Codeforces。' },
            { match: 'You can use', replace: '你也可以使用' },
            { match: 'as an alternative way to enter.', replace: '登录' },
        ];
        traverseTextNodes($('.enterPage'), rules24);

        const rules25 = [
            { match: '\\* To view the complete list, click ', replace: '* 要查看完整列表，请点击' },
        ];
        traverseTextNodes($('.notice.small'), rules25);

    });
    // 元素选择替换
    // 侧栏titled汉化
    (function () {
        var translations = {
            "Pay attention": "→ 注意",
            "Top rated": "→ 评级排行",
            "Top contributors": "→ 贡献者排行",
            "Find user": "→ 查找用户",
            "Recent actions": "→ 最新动态",
            "Training filter": "→ 过滤筛选",
            "Find training": "→ 搜索比赛/问题",
            "Virtual participation": "→ 什么是虚拟参赛",
            "Contest materials": "→ 比赛相关资料",
            "Settings": "→ 设置",
            "Create Mashup Contest": "→ 克隆比赛到组合混搭",
            "Create Mashup Contest": "→ 创建混搭比赛",
            "Submit": "→ 提交",
            "Practice": "→ 练习",
            "Problem tags": "→ 问题标签",
            "Filter Problems": "→ 过滤问题",
            "Attention": "→ 注意",
            "About Contest": "→ 关于比赛",
            "Last submissions": "→ 提交历史",
            "Streams": "→ 直播",
            "Coach rights": "→ 教练权限",
            "Advices to fill address": "→ 填写地址的建议",
            "Hacks filter": "→ 黑客过滤器",
            "Score table": "→ 评分表",
            "Contests": "→ 比赛",
            "History": "→ 编辑历史",
            "Login into Codeforces": "登录 Codeforces",
        };

        $(".caption.titled").each(function () {
            var tag = $(this).text();
            for (var property in translations) {
                if (tag.match(property)) {
                    $(this).addClass(property);
                    $(this).text(translations[property]);
                    break;
                }
            }
        });
    })();
    // 题目Tag汉化
    (function () {
        var parentElement = $('._FilterByTagsFrame_addTagLabel');
        var selectElement = parentElement.find('select');
        var translations = {
            "*combine tags by OR": "*按逻辑或组合我选择的标签",
            "combine-tags-by-or": "*按逻辑或组合我选择的标签（combine-tags-by-or）",
            "2-sat": "二分图可满足性问题（2-sat）",
            "binary search": "二分搜索（binary search）",
            "bitmasks": "位掩码（bitmasks）",
            "brute force": "暴力枚举（brute force）",
            "chinese remainder theorem": "中国剩余定理（chinese remainder theorem）",
            "combinatorics": "组合数学（combinatorics）",
            "constructive algorithms": "构造算法（constructive algorithms）",
            "data structures": "数据结构（data structures）",
            "dfs and similar": "深度优先搜索及其变种（dfs and similar）",
            "divide and conquer": "分治算法（divide and conquer）",
            "dp": "动态规划（dp）",
            "dsu": "并查集（dsu）",
            "expression parsing": "表达式解析（expression parsing）",
            "fft": "快速傅里叶变换（fft）",
            "flows": "流（flows）",
            "games": "博弈论（games）",
            "geometry": "计算几何（geometry）",
            "graph matchings": "图匹配（graph matchings）",
            "graphs": "图论（graphs）",
            "greedy": "贪心策略（greedy）",
            "hashing": "哈希表（hashing）",
            "implementation": "实现问题，编程技巧，模拟（implementation）",
            "interactive": "交互性问题（interactive）",
            "math": "数学（math）",
            "matrices": "矩阵（matrices）",
            "meet-in-the-middle": "meet-in-the-middle算法（meet-in-the-middle）",
            "number theory": "数论（number theory）",
            "probabilities": "概率论（probabilities）",
            "schedules": "调度算法（schedules）",
            "shortest paths": "最短路算法（shortest paths）",
            "sortings": "排序算法（sortings）",
            "string suffix structures": "字符串后缀结构（string suffix structures）",
            "strings": "字符串处理（strings）",
            "ternary search": "三分搜索（ternary search）",
            "trees": "树形结构（trees）",
            "two pointers": "双指针算法（two pointers）"
        };
        selectElement.find("option").each(function () {
            var optionValue = $(this).val();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
        $("._FilterByTagsFrame_tagBoxCaption").each(function () {
            var tag = $(this).text();
            if (tag in translations) {
                $(this).text(translations[tag]);
            }
        });
        $(".notice").each(function () {
            var tag = $(this).text();
            if (tag in translations) {
                $(this).text(translations[tag]);
            }
        });
        $(".tag-box").each(function () {
            var tag = $(this).text();
            for (var property in translations) {
                property = property.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
                if (tag.match(property)) {
                    $(this).text(translations[property]);
                    break;
                }
            }
        });
    })();
    // 题目过滤器选项汉化
    (function () {
        var parentElement = $('#gym-filter-form');
        var selectElement = parentElement.find('div');
        var translations = {
            "Contest type:": "比赛类型:",
            "ICPC region:": "ICPC地区:",
            "Contest format:": "比赛形式:",
            "Order by:": "排序方式:",
            "Secondary order by:": "次要排序方式:",
            "Hide, if participated:": "隐藏我参加过的:",
        };
        selectElement.find("label").each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
        translations = {
            "Season:": "时间范围（年度）",
            "Duration, hours:": "持续时间（小时）:",
            "Difficulty:": "难度:"
        };
        selectElement.each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
    })();
    (function () {
        var parentElement = $('.setting-value');
        var selectElement = parentElement.find('select');
        var translations = {
            "Official ACM-ICPC Contest": "ICPC官方比赛",
            "Official School Contest": "学校官方比赛",
            "Opencup Contest": "Opencup比赛",
            "School/University/City/Region Championship": "学校/大学/城市/地区锦标赛",
            "Training Camp Contest": "训练营比赛",
            "Official International Personal Contest": "官方国际个人赛",
            "Training Contest": "训练比赛",
            "ID_ASC": "创建时间（升序）",
            "ID_DESC": "创建时间（降序）",
            "RATING_ASC": "评分（升序）",
            "RATING_DESC": "评分（降序）",
            "DIFFICULTY_ASC": "难度（升序）",
            "DIFFICULTY_DESC": "难度（降序）",
            "START_TIME_ASC": "开始时间（升序）",
            "START_TIME_DESC": "开始时间（降序）",
            "DURATION_ASC": "持续时间（升序）",
            "DURATION_DESC": "持续时间（降序）",
            "POPULARITY_ASC": "热度（升序）",
            "POPULARITY_DESC": "热度（降序）",
            "UPDATE_TIME_ASC": "更新时间（升序）",
            "UPDATE_TIME_DESC": "更新时间（降序）"
        };
        selectElement.find("option").each(function () {
            var optionValue = $(this).val();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
        parentElement = $('.setting-last-value');
        selectElement = parentElement.find('select');
        selectElement.find("option").each(function () {
            var optionValue = $(this).val();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
    })();
    // 右侧sidebox通用汉化
    (function () {
        var parentElement = $('.sidebox');
        var selectElement = parentElement.find('div');
        var translations = {
            "Show tags for unsolved problems": "显示未解决问题的标签",
            "Hide solved problems": "隐藏已解决的问题",
        };
        selectElement.find("label").each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
    })();
    // 表单字段名汉化
    (function () {
        var translations = {
            "Problem:": "题目:",
            "Language:": "语言:",
            "Source code:": "源代码:",
            "Or choose file:": "或者选择文件:",
            "Choose file:": "选择文件:",
            "Notice:": "注意:",
            "virtual participation:": "虚拟参与:",
            "Registration for the contest:": "比赛报名:",
            "Take part:": "参与:",
            "as individual participant:": "作为个人参与者:",
            "as a team member:": "作为团队成员:",
            "Virtual start time:": "虚拟开始时间:",
            "Complete problemset:": "完整的问题集:",
            "First name (English)": "名字（英文）",
            "Last name (English)": "姓氏（英文）",
            "First name (Native)": "名字（本地语言）",
            "Last name (Native)": "姓氏（本地语言）",
            "Birth date": "出生日期",
            "Country": "国家",
            "City": "城市",
            "Organization": "组织",
            "Handle/Email": "账号/邮箱",
            "Password": "密码",
        };
        $(".field-name").each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
    })();
    (function () {
        var translations = {
            "Terms of agreement:": "协议条款:",
            "Choose team:": "选择团队:"
        };
        $(".field-name label").each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
    })();
    (function () {
        var translations = {
            "Hide sidebar block \"Find user\"": "隐藏侧边栏块“查找用户”",
            "Hide sidebar block \"Current user\"": "隐藏侧边栏块“当前用户”",
            "Hide sidebar block \"Recent аctions\"": "隐藏侧边栏块“最新动态”",
            "Hide sidebar block \"Favourite groups\"": "隐藏侧边栏块“收藏组”",
            "Hide sidebar block \"Top contributors\"": "隐藏侧边栏块“贡献者排行”",
            "Hide sidebar block \"Top rated\"": "隐藏侧边栏块“评级排行”",
            "Hide sidebar block \"Streams\"": "隐藏侧边栏块“直播”",
            "Old password": "旧密码",
            "New password": "新密码",
            "Confirm new password": "确认新密码",
            "Contest email notification": "比赛邮件通知",
            "Send email on new user talk": "在有新用户对话时发送电子邮件",
            "Send email on new comment": "在有新评论时发送电子邮件",
            "Hide contact information": "隐藏联系人信息",
            "Remember me by Gmail, Facebook and etc": "通过 Gmail、Facebook 等记住我",
            "Show tags for unsolved problems": "显示未解决问题的标签",
            "Hide solved problems from problemset": "从问题集中隐藏已解决的问题",
            "Hide low rated blogs": "隐藏评级较低的博客",
            "Offer to publish great rating rises": "提供展示Rating显著提升的机会",
            "Enforce https": "强制 HTTPS",
            "Show private activity in the profile": "在个人资料中显示私人活动",
            "Show diagnostics": "显示诊断信息"
        };
        $(".field-name").each(function () {
            var tag = $(this).text();
            for (var property in translations) {
                property = property.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
                if (tag.match(property)) {
                    $(this).text(translations[property]);
                    break;
                }
            }
        });
    })();
    (function () {
        var translations = {
            "Postal/zip code": "邮政编码/邮编",
            "Country (English)": "国家（英文）",
            "State (English)": "州/省份（英文）",
            "City (English)": "城市（英文）",
            "Address (English)": "地址（英文）",
            "Recipient (English)": "收件人姓名（英文）",
            "Country (Native)": "国家（本地语言）",
            "State (Native)": "州/省份（本地语言）",
            "City (Native)": "城市（本地语言）",
            "Address (Native)": "地址（本地语言）",
            "Recipient (Native)": "收件人姓名（本地语言）",
            "Phone": "电话",
            "TON Wallet:": "TON 钱包:",
            "Secret Code:": "验证码:"
        };
        $("td.field-name label").each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
    })();

    // 按钮汉化input[type="submit"]
    (function () {
        var translations = {
            "Register for virtual participation": "报名虚拟参赛",
            "Register for practice": "登录以开始练习",
            "Apply": "应用",
            "Register": "报名",
            "Login": "登录",
            "Run": "运行",
            "Start virtual contest": "开始虚拟参赛",
            "Clone Contest": "克隆比赛",
            "Submit": "提交",
            "Save changes": "保存设置",
            "Filter": "过滤",
            "Find": "查找",
            "Create Mashup Contest": "创建混搭比赛"
        };
        $('input[type="submit"]').each(function () {
            var optionValue = $(this).val();
            if (translations[optionValue]) {
                $(this).val(translations[optionValue]);
            }
        });
    })();
    (function () {
        var translations = {
            "Reset": "重置",
        };
        $('input[type="button"]').each(function () {
            var optionValue = $(this).val();
            if (translations[optionValue]) {
                $(this).val(translations[optionValue]);
            }
        });
    })();

    // 选项汉化input[type="radio"]
    (function () {
        var translations = {
            "as individual participant": "个人",
            "as a team member": "作为一个团队成员",
        };
        $('input[type="radio"]').each(function () {
            var tag = $(this).parent().contents().filter(function () {
                return this.nodeType === Node.TEXT_NODE;
            });
            for (var i = 0; i < tag.length; i++) {
                var text = tag[i].textContent.trim();
                if (translations.hasOwnProperty(text)) {
                    $(this).addClass(text);
                    tag[i].replaceWith(translations[text]);
                    break;
                }
            }
        });
    })();


    // 杂项
    (function () {
        var translations = {
            "(standard input\/output)": "标准输入/输出",
        };
        $("div.notice").each(function () {
            var tag = $(this).children().eq(0).text();
            for (var property in translations) {
                if (tag.match(property)) {
                    $(this).children().eq(0).text(translations[property]);
                    break;
                }
            }
        });
    })();
    (function () {
        var translations = {
            "Ask a question": "提一个问题",
        };
        $(".ask-question-link").each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
    })();

    // 轻量站特殊
    if (is_mSite) {
        (function () {
            var translations = {
                "Announcements": "公告",
                "Submissions": "提交记录",
                "Contests": "比赛",
            };
            $(".caption").each(function () {
                var optionValue = $(this).text();
                if (translations[optionValue]) {
                    $(this).text(translations[optionValue]);
                }
            });
        })();
    }
})();

// 设置面板
$("div[class='lang-chooser']").each(function () {
    $(this).before(
        "<button class='html2mdButton CFBetter_setting'>CodeforcesBetter设置</button>"
    );
});
$("div[class='enter-or-register-box']").each(function () {
    $(this).after(
        "<button class='html2mdButton CFBetter_setting'>CodeforcesBetter设置</button>"
    );
});
$(document).ready(function () {
    const $settingBtns = $(".CFBetter_setting");
    $settingBtns.click(() => {
        const styleElement = GM_addStyle(darkenPageStyle);
        $settingBtns.prop("disabled", true).addClass("open")
        $("body").append(`
            <div id='CFBetter_setting_menu'>
                <div class="tool-box">
                    <button class="btn-close">×</button>
                </div>
                <h3>基本设置</h3>
                <hr>
                <div class='CFBetter_setting_list'>
                    <label for="bottomZh_CN">界面汉化</label>
                    <input type="checkbox" id="bottomZh_CN" name="bottomZh_CN">
                </div>
                <div class='CFBetter_setting_list'>
                  <label for="showLoading">显示加载提示信息</label>
                  <div class="help_tip">
                      `+ helpCircleHTML + `
                      <div class="tip_text">
                      <p>当你开启 显示加载信息 时，每次加载页面时会在上方显示加载信息提示：“Codeforces Better! —— xxx”</p>
                      <p>这用于了解脚本当前的工作情况，<strong>如果你不想看到，可以选择关闭</strong></p>
                      <p><u>需要说明的是，如果你需要反馈脚本的任何加载问题，请开启该选项后再截图，以便于分析问题</u></p>
                      </div>
                  </div>
                  <input type="checkbox" id="showLoading" name="showLoading">
                </div>
                <div class='CFBetter_setting_list'>
                  <label for="showLoading">显示目标区域范围</label>
                  <div class="help_tip">
                      `+ helpCircleHTML + `
                      <div class="tip_text">
                      <p>开启后当鼠标悬浮在 MD视图/复制/翻译 按钮上时，会显示其目标区域的范围</p>
                      </div>
                  </div>
                  <input type="checkbox" id="hoverTargetAreaDisplay" name="hoverTargetAreaDisplay">
                </div>
                <div class='CFBetter_setting_list'>
                    <label for="expandFoldingblocks">自动展开折叠块</label>
                    <input type="checkbox" id="expandFoldingblocks" name="expandFoldingblocks">
                </div>
                <div class='CFBetter_setting_list'>
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
                <div class='CFBetter_setting_list'>
                    <label for="showJumpToLuogu">显示跳转到洛谷</label>
                    <div class="help_tip">
                        `+ helpCircleHTML + `
                        <div class="tip_text">
                        <p>洛谷OJ上收录了Codeforces的部分题目，一些题目有翻译和题解</p>
                        <p>开启显示后，如果当前题目被收录，则会在题目的右上角显示洛谷标志，</p>
                        <p>点击即可一键跳转到该题洛谷的对应页面。</strong></p>
                        </div>
                    </div>
                    <input type="checkbox" id="showJumpToLuogu" name="showJumpToLuogu">
                </div>
                <div class='CFBetter_setting_list'>
                    <label for="loaded"><span style="font-size: 14px;">兼容选项-不等待页面资源加载</span></label>
                    <div class="help_tip">
                        `+ helpCircleHTML + `
                        <div class="tip_text">
                        <p>为了防止在页面资源未加载完成前（主要是各种js）执行脚本产生意外的错误，脚本默认会等待 window.onload 事件</p>
                        <p>如果您的页面上方的加载信息始终停留在：“等待页面资源加载”，即使页面已经完成加载</p>
                        <p><u>您首先应该确认是否是网络问题，</u></p>
                        <p>如果不是，那这可能是由于 window.onload 事件在您的浏览器中触发过早（早于document.ready），</p>
                        <p>您可以尝试开启该选项来不再等待 window.onload 事件</p>
                        <p><u>注意：如果没有上述问题，请不要开启该选项</u></p>
                        </div>
                    </div>
                    <input type="checkbox" id="loaded" name="loaded">
                </div>
                <h3>翻译设置</h3>
                <hr>
                <label>
                    <input type='radio' name='translation' value='deepl'>
                    <span class='CFBetter_setting_menu_label_text'>deepl翻译</span>
                </label>
                <label>
                    <input type='radio' name='translation' value='youdao'>
                    <span class='CFBetter_setting_menu_label_text'>有道翻译</span>
                </label>
                <label>
                    <input type='radio' name='translation' value='google'>
                    <span class='CFBetter_setting_menu_label_text'>Google翻译</span>
                </label>
                <label>
                    <input type='radio' name='translation' value='openai'>
                    <span class='CFBetter_setting_menu_label_text'>使用ChatGPT翻译(API)
                        <div class="help_tip">
                            `+ helpCircleHTML + `
                            <div class="tip_text">
                            <p><b>请确保你能够正常访问OpenAI的api</b></p>
                            <p>Codeforces Better!使用 gpt-3.5-turbo 模型进行翻译，脚本的所有请求均在本地完成</p>
                            <p>你需要输入自己的OpenAI KEY，<a target="_blank" href="https://platform.openai.com/account/usage">官网</a></p>
                            </div>
                        </div>
                    </span>
                </label>
                <label>
                    <input type='radio' name='translation' value='api2d'>
                    <span class='CFBetter_setting_menu_label_text'>使用api2d翻译(API)
                        <div class="help_tip">
                            `+ helpCircleHTML + `
                            <div class="tip_text">
                            <p>api2d是国内的一家提供代理直连访问OpenAI的api的服务商，相当于OpenAI的api的套壳</p>
                            <p>Codeforces Better!使用 gpt-3.5-turbo 模型进行翻译，脚本的所有请求均在本地完成</p>
                            <p>你需要输入自己的api2d KEY，<a target="_blank" href="https://api2d.com/profile">官网</a></p>
                            </div>
                        </div>
                    </span>
                </label>
                <div class='CFBetter_setting_menu_input' id='openai' style='display: none;'>
                    <label for='openai_key'>KEY:</label><input type='text' id='openai_key'>
                    <div class='CFBetter_setting_list'>
                        <label for="showOpneAiAdvanced">使用代理API</label>
                        <div class="help_tip">
                            `+ helpCircleHTML + `
                            <div class="tip_text">
                            <p>使用你指定的API来代理访问 gpt-3.5-turbo 模型进行翻译，脚本的所有请求均在本地完成</p>
                            <p>如果你使用的是OpenAI的官方KEY，建议你自建代理，而不是使用他人公开的代理，那是危险的</p>
                            <p><strong>由于你指定了自定义的API，Tampermonkey会对你的跨域请求进行警告，请自行授权</strong></p>
                            </div>
                        </div>
                        <input type="checkbox" id="showOpneAiAdvanced" name="showOpneAiAdvanced">
                    </div>
                    <div id="is_showOpneAiAdvanced">
                        <label for='openai_proxy'>Proxy API:</label><input type='text' id='openai_proxy'>
                    </div>
                </div>
                <div class='CFBetter_setting_menu_input' id='api2d' style='display: none;'>
                    <label for='api2d_key'>KEY:</label><input type='text' id='api2d_key'>
                    <div class='CFBetter_setting_list'>
                        <label for="x_api2d_no_cache">使用缓存</label>
                        <div class="help_tip">
                            `+ helpCircleHTML + `
                            <div class="tip_text">
                            <p>API2D 的服务器会对请求结果做缓存，如果请求体的hash值相同，会直接返回缓存的结果。缓存命中之后，本次请求不会扣除任何点数。</p>
                            <p>缓存会保存 24 小时，如果不想使用缓存，你可以关闭“使用缓存”来跳过缓存，强制 API2D 服务器发送新请求。<a target="_blank" href="https://api2d.com/wiki/doc">详请阅读官方文档</a></p>
                            </div>
                        </div>
                        <input type="checkbox" id="x_api2d_no_cache" name="x_api2d_no_cache">
                    </div>
                </div>
                <br>
                <button id='save'>保存</button>
            </div>
        `);
        $("#bottomZh_CN").prop("checked", GM_getValue("bottomZh_CN") === true);
        $("#showLoading").prop("checked", GM_getValue("showLoading") === true);
        $("#expandFoldingblocks").prop("checked", GM_getValue("expandFoldingblocks") === true);
        $("#enableSegmentedTranslation").prop("checked", GM_getValue("enableSegmentedTranslation") === true);
        $("#showJumpToLuogu").prop("checked", GM_getValue("showJumpToLuogu") === true);
        $("#loaded").prop("checked", GM_getValue("loaded") === true);
        $("#x_api2d_no_cache").prop("checked", GM_getValue("x_api2d_no_cache") === true);
        $("#showOpneAiAdvanced").prop("checked", GM_getValue("showOpneAiAdvanced") === true);
        $("#hoverTargetAreaDisplay").prop("checked", GM_getValue("hoverTargetAreaDisplay") === true);
        $("input[name='translation'][value='" + translation + "']").prop("checked", true);
        $("input[name='translation']").css("color", "gray");
        if (translation == "openai") {
            $("#openai").show();
            $("#openai_key").val(GM_getValue("openai_key"));
            $("#openai_proxy").val(GM_getValue("openai_proxy"));
            $("#openai_key").css("color", "gray");
        } else if (translation == "api2d") {
            $("#api2d").show();
            $("#api2d_key").val(GM_getValue("api2d_key"));
            $("#api2d_key").css("color", "gray");
        }
        // 当单选框被选中时，显示对应的输入框，同时隐藏其他输入框
        $("input[name='translation']").change(function () {
            var selected = $(this).val(); // 获取当前选中的值
            if (selected === "openai") {
                $("#openai").show();
                $("#openai_key").val(GM_getValue("openai_key"));
                $("#showOpneAiAdvanced").prop("checked", showOpneAiAdvanced);
                if (showOpneAiAdvanced) {
                    $("#is_showOpneAiAdvanced").show();
                    $("#openai_proxy").val(GM_getValue("openai_proxy"));
                }
                else $("#is_showOpneAiAdvanced").hide();
                $("#api2d").hide();
            } else if (selected === "api2d") {
                $("#api2d").show();
                $("#api2d_key").val(GM_getValue("api2d_key"));
                $("#x_api2d_no_cache").prop("checked", GM_getValue("x_api2d_no_cache"));
                $("#openai").hide();
            } else {
                $("#openai, #api2d").hide();
            }
        });

        // ChatGPT高级选项
        $("input[name='showOpneAiAdvanced']").change(function () {
            var isChecked = $(this).is(":checked");
            if (isChecked) {
                $("#is_showOpneAiAdvanced").show();
            } else {
                $("#is_showOpneAiAdvanced").hide();
            }
        });

        const $settingMenu = $("#CFBetter_setting_menu");

        $("#save").click(function () {
            GM_setValue("bottomZh_CN", $("#bottomZh_CN").prop("checked"));
            GM_setValue("showLoading", $("#showLoading").prop("checked"));
            GM_setValue("loaded", $("#loaded").prop("checked"));
            GM_setValue("expandFoldingblocks", $("#expandFoldingblocks").prop("checked"));
            GM_setValue("enableSegmentedTranslation", $("#enableSegmentedTranslation").prop("checked"));
            GM_setValue("showJumpToLuogu", $("#showJumpToLuogu").prop("checked"));
            GM_setValue("showOpneAiAdvanced", $("#showOpneAiAdvanced").prop("checked"));
            GM_setValue("hoverTargetAreaDisplay", $("#hoverTargetAreaDisplay").prop("checked"));
            var translation = $("input[name='translation']:checked").val();
            var openai_key = $("#openai_key").val();
            var openai_proxy = $("#openai_proxy").val();
            var api2d_key = $("#api2d_key").val();
            GM_setValue("translation", translation);
            if (translation == "openai") {
                GM_setValue("openai_key", openai_key);
                GM_setValue("openai_proxy", openai_proxy);
            } else if (translation == "api2d") {
                GM_setValue("api2d_key", api2d_key);
                GM_setValue("x_api2d_no_cache", $("#x_api2d_no_cache").prop("checked"));
            }
            $settingMenu.remove();
            $(styleElement).remove();
            location.reload();
        });

        // 关闭
        $settingMenu.on("click", ".btn-close", () => {
            $settingMenu.remove();
            $settingBtns.prop("disabled", false).removeClass("open");
            $(styleElement).remove();
        });
    });
});

// 说明为旧的latex渲染
if (is_oldLatex) {
    var newElement = $("<div></div>").addClass("alert alert-warning").html(`
    注意：当前页面存在使用非 MathJax 库渲染为 HTML 的 Latex 公式（这通常是一道古老的题目），这导致 CodeforcesBetter! 无法将其还原回 Latex，因此当前页面部分功能不适用。
    <br>此外当前页面的翻译功能采用了特别的实现方式，因此可能会出现排版错位的情况。
    `).css({
        "margin": "1em",
        "text-align": "center",
        "position": "relative"
    });
    $(".menu-box:first").next().after(newElement);
}

// html2md转换/处理规则
var turndownService = new TurndownService({ bulletListMarker: '-' });
var turndown = turndownService.turndown;

// 保留原始
turndownService.keep(['del']);

// 丢弃
turndownService.addRule('remove-by-class', {
    filter: function (node) {
        return node.classList.contains('sample-tests') ||
            node.classList.contains('header') ||
            node.classList.contains('overlay') ||
            node.classList.contains('html2md-panel');
    },
    replacement: function (content, node) {
        return "";
    }
});
turndownService.addRule('remove-script', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "script" && node.type.startsWith("math/tex");
    },
    replacement: function (content, node) {
        return "";
    }
});

// inline math
turndownService.addRule('inline-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "MathJax";
    },
    replacement: function (content, node) {
        var latex = $(node).next().text();
        latex = latex.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return "$" + latex + "$";
    }
});

// block math
turndownService.addRule('block-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "div" && node.className == "MathJax_Display";
    },
    replacement: function (content, node) {
        var latex = $(node).next().text();
        latex = latex.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return "\n$$\n" + latex + "\n$$\n";
    }
});

// texFontStyle
turndownService.addRule('texFontStyle', {
    filter: function (node) {
        return (
            node.nodeName === 'SPAN' &&
            node.classList.contains('tex-font-style-bf')
        )
    },
    replacement: function (content) {
        return '**' + content + '**'
    }
})

// sectionTitle
turndownService.addRule('sectionTitle', {
    filter: function (node) {
        return (
            node.nodeName === 'DIV' &&
            node.classList.contains('section-title')
        )
    },
    replacement: function (content) {
        return '**' + content + '**'
    }
})

// bordertable
turndownService.addRule('bordertable', {
    filter: 'table',
    replacement: function (content, node) {
        if (node.classList.contains('bordertable')) {
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

// 题目markdown转换/翻译面板
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
    if (is_oldLatex) {
        $(".html2md-view" + suffix).css({
            "cursor": "not-allowed",
            "background-color": "#ffffff",
            "color": "#a8abb2",
            "border": "1px solid #e4e7ed"
        });
        $(".html2md-view" + suffix).prop("disabled", true);
    }
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

    if (hoverTargetAreaDisplay) {
        $(document).on("mouseover", ".html2md-view" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".html2md-view" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".html2md-view" + suffix).parent().parent().get(0);
            }

            $(target).append('<div class="overlay">目标转换区域</div>');
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
            $(target).css({
                "position": "",
                "display": ""
            });
            $(".html2md-view" + suffix).parent().css({
                "position": "static"
            })
        });
    }
}

function addButtonWithCopy(parent, suffix, type) {
    if (is_oldLatex) {
        $(".html2md-cb" + suffix).css({
            "cursor": "not-allowed",
            "background-color": "#ffffff",
            "color": "#a8abb2",
            "border": "1px solid #e4e7ed"
        });
        $(".html2md-cb" + suffix).prop("disabled", true);
    }
    $(document).on("click", ".html2md-cb" + suffix, function () {
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
    });

    if (hoverTargetAreaDisplay) {
        $(document).on("mouseover", ".html2md-cb" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".html2md-cb" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".html2md-cb" + suffix).parent().parent().get(0);
            }

            $(target).append('<div class="overlay">目标复制区域</div>');
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
            $(target).css({
                "position": "",
                "display": ""
            });
            $(".html2md-cb" + suffix).parent().css({
                "position": "static"
            })
        });
    }
}

async function addButtonWithTranslation(parent, suffix, type) {
    var result;
    $(document).on('click', '.translateButton' + suffix, async function () {
        $(this).removeClass("translated");
        $(this).text("翻译中");
        $(this).css("cursor", "not-allowed");
        var target, element_node, block, errerNum = 0, is_x_api2d_no_cache = false;
        if (type === "this_level") block = $(".translateButton" + suffix).parent().next();
        else if (type === "child_level") block = $(".translateButton" + suffix).parent().parent();

        // 重新翻译
        if (result) {
            if (result.translateDiv) {
                $(result.translateDiv).remove();
            }
            if (!is_oldLatex) {
                if (result.copyDiv) {
                    $(result.copyDiv).remove();
                }
                if (result.copyButton) {
                    $(result.copyButton).remove();
                }
            }
            // 重新翻译时暂时关闭 x_api2d_no_cache
            if (x_api2d_no_cache) {
                x_api2d_no_cache = false;
                is_x_api2d_no_cache = true;
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
                .removeClass("error");
        }

        // 恢复x_api2d_no_cache设置
        if (is_x_api2d_no_cache) x_api2d_no_cache = true;

        // 重新翻译
        let currentText;
        $(document).on("mouseover", ".translateButton" + suffix, function () {
            currentText = $(this).text();
            $(this).text("重新翻译");
        });

        $(document).on("mouseout", ".translateButton" + suffix, function () {
            $(this).text(currentText);
        });
    });

    // 目标区域指示
    function bindHoverEvents(suffix, type) {
        $(document).on("mouseover", ".translateButton" + suffix, function () {
            var target;

            if (type === "this_level") {
                target = $(".translateButton" + suffix).parent().next().get(0);
            } else if (type === "child_level") {
                target = $(".translateButton" + suffix).parent().parent().get(0);
            }

            $(target).append('<div class="overlay">目标翻译区域</div>');
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
            $(target).css({
                "position": "",
                "display": ""
            });
            $(".translateButton" + suffix).parent().css({
                "position": "static"
            });
        });
    }

    if (hoverTargetAreaDisplay) bindHoverEvents(suffix, type);
}

// 块处理
async function blockProcessing(target, element_node, button) {
    if (is_oldLatex) {
        $(target).find('.overlay').remove();
        target.markdown = $(target).html();
    } else if (!target.markdown) {
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
            .text("翻译出错");
        $(target).remove();
    }
    return result;
}

function addConversionButton() {
    // 题目页添加按钮
    if (window.location.href.includes("problem")) {
        var exContentsPageClasses = ["sample-tests",];
        $('.problem-statement').children('div').each(function () {
            var className = $(this).attr('class');
            if (!exContentsPageClasses.includes(className)) {
                var id = "_" + getRandomNumber(8);
                addButtonPanel(this, id, "this_level");
                addButtonWithHTML2MD(this, id, "this_level");
                addButtonWithCopy(this, id, "this_level");
                addButtonWithTranslation(this, id, "this_level");
            }
        });
    }
    // 添加按钮到ttypography部分
    $(".ttypography").each(function () {
        // 题目页特判
        if (!$(this).parent().hasClass('problemindexholder')) {
            let id = "_comment_" + getRandomNumber(8);
            addButtonPanel(this, id, "this_level");
            addButtonWithHTML2MD(this, id, "this_level");
            addButtonWithCopy(this, id, "this_level");
            addButtonWithTranslation(this, id, "this_level");
        }
    });

    // 添加按钮到spoiler部分
    $('.spoiler-content').each(function () {
        if ($(this).find('.html2md-panel').length === 0) {
            let id = "_spoiler_" + getRandomNumber(8);
            addButtonPanel(this, id, "child_level");
            addButtonWithHTML2MD(this, id, "child_level");
            addButtonWithCopy(this, id, "child_level");
            addButtonWithTranslation(this, id, "child_level");
        }
    });

    // 添加按钮到titled部分
    (function () {
        var elements = [".Virtual.participation", ".Attention", ".Practice"];//只为部分titled添加
        $.each(elements, function (index, value) {
            $(value).each(function () {
                let id = "_titled_" + getRandomNumber(8);
                var $nextDiv = $(this).next().children().get(0);
                addButtonPanel($nextDiv, id, "child_level", true);
                addButtonWithTranslation($nextDiv, id, "child_level");
            });
        });
    })();
    if (is_mSite) {
        $("div[class='_IndexPage_notice']").each(function () {
            let id = "_titled_" + getRandomNumber(8);
            addButtonPanel(this, id, "this_level", true);
            addButtonWithTranslation(this, id, "this_level");
        });
    }

    // 添加按钮到比赛QA部分
    $(".question-response").each(function () {
        let id = "_question_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level", true);
        addButtonWithTranslation(this, id, "this_level");
    });
    if (is_mSite) {
        $("div._ProblemsPage_announcements table tbody tr:gt(0)").each(function () {
            var $nextDiv = $(this).find("td:first");
            let id = "_question_" + getRandomNumber(8);
            addButtonPanel($nextDiv, id, "this_level", true);
            addButtonWithTranslation($nextDiv, id, "this_level");
        });
    }

    // 添加按钮到弹窗confirm-proto部分
    $(".confirm-proto").each(function () {
        let id = "_titled_" + getRandomNumber(8);
        var $nextDiv = $(this).children().get(0);
        addButtonPanel($nextDiv, id, "this_level", true);
        addButtonWithTranslation($nextDiv, id, "this_level");
    });

    // 添加按钮到_CatalogHistorySidebarFrame_item部分
    $("._CatalogHistorySidebarFrame_item").each(function () {
        let id = "_history_sidebar_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level", true);
        addButtonWithTranslation(this, id, "this_level");
    });

    $(".problem-lock-link").on("click", function () {
        // 找到.popup中的所有子孙div，并添加按钮
        $(".popup .content div").each(function () {
            let id = "_popup_" + getRandomNumber(8);
            addButtonPanel(this, id, "this_level", true);
            addButtonWithTranslation(this, id, "this_level");
        });
    });
};

//弹窗翻译
function alertZh() {
    var _alert = window.alert;
    window.alert = async function (msg) {
        _alert(msg + "\n=========翻译=========\n" + await translate_deepl(msg));
        return true;
    }
};


// 展开折叠块
function ExpandFoldingblocks() {
    if (expandFoldingblocks) {
        $('.spoiler').addClass('spoiler-open');
        $('.spoiler-content').attr('style', '');
    }
};

// 跳转洛谷
async function CF2luogu() {
    const getProblemId = () => {
        const url = window.location.href;
        const regex = url.includes('/contest/')
            ? /\/contest\/(\d+)\/problem\/([A-Za-z\d]+)/
            : /\/problemset\/problem\/(\d+)\/([A-Za-z\d]+)/;
        const matchResult = url.match(regex);
        return matchResult && matchResult.length >= 3
            ? `${matchResult[1]}${matchResult[2]}`
            : '';
    };

    const checkLinkExistence = (url) => {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: "GET",
                url,
                headers: { "Range": "bytes=0-9999" }, // 获取前10KB数据
                onload(response) {
                    if (response.responseText.match(/题目未找到/g)) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                },
                onerror(error) {
                    reject(error);
                }
            });
        });
    };
    const panelElement = $("<div>")
        .addClass("html2md-panel")
        .attr("id", "CF2luoguPanel")
        .insertBefore('.problemindexholder');

    const url = `https://www.luogu.com.cn/problem/CF${getProblemId()}`;
    const result = await checkLinkExistence(url);
    if (getProblemId() && result) {
        const problemLink = $("<a>")
            .attr("id", "problemLink")
            .attr("href", url)
            .attr("target", "_blank")
            .html(`<button style="height: 25px;" class="html2mdButton"><img style="width:45px; margin-right:2px;" src="https://cdn.luogu.com.cn/fe/logo.png"></button>`);
        panelElement.append(problemLink);
    }
}

// 等待Latex渲染队列全部完成
function waitUntilIdleThenDo(callback) {
    var intervalId = setInterval(function () {
        var queue = MathJax.Hub.queue;
        if (queue.pending === 0 && queue.running === 0) {
            clearInterval(intervalId);
            callback();
        }
    }, 100);
}

$(document).ready(function () {
    var newElement = $("<div></div>")
        .addClass("alert alert-info")
        .html(`Codeforces Better! —— 正在等待页面资源加载……`)
        .css({
            "margin": "1em",
            "text-align": "center",
            "font-weight": "600",
            "position": "relative"
        });
    var tip_SegmentedTranslation = $("<div></div>")
        .addClass("alert alert-error")
        .html(`Codeforces Better! —— 注意！分段翻译已开启，这会造成负面效果，
        <p>除非你现在需要翻译超长篇的博客或者题目，否则请前往设置关闭分段翻译</p>`)
        .css({
            "margin": "1em",
            "text-align": "center",
            "font-weight": "600",
            "position": "relative"
        });

    function processPage() {
        if (showLoading) newElement.html('Codeforces Better! —— 正在等待Latex渲染队列全部完成……');
        waitUntilIdleThenDo(function () {
            if (enableSegmentedTranslation) $(".menu-box:first").next().after(tip_SegmentedTranslation); //显示分段翻译警告
            if (showJumpToLuogu) CF2luogu();
            ExpandFoldingblocks();
            addConversionButton();
            alertZh();
            if (showLoading) {
                newElement.html('Codeforces Better! —— 加载已完成');
                newElement.removeClass('alert-info').addClass('alert-success');
                setTimeout(function () {
                    newElement.remove();
                }, 3000);
            }
        });
    }

    if (showLoading) $(".menu-box:first").next().after(newElement);

    if (loaded) {
        processPage();
    } else {
        // 页面完全加载完成后执行
        window.onload = function () {
            processPage();
        };
    }
})

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
          <h2>字数超限!</h2>
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

//跳过折叠块确认
function skiFoldingBlocks() {
    return new Promise(resolve => {
        const styleElement = GM_addStyle(darkenPageStyle);
        let htmlString = `
      <div class="wordsExceeded">
          <h2>是否跳过折叠块？</h2>
          <p></p>
          <div style="display:grid; padding:5px 0px; align-items: center;">
            <p>
            即将翻译的区域中包含折叠块，折叠块可能是代码，通常不需要翻译，现在您需要选择是否跳过这些折叠块，
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
    if (is_oldLatex) {
        //去除开头结尾的<p>标签
        text = text.replace(/^<p>/i, "");
        text = text.replace(/<\/p>$/i, "");
        //
        let i = 0;
        let regex = /<span\s+class="tex-span">.*?<\/span>/gi;
        matches = text.match(regex);
        try {
            for (i; i < matches.length; i++) {
                let match = matches[i];
                text = text.replace(match, `【${i + 1}】`);
                replacements[`【${i + 1}】`] = match;
            }
        } catch (e) { }
    } else if (translation != "api2d" && translation != "openai") {
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
        translateDiv.textContent = "正在翻译中……请稍等";
        translatedText = await translate_deepl(text);
    } else if (translation == "youdao") {
        translateDiv.textContent = "正在翻译中……请稍等";
        translatedText = await translate_youdao_mobile(text);
    } else if (translation == "google") {
        translateDiv.textContent = "正在翻译中……请稍等";
        translatedText = await translate_gg(text);
    } else if (translation == "openai") {
        translateDiv.textContent = "正在翻译中……\n\n使用GPT（ChatGPT/api2d）进行翻译通常需要很长的时间，请耐心等待";
        translatedText = await translate_openai(text);
    } else if (translation == "api2d") {
        translateDiv.textContent = "正在翻译中……\n\n使用GPT（ChatGPT/api2d）进行翻译通常需要很长的时间，请耐心等待";
        translatedText = await translate_api2d(text);
    }
    if (/^翻译出错/.test(translatedText)) status = 2;
    // 还原latex公式
    if (is_oldLatex) {
        translatedText = "<p>" + translatedText;
        translatedText += "</p>";
        try {
            for (let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let replacement = replacements[`【${i + 1}】`];
                let regex;
                regex = new RegExp(`【${i + 1}】`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`\\[${i + 1}\\]`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`【${i + 1}[^】\\d]`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`[^【\\d]${i + 1}】`, 'g');
                translatedText = translatedText.replace(regex, " " + replacement);
            }
        } catch (e) { }
    }
    else if (translation != "api2d" && translation != "openai") {
        try {
            for (let i = 0; i < matches.length; i++) {
                let match = matches[i];
                let replacement = replacements[`【${i + 1}】`];
                let regex;
                regex = new RegExp(`【${i + 1}】`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`\\[${i + 1}\\]`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`【${i + 1}[^】\\d]`, 'g');
                translatedText = translatedText.replace(regex, replacement);
                regex = new RegExp(`[^【\\d]${i + 1}】`, 'g');
                translatedText = translatedText.replace(regex, " " + replacement);
            }
        } catch (e) { }
    }

    if (!is_oldLatex) {
        // 创建一个隐藏的元素来保存 translatedText 的值
        var textElement = document.createElement("div");
        textElement.style.display = "none";
        textElement.textContent = translatedText;
        translateDiv.parentNode.insertBefore(textElement, translateDiv);

        // 翻译复制按钮
        var copyButton = document.createElement("button");
        copyButton.textContent = "Copy";
        $(copyButton).addClass("html2mdButton html2md-cb");
        $(copyButton).css({
            "float": "right",
        });
        copyButton.addEventListener("click", function () {
            var translatedText = textElement.textContent;
            GM_setClipboard(translatedText);
            $(this).addClass("copied");
            $(this).text("Copied");
            // 更新复制按钮文本
            setTimeout(() => {
                $(this).removeClass("copied");
                $(this).text("Copy");
            }, 2000);
        });
        translateDiv.parentNode.insertBefore(copyButton, translateDiv);
    }

    // 使符合mathjx的转换语法
    const ruleMap = [
        { pattern: /(\s_[\u4e00-\u9fa5]+_)([\u4e00-\u9fa5]+)/g, replacement: "$1 $2" }, // 斜体
        { pattern: /(_[\u4e00-\u9fa5]+_\s)([\u4e00-\u9fa5]+)/g, replacement: " $1$2" },
        { pattern: /(_[\u4e00-\u9fa5]+_)([\u4e00-\u9fa5]+)/g, replacement: " $1 $2" },
        { pattern: /(\$\$[\r\n])/g, replacement: "$$$$$$$$$$$$" }, // $$ 行间
        { pattern: /(?<!\$)\$(?!\$)/g, replacement: "$$$$$" }, // $ 内联
        { pattern: /&/g, replacement: "\\&" }, // &符号
        { pattern: /(?<!\\)>(?!\s)/g, replacement: "&gt;" }, // >符号
        { pattern: /(?<!\\)</g, replacement: "&lt;" }, // <符号
    ];

    ruleMap.forEach(({ pattern, replacement }) => {
        translatedText = translatedText.replace(pattern, replacement);
    });

    // 更新
    if (is_oldLatex) {
        // oldlatex
        translatedText = $.parseHTML(translatedText);
        $(translateDiv).empty().append($(translatedText));
        return {
            translateDiv: translateDiv,
            status: status
        };
    } else {
        translateDiv.innerHTML = translatedText;
        // 渲染MarkDown
        var md = window.markdownit();
        var html = md.render(translateDiv.innerText);
        translateDiv.innerHTML = html;
        // 渲染Latex
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementById(id)]);
        return {
            translateDiv: translateDiv,
            status: status,
            copyDiv: textElement,
            copyButton: copyButton
        };
    }

}

// ChatGPT
async function translate_openai(raw) {
    var openai_key = GM_getValue("openai_key");
    var openai_retext = "";
    var data;
    if (is_oldLatex) {
        data = {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: "(请将下面的文本翻译为中文，这是一个编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的【】、HTML标签本身以及其中的内容不翻译不变动，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw + ")"
            }],
            temperature: 0.7
        };
    } else {
        data = {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: "(请将下面的文本翻译为中文，这是一个编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的latex公式不翻译，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw + ")"
            }],
            temperature: 0.7
        };
    };
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: (showOpneAiAdvanced && GM_getValue("openai_proxy") !== null && GM_getValue("openai_proxy") !== "") ? GM_getValue("openai_proxy") : 'https://api.openai.com/v1/chat/completions', // Use the chat endpoint here

            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GM_getValue("openai_key")
            },
            responseType: 'json',
            onload: function (response) {
                if (!response.response.choices || response.response.choices.length < 1 || !response.response.choices[0].message) {
                    resolve("翻译出错，请重试\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/465777/feedback 反馈\n\n报错信息：" + JSON.stringify(response.response, null, '\n'));
                } else {
                    openai_retext = response.response.choices[0].message.content;
                    // openai_retext = openai_retext.replace(/^\s+/, '');
                    resolve(openai_retext);
                }
            },
            onerror: function (response) {
                console.error(response.statusText);
                reject(response.statusText);
            },
        });

    });
}

// api2d
async function translate_api2d(raw) {
    var api2d_key = GM_getValue("api2d_key");
    var api2d_retext = "";
    var postData;
    if (is_oldLatex) {
        postData = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: '请帮我将下面的文本翻译为中文，这是一个编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的【】、HTML标签本身以及其中的内容不翻译不变动，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n' + raw }],
            temperature: 0.7
        });
    } else {
        postData = JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: '请帮我将下面的文本翻译为中文，这是一个编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的latex公式不翻译，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n' + raw }],
            temperature: 0.7
        });
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + api2d_key,
            ...(x_api2d_no_cache ? {} : { 'x-api2d-no-cache': 1 })
        },
        data: postData,
    };

    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: options.method,
            url: `https://openai.api2d.net/v1/chat/completions`,
            headers: options.headers,
            data: options.data,
            responseType: 'json',
            onload: function (response) {
                if (!response.response.choices || response.response.choices.length < 1 || !response.response.choices[0].message) {
                    resolve("翻译出错，请重试\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/465777/feedback 反馈\n\n报错信息：" + JSON.stringify(response.response, null, '\n'));
                } else {
                    api2d_retext = response.response.choices[0].message.content;
                    resolve(api2d_retext);
                }
            },
            onerror: function (response) {
                console.error(response.statusText);
                reject(response.statusText);
            },
        });
    });


}
//

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
    return await PromiseRetryWrap(toDo, { RetryTimes: 3, ErrProcesser: () => "翻译出错，请重试或更换翻译接口\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/465777/feedback 反馈\n\n报错信息：" + errtext })
}

function Request(options) {
    return new Promise((reslove, reject) => GM_xmlhttpRequest({ ...options, onload: reslove, onerror: reject }))
}

//--异步请求包装工具--end