// ==UserScript==
// @name         AcWing Better!
// @version      3.29.0
// @description  AcWing界面美化，功能增强，视频时间点标记跳转，代码markdown一键复制
// @author       北极小狐
// @match        https://www.acwing.com/*
// @icon         https://aowuucdn.oss-cn-beijing.aliyuncs.com/acwing.png
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @connect      greasyfork.org
// @run-at       document-end
// @connect      sustech.edu.cn
// @require      https://mirrors.sustech.edu.cn/cdnjs/ajax/libs/turndown/7.2.0/turndown.min.js#sha512-sJzEecN5Nk8cq81zKtGq6/z9Z/r3q38zV9enY75IVxiG7ybtlNUt864sL4L1Kf36bYIwxTMVKQOtU4VhD7hGrw==
// @license      MIT
// @namespace    https://greasyfork.org/users/747162
// @downloadURL https://update.greasyfork.org/scripts/464981/AcWing%20Better%21.user.js
// @updateURL https://update.greasyfork.org/scripts/464981/AcWing%20Better%21.meta.js
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
const { hostname, href } = window.location;
const bottomBar = getGMValue("bottomBar", true);
const bingWallpaper = getGMValue("bingWallpaper", true);
const widthAdjustment = getGMValue("widthAdjustment", true);
const autoPlay = getGMValue("autoPlay", true);
const acTimer = getGMValue("acTimer", true);
const hideNavbar = getGMValue("hideNavbar", false);

// 常量
const helpCircleHTML = '<div class="help-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592 0-42.944-14.08-76.736-42.24-101.376-28.16-25.344-65.472-37.312-111.232-37.312zm-12.672 406.208a54.272 54.272 0 0 0-38.72 14.784 49.408 49.408 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.848 54.848 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.968 51.968 0 0 0-15.488-38.016 55.936 55.936 0 0 0-39.424-14.784z"></path></svg></div>';
const darkenPageStyle = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 9999; }`;

// 样式
if (bottomBar) {
    GM_addStyle(`
        .fs-gui-taskbar {
            height: 3.5vh !important;
            background-color: #dde1e5  !important;
        }
        .fs-gui-taskbar-widgets-apps-item > img {
            height: 2.2vh !important;
            width: 2.2vh !important;
            margin: 0.5vh 0.5vh 0.5vh 0.5vh !important;
        }
        .fs-gui-taskbar-widgets-clock{
            width: 0px  !important;
            height: 0px  !important;
            overflow: hidden  !important;
        }
        .fs-gui-taskbar-widgets-apps-item {
            margin-right: 2vh !important;
        }
        #fs-gui-taskbar-search-field {
            font-size: 13px !important;
        }
        .fs-gui-taskbar-search-icon {
            font-size: 16px !important;
            top: 0.95vh !important;
            left: 4.3vh !important;
        }
        .fs-gui-taskbar-begin {
            height: 3vh !important;
            width: 3vh !important;
            margin: 0.2vh !important;
            border-radius: 60%;
            background-color: #fffefe80 !important;
        }
        button.fs-gui-taskbar-begin.pull-left.btn.btn-default img {
            width: 83% !important;
        }
        #fs-gui-taskbar-search-field {
            height: 90% !important;
            margin: 0.15vh;
            border-radius: 100px;
            border-width: 0.2vh;
            border-style: solid;
            border-color: #c7d2dd;
        }
        #fs-gui-taskbar-search-field:focus-visible {
            border-width: 0.2vh;
            border-style: solid;
            border-color: #8bb2d9;
            outline: -webkit-focus-ring-color auto 0px;
        }
    `);
}
if (bingWallpaper) {
    GM_addStyle(`
        #acwing_body {
            background: white url(https://bingw.jasonzeng.dev) fixed !important;
        }
    `);
}
if (widthAdjustment) {
    GM_addStyle(`
        .container {
            width: auto !important;
            margin: 0px 3px;
        }
    `);
    $(document).ready(function () {
        $('.base_body .container .row').children().removeClass(' col-sm-offset-2 col-sm-8 col-md-offset-2 col-md-9');
        $('.col-md-8').removeClass('col-md-8').addClass('col-md-12');
    })
}
GM_addStyle(`
span.mdViewContent {
    white-space: pre-wrap;
}
.file-explorer-main-field-item.file-explorer-main-field-item-desktop {
    width: 0px;
    height: 0px;
    overflow: hidden;
}
.comment-conent {
    overflow-x: auto;
}
/* 页脚 */
footer#acwing_footer .copyright {
    color: #fff;
}
footer#acwing_footer .copyright a, .links a, footer#acwing_footer .container {
    color: #fff;
}
/* 复制按钮 */
pre.hljs {
    display: flex;
    justify-content: space-between;
}
span.copy-button {
    cursor: pointer;
    background-color: #e6e6e6;
    color: #727378;
    height: 20px;
    font-size: 13px;
    border-radius: 0.3rem;
    padding: 1px 5px;
    margin: 5px;
    box-shadow: 0 0 1px #0000004d;
}
span.copy-button.copied {
    background-color: #07e65196;
    color: #104f2b;
}
/* html2md */
.html2md-panel {
    display: flex;
    justify-content: flex-end;
}
button.html2mdButton {
    height: 30px;
    width: 30px;
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
button.html2mdButton.html2md-view.mdViewed {
    background-color: #ff980057;
    color: #5a3a0c;
}
/* 打卡框 */
.ui.bottom.attached.tab.segment.active {
    padding: 0px;
}
/* 视频bar */
.embed-responsive {
    height: max-content;
    padding-bottom: 0px;
}
.player_bar {
    margin: 2px;
    display: flex;
    justify-content: space-between;
}
.player_bar_go {
    cursor: pointer;
    width: 50px;
    color: #999;
    height: auto;
    font-size: 13px;
    border-radius: 0.3rem;
    padding: 1px 5px;
    margin: 5px;
    border: none;
    background: linear-gradient(-225deg,#d5dbe4,#f8f8f8);
    box-shadow: inset 0 -2px 0 0 #cdcde6,inset 0 0 1px 1px #fff,0 1px 2px 1px rgba(30,35,90,.4);
    display: flex;
    justify-content: center;
    align-items: center;
}
button#player_bar_list_add_new_item_btn {
    height: 30px;
    width: 50px;
    background-color: #00aeec;
    color: #ffffff;
    font-size: 13px;
    border-radius: 0rem 0.5rem 0.5rem 0rem;
    padding: 1px 5px;
    margin: 5px 5px 5px 0px;
    border: none;
    box-shadow: 0 0 1px #0000004d;
}
div#player_bar_list {
    display: grid;
    width: 100%;
    border-radius: 0.3rem 0rem 0rem 0.3rem;
    margin: 5px 0px 5px 0px;
    border: 1px solid #00aeeccc;
}
div#player_bar_list input[type="radio"] {
    appearance: none;
    width: 0;
    height: 0;
    overflow: hidden;
}
div#player_bar_list input[type=radio]:focus {
    outline: 0px;
}
label.player_bar_ul_li_text {
    max-width: 100%;
    height: 90px;
    overflow-x: auto;
    font-weight: 400;
    margin: 0px 4px;
    border: 1px dashed #0000004d;
    padding: 3px;
}
ul#player_bar_ul li button {
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
ul#player_bar_ul {
    list-style-type: none;
    padding-inline-start: 0px;
    display: flex;
    overflow-x: auto;
    max-width: 100%;
    margin: 0px;
}
ul#player_bar_ul li {
    height: 100px;
    width: 80px;
    display: grid;
    overflow: hidden;
    margin: 4px 4px;
    min-width: 100px;
}
label.player_bar_ul_li_text:hover {
    background-color: #eae4dc24;
}
input[type="radio"]:checked + .player_bar_ul_li_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
}

ul#player_bar_ul::-webkit-scrollbar {
width: 5px;
height: 8px;
}
ul#player_bar_ul::-webkit-scrollbar-thumb {
    border-radius: 2px;
    border: 1px solid rgba(56,56,56,.3411764706);
    background-clip: padding-box;
    background-color: #a29bb84a;
    background-image: -webkit-linear-gradient(45deg,hsla(0deg,0%,100%,.4) 25%,transparent 0,transparent 50%,hsla(0deg,0%,100%,.4) 0,hsla(0deg,0%,100%,.4) 75%,transparent 0,transparent);
}
ul#player_bar_ul::-webkit-scrollbar-track {
background-color: #f1f1f1;
border-radius: 5px;
}

label.player_bar_ul_li_text::-webkit-scrollbar {
width: 5px;
height: 7px;
background-color: #aaa;
}
label.player_bar_ul_li_text::-webkit-scrollbar-thumb {
    border: 1px solid rgba(56,56,56,.3411764706);
    background-clip: padding-box;
    background-color: #a29bb84a;
}
label.player_bar_ul_li_text::-webkit-scrollbar-track {
background-color: #f1f1f1;
}
.player_bar_list_add_div {
    display: flex;
    height: 40px;
    margin: 4px 2px;
}
input#player_bar_list_add_input {
    width: 100%;
    height: 30px;
    background-color: #ffffff;
    color: #727378;
    font-size: 13px;
    border-radius: 0.3rem 0rem 0rem 0.3rem;
    padding: 1px 5px;
    margin: 5px 0px 5px 0px;
    border: 1px solid #00aeeccc;
    border-right: none;
    box-shadow: 0 0 1px #0000004d;
}
input#player_bar_list_add_input:focus-visible {
    border-width: 2px;
    border-style: solid;
    border-color: #8bb2d9;
    outline: -webkit-focus-ring-color auto 0px;
}
button#player_bar_list_add_new_item_btn.added {
    background-color: #07e65196;
    color: #104f2b;
}
div#player_bar_go.gone {
    color: #3f5a14;
    font-weight: 600;
    background: linear-gradient(-225deg,#9CCC65,#E6EE9C);
    box-shadow: inset 0 -2px 0 0 #cde3e6, inset 0 0 1px 1px #c6fd7d, 0 1px 2px 1px rgb(30 90 44 / 40%);
}
/* bar修改菜单 */
div#player_bar_menu {
    position: absolute;
    border-width: 1px;
    border-style: solid;
    border-color: #8bb2d9;
    box-shadow: 1px 1px 4px 0px #0000004d;
}
div#player_bar_menu_edit {
    cursor: pointer;
    background-color: #ffffff;
    color: black;
    box-shadow: inset 0px 0px 0px 0px #8bb2d9;
    padding: 2px 6px;
}
div#player_bar_menu_delete {
    cursor: pointer;
    background-color: #ffff;
    box-shadow: inset 0px 1px 0px 0px #8bb2d9;
    color: black;
    padding: 2px 6px;
}
div#player_bar_menu_edit:hover {
    background-color: #00aeec;
    color: white;
}
div#player_bar_menu_delete:hover {
    background-color: #FF5722;
    color: white;
}
/*设置面板*/
div#topNavBar {
    width: 80%;
}
nav.navbar.navbar-inverse.navbar-fixed-top.navbar-expand-lg .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
button.html2mdButton.ACBetter_setting {
    background-color: #56aa56;
    color: white;
    white-space: nowrap;
    float: right;
    height: 30px;
    margin: 10px;
    border: 0px;
}
#ACwingBetter_setting_menu {
    z-index: 9999;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: grid;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 270px;
    transform: translate(-50%, -50%);
    border-radius: 16px;
    background-color: #ecf0ff;
    border: 6px solid #ffffff;
    color: #697e91;
    padding: 10px 20px 20px 20px;
}

#ACwingBetter_setting_menu .tool-box {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    top: 3px;
    right: 3px;
}

#ACwingBetter_setting_menu .btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 10px;
    width: 2rem;
    height: 2rem;
    color: transparent;
    font-size: 0;
    cursor: pointer;
    background-color: #ff000080;
    border: none;
    border-radius: 10px;
    transition: .2s ease all;
}

#ACwingBetter_setting_menu .btn-close:hover {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
    color: #ffffff;
    background-color: #ff0000cc;
    box-shadow: 0 5px 5px 0 #00000026;
}

#ACwingBetter_setting_menu .btn-close:active {
    width: .9rem;
    height: .9rem;
    font-size: .9rem;
    color: #ffffffde;
    --shadow-btn-close: 0 3px 3px 0 #00000026;
    box-shadow: var(--shadow-btn-close);
}

.checkbox-con {
    margin: 10px;
    display: flex;
    align-items: center;
    color: white;
}

#ACwingBetter_setting_menu input[type=checkbox]:focus {
    outline: 0px;
}

.checkbox-con input[type="checkbox"] {
    margin: 0px;
    appearance: none;
    width: 48px;
    height: 24px;
    border: 2px solid #6b8092;
    border-radius: 20px;
    background: #f1e1e1;
    position: relative;
    box-sizing: border-box;
}

.checkbox-con input[type="checkbox"]::before {
    content: "";
    width: 16px;
    height: 16px;
    background: #6b80927a;
    border: 2px solid #6b8092;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(16%, 12%);
    transition: all 0.3s ease-in-out;
}

.checkbox-con input[type="checkbox"]::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.55021 5.84315L17.1568 16.4498L16.4497 17.1569L5.84311 6.55026L6.55021 5.84315Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17.1567 6.55021L6.55012 17.1568L5.84302 16.4497L16.4496 5.84311L17.1567 6.55021Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3C/svg%3E");
    position: absolute;
    top: 0;
    left: 24px;
}

.checkbox-con input[type="checkbox"]:checked {
    border: 2px solid #02c202;
    background: #e2f1e1;
}

.checkbox-con input[type="checkbox"]:checked::before {
    background: rgba(2, 194, 2, 0.5);
    border: 2px solid #02c202;
    transform: translate(160%, 13%);
    transition: all 0.3s ease-in-out;
}

.checkbox-con input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='13' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2302C202' fill-opacity='0.9'/%3E%3C/svg%3E");
    position: absolute;
    top: 3px;
    left: 4px;
}

.checkbox-con label {
    margin: 0px 0px 0px 10px;
    cursor: pointer;
    user-select: none;
}

.ACBetter_setting_list {
    display: flex;
    align-items: center;
    margin-top: 18px;
}

.checkbox-con button {
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
/*设置面板-tip*/
.help_tip {
    margin-right: auto;
}
span.input_label {
    font-size: 14px;
}
.help_tip .tip_text {
    display: none;
    position: absolute;
    color: #697e91;
    font-weight: 400;
    font-size: 14px;
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
    color: #b4b9d4;
    margin-left: 5px;
}
.AtBetter_setting_menu .AtBetter_setting_menu_label_text .help_tip .help-icon {
    color: #7fbeb2;
}
.help_tip .help-icon:hover + .tip_text, .help_tip .tip_text:hover {
    display: block;
    cursor: help;
    width: 250px;
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

// 隐藏顶栏
if (hideNavbar & href.includes("/problem/content/")) {
    GM_addStyle(`
    nav.navbar {
        display: none;
    }    
    .base_body {
        padding-top: 10px !important;
    }
    `);
};

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
        url: "https://greasyfork.org/zh-CN/scripts/464981.json",
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

// 随机数生成
function getRandomNumber(numDigits) {
    let min = Math.pow(10, numDigits - 1);
    let max = Math.pow(10, numDigits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 设置面板
$(document).ready(function () {
    $("#topNavBar").after(
        "<button class='html2mdButton ACBetter_setting'>AcWingBetter设置</button>"
    );
});

const ACwingBetterSettingMenuHTML = `
    <div class='checkbox-con' id='ACwingBetter_setting_menu'>
    <div class="tool-box">
        <button class="btn-close">×</button>
    </div>
    <h3>AcWingBetter设置</h3>
    <div class='ACBetter_setting_list'>
        <input type="checkbox" id="bottomBar" name="bottomBar" checked>
        <label for="bottomBar">美化底栏</label>
    </div>
    <div class='ACBetter_setting_list'>
        <input type="checkbox" id="hideNavbar" name="hideNavbar" checked>
        <label for="hideNavbar">题目页隐藏顶栏</label>
    </div>
    <div class='ACBetter_setting_list'>
        <input type="checkbox" id="bingWallpaper" name="bingWallpaper" checked>
        <label for="bingWallpaper">Bing每日壁纸</label>
    </div>
    <div class='ACBetter_setting_list'>
        <input type="checkbox" id="widthAdjustment" name="widthAdjustment" checked>
        <label for="widthAdjustment">页面宽屏</label>
    </div>
    <div class='ACBetter_setting_list'>
        <input type="checkbox" id="autoPlay" name="autoPlay" checked>
        <label for="autoPlay">不自动播放视频</label>
    </div>
    <div class='ACBetter_setting_list'>
        <input type="checkbox" id="acTimer" name="acTimer" checked>
        <label for="acTimer">开启AC计时器</label>
    </div>
    <br>
    <button id='save'>保存</button>
    </div>
`;

$(document).ready(function () {
    $(".ACBetter_setting").click(function () {
        const styleElement = GM_addStyle(darkenPageStyle);

        $(".ACBetter_setting").attr("disabled", true);
        $(".ACBetter_setting").css("background-color", "#e6e6e6");
        $(".ACBetter_setting").css("color", "#727378");
        $(".ACBetter_setting").css("cursor", "not-allowed");
        $("body").append(ACwingBetterSettingMenuHTML);

        addDraggable($('#ACwingBetter_setting_menu'));
        $("#bottomBar").prop("checked", GM_getValue("bottomBar"));
        $("#hideNavbar").prop("checked", GM_getValue("hideNavbar"));
        $("#bingWallpaper").prop("checked", GM_getValue("bingWallpaper"));
        $("#widthAdjustment").prop("checked", GM_getValue("widthAdjustment"));
        $("#autoPlay").prop("checked", GM_getValue("autoPlay"));
        $("#acTimer").prop("checked", GM_getValue("acTimer"));

        $("#save").click(function () {
            GM_setValue("bottomBar", $("#bottomBar").prop("checked"));
            GM_setValue("hideNavbar", $("#hideNavbar").prop("checked"));
            GM_setValue("bingWallpaper", $("#bingWallpaper").prop("checked"));
            GM_setValue("widthAdjustment", $("#widthAdjustment").prop("checked"));
            GM_setValue("autoPlay", $("#autoPlay").prop("checked"));
            GM_setValue("acTimer", $("#acTimer").prop("checked"));
            $(styleElement).remove();
            location.reload();
        });
        // 关闭
        $("#ACwingBetter_setting_menu .btn-close").click(function () {
            $("#ACwingBetter_setting_menu").remove();
            $(".ACBetter_setting").attr("disabled", false);
            $(".ACBetter_setting").css("background-color", "#56aa56");
            $(".ACBetter_setting").css("color", "white");
            $(".ACBetter_setting").css("cursor", "pointer");
            $(styleElement).remove();
        })
    });
});

// html2md转换/处理规则
let turndownService = new TurndownService();

turndownService.keep(['del']);

// 丢弃
turndownService.addRule('remove-by-class', {
    filter: function (node) {
        return node.classList.contains('html2md-panel') ||
            node.classList.contains('html2mdButton');
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

// code block
turndownService.addRule('pre', {
    filter: 'pre',
    replacement: function (content, node) {
        let t = $(node).attr("class").split(/\s+/).slice(-1);
        if (t == "hljs") t = "";
        return "```" + t + "\n" + content.trim() + "\n```";
    }
});

// inline math
turndownService.addRule('inline-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "MathJax";
    },
    replacement: function (content, node) {
        return "$" + $(node).next().text() + "$";
    }
});

// block math
turndownService.addRule('block-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "div" && node.className == "MathJax_Display";
    },
    replacement: function (content, node) {
        return "\n$$\n" + $(node).next().text() + "\n$$\n";
    }
});

// 按钮面板
function addButtonPanel(parent, suffix, type) {
    let htmlString = `<div class='html2md-panel'>
    <button class='html2mdButton html2md-view${suffix}'>MarkDown视图</button>
    <button class='html2mdButton html2md-cb${suffix}'>Copy</button>
  </div>`;
    if (type === "this_level") {
        $(parent).before(htmlString);
    } else if (type === "child_level") {
        $(parent).prepend(htmlString);
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
            target = $(".html2md-cb" + suffix).parent().next().eq(0).clone();
        } else if (type === "child_level") {
            target = $(".html2md-cb" + suffix).parent().parent().eq(0).clone();
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

// 代码块复制按钮
function codeCopy() {
    $('.hljs code').each(function () {
        let codeBlock = $(this);
        let id = "_" + getRandomNumber(8);
        let beforeButton = $('<button>').text("Copy").addClass(`html2mdButton copy-button${id}`);
        let wrapperDiv = $('<div>').addClass('copy-div');
        $(wrapperDiv).append(beforeButton);
        $(wrapperDiv).css({
            display: "flex",
            justifyContent: "flex-end"
        });
        codeBlock.parent().before(wrapperDiv);

        $(document).on("click", `.copy-button${id}`, debounce(function () {
            GM_setClipboard(codeBlock.text().replace(/\n+$/, ''));
            // 更新复制按钮文本
            var self = this;
            $(self).addClass('copied');
            $(self).text("Copied");
            var self = this;
            setTimeout(function () {
                $(self).removeClass('copied');
                $(self).text("Copy");
            }, 2000);
        }));
    });
}

function addConversionButton() {
    // 添加按钮到content部分
    if (!window.location.href.includes("code")) {
        $('div[data-field-name="content"]').each(function () {
            let id = "_question-oi-bd_" + getRandomNumber(8);
            addButtonPanel(this, id, "this_level");
            addButtonWithHTML2MD(this, id, "this_level");
            addButtonWithCopy(this, id, "this_level");
        });
    }

    // 为代码块添加复制按钮
    codeCopy();
};

// 播放器添加节点标签功能
function addPlayerBar(player_bar_video) {
    $('.prism-player').after(`
        <div class='player_bar'>
            <div class='player_bar_list' id='player_bar_list'>
                <ul class='player_bar_ul' id='player_bar_ul'></ul>
            </div>
            <div class='player_bar_go' id='player_bar_go'>Go!</div>
        </div>
        <div class='player_bar_list_add_div'>
            <input class='player_bar_list_add_input' type='text' id='player_bar_list_add_input' placeholder='在这里输入备注内容，点击Add添加一个时间点标记；选中一个标记，点击Go跳转；右键标记，修改或删除'>
            </input>
            <button class='player_bar_list_add_button' id='player_bar_list_add_new_item_btn'>Add</button>
        </div>
    `);

    // 页面路径标识
    const PAGE_IDENTIFIER = window.location.href;
    // 计数器
    let counter = 0;

    // 获取数据
    function getListData() {
        let data = GM_getValue("cookieData");
        if (!data) {
            data = {};
        } else {
            data = JSON.parse(data);
        }
        if (!data[PAGE_IDENTIFIER]) {
            data[PAGE_IDENTIFIER] = [];
        }
        return data[PAGE_IDENTIFIER];
    }

    // 保存数据
    function saveListData(data) {
        let cookieData = GM_getValue("cookieData");
        if (cookieData) {
            cookieData = JSON.parse(cookieData);
        } else {
            cookieData = {};
        }
        cookieData[PAGE_IDENTIFIER] = data;
        GM_setValue("cookieData", JSON.stringify(cookieData));
    }

    // 创建新的li元素
    function createListItemElement(text) {
        const li = $("<li></li>");
        const radio = $("<input type='radio' name='player_bar_ul'></input>").appendTo(li);
        radio.attr("id", counter++);
        const label = $("<label class='player_bar_ul_li_text'></label>").text(text).attr("for", radio.attr("id")).appendTo(li);

        li.on("contextmenu", (event) => {
            event.preventDefault();
            const menu = $("#player_bar_menu");
            menu.css({ display: "block", left: event.pageX, top: event.pageY });

            const deleteItem = $("#player_bar_menu_delete");
            const editItem = $("#player_bar_menu_edit");

            function onDelete() {
                deleteItem.off("click", onDelete);
                const list = $("#player_bar_ul");
                const index = Array.from(list.children()).indexOf(li.get(0));
                const data = getListData();
                data.splice(index, 1);
                saveListData(data);
                li.remove();
                menu.css({ display: "none" });
            }

            function onEdit() {
                editItem.off("click", onEdit);
                const list = $("#player_bar_ul");
                const index = Array.from(list.children()).indexOf(li.get(0));
                const data = getListData();
                label.text(data[index].text);
                const text = prompt("请输入修改后的内容", label.text());
                if (text !== undefined && text !== null) {
                    data[index].text = text.trim();
                    saveListData(data);
                }
                renderList();
                menu.css({ display: "none" });
            }

            deleteItem.on("click", onDelete);
            editItem.on("click", onEdit);

            $(document).on("click", (event) => {
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
        const listContainer = $("#player_bar_list");
        const list = $("#player_bar_ul");
        list.empty();
        const data = getListData();
        data.forEach((item) => {
            list.append(createListItemElement(item.text));
        });
    }

    // 新增列表项
    function addNewItem() {
        const input = $("#player_bar_list_add_input");
        const text = input.val().trim();
        if (text === "") {
            alert("请输入内容");
            return;
        }
        const data = getListData();
        data.push({ text: text, time: player_bar_video.currentTime });
        saveListData(data);
        const list = $("#player_bar_ul");
        list.append(createListItemElement(text));
        input.val("");
    }

    // 为添加按钮添加事件处理程序
    const player_bar_add_button = $("#player_bar_list_add_new_item_btn");
    player_bar_add_button.on("click", () => {
        addNewItem();
        player_bar_add_button.addClass('added');
        player_bar_add_button.text("Added");
        setTimeout(() => {
            player_bar_add_button.removeClass('added');
            player_bar_add_button.text("Add");
        }, 2000);
    });

    // 渲染列表
    renderList();

    // 跳转按钮
    const click_player_bar_go = $("#player_bar_go");
    click_player_bar_go.on("click", () => {
        const selected = $('input[name="player_bar_ul"]:checked');
        if (selected.length) {
            const data = getListData();
            const index = selected.parent().index();
            player_bar_video.currentTime = data[index].time;
            click_player_bar_go.addClass('gone');
            click_player_bar_go.text("Gone");
            setTimeout(() => {
                click_player_bar_go.removeClass('gone');
                click_player_bar_go.text("Go!");
            }, 2000);
        } else {
            alert("请选择一项");
        }
    });

    // 创建自定义菜单
    const menu = $("<div id='player_bar_menu' style='display: none;'></div>");
    menu.html(`
        <div id='player_bar_menu_edit'>修改</div>
        <div id='player_bar_menu_delete'>删除</div>
    `);
    $("body").append(menu);
}

function formatTime(time) {
    var seconds = Math.floor((time / 1000) % 60);
    var minutes = Math.floor((time / (1000 * 60)) % 60);
    var hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    var days = Math.floor(time / (1000 * 60 * 60 * 24));

    var timeString = '';

    if (days > 0) {
        timeString += days + '天';
    }

    if (hours > 0) {
        timeString += hours + '小时';
    }

    if (minutes > 0) {
        timeString += minutes + '分钟';
    }

    if (seconds > 0) {
        timeString += seconds + '秒';
    }

    return timeString;
}

// AC计时器
function acTiming() {
    var startTime = new Date();
    var timer = setInterval(function () {
        var status = $('#submit-code-status-value-id').text().trim();

        if (status === 'Accepted') {
            clearInterval(timer);

            var endTime = new Date();
            var totalTime = endTime - startTime;

            var timeString = formatTime(totalTime);
            $('#submit-code-status-value-id').after('<div class="time-info">耗时：' + timeString + ' 要重新开始计时请刷新页面</div>');
        }
    }, 500);
}

$(document).ready(function () {
    if (acTimer && window.location.href.includes("/problem/content/")) acTiming();
    // 让某些链接在新窗口打开
    var regExps = [
        /常用代码模板/,
        /example/,
        /test/
    ];
    var aTags = document.getElementsByTagName('a');
    for (var i = 0; i < aTags.length; i++) {
        for (var j = 0; j < regExps.length; j++) {
            if (regExps[j].test(aTags[i].textContent)) {
                aTags[i].setAttribute('target', '_blank');
                break;
            }
        }
    }
    // 自动恢复进度条
    (function checkAndPlay() {
        if ($('.play-jump').length > 0) {
            $('.play-jump').click();
            if (GM_getValue("autoPlay") === true) {
                let player_bar_video = document.querySelector('video');
                if (!player_bar_video.paused) player_bar_video.pause();
            }
        } else {
            setTimeout(checkAndPlay, 500);
        }
    })();
    // 调整视频高度
    $('.prism-player').height($('.prism-player').width() / 1.7);

    // 添加按钮
    addConversionButton();
    // 移除广告元素
    let ADidADList = ["1024-activity", "test"];
    ADtraverseDom(document.body);
    function ADtraverseDom(node) {
        if (node.nodeType === Node.ELEMENT_NODE && ADidADList.includes(node.id)) {
            node.parentNode.removeChild(node);
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                ADtraverseDom(node.childNodes[i]);
            }
        }
    }
    // 修改打卡页代码框默认高度
    var element = document.getElementById("martor-content");
    if (element) {
        var style = window.getComputedStyle(element);
        element.style.height = "55vh";
    }

    var player_bar_video = document.querySelector('video');
    if (player_bar_video != null) addPlayerBar(player_bar_video);
});