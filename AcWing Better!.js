// ==UserScript==
// @name         AcWing Better!
// @version      3.23
// @description  AcWing界面美化，功能增强，视频时间点标记跳转，代码markdown一键复制
// @author       北极小狐
// @match        https://www.acwing.com/*
// @icon         https://aowuucdn.oss-cn-beijing.aliyuncs.com/acwing.png
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @connect      greasyfork.org
// @run-at       document-end
// @require      https://cdn.bootcdn.net/ajax/libs/turndown/7.1.1/turndown.min.js
// @license      MIT
// @namespace    https://greasyfork.org/users/747162
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

const bottomBar = getGMValue("bottomBar", true);
const bingWallpaper = getGMValue("bingWallpaper", true);
const widthAdjustment = getGMValue("widthAdjustment", true);
const autoPlay = getGMValue("autoPlay", true);

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
    /* 去除没用的图标 */
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
        cursor: pointer;
        background-color: #e6e6e6;
        color: #727378;
        height: 30px;
        width: auto;
        font-size: 13px;
        border-radius: 0.3rem;
        border: none;
        padding: 1px 5px;
        margin: 5px;
        box-shadow: 0 0 1px #0000004d;
    }
    button.html2mdButton.copied {
        background-color: #07e65196;
        color: #104f2b;
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
    /*更新检查*/
    div#update_panel {
        position: fixed;
        top: 50%;
        left: 50%;
        width: 240px;
        transform: translate(-50%, -50%);
        background-color: #fdfdfd;
        border: 1px solid #00aeeccc;
        border-radius: 5px;
        box-shadow: 2px 2px 3px 1px #0000004d;
        padding: 10px 20px 20px 20px;
        color: #444242;
        background-color: #ecf0ff;
        border: 6px solid #ffffff;
        border-radius: 16px;
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
`);

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
            if (scriptData.name === GM_info.script.name && compareVersions(scriptData.version, GM_info.script.version) === 1) {
                $("body").append(`
					<div id='update_panel'>
						<h3>${GM_info.script.name}有新版本！</h3>
						<hr>
						<div class='update_panel_menu'>
                            <span class ='tip'>版本信息：${GM_info.script.version} → ${scriptData.version}</span>
						</div>
						<br>
						<button id='updating'><a target="_blank" href="${scriptData.url}">更新</a></button>
					</div>
				`);
            }
        }
    });
})();

// 设置面板
$(document).ready(function () {
    $("#topNavBar").after(
        "<button class='html2mdButton ACBetter_setting'>ACwingBetter设置</button>"
    );
});

$(document).ready(function () {
    $(".ACBetter_setting").click(function () {
        $(".ACBetter_setting").attr("disabled", true);
        $(".ACBetter_setting").css("background-color", "#e6e6e6");
        $(".ACBetter_setting").css("color", "#727378");
        $(".ACBetter_setting").css("cursor", "not-allowed");
        $("body").append(`
					<div class='checkbox-con' id='ACwingBetter_setting_menu'>
                        <div class="tool-box">
		                    <button class="btn-close">×</button>
	                    </div>
						<h3>ACwingBetter设置</h3>
						<hr>
						<div class='ACBetter_setting_list'>
							<input type="checkbox" id="bottomBar" name="bottomBar" checked>
							<label for="bottomBar">美化底栏</label>
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
						<br>
						<button id='save'>保存</button>
					</div>
				`);
        $("#save").click(function () {
            GM_setValue("bottomBar", $("#bottomBar").prop("checked"));
            GM_setValue("bingWallpaper", $("#bingWallpaper").prop("checked"));
            GM_setValue("widthAdjustment", $("#widthAdjustment").prop("checked"));
            GM_setValue("autoPlay", $("#autoPlay").prop("checked"));
            location.reload();
        });
        $("#bottomBar").prop("checked", GM_getValue("bottomBar"));
        $("#bingWallpaper").prop("checked", GM_getValue("bingWallpaper"));
        $("#widthAdjustment").prop("checked", GM_getValue("widthAdjustment"));
        $("#autoPlay").prop("checked", GM_getValue("autoPlay"));
        // 关闭
        $("#ACwingBetter_setting_menu .btn-close").click(function () {
            $("#ACwingBetter_setting_menu").remove();
            $(".ACBetter_setting").attr("disabled", false);
            $(".ACBetter_setting").css("background-color", "#56aa56");
            $(".ACBetter_setting").css("color", "white");
            $(".ACBetter_setting").css("cursor", "pointer");
        })
    });
});

// 添加复制按钮
function addCopy() {
    // 获取所有 .hljs 中的代码块
    const codeBlocks = document.querySelectorAll('.hljs code');

    // 循环遍历每个代码块
    codeBlocks.forEach(codeBlock => {
        // 创建一个 span 元素，并设置样式
        const beforeButton = document.createElement('span');
        beforeButton.textContent = "Copy";
        beforeButton.className = 'copy-button';
        // 在代码块前面插入按钮
        codeBlock.parentNode.insertBefore(beforeButton, codeBlock.nextSibling);
        // 为按钮添加点击事件
        beforeButton.addEventListener('click', event => {
            // 创建临时文本域
            const textarea = document.createElement('textarea');
            textarea.value = codeBlock.textContent.replace(/\n+$/, '');
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);


            // 更新复制按钮文本
            beforeButton.classList.add('copied');
            beforeButton.textContent = "Copied";
            setTimeout(() => {
                beforeButton.classList.remove('copied');
                beforeButton.textContent = "Copy";
            }, 2000);
        }, false);
    });
}

// 移除复制按钮
function removeCopy() {
    var elements = document.querySelectorAll('.hljs .copy-button');
    for (var i = 0; i < elements.length; i++) {
        elements[i].parentNode.removeChild(elements[i]);
    }

}

$(document).ready(function () {
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
    setTimeout(function () {
        try {
            document.querySelector('.play-jump').click();
            if (GM_getValue("autoPlay") === true) {
                let player_bar_video = document.querySelector('video');
                if (!player_bar_video.paused) player_bar_video.pause();
            }
        } catch (error) {
            // do nothing
        }
    }, 3000);
    // 复制按钮
    addCopy();
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
});

// MarkDown

$(document).ready(function () {
    let debug = false; // whether to enable on editor

    let turndownService = new TurndownService();

    turndownService.keep(['del']);

    // code block
    turndownService.addRule('pre', {
        filter: 'pre',
        replacement: function (content, node) {
            let t = $(node).attr("class").split(/\s+/).slice(-1);
            if (t == "hljs") t = "";
            return "```" + t + "\n" + content.trim() + "\n```";
        }
    });

    // remove <script> math
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

    // add buttons
    $("div[data-tab='preview-tab-content']").each(function () {
        if (debug || $(this).prev().attr('data-tab') != "editor-tab-content")
            $(this).before(
                "<div class='html2md-panel'> <button class='html2mdButton html2md-view'>MarkDown视图</button> <button class='html2mdButton html2md-cb'>Copy</button> </div>"
            );
    });

    $(".html2md-cb").click(function () {
        let target = $(this).parent().next().get(0);
        if (!target.markdown) {
            removeCopy();
            target.markdown = turndownService.turndown($(target).html());
            addCopy();
        }
        const textarea = document.createElement('textarea');
        textarea.value = target.markdown;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        // console.log(markdown);
        $(this).addClass("copied");
        $(this).text("Copied");
        // 更新复制按钮文本
        setTimeout(() => {
            $(this).removeClass("copied");
            $(this).text("Copy");
        }, 2000);
    });

    $(".html2md-view").click(function () {
        let target = $(this).parent().next().get(0);
        if (target.viewmd) {
            target.viewmd = false;
            $(this).text("MarkDown视图");
            $(this).removeClass("mdViewed");
            $(target).html(target.original_html);
            addCopy();
        } else {
            target.viewmd = true;
            removeCopy();
            if (!target.original_html)
                target.original_html = $(target).html();
            if (!target.markdown)
                target.markdown = turndownService.turndown($(target).html());
            $(this).text("原始内容");
            $(this).addClass("mdViewed");
            $(target).html(`<span oninput="$(this).parent().get(0).markdown=this.value;" style="width:auto; height:auto; white-space: pre;">${target.markdown}</span>`);
        }
    });
});


// 播放器添加节点标签功能
function addPlayerBar(player_bar_video) {
    // 创建元素
    var player = document.querySelector('.prism-player');
    var player_bar = document.createElement('div');
    player_bar.classList.add('player_bar');
    player.parentNode.insertBefore(player_bar, player.nextSibling);

    var player_bar_list = document.createElement('div');
    player_bar_list.classList.add('player_bar_list');
    player_bar_list.setAttribute("id", "player_bar_list");
    player_bar.appendChild(player_bar_list);

    var player_bar_ul = document.createElement('ul');
    player_bar_ul.classList.add('player_bar_ul');
    player_bar_ul.setAttribute("id", "player_bar_ul");
    player_bar_list.appendChild(player_bar_ul);

    var player_bar_go = document.createElement('div');
    player_bar_go.classList.add('player_bar_go');
    player_bar_go.setAttribute("id", "player_bar_go");
    var player_bar_goText = document.createTextNode("Go!");
    player_bar_go.appendChild(player_bar_goText);
    player_bar.appendChild(player_bar_go);

    var player_bar_list_add_div = document.createElement('div');
    player_bar_list_add_div.classList.add('player_bar_list_add_div');
    player_bar.parentNode.insertBefore(player_bar_list_add_div, player_bar.nextSibling);

    var player_bar_list_add_input = document.createElement('input');
    player_bar_list_add_input.classList.add('player_bar_list_add_input');
    player_bar_list_add_input.setAttribute("type", "text");
    player_bar_list_add_input.setAttribute("id", "player_bar_list_add_input");
    player_bar_list_add_input.setAttribute("placeholder", "在这里输入备注内容，点击Add添加一个时间点标记；选中一个标记，点击Go跳转；右键标记，修改或删除");
    player_bar_list_add_div.appendChild(player_bar_list_add_input);

    var player_bar_list_add_button = document.createElement('button');
    player_bar_list_add_button.classList.add('player_bar_list_add_button');
    player_bar_list_add_button.setAttribute("id", "player_bar_list_add_new_item_btn");
    var player_bar_list_add_buttonText = document.createTextNode("Add");
    player_bar_list_add_button.appendChild(player_bar_list_add_buttonText);
    player_bar_list_add_div.appendChild(player_bar_list_add_button);

    //存储cookie的名称和标识符
    const COOKIE_NAME = "listItems";
    const PAGE_IDENTIFIER = window.location.href;
    //计数器
    let counter = 0;

    //获取GM值中的数据
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

    //将数据保存到GM值中
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

    //创建新的li元素
    function createListItemElement(text) {
        const li = document.createElement("li");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "player_bar_ul";
        radio.id = counter++;
        li.appendChild(radio);
        const label = document.createElement("label");
        label.textContent = text;
        label.classList.add("player_bar_ul_li_text");
        label.setAttribute("for", radio.id);
        li.appendChild(label);
        li.addEventListener("contextmenu", (event) => {
            //阻止默认右键菜单
            event.preventDefault();
            //显示菜单
            menu.style.display = "block";
            menu.style.left = event.pageX + "px";
            menu.style.top = event.pageY + "px";

            const deleteItem = document.getElementById("player_bar_menu_delete");
            const editItem = document.getElementById("player_bar_menu_edit");

            function onDelete() {
                deleteItem.removeEventListener("click", onDelete);
                const list = document.getElementById("player_bar_ul");
                const index = Array.from(list.children).indexOf(li);
                const data = getListData();
                data.splice(index, 1);
                saveListData(data);
                li.remove();
                menu.style.display = "none";
            }

            function onEdit() {
                editItem.removeEventListener("click", onEdit);
                const list = document.getElementById("player_bar_ul");
                const index = Array.from(list.children).indexOf(li);
                const data = getListData();
                label.textContent = data[index].text;
                const text = prompt("请输入修改后的内容", label.textContent);
                if (text !== undefined && text !== null) {
                    data[index].text = text.trim();
                    saveListData(data);
                }
                renderList();//重新渲染
                menu.style.display = "none";
            }

            deleteItem.addEventListener("click", onDelete);
            editItem.addEventListener("click", onEdit);

            document.addEventListener("click", (event) => {
                //点击菜单外部，隐藏菜单并移除事件监听器
                if (!menu.contains(event.target)) {
                    menu.style.display = "none";
                    // 移除所有事件监听器
                    deleteItem.removeEventListener("click", onDelete);
                    editItem.removeEventListener("click", onEdit);
                }
            });
        });
        return li;
    }

    //渲染列表
    function renderList() {
        const listContainer = document.getElementById("player_bar_list");
        const list = document.getElementById("player_bar_ul");
        list.innerHTML = "";
        const data = getListData();
        data.forEach((item) => {
            list.appendChild(createListItemElement(item.text));
        });
    }

    //新增列表项
    function addNewItem() {
        const input = document.getElementById("player_bar_list_add_input");
        const text = input.value.trim();
        if (text === "") {
            alert("请输入内容");
            return;
        }
        const data = getListData();
        data.push({ text: text, time: player_bar_video.currentTime });
        saveListData(data);
        const list = document.getElementById("player_bar_ul");
        list.appendChild(createListItemElement(text));
        input.value = "";
    }

    //为添加按钮添加事件处理程序
    var player_bar_add_button = document.getElementById("player_bar_list_add_new_item_btn")
    player_bar_add_button.addEventListener("click", () => {
        addNewItem();
        player_bar_add_button.classList.add('added');
        player_bar_add_button.textContent = "Added";
        setTimeout(() => {
            player_bar_add_button.classList.remove('added');
            player_bar_add_button.textContent = "Add";
        }, 2000);
    });

    //在页面加载时渲染列表
    renderList();

    //为跳转按钮添加事件处理程序
    var click_player_bar_go = document.getElementById("player_bar_go");
    click_player_bar_go.addEventListener("click", () => {
        const selected = document.querySelector('input[name="player_bar_ul"]:checked');
        if (selected) {
            const data = getListData();
            const index = Array.from(selected.parentNode.parentNode.children).indexOf(selected.parentNode);
            player_bar_video.currentTime = data[index].time;
            click_player_bar_go.classList.add('gone');
            click_player_bar_go.textContent = "Gone";
            setTimeout(() => {
                click_player_bar_go.classList.remove('gone');
                click_player_bar_go.textContent = "Go!";
            }, 2000);
        } else {
            alert("请选择一项");
        }
    });

    //创建自定义菜单
    const menu = document.createElement("div");
    menu.id = "player_bar_menu";
    menu.style.display = "none";
    menu.innerHTML = `
        <div id="player_bar_menu_edit">修改</div>
        <div id="player_bar_menu_delete">删除</div>
    `;
    document.body.appendChild(menu);
}

$(document).ready(function () {
    var player_bar_video = document.querySelector('video');
    if (player_bar_video != null) addPlayerBar(player_bar_video);
});