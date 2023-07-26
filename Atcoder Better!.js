// ==UserScript==
// @name         Atcoder Better!
// @namespace    https://greasyfork.org/users/747162
// @version      1.00
// @description  Atcoder界面汉化、题目翻译，markdown视图，一键复制题目，跳转到洛谷
// @author       北极小狐
// @match        https://atcoder.jp/*
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
// @grant        GM_setClipboard
// @icon         https://atcoder-cdn.oss-cn-beijing.aliyuncs.com/atcoder.png
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

const bottomZh_CN = getGMValue("bottomZh_CN", true);
const translation = getGMValue("translation", "deepl");
const enableSegmentedTranslation = getGMValue("enableSegmentedTranslation", false);
const showJumpToLuogu = getGMValue("showJumpToLuogu", true);
const showLoading = getGMValue("showLoading", true);
var x_api2d_no_cache = getGMValue("x_api2d_no_cache", true);
var showOpneAiAdvanced = getGMValue("showOpneAiAdvanced", false);

// 常量
const helpCircleHTML = '<div class="help-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592 0-42.944-14.08-76.736-42.24-101.376-28.16-25.344-65.472-37.312-111.232-37.312zm-12.672 406.208a54.272 54.272 0 0 0-38.72 14.784 49.408 49.408 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.848 54.848 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.968 51.968 0 0 0-15.488-38.016 55.936 55.936 0 0 0-39.424-14.784z"></path></svg></div>';
const darkenPageStyle = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 9999; }`;

// 样式
GM_addStyle(`
:root {
    --vp-font-family-base: "Chinese Quotes", "Inter var", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
span.mdViewContent {
    white-space: pre-wrap;
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
    margin: 8px 0 !important;
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
button.html2mdButton.AtBetter_setting {
    float: right;
    height: 30px;
    background: #3c5a7f;
    color: white;
    margin: 10px;
    border: 0px;
}

button.html2mdButton.AtBetter_setting.open {
  background-color: #e6e6e61f;
  color: #727378;
  cursor: not-allowed;
}
#AtBetter_setting_menu {
    z-index: 9999;
    box-shadow: 0px 0px 0px 4px #ffffff;
    display: grid;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 320px;
    transform: translate(-50%, -50%);
    border-radius: 6px;
    background-color: #edf1ff;
    border-collapse: collapse;
    border: 1px solid #ffffff;
    color: #697e91;
    font-family: var(--vp-font-family-base);
    padding: 10px 20px 20px 20px;
}
#AtBetter_setting_menu h3 {
    margin-top: 10px;
}
#AtBetter_setting_menu hr {
    border: none;
    height: 1px;
    background-color: #ccc;
    margin: 10px 0;
}
/*设置面板-关闭按钮*/
#AtBetter_setting_menu .tool-box {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  top: 3px;
  right: 3px;
}

#AtBetter_setting_menu .btn-close {
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

#AtBetter_setting_menu .btn-close:hover {
    width: 20px;
    height: 20px !important;
    font-size: 17px;
    color: #ffffff;
    background-color: #ff0000cc;
    box-shadow: 0 5px 5px 0 #00000026;
}

#AtBetter_setting_menu .btn-close:active {
  width: .9rem;
  height: .9rem;
  font-size: 1px;
  color: #ffffffde;
  --shadow-btn-close: 0 3px 3px 0 #00000026;
  box-shadow: var(--shadow-btn-close);
}

/*设置面板-checkbox*/
#AtBetter_setting_menu input[type=checkbox]:focus {
    outline: 0px;
}

#AtBetter_setting_menu input[type="checkbox"] {
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

#AtBetter_setting_menu input[type="checkbox"]::before {
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

#AtBetter_setting_menu input[type="checkbox"]::after {
	content: url("data:image/svg+xml,%3Csvg xmlns='://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.55021 5.84315L17.1568 16.4498L16.4497 17.1569L5.84311 6.55026L6.55021 5.84315Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17.1567 6.55021L6.55012 17.1568L5.84302 16.4497L16.4496 5.84311L17.1567 6.55021Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3C/svg%3E");
	position: absolute;
	top: 0;
	left: 24px;
}

#AtBetter_setting_menu input[type="checkbox"]:checked {
	border: 1.5px solid #C5CAE9;
	background: #E8EAF6;
}

#AtBetter_setting_menu input[type="checkbox"]:checked::before {
	background: #C5CAE9;
	border: 1.5px solid #7986CB;
	transform: translate(122%, 2%);
	transition: all 0.3s ease-in-out;
}

#AtBetter_setting_menu input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    position: absolute;
    top: 1.5px;
    left: 4.5px;
}

#AtBetter_setting_menu label {
    font-size: 16px;
    font-weight: initial;
    margin-bottom: 0px;
}

.AtBetter_setting_list {
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
#AtBetter_setting_menu>label {
    display: flex;
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 0px;
    align-items: center;
    margin: 3px 0px;
}

.AtBetter_setting_menu_label_text {
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
    -webkit-box-sizing: content-box;
    -moz-box-sizing: content-box;
    box-sizing: content-box;
}

input[type="radio"]:checked+.AtBetter_setting_menu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    font-weight: 500;
}

#AtBetter_setting_menu>label input[type="radio"] {
    -webkit-appearance: none;
    appearance: none;
    list-style: none;
    padding: 0px !important;
    margin: 0px;
}

#AtBetter_setting_menu input[type="text"] {
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

.AtBetter_setting_menu_input {
    width: 100%;
    display: grid;
    margin-top: 5px;
}

#AtBetter_setting_menu #save {
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
#AtBetter_setting_menu button#debug_button.debug_button {
    width: 18%;
}

#AtBetter_setting_menu span.tip {
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
#AtBetter_setting_menu .AtBetter_setting_menu_label_text .help_tip .help-icon {
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
	padding: 0px;
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
        url: "https://greasyfork.org/zh-CN/scripts/471106.json",
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

                $("#skip_update").click(function() {
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

        // 严格
        function strictTraverseTextNodes(node, rules) {
            if (!node) return;
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeText = node.textContent.trim();
                rules.forEach(rule => {
                    if (nodeText === rule.match) {
                        node.textContent = rule.replace;
                    }
                });
            } else {
                $(node).contents().each((_, child) => strictTraverseTextNodes(child, rules));
            }
        }

        const rules1 = [
            { match: 'Present Contests', replace: '目前的比赛' },
            { match: 'Past Contests', replace: '过去的比赛' },
            { match: 'Top', replace: '首页' },
            { match: 'Tasks', replace: '问题集' },
            { match: 'Clarifications', replace: '问题答疑' },
            { match: 'Submit', replace: '提交' },
            { match: 'Results', replace: '结果' },
            { match: 'All Submissions', replace: '所有提交' },
            { match: 'My Submissions', replace: '我的提交' },
            { match: 'My Score', replace: '我的得分' },
            { match: 'Virtual Standings', replace: '虚拟排名' },
            { match: 'Standings', replace: '排名' },
            { match: 'Custom Test', replace: '自定义测试' },
            { match: 'Editorial', replace: '题解' },
            { match: 'Discuss', replace: '讨论' },
            { match: 'Algorithm', replace: '算法' },
            { match: 'Heuristic', replace: '启发式' },
            { match: 'Active Users', replace: '活跃用户' },
            { match: 'All Users', replace: '所有用户' },
            { match: 'Profile', replace: '个人资料' },
            { match: 'Competition History', replace: '比赛记录' },
            { match: 'General Settings', replace: '常规设置' },
            { match: 'Settings', replace: '设置' },
            { match: 'Change/Verify Email address', replace: '更改/验证电子邮件地址' },
            { match: 'Remind Username', replace: '提醒用户名' },
            { match: 'Change Username', replace: '更改用户名' },
            { match: 'Delete Account', replace: '删除账户' },
            { match: 'Change Photo', replace: '更改照片' },
            { match: 'Change Password', replace: '更改密码' },
            { match: 'Manage Fav', replace: '管理收藏' },
            { match: 'Other', replace: '其他' },
            { match: 'Remind Username', replace: '提醒用户名' },
            { match: 'Change Username', replace: '更改用户名' },
            { match: 'Delete Account', replace: '删除账户' }
        ];
        traverseTextNodes($('.nav'), rules1);

        const rules2 = [
            { match: 'My Profile', replace: '个人资料' },
            { match: 'General Settings', replace: '常规设置' },
            { match: 'Change Photo', replace: '更改照片' },
            { match: 'Change Password', replace: '更改密码' },
            { match: 'Manage Fav', replace: '管理收藏' },
            { match: 'Sign Out', replace: '退出登录' }
        ];
        traverseTextNodes($('.dropdown-menu'), rules2);

        const rules3 = [
            { match: 'Search in Archive', replace: '搜索存档' },
            { match: 'Permanent Contests', replace: '永久比赛' },
            { match: 'Upcoming Contests', replace: '即将举行的比赛' },
            { match: 'Recent Contests', replace: '最近的比赛' },
            { match: 'Ranking', replace: '排行' },
            { match: 'Contest Archive', replace: '比赛档案' },
            { match: 'Information', replace: '信息' },
            { match: 'About the situation where it is difficult to access the contest site', replace: '关于难以访问比赛网站的情况' },
        ];
        traverseTextNodes($('.panel-title'), rules3);
        traverseTextNodes($('.h3'), rules3);

        const rules4 = [
            { match: 'Rated Range', replace: '限定范围' },
            { match: 'Category', replace: '类别' },
            { match: 'Search', replace: '搜索' }
        ];
        traverseTextNodes($('.filter-body-heading'), rules4);

        const rules5 = [
            { match: 'Current Password', replace: '当前密码' },
            { match: 'New Password', replace: '新密码' },
            { match: 'Confirm Password', replace: '确认密码' },
            { match: 'Update', replace: '更新' },
            { match: 'Contest Name', replace: '比赛名称' },
            { match: 'Username', replace: '用户名' },
            { match: 'Password', replace: '密码' },
            { match: 'Sign In', replace: '登录' },
            { match: 'Sign Up', replace: '注册' },
            { match: 'Nickname', replace: '昵称' },
            { match: 'Country/Region', replace: '国家/地区' },
            { match: 'Birth Year', replace: '出生年份' },
            { match: 'Affiliation', replace: '机构' },
            { match: 'Email Notifications', replace: '邮件通知' },
            { match: 'New Email address', replace: '新电子邮件地址' },
            { match: 'Request Email address verify', replace: '请求电子邮件地址验证' },
            { match: 'I agree.', replace: '我同意。' },
            { match: 'Do you live in Japan?', replace: '您是否居住在日本？' },
            { match: 'Family Name', replace: '姓氏' },
            { match: 'First Name', replace: '名字' },
            { match: 'Category', replace: '分类' },
            { match: 'College Students (Master or Doctor cource)', replace: '大学生（硕士或博士课程）' },
            { match: 'College Students', replace: '大学生' },
            { match: 'Technical college/Vocational school/Short-term university', replace: '技术学院/职业学校/短期大学' },
            { match: 'High school', replace: '高中' },
            { match: 'Junior high school', replace: '初中' },
            { match: 'Office worker', replace: '上班族' },
            { match: 'Other', replace: '其他' },
            { match: 'Organization Name \\(Company Name or School Name\\)', replace: '组织名称（公司名称或学校名称）' },
            { match: 'Depertment \\(For Students\\)', replace: '部门（适用于学生）' },
            { match: 'Do you have any intention or plan to find a job or change jobs in 2023 or 2024?', replace: '您是否有意向或计划在2023年或2024年找工作或换工作？' },
            { match: 'Graduation Schedule', replace: '毕业时间表' },
            { match: "I'm already employed.", replace: '我已经就业了。' },
            { match: 'Later years', replace: '以后的几年' },
            { match: 'I am interested in going into the digital area of Toyota Motor Corporation\'s operations.', replace: '我对加入丰田汽车公司的数字领域感兴趣。' },
            { match: 'Toyota is currently actively recruiting engineers. Would you like to be considered?', replace: '丰田目前正在积极招聘工程师。您有兴趣被考虑吗？' },
            { match: 'I\'d like to talk to you first.', replace: '我想先和您交谈。' },
            { match: 'Department name', replace: '部门名称' },
            { match: 'What kind of work do you currently do?', replace: '您目前从事什么样的工作？' },
            { match: 'How can the Algorithms Group of the Digital Transformation Office help\\?', replace: '数字转型办公室的算法组可以如何帮助您？' }
        ];
        traverseTextNodes($('.form-group'), rules5);

        const rules6 = [
            { match: 'Unofficial(unrated)', replace: '非官方（无评级）' },
            { match: 'Sponsored Parallel(rated)', replace: '赞助平行（有评级）' },
            { match: 'Sponsored Parallel(unrated)', replace: '赞助平行（无评级）' },
            { match: 'Sponsored Heuristic Contest', replace: '启发式赞助比赛' },
            { match: 'All', replace: '全部' },
            { match: 'AtCoder Typical Contest', replace: 'AtCoder 经典比赛' },
            { match: 'PAST Archive', replace: 'PAST 比赛归档' },
            { match: 'JOI Archive', replace: 'JOI 比赛归档' },
            { match: 'Sponsored Tournament', replace: '赞助比赛' },
            { match: 'Sponsored ABC', replace: '赞助 ABC' },
            { match: 'Sponsored ARC', replace: '赞助 ARC' },
            { match: 'Heuristic Contest', replace: '启发式比赛' }
        ];
        strictTraverseTextNodes($('#category-btn-group'), rules6);

        const rules7 = [
            { match: 'Task', replace: '任务' },
            { match: 'Language', replace: '语言' },
            { match: 'Source Code', replace: '源代码' },
            { match: 'Standard Input', replace: '标准输入' },
            { match: 'Standard Output', replace: '标准输出' },
            { match: 'Standard Error', replace: '标准错误' },
        ];
        traverseTextNodes($('.control-label'), rules7);

        const rules8 = [
            { match: 'Permanent Contests', replace: '永久比赛' },
            { match: 'Upcoming Contests', replace: '即将举行的比赛' },
            { match: 'Recent Contests', replace: '最近的比赛' }
        ];
        traverseTextNodes($('h4'), rules8);

        const rules9 = [
            { match: 'Open File', replace: '打开文件' },
            { match: 'Toggle Editor', replace: '切换编辑器' },
            { match: 'Auto Height', replace: '自动调整高度' }
        ];
        traverseTextNodes($('.editor-buttons'), rules9);

        const rules10 = [
            { match: 'Register', replace: '报名' },
            { match: 'Virtual Participation', replace: '虚拟参加' }
        ];
        traverseTextNodes($('.btn'), rules10);

        const rules11 = [
            { match: 'Home', replace: '主页' },
            { match: 'Contest', replace: '比赛' },
            { match: 'Ranking', replace: '排名' },
            { match: 'Sign Up', replace: '注册' },
            { match: 'Sign In', replace: '登录' },
        ];
        strictTraverseTextNodes($('#navbar-collapse'), rules11);
    });
})();

// 设置面板
$(document).ready(function () {
    var htmlContent = "<button class='html2mdButton AtBetter_setting'>AtcoderBetter设置</button>";
    $('#navbar-collapse > ul:nth-child(2) > li:last-child').after("<li class='dropdown'>" + htmlContent + "</li>");
});

$(document).ready(function () {
    const $settingBtns = $(".AtBetter_setting");
    $settingBtns.click(() => {
        const styleElement = GM_addStyle(darkenPageStyle);
        $settingBtns.prop("disabled", true).addClass("open");
        $("body").append(`
          <div id='AtBetter_setting_menu'>
              <div class="tool-box">
                  <button class="btn-close">×</button>
              </div>
              <h4>基本设置</h4>
              <hr>
              <div class='AtBetter_setting_list'>
                  <label for="bottomZh_CN">界面汉化</label>
                  <input type="checkbox" id="bottomZh_CN" name="bottomZh_CN">
              </div>
              <div class='AtBetter_setting_list'>
                  <label for="showLoading">显示加载信息</label>
                  <div class="help_tip">
                      `+ helpCircleHTML + `
                      <div class="tip_text">
                      <p>当你开启 显示加载信息 时，每次加载页面时会在上方显示加载信息提示：“Atcoder Better! —— xxx”</p>
                      <p>这用于了解脚本当前的工作情况，<strong>如果你不想看到，可以选择关闭</strong></p>
                      <p><u>需要说明的是，如果你需要反馈脚本的任何加载问题，请开启该选项后再截图，以便于分析问题</u></p>
                      </div>
                  </div>
                  <input type="checkbox" id="showLoading" name="showLoading">
              </div>
              <div class='AtBetter_setting_list'>
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
              <div class='AtBetter_setting_list'>
                  <label for="showJumpToLuogu">显示跳转到洛谷</label>
                  <div class="help_tip">
                      `+ helpCircleHTML + `
                      <div class="tip_text">
                      <p>洛谷OJ上收录了Atcoder的部分题目，一些题目有翻译和题解</p>
                      <p>开启显示后，如果当前题目被收录，则会在题目的右上角显示洛谷标志，</p>
                      <p>点击即可一键跳转到该题洛谷的对应页面。</strong></p>
                      </div>
                  </div>
                  <input type="checkbox" id="showJumpToLuogu" name="showJumpToLuogu">
              </div>
              <h4>翻译设置</h4>
              <hr>
              <label>
                  <input type='radio' name='translation' value='deepl'>
                  <span class='AtBetter_setting_menu_label_text'>deepl翻译</span>
              </label>
              <label>
                  <input type='radio' name='translation' value='youdao'>
                  <span class='AtBetter_setting_menu_label_text'>有道翻译</span>
              </label>
              <label>
                  <input type='radio' name='translation' value='google'>
                  <span class='AtBetter_setting_menu_label_text'>Google翻译</span>
              </label>
              <label>
                  <input type='radio' name='translation' value='openai'>
                  <span class='AtBetter_setting_menu_label_text'>使用ChatGPT翻译(API)
                      <div class="help_tip">
                          `+ helpCircleHTML + `
                          <div class="tip_text">
                          <p><b>请确保你能够正常访问OpenAI的api</b></p>
                          <p>Atcoder Better!使用 gpt-3.5-turbo 模型进行翻译，脚本的所有请求均在本地完成</p>
                          <p>你需要输入自己的OpenAI KEY，<a target="_blank" href="https://platform.openai.com/account/usage">官网</a></p>
                          </div>
                      </div>
                  </span>
              </label>
              <label>
                  <input type='radio' name='translation' value='api2d'>
                  <span class='AtBetter_setting_menu_label_text'>使用api2d翻译(API)
                      <div class="help_tip">
                          `+ helpCircleHTML + `
                          <div class="tip_text">
                          <p>api2d是国内的一家提供代理直连访问OpenAI的api的服务商，相当于OpenAI的api的套壳</p>
                          <p>Atcoder Better!使用 gpt-3.5-turbo 模型进行翻译，脚本的所有请求均在本地完成</p>
                          <p>你需要输入自己的api2d KEY，<a target="_blank" href="https://api2d.com/profile">官网</a></p>
                          </div>
                      </div>
                  </span>
              </label>
              <div class='AtBetter_setting_menu_input' id='openai' style='display: none;'>
                  <label for='openai_key'>KEY:</label><input type='text' id='openai_key'>
                  <div class='AtBetter_setting_list'>
                      <label for="showOpneAiAdvanced">使用代理API</label>
                      <div class="help_tip">
                          `+ helpCircleHTML + `
                          <div class="tip_text">
                          <p>使用你指定的API来代理访问 gpt-3.5-turbo 模型进行翻译，脚本的所有请求均在本地完成</p>
                          <p>建议你自建代理，而不是使用他人公开的代理，那是危险的</p>
                          <p><strong>由于你指定了自定义的API，Tampermonkey会对你的跨域请求进行警告，请自行授权</strong></p>
                          </div>
                      </div>
                      <input type="checkbox" id="showOpneAiAdvanced" name="showOpneAiAdvanced">
                  </div>
                  <div id="is_showOpneAiAdvanced">
                      <label for='openai_proxy'>Proxy API:</label><input type='text' id='openai_proxy'>
                  </div>
              </div>
              <div class='AtBetter_setting_menu_input' id='api2d' style='display: none;'>
                  <label for='api2d_key'>KEY:</label><input type='text' id='api2d_key'>
                  <div class='AtBetter_setting_list'>
                      <label for="x_api2d_no_cache">使用缓存</label>
                      <div class="help_tip">
                          `+ helpCircleHTML + `
                          <div class="tip_text">
                          <p>API2D 的服务器会对请求结果做缓存，如果请求文本的hash值相同，会直接返回缓存的结果。缓存命中之后，本次请求不会扣除任何点数。</p>
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
        $("#enableSegmentedTranslation").prop("checked", GM_getValue("enableSegmentedTranslation") === true);
        $("#showJumpToLuogu").prop("checked", GM_getValue("showJumpToLuogu") === true);
        $("#x_api2d_no_cache").prop("checked", GM_getValue("x_api2d_no_cache") === true);
        $("#showOpneAiAdvanced").prop("checked", GM_getValue("showOpneAiAdvanced") === true);
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

        const $settingMenu = $("#AtBetter_setting_menu");

        $("#save").click(function () {
            GM_setValue("bottomZh_CN", $("#bottomZh_CN").prop("checked"));
            GM_setValue("showLoading", $("#showLoading").prop("checked"));
            GM_setValue("enableSegmentedTranslation", $("#enableSegmentedTranslation").prop("checked"));
            GM_setValue("showJumpToLuogu", $("#showJumpToLuogu").prop("checked"));
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

// html2md转换/处理规则
var turndownService = new TurndownService({ bulletListMarker: '-', escape: (text) => text });
var turndown = turndownService.turndown;

// 保留原始
turndownService.keep(['del']);

turndownService.addRule('removeByClass', {
    filter: function (node) {
        return node.classList.contains('html2md-panel') ||
            node.classList.contains('div-btn-copy') ||
            node.classList.contains('btn-copy')
    },
    replacement: function () {
        return '';
    }
});

// inline math
turndownService.addRule('inline-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex";
    },
    replacement: function (content, node) {
        return "$" + $(node).find('annotation').text() + "$";
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

function addButtonWithCopy(parent, suffix, type) {
    $(document).on("click", ".html2md-cb" + suffix, function () {
        let target, removedChildren, text;
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
}

async function addButtonWithTranslation(parent, suffix, type) {
    $(document).on('click', '.translateButton' + suffix, async function () {
        $(this).removeClass("translated");
        $(this).text("翻译中");
        $(this).css("cursor", "not-allowed");
        var target, element_node, block, result, errerNum = 0;
        if (type === "this_level") block = $(".translateButton" + suffix).parent().next();
        else if (type === "child_level") block = $(".translateButton" + suffix).parent().parent();
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
            if ($(target).find('details').length > 0) {
                const shouldSkip = await skiFoldingBlocks();
                if (shouldSkip) {
                    $(target).find('details').remove();
                } else {
                    $(target).find('.html2md-panel').remove();
                }
            }

            //跳过代码块
            $(target).find('pre').remove();

            result = await blockProcessing(target, element_node, $(".translateButton" + suffix));
            if (result.status) errerNum += 1;
            $(target).remove();
        }
        if (!errerNum) {
            $(this).addClass("translated")
                .text("已翻译")
                .prop("disabled", true);
        }
        // 重新翻译按钮
        if ($(this).next('.reTranslation').length === 0) {
            const reTranslateBtn = $('<button>').addClass('html2mdButton reTranslation').html('&circlearrowright;').attr('title', '重新翻译');
            reTranslateBtn.on('click', function () {
                result.translateDiv.remove();
                result.copyDiv.remove();
                result.copyButton.remove();
                x_api2d_no_cache ? (x_api2d_no_cache = false, $(this).prev().prop("disabled", false), $(this).prev().click(), x_api2d_no_cache = true) : ($(this).prev().click());
            });
            $(this).after(reTranslateBtn);
        } else {
            const reTranslateBtn = $(this).next('.reTranslation');
            reTranslateBtn.off('click').on('click', function () {
                result.translateDiv.remove();
                result.copyDiv.remove();
                result.copyButton.remove();
                x_api2d_no_cache ? (x_api2d_no_cache = false, $(this).prev().prop("disabled", false), $(this).prev().click(), x_api2d_no_cache = true) : ($(this).prev().click());
            });
        }
    });
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
            .text("翻译出错");
        $(target).remove();
    }
    return result;
}

function addConversionButton() {
    // 基本添加
    $('section').each(function () {
        let id = "_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
        addButtonWithTranslation(this, id, "this_level");
    });

    // 添加按钮到题解部分
    if (window.location.href.includes("editorial")) {
        let contestNavTabs = $("#contest-nav-tabs");
        let nextElement = contestNavTabs.next();
        let id = "_editorial_" + getRandomNumber(8);
        addButtonPanel(nextElement, id, "child_level");
        addButtonWithHTML2MD(nextElement, id, "child_level");
        addButtonWithCopy(nextElement, id, "child_level");
        addButtonWithTranslation(nextElement, id, "child_level");
    }
    if (window.location.href.includes("editorial")) {
        let contestNavTabs = $("#contest-nav-tabs");
        let nextElement = contestNavTabs.next().children().eq(-2);
        let id = "_editorial_" + getRandomNumber(8);
        addButtonPanel(nextElement, id, "child_level");
        addButtonWithHTML2MD(nextElement, id, "child_level");
        addButtonWithCopy(nextElement, id, "child_level");
        addButtonWithTranslation(nextElement, id, "child_level");
    }

    // 添加按钮到折叠块部分
    $('details').each(function () {
        let id = "_details_" + getRandomNumber(8);
        addButtonPanel(this, id, "child_level");
        addButtonWithHTML2MD(this, id, "child_level");
        addButtonWithCopy(this, id, "child_level");
        addButtonWithTranslation(this, id, "child_level");
    });

    // 添加到contest-statement部分
    $('#contest-statement').each(function () {
        let id = "_contest-statement_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
        addButtonWithTranslation(this, id, "this_level");
    });

    // 添加到blog-post部分
    $('.blog-post').each(function () {
        let id = "_blog-post_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
        addButtonWithTranslation(this, id, "this_level");
    });
};

// 跳转洛谷
async function At2luogu() {
    const getProblemId = () => {
        const url = window.location.href;
        const regex = /\/contests\/([A-Za-z\d]+)\/tasks\/([A-Za-z\d\_]+)/;
        const matchResult = url.match(regex);
        return matchResult && matchResult.length >= 3
            ? `${matchResult[2]}`
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

    const url = `https://www.luogu.com.cn/problem/AT_${getProblemId()}`;
    const result = await checkLinkExistence(url);
    if (getProblemId() && result) {
        const problemLink = $("<a style='display: inline-block;vertical-align: middle;'>")
            .attr("id", "problemLink")
            .attr("href", url)
            .attr("target", "_blank")
            .html(`<button style="height: 25px;" class="html2mdButton"><img style="width:45px; margin-right:2px;" src="https://cdn.luogu.com.cn/fe/logo.png"></button>`);
        problemLink.appendTo('.h2');
    }
}

$(document).ready(function () {
    var newElement = $("<div></div>").addClass("alert alert-info").html(`
  Atcoder Better! —— 正在等待页面资源加载……
  `).css({
        "margin": "1em",
        "text-align": "center",
        "font-weight": "600",
        "position": "relative"
    });
    var tip_SegmentedTranslation = $("<div></div>").addClass("alert alert-danger").html(`
  Atcoder Better! —— 注意！分段翻译已开启，这会造成负面效果，
      <p>除非你现在需要翻译超长篇的博客或者题目，否则请前往设置关闭分段翻译</p>
  `).css({
        "margin": "1em",
        "text-align": "center",
        "font-weight": "600",
        "position": "relative"
    });
    if (showLoading) $('#main-container').prepend(newElement);
    // 页面完全加载完成后执行
    window.onload = function () {
        if (enableSegmentedTranslation) $('#main-container').prepend(tip_SegmentedTranslation); //显示分段翻译警告
        if (showLoading) {
            newElement.html('Atcoder Better! —— 正在处理中……');
            newElement.removeClass('alert-info').addClass('alert-success');
        }
        if (showJumpToLuogu) At2luogu();
        addConversionButton();
        if (showLoading) {
            newElement.html('Atcoder Better! —— 加载已完成');
            setTimeout(function () {
                newElement.remove();
            }, 3000);
        }
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
        <h4>字数超限!</h4>
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
        <h4>是否跳过折叠块？</h4>
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
    if (translation != "api2d" && translation != "openai") {
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
    if (translation != "api2d" && translation != "openai") {
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

    // 更新
    translateDiv.innerHTML = translatedText;
    // 渲染MarkDown
    var md = window.markdownit();
    var html = md.render(translateDiv.innerText);
    translateDiv.innerHTML = html;
    // 渲染Latex
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.getElementById(id), {
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
    var openai_key = GM_getValue("openai_key");
    var openai_retext = "";
    var data = {
        prompt: "(You:请帮我将下面的文本翻译为中文，这是一个编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的latex公式不翻译，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw + ")",
        model: "gpt-3.5-turbo",
        temperature: 0.7
    };
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: (showOpneAiAdvanced && GM_getValue("openai_proxy") !== null && GM_getValue("openai_proxy") !== "") ? GM_getValue("openai_proxy") : 'https://api.openai.com/v1/completions',
            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GM_getValue("openai_key") + ''
            },
            responseType: 'json',
            onload: function (res) {
                if (res.status === 200) {
                    openai_retext = res.response.choices[0].text;
                    openai_retext = openai_retext.replace(/^\s+/, '');
                    resolve(openai_retext);
                }
                else {
                    resolve("翻译出错，请重试\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/465777/feedback 反馈\n\n报错信息：" + JSON.stringify(res.response, null, '\n'));
                }
            }
        });
    });
}

// api2d
async function translate_api2d(raw) {
    var api2d_key = GM_getValue("api2d_key");
    var api2d_retext = "";
    var postData = JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: '请帮我将下面的文本翻译为中文，这是一个编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的latex公式不翻译，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n' + raw }],
        temperature: 0.7
    });
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

