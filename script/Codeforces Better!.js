// ==UserScript==
// @name         Codeforces Better!
// @namespace    https://greasyfork.org/users/747162
// @version      1.70
// @description  Codeforces界面汉化、黑暗模式支持、题目翻译、markdown视图、一键复制题目、跳转到洛谷、评论区分页、ClistRating分显示、榜单重新着色、题目页代码编辑器、快捷提交，在线测试运行，自定义样例测试、LSP服务，编辑器自定义代码补全
// @author       北极小狐
// @match        *://*.codeforces.com/*
// @match        *://*.codeforc.es/*
// @run-at       document-start
// @connect      www2.deepl.com
// @connect      www.iflyrec.com
// @connect      m.youdao.com
// @connect      api.interpreter.caiyunai.com
// @connect      translate.google.com
// @connect      openai.api2d.net
// @connect      api.openai.com
// @connect      www.luogu.com.cn
// @connect      clist.by
// @connect      greasyfork.org
// @connect      rextester.com
// @connect      wandbox.org
// @connect      staticfile.org
// @connect      127.0.0.1
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_getResourceText
// @icon         https://aowuucdn.oss-cn-beijing.aliyuncs.com/codeforces.png
// @require      https://cdn.staticfile.org/turndown/7.1.2/turndown.min.js
// @require      https://cdn.staticfile.org/markdown-it/13.0.1/markdown-it.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// @require      https://cdn.staticfile.org/chroma-js/2.4.2/chroma.min.js
// @require      https://cdn.staticfile.org/xterm/3.9.2/xterm.min.js
// @require      https://cdn.staticfile.org/dexie/3.2.4/dexie.min.js
// @resource     acwing_cpp_code_completer https://aowuucdn.oss-cn-beijing.aliyuncs.com/acwing_cpp_code_completer-0.0.11.json
// @resource     wandboxlist https://wandbox.org/api/list.json
// @resource     xtermcss https://cdn.staticfile.org/xterm/3.9.2/xterm.min.css
// @license      GPL3
// @compatible	 Chrome
// @compatible	 Firefox
// @compatible	 Edge
// @incompatible safari
// @supportURL   https://github.com/beijixiaohu/OJBetter/issues
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
var lastReadAnnounceVer = getGMValue("lastReadAnnounceVer", "0");
var darkMode = getGMValue("darkMode", "follow");
var hostAddress = location.origin;
var is_mSite, is_acmsguru, is_oldLatex, is_contest, is_problem, is_completeProblemset, is_problemset_problem, is_problemset, is_cfStandings, is_submitPage;
var bottomZh_CN, showLoading, hoverTargetAreaDisplay, expandFoldingblocks, renderPerfOpt, translation, commentTranslationChoice;
var ttTree, memoryTranslateHistory, autoTranslation, shortTextLength;
var openai_model, openai_key, openai_proxy, openai_header, openai_data, openai_isStream, opneaiConfig;
var commentTranslationMode, retransAction, transWaitTime, taskQueue, allowMixTrans, mixedTranslation, replaceSymbol, filterTextWithoutEmphasis;
var commentPaging, showJumpToLuogu, loaded;
var showClistRating_contest, showClistRating_problem, showClistRating_problemset, RatingHidden, clist_Authorization;
var standingsRecolor, problemPageCodeEditor, cppCodeTemplateComplete, CompletConfig;
var compilerSelection, editorFontSize, onlineCompilerChoice, isCodeSubmitConfirm;
var CF_csrf_token;
var monacoLoaderOnload = false, monacoSocket = [], editor, useLSP, OJBetter_Bridge_WorkUri, OJBetter_Bridge_SocketUrl;
var monacoEditor_language = [], monacoEditor_position, monacoEditor_position_init = false;
function init() {
    const { hostname, href } = window.location;
    is_mSite = /^m[0-9]/.test(hostname);
    is_oldLatex = $('.tex-span').length;
    is_acmsguru = href.includes("acmsguru") && href.includes('/problem/');
    is_contest = /\/contest\/[\d\/\s]+$/.test(href) && !href.includes('/problem/');
    is_problem = href.includes('/problem/');
    is_completeProblemset = /problems\/?$/.test(href);
    is_problemset_problem = href.includes('/problemset/') && href.includes('/problem/');
    is_problemset = href.includes('/problemset') && !href.includes('/problem/');
    is_submitPage = href.includes('/submit');
    is_cfStandings = href.includes('/standings') &&
        $('.standings tr:first th:nth-child(n+5)')
            .map(function () {
                return $(this).find('span').text();
            })
            .get()
            .every(score => /^[0-9]+$/.test(score));
    bottomZh_CN = getGMValue("bottomZh_CN", true);
    showLoading = getGMValue("showLoading", true);
    hoverTargetAreaDisplay = getGMValue("hoverTargetAreaDisplay", false);
    expandFoldingblocks = getGMValue("expandFoldingblocks", true);
    renderPerfOpt = getGMValue("renderPerfOpt", false);
    commentPaging = getGMValue("commentPaging", true);
    showJumpToLuogu = getGMValue("showJumpToLuogu", true);
    standingsRecolor = getGMValue("standingsRecolor", true);
    loaded = getGMValue("loaded", false);
    translation = getGMValue("translation", "deepl");
    commentTranslationMode = getGMValue("commentTranslationMode", "0");
    commentTranslationChoice = getGMValue("commentTranslationChoice", "0");
    memoryTranslateHistory = getGMValue("memoryTranslateHistory", true);
    autoTranslation = getGMValue("autoTranslation", false);
    shortTextLength = getGMValue("shortTextLength", "2000");
    retransAction = getGMValue("retransAction", "0");
    transWaitTime = getGMValue("transWaitTime", "200");
    allowMixTrans = getGMValue("allowMixTrans", true);
    mixedTranslation = getGMValue("mixedTranslation", ['deepl', 'iflyrec', 'youdao', 'caiyun']);
    taskQueue = new TaskQueue();
    replaceSymbol = getGMValue("replaceSymbol", "2");
    filterTextWithoutEmphasis = getGMValue("filterTextWithoutEmphasis", false);
    showClistRating_contest = getGMValue("showClistRating_contest", false);
    showClistRating_problem = getGMValue("showClistRating_problem", false);
    showClistRating_problemset = getGMValue("showClistRating_problemset", false);
    RatingHidden = getGMValue("RatingHidden", false);
    clist_Authorization = getGMValue("clist_Authorization", "");
    //openai
    openai_isStream = getGMValue("openai_isStream", true);
    opneaiConfig = getGMValue("chatgpt-config", {
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
    // 编辑器
    if (!is_mSite) CF_csrf_token = Codeforces.getCsrfToken();
    else CF_csrf_token = "";
    compilerSelection = getGMValue("compilerSelection", "61");
    editorFontSize = getGMValue("editorFontSize", "15");
    problemPageCodeEditor = getGMValue("problemPageCodeEditor", true);
    cppCodeTemplateComplete = getGMValue("cppCodeTemplateComplete", true);
    onlineCompilerChoice = getGMValue("onlineCompilerChoice", "official");
    isCodeSubmitConfirm = getGMValue("isCodeSubmitConfirm", true);
    //自定义补全
    CompletConfig = getGMValue("Complet_config", {
        "choice": -1,
        "configurations": []
    });
    /**
    * 加载monaco编辑器资源
    */
    useLSP = getGMValue("useLSP", false);
    monacoEditor_position = getGMValue("monacoEditor_position", "initial");
    OJBetter_Bridge_WorkUri = getGMValue("OJBetter_Bridge_WorkUri", "C:/OJBetter_Bridge");
    OJBetter_Bridge_SocketUrl = getGMValue("OJBetter_Bridge_SocketUrl", "ws://127.0.0.1:2323/");
    let monacoLoader = document.createElement("script");
    monacoLoader.src = "https://cdn.staticfile.org/monaco-editor/0.44.0/min/vs/loader.min.js";
    document.head.prepend(monacoLoader);
    monacoLoader.onload = () => {
        require.config({
            paths: { vs: "https://cdn.staticfile.org/monaco-editor/0.44.0/min/vs" },
            "vs/nls": { availableLanguages: { "*": "zh-cn" } },
        });
        require(["vs/editor/editor.main"], () => {
            monacoLoaderOnload = true;
        });
    }
}

// 公告
async function showAnnounce() {
    if (lastReadAnnounceVer < GM_info.script.version) {
        const title = "已更新至1.71"
        const content = `
#### 更新日志

- 更新 clist rating 的API为v4，调整题目页的数据获取方式为通过API获取，感谢 @wrkwrk 的建议

- 添加 ChatGPT 翻译 “流式传输” 选项，默认开启

- 修复 Google 翻译结果为空的问题 感谢 @shicxin 的反馈

- 添加一个配置开关 "代码提交是否二次确认" ，默认开启 感谢 @Rikkual 的建议

- 在完整题目集页中添加小区域的按钮

- 修复完整题目集页右键打印时不显示翻译结果的问题 感谢 @zfs732 的反馈

#### 作者有话说

对于功能故障（比如接口问题），一旦收到反馈，作者会立即进行修复并将更改提交至 [Github仓库](https://github.com/beijixiaohu/OJBetter/commits/main/)

然而，请注意，这些修复**不会**立即以更新的形式发布。因此，如果你发现了一个可能的功能故障，请先前往 Github 查看是否已经修复。

除非遇到严重问题，否则作者倾向于不发布零星的更新，而是将修改积累起来，待到合适的时机一并发布。
`;
        const ok = await createDialog(title, content, ["我知道了", null], undefined, true); //跳过折叠块确认
        if (ok) {
            GM_setValue('lastReadAnnounceVer', GM_info.script.version);
        }
    }
};

// 显示警告消息
function ShowAlertMessage() {
    if (is_oldLatex) {
        let newElement = $("<div></div>").addClass("alert alert-warning ojbetter-alert")
            .html(`${OJBetterName} —— 注意：当前页面存在未保存原 LaTeX 代码的 LaTeX 公式（这通常是一道古老的题目），这导致脚本无法将其还原回 LaTeX，因此当前页面部分功能不适用。
                <br>此外当前页面的翻译功能采用了特别的实现方式，因此可能会出现排版错位的情况。`)
            .css({ "margin": "1em", "text-align": "center", "position": "relative" });
        $(".menu-box:first").next().after(newElement);
    }
    if (is_acmsguru) {
        let newElement = $("<div></div>").addClass("alert alert-warning ojbetter-alert")
            .html(`${OJBetterName} —— 注意：当前页面为 acmsguru 题目（这是一道非常古老的题目），部分功能不适用。
                <br>此外当前页面的翻译功能采用了特别的实现方式，因此可能会出现排版错位的情况。`)
            .css({ "margin": "1em", "text-align": "center", "position": "relative" });
        $(".menu-box:first").next().after(newElement);
    }
    if (commentTranslationMode == "1") {
        let newElement = $("<div></div>").addClass("alert alert-error CFBetter_alert")
            .html(`${OJBetterName} —— 注意！当前为分段翻译模式，这会造成负面效果，<p>除非你现在需要翻译超长篇的博客或者题目，否则请前往设置切换为普通模式</p>`)
            .css({ "margin": "1em", "text-align": "center", "position": "relative" });
        $(".menu-box:first").next().after(newElement);
    }
    if (commentTranslationMode == "2") {
        let newElement = $("<div></div>").addClass("alert alert-error CFBetter_alert")
            .html(`${OJBetterName} —— 注意！当前为选段翻译模式，只会翻译目标区域内已选中的部分，点击段落以选中（橙色框）<br>
            <p>如果你现在不需要翻译超长篇的博客或者题目，建议你请前往设置切换为普通模式</p>`)
            .css({ "margin": "1em", "text-align": "center", "position": "relative" });
        $(".menu-box:first").next().after(newElement);
    }
    if (is_submitPage && problemPageCodeEditor) {
        let newElement = $("<div></div>").addClass("alert alert-warning CFBetter_alert")
            .html(`${OJBetterName} —— 你已开启 “题目页添加编辑器” 选项，在问题页下方即可快速提交哦<br>
            <p>${findHelpText2}</p>`)
            .css({ "margin": "1em", "text-align": "center", "position": "relative" });
        $(".menu-box:first").next().after(newElement);
    }
}

// 常量
const OJBetterName = 'Codeforces Better!';
const findHelpText1 = '\n\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/465777/feedback 或者 https://github.com/beijixiaohu/OJBetter/issues 寻求帮助\n\n';
const findHelpText2 = '如遇问题，请前往 https://greasyfork.org/zh-CN/scripts/465777/feedback 或者 https://github.com/beijixiaohu/OJBetter/issues 反馈';
const helpCircleHTML = '<div class="help-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592 0-42.944-14.08-76.736-42.24-101.376-28.16-25.344-65.472-37.312-111.232-37.312zm-12.672 406.208a54.272 54.272 0 0 0-38.72 14.784 49.408 49.408 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.848 54.848 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.968 51.968 0 0 0-15.488-38.016 55.936 55.936 0 0 0-39.424-14.784z"></path></svg></div>';
const unfoldIcon = `<svg t="1695971616104" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2517" width="18" height="18"><path d="M747.451 527.394L512.376 707.028l-235.071-185.71a37.975 37.975 0 0 0-23.927-8.737 38 38 0 0 0-29.248 13.674 37.984 37.984 0 0 0 4.938 53.552l259.003 205.456c14.013 11.523 34.219 11.523 48.231 0l259.003-199.002a37.974 37.974 0 0 0 5.698-53.552 37.982 37.982 0 0 0-53.552-5.315z m0 0" p-id="2518"></path><path d="M488.071 503.845c14.013 11.522 34.219 11.522 48.231 0l259.003-199.003a37.97 37.97 0 0 0 13.983-25.591 37.985 37.985 0 0 0-8.285-27.959 37.97 37.97 0 0 0-25.591-13.979 37.985 37.985 0 0 0-27.96 8.284L512.376 425.61 277.305 239.899a37.974 37.974 0 0 0-23.927-8.736 37.993 37.993 0 0 0-29.248 13.674 37.984 37.984 0 0 0 4.938 53.552l259.003 205.456z m0 0" p-id="2519"></path></svg>`;
const putawayIcon = `<svg t="1695971573189" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2266" width="18" height="18"><path d="M276.549 496.606l235.075-179.634 235.071 185.711a37.975 37.975 0 0 0 23.927 8.737 38 38 0 0 0 29.248-13.674 37.986 37.986 0 0 0-4.938-53.552L535.929 238.737c-14.013-11.523-34.219-11.523-48.231 0L228.695 437.739a37.974 37.974 0 0 0-5.698 53.552 37.982 37.982 0 0 0 53.552 5.315z m0 0" p-id="2267"></path><path d="M535.929 520.155c-14.013-11.522-34.219-11.522-48.231 0L228.695 719.158a37.97 37.97 0 0 0-13.983 25.591 37.985 37.985 0 0 0 8.285 27.959 37.97 37.97 0 0 0 25.591 13.979 37.985 37.985 0 0 0 27.96-8.284L511.624 598.39l235.071 185.711a37.974 37.974 0 0 0 23.927 8.736 37.993 37.993 0 0 0 29.248-13.674 37.984 37.984 0 0 0-4.938-53.552L535.929 520.155z m0 0" p-id="2268"></path></svg>`;
const closeIcon = `<svg t="1696693011050" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4322" width="14" height="14"><path d="M0 0h1024v1024H0z" fill-opacity="0" p-id="4323"></path><path d="M240.448 168l2.346667 2.154667 289.92 289.941333 279.253333-279.253333a42.666667 42.666667 0 0 1 62.506667 58.026666l-2.133334 2.346667-279.296 279.210667 279.274667 279.253333a42.666667 42.666667 0 0 1-58.005333 62.528l-2.346667-2.176-279.253333-279.253333-289.92 289.962666a42.666667 42.666667 0 0 1-62.506667-58.005333l2.154667-2.346667 289.941333-289.962666-289.92-289.92a42.666667 42.666667 0 0 1 57.984-62.506667z" p-id="4324"></path></svg>`;
const copyIcon = `<svg t="1695970366492" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2499" width="16" height="16"><path d="M720 192h-544A80.096 80.096 0 0 0 96 272v608C96 924.128 131.904 960 176 960h544c44.128 0 80-35.872 80-80v-608C800 227.904 764.128 192 720 192z m16 688c0 8.8-7.2 16-16 16h-544a16 16 0 0 1-16-16v-608a16 16 0 0 1 16-16h544a16 16 0 0 1 16 16v608z" p-id="2500"></path><path d="M848 64h-544a32 32 0 0 0 0 64h544a16 16 0 0 1 16 16v608a32 32 0 1 0 64 0v-608C928 99.904 892.128 64 848 64z" p-id="2501"></path><path d="M608 360H288a32 32 0 0 0 0 64h320a32 32 0 1 0 0-64zM608 520H288a32 32 0 1 0 0 64h320a32 32 0 1 0 0-64zM480 678.656H288a32 32 0 1 0 0 64h192a32 32 0 1 0 0-64z" p-id="2502"></path></svg>`;
const copyedIcon = `<svg t="1697105956577" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="986" width="16" height="16"><path d="M928 612.8V144c0-44.8-35.2-80-80-80H304c-17.6 0-32 14.4-32 32s14.4 32 32 32h544c8 0 16 8 16 16v425.6c-19.2-9.6-41.6-16-64-17.6V272c0-44.8-35.2-80-80-80H176c-44.8 0-80 35.2-80 80v608c0 44.8 35.2 80 80 80h460.8c36.8 27.2 83.2 43.2 132.8 43.2 126.4 0 227.2-100.8 227.2-227.2 0-64-27.2-121.6-68.8-163.2zM176 896c-8 0-16-8-16-16V272c0-8 8-16 16-16h544c8 0 16 8 16 16v280c-108.8 16-193.6 110.4-193.6 224 0 44.8 12.8 84.8 33.6 120H176z m593.6 72c-19.2 0-36.8-3.2-54.4-8-38.4-11.2-72-33.6-96-64-25.6-32-41.6-75.2-41.6-120 0-94.4 67.2-172.8 158.4-188.8 11.2-1.6 22.4-3.2 33.6-3.2 11.2 0 20.8 0 30.4 1.6 22.4 3.2 44.8 11.2 64 22.4 25.6 14.4 48 35.2 64 59.2 20.8 30.4 33.6 68.8 33.6 108.8 0 107.2-84.8 192-192 192z" p-id="987"></path>
<path d="M608 360H288c-17.6 0-32 14.4-32 32s14.4 32 32 32h320c17.6 0 32-14.4 32-32s-14.4-32-32-32z m0 160H288c-17.6 0-32 14.4-32 32s14.4 32 32 32h320c17.6 0 32-14.4 32-32s-14.4-32-32-32z m-128 158.4H288c-17.6 0-32 14.4-32 32s14.4 32 32 32h192c17.6 0 32-14.4 32-32s-14.4-32-32-32zM731.2 886.4c-6.4 0-11.2-1.6-16-6.4l-73.6-73.6c-9.6-9.6-9.6-22.4 0-32s22.4-9.6 32 0l57.6 57.6 137.6-137.6c9.6-9.6 22.4-9.6 32 0s9.6 22.4 0 32L747.2 880c-4.8 3.2-9.6 6.4-16 6.4z" p-id="988"></path></svg>`;
const translateIcon = `<svg t="1696837407077" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6325" width="22" height="22"><path d="M536.380952 121.904762a73.142857 73.142857 0 0 1 73.142858 73.142857v219.428571h219.428571a73.142857 73.142857 0 0 1 73.142857 73.142858v341.333333a73.142857 73.142857 0 0 1-73.142857 73.142857H487.619048a73.142857 73.142857 0 0 1-73.142858-73.142857v-219.428571H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142858V195.047619a73.142857 73.142857 0 0 1 73.142857-73.142857h341.333333zM243.809524 682.666667v97.523809h97.523809v73.142857h-97.523809a73.142857 73.142857 0 0 1-73.142857-73.142857v-97.523809h73.142857z m585.142857-195.047619h-219.428571v48.761904a73.142857 73.142857 0 0 1-73.142858 73.142858h-48.761904v219.428571h341.333333V487.619048z m-115.760762 89.526857L787.21219 780.190476h-62.025142l-14.043429-42.715428h-76.068571L620.739048 780.190476h-60.854858l74.605715-203.044571h78.701714z m-38.034286 50.029714h-3.510857l-21.065143 63.488h45.348572l-20.772572-63.488zM536.380952 195.047619H195.047619v341.333333h341.333333V195.047619z 
m-195.072 49.883429l44.78781 1.072762v37.278476h87.698286v145.359238h-87.698286v65.974857h-44.78781v-65.974857h-87.698285v-145.359238h87.698285v-38.351238z m0 83.139047h-44.787809v56.05181h44.787809v-56.05181z m89.307429 0h-44.519619v56.05181h44.519619v-56.05181zM780.190476 170.666667a73.142857 73.142857 0 0 1 73.142857 73.142857v97.523809h-73.142857v-97.523809h-97.523809V170.666667h97.523809z" p-id="6326"></path></svg>`;
const clistIcon = `<svg width="37.7pt" height="10pt" viewBox="0 0 181 48" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="#0057b8ff"><path fill="#0057b8" opacity="1.00" d=" M 17.36 0.00 L 18.59 0.00 C 23.84 6.49 30.28 11.92 36.01 17.98 C 34.01 19.99 32.01 21.99 30.00 23.99 C 26.02 19.97 22.02 15.98 18.02 11.99 C 14.01 15.98 10.01 19.99 6.00 23.99 C 4.16 22.04 2.30 20.05 0.00 18.61 L 0.00 17.37 C 3.44 15.11 6.00 11.84 8.96 9.03 C 11.79 6.05 15.09 3.47 17.36 0.00 Z" /></g><g id="#a0a0a0ff"><path fill="#a0a0a0" opacity="1.00" d=" M 56.76 13.74 C 61.48 4.80 76.07 3.90 81.77 12.27 C 83.09 13.94 83.44 16.10 83.91 18.12 C 81.53 18.23 79.16 18.24 76.78 18.23 C 75.81 15.72 73.99 13.31 71.14 12.95 C 67.14 12.02 63.45 15.29 62.48 18.99 C 61.30 23.27 61.71 28.68 65.34 31.70 C 67.82 34.05 72.19 33.93 74.61 31.55 C 75.97 30.18 76.35 28.23 76.96 26.48 C 79.36 26.43 81.77 26.44 84.17 26.56 C 83.79 30.09 82.43 33.49 79.89 36.02 C 74.14 41.35 64.17 40.80 58.77 35.25 C 53.52 29.56 53.18 20.38 56.76 13.74 Z" />
<path fill="#a0a0a0" opacity="1.00" d=" M 89.01 7.20 C 91.37 7.21 93.74 7.21 96.11 7.22 C 96.22 15.71 96.10 24.20 96.18 32.69 C 101.25 32.76 106.32 32.63 111.39 32.79 C 111.40 34.86 111.41 36.93 111.41 39.00 C 103.94 39.00 96.47 39.00 89.00 39.00 C 89.00 28.40 88.99 17.80 89.01 7.20 Z" /><path fill="#a0a0a0" opacity="1.00" d=" M 115.00 7.21 C 117.33 7.21 119.66 7.21 121.99 7.21 C 122.01 17.81 122.00 28.40 122.00 39.00 C 119.67 39.00 117.33 39.00 115.00 39.00 C 115.00 28.40 114.99 17.80 115.00 7.21 Z" /><path fill="#a0a0a0" opacity="1.00" d=" M 133.35 7.47 C 139.11 5.56 146.93 6.28 150.42 11.87 C 151.42 13.39 151.35 15.31 151.72 17.04 C 149.33 17.05 146.95 17.05 144.56 17.03 C 144.13 12.66 138.66 11.12 135.34 13.30 C 133.90 14.24 133.54 16.87 135.35 17.61 C 139.99 20.02 145.90 19.54 149.92 23.19 C 154.43 26.97 153.16 35.36 147.78 37.72 C 143.39 40.03 137.99 40.11 133.30 38.69 C 128.80 37.34 125.34 32.90 125.91 28.10 C 128.22 28.10 130.53 28.11 132.84 28.16 C 132.98 34.19 142.68 36.07 145.18 30.97 C 146.11 27.99 142.17 27.05 140.05 26.35 C 135.54 25.04 129.83 24.33 127.50 19.63 C 125.30 14.78 128.42 9.00 133.35 7.47 Z" />
<path fill="#a0a0a0" opacity="1.00" d=" M 153.31 7.21 C 161.99 7.21 170.67 7.21 179.34 7.21 C 179.41 9.30 179.45 11.40 179.48 13.50 C 176.35 13.50 173.22 13.50 170.09 13.50 C 170.05 21.99 170.12 30.48 170.05 38.98 C 167.61 39.00 165.18 39.00 162.74 39.00 C 162.64 30.52 162.73 22.04 162.69 13.55 C 159.57 13.49 156.44 13.49 153.32 13.50 C 153.32 11.40 153.31 9.31 153.31 7.21 Z" /></g><g id="#ffd700ff"><path fill="#ffd700" opacity="1.00" d=" M 12.02 29.98 C 14.02 27.98 16.02 25.98 18.02 23.98 C 22.01 27.99 26.03 31.97 30.00 35.99 C 34.01 31.99 38.01 27.98 42.02 23.99 C 44.02 25.98 46.02 27.98 48.01 29.98 C 42.29 36.06 35.80 41.46 30.59 48.00 L 29.39 48.00 C 24.26 41.42 17.71 36.08 12.02 29.98 Z" /></g></svg>`;
const darkenPageStyle = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 200; }`;
const darkenPageStyle2 = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 300; }`;

// 连接数据库
var CFBetterDB;
function initDB() {
    CFBetterDB = new Dexie('CFBetterDB');
    CFBetterDB.version(2).stores({
        samplesData: `&url`,
        editorCode: `&url`,
        translateData: `&url`
    });
}

// 切换系统黑暗监听
const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
const changeEventListeners = [];
function handleColorSchemeChange(event) {
    event.matches ? $('html').attr('data-theme', 'dark') : $('html').attr('data-theme', 'light');
    if (!event.matches) {
        var originalColor = $(this).data("original-color");
        $(this).css("background-color", originalColor);
        if (editor) {
            monaco.editor.setTheme('vs');
        }
    } else {
        if (editor) {
            monaco.editor.setTheme('vs-dark');
        }
    }
}

// 黑暗模式
(function setDark() {
    // 初始化
    function setDarkTheme() {
        const htmlElement = document.querySelector('html');
        if (htmlElement) {
            htmlElement.setAttribute('data-theme', 'dark');
        } else {
            setTimeout(setDarkTheme, 100);
        }
    }
    if (darkMode == "dark") {
        setDarkTheme();
    } else if (darkMode == "follow") {
        // 添加事件监听器
        changeEventListeners.push(handleColorSchemeChange);
        mediaQueryList.addEventListener('change', handleColorSchemeChange);

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkTheme();
    }

    GM_addStyle(`
        /* 黑暗支持 */
        html[data-theme=dark]:root {
            color-scheme: light dark;
        }
        /* 文字颜色1 */
        html[data-theme=dark] .title,html[data-theme=dark] .problem-statement,
        html[data-theme=dark] .ttypography, html[data-theme=dark] .roundbox, html[data-theme=dark] .info,
        html[data-theme=dark] .ttypography .bordertable, html[data-theme=dark] .ttypography .bordertable thead th,
        html[data-theme=dark] .ttypography h1, html[data-theme=dark] .ttypography h2, html[data-theme=dark] .ttypography h3,
        html[data-theme=dark] .ttypography h4, html[data-theme=dark] .ttypography h5, html[data-theme=dark] .ttypography h6
        html[data-theme=dark] .datatable table, html[data-theme=dark] .problem-statement .sample-tests pre,
        html[data-theme=dark] .alert-success, html[data-theme=dark] .alert-info, html[data-theme=dark] .alert-error,
        html[data-theme=dark] .alert-warning, html[data-theme=dark] .markItUpEditor, html[data-theme=dark] #pageContent,
        html[data-theme=dark] .ace-chrome .ace_gutter, html[data-theme=dark] .translate-problem-statement,
        html[data-theme=dark] .setting-name, html[data-theme=dark] .CFBetter_setting_menu, html[data-theme=dark] .help_tip .tip_text,
        html[data-theme=dark] textarea, html[data-theme=dark] .user-black, html[data-theme=dark] .comments label.show-archived,
        html[data-theme=dark] .comments label.show-archived *, html[data-theme=dark] table,
        html[data-theme=dark] #items-per-page, html[data-theme=dark] #pagBar, html[data-theme=dark] .CFBetter_setting_sidebar li a:link,
        html[data-theme=dark] .popup .content{
            color: #a0adb9 !important;
        }
        html[data-theme=dark] h1 a, html[data-theme=dark] h2 a, html[data-theme=dark] h3 a, html[data-theme=dark] h4 a{
            color: #adbac7;
        }
        /* 文字颜色2 */
        html[data-theme=dark] .contest-state-phase, html[data-theme=dark] .legendary-user-first-letter,
        html[data-theme=dark] .lang-chooser,
        html[data-theme=dark] .second-level-menu-list li a, html[data-theme=dark] #footer,
        html[data-theme=dark] .ttypography .tt, html[data-theme=dark] select,
        html[data-theme=dark] .roundbox .caption, html[data-theme=dark] .topic .title *,
        html[data-theme=dark] .user-admin, html[data-theme=dark] button.html2mdButton:hover,
        html[data-theme=dark] .CFBetter_modal button, html[data-theme=dark] #CFBetter_statusBar,
        html[data-theme=dark] #RunTestButton, html[data-theme=dark] #programTypeId, html[data-theme=dark] #addCustomTest,
        html[data-theme=dark] #customTestBlock{
            color: #9099a3 !important;
        }
        /* 文字颜色3 */
        html[data-theme=dark] button.html2mdButton, html[data-theme=dark] #program-source-text-copy{
            color: #6385a6;
        }
        html[data-theme=dark] input{
            color: #6385a6 !important;
        }
        /* 文字颜色4 */
        html[data-theme=dark] .ttypography .MathJax, html[data-theme=dark] .MathJax span{
            color: #cbd6e2 !important;
        }
        /* 链接颜色 */
        html[data-theme=dark] a:link {
            color: #3989c9;
        }
        html[data-theme=dark] a:visited {
            color: #8590a6;
        }
        html[data-theme=dark] .menu-box a, html[data-theme=dark] .sidebox th a{
            color: #9099a3 !important;
        }
        /* 按钮 */
        html[data-theme=dark] .second-level-menu-list li.backLava {
            border-radius: 6px;
            overflow: hidden;
            filter: invert(1) hue-rotate(.5turn);
        }
        html[data-theme=dark] input:hover{
            background-color: #22272e !important;
        }
        /* 背景层次1 */
        html[data-theme=dark] body, html[data-theme=dark] .ttypography .bordertable thead th,
        html[data-theme=dark] .datatable table, html[data-theme=dark] .datatable .dark, html[data-theme=dark] li#add_button,
        html[data-theme=dark] .problem-statement .sample-tests pre, html[data-theme=dark] .markItUpEditor,
        html[data-theme=dark] .SumoSelect>.CaptionCont, html[data-theme=dark] .SumoSelect>.optWrapper,
        html[data-theme=dark] .SumoSelect>.optWrapper.multiple>.options li.opt span i, html[data-theme=dark] .ace_scroller,
        html[data-theme=dark] .CFBetter_setting_menu, html[data-theme=dark] .help_tip .tip_text, html[data-theme=dark] li#add_button:hover,
        html[data-theme=dark] textarea, html[data-theme=dark] .state, html[data-theme=dark] .ace-chrome .ace_gutter-active-line,
        html[data-theme=dark] .sidebar-menu ul li:hover, html[data-theme=dark] .sidebar-menu ul li.active,
        html[data-theme=dark] label.config_bar_ul_li_text:hover, html[data-theme=dark] button.html2mdButton:hover,
        html[data-theme=dark] .CFBetter_setting_sidebar li a.active, html[data-theme=dark] .CFBetter_setting_sidebar li,
        html[data-theme=dark] .CFBetter_setting_menu::-webkit-scrollbar-track, html[data-theme=dark] .CFBetter_setting_content::-webkit-scrollbar-track,
        html[data-theme=dark] .CFBetter_modal, html[data-theme=dark] .CFBetter_modal button:hover,
        html[data-theme=dark] .popup .content, html[data-theme=dark] .file.input-view .text, html[data-theme=dark] .file.output-view .text,
        html[data-theme=dark] .file.answer-view .text, html[data-theme=dark] .file.checker-comment-view .text,
        html[data-theme=dark] .config_bar_list, html[data-theme=dark] #CFBetter_SubmitForm .topDiv div#lspStateDiv,
        html[data-theme=dark] #LSPLog,
         html[data-theme=dark] .CFBetter_setting_menu .CFBetter_checkboxs,
        html[data-theme=dark] .CFBetter_setting_menu .CFBetter_checkboxs input[type="checkbox"]::before{
            background-color: #22272e !important;
        }
        /* 背景层次2 */
        html[data-theme=dark] .roundbox, html[data-theme=dark] .roundbox .dark, html[data-theme=dark] .bottom-links,
        html[data-theme=dark] button.html2mdButton, html[data-theme=dark] .spoiler-content, html[data-theme=dark] input,
        html[data-theme=dark] .problem-statement .test-example-line-even, html[data-theme=dark] .highlight-blue,
        html[data-theme=dark] .ttypography .tt, html[data-theme=dark] select,
        html[data-theme=dark] .alert-success, html[data-theme=dark] .alert-info, html[data-theme=dark] .alert-error,
        html[data-theme=dark] .alert-warning, html[data-theme=dark] .SumoSelect>.optWrapper>.options li.opt:hover,
        html[data-theme=dark] .input-output-copier:hover, html[data-theme=dark] .translate-problem-statement-panel,
        html[data-theme=dark] .aceEditorTd, html[data-theme=dark] .ace-chrome .ace_gutter,
        html[data-theme=dark] .translate-problem-statement, html[data-theme=dark] .datatable,
        html[data-theme=dark] .CFBetter_setting_list,
        html[data-theme=dark] .CFBetter_setting_menu hr, 
        html[data-theme=dark] .highlighted-row td, html[data-theme=dark] .highlighted-row th,
        html[data-theme=dark] .pagination span.active, html[data-theme=dark] .CFBetter_setting_sidebar li a,
        html[data-theme=dark] .CFBetter_setting_menu::-webkit-scrollbar-thumb, html[data-theme=dark] .CFBetter_setting_content::-webkit-scrollbar-thumb,
        html[data-theme=dark] .CFBetter_modal button, html[data-theme=dark] .test-for-popup pre,
        html[data-theme=dark] .popup .content pre, html[data-theme=dark] .popup .content pre code,
        html[data-theme=dark] ul.config_bar_ul::-webkit-scrollbar-thumb,  html[data-theme=dark] #CFBetter_statusBar,
        html[data-theme=dark] #RunTestButton, html[data-theme=dark] #programTypeId, html[data-theme=dark] .sampleDiv,
        html[data-theme=dark] #addCustomTest, html[data-theme=dark] #LSPLog li:nth-child(odd),
        html[data-theme=dark] .CFBetter_setting_menu .CFBetter_checkboxs input[type="checkbox"]:checked::before{
            background-color: #2d333b !important;
        }
        /* 实线边框颜色-圆角 */
        html[data-theme=dark] .roundbox, html[data-theme=dark] .roundbox .rtable td,
        html[data-theme=dark] button.html2mdButton, html[data-theme=dark] .sidebar-menu ul li,
        html[data-theme=dark] input, html[data-theme=dark] .ttypography .tt, html[data-theme=dark] #items-per-page,
        html[data-theme=dark] .datatable td, html[data-theme=dark] .datatable th,
        html[data-theme=dark] .alert-success, html[data-theme=dark] .alert-info, html[data-theme=dark] .alert-error,
        html[data-theme=dark] .alert-warning, html[data-theme=dark] .translate-problem-statement,
        html[data-theme=dark] textarea, html[data-theme=dark] .input-output-copier{
            border: 1px solid #424b56 !important;
            border-radius: 2px;
        }
        /* 实线边框颜色-无圆角 */
        html[data-theme=dark] .CFBetter_setting_list, html[data-theme=dark] .config_bar_list,
        html[data-theme=dark] label.config_bar_ul_li_text, html[data-theme=dark] .problem-statement .sample-tests .input,
        html[data-theme=dark] .problem-statement .sample-tests .output, html[data-theme=dark] .pagination span.active,
        html[data-theme=dark] .CFBetter_setting_sidebar li, html[data-theme=dark] .CFBetter_setting_menu select,
        html[data-theme=dark] .translate-problem-statement-panel, html[data-theme=dark] .CFBetter_modal button,
        html[data-theme=dark] .test-for-popup pre, html[data-theme=dark] #CFBetter_editor, html[data-theme=dark] #CFBetter_statusBar,
        html[data-theme=dark] #RunTestButton, html[data-theme=dark] #programTypeId, html[data-theme=dark] #customTestBlock,
        html[data-theme=dark] #addCustomTest, html[data-theme=dark] #CFBetter_SubmitForm .topDiv div#lspStateDiv,
        html[data-theme=dark] #CompilerSetting select, html[data-theme=dark] #CompilerSetting textarea, html[data-theme=dark] #CompilerBox,
        html[data-theme=dark] .CFBetter_setting_menu .CFBetter_checkboxs{
            border: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .roundbox .titled, html[data-theme=dark] .roundbox .rtable th {
            border-bottom: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .roundbox .bottom-links, html[data-theme=dark] #footer{
            border-top: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .topic .content {
            border-left: 4px solid #424b56 !important;
        }
        html[data-theme=dark] .CFBetter_setting_sidebar {
            border-right: 1px solid #424b56 !important;
        }
        html[data-theme=dark] hr {
            border-color: #424b56 !important;
        }
        /* 虚线边框颜色 */
        html[data-theme=dark] .comment-table, html[data-theme=dark] li#add_button,
        html[data-theme=dark] .CFBetter_setting_menu_label_text{
            border: 1px dashed #424b56 !important;
        }
        html[data-theme=dark] li#add_button:hover{
            border: 1px dashed #03A9F4 !important;
            background-color: #2d333b !important;
            color: #03A9F4 !important;
        }
        /* 无边框 */
        html[data-theme=dark] .html2md-panel.input-output-copier, html[data-theme=dark] .translateDiv.input-output-copier {
            border: none !important;
        }
        /* 无背景 */
        html[data-theme=dark] .html2md-panel.input-output-copier:hover{
            background-color: #ffffff00 !important;
        }
        /* focus-visible */
        html[data-theme=dark] input:focus-visible, html[data-theme=dark] textarea, html[data-theme=dark] select{
            border-width: 1.5px !important;
            outline: none;
        }
        /* 图片-亮度 */
        html[data-theme=dark] img, html[data-theme=dark] #facebox .popup a{
            opacity: .75; 
        }
        /* 反转 */
        html[data-theme=dark] .SumoSelect>.CaptionCont>label>i, html[data-theme=dark] .delete-resource-link,
        html[data-theme=dark] #program-source-text, html[data-theme=dark] .spoiler-content pre,
        html[data-theme=dark] .popup .content pre code{
            filter: invert(1) hue-rotate(.5turn);
        }
        /* 区域遮罩 */
        html[data-theme=dark] .overlay::before {
            background: repeating-linear-gradient(135deg, #49525f6e, #49525f6e 30px, #49525f29 0px, #49525f29 55px);
            color: #9099a3;
            text-shadow: 0px 0px 2px #000000;
        }
        /* 阴影 */
        html[data-theme=dark] .translate-problem-statement-panel, html[data-theme=dark] .translate-problem-statement{
            box-shadow: 0px 0px 0.5px 0.5px #30353b;
        }
        /* 其他样式 */
        html[data-theme=dark] .rated-user{
            display: initial;
        }
        html[data-theme=dark] .datatable .ilt, html[data-theme=dark] .datatable .irt,
        html[data-theme=dark] .datatable .ilb, html[data-theme=dark] .datatable .irb,
        html[data-theme=dark] .datatable .lt, html[data-theme=dark] .datatable .rt,
        html[data-theme=dark] .datatable .lb, html[data-theme=dark] .datatable .rb{
            background: none;
        }
        html[data-theme=dark] .problems .accepted-problem td.id{
            border-left: 6px solid #47837d !important;
        }
        html[data-theme=dark] .problems .rejected-problem td.id{
            border-left: 6px solid #ef9a9a !important;
        }
        html[data-theme=dark] .problems .accepted-problem td.act {
            background-color: #47837d !important;
            border-radius: 0px;
        }
        html[data-theme=dark] .problems .rejected-problem td.act{
            background-color: #ef9a9a !important;
            border-radius: 0px;
        }
        html[data-theme=dark] .CFBetter_setting_menu, html[data-theme=dark] .CFBetter_modal{
            box-shadow: 0px 0px 0px 4px #2d333b;
            border: 1px solid #2d333b;
        }
        html[data-theme=dark] .collapsible-topic.collapsed .content .collapsible-topic-options:before{
            background-image: linear-gradient(#22272e00, #22272e);
        }
        html[data-theme=dark] .alert{
            text-shadow: none;
        }
        html[data-theme=dark] input[type="radio"]:checked+.CFBetter_setting_menu_label_text {
            color: #a0adb9 !important;
            border: 1px solid #326154 !important;
        }
        /* 评测状态文字颜色 */
        html[data-theme=dark] .verdict-accepted, html[data-theme=dark] .verdict-accepted-challenged,
        html[data-theme=dark] .verdict-successful-challenge{
            color: #0a0 !important;
        }
        html[data-theme=dark] .verdict-failed, html[data-theme=dark] .verdict-challenged{
            color: red !important;
        }
        html[data-theme=dark] .verdict-rejected, html[data-theme=dark] .verdict-unsuccessful-challenge{
            color: #673ab7 !important;
        }
        html[data-theme=dark] .verdict-waiting {
            color: gray !important;
        }
        /* 样例hover样式 */
        html[data-theme=dark] .test-example-line-odd:hover, html[data-theme=dark] .test-example-line-odd.darkhighlight {
          background-color: #455a64;
        }
    `);
})()

/**
 * 黑暗模式额外的处理事件
 */
function darkModeStyleAdjustment() {
    $(".test-example-line").off("mouseenter mouseleave"); // 移除上面原本的事件
    $('.test-example-line-odd').hover(
        function () {
            $(this).addClass('darkhighlight');
            $(this).prevUntil(':not(.test-example-line-odd)').addClass('darkhighlight');
            $(this).nextUntil(':not(.test-example-line-odd)').addClass('darkhighlight');
        },
        function () {
            $(this).removeClass('darkhighlight');
            $(this).prevUntil(':not(.test-example-line-odd)').removeClass('darkhighlight');
            $(this).nextUntil(':not(.test-example-line-odd)').removeClass('darkhighlight');
        }
    );
}

// 样式
GM_addStyle(`
html {
    scroll-behavior: smooth;
}
:root {
    --vp-font-family-base: "Chinese Quotes", "Inter var", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
span.mdViewContent {
    white-space: pre-wrap;
}
/*翻译区域提示*/
.overlay::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(135deg, #97e7cacc, #97e7cacc 30px, #e9fbf1cc 0px, #e9fbf1cc 55px);
    z-index: 100;
}

.overlay::after {
    content: '目标区域';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #00695C;
    font-size: 16px;
    font-weight: bold;
    z-index: 100;
}
/*翻译div*/
/* 特殊处理，加上input-output-copier类, 让convertStatementToText方法忽略该元素 */
.translateDiv.input-output-copier {
    font-size: initial;
    float: initial;
    color: initial;
    cursor: initial;
    border: none;
    padding: 0px;
    margin: 0px;
    line-height: initial;
    text-transform: none;
}
.translateDiv {
    box-shadow: 0px 0px 0.5px 0.5px #defdf378;
}
.translate-problem-statement {
    justify-items: start;
    letter-spacing: 1.8px;
    color: #059669;
    background-color: #f9f9fa;
    border: 1px solid #c5ebdf;
    border-radius: 0rem 0rem 0.3rem 0.3rem;
    padding: 5px;
    margin: -5px 0px 6px 0px;
    width: 100%;
    box-sizing: border-box;
    font-size: 13px;
}
.translate-problem-statement.error_translate {
  color: red;
  border-color: red;
}
.translate-problem-statement a, .translate-problem-statement a:link {
    color: #10b981;
    font-weight: 600;
    background: 0 0;
    text-decoration: none;
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
.translate-problem-statement-panel{
    display: flex;
    justify-content: space-between;
    background-color: #f9f9fa;
    border: 1px solid #c5ebdf;
    border-radius: 0.3rem;
    margin: 4px 0px;
}
.html2md-panel {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
.html2md-panel a {
    text-decoration: none;
}
.html2mdButton {
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
    margin: 5px !important;
    border: 1px solid #dcdfe6;
}
.html2mdButton[disabled] {
    cursor: not-allowed !important;
    background-color: rgb(255, 255, 255) !important;
    color: rgb(168, 171, 178) !important;
    border: 1px solid rgb(228, 231, 237) !important;
}
.html2mdButton:hover {
    color: #409eff;
    border-color: #409eff;
    background-color: #f1f8ff;
    z-index: 100;
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
.topText {
    display: flex;
    margin-left: 5px;
    color: #9e9e9e;
    font-size: 13px;
    align-items: center;
}
.borderlessButton{
    display: flex;
    align-items: center;
    margin: 2.5px 7px;
    fill: #9E9E9E;
}
.borderlessButton:hover{
    cursor: pointer;
    fill: #059669;
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
.translate-problem-statement p {
    line-height: 20px !important;
}
.problem-statement p:last-child {
    margin-bottom: 0px !important;
}
/*特殊处理, 加上input-output-copier类, 让convertStatementToText方法忽略该元素*/
.html2md-panel.input-output-copier {
    font-size: initial;
    float: initial;
    color: initial;
    cursor: initial;
    border: none;
    padding: 0px;
    margin: 0px;
    line-height: initial;
    text-transform: none;
}
.html2md-panel.input-output-copier:hover {
    background-color: #ffffff00;
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
    border: 1px solid #60a5fa;
}

button.html2mdButton.CFBetter_setting.open {
    background-color: #e6e6e6;
    color: #727378;
    cursor: not-allowed;
}

.CFBetter_setting_menu {
    z-index: 200;
    box-shadow: 0px 0px 0px 4px #ffffff;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 500px;
    min-height: 600px;
    transform: translate(-50%, -50%);
    border-radius: 6px;
    background-color: #f0f4f9;
    border-collapse: collapse;
    border: 1px solid #ffffff;
    color: #697e91;
    font-family: var(--vp-font-family-base);
    padding: 10px 20px 20px 10px;
    box-sizing: content-box;
}
.CFBetter_setting_menu h3 {
    margin-top: 10px;
}
.CFBetter_setting_menu h4 {
    margin: 15px 0px 10px 0px;
}
.CFBetter_setting_menu h4,.CFBetter_setting_menu h5 {
    font-weight: 600;
}
.CFBetter_setting_menu hr {
    border: none;
    height: 1px;
    background-color: #ccc;
    margin: 10px 0;
}
.CFBetter_setting_menu .badge {
    border-radius: 4px;
    border: 1px solid #009688;
    color: #009688;
    font-size: 12px;
    padding: 0.5px 4px;
    margin-left: 5px;
    margin-right: auto;
}
/* 页面切换 */
.settings-page {
    display: none;
}
.settings-page.active {
    display: block;
}
.CFBetter_setting_container {
    display: flex;
}
.CFBetter_setting_sidebar {
    width: 110px;
    padding: 6px 10px 6px 6px;
    margin: 20px 0px;
    border-right: 1px solid #d4d8e9;
}
.CFBetter_setting_content {
    flex-grow: 1;
    width: 360px;
    margin: 20px 0px 0px 20px;
    padding-right: 10px;
    max-height: 580px;
    overflow-y: auto;
    box-sizing: border-box;
}
.CFBetter_setting_sidebar h3 {
    margin-top: 0;
}
.CFBetter_setting_sidebar hr {
    margin-top: 10px;
    margin-bottom: 10px;
    border: none;
    border-top: 1px solid #DADCE0;
}
.CFBetter_setting_sidebar ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
}
.CFBetter_setting_sidebar li {
    margin: 5px 0px;
    background-color: #ffffff;
    border: 1px solid #d4d8e9;
    border-radius: 4px;
    font-size: 16px;
}
.CFBetter_setting_sidebar li a {
    text-decoration: none;
    display: flex;
    width: 100%;
    color: gray;
    letter-spacing: 2px;
    padding: 7px;
    border-radius: 4px;
    align-items: center;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
.CFBetter_setting_sidebar li a.active {
    background-color: #eceff1c7;
}
/* 下拉选择框 */
.CFBetter_setting_menu select {
    appearance: none;
    padding: 5px 10px;
    margin: -5px 0px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
    color: #009688;
    font-size: 15px;
}
.CFBetter_setting_menu select:focus-visible {
    outline: none;
}
/* 数值输入框 */
.CFBetter_setting_menu input[type="number"] {
    width: 40px;
    color: #009688;
    font-size: 15px;
    appearance: none;
    padding: 5px 10px;
    margin: -5px 3px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
}
.CFBetter_setting_menu input[type="number"]:focus-visible {
    outline: none;
}
.CFBetter_setting_menu input[type="number"]::-webkit-inner-spin-button,
.CFBetter_setting_menu input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
/*设置面板-滚动条*/
.CFBetter_setting_menu::-webkit-scrollbar, .CFBetter_setting_content::-webkit-scrollbar {
    width: 5px;
    height: 7px;
    background-color: #aaa;
}
.CFBetter_setting_menu::-webkit-scrollbar-thumb, .CFBetter_setting_content::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
}
.CFBetter_setting_menu::-webkit-scrollbar-track, .CFBetter_setting_content::-webkit-scrollbar-track {
    background-color: #f1f1f1;
}
/*设置面板-关闭按钮*/
.CFBetter_setting_menu .tool-box {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 3px;
    right: 3px;
}

.CFBetter_setting_menu .btn-close {
    cursor: pointer;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    margin: 0px;
    padding: 0px;
    background-color: #ff000080;
    transition: .15s ease all;
    box-sizing: border-box;
    text-align: center;
    color: transparent;
    font-size: 17px;
}

.CFBetter_setting_menu .btn-close:hover {
    color: #ffffff;
    background-color: #ff0000cc;
    box-shadow: 0 5px 5px 0 #00000026;
}

.CFBetter_setting_menu .btn-close:active {
    color: #ffffffde;
    background-color: #ff000080;
}

/*设置面板-checkbox*/
.CFBetter_setting_menu input[type=checkbox]:focus {
    outline: 0px;
}

.CFBetter_setting_menu .CFBetter_setting_list input[type="checkbox"] {
    margin: 0px;
	appearance: none;
    -webkit-appearance: none;
	width: 40px;
	height: 20px;
	border: 1.5px solid #D7CCC8;
    padding: 0px !important;
	border-radius: 20px;
	background: #efebe978;
	position: relative;
	box-sizing: border-box;
}

.CFBetter_setting_menu .CFBetter_setting_list input[type="checkbox"]::before {
	content: "";
    width: 17px;
    height: 17px;
    background: #D7CCC8;
    border: 1.5px solid #BCAAA4;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(2%, 2%);
    transition: all 0.3s ease-in-out;
    box-sizing: border-box;
}

.CFBetter_setting_menu .CFBetter_setting_list input[type="checkbox"]::after {
	content: url("data:image/svg+xml,%3Csvg xmlns='://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.55021 5.84315L17.1568 16.4498L16.4497 17.1569L5.84311 6.55026L6.55021 5.84315Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17.1567 6.55021L6.55012 17.1568L5.84302 16.4497L16.4496 5.84311L17.1567 6.55021Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3C/svg%3E");
	position: absolute;
	top: 0;
	left: 24px;
}

.CFBetter_setting_menu .CFBetter_setting_list input[type="checkbox"]:checked {
	border: 1.5px solid #C5CAE9;
	background: #E8EAF6;
}

.CFBetter_setting_menu .CFBetter_setting_list input[type="checkbox"]:checked::before {
    background: #C5CAE9;
    border: 1.5px solid #7986CB;
    transform: translate(122%, 2%);
    transition: all 0.3s ease-in-out;
}

.CFBetter_setting_menu .CFBetter_setting_list input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    position: absolute;
    top: 1.5px;
    left: 4.5px;
}

.CFBetter_setting_menu label, #darkMode_span, #loaded_span {
    font-size: 16px;
}

.CFBetter_setting_list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 10px;
    margin: 5px 0px;
    background-color: #ffffff;
    border-bottom: 1px solid #c9c6c696;
    border-radius: 8px;
    justify-content: space-between;
}

.CFBetter_setting_list.alert_warn {
    color: #E65100;
    background-color: #FFF3E0;
    border: 1px solid #FF9800;
    margin: 10px 0px;
}

.CFBetter_setting_list.alert_tip {
    color: #009688;
    background-color: #E0F2F1;
    border: 1px solid #009688;
    margin: 10px 0px;
}

.CFBetter_setting_list p:not(:last-child) {
    margin-bottom: 10px;
}

.CFBetter_setting_list p:not(:first-child) {
    margin-top: 10px;
}

/*设置面板-checkboxs*/
.CFBetter_setting_menu .CFBetter_checkboxs {
    flex-basis: 100%;
    display: flex;
    padding: 8px;
    margin: 10px 0px 0px 0px;
    border-bottom: 1px solid #c9c6c696;
    border-radius: 8px;
    border: 1px solid #c5cae9;
    background-color: #f0f8ff;
}
.CFBetter_setting_menu .CFBetter_checkboxs label {
    font-size: 13px;
    margin: 0px 6px 0px 3px;
}
.CFBetter_setting_menu .CFBetter_checkboxs input[type=checkbox]:checked+label{
    color: #7986cb;
}
.CFBetter_setting_menu .CFBetter_checkboxs input[type="checkbox"] {
    border: none;
    width: 16px;
    height: 16px;
}

.CFBetter_setting_menu .CFBetter_checkboxs input[type="checkbox"]::before{
    background: #ffffff;
    transform: none;
    width: 16px;
    height: 16px;
}

.CFBetter_setting_menu .CFBetter_checkboxs input[type="checkbox"]:checked {
	background: none;
    border: none;
}

.CFBetter_setting_menu .CFBetter_checkboxs input[type="checkbox"]:checked::before {
    border: 1.5px solid #95a2de;
    background: #e8eaf6;
	transform: none;
}

.CFBetter_setting_menu .CFBetter_checkboxs input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    top: 0px;
    left: 3.5px;
}

/*设置面板-radio*/
.CFBetter_setting_menu label {
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 3px 0px;
    overflow-x: visible;
}

.CFBetter_setting_menu_label_text {
    display: flex;
    border: 1px dashed #00aeeccc;
    height: 35px;
    width: 100%;
    color: #6e6e6e;
    font-weight: 300;
    font-size: 14px;
    letter-spacing: 2px;
    padding: 7px;
    margin-bottom: 4px;
    align-items: center;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}

input[type="radio"]:checked+.CFBetter_setting_menu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    text-shadow: 0px 0px 0.5px green;
}

.CFBetter_setting_menu label input[type="radio"], .CFBetter_contextmenu label input[type="radio"]{
    appearance: none;
    list-style: none;
    padding: 0px !important;
    margin: 0px;
    clip: rect(0 0 0 0);
    -webkit-clip-path: inset(100%);
    clip-path: inset(100%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
}

.CFBetter_setting_menu input[type="text"] {
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

.CFBetter_setting_menu .CFBetter_setting_list input[type="text"] {
    margin-left: 5px;
}

.CFBetter_setting_menu input[type="text"]:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}

.CFBetter_setting_menu_config_box {
    width: 100%;
    display: grid;
    margin-top: 5px;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
.CFBetter_setting_menu input::placeholder {
    color: #727378;
}
.CFBetter_setting_menu input.no_default::placeholder{
    color: #BDBDBD;
}
.CFBetter_setting_menu input.is_null::placeholder{
    color: red;
    border-width: 1.5px;
}
.CFBetter_setting_menu input.is_null{
    border-color: red;
}
.CFBetter_setting_menu textarea {
    resize: vertical;
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
.CFBetter_setting_menu textarea:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}
.CFBetter_setting_menu textarea::placeholder{
    color: #BDBDBD;
    font-size: 14px;
}

.CFBetter_setting_menu #tempConfig_save {
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
.CFBetter_setting_menu button#debug_button.debug_button {
    width: 18%;
}

.CFBetter_setting_menu span.tip {
    color: #999;
    font-size: 12px;
    font-weight: 500;
    padding: 5px 0px;
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
    z-index: 100;
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
    color: #b4b9d4;
    margin-left: 5px;
    margin-top: 3px;
}
.CFBetter_setting_menu .CFBetter_setting_menu_label_text .help_tip .help-icon {
    color: #7fbeb2;
}
.help_tip .help-icon:hover + .tip_text, .help_tip .tip_text:hover {
    display: block;
    cursor: help;
    width: 250px;
}

/*确认弹窗*/
.CFBetter_modal {
    z-index: 600;
    display: grid;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-family: var(--vp-font-family-base);
    padding: 10px 20px;
    box-shadow: 0px 0px 0px 4px #ffffff;
    border-radius: 6px;
    background-color: #f0f4f9;
    border-collapse: collapse;
    border: 1px solid #ffffff;
    color: #697e91;
}
.CFBetter_modal .buttons{
    display: flex;
    padding-top: 15px;
}
.CFBetter_modal button {
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
    margin-right: 15px;
    font-size: 12px;
    border-radius: 4px;
    color: #ffffff;
    background: #009688;
    border-color: #009688;
    border: none;
}
.CFBetter_modal button.secondary{
    background-color:#4DB6AC;
}
.CFBetter_modal button:hover{
    background-color:#4DB6AC;
}
.CFBetter_modal button.secondary:hover {
    background-color: #80CBC4;
}
.CFBetter_modal .help-icon {
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
.CFBetter_modal p {
    margin: 5px 0px;
}
/*更新检查*/
div#update_panel {
    z-index: 200;
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
li.tempConfig_add_button {
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
li.tempConfig_add_button:hover {
    border: 1px dashed #03A9F4;
    background-color: #d7f0fb8c;
    color: #03A9F4;
}
.config_bar_list {
    display: flex;
    width: 340px;
    border: 1px solid #c5cae9;
    border-radius: 8px;
    background-color: #f0f8ff;
    box-sizing: border-box;
}
.config_bar_list input[type="radio"] {
    appearance: none;
    width: 0;
    height: 0;
    overflow: hidden;
}
.config_bar_list input[type="radio"] {
    margin: 0px;
}
.config_bar_list input[type=radio]:focus {
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
.config_bar_ul li button {
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
.config_bar_ul {
    display: flex;
    align-items: center;
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 0px;
}
.config_bar_ul li {
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
.config_bar_ul::-webkit-scrollbar {
    width: 5px;
    height: 3px;
}
.config_bar_ul::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
    border-radius: 8px;
}
.config_bar_ul::-webkit-scrollbar-button:start:decrement {
    width: 4px;
    background-color: transparent;
}
.config_bar_ul::-webkit-scrollbar-button:end:increment {
    width: 4px;
    background-color: transparent;
}
.config_bar_ul::-webkit-scrollbar-track {
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
    z-index: 400;
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
    z-index: 300;
    width: 450px;
}
/* 黑暗模式选项 */
.dark-mode-selection {
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 350px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.dark-mode-selection label {
    margin: 8px 0px 8px 8px;
}
.dark-mode-selection > * {
    margin: 6px;
}
.dark-mode-selection .CFBetter_setting_menu_label_text {
    border-radius: 8px;
    margin-bottom: 0px;
}
/* 右键菜单 */
.CFBetter_contextmenu {
    z-index: 500;
    display: grid;
    position: absolute;
    background-color: #f0f4f9;
    border-collapse: collapse;
    color: #697e91;
    font-family: var(--vp-font-family-base);
    overflow: hidden;
    box-sizing: content-box;
    box-shadow: 0px 0px 0px 2px #eddbdb4d;
}
input[type="radio"]:checked+.CFBetter_contextmenu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    font-weight: 500;
}
.CFBetter_contextmenu_label_text {
    display: flex;
    border: 1px dashed #80cbc4;
    height: 26px;
    width: 100%;
    color: gray;
    font-size: 13px;
    padding: 4px;
    align-items: center;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
.CFBetter_contextmenu_label_text:hover {
    color: #F44336;
    border: 1px dashed #009688;
    background-color: #ffebcd;
}
/* RatingByClist */
.ratingBadges, html[data-theme=dark] button.ratingBadges{
    font-weight: 700;
    margin-top: 5px;
    border-radius: 4px;
    color: #ffffff00;
    border: 1px solid #cccccc66;
}
/* 多选翻译 */
.block_selected{
    box-shadow: 0px 0px 0px 1px #FF9800;
    outline: none;
}
/* 悬浮菜单 */
.CFBetter_MiniTranslateButton {
    z-index: 100;
    display: grid;
    position: absolute;
    border-collapse: collapse;
    fill: #F57C00;
    background-color: #FFF3E0;
    overflow: hidden;
    box-sizing: content-box;
    box-shadow: 0px 0px 0px 2px #FFE0B2;
    border-radius: 100%;
}
.CFBetter_MiniTranslateButton:hover {
    cursor: pointer;
    box-shadow: 0px 0px 0px 2px #FFB74D;
}
/* acmsguru划分块 */
.CFBetter_acmsguru {
    margin: 0 0 1em!important;
}
/* 整个代码提交表单 */
#CFBetter_SubmitForm input[type="number"] {
    width: 40px;
    color: #009688;
    appearance: none;
    padding: 5px 10px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
}
#CFBetter_SubmitForm :focus-visible {
    outline: none;
    border: 1px solid #9E9E9E !important;
}
#CFBetter_SubmitForm .topDiv {
    display:flex;
    align-items: center;
    justify-content: space-between;
}
#CFBetter_SubmitForm .topDiv .topRightDiv {
    display:flex;
    align-items: center;
    justify-content: space-between;
}
/* 顶部区域 */
#CFBetter_SubmitForm .topDiv button{
    height: 100%;
    padding: 5px 10px;
    font-size: 14px;
}
#CFBetter_SubmitForm .topDiv div#lspStateDiv{
    cursor: pointer;
    margin: 0px 5px;
    padding: 4px 8px;
    border: 1px solid;
    border-radius: 4px;
}
#CFBetter_SubmitForm .topDiv div#lspStateDiv.await{
    border-color: #BBDEFB;
    color: #2196F3;
    background-color: #E3F2FD;
}
#CFBetter_SubmitForm .topDiv div#lspStateDiv.success{
    border-color: #C8E6C9;
    color: #4CAF50;
    background-color: #E8F5E9;
}
#CFBetter_SubmitForm .topDiv div#lspStateDiv.error{
    border-color: #FFCDD2;
    color: #F44336;
    background-color: #FFEBEE;
}
/* LSP连接Log */
#LSPLog{
    width: 500px;
    height: 500px;
    position: fixed;
    top: 50%;
    left: 50%;
    padding: 10px;
    transform: translate(-50%, -50%);
    border: 1px solid;
    z-index: 200;
    background-color: #ffffff;
}
#LSPLog button{
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 200;
}
#LSPLog #LSPLogList{
    width: 500px;
    height: 500px;
    overflow: auto;
    color: #424242;
}
#LSPLog li:nth-child(odd){
    background-color: #f5f5f5;
}
#LSPLog details{
    padding: 2px;
}
/* 代码编辑 */
#CFBetter_editor{
    box-sizing: border-box;
    height: 600px;
    border: 1px solid #d3d3d3;
    width: 100% !important;
    display: block;
    resize: vertical;
}
#CFBetter_submitDiv{
    display: flex;
    justify-content: space-between;
    padding-top: 15px;
}
.CFBetter_SubmitButton {
    cursor: pointer;
    font-size: 15px;
    height: 35px;
    width: 100px;
    margin-left: 10px;
    border-radius: 6px;
    border: 1px solid #3c9a5f;
}
#RunTestButton {
    color: #333;
    background-color: #fff;
    border-color: #ccc;
}
#RunTestButton:hover {
    background-color: #f5f5f5;
}
#SubmitButton {
    color: #fff;
    background-color: #209978;
    border-color: #17795E;
}
#SubmitButton:hover {
    background-color: #17795e;
}
#SubmitButton.disabled {
    background-color: red;
    animation: shake 0.07s infinite alternate;
}
@keyframes shake {
    0% { transform: translateX(-5px); }
    100% { transform: translateX(5px); }
}
#programTypeId{
    padding: 5px 10px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
    color: #212529;
}
/* 调试 */
.CFBetter_loding{
    padding: 6px 0px 0px 5px;
    height: 22px;
}
#CompilerSetting{
    width: 70%;
}
#CompilerSetting select, #CompilerSetting textarea{
    padding: 4px 10px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
    color: #212529;
}
#CompilerArgsInput{
    width: 100%;
    height: 35px;
    margin-bottom: 10px;
    padding: 5px 10px;
    border-radius: 6px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    box-shadow: inset 0px 1px 1px rgba(0,0,0,.075);
}
input#CompilerArgsInput[disabled] {
    cursor: not-allowed;
}
#CompilerBox{
    display: grid;
    margin-top: 10px;
    border: #d0d7de solid 1px;
    border-radius: 6px;
}
#CompilerBox > * {  
    margin: 5px;
}

/* 调试结果 */
#statePanel{
    padding: 10px;
    margin-top: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}
.RunState_title:not(:first-child){
    margin-top: 20px;
}
.RunState_title{
    font-size: 16px;
    margin-bottom: 8px;
}
.RunState_title.error{
    color: red;
}
.RunState_title.ok{
    color: #449d44;
}
/* 自定义样例 */
#customTestBlock {
    margin-top: 10px;
    color: #616161;
    border: 1px solid #d3d3d3;
    box-sizing: border-box;
    position: relative;
}

#customTestBlock #customTests{
    border-top: 1px solid #d3d3d3;
    margin: 0px 0px 40px 0px;
}

#customTestBlock summary {
    cursor: pointer;
    padding: 10px;
}

#customTestBlock textarea {
    resize: vertical;
}

.sampleDiv {
    color: #727378;
    background-color: #FAFAFA;
    padding: 5px;
    margin-bottom: 10px;
    box-shadow: inset 0 0 1px #0000004d;
    position: relative;
}

.dynamicTextarea {
    width: 98%;
    height: 120px;
    margin: 10px 5px;
    border: 1px solid #E0E0E0;
}

.deleteCustomTest {
    cursor: pointer;
    position: absolute;
    top: 5px;
    right: 5px;
    display: flex;
    fill: #9E9E9E;
    padding: 2px 2px;
    border-radius: 4px;
    border: 1px solid #ffffff00;
    background-color: #ffffff00;
    align-items: center;
}

.deleteCustomTest:hover {
    fill: #EF5350;
    border: 1px solid #ef9a9a;
    background-color: #FFEBEE;
}

#addCustomTest {
    cursor: pointer;
    position: absolute;
    bottom: 5px;
    right: 5px;
    padding: 3px 10px;
    color: #795548;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #FAFAFA;
}
#addCustomTest:hover {
    background-color: #f5f5f5;
}
/* 差异对比 */
.outputDiff {
    color: #5d4037;
    margin: 5px 0px;
    display: grid;
    border: 1px solid #bcaaa4;
    font-size: 13px;
    font-family: Consolas, "Lucida Console", "Andale Mono", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace;
}

.outputDiff .added {
    background-color: #c8f7c5;
    user-select: none;
}

.outputDiff .removed {
    background-color: #f7c5c5;
}

.DiffLine {
    display: flex;

}

.outputDiff .DiffLine:nth-child(odd) {
    background-color: #f5f5f5;
}

.LineNo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 17px;
    color: #BDBDBD;
    font-size: 10px;
    border-right: 1px solid;
    user-select: none;
}

.LineContent {
    display: grid;
    width: 100%;
}

/*monaco编辑器*/
.monaco-hover hr {
    margin: 4px -8px 4px !important;
}
#CFBetter_editor .highlight {
    border: 1px solid #ffffff00;
    background-color: #ffffff00!important
}
#CFBetter_editor.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
}
#CFBetter_editor.fixed {
    position: fixed;
    right: 0;
    bottom: 0;
    height: 50vh;
    z-index: 100;
}
#CFBetter_editor.right-side {
    height: 98vh;
}
.html2mdButton.exit_button {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 100;
    height: 28px;
    padding: 5px 10px;
    font-size: 14px;
}
.html2mdButton.exit_button.bottom {
    top: 95%;
}
#CFBetter_statusBar{
    height: 100%;
    font-size: 12px;
    color: #757575;
    border: 1px solid #d3d3d3;
    background-color: #f8f8f8;
    padding: 3px;
}
/* 移动设备 */
@media (max-device-width: 450px) {
    button.html2mdButton{
        height: 2em;
        font-size: 1.2em;
    }
    button.html2mdButton.CFBetter_setting{
        height: 2.5em;
        font-size: 1em;
    }
    .CFBetter_setting_menu{
        width: 90%;
    }
    .CFBetter_setting_menu label, #darkMode_span, #loaded_span, .CFBetter_setting_menu_label_text,
    .CFBetter_setting_sidebar li{
        font-size: 1em;
    }
    .translate-problem-statement{
        font-size: 1.2em;
    }
    .CFBetter_modal{
        font-size: 1.5em;
    }
    .CFBetter_setting_list, .translate-problem-statement{
        padding: 0.5em;
    }
    .CFBetter_setting_menu_label_text{
        height: 2.5em;
        padding: 0.5em;
    }
    #pagBar #jump-input, #pagBar #items-per-page, .CFBetter_modal button{
        height: 2.5em;
        font-size: 1em;
    }
    .translate-problem-statement p, .translate-problem-statement ul li{
        line-height: 1.5em !important;
    }
    .CFBetter_contextmenu_label_text{
        height: 3em;
        font-size: 1em;
    }
}
`);

// 工具
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

// 随机数生成
function getRandomNumber(numDigits) {
    let min = Math.pow(10, numDigits - 1);
    let max = Math.pow(10, numDigits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
    let x, y, l, t, nl, nt;
    let isSpecialMouseDown = false; // 选取某些元素时不拖动

    element.on('mousedown', function (e) {
        isSpecialMouseDown = $(e.target).is('label, p, input, textarea, span, select');
        if (isSpecialMouseDown) return;

        isDragging = true;
        x = e.clientX;
        y = e.clientY;
        l = element.offset().left - $(window).scrollLeft();
        t = element.offset().top - $(window).scrollTop();

        element.css({ left: l + 'px', top: t + 'px', transform: 'none' });

        $(document).on("mousemove", drag);
        $(document).on("mouseup", stopDrag);
        element.css('cursor', 'all-scroll');
    });

    const drag = (e) => {
        if (!isDragging) return;
        // 不执行拖动操作
        if ($(e.target).is('label, p, input, textarea, span') || isSpecialMouseDown && !$(e.target).is('input, textarea')) return;
        e.preventDefault();

        const nx = e.clientX;
        const ny = e.clientY;
        nl = nx - (x - l);
        nt = ny - (y - t);
        element.css({ transform: `translate(${nx - x}px, ${ny - y}px)` });
    };

    const stopDrag = () => {
        isDragging = false;
        isSpecialMouseDown = false;
        element.css('cursor', 'default');

        // 在停止拖拽后，设置元素的left和top，并还原transform
        element.css({ left: nl + 'px', top: nt + 'px', transform: 'none' });
        $(document).off("mousemove", drag);
        $(document).off("mouseup", stopDrag);
    };
}

// 获取外部json并转换为object
function getExternalJSON(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function (response) {
                if (response.status === 200) {
                    var json = JSON.parse(response.responseText);
                    resolve(json);
                } else {
                    console.warn(`网络错误, ${url}无法访问`);
                    resolve({});
                }
            },
            onerror: function (response) {
                console.warn(`网络错误, ${url}无法访问`);
                resolve({});
            }
        });
    });
}

/**
 * 创建确认对话框
 * @param {string} title 标题
 * @param {string} content 内容
 * @param {string[]} buttons 按钮
 * @param {"cancel"|"continue"} [secondaryButton="cancel"] 指定次要按钮
 * @param {boolean} renderMarkdown 是否使用markdown渲染文本
 */
function createDialog(title, content, buttons, secondaryButton = "cancel", renderMarkdown = false) {
    return new Promise(resolve => {
        const styleElement = GM_addStyle(darkenPageStyle2);
        let contentHtml = content;

        if (renderMarkdown) {
            const md = window.markdownit();
            contentHtml = md.render(content);
        }

        let dialog = $(`
        <div class="CFBetter_modal">
            <h2>${title}</h2>
            <div class="content">${contentHtml}</div>
        </div>
        `);
        const buttonbox = $(`<div class="buttons"></div>`);
        const cancelButton = $(`<button class="cancelButton">${buttons[1]}</button>`);
        const continueButton = $(`<button class="continueButton">${buttons[0]}</button>`);
        if (buttons[1] !== null) buttonbox.append(cancelButton);
        if (buttons[0] !== null) buttonbox.append(continueButton);
        dialog.append(buttonbox);
        $('body').before(dialog);

        // 设置次要按钮
        if (secondaryButton === "cancel") {
            cancelButton.addClass("secondary");
        } else if (secondaryButton === "continue") {
            continueButton.addClass("secondary");
        }

        continueButton.click(function () {
            $(styleElement).remove();
            dialog.remove();
            resolve(true);
        });

        cancelButton.click(function () {
            $(styleElement).remove();
            dialog.remove();
            resolve(false);
        });
    });
}

/**
 * 更新检查
 */
function checkScriptVersion() {
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
                                ${helpCircleHTML}
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

};

// 汉化替换
function toZH_CN() {
    if (!bottomZh_CN) return;
    // 设置语言为zh
    var htmlTag = document.getElementsByTagName("html")[0];
    htmlTag.setAttribute("lang", "zh-CN");

    // 文本节点遍历替换
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
        { match: 'Virtual participation', replace: '参加虚拟重现赛' },
        { match: 'Enter', replace: '进入' },
        { match: 'Current standings', replace: '当前榜单' },
        { match: 'Final standings', replace: '最终榜单' },
        { match: 'Preliminary results', replace: '初步结果' },
        { match: 'open hacking:', replace: '公开黑客攻击中' },
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
        { match: 'Rating: users participated in recent 6 months', replace: '评级：最近 6 个月有参与的用户' },
        { match: 'Past contests', replace: '过去的比赛' },
        { match: 'Exclusions', replace: '排除' },
        { match: 'Before start', replace: '距比赛开始还有' },
        { match: 'Before registration', replace: '距报名开始还有' },
        { match: 'Until closing ', replace: '距报名结束还有' },
        { match: 'Before extra registration', replace: '额外报名还未开始' },
        { match: 'Register »', replace: '报名 »' },
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
        { match: 'Problemsetting', replace: '问题设置' },
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
        { match: 'Adm.', replace: '管理' },
        { match: 'Edit', replace: '编辑' },
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
        { match: 'Rating', replace: '评级' },
        { match: 'Friends rating', replace: '朋友的评级' },
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
        { match: 'Reminder: in case of any technical issues, you can use the lightweight website', replace: '提醒：如果出现任何技术问题，您可以使用轻量网站' },
        { match: 'Please subscribe to the official Codeforces channel in Telegram via the link ', replace: '请通过链接订阅Codeforces的官方Telegram频道' }
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
        { match: 'The problem statement has recently been changed.', replace: '题目描述最近已被更改。' },
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

    const rules26 = [
        { match: 'Contest type:', replace: '比赛类型：' },
        { match: 'Rated:', replace: '已评级：' },
        { match: 'Tried:', replace: '已尝试' },
        { match: 'Substring:', replace: '关键字' },
    ];
    traverseTextNodes($('.setting-name'), rules26);

    const rules27 = [
        { match: 'Sort by:', replace: '排序依据：' },
        { match: 'relevance', replace: '相关' },
        { match: 'popularity', replace: '热度' },
        { match: 'time', replace: '时间' },
    ];
    traverseTextNodes($('.by-form'), rules27);

    // 组合混搭管理汉化
    const rules28 = [
        { match: 'If you invite users to this contest, the contest will become visible to them regardless of its visibility. You can share the contest using the link:', replace: '如果您邀请用户参加此竞赛，则无论其可见性如何，该竞赛都将对用户可见。您可以使用以下链接分享比赛：' },
    ];
    traverseTextNodes($('.roundbox.borderTopRound '), rules28);

    const rules29 = [
        { match: 'Show Log »', replace: '展示日志 »' },
        { match: 'Move all to practice »', replace: '全部移至练习者 »' },
        { match: 'Remove All »', replace: '移除全部 »' },
        { match: 'Add »', replace: '添加 »' },
        { match: 'Set »', replace: '设置 »' },
        { match: 'Download Archive »', replace: '下载归档 »' },
    ];
    traverseTextNodes($('.roundbox.borderTopRound '), rules29);

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
            "Clone Contest to Mashup": "→ 克隆比赛到组合混搭",
            "Invitations": "→ 邀请",
            "Administration": "→ 管理",
            "Create Mashup Contest": "→ 创建混搭比赛",
            "Submit": "→ 提交",
            "Practice": "→ 练习",
            "Problem tags": "→ 问题标签",
            "Filter Problems": "→ 过滤问题",
            "Attention": "→ 注意",
            "Past contests filter": "→ 过去的比赛筛选",
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
            "Export the judgment log to DAT-file": "→ 导出判题日志为 DAT 文件",
            "Contest managers": "→ 比赛管理员",
            "Contest writers": "→ 比赛编写者",
            "Spectator ranklists": "→ 观众排名列表",
            "Ghosts:": "→ 幽灵选手",
            "Export Submissions": "→ 导出提交",
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
    // 比赛过滤器选项汉化
    (function () {
        var parentElement = $('.options');
        var selectElement = parentElement.find('li');
        var translations = {
            "Educational": "教育性",
            "Global": "全球",
            "VK Cup": "VK杯",
            "Long Rounds": "长期回合",
            "April Fools": "愚人节",
            "Team Contests": "团队比赛",
            "ICPC Scoring": "ICPC计分",
            "Doesn't matter": "----",
            "Any": "所有",
            "Yes": "是",
            "No": "否",
            "No submission(s)": "无提交",
            "Have submission(s)": "有提交",
            "No solved problem(s)": "无解决问题",
            "Have solved problem(s)": "有解决问题"
        };
        selectElement.find('label').each(function () {
            var optionValue = $(this).text();
            if (translations[optionValue]) {
                $(this).text(translations[optionValue]);
            }
        });
        $('.CaptionCont').find('span').each(function () {
            var optionValue = $(this).text();
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
            "Training name (English):": "训练名称（英文）:",
            "Training name (Russian):": "训练名称（俄语）:",
            "Contest format:": "比赛格式:",
            "Start time:": "开始时间:",
            "Duration:": "持续时间:",
            "Visibility:": "可见性:",
            "Attach parent contest?:": "关联父级比赛?",
            "Participation type:": "参与类型:",
            "Freeze period:": "冻结期间:",
            "Unfreeze time:": "解冻时间:",
            "Is practice allowed?:": "是否允许练习?",
            "Is virtual allowed?:": "是否允许虚拟参赛?",
            "Is out of competition allowed?:": "是否允许非竞赛参赛?",
            "Is self-registration allowed?:": "是否允许自助注册?",
            "Can non-registered view the contest?:": "未注册用户能否查看比赛?",
            "Can participants view common status?:": "参赛选手能否查看共享状态?",
            "Contest testdata policy:": "比赛测试数据策略:",
            "Allow view other submissions to:": "允许查看其他提交给:",
            "Manage program languages:": "管理编程语言:",
            "Use time limits scaling policy?:": "使用时间限制缩放策略?",
            "Allow statements?:": "允许陈述?",
            "Allow standings?:": "允许排名?",
            "Season:": "季节:",
            "Contest type:": "比赛类型:",
            "ICPC region:": "ICPC 地区:",
            "Country:": "国家:",
            "City:": "城市:",
            "Contest difficulty:": "比赛难度:",
            "Website URL:": "网站链接:",
            "Description (English):": "描述（英文）:",
            "Description (Russian):": "描述（俄语）:",
            "Registration confirmation text (English):": "注册确认文字（英文）:",
            "Registration confirmation text (Russian):": "注册确认文字（俄语）:",
            "Logo (English):": "徽标（英文）:",
            "Logo (Russian):": "徽标（俄语）:",
            "End time:": "结束时间:",
            "Name:": "名称:",
            "Contest(s):": "比赛（们）:",
            "Add contest:": "添加比赛:",
            "Show Contestants:": "显示参赛选手:",
            "Show Out of Competition Participants:": "显示非竞赛参与者:",
            "Show Practices:": "显示练习:",
            "Show Virtuals:": "显示虚拟选手:",
            "Show Ghosts:": "显示幽灵选手:",
            "Name:": "名称:",
            "Text:": "文本:",
            "Rewrite Examples:": "重写样例:",
            "Add images:": "添加图片:",
            "Do not use:": "不使用:",
            "Problem short name:": "题目简称:",
            "Source problem:": "源问题:",
            "Problem name (English):": "题目名称（英文）:",
            "Input file name:": "输入文件名:",
            "Output file name:": "输出文件名:",
            "Time Limit:": "时间限制:",
            "Memory Limit:": "内存限制:",
            "Output only:": "仅输出:"
        };
        $(".field-name").each(function () {
            var field = $(this);
            field.contents().each(function () {
                if (this.nodeType === Node.TEXT_NODE) {
                    var optionValue = this.textContent.trim();
                    if (translations[optionValue]) {
                        this.textContent = translations[optionValue];
                    }
                } else if (this.nodeType === Node.ELEMENT_NODE && this.tagName.toLowerCase() === 'label') {
                    var optionValue = this.textContent.trim();
                    if (translations[optionValue]) {
                        this.textContent = translations[optionValue];
                    }
                }
            });
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
            "Manage invitations": "管理邀请",
            "Disable manager mode": "临时关闭管理模式",
            "Enable manager mode": "开启管理模式",
            "Clone Contest": "克隆比赛",
            "Submit": "提交",
            "Save changes": "保存设置",
            "Filter": "过滤",
            "Find": "查找",
            "Save": "保存",
            "Create Mashup Contest": "创建混搭比赛",
            "Delete problem": "删除问题",
            "Restore problem": "恢复问题"
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
            "Delete contest": "删除比赛",
            "Preview": "预览",
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
};

// 配置管理函数
function setupConfigManagement(element, prefix, tempConfig, structure, configHTML, checkable) {
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
        settingMenu.on("click", "#tempConfig_save", () => {
            const config = {};

            // 检查必填字段
            let allFieldsValid = true;
            for (const key in structure) {
                let value = $(key).val();
                if ($(key).is("input[type='checkbox']")) value = $(key).prop("checked"); // 打个补丁，单选的值是prop("checked")
                if (value || $(key).attr('require') === 'false') {
                    config[structure[key]] = value;
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

            const list = $(`#${prefix}config_bar_ul`);
            createListItemElement(config[structure['#note']]).insertBefore($(`#${prefix}add_button`));

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

        const list = $(`#${prefix}config_bar_ul`);
        const index = Array.from(list.children()).indexOf(this);

        const styleElement = createWindow();

        const settingMenu = $("#config_edit_menu");
        const configAtIndex = tempConfig.configurations[index];

        if (configAtIndex) {
            for (const key in structure) {
                if ($(key).is("input[type='checkbox']")) $(key).prop('checked', configAtIndex[structure[key]]); // 是input[type='checkbox']的情况
                else $(key).val(configAtIndex[structure[key]]);
            }
        }

        settingMenu.on("click", "#tempConfig_save", () => {
            const config = {};
            let allFieldsValid = true;
            for (const key in structure) {
                let value = $(key).val();
                if ($(key).is("input[type='checkbox']")) value = $(key).prop("checked"); // 是input[type='checkbox']的情况
                if (value || $(key).attr('require') === 'false') {
                    config[structure[key]] = value;
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

        const list = $(`#${prefix}config_bar_ul`);
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
            <div id='${prefix}configControlTip' style='color:red;'></div>
            <div class='config_bar'>
                <div class='config_bar_list' id='${prefix}config_bar_list'>
                    <ul class='config_bar_ul' id='${prefix}config_bar_ul'></ul>
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
        const listContainer = $(`#${prefix}config_bar_list`);
        const list = $(`#${prefix}config_bar_ul`);
        list.empty();
        tempConfig.configurations.forEach((item) => {
            list.append(createListItemElement(item[structure['#note']]));
        });

        list.append(`
            <li id='${prefix}add_button' class="tempConfig_add_button">
                <span>+ 添加</span>
            </li>
        `);
        const addItem = $(`#${prefix}add_button`);
        addItem.on("click", onAdd);
    };

    renderList();
    return tempConfig;
}

const CFBetter_setting_sidebar_HTML = `
<div class="CFBetter_setting_sidebar">
    <ul>
        <li><a href="#basic-settings" id="sidebar-basic-settings" class="active">基本</a></li>
        <li><a href="#translation-settings" id="sidebar-translation-settings">翻译</a></li>
        <li><a href="#clist_rating-settings" id="sidebar-clist_rating-settings">Clist</a></li>
        <li><a href="#code_editor-settings" id="sidebar-code_editor-settings">Monaco</a></li>
        <li><a href="#compatibility-settings" id="sidebar-compatibility-settings">兼容</a></li>
    </ul>
</div>
`;

const basic_settings_HTML = `
<div id="basic-settings" class="settings-page active">
    <h3>基本设置</h3>
    <hr>
    <div class='CFBetter_setting_list' style="padding: 0px 10px;">
        <span id="darkMode_span">黑暗模式</span>
        <div class="dark-mode-selection">
            <label>
                <input class="radio-input" type="radio" name="darkMode" value="dark" />
                <span class="CFBetter_setting_menu_label_text">黑暗</span>
                <span class="radio-icon"> </span>
            </label>
            <label>
                <input checked="" class="radio-input" type="radio" name="darkMode" value="light" />
                <span class="CFBetter_setting_menu_label_text">白天</span>
                <span class="radio-icon"> </span>
            </label>
            <label>
                <input class="radio-input" type="radio" name="darkMode" value="follow" />
                <span class="CFBetter_setting_menu_label_text">跟随系统</span>
                <span class="radio-icon"> </span>
            </label>
        </div>
    </div>
    <div class='CFBetter_setting_list'>
        <label for="bottomZh_CN">界面汉化</label>
        <input type="checkbox" id="bottomZh_CN" name="bottomZh_CN">
    </div>
    <div class='CFBetter_setting_list'>
    <label for="showLoading">显示加载提示信息</label>
    <div class="help_tip">
        ${helpCircleHTML}
        <div class="tip_text">
        <p>当你开启 显示加载信息 时，每次加载页面时会在上方显示加载信息提示：“${OJBetterName} —— xxx”</p>
        <p>这用于了解脚本当前的工作情况，<strong>如果你不想看到，可以选择关闭</strong></p>
        <p><u>需要说明的是，如果你需要反馈脚本的任何加载问题，请开启该选项后再截图，以便于分析问题</u></p>
        </div>
    </div>
    <input type="checkbox" id="showLoading" name="showLoading">
    </div>
    <div class='CFBetter_setting_list'>
    <label for="hoverTargetAreaDisplay">显示目标区域范围</label>
    <div class="help_tip">
        ${helpCircleHTML}
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
    <label for="renderPerfOpt">折叠块渲染优化</label>
    <div class="help_tip">
        ${helpCircleHTML}
        <div class="tip_text">
        <p>为折叠块元素添加 contain 约束</p>
        <div style="border: 1px solid #795548; padding: 10px;">
            <p>
            contain: layout style;
            </p>
        </div>
        <p>如果你的浏览器查看大量折叠块时比较卡顿，开启后<strong>可能</strong>会有一定程度的改善</p>
        </div>
    </div>
    <input type="checkbox" id="renderPerfOpt" name="renderPerfOpt">
    </div>
    <div class='CFBetter_setting_list'>
    <label for="commentPaging">评论区分页</label>
    <div class="help_tip">
        ${helpCircleHTML}
        <div class="tip_text">
        <p>对评论区分页显示，每页显示指定数量的<strong>主楼</strong></p>
        </div>
    </div>
    <input type="checkbox" id="commentPaging" name="commentPaging">
    </div>
    <div class='CFBetter_setting_list'>
        <label for="showJumpToLuogu">显示跳转到洛谷</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>洛谷OJ上收录了Codeforces的部分题目，一些题目有翻译和题解</p>
            <p>开启显示后，如果当前题目被收录，则会在题目的右上角显示洛谷标志，</p>
            <p>点击即可一键跳转到该题洛谷的对应页面。</strong></p>
            </div>
        </div>
        <input type="checkbox" id="showJumpToLuogu" name="showJumpToLuogu">
    </div>
    <div class='CFBetter_setting_list'>
        <label for="standingsRecolor">榜单重新着色</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>对于采用 Codeforces 赛制的比赛榜单</p>
            <p>按照“得分/总分”所在的范围为分数重新渐变着色</p>
            <p>范围：1~0.7~0.45~0 深绿色→浅橙色→深橙色→红色</p>
            </div>
        </div>
        <input type="checkbox" id="standingsRecolor" name="standingsRecolor">
    </div>
</div>
`;

const translation_settings_HTML = `
<div id="translation-settings" class="settings-page">
    <h3>翻译设置</h3>
    <hr>
    <h4>首选项</h4>
    <label>
        <input type='radio' name='translation' value='deepl'>
        <span class='CFBetter_setting_menu_label_text'>deepl翻译</span>
    </label>
    <label>
        <input type='radio' name='translation' value='iflyrec'>
        <span class='CFBetter_setting_menu_label_text'>讯飞听见翻译</span>
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
        <input type='radio' name='translation' value='caiyun'>
        <span class='CFBetter_setting_menu_label_text'>彩云小译翻译</span>
    </label>
    <label>
        <input type='radio' name='translation' value='openai'>
        <span class='CFBetter_setting_menu_label_text'>ChatGPT翻译
            <div class="help_tip">
                ${helpCircleHTML}
                <div class="tip_text">
                <p><b>需要在下方ChatGPT配置中添加并选定你想使用的配置信息，右键可以修改和删除配置</b></p>
                <p>具体请阅读脚本页的介绍</p>
                </div>
            </div>
        </span>
    </label>
    <hr>
    <h4>ChatGPT</h4>
    <div class='CFBetter_setting_menu_config_box' id='openai' style='display: none;'>
        <div id="chatgpt-config"></div>
    </div>
    <div class='CFBetter_setting_list'>
        <label for="openai_isStream">流式传输</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>启用数据流式传输，打字机效果</p>
            </div>
        </div>
        <input type="checkbox" id="openai_isStream" name="openai_isStream">
    </div>
    <hr>
    <h4>偏好</h4>
    <div class='CFBetter_setting_list'>
        <label for="comment_translation_choice" style="display: flex;">评论区翻译</label>
        <select id="comment_translation_choice" name="comment_translation_choice">
            <option value="0">跟随首选项</option>
            <option value="deepl">deepl翻译</option>
            <option value="iflyrec">讯飞听见翻译</option>
            <option value="youdao">有道翻译</option>
            <option value="google">Google翻译</option>
            <option value="caiyun">彩云小译翻译</option>
            <option value="openai">ChatGPT翻译</option>
        </select>
    </div>
    <hr>
    <h4>自动翻译</h4>
    <div class='CFBetter_setting_list'>
        <label for="autoTranslation">自动翻译短文本</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>对于<strong>.ttypography, .comments 区域</strong>中的短文本，</p>
            <p>当其进入浏览器窗口的 可视区域 时自动翻译</p>
            </div>
        </div>
        <input type="checkbox" id="autoTranslation" name="autoTranslation">
    </div>
    <div class='CFBetter_setting_list'>
        <label for='shortTextLength'>
            <div style="display: flex;align-items: center;">
                <span>短文本最大字符数</span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
                <p>指定判断为短文本的最大字符上限，如果超过最大字符数，则为非短文本</p>
            </div>
        </div>
        <input type='number' id='shortTextLength' class='no_default' placeholder='请输入' require = true>
        <span>字符</span>
    </div>
    <div class='CFBetter_setting_list'>
        <label for="allowMixTrans">评论区快速翻译</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>自动翻译时，对于评论区中的每一个短文本区域，独立的在下方勾选的服务中随机选择一个，</p>
            <p>并行地进行快速翻译</p>
            </div>
        </div>
        <input type="checkbox" id="allowMixTrans" name="allowMixTrans">
        <div class='CFBetter_checkboxs'>
            <input type="checkbox" id="deepl" name="mixedTranslation" value="deepl">
            <label for="deepl">DeepL</label>
            <input type="checkbox" id="iflyrec" name="mixedTranslation" value="iflyrec">
            <label for="iflyrec">讯飞</label>
            <input type="checkbox" id="youdao" name="mixedTranslation" value="youdao">
            <label for="youdao">有道</label>
            <input type="checkbox" id="google" name="mixedTranslation" value="google">
            <label for="google">Google</label>
            <input type="checkbox" id="caiyun" name="mixedTranslation" value="caiyun">
            <label for="caiyun">彩云</label>
        </div>
    </div>
    <hr>
    <h4>高级</h4>
    <div class='CFBetter_setting_list'>
        <label for="comment_translation_mode" style="display: flex;">工作模式</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>你可以选择脚本的工作方式</p>
            <p>○ 普通模式：会一次性翻译整个区域的内容</p>
            <p>○ 分段模式：会对区域内的每一个&#60;&#112;&#47;&#62;和&#60;&#105;&#47;&#62;标签依次进行翻译</p>
            <p>○ 选段模式：你可以自由点选页面上的任何&#60;&#112;&#47;&#62;和&#60;&#105;&#47;&#62;标签进行翻译</p>
                <div style="color:#f44336;">
                    <p><u>注意：分段/选段模式会产生如下问题：</u></p>
                    <p>- 使得翻译接口无法知晓整个文本的上下文信息，会降低翻译质量。</p>
                    <p>- 会有<strong>部分内容不会被翻译/不能被选中</strong>，因为它们不是&#60;&#112;&#47;&#62;或&#60;&#105;&#47;&#62;元素</p>
                </div>
            </div>
        </div>
        <select id="comment_translation_mode" name="comment_translation_mode">
            <option value="0">普通模式</option>
            <option value="1">分段模式</option>
            <option value="2">选段模式</option>
        </select>
    </div>
    <div class='CFBetter_setting_list'>
        <label for="memoryTranslateHistory">自动恢复历史翻译</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>将<strong>题目页面</strong>上的翻译信息自动保存到本地indexDB中</p>
            <p>刷新 / 下一次进入页面 时自动恢复翻译信息</p>
            </div>
        </div>
        <input type="checkbox" id="memoryTranslateHistory" name="memoryTranslateHistory">
    </div>
    <div class='CFBetter_setting_list'>
        <label for="translation_retransAction" style="display: flex;">重新翻译时</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>选择在重新翻译时是"关闭旧的结果"还是"收起旧的结果"</p>
            </div>
        </div>
        <select id="translation_retransAction" name="translation_retransAction">
            <option value=0>关闭旧的结果</option>
            <option value=1>收起旧的结果</option>
        </select>
    </div>
    <div class='CFBetter_setting_list'>
        <label for='transWaitTime'>
            <div style="display: flex;align-items: center;">
                <span>等待间隔</span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
                <p>设置两次翻译请求间的等待间隔，该设置会全局生效，各个翻译服务之间独立计算</p>
                <p>建议 200 + 毫秒</p>
                <p>说明：ChatGPT 翻译时会忽略该设置，不等待</p>
            </div>
        </div>
        <input type='number' id='transWaitTime' class='no_default' placeholder='请输入' require = true>
        <span>毫秒</span>
    </div>
    <div class='CFBetter_setting_list'>
        <label for="translation_replaceSymbol" style="display: flex;">LaTeX替换符</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>脚本通过先取出所有的LaTeX公式，并使用替换符占位，来保证公式不会被翻译接口所破坏</p>
            <p>对于各个翻译服务，不同的替换符本身遭到破坏的概率有所不同，具体请阅读脚本页的说明</p>
            <p>注意：使用ChatGPT翻译时不需要上述操作, 因此不受此选项影响</p>
            <p>具体你可以前往阅读脚本页的说明</p>
            </div>
        </div>
        <select id="translation_replaceSymbol" name="translation_replaceSymbol">
            <option value=2>使用{}</option>
            <option value=1>使用【】</option>
            <option value=3>使用[]</option>
        </select>
    </div>
    <div class='CFBetter_setting_list'>
        <label for="filterTextWithoutEmphasis">过滤文本中的**号</label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>一些翻译服务(比如 DeepL)会错误处理 MarkDown 中的着重号 <strong>**</strong> </p>
            <p>这可能会导致翻译结果漏掉其包裹的内容，你可以选择将着重号去掉 (使用ChatGPT会忽略该项) </p>
            </div>
        </div>
        <input type="checkbox" id="filterTextWithoutEmphasis" name="filterTextWithoutEmphasis">
    </div>
</div>
`;

const clist_rating_settings_HTML = `
<div id="clist_rating-settings" class="settings-page">
    <h3>Clist设置</h3>
    <hr>
    <h4>基本</h4>
    <div class='CFBetter_setting_list alert_tip'>
        <div>
            <p>注意：在不同页面工作所需要的凭证有所不同，具体请看对应选项的标注说明</p>
        </div>
    </div>
    <div class='CFBetter_setting_list'>
        <label for='clist_Authorization'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">KEY:</span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
                <p>格式样例：</p>
                <div style="border: 1px solid #795548; padding: 10px;">
                    <p>ApiKey XXXXXXXXX</p>
                </div>
            </div>
        </div>
        <input type='text' id='clist_Authorization' class='no_default' placeholder='请输入KEY' require = true>
    </div>
    <hr>
    <h4>显示Rating分</h4>
    <div class='CFBetter_setting_list'>
        <label for="showClistRating_contest"><span>比赛问题集页</span></label>
        <div class="help_tip" style="margin-right: initial;">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>数据来源clist.by</p>
            <p>你需要提供官方的api key</p>
            <p>或让你的浏览器上的clist.by处于登录状态（即cookie有效）</p>
            </div>
        </div>
        <div class="badge">Cookie/API KEY</div>
        <input type="checkbox" id="showClistRating_contest" name="showClistRating_contest">
    </div>
    <div class='CFBetter_setting_list'>
        <label for="showClistRating_problem"><span>题目页</span></label>
        <div class="help_tip" style="margin-right: initial;">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>你需要提供官方的api key</p>
            <p>或让你的浏览器上的clist.by处于登录状态（即cookie有效）</p>
            </div>
        </div>
        <div class="badge">Cookie/API KEY</div>
        <input type="checkbox" id="showClistRating_problem" name="showClistRating_problem">
    </div>
    <div class='CFBetter_setting_list'>
        <label for="showClistRating_problemset"><span>题单页</span></label>
        <div class="help_tip" style="margin-right: initial;">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>需要让你的浏览器上的clist.by处于登录状态（即cookie有效）才能正常工作</p>
            </div>
        </div>
        <div class="badge">Cookie</div>
        <input type="checkbox" id="showClistRating_problemset" name="showClistRating_problemset">
    </div>
    <hr>
    <div class='CFBetter_setting_list'>
        <label for="RatingHidden"><span>防剧透</span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>只有当鼠标移动到Rating分展示区域上时才显示</p>
            </div>
        </div>
        <input type="checkbox" id="RatingHidden" name="RatingHidden">
    </div>
</div>
`;

const code_editor_settings_HTML = `
<div id="code_editor-settings" class="settings-page">
    <h3>Monaco编辑器设置</h3>
    <hr>
    <h4>基本</h4>
    <div class='CFBetter_setting_list'>
        <label for="problemPageCodeEditor"><span>题目页添加编辑器</span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>在题目页下面添加Monaco编辑器，代码会自动保存，提供在线代码运行</p>
            </div>
        </div>
        <input type="checkbox" id="problemPageCodeEditor" name="problemPageCodeEditor">
    </div>
    <hr>
    <h4>偏好</h4>
    <div class='CFBetter_setting_list'>
        <label for="isCodeSubmitConfirm"><span>代码提交二次确认</span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>点击题目页Monaco编辑器的代码提交时会弹窗二次确认，防止误提交</p>
            </div>
        </div>
        <input type="checkbox" id="isCodeSubmitConfirm" name="isCodeSubmitConfirm">
    </div>
    <hr>
    <h4>在线代码运行</h4>
    <label>
        <input type='radio' name='compiler' value='official'>
        <span class='CFBetter_setting_menu_label_text'>Codeforces</span>
    </label>
    <label>
        <input type='radio' name='compiler' value='wandbox'>
        <span class='CFBetter_setting_menu_label_text'>wandbox</span>
    </label>
    <label>
        <input type='radio' name='compiler' value='rextester'>
        <span class='CFBetter_setting_menu_label_text'>rextester</span>
    </label>
    <hr>
    <h4>LSP设置</h4>
    <div class='CFBetter_setting_list'>
        <label for="useLSP"><span>使用LSP</span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>连接 LSP Server，以启用代码补全、代码诊断、格式化、转到定义等功能</p>
            <p>支持C++、Python语言</p>
            <p>你需要启动 OJBetter_Bridge ，具体请查看脚本页的说明</p>
            </div>
        </div>
        <input type="checkbox" id="useLSP" name="useLSP">
    </div>
    <div class='CFBetter_setting_list'>
        <label for='OJBetter_Bridge_WorkUri'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">工作路径:</span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
                <p>你需要填写 OJBetter_Bridge 所在的路径：</p>
                <p>使用正斜杠或反斜杠均可</p>
                <p>默认路径：</p>
                <div style="border: 1px solid #795548; padding: 10px;">
                    <p>C:/OJBetter_Bridge</p>
                </div>
            </div>
        </div>
        <input type='text' id='OJBetter_Bridge_WorkUri' class='no_default' placeholder='请输入路径，注意分隔符为为/' require = true>
    </div>
    <div class='CFBetter_setting_list'>
        <label for='OJBetter_Bridge_SocketUrl'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">Server:</span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
                <p>你需要填写你本机中 OJBetter_Bridge 的 Server URL</p>
                <p>默认的URL: </p>
                <div style="border: 1px solid #795548; padding: 10px;">
                    <p>ws://127.0.0.1:2323/</p>
                </div>
                <p>注意，你通常不需要更改这里，如需更改，请与默认URL格式一致</p>
            </div>
        </div>
        <input type='text' id='OJBetter_Bridge_SocketUrl' class='no_default' placeholder='请输入路径，注意严格按照格式填写' require = true>
    </div>
    <hr>
    <h4>静态补全增强</h4>
    <div class='CFBetter_setting_list'>
        <label for="cppCodeTemplateComplete"><span>AcWing CPP 补全模板</span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>模板来自<a href="https://www.acwing.com/file_system/file/content/whole/index/content/2145234/" target="_blank">AcWing</a></p>
            </div>
        </div>
        <input type="checkbox" id="cppCodeTemplateComplete" name="cppCodeTemplateComplete">
    </div>
    <hr>
    <h5>自定义</h5>
    <div class='CFBetter_setting_list alert_warn'>
        <div>
            <p>注意：过多的静态补全规则会影响性能</p>
        </div>
    </div>
    <div class='CFBetter_setting_menu_config_box' id='Complets'>
        <div id="Complet_config"></div>
    </div>
</div>
`;

const compatibility_settings_HTML = `
<div id="compatibility-settings" class="settings-page">
    <h3>兼容设置</h3>
    <hr>
    <div class='CFBetter_setting_list'>
        <label for="loaded"><span id="loaded_span">不等待页面资源加载</span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text">
            <p>为了防止在页面资源未加载完成前（主要是各种js）执行脚本产生意外的错误，脚本默认会等待 window.onload 事件</p>
            <p>如果你的页面上方的加载信息始终停留在：“等待页面资源加载”，即使页面已经完成加载</p>
            <p><u>你首先应该确认是否是网络问题，</u></p>
            <p>如果不是，那这可能是由于 window.onload 事件在你的浏览器中触发过早（早于DOMContentLoaded），</p>
            <p>你可以尝试开启该选项来不再等待 window.onload 事件</p>
            <p><u>注意：如果没有上述问题，请不要开启该选项</u></p>
            </div>
        </div>
        <input type="checkbox" id="loaded" name="loaded">
    </div>
</div>
`;

const CFBetter_setting_content_HTML = `
<div class="CFBetter_setting_content">
    ${basic_settings_HTML}
    ${translation_settings_HTML}
    ${clist_rating_settings_HTML}
    ${code_editor_settings_HTML}
    ${compatibility_settings_HTML}
</div>
`;
const CFBetterSettingMenu_HTML = `
    <div class='CFBetter_setting_menu' id='CFBetter_setting_menu'>
    <div class="tool-box">
        <button class="btn-close">×</button>
    </div>
    <div class="CFBetter_setting_container">
        ${CFBetter_setting_sidebar_HTML}
        ${CFBetter_setting_content_HTML}
    </div>
`;

const chatgptConfigEditHTML = `
    <div class='CFBetter_setting_menu' id='config_edit_menu'>
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
                    ${helpCircleHTML}
                    <div class="tip_text">
                    <p>留空则默认为：gpt-3.5-turbo</p>
                    <p>模型列表请查阅<a target="_blank" href="https://platform.openai.com/docs/models">OpenAI官方文档</a></p>
                    <p><strong>此外，如果你使用的是服务商提供的代理API，请确认服务商是否支持对应模型</strong></p>
                    </div>
                </div>
            </div>
        </label>
        <input type='text' id='openai_model' placeholder='gpt-3.5-turbo' require = false>
        <label for='openai_key'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">KEY:</span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text">
                    <p>你需要输入自己的OpenAI key，<a target="_blank" href="https://platform.openai.com/account/usage">官网</a></p>
                    <p><b>如果你使用的是服务商提供的代理API，则应该填写服务商提供的 Key</b></p>
                    </div>
                </div>
            </div>
        </label>
        <input type='text' id='openai_key' class='no_default' placeholder='请输入KEY' require = true>
        <label for='openai_proxy'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">Proxy API:</span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text">
                        <p>留空则默认为OpenAI官方API</p>
                        <p>你也可以填写指定的API来代理访问OpenAI的API，</p>
                        <p>如果你使用的是服务商提供的代理API和KEY，则这里应该填写其提供的<strong>完整</strong>API地址，详请阅读脚本说明</p>
                        <p><strong>由于你指定了自定义的API，Tampermonkey会对你的跨域请求进行警告，你需要自行授权</strong></p>
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
                    ${helpCircleHTML}
                    <div class="tip_text">
                        <p>格式样例：</p>
                        <div style="border: 1px solid #795548; padding: 10px;">
                            <p>name1 : 123<br>name2 : cccc</p>
                        </div>
                    </div>
                </div>
            </div>
        </label>
        <textarea id="_header" placeholder='（选填）你可以在这里填写向请求header中额外添加的键值对' require = false></textarea>
        <label for='_data'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">自定义data</span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text">
                        <p>格式样例：</p>
                        <div style="border: 1px solid #795548; padding: 10px;">
                            <p>name1 : 123<br>name2 : cccc</p>
                        </div>
                    </div>
                </div>
            </div>
        </label>
        <textarea id="_data" placeholder='（选填）你可以在这里填写向请求data中额外添加的键值对' require = false></textarea>
        <button id='tempConfig_save'>保存</button>
    </div>
`;

const CompletConfigEditHTML = `
    <div class='CFBetter_setting_menu' id='config_edit_menu'>
        <div class="tool-box">
            <button class="btn-close">×</button>
        </div>
        <h4>配置</h4>
        <hr>
        <label for='note'>
            <span class="input_label">备注:</span>
        </label>
        <input type='text' id='note' class='no_default' placeholder='请为该自定义配置取一个备注名' require = true>
        <div class='CFBetter_setting_list'>
        <label for="complet_isChoose"><span id="loaded_span">启用？</span></label>
            <input type="checkbox" id="complet_isChoose" name="complet_isChoose" require = false>
        </div>
        <div class='CFBetter_setting_list'>
            <label for="complet_genre" style="display: flex;">模板格式</label>
            <div class="help_tip">
                ${helpCircleHTML}
                <div class="tip_text">
                <p>monaco 格式支持 monaco 中 
                <a target="_blank" href="https://microsoft.github.io/monaco-editor/docs.html#interfaces/languages.CompletionItem.html">CompletionItem</a> 
                几乎所有的属性, (注意: 不需要range属性, 脚本会自动计算并添加该属性)</p>
                <p>ace 格式仅支持 ace 中 completers 有限的属性: <code>caption</code>、<code>value</code>, 脚本会自动将其转换为 monaco 格式</p>
                <p>具体你可以前往阅读脚本页的说明</p>
                </div>
            </div>
            <select id="complet_genre" name="complet_genre">
                <option value="monaco">monaco</option>
                <option value="ace">ace</option>
            </select>
        </div>
        <div class='CFBetter_setting_list'>
            <label for="complet_language" style="display: flex;">适用的语言</label>
            <select id="complet_language" name="complet_language">
                <option value="cpp">cpp</option>
                <option value="python">python</option>
                <option value="java">java</option>
                <option value="c">c</option>
            </select>
        </div>
        <label for='complet_jsonUrl'>
            <div style="display: flex;align-items: center;">
                <span class="input_label">JSON URL:</span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text">
                    <p>开启 OJBetter_Bridge 后, 其会响应 GET 请求<code>/mycomplet/*</code>, 并返回在<code>mycomplet</code>文件夹中寻找到的同名文件的内容</p>
                    <p>因此你只需要在 <code>/mycomplet</code> 文件夹中放置你的 JSON 文件即可在本地访问，</p>
                    <p>在配置中你需要填写的 URL 形如: </p>
                    <p><code>http://127.0.0.1:2323/mycomplet/xxx.json</code></p>
                    </div>
                </div>
            </div>
        </label>
        <div class='CFBetter_setting_list alert_warn'>
            <div>
                <p>脚本会完全信任你的 JSON 数据而不进行额外的校验和检查, 因此请勿添加来源不明的 JSON URL,</p>
                <p>特殊构造的数据可能会破坏脚本的正常工作, 甚至执行其他恶意代码</p>
            </div>
        </div>
        <input type='text' id='complet_jsonUrl' class='no_default' placeholder='形如http://127.0.0.1:2323/mycomplet/xxx.json' require = true>
        <button id='tempConfig_save'>保存</button>
    </div>
`;

// 设置按钮面板
async function settingPanel() {
    // 添加按钮
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

    const $settingBtns = $(".CFBetter_setting");
    $settingBtns.click(() => {
        const styleElement = GM_addStyle(darkenPageStyle);
        $settingBtns.prop("disabled", true).addClass("open");
        $("body").append(CFBetterSettingMenu_HTML);

        // 窗口初始化
        addDraggable($('#CFBetter_setting_menu'));

        // help浮窗位置更新
        $('.help-icon').hover(function (event) {
            var menuOffset = $('#CFBetter_setting_menu').offset();
            var mouseX = event.pageX - menuOffset.left;
            var mouseY = event.pageY - menuOffset.top;

            $('.tip_text').css({
                'top': mouseY,
                'left': mouseX
            });
        });

        // 选项卡切换
        $('.CFBetter_setting_sidebar a').click(function (event) {
            event.preventDefault();
            $('.CFBetter_setting_sidebar a').removeClass('active');
            $(this).addClass('active');
            $('.settings-page').removeClass('active');
            const targetPageId = $(this).attr('href').substring(1);
            $('#' + targetPageId).addClass('active');
        });

        // chatgpt配置
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
        let tempConfig = GM_getValue('chatgpt-config'); // 缓存配置信息
        tempConfig = setupConfigManagement('#chatgpt-config', 'chatgpt_config_', tempConfig, chatgptStructure, chatgptConfigEditHTML, checkable);

        // Complet配置
        const CompletStructure = {
            '#note': 'note',
            '#complet_isChoose': 'isChoose',
            '#complet_genre': 'genre',
            '#complet_language': 'language',
            '#complet_jsonUrl': 'jsonUrl',
        }
        const Completcheckable = []
        let tempConfig_Complet = GM_getValue('Complet_config'); // 缓存配置信息
        tempConfig_Complet = setupConfigManagement('#Complet_config', 'complet_config_', tempConfig_Complet, CompletStructure, CompletConfigEditHTML, Completcheckable);

        // 状态更新
        $("#bottomZh_CN").prop("checked", GM_getValue("bottomZh_CN") === true);
        $("input[name='darkMode'][value='" + darkMode + "']").prop("checked", true);
        $("#showLoading").prop("checked", GM_getValue("showLoading") === true);
        $("#expandFoldingblocks").prop("checked", GM_getValue("expandFoldingblocks") === true);
        $("#renderPerfOpt").prop("checked", GM_getValue("renderPerfOpt") === true);
        $("#commentPaging").prop("checked", GM_getValue("commentPaging") === true);
        $("#standingsRecolor").prop("checked", GM_getValue("standingsRecolor") === true);
        $("#showJumpToLuogu").prop("checked", GM_getValue("showJumpToLuogu") === true);
        $("#loaded").prop("checked", GM_getValue("loaded") === true);
        $("#hoverTargetAreaDisplay").prop("checked", GM_getValue("hoverTargetAreaDisplay") === true);
        $("#showClistRating_contest").prop("checked", GM_getValue("showClistRating_contest") === true);
        $("#showClistRating_problemset").prop("checked", GM_getValue("showClistRating_problemset") === true);
        $("#showClistRating_problem").prop("checked", GM_getValue("showClistRating_problem") === true);
        $("#RatingHidden").prop("checked", GM_getValue("RatingHidden") === true);
        $("input[name='translation'][value='" + translation + "']").prop("checked", true);
        $("input[name='translation']").css("color", "gray");
        if (translation == "openai") {
            $("#openai").show();
            if (tempConfig && $("#chatgpt_config_config_bar_ul").length) {
                $("#chatgpt_config_config_bar_ul").find(`input[name='config_item'][value='${tempConfig.choice}']`).prop("checked", true);
            }
        };
        $("#openai_isStream").prop("checked", GM_getValue("openai_isStream") === true);
        $('#comment_translation_choice').val(GM_getValue("commentTranslationChoice"));
        $("#autoTranslation").prop("checked", GM_getValue("autoTranslation") === true);
        $('#shortTextLength').val(GM_getValue("shortTextLength"));
        $("#allowMixTrans").prop("checked", GM_getValue("allowMixTrans") === true);
        $('.CFBetter_checkboxs').find('input[type="checkbox"][name="mixedTranslation"]').each(function () {
            if (mixedTranslation.indexOf($(this).val()) > -1) {
                $(this).prop('checked', true);
            }
        });
        $('#comment_translation_mode').val(GM_getValue("commentTranslationMode"));
        $("#memoryTranslateHistory").prop("checked", GM_getValue("memoryTranslateHistory") === true);
        $('#transWaitTime').val(GM_getValue("transWaitTime"));
        $('#translation_replaceSymbol').val(GM_getValue("replaceSymbol"));
        $("#filterTextWithoutEmphasis").prop("checked", GM_getValue("filterTextWithoutEmphasis") === true);
        $('#translation_retransAction').val(GM_getValue("retransAction"));
        $("#clist_Authorization").val(GM_getValue("clist_Authorization"));
        $("#problemPageCodeEditor").prop("checked", GM_getValue("problemPageCodeEditor") === true);
        $("#isCodeSubmitConfirm").prop("checked", GM_getValue("isCodeSubmitConfirm") === true);
        $("#cppCodeTemplateComplete").prop("checked", GM_getValue("cppCodeTemplateComplete") === true);
        $("#useLSP").prop("checked", GM_getValue("useLSP") === true);
        $("#OJBetter_Bridge_WorkUri").val(GM_getValue("OJBetter_Bridge_WorkUri"));
        $("#OJBetter_Bridge_SocketUrl").val(GM_getValue("OJBetter_Bridge_SocketUrl"));
        $("input[name='compiler'][value='" + onlineCompilerChoice + "']").prop("checked", true);
        $("input[name='compiler']").css("color", "gray");

        // 配置选择情况监听
        $("input[name='config_item']").change(function () {
            var selected = $(this).val(); // 获取当前选中的值
            tempConfig.choice = selected;
        });

        // 关闭
        const $settingMenu = $(".CFBetter_setting_menu");
        $settingMenu.on("click", ".btn-close", async () => {
            // 设置的数据
            const settings = {
                bottomZh_CN: $("#bottomZh_CN").prop("checked"),
                darkMode: $("input[name='darkMode']:checked").val(),
                showLoading: $("#showLoading").prop("checked"),
                hoverTargetAreaDisplay: $("#hoverTargetAreaDisplay").prop("checked"),
                expandFoldingblocks: $("#expandFoldingblocks").prop("checked"),
                renderPerfOpt: $("#renderPerfOpt").prop("checked"),
                commentPaging: $("#commentPaging").prop("checked"),
                standingsRecolor: $("#standingsRecolor").prop("checked"),
                showJumpToLuogu: $("#showJumpToLuogu").prop("checked"),
                loaded: $("#loaded").prop("checked"),
                translation: $("input[name='translation']:checked").val(),
                openai_isStream: $("#openai_isStream").prop("checked"),
                commentTranslationChoice: $('#comment_translation_choice').val(),
                autoTranslation: $("#autoTranslation").prop("checked"),
                shortTextLength: $('#shortTextLength').val(),
                allowMixTrans: $("#allowMixTrans").prop("checked"),
                mixedTranslation: (() => {
                    let mixedTranslation = [];
                    $('.CFBetter_checkboxs').find('input[type="checkbox"][name="mixedTranslation"]').each(function () {
                        if ($(this).is(":checked")) {
                            mixedTranslation.push($(this).val());
                        }
                    });
                    return mixedTranslation;
                })(),
                commentTranslationMode: $('#comment_translation_mode').val(),
                memoryTranslateHistory: $('#memoryTranslateHistory').prop("checked"),
                transWaitTime: $('#transWaitTime').val(),
                replaceSymbol: $('#translation_replaceSymbol').val(),
                filterTextWithoutEmphasis: $('#filterTextWithoutEmphasis').prop("checked"),
                retransAction: $('#translation_retransAction').val(),
                showClistRating_contest: $('#showClistRating_contest').prop("checked"),
                showClistRating_problemset: $('#showClistRating_problemset').prop("checked"),
                showClistRating_problem: $('#showClistRating_problem').prop("checked"),
                RatingHidden: $('#RatingHidden').prop("checked"),
                clist_Authorization: $('#clist_Authorization').val(),
                problemPageCodeEditor: $("#problemPageCodeEditor").prop("checked"),
                isCodeSubmitConfirm: $("#isCodeSubmitConfirm").prop("checked"),
                cppCodeTemplateComplete: $("#cppCodeTemplateComplete").prop("checked"),
                useLSP: $("#useLSP").prop("checked"),
                OJBetter_Bridge_WorkUri: $('#OJBetter_Bridge_WorkUri').val().replace(/\\/g, '/').replace(/\/$/, ''),
                OJBetter_Bridge_SocketUrl: $('#OJBetter_Bridge_SocketUrl').val(),
                onlineCompilerChoice: $("input[name='compiler']:checked").val(),
            };
            // tempConfigs的数据
            const tempConfigs = {
                'chatgpt-config': tempConfig,
                'Complet_config': tempConfig_Complet
            }

            // 判断是否改变
            let hasChange = false;
            for (const [key, value] of Object.entries(settings)) {
                if (!hasChange) {
                    const storedValue = GM_getValue(key);

                    if (Array.isArray(value) && Array.isArray(storedValue)) {
                        hasChange = JSON.stringify(value) !== JSON.stringify(storedValue);
                    } else {
                        hasChange = value !== storedValue;
                    }
                }
            }

            for (const [key, value] of Object.entries(tempConfigs)) {
                if (!hasChange && (JSON.stringify(GM_getValue(key)) != JSON.stringify(value))) hasChange = true;
            }

            if (hasChange) {
                const shouldSave = await createDialog("配置已更改，是否保存？", "", ["保存", "不保存"]); // 配置改变保存确认
                if (shouldSave) {
                    // 数据校验
                    if (settings.translation === "openai") {
                        var selectedIndex = $('input[name="config_item"]:checked').closest('li').index();
                        if (selectedIndex === -1) {
                            $('#configControlTip').text('请选择一项配置！');
                            $('.CFBetter_setting_sidebar a').removeClass('active');
                            $('#sidebar-translation-settings').addClass('active');
                            $('.settings-page').removeClass('active');
                            $('#translation-settings').addClass('active');
                            return;
                        }
                    }

                    // 保存数据
                    let refreshPage = false; // 是否需要刷新页面
                    for (const [key, value] of Object.entries(settings)) {
                        if (!refreshPage && !(key == 'translation' || key == 'darkMode' ||
                            key == 'replaceSymbol' || key == 'commentTranslationChoice')) {
                            if (GM_getValue(key) != value) refreshPage = true;
                        }
                        GM_setValue(key, value);
                    }
                    for (const [key, value] of Object.entries(tempConfigs)) {
                        if (!refreshPage && (JSON.stringify(GM_getValue(key)) != JSON.stringify(value))) refreshPage = true;
                        GM_setValue(key, value);
                    }

                    if (refreshPage) location.reload();
                    else {
                        // 切换黑暗模式
                        if (darkMode != settings.darkMode) {
                            darkMode = settings.darkMode;
                            // 移除旧的事件监听器
                            changeEventListeners.forEach(listener => {
                                mediaQueryList.removeEventListener('change', listener);
                            });

                            if (darkMode == "follow") {
                                changeEventListeners.push(handleColorSchemeChange);
                                mediaQueryList.addEventListener('change', handleColorSchemeChange);
                                $('html').removeAttr('data-theme');
                            } else if (darkMode == "dark") {
                                $('html').attr('data-theme', 'dark');
                                if (editor) {
                                    monaco.editor.setTheme('vs-dark');
                                }
                            } else {
                                $('html').attr('data-theme', 'light');
                                if (editor) {
                                    monaco.editor.setTheme('vs');
                                }
                                // 移除旧的事件监听器
                                const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
                                window.matchMedia('(prefers-color-scheme: dark)');
                            }
                        }
                        // 更新配置信息
                        translation = settings.translation;
                        replaceSymbol = settings.replaceSymbol;
                        commentTranslationChoice = settings.commentTranslationChoice;
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
                }
            }

            $settingMenu.remove();
            $settingBtns.prop("disabled", false).removeClass("open");
            $(styleElement).remove();
        });
    });
};

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
            node.classList.contains('html2md-panel') ||
            node.classList.contains('likeForm');
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
                var ths = trs[0].querySelectorAll('td,th');
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

/**
 * 任务队列
 */
class TaskQueue {
    constructor() {
        this.taskQueues = {};
        this.isProcessing = {}; // 处理状态
        this.delays = {}; // 等待时间（毫秒）
    }

    getDelay(type) {
        if (type === 'openai') {
            return 0;
        } else {
            return transWaitTime;
        }
    }

    /**
     * 添加任务
     * @param {string} type 任务类型
     * @param {function} fn 任务函数
     * @param {boolean} isNonQueueTask 是否为非队列任务
     */
    addTask(type, fn, isNonQueueTask = false) {
        if (!this.taskQueues[type]) {
            this.taskQueues[type] = [];
        }

        if (isNonQueueTask) {
            fn();
        } else {
            this.taskQueues[type].push(fn);

            if (!this.isProcessing[type]) {
                this.processQueue(type);
            }
        }
    }

    async processQueue(type) {
        this.isProcessing[type] = true;

        while (this.taskQueues[type].length > 0) {
            const task = this.taskQueues[type].shift();
            await task();

            if (this.taskQueues[type].length > 0) {
                await this.wait(this.getDelay(type));
            }
        }

        this.isProcessing[type] = false;
    }

    wait(delay) {
        return new Promise(resolve => {
            setTimeout(resolve, delay);
        });
    }
}

// 加载按钮相关函数
async function initTranslateButtonFunc() {
    // 鼠标悬浮时为目标元素区域添加一个覆盖层
    $.fn.addHoverOverlay = function (target) {
        let position = $(target).css('position');
        let display = $(target).css('display');

        this.hover(() => {
            $(target)
                .addClass('overlay')
                .css('position', 'relative');
            if (display == "inline" || display == "contents") {
                $(target).css('display', 'block');
            }
        }, () => {
            $(target)
                .removeClass('overlay')
                .css('position', position);
            if (display == "inline" || display == "contents") {
                $(target).css('display', display);
            }
        })
    }

    /**
     * 获取MarkDown
     * @returns {string} MarkDown
     */
    $.fn.getMarkdown = function () {
        if (this.attr("markdown")) {
            return this.attr("markdown");
        } else {
            let markdown = turndownService.turndown(this.html());
            this.attr("markdown", markdown);
            return markdown;
        }
    }

    // 设置翻译按钮状态
    $.fn.setTransButtonState = function (state, text = null) {
        if (state === 'normal') {
            this
                .text(text ? text : '翻译')
                .prop('disabled', false)
                .css('cursor', 'pointer')
                .removeClass('translating translated error');
        } else if (state === 'translating') {
            this
                .text(text ? text : '翻译中')
                .prop('disabled', true)
                .css('cursor', 'not-allowed')
                .removeClass('translated error')
                .addClass('translating');
        } else if (state === 'translated') {
            this
                .text(text ? text : '已翻译')
                .prop('disabled', false)
                .css('cursor', 'pointer')
                .removeClass('translating error')
                .addClass('translated');
        } else if (state === 'error') {
            this
                .text(text ? text : '翻译出错')
                .prop('disabled', false)
                .css('cursor', 'pointer')
                .removeClass('translating translated')
                .addClass('error');
        }
    }

    // 获取翻译按钮状态
    $.fn.getTransButtonState = function () {
        if (this.hasClass('translating')) {
            return 'translating';
        } else if (this.hasClass('translated')) {
            return 'translated';
        } else if (this.hasClass('error')) {
            return 'error';
        } else {
            return 'normal';
        }
    }

    // 存翻译结果
    $.fn.pushResultToTransButton = function (result) {
        let resultStack = this.data('resultStack');
        if (!resultStack) resultStack = [];
        resultStack.push(result);
        this.data('resultStack', resultStack);
    }

    // 获取翻译结果
    $.fn.getResultFromTransButton = function () {
        return this.data('resultStack');
    }

    // 标记是否为短文本
    $.fn.setIsShortText = function () {
        this.data('isShortText', true);
    }

    // 获取是否为短文本
    $.fn.IsShortText = function () {
        return this.data('isShortText');
    }

    // 标记为不自动翻译
    $.fn.setNotAutoTranslate = function () {
        this.data('notAutoTranslate', true);
    }

    // 获取是否为不自动翻译
    $.fn.getNotAutoTranslate = function () {
        return this.data('notAutoTranslate');
    }

    // 判断是否已经翻译
    $.fn.IsTranslated = function () {
        if (this.hasAttr('translated')) {
            return true;
        } else {
            return false;
        }
    }

    // 判断是否为评论区按钮
    $.fn.IsCommentButton = function () {
        let isCommentButton = this.data('isCommentButton');
        if (isCommentButton == undefined) {
            this.parents('.comments').length > 0 ? isCommentButton = true : isCommentButton = false;
            this.data('isCommentButton', isCommentButton);
        }
        return isCommentButton;
    }
}

// 题目markdown转换/翻译面板
function addButtonPanel(element, suffix, type, is_simple = false) {
    let text;
    if (commentTranslationMode == "1") text = "分段翻译";
    else if (commentTranslationMode == "2") text = "翻译选中";
    else text = "翻译";

    let panel = $(`<div class='html2md-panel input-output-copier'></div>`);
    let viewButton = $(`<button class='html2mdButton' id='html2md-view${suffix}'>MarkDown视图</button>`);
    let copyButton = $(`<button class='html2mdButton' id='html2md-cb${suffix}'>Copy</button>`);
    let translateButton = $(`<button class='html2mdButton translateButton' id='translateButton${suffix}'>${text}</button>`);
    if (!is_simple) panel.append(viewButton);
    if (!is_simple) panel.append(copyButton);
    if ($(element).css("display") !== "none" && !$(element).hasClass('ojbetter-alert')) panel.append(translateButton);

    if (type === "this_level") {
        $(element).before(panel);
    } else if (type === "child_level") {
        $(element).prepend(panel);
    }

    return {
        panel: panel,
        viewButton: viewButton,
        copyButton: copyButton,
        translateButton: translateButton
    }
}

/**
 * 添加MD视图按钮
 * @param {JQuery<HTMLElement>} button 按钮
 * @param {JQuery<HTMLElement>} element 目标元素
 * @param {string} suffix id后缀
 * @param {string} type 类型
 * @returns {void}
 */
function addButtonWithHTML2MD(button, element, suffix, type) {
    if (is_oldLatex || is_acmsguru) {
        button.prop("disabled", true);
    }
    button.click(debounce(function () {
        var target = $(element).get(0);

        /**
         * 检查是否是MarkDown视图 
         * @returns {boolean} 是否是MarkDown视图
         */
        function checkViewmd() {
            if ($(element).attr("viewmd") === "true") {
                return true;
            } else {
                return false;
            }
        }

        /**
         * 设置是否是MarkDown视图
         * @param {boolean} value 是否是MarkDown视图
         * @returns {void}
         */
        function setViewmd(value) {
            $(element).attr("viewmd", value);
            if (value) {
                button.addClass("mdViewed").text("原始内容");
            } else {
                button.removeClass("mdViewed").text("MarkDown视图");
            }
        }

        if (checkViewmd()) {
            setViewmd(false);
            $(element).next(".mdViewContent").remove();
            $(element).show();
        } else {
            setViewmd(true);
            var markdown = $(element).getMarkdown();
            var mdViewContent = $(`<span class="mdViewContent" style="width:auto; height:auto;">${markdown}</span>`);
            $(element).after(mdViewContent);
            $(element).hide();
        }
    }));

    if (hoverTargetAreaDisplay && !is_oldLatex && !is_acmsguru) {
        button.addHoverOverlay($(element));
    }
}

/**
 * 添加复制按钮
 * @param {JQuery<HTMLElement>} button 按钮
 * @param {JQuery<HTMLElement>} element 目标元素
 * @param {string} suffix 后缀
 * @param {string} type 类型
 */
function addButtonWithCopy(button, element, suffix, type) {
    if (is_oldLatex || is_acmsguru) {
        button.prop("disabled", true);
    }

    button.click(debounce(function () {
        var target = $(element).get(0);

        var markdown = $(element).getMarkdown();

        GM_setClipboard(markdown);

        $(this).addClass("copied").text("Copied");

        // 更新复制按钮文本
        setTimeout(() => {
            $(this).removeClass("copied").text("Copy");
        }, 2000);
    }));

    if (hoverTargetAreaDisplay && !is_oldLatex && !is_acmsguru) {
        button.addHoverOverlay($(element));
    }
}

/**
 * 添加翻译按钮
 * @param {JQuery<HTMLElement>} button 按钮
 * @param {JQuery<HTMLElement>} element 目标元素
 * @param {string} suffix 后缀
 * @param {string} type 类型
 * @param {boolean} is_comment 是否是评论
 */
async function addButtonWithTranslation(button, element, suffix, type, is_comment = false) {
    // 标记目标文本是短字符文本
    {
        let length = $(element).getMarkdown().length;
        if (length < shortTextLength) {
            button.setIsShortText();
        }
        // button.after(`<span>${length}</span>`); // 显示字符数
    }

    button.click(debounce(async function () {
        // 重新翻译
        let resultStack = $(this).getResultFromTransButton();
        if (resultStack) {
            let pElements = $(element).find("p.block_selected:not(li p), li.block_selected");
            for (let item of resultStack) {
                if (retransAction == "0") {
                    // 选段翻译不直接移除旧结果
                    if (commentTranslationMode == "2") {
                        // 只移除即将要翻译的段的结果
                        if (pElements.is(item.translateDiv.getDiv().prev())) {
                            item.translateDiv.close();
                        }
                    } else {
                        item.translateDiv.close();
                        $($(element)).find(".translate-problem-statement, .translate-problem-statement-panel").remove();
                    }
                } else {
                    item.translateDiv.foldMainDiv();
                }
            }
        }

        // 翻译
        button.setTransButtonState('translating', '等待翻译中');
        taskQueue.addTask(translation, () => transTask(button, element, type, is_comment), translation == 'openai');
    }));

    // 添加可指定翻译服务的方法调用
    button.data("translatedItBy", function (translation) {
        button.setTransButtonState('translating', '等待翻译中');
        taskQueue.addTask(translation, () => transTask(button, element, type, is_comment, translation), translation == 'openai');
    });

    // 重新翻译提示
    let prevState;
    button.hover(() => {
        let state = button.getTransButtonState();
        if (state !== "normal" && state !== "translating") {
            prevState = state;
            button.setTransButtonState('normal', '重新翻译');
        }
    }, () => {
        if (prevState && button.getTransButtonState() === "normal") {
            button.setTransButtonState(prevState);
            prevState = null;
        }
    });

    // 目标区域指示
    if (hoverTargetAreaDisplay) {
        button.addHoverOverlay($(element));
    }

    // 右键菜单
    $(document).on('contextmenu', '#translateButton' + suffix, function (e) {
        e.preventDefault();

        // 是否为评论的翻译
        let is_comment = button.IsCommentButton();

        // 移除旧的
        if (!$(e.target).closest('.CFBetter_contextmenu').length) {
            $('.CFBetter_contextmenu').remove();
        }

        var menu = $('<div class="CFBetter_contextmenu"></div>');
        var translations = [
            { value: 'deepl', name: 'deepl翻译' },
            { value: 'iflyrec', name: '讯飞听见翻译' },
            { value: 'youdao', name: '有道翻译' },
            { value: 'google', name: 'Google翻译' },
            { value: 'caiyun', name: '彩云小译翻译' },
            { value: 'openai', name: 'ChatGPT翻译' }
        ];
        if (is_comment) {
            var label = $('<label><input type="radio" name="translation" value="0"><span class="CFBetter_contextmenu_label_text">跟随首选项</span></label>');
            menu.append(label);
        }
        translations.forEach(function (translation) {
            var label = $(`<label><input type="radio" name="translation" value="${translation.value}">
            <span class="CFBetter_contextmenu_label_text">${translation.name}</span></label>`);
            menu.append(label);
        });

        // 初始化
        if (is_comment) {
            menu.find(`input[name="translation"][value="${commentTranslationChoice}"]`).prop('checked', true);
        } else {
            menu.find(`input[name="translation"][value="${translation}"]`).prop('checked', true);
        }
        menu.css({
            top: e.pageY + 'px',
            left: e.pageX + 'px'
        }).appendTo('body');

        $(document).one('change', 'input[name="translation"]', function () {
            if (is_comment) {
                commentTranslationChoice = $('input[name="translation"]:checked').val();
                GM_setValue("commentTranslationChoice", commentTranslationChoice);
            } else {
                translation = $('input[name="translation"]:checked').val();
                GM_setValue("translation", translation);
            }
            $('.CFBetter_contextmenu').remove();
        });

        // 点击区域外关闭菜单
        function handleClick(event) {
            if (!$(event.target).closest('.CFBetter_contextmenu').length) {
                $('.CFBetter_contextmenu').remove();
                $(document).off('change', 'input[name="translation"]');
            } else {
                $(document).one('click', handleClick);
            }
        }
        $(document).one('click', handleClick);
    });
}

/**
 * 创建翻译任务
 * @param {JQuery<HTMLElement>} button 按钮
 * @param {HTMLElement} element 目标元素
 * @param {string} type 类型
 * @param {boolean} is_comment 是否是评论
 */
async function transTask(button, element, type, is_comment, translation) {
    var target, element;
    var count = {
        errerNum: 0,
        skipNum: 0
    };
    if (commentTranslationMode == "1") {
        // 分段翻译
        var pElements = $(element).find("p:not(li p), li, .CFBetter_acmsguru");
        for (let i = 0; i < pElements.length; i++) {
            target = $(pElements[i]).eq(0).clone();
            element_node = pElements[i];
            await process(button, target, element_node, type, is_comment, count, translation);
        }
    } else if (commentTranslationMode == "2") {
        // 选段翻译
        var pElements = $(element).find("p.block_selected:not(li p), li.block_selected, .CFBetter_acmsguru");
        for (let i = 0; i < pElements.length; i++) {
            target = $(pElements[i]).eq(0).clone();
            element_node = pElements[i];
            await process(button, target, element_node, type, is_comment, count, translation);
        }
        $(element).find("p.block_selected:not(li p), li.block_selected").removeClass('block_selected');
    } else {
        // 普通翻译
        target = $(element).eq(0).clone();
        if (type === "child_level") $(target).children(':first').remove();
        element_node = $($(element)).get(0);
        await process(button, target, element_node, type, is_comment, count, translation);
    }

    // 翻译完成
    if (!count.errerNum && !count.skipNum) {
        button.setTransButtonState('translated');
    }
}

/**
 * 翻译处理
 * @param {JQuery<HTMLElement>} button 按钮
 * @param {HTMLElement} target 目标元素
 * @param {HTMLElement} element_node 目标节点
 * @param {string} type 类型
 * @param {boolean} is_comment 是否是评论
 */
async function process(button, target, element_node, type, is_comment, count, translation) {
    if (type === "child_level") {
        let div = $("<div>");
        $(element_node).append(div);
        element_node = div.get(0);
    }

    //是否跳过折叠块
    if ($(target).find('.spoiler').length > 0) {
        let content = `
            <div style="display:grid; padding:5px 0px; align-items: center;">
            <p>
            即将翻译的区域中包含折叠块，折叠块可能是代码，通常不需要翻译，现在你需要选择是否跳过这些折叠块，
            </p>
            <p>
            如果其中有你需要翻译的折叠块，可以稍后再单独点击这些折叠块内的翻译按钮进行翻译
            </p>
            </div>
            <p>要跳过折叠块吗？（建议选择跳过）</p>
        `;
        const shouldSkip = await createDialog("是否跳过折叠块？", content, ["跳过", "否"]); //跳过折叠块确认
        if (shouldSkip) {
            $(target).find('.spoiler').remove();
        } else {
            $(target).find('.html2md-panel').remove();
        }
    }

    // 等待结果
    let result;
    button.setTransButtonState('translating');
    result = await blockProcessing(button, target, element_node, is_comment, translation);
    button.pushResultToTransButton(result);

    if (result.status == "error") count.errerNum += 1;
    else if (result.status == "skip") count.skipNum += 1;
    $(target).remove();
}

// 块处理
async function blockProcessing(button, target, element_node, is_comment, translation) {
    if (is_oldLatex || is_acmsguru) {
        target.markdown = $(target).html();
    } else if (!target.markdown) {
        target.markdown = turndownService.turndown($(target).html());
    }
    var result = await translateProblemStatement(button, target.markdown, element_node, is_comment, translation);
    if (result.status == "error") {
        result.translateDiv.classList.add("error_translate");
        button.setTransButtonState('error', '翻译出错');
        $(target).remove();
    } else if (result.status == "skip") {
        button.setTransButtonState('error', '字数超限');
        result.translateDiv.close();
    }
    return result;
}

// 选段翻译支持
async function multiChoiceTranslation() {
    GM_addStyle(`
        .topic .content .ttypography {
            overflow: initial;
        }
    `);

    $(document).on('click', 'p, li:not(:has(.comment)), .CFBetter_acmsguru', function (e) {
        let $this = $(this);
        e.stopPropagation();
        if ($this.hasClass('block_selected')) {
            $this.removeClass('block_selected');
            // 移除对应的按钮 
            $('.CFBetter_MiniTranslateButton').remove("#translateButton_selected_" + $this.attr('CFBetter_p_id'));
        } else {
            let id = getRandomNumber(8);
            $this.attr('CFBetter_p_id', id);
            $this.addClass('block_selected');
            // 添加按钮 
            let menu = $(`<div class="CFBetter_MiniTranslateButton" id='translateButton_selected_${id}'>${translateIcon}</div>`)
                .css({
                    left: $($this).outerWidth(true) + $($this).position().left + 10 + 'px',
                });
            $this.before(menu);

            $("#translateButton_selected_" + id).click(async function () {
                // 处理旧的结果
                if ($this.attr('translated')) {
                    let result = $this.data("resultData");
                    if (retransAction == "0") {
                        result.translateDiv.close();
                    } else {
                        result.translateDiv.foldMainDiv();
                    }
                }
                // 翻译
                let target = $this.eq(0).clone();
                let result = await blockProcessing(translation, target, $this.eq(0), $("#translateButton_selected_" + id), false);
                $this.data("resultData", result);
                $this.removeClass('block_selected');
                // 移除对应的按钮 
                $('.CFBetter_MiniTranslateButton').remove("#translateButton_selected_" + id);
                $this.attr('translated', '1'); // 标记已翻译
            });
        }
    });
}

// 为acmsguru题面重新划分div
function acmsguruReblock() {
    if (commentTranslationMode == '0') {
        // 普通模式下的划分方式
        var html = $('.ttypography').children().html();
        var separator = /(<div align="left" style="margin-top: 1\.0em;"><b>.*?<\/b><\/div>)/g;
        var result = html.split(separator); // 分割代码
        var outputHtml = '';
        var header = '';
        for (var i = 0; i < result.length; i++) {
            if (separator.test(result[i])) {
                header = result[i];
                continue;
            }
            outputHtml += '<div class="ttypography">' + header + result[i] + '</div>';
            header = '';
        }
        $('.ttypography').html(outputHtml);
    }
    else {
        // 分段/选段模式下的划分方式
        $('.ttypography').children().each(function () {
            var html = $(this).html();
            var replacedHtml = html.replace(/(?:<\/div>|<br><br>)(?<text>[\s\S]+?)(?=<br><br>)/g,
                '<div align="left" class="CFBetter_acmsguru" >$<text></div>');
            $(this).html(replacedHtml);
        });
    }
}

/**
 * 添加按钮
 */
function addConversionButton() {
    // 题目页添加按钮
    if (is_problem) {
        let exContentsPageClasses = ["sample-tests"];
        $('.problem-statement').children('div').each((i, e) => {
            var className = $(e).attr('class');
            if (!exContentsPageClasses.includes(className)) {
                var id = "_problem_" + getRandomNumber(8);
                let panel = addButtonPanel(e, id, "this_level");
                addButtonWithHTML2MD(panel.viewButton, e, id, "this_level");
                addButtonWithCopy(panel.copyButton, e, id, "this_level");
                addButtonWithTranslation(panel.translateButton, e, id, "this_level");
                if (i == 0) panel.translateButton.setNotAutoTranslate(); // 题目标题块跳过，不自动翻译
            }
        });
    }
    // 添加按钮到ttypography部分
    $(".ttypography").each(function () {
        // 是否为评论
        let is_comment = false;
        if ($(this).parents('.comments').length > 0) is_comment = true;
        // 题目页不添加
        if (!is_problem || is_acmsguru) {
            let id = "_ttypography_" + getRandomNumber(8);
            let panel = addButtonPanel(this, id, "this_level");
            addButtonWithHTML2MD(panel.viewButton, this, id, "this_level");
            addButtonWithCopy(panel.copyButton, this, id, "this_level");
            addButtonWithTranslation(panel.translateButton, this, id, "this_level", is_comment);
        }
    });

    // 完整题目集页特殊处理
    if (is_completeProblemset) {
        let exContentsPageClasses = ["sample-tests"];
        $('.problem-statement').each(function () {
            $(this).children('div').each(function (i, e) {
                var className = $(e).attr('class');
                if (!exContentsPageClasses.includes(className)) {
                    var id = "_problem_" + getRandomNumber(8);
                    let panel = addButtonPanel(e, id, "this_level");
                    addButtonWithHTML2MD(panel.viewButton, e, id, "this_level");
                    addButtonWithCopy(panel.copyButton, e, id, "this_level");
                    addButtonWithTranslation(panel.translateButton, e, id, "this_level");
                    if (i == 0) panel.translateButton.setNotAutoTranslate(); // 题目标题块跳过，不自动翻译
                }
            });
        });
    }

    // 添加按钮到spoiler部分
    $('.spoiler-content').each(function () {
        if ($(this).find('.html2md-panel').length === 0) {
            let id = "_spoiler_" + getRandomNumber(8);
            let panel = addButtonPanel(this, id, "child_level");
            addButtonWithHTML2MD(panel.viewButton, this, id, "child_level");
            addButtonWithCopy(panel.copyButton, this, id, "child_level");
            addButtonWithTranslation(panel.translateButton, this, id, "child_level");
        }
    });

    // 添加按钮到titled部分
    (function () {
        var elements = [".Virtual.participation", ".Attention", ".Practice"];//只为部分titled添加
        $.each(elements, (i, e) => {
            $(e).each(function () {
                let id = "_titled_" + getRandomNumber(8);
                let nextDiv = $(this).next().children().get(0);
                if (!nextDiv) return;
                let panel = addButtonPanel(nextDiv, id, "child_level", true);
                addButtonWithTranslation(panel.translateButton, nextDiv, id, "child_level");
            });
        });
    })();
    if (is_mSite) {
        $("div[class='_IndexPage_notice']").each(function () {
            let id = "_titled_" + getRandomNumber(8);
            let panel = addButtonPanel(this, id, "this_level", true);
            addButtonWithTranslation(panel.translateButton, this, id, "this_level");
        });
    }

    // 添加按钮到比赛QA部分
    $(".question-response").each(function () {
        let id = "_question_" + getRandomNumber(8);
        let panel = addButtonPanel(this, id, "this_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "this_level");
    });
    if (is_mSite) {
        $("div._ProblemsPage_announcements table tbody tr:gt(0)").each(function () {
            var $nextDiv = $(this).find("td:first");
            let id = "_question_" + getRandomNumber(8);
            let panel = addButtonPanel($nextDiv, id, "this_level", true);
            addButtonWithTranslation(panel.translateButton, $nextDiv, id, "this_level");
        });
    }

    // 添加按钮到弹窗confirm-proto部分
    $(".confirm-proto").each(function () {
        let id = "_titled_" + getRandomNumber(8);
        var $nextDiv = $(this).children().get(0);
        let panel = addButtonPanel($nextDiv, id, "this_level", true);
        addButtonWithTranslation(panel.translateButton, $nextDiv, id, "this_level");
    });

    // 添加按钮到_CatalogHistorySidebarFrame_item部分
    $("._CatalogHistorySidebarFrame_item").each(function () {
        let id = "_history_sidebar_" + getRandomNumber(8);
        let panel = addButtonPanel(this, id, "this_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "this_level");
    });

    $(".problem-lock-link").on("click", function () {
        $(".popup .content div").each(function () {
            let id = "_popup_" + getRandomNumber(8);
            let panel = addButtonPanel(this, id, "this_level", true);
            addButtonWithTranslation(panel.translateButton, this, id, "this_level");
        });
    });

    // 添加按钮到弹窗alert部分
    $(".alert:not(.CFBetter_alert)").each(function () {
        let id = "_alert_" + getRandomNumber(8);
        let panel = addButtonPanel(this, id, "this_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "this_level");
    });

    // 添加按钮到talk-text部分
    $(".talk-text").each(function () {
        let id = "_talk-text_" + getRandomNumber(8);
        let panel = addButtonPanel(this, id, "child_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "child_level");
    });
};

// 等待LaTeX渲染队列全部完成
function waitUntilIdleThenDo(callback) {
    var intervalId = setInterval(function () {
        var queue = MathJax.Hub.queue;
        if (queue.pending === 0 && queue.running === 0) {
            clearInterval(intervalId);
            callback();
        }
    }, 100);
}

// 块替换
function replaceBlock(text, matches, replacements) {
    try {
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            let replacement = '';
            if (replaceSymbol === "1") {
                replacement = `【${i + 1}】`;
            } else if (replaceSymbol === "2") {
                replacement = `{${i + 1}}`;
            } else if (replaceSymbol === "3") {
                replacement = `[${i + 1}]`;
            }
            text = text.replace(match, replacement);
            replacements[replacement] = match;
        }
    } catch (e) { }
    return text;
}

// 块还原
function recoverBlock(translatedText, matches, replacements) {
    for (let i = 0; i < matches.length; i++) {
        let match = matches[i];
        let replacement = replacements[`【${i + 1}】`] || replacements[`[${i + 1}]`] || replacements[`{${i + 1}}`];

        let latexMatch = '(?<latex_block>\\$\\$(\\\\.|[^\\$])*?\\$\\$)|(?<latex_inline>\\$(\\\\.|[^\\$])*?\\$)|';

        let regex = new RegExp(latexMatch + `【\\s*${i + 1}\\s*】|\\[\\s*${i + 1}\\s*\\]|{\\s*${i + 1}\\s*}`, 'g');
        translatedText = translatedText.replace(regex, function (match, ...args) {
            // LaTeX中的不替换
            const groups = args[args.length - 1]; // groups是replace方法的最后一个参数
            if (groups.latex_block || groups.latex_inline) return match;
            // 没有空格则加一个
            const offset = args[args.length - 3]; // offset是replace方法的倒数第三个参数
            let leftSpace = "", rightSpace = "";
            if (!/\s/.test(translatedText[offset - 1])) leftSpace = " ";
            if (!/\s/.test(translatedText[offset + match.length])) rightSpace = " ";
            return leftSpace + replacement + rightSpace;
        });

        regex = new RegExp(latexMatch + `【\\s*${i + 1}(?![】\\d])|(?<![【\\d])${i + 1}\\s*】|\\[\\s*${i + 1}(?![\\]\\d])|(?<![\\[\\d])${i + 1}\\s*\\]|{\\s*${i + 1}(?![}\\d])|(?<![{\\d])${i + 1}\\s*}`, 'g');
        translatedText = translatedText.replace(regex, function (match, ...args) {
            // LaTeX中的不替换
            const groups = args[args.length - 1];
            if (groups.latex_block || groups.latex_inline) return match;
            // 没有空格则加一个
            const offset = args[args.length - 3];
            let leftSpace = "", rightSpace = "";
            if (!/\s/.test(translatedText[offset - 1])) leftSpace = " ";
            if (!/\s/.test(translatedText[offset + match.length])) rightSpace = " ";
            return leftSpace + replacement + rightSpace;
        });
    }
    return translatedText;
}

// 翻译框/翻译处理器
class TranslateDiv {
    constructor(id) {
        this.id = id;
        this.div = $('<div>').attr('id', id).addClass('translateDiv');
        if (!is_completeProblemset) {
            this.div.addClass('input-output-copier');
        }
        this.panelDiv = $('<div>').addClass('translate-problem-statement-panel');
        this.div.append(this.panelDiv);
        this.mainDiv = $('<div>').addClass('translate-problem-statement');
        this.span = $('<span>');
        this.mainDiv.append(this.span);
        this.div.append(this.mainDiv);
        // 信息
        this.topText = $('<div>').addClass('topText');
        this.panelDiv.append(this.topText);

        // 右侧
        this.rightDiv = $('<div>').css('display', 'flex');
        this.panelDiv.append(this.rightDiv);
        this.copyButton = $('<div>').html(copyIcon).addClass('borderlessButton');
        this.rightDiv.append(this.copyButton);
        this.upButton = $('<div>').html(putawayIcon).addClass('borderlessButton');
        this.rightDiv.append(this.upButton);
        this.closeButton = $('<div>').html(closeIcon).addClass('borderlessButton');
        this.rightDiv.append(this.closeButton);
    }

    getDiv() {
        return this.div;
    }

    setTopText(text) {
        this.div.attr("data-topText", text);
        this.topText.text(text);
    }

    getTopText() {
        return this.topText.text();
    }

    updateTranslateDiv(text, is_oldLatex, is_acmsguru) {
        if (is_oldLatex || is_acmsguru) {
            // oldlatex
            text = $.parseHTML(text);
            this.mainDiv.empty().append($(text));
        } else {
            // 渲染MarkDown
            var md = window.markdownit();
            if (!text) text = "";
            var html = md.render(text);
            this.mainDiv.html(html);
            // 渲染Latex
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.mainDiv.get(0)]);
        }
    }

    // 更新不渲染LaTeX
    updateTranslateDiv_WithoutLaTeX(text) {
        // 渲染MarkDown
        var md = window.markdownit();
        if (!text) text = "";
        var html = md.render(text);
        this.mainDiv.html(html);
    }

    // 关闭元素
    close() {
        this.closeButton.click();
    }

    registerUpButtonEvent() {
        this.upButton.on("click", () => {
            if (this.upButton.html() === putawayIcon) {
                this.upButton.html(unfoldIcon);
                $(this.mainDiv).css({
                    display: "none",
                    transition: "height 2s"
                });
            } else {
                // 执行收起操作
                this.upButton.html(putawayIcon);
                $(this.mainDiv).css({
                    display: "",
                    transition: "height 2s"
                });
            }
        });
    }

    // 收起mainDiv
    foldMainDiv() {
        this.upButton.html(unfoldIcon);
        $(this.mainDiv).css({
            display: "none",
            transition: "height 2s"
        });
    }

    // 注册关闭按钮
    registerCloseButtonEvent() {
        this.closeButton.on("click", () => {
            $(this.div).remove();
            $(this.panelDiv).remove();
            if (is_problem && memoryTranslateHistory) {
                ttTree.rmTransResultMap(this.id); // 移除ttTree中的数据
                ttTree.refreshNode(".ttypography");
                updateTransDBData(ttTree.getNodeDate(), ttTree.getTransResultMap()); // 更新DB中的数据
            }
        });
    }

    registerCopyButtonEvent(text) {
        this.copyButton.on("click", () => {
            GM_setClipboard(text);
            this.copyButton.html(copyedIcon);
            this.copyButton.css({ 'fill': '#8bc34a' });
            // 更新TopText
            let topText = this.getTopText();
            this.topText.text("已复制");
            // 复制提示
            setTimeout(() => {
                this.topText.text(topText);
                this.copyButton.html(copyIcon);
                this.copyButton.css({ 'fill': '' });
            }, 2000);
        });
    }

    // 禁用复制按钮
    disableCopyButton() {
        this.copyButton.css({ 'fill': '#ccc' });
        this.copyButton.off("click");
    }
}

// 元素关系树
class ElementsTree {
    constructor(elements) {
        this.node = [];
        this.transResultMap = {};
        this.index = 0;
        this.tagNames = ["DIV", "P", "UL", "LI"]
        this.init($(elements));
    }

    // Iterate through all elements, because there may be multiple ttypography
    init(elements) {
        elements.each((i, e) => {
            this.node.push({}); // add one element
            this.index = 0; // reset index
            this.create(i, $(e));
        });
    }

    // 刷新关系树
    refreshNode(elements) {
        this.node = [];
        this.index = 0;
        this.init($(elements));
    }

    // 创建节点间的关系树
    create(i_, element) {
        var prev = null;
        var node = this.node[i_];
        element.children().each((i, e) => {
            // only add element with tagNames
            if (this.tagNames.includes($(e).prop("tagName"))) {
                prev = this.addNode(i_, prev, e);
            }
            // recursively child element
            if ($(e).children().length > 0 && prev !== null) {
                node[prev].firstChild = this.index;
                this.create(i_, $(e));
            }
        });
    }

    // 向树中添加一个节点
    addNode(i_, prev, e) {
        var node = this.node[i_];
        node[this.index] = {
            prev: prev,
            next: null,
            firstChild: null,
            type: $(e).prop("tagName"),
            isTranslateDiv: $(e).hasClass("translateDiv"),
            topText: $(e).attr("data-topText"),
            id: $(e).attr("id"),
        };

        if (prev !== null) {
            node[prev].next = this.index;
        }

        prev = this.index;

        this.index++;
        return prev;
    }

    getNodeDate() {
        return this.node;
    }

    setNodeDate(node) {
        this.node = node;
    }

    getTransResultMap() {
        return this.transResultMap;
    }

    setTransResultMap(transResultMap) {
        this.transResultMap = transResultMap;
    }

    rmTransResultMap(id) {
        delete this.transResultMap[id];
    }

    addTransResultMap(id, text) {
        this.transResultMap[id] = text;
    }

    getTranslateDivNum(ttTree) {
        var num = 0;
        for (var i in ttTree) {
            if (ttTree[i].isTranslateDiv) {
                num++;
            }
        }
        return num;
    }

    // 恢复目标元素中的translateDiv
    recover(elements) {
        elements.each((i, e) => {
            var ttTreeNode = this.node[i];
            var missingTranslateDivs = this.getTranslateDivNum(ttTreeNode);
            if (missingTranslateDivs > 0) {
                this.recoverOneElement($(e), ttTreeNode);
            }
        });
    }

    recoverOneElement(element, ttTreeNode) {
        this.recoverOneFork(element.children().eq(0), ttTreeNode, 0);
    }

    // 恢复一个分支
    recoverOneFork(pElement, ttTreeNode, index) {
        do {
            // only recover element with tagNames
            if (!this.tagNames.includes(pElement.prop("tagName"))) {
                if (pElement.next().length > 0) {
                    pElement = pElement.next();
                } else {
                    return;
                }
            }
            if (pElement.prop("tagName") !== ttTreeNode[index].type) {
                // console.warn(`类型不同, 元素结构可能已经发生了变化: \nindex: ${index}`);
                // console.warn(pElement);
                return;
            } else {
                // recursively child element
                var node = ttTreeNode[index];
                if (node.firstChild !== null) {
                    this.recoverOneFork(
                        pElement.children().eq(0),
                        ttTreeNode,
                        node.firstChild
                    );
                }
                // check if next node is translateDiv
                if (node.next !== null) {
                    index = node.next;
                    var ne_node = ttTreeNode[index];
                    if (ne_node.isTranslateDiv) {
                        var id = ne_node.id;
                        var topText = ne_node.topText;
                        var text = this.transResultMap[id];
                        // create element after pElement
                        this.reCreateTransDiv(pElement, id, text, topText);
                    }
                    pElement = pElement.next(); // go to next element
                }
            }
        } while (node.next !== null);
    }

    // 重新创建translateDiv
    reCreateTransDiv(pElement, id, translatedText, topText) {
        const translateDiv = new TranslateDiv(id);
        pElement.after(translateDiv.getDiv());
        translateDiv.setTopText(topText);
        translateDiv.registerUpButtonEvent();
        translateDiv.registerCloseButtonEvent();
        if (!is_oldLatex && !is_acmsguru) {
            translateDiv.registerCopyButtonEvent(translatedText);
        } else {
            translateDiv.disableCopyButton();
        }
        translateDiv.updateTranslateDiv(translatedText, is_oldLatex, is_acmsguru);
        // 标记已翻译并添加到翻译按钮的结果栈中
        let transButton = pElement.prev('.html2md-panel').find('.translateButton');
        if (transButton.length == 0) {
            // 如果没有找到，则应该是得在父元素中找到
            transButton = pElement.parent().prev('.html2md-panel').find('.translateButton');
        }
        transButton.pushResultToTransButton({
            translateDiv: translateDiv,
            status: 0
        });
        transButton.setTransButtonState('translated');
    }
}

// 更新TransDB中的翻译数据
async function updateTransDBData(nodeDate, transResultMap) {
    var url = window.location.href.replace(/#/, "");
    try {
        await CFBetterDB.translateData.put({ url, transResultMap, nodeDate });
        return 'translateData saved successfully';
    } catch (error) {
        throw new Error(`Failed to save translateData: ${error}`);
    }
}

// 获取TransDB中保存的翻译数据
async function getTransDBData() {
    var url = window.location.href.replace(/#/, "");
    try {
        const result = await CFBetterDB.translateData.get(url);
        return result;
    } catch (error) {
        throw new Error(`Failed to get translateData: ${error}`);
    }
}

// 初始化恢复翻译结果
async function initTransResultsRecover() {
    ttTree = new ElementsTree(".ttypography"); // 初始化当前页面.ttypography元素的结构树
    let result = await getTransDBData();
    if (!result) return;
    ttTree.setNodeDate(result.nodeDate);
    ttTree.setTransResultMap(result.transResultMap);
    ttTree.recover($(".ttypography"));
}

// 自动翻译
async function initTransWhenViewable() {
    $('.ttypography, .comments').find('.translateButton').each((i, e) => {
        // check if element is not normal or is not short text
        if ($(e).getTransButtonState() !== 'normal' || !$(e).IsShortText() || $(e).getNotAutoTranslate()) {
            return;
        }
        // use Intersection Observer API to check if element is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    let button = $(entry.target);
                    // define transitions
                    let transitions = mixedTranslation;
                    // random transition
                    let trans_ = transitions[Math.floor(Math.random() * transitions.length)];
                    let trans = translation;
                    // check if is comment, use random transition
                    if (allowMixTrans && button.IsCommentButton()) {
                        trans = trans_;
                    }
                    button.data("translatedItBy")(trans);
                    // stop observing element
                    observer.unobserve(entry.target);
                }
            });
        });
        // start observing
        observer.observe(e);
    })
}

// 翻译主方法
async function translateProblemStatement(button, text, element_node, is_comment, translation_) {
    let status = "ok";
    let id = getRandomNumber(8);
    let matches = [];
    let replacements = {};
    let translationService = {
        "deepl": "DeepL",
        "iflyrec": "讯飞听见",
        "youdao": "有道",
        "google": "Google",
        "caiyun": "彩云小译",
        "openai": "ChatGPT"
    };
    let translatedText = "";

    /**
     * LaTeX替换
     * @param {string} text 
     * @returns {string}
     */
    function replaceLatex(text) {
        if (is_oldLatex) {
            let regex = /<span\s+class="tex-span">.*?<\/span>/gi;
            matches = matches.concat(text.match(regex));
            text = replaceBlock(text, matches, replacements);
            text = text.replace(/<p>(.*?)<\/p>/g, "$1\n\n"); // <p/>标签换为换行
        } else if (is_acmsguru) {
            let regex = /<i>.*?<\/i>|<sub>.*?<\/sub>|<sup>.*?<\/sup>|<pre>.*?<\/pre>/gi;
            matches = matches.concat(text.match(regex));
            text = replaceBlock(text, matches, replacements);
        } else if (realTranlate != "openai") {
            // 使用GPT翻译时不必替换latex公式
            let regex = /\$\$(\\.|[^\$])*?\$\$|\$(\\.|[^\$])*?\$/g;
            matches = matches.concat(text.match(regex));
            text = replaceBlock(text, matches, replacements);
        }
        return text;
    }

    /**
     * LaTeX恢复
     * @param {*} translatedText 
     * @returns {string}
     */
    function recoverLatex(translatedText) {
        translatedText = translatedText.replace(/】\s*【/g, '】 【');
        translatedText = translatedText.replace(/\]\s*\[/g, '] [');
        translatedText = translatedText.replace(/\}\s*\{/g, '} {');
        if (is_oldLatex) {
            translatedText = translatedText.replace(/(.+?)(\n\n|$)/g, "<p>$1</p>"); // 还原为<p/>标签
            translatedText = recoverBlock(translatedText, matches, replacements);
        } else if (is_acmsguru) {
            translatedText = recoverBlock(translatedText, matches, replacements);
        } else if (realTranlate != "openai") {
            translatedText = recoverBlock(translatedText, matches, replacements);
        }
        return translatedText;
    }

    /**
     * 格式化翻译结果
     * @param {string} translatedText 
     * @returns {string} 处理后的翻译结果
     */
    function formatText(translatedText) {
        // 转义LaTex中的特殊符号
        if (!is_oldLatex && !is_acmsguru) {
            const escapeRules = [
                { pattern: /(?<!\\)>(?!\s)/g, replacement: " &gt; " }, // >符号
                { pattern: /(?<!\\)</g, replacement: " &lt; " }, // <符号
                { pattern: /(?<!\\)\*/g, replacement: " &#42; " }, // *符号
                { pattern: /(?<!\\)_/g, replacement: " &#95; " }, // _符号
                { pattern: /(?<!\\)\\\\(?=\s)/g, replacement: "\\\\\\\\" }, // \\符号
                { pattern: /(?<!\\)\\(?![\\a-zA-Z0-9])/g, replacement: "\\\\" }, // \符号
            ];

            let latexMatches = [...translatedText.matchAll(/\$\$([\s\S]*?)\$\$|\$(.*?)\$|\$([\s\S]*?)\$/g)];

            for (const match of latexMatches) {
                const matchedText = match[0];
                let escapedText = matchedText;

                for (const rule of escapeRules) {
                    escapedText = escapedText.replaceAll(rule.pattern, rule.replacement);
                }
                escapedText = escapedText.replace(/\$\$/g, "$$$$$$$$");// $$符号（因为后面需要作为replacement）
                translatedText = translatedText.replace(matchedText, escapedText);
            }
        }

        // 使符合mathjx的转换语法
        const mathjaxRuleMap = [
            { pattern: /\$/g, replacement: "$$$$$$" }, // $$ 行间
        ];
        mathjaxRuleMap.forEach(({ pattern, replacement }) => {
            translatedText = translatedText.replace(pattern, replacement);
        });

        // markdown修正
        const mdRuleMap = [
            { pattern: /(\s_[\u4e00-\u9fa5]+_)([\u4e00-\u9fa5]+)/g, replacement: "$1 $2" }, // 斜体
            { pattern: /(_[\u4e00-\u9fa5]+_\s)([\u4e00-\u9fa5]+)/g, replacement: " $1$2" },
            { pattern: /(_[\u4e00-\u9fa5]+_)([\u4e00-\u9fa5]+)/g, replacement: " $1 $2" },
            { pattern: /（([\s\S]*?)）/g, replacement: "($1)" }, // 中文（）
            // { pattern: /：/g, replacement: ":" }, // 中文：
            { pattern: /\*\* (.*?) \*\*/g, replacement: "\*\*$1\*\*" } // 加粗
        ];
        mdRuleMap.forEach(({ pattern, replacement }) => {
            translatedText = translatedText.replace(pattern, replacement);
        });

        return translatedText;
    }

    // 创建翻译结果元素并放在element_node的后面
    const translateDiv = new TranslateDiv(id);
    $(element_node).after(translateDiv.getDiv());

    // 当前实际翻译服务
    let realTranlate;
    if (translation_) {
        realTranlate = translation_;
    } else {
        if (is_comment && commentTranslationChoice != "0") realTranlate = commentTranslationChoice;
        else realTranlate = translation;
    }

    // 信息
    translateDiv.setTopText(translationService[realTranlate] + ' 翻译');

    // 注册按钮
    translateDiv.registerUpButtonEvent();
    translateDiv.registerCloseButtonEvent();

    // 替换latex公式
    text = replaceLatex(text);

    // 过滤**号
    if (filterTextWithoutEmphasis && GM_getValue("translation") !== "openai") {
        text = text.replace(/\*\*/g, "");
    }

    // 字符数上限
    const translationLimits = {
        deepl: 5000,
        iflyrec: 2000,
        youdao: 600,
        google: 5000,
        caiyun: 5000
    };
    if (translationLimits.hasOwnProperty(realTranlate) && text.length > translationLimits[realTranlate]) {
        let textLength = translationLimits[realTranlate];
        let realTextLength = text.length;
        let content = `
        <p>即将翻译的内容共 <strong>${realTextLength}</strong> 字符</p>
        <p>这超出了当前翻译服务的 <strong>${textLength}</strong> 字符上限，请更换翻译服务，或在设置面板中开启“分段翻译”</p>

        <div style="display:flex; padding:5px 0px; align-items: center;">
        ${helpCircleHTML}
        <p>
        注意，可能你选择了错误的翻译按钮<br>
        由于实现方式，区域中会出现多个翻译按钮，请点击更小的子区域中的翻译按钮
        </p>
        </div>
        <p>你确定要继续翻译吗？</p>
        `;
        const shouldContinue = await createDialog("字符数超限! ", content, ["仍要翻译", "取消"], "continue"); // 字数超限确认
        if (!shouldContinue) {
            return {
                translateDiv: translateDiv,
                status: "skip"
            };
        }
    }
    // 翻译
    async function translate(translation) {
        try {
            if (translation == "deepl") {
                translateDiv.updateTranslateDiv(`正在使用 ${translationService[translation]} 翻译中……请稍等`, is_oldLatex, is_acmsguru);
                translatedText = await translate_deepl(text);
            } else if (translation == "iflyrec") {
                translateDiv.updateTranslateDiv(`正在使用 ${translationService[translation]} 翻译中……请稍等`, is_oldLatex, is_acmsguru);
                translatedText = await translate_iflyrec(text);
            } else if (translation == "youdao") {
                translateDiv.updateTranslateDiv(`正在使用 ${translationService[translation]} 翻译中……请稍等`, is_oldLatex, is_acmsguru);
                translatedText = await translate_youdao_mobile(text);
            } else if (translation == "google") {
                translateDiv.updateTranslateDiv(`正在使用 ${translationService[translation]} 翻译中……请稍等`, is_oldLatex, is_acmsguru);
                translatedText = await translate_gg(text);
            } else if (translation == "caiyun") {
                translateDiv.updateTranslateDiv(`正在使用 ${translationService[translation]} 翻译中……请稍等`, is_oldLatex, is_acmsguru);
                await translate_caiyun_startup();
                translatedText = await translate_caiyun(text);
            } else if (translation == "openai") {
                translateDiv.updateTranslateDiv(`正在使用 ChatGPT 翻译中……请稍等\n\n应用的配置： ${opneaiConfig.configurations[opneaiConfig.choice].note}\n\n${!openai_isStream
                    ? "当前未开启流式传输，你需要等待很长时间才能看到结果，请耐心等待" : ""}`,
                    is_oldLatex, is_acmsguru);
                if (openai_isStream) {
                    // 流式传输
                    translatedText = '';
                    try {
                        for await (const delta of translate_openai_stream(text)) {
                            translatedText += delta;
                            // 翻译结果面板更新
                            translateDiv.updateTranslateDiv_WithoutLaTeX(translatedText, is_oldLatex, is_acmsguru);
                        }
                    } catch (error) {
                        console.error('Error while translating:', error);
                    }
                } else {
                    // 普通模式
                    translatedText = await translate_openai(text);
                }
            }
            if (/^翻译出错/.test(translatedText)) status = "error";
        } catch (error) {
            status = "error";
            translatedText = error;
        }
    }
    await translate(realTranlate);

    // 还原latex公式
    translatedText = recoverLatex(translatedText);

    // 注册结果复制按钮
    if (!is_oldLatex && !is_acmsguru) {
        translateDiv.registerCopyButtonEvent(translatedText);
    } else {
        translateDiv.disableCopyButton();
    }

    // 翻译结果格式化
    translatedText = formatText(translatedText);

    // 保存翻译结果
    if ((is_problem || is_completeProblemset) && memoryTranslateHistory) {
        ttTree.refreshNode(".ttypography"); // 刷新当前页面.ttypography元素的结构树实例
        ttTree.addTransResultMap(id, translatedText);
        updateTransDBData(ttTree.getNodeDate(), ttTree.getTransResultMap()); // 更新翻译结果到transDB
    }

    // 翻译结果面板更新
    translateDiv.updateTranslateDiv(translatedText, is_oldLatex, is_acmsguru);

    return {
        translateDiv: translateDiv,
        status: status
    };
}

//弹窗翻译
function alertZh() {
    var _alert = window.alert;
    window.alert = async function (msg) {
        _alert(msg + "\n=========翻译=========\n" + await translate_deepl(msg));
        return true;
    }
};

// 折叠块展开
function ExpandFoldingblocks() {
    $('.spoiler').addClass('spoiler-open');
    $('.spoiler-content').attr('style', '');
};

// 折叠块渲染优化
function RenderPerfOpt() {
    GM_addStyle(`
        .spoiler-content {
            contain: layout style;
        }
    `);
}

// 分页
function CommentPagination() {
    GM_addStyle(`
        .comments > .comment {
            display: none;
        }
        #next-page-btn, #prev-page-btn {
            display: none;
        }
        #jump-input, #items-per-page{
            height: 22px;
            border: 1px solid #dcdfe6;
            border-radius: 0.3rem;
        }
        #jump-input:focus-visible{
            border-style: solid;
            border-color: #3f51b5;
            outline: none;
        }
    `);
    $('.comments').after(`
            <div id="pagBar" style="display: flex; align-items: center; justify-content: center; color: #606266;">
                <label for="items-per-page">每页展示主楼数：</label>
                <select id="items-per-page" style="margin-right: 15px;">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
                <div class="paging" style="margin-right: 15px;">
                    <span id="current-page">1</span> / <span id="total-pages"></span>
                </div>
                <input type="text" id="jump-input" placeholder="跳转到页码">
                <button type="button" id="jump-btn" class="html2mdButton">跳转</button>
                <button id="prev-page-btn" class="html2mdButton">上一页</button>
                <button id="next-page-btn" class="html2mdButton">下一页</button>
            </div>
        `);

    let batchSize = 5;
    let elements = $(".comments > .comment").slice(0, -1);
    let start = 0;
    let end = batchSize;
    let currentPage = 1;
    let displayedIndexes = []; // 存储已显示元素的索引

    function showBatch(start, end) {
        // 隐藏上一页
        for (var i = 0; i < displayedIndexes.length; i++) {
            elements.eq(displayedIndexes[i]).hide();
        }

        displayedIndexes = [];

        // 显示当前页
        elements.slice(start, end).each(function (index) {
            $(this).show();
            displayedIndexes.push(start + index);
        });

        // 更新页码和翻页按钮
        $("#current-page").text(currentPage);
        $("#total-pages").text(Math.ceil(elements.length / batchSize));

        if (currentPage === 1) $("#prev-page-btn").hide();
        else $("#prev-page-btn").show();

        if (end >= elements.length) $("#next-page-btn").hide();
        else $("#next-page-btn").show();
    }

    // 初始化
    var commentID = null;
    var pageURL = window.location.href;
    if (pageURL.includes("#comment-")) {
        // 带评论区锚点的链接
        var startIndex = pageURL.lastIndexOf("#comment-") + 9;
        commentID = pageURL.substring(startIndex);
        var indexInComments = null;
        $(".comments > .comment").each(function (index) {
            $(this).find(".comment-table").each(function () {
                var tableCommentID = $(this).attr("commentid");
                if (tableCommentID === commentID) {
                    indexInComments = index;
                    return false;
                }
            });
        });
        let page = Math.ceil((indexInComments + 1) / batchSize);
        currentPage = !page ? 1 : page;
        showBatch((currentPage - 1) * batchSize, currentPage * batchSize);
        setTimeout(function () {
            window.location.href = pageURL;
        }, 1000);
    } else {
        showBatch(0, batchSize);
    }

    $("#prev-page-btn").on("click", function () {
        var itemsPerPage = parseInt($("#items-per-page").val());
        start = (currentPage - 2) * itemsPerPage;
        end = (currentPage - 1) * itemsPerPage;
        currentPage--;
        showBatch(start, end);
    });

    $("#next-page-btn").on("click", function () {
        var itemsPerPage = parseInt($("#items-per-page").val());
        start = currentPage * itemsPerPage;
        end = (currentPage + 1) * itemsPerPage;
        currentPage++;
        showBatch(start, end);
    });

    $("#jump-btn").on("click", function () {
        var inputPage = parseInt($("#jump-input").val());

        if (inputPage >= 1 && inputPage <= Math.ceil(elements.length / parseInt($("#items-per-page").val()))) {
            var itemsPerPage = parseInt($("#items-per-page").val());
            start = (inputPage - 1) * itemsPerPage;
            end = inputPage * itemsPerPage;
            currentPage = inputPage; // 更新当前页码
            showBatch(start, end);
        }
    });

    $("#items-per-page").on("change", function () {
        batchSize = parseInt($(this).val());
        let page = Math.ceil(end / batchSize);
        currentPage = !page ? 1 : page;
        let maxPage = Math.ceil(elements.length / batchSize);
        if (currentPage > maxPage) currentPage = maxPage;
        showBatch((currentPage - 1) * batchSize, currentPage * batchSize);
    });
}

// 跳转洛谷
function getProblemId(url) {
    const regex = url.includes('/contest/')
        ? /\/contest\/(\d+)\/problem\/([A-Za-z\d]+)/
        : /\/problemset\/problem\/(\d+)\/([A-Za-z\d]+)/;
    const matchResult = url.match(regex);
    return matchResult && matchResult.length >= 3 ? `${matchResult[1]}${matchResult[2]}` : '';
};

async function CF2luogu() {
    const url = window.location.href;
    const problemId = getProblemId(url);
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

    let panelElement;
    if ($('#CF2luoguPanel').length > 0) {
        panelElement = $('#CF2luoguPanel');
    } else {
        panelElement = $("<div>")
            .addClass("html2md-panel")
            .attr("id", "CF2luoguPanel")
            .insertBefore('.problemindexholder');
    }

    const LuoguUrl = `https://www.luogu.com.cn/problem/CF${problemId}`;
    const result = await checkLinkExistence(LuoguUrl);
    if (problemId && result) {
        const problemLink = $("<a>")
            .attr("id", "problemLink")
            .attr("href", LuoguUrl)
            .attr("target", "_blank")
            .html(`<button style="height: 25px;" class="html2mdButton"><img style="width:45px; margin-right:2px;" src="https://cdn.luogu.com.cn/fe/logo.png"></button>`);
        panelElement.append(problemLink);
    }
}

// RatingClass
const ratingClassMap = {
    NaN: "rating_by_clist_colorNaN",
    0: "rating_by_clist_color0",
    1200: "rating_by_clist_color1",
    1400: "rating_by_clist_color2",
    1600: "rating_by_clist_color3",
    1900: "rating_by_clist_color4",
    2100: "rating_by_clist_color5",
    2300: "rating_by_clist_color6",
    2400: "rating_by_clist_color7",
    2600: "rating_by_clist_color8",
    3000: "rating_by_clist_color9"
};
const cssMap = {
    "rating_by_clist_colorNaN": "#cccccc",
    "rating_by_clist_color0": "#808080",
    "rating_by_clist_color1": "#73e473",
    "rating_by_clist_color2": "#77ddbb",
    "rating_by_clist_color3": "#aaaaff",
    "rating_by_clist_color4": "#ff88ff",
    "rating_by_clist_color5": "#ffcc88",
    "rating_by_clist_color6": "#ffbb55",
    "rating_by_clist_color7": "#ff7777",
    "rating_by_clist_color8": "#ff3333",
    "rating_by_clist_color9": "#aa0000"
};
// cookie有效性检查
async function checkCookie(isContest = false) {
    let ok = false, congested = false;
    await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://clist.by:443/api/v3/contest/?limit=1&resource_id=1",
            onload: function (response) {
                if (response.status === 200) ok = true;
                resolve();
            },
            onerror: function (response) {
                console.warn("访问clist.by出现错误，请稍后再试");
                congested = true;
                resolve();
            }
        });
    });
    if (isContest && !ok && !congested) {
        await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://clist.by:443/api/v3/contest/?limit=1&resource_id=1",
                headers: {
                    "Authorization": clist_Authorization
                },
                onload: function (response) {
                    if (response.status === 200) ok = true;
                    resolve();
                },
                onerror: function (response) {
                    console.warn("访问clist.by出现错误，请稍后再试");
                    resolve();
                }
            });
        });
    }
    if (!ok) {
        var state = congested ? `当前访问Clist.by网络拥堵，请求已中断，请稍后再重试` :
            `当前浏览器的Clist.by登录Cookie可能已失效，请打开<a target="_blank" href="https://clist.by/">Clist.by</a>重新登录
         <br>说明：脚本的Clist Rating分显示实现依赖于Clist.by的登录用户Cookie信息，
         <br>脚本不会获取你在Clist.by站点上的具体Cookie信息，具体请阅读脚本页的说明`;
        var newElement = $("<div></div>")
            .addClass("alert alert-error ojbetter-alert").html(`${OJBetterName} —— ${state}`)
            .css({ "margin": "1em", "text-align": "center", "position": "relative" });
        $(".menu-box:first").next().after(newElement);
    }
    return ok;
}
// 创建Rating相关css
function creatRatingCss(hasborder = true) {
    let dynamicCss = "";
    let hiddenCss = RatingHidden ? ":hover" : "";
    for (let cssClass in cssMap) {
        dynamicCss += "." + cssClass + hiddenCss + " {\n";
        let border = hasborder ? `    border: 1px solid ${cssMap[cssClass]};\n` : `    border: 1px solid #dcdfe6;\n`;
        dynamicCss += `    color: ${cssMap[cssClass]};\n${border}}\n`;
    }
    GM_addStyle(dynamicCss);
}
// 模拟请求获取
async function getRating(problem, problem_url, contest = null) {
    problem = problem.replace(/\([\s\S]*?\)/g, '').replace(/^\s+|\s+$/g, '');
    return new Promise((resolve, reject) => {
        const queryString = `search=${problem}&resource=1`;
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://clist.by/problems/?${queryString}`,
            responseType: 'html',
            onload: function (response) {
                const html = response.responseText;
                var cleanedHtml = html.replace(/src=(.|\s)*?"/g, '');
                const trs = $(cleanedHtml).find('table').find('tbody tr');
                let records = [];
                trs.each(function (index) {
                    const rating = $(this).find('.problem-rating-column').text().trim();
                    const link = $(this).find('.problem-name-column').find('a').eq(1).attr('href');
                    var contests = [];
                    $(this).find('.problem-name-column').find('.pull-right a[title], .pull-right span[title]').each(function () {
                        var value = $(this).attr('title');
                        if (value) {
                            value = value.replace(/<br\/?><\/a>/g, '');
                            contests.push(value);
                        }
                    });
                    records.push({ rating: rating, link: link, contests: contests });
                });
                for (let record of records) {
                    let link;
                    if (typeof record.link !== 'undefined') link = record.link.replace(/http:/g, 'https:');
                    if (link == problem_url || link == problem_url + '/') {
                        resolve({
                            rating: parseInt(record.rating),
                            problem: problem
                        });
                        return;
                    } else if (contest != null) {
                        for (let item of record.contests) {
                            if (contest == item) {
                                resolve({
                                    rating: parseInt(record.rating),
                                    problem: problem
                                });
                                return;
                            }
                        }
                    }
                }
                reject('\n' + problem + '未找到该题目的数据\n');
            },
            onerror: function (response) {
                reject(problem + '发生了错误！');
            }
        });
    });
}

async function getRatingFromApi_problem(problem, problem_url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://clist.by:443/api/v4/problem/?name=${problem}&resource__regex=codeforces.com`,
            headers: {
                "Authorization": clist_Authorization
            },
            onload: function (response) {
                if (!response) reject('发生了未知错误！');
                let data = JSON.parse(response.responseText);
                let objects = data.objects;
                let problemsMap = new Map();
                if (objects.length > 0) {
                    for (let i = 0; i < objects.length; i++) {
                        let problem = objects[i];
                        problemsMap.set(problem.url, problem.rating ? problem.rating : NaN);
                    }
                    resolve(problemsMap.get(problem_url));
                }
            }
        });
    });
}

async function getRatingFromApi_contest(event) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://clist.by:443/api/v4/contest/?limit=1&with_problems=true&event=${event}`,
            headers: {
                "Authorization": clist_Authorization
            },
            onload: function (response) {
                if (!response) reject('发生了未知错误！');
                let data = JSON.parse(response.responseText);
                let objects = data.objects;
                let problemsMap = new Map();
                if (objects.length > 0) {
                    var problems = objects[0].problems;
                    for (var i = 0; i < problems.length; i++) {
                        var problem = problems[i];
                        problemsMap.set(problem.url, problem.rating ? problem.rating : NaN);
                    }
                    resolve(problemsMap);
                }
            }
        });
    });
}

function getClassNameByRating(rating) {
    let className = "rating_by_clist_color9";
    if (Number.isNaN(rating)) {
        className = "rating_by_clist_colorNaN";
    } else {
        let keys = Object.keys(ratingClassMap);
        for (let i = 0; i < keys.length; i++) {
            if (rating < keys[i]) {
                className = ratingClassMap[keys[i - 1]];
                break;
            }
        }
    }
    return className;
}

// contest页显示Rating
async function showRatingByClist_contest() {
    if (!await checkCookie(true)) return;
    creatRatingCss();

    let event = encodeURIComponent($('#sidebar').children().first().find('.rtable th').first().text());
    let problemsMap = await getRatingFromApi_contest(event);

    $('.datatable .id.left').each(function () {
        let href = 'https://codeforces.com' + $(this).find('a').attr('href');
        if (problemsMap.has(href)) {
            let rating = problemsMap.get(href);
            let className = getClassNameByRating(rating);

            $(this).find('a').after(`<div class="ratingBadges ${className}"><span class="rating">${rating}</span></div>`);
        }
    });
}
// problemset页显示Rating
async function showRatingByClist_problemset() {
    if (!await checkCookie()) return;
    creatRatingCss();

    const $problems = $('.problems');
    const $trs = $problems.find('tbody tr:gt(0)');

    for (let i = 0; i < $trs.length; i += 3) {
        const promises = [];
        const endIndex = Math.min(i + 3, $trs.length);

        for (let j = i; j < endIndex; j++) {
            const $tds = $($trs[j]).find('td');
            let problem = $($tds[1]).find('a:first').text();
            let problem_url = $($tds[1]).find('a').attr('href');
            problem_url = problem_url.replace(/^\/problemset\/problem\/(\d+)\/(\w+)/, 'https://codeforces.com/contest/$1/problem/$2');

            promises.push(getRating(problem, problem_url).catch(error => console.warn(error)));
        }

        const results = await Promise.all(promises);

        for (let j = i; j < endIndex; j++) {
            const result = results[j - i];
            if (result == undefined) continue;

            let className = getClassNameByRating(result.rating);

            const $tds = $($trs[j]).find('td');
            $($tds[0]).find('a').after(`<div class="ratingBadges ${className}"><span class="rating">${result.rating}</span></div>`);
        }

        // 延时100毫秒
        // await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// problem页显示Rating
async function showRatingByClist_problem() {
    if (!await checkCookie()) return;
    creatRatingCss(false);

    // 题目名
    let problem = $('.header .title').eq(0).text().replace(/[\s\S]*?. /, '');
    if (is_acmsguru) problem = $('h4').eq(0).text().replace(/[\s\S]*?. /, '');

    // 题目链接
    let problem_url = window.location.href;
    if (problem_url.includes('/contest/')) {
        problem_url = problem_url.replace(/\/contest\/(\d+)\/problem\/(\w+)[^\w]*/, '/contest/$1/problem/$2');
    } else {
        problem_url = problem_url.replace(/\/problemset\/problem\/(\d+)\/(\w+)/, '/contest/$1/problem/$2');
    }
    if (is_mSite) problem_url = problem_url.replace(/\/\/(\w+).codeforces.com/, '//codeforces.com'); // 轻量站

    // 比赛名
    // let contest = $('#sidebar').children().first().find('.rtable th').first().text();

    // rating
    let rating = await getRatingFromApi_problem(problem, problem_url);
    let className = getClassNameByRating(rating);

    const RatingHtml = $(`<a id="problemLink" href="https://clist.by/problems/?search=${problem}&resource=1" target="_blank">
        <button style="height: 25px;" class="html2mdButton ratingBadges ${className}">
        ${clistIcon}<span style="padding: 1px 0px 0px 5px;">${rating}</span></button>
        </a>`);
    if ($('#CF2luoguPanel').length > 0) {
        $('#CF2luoguPanel').append(RatingHtml);
    } else {
        const panelElement = $("<div>")
            .addClass("html2md-panel")
            .attr("id", "CF2luoguPanel");
        if (is_mSite) {
            panelElement.insertBefore('.problem-statement');
        } else {
            panelElement.insertBefore('.problemindexholder');
        }
        panelElement.append(RatingHtml);
    }
}

// cf赛制榜单重新着色
function recolorStandings() {
    function getColorValue(value) {
        value = Math.max(0, Math.min(1, value));

        const scale = chroma.scale(['#b71c1c', '#ff9800', '#ffc107', '#00aa00']).mode('lch').domain([0, 0.45, 0.7, 1]);
        return scale(value).hex();
    }
    var maxScores = $('.standings tr:first th:nth-child(n+5)')
        .map(function () {
            return $(this).find('span').text();
        })
        .get();
    $('.standings tr:not(:first):not(:last)').each(function () {
        var thElements = $(this).find('td:nth-child(n+5)');
        thElements.each(function (index) {
            var spanElement = $(this).find('span:first');
            var value = parseInt(spanElement.text());
            if (value <= 0 || /[a-zA-Z]/.test(maxScores[index])) return;
            var colorValue = getColorValue(value / maxScores[index]);
            spanElement.css('color', colorValue);
        });
    });
}

// 语言切换选项value与monaco_language的对应关系
var value_monacoLanguageMap = {
    "4": "pascal", "6": "php", "7": "python", "9": "csharp", "13": "perl", "20": "scala", "31": "python",
    "32": "go", "34": "javascript", "36": "java", "40": "python", "41": "python", "43": "cpp",
    "50": "cpp", "51": "pascal", "52": "cpp", "54": "cpp", "55": "javascript", "59": "cpp", "60": "java",
    "61": "cpp", "65": "csharp", "67": "ruby", "70": "python", "73": "cpp", "74": "java", "75": "rust",
    "77": "kotlin", "79": "csharp", "80": "cpp", "83": "kotlin", "87": "java"
};

// 更新代码提交页的HTML元素
async function CloneOriginalHTML(submitUrl, cacheKey) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: submitUrl,
            responseType: 'html',
            onload: function (response) {
                const html = response.responseText;
                const cloneHTML = $(html);
                localStorage.setItem(cacheKey, html);
                resolve(cloneHTML);
            },
            onerror: function (response) {
                reject('网络错误');
            }
        });
    });
}

// 获取代码提交页的HTML元素
async function getSubmitHTML(submitUrl) {
    const cacheKey = 'CFBetter_CloneOriginalHTML';
    const cookieKey = 'CFBetter_CloneOriginalHTML_time';
    if (getCookie(cookieKey) === '1') {
        // 存在缓存
        CloneOriginalHTML(submitUrl, cacheKey);
        // 校验
        let cloneHTML = $(localStorage.getItem(cacheKey));
        if (cloneHTML.find('form.submit-form').length > 0) {
            return cloneHTML;
        } else {
            // 存在错误，更新缓存
            console.log("%c缓存存在错误，尝试更新", "color:red;");
            console.log(`缓存目标submitUrl: ${submitUrl}`);
            console.log("%c如果下面有新的相关报错，请先确认是否是网络问题，如果不是，请前往讨论区反馈", "color:red;");
            return await CloneOriginalHTML(submitUrl, cacheKey);
        }

    } else {
        // 没有缓存，更新
        document.cookie = `${cookieKey}=1; path=/`;
        return await CloneOriginalHTML(submitUrl, cacheKey);
    }
}

// 代码自动保存
async function saveCode(url, code) {
    try {
        await CFBetterDB.editorCode.put({ url, code });
        return 'Code saved successfully';
    } catch (error) {
        throw new Error('Failed to save code');
    }
}

async function getCode(url) {
    try {
        const result = await CFBetterDB.editorCode.get(url);
        return result ? result.code : null;
    } catch (error) {
        throw new Error('Failed to get code');
    }
}

// 创建表单
async function CreateCodeDevForm(submitUrl, cloneHTML) {
    // 表单
    var formDiv = $('<form method="post" id="CFBetter_SubmitForm"></form>');
    $('.ttypography').after(formDiv);
    formDiv.attr('action', submitUrl + "?csrf_token=" + CF_csrf_token);

    // 顶部区域
    var topDiv = $(`<div class="topDiv"></div>`);
    let selectLang = cloneHTML.find('select[name="programTypeId"]'); // 语言选择
    selectLang.css({ 'margin': '10px 0px' }).attr('id', 'programTypeId');
    topDiv.append(selectLang);
    var topRightDiv = $(`<div class="topRightDiv"></div>`);
    topDiv.append(topRightDiv);
    formDiv.append(topDiv);

    // 问题选择/编号
    var selectProblem = $('<input name="submittedProblemIndex" style="display:none;"></input>');
    let problemCode;
    if (is_acmsguru) {
        problemCode = $('h4').eq(0).text();
        let matchResult = problemCode.match(/([A-Z0-9]+)/);
        problemCode = matchResult[0];
    } else if (is_problemset_problem) {
        let match = window.location.href.match(/\/problem\/([0-9]+?)\/([A-Z0-9]+?)$/);
        problemCode = match[1] + match[2];
        selectProblem.attr('name', 'submittedProblemCode');
    } else {
        problemCode = $('.header .title').eq(0).text();
        let matchResult = problemCode.match(/([A-Z0-9]+)/);
        problemCode = matchResult[0];
    }
    selectProblem.val(problemCode);
    formDiv.append(selectProblem);

    // 隐藏的代码记录
    var sourceDiv = $('<textarea id="sourceCodeTextarea" name="source" style="display: none;"></textarea>');
    formDiv.append(sourceDiv);

    // 代码编辑器
    var editorDiv = $('<div id="CFBetter_editor"></div>');
    formDiv.append(editorDiv);

    // 自定义调试
    var customTestDiv = $(`
        <details id="customTestBlock">
            <summary >自定义测试数据(自动保存)</summary>
            <div id="customTests" style="min-height: 30px;"></div>
            <div id="control" style="display:flex;">
                <div style="display: flex;margin: 5px;">
                    <input type="checkbox" id="onlyCustomTest"}><label for="onlyCustomTest">只测试自定义数据</label>
                </div>
                <div style="display: flex;margin: 5px;">
                    <input type="checkbox" id="DontShowDiff"}><label for="DontShowDiff">不显示差异对比</label>
                </div>
                <button type="button" id="addCustomTest">新建</button>
            </div>
        </details>
    `)
    formDiv.append(customTestDiv);

    // 调试/提交
    var submitDiv = $('<div id="CFBetter_submitDiv"></div>');
    var CompilerSetting = $('<div id="CompilerSetting"><input type="text" id="CompilerArgsInput"></div>');
    submitDiv.append(CompilerSetting);
    var runButton = $('<button class="CFBetter_SubmitButton" id="RunTestButton">样例测试</button>');
    submitDiv.append(runButton);
    var submitButton = $('<input class="CFBetter_SubmitButton" id="SubmitButton" type="submit" value="提交">');
    submitDiv.append(submitButton);
    formDiv.append(submitDiv);

    var from = {
        formDiv: formDiv,
        selectLang: selectLang,
        topRightDiv: topRightDiv,
        sourceDiv: sourceDiv,
        editorDiv: editorDiv,
        runButton: runButton,
        submitButton: submitButton,
        submitDiv: submitDiv
    };
    return from;
}

// 解析ace格式的补全规则(acwing)
function parseAceCompleter(rules, range) {
    const suggestions = [];
    if (rules && rules.templates && rules.templates.items) {
        const items = rules.templates.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const parts = item.caption.split(' ');
            for (let i = 0; i < parts.length; i++) {
                if (item.value.startsWith(parts[i])) {
                    item.value = item.value.replace(parts[i], parts.slice(0, i + 1).join(' '));
                    break;
                }
            }
            const completionItem = {
                label: item.caption,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: item.value,
                range: range
            };
            suggestions.push(completionItem);
        }
    }
    return { suggestions };
}

// 解析monaco格式的补全规则
function parseMonacoCompleter(rules, range) {
    const suggestions_ = [];
    if (rules && rules.suggestions) {
        const suggestion = rules.suggestions;
        for (let i = 0; i < rules.suggestions.length; i++) {
            const item = suggestion[i];
            const completionItem = {
                ...item,
                range: range
            };
            suggestions_.push(completionItem);
        }
    }
    return { suggestions: suggestions_ };
}

/**
 * 创建monaco编辑器的一个实例
 */
async function createMonacoEditor(language, form, support) {
    // 判断monacoLoader是否加载完毕
    async function waitForMonacoLoaderOnload() {
        return new Promise((resolve) => {
            const checkInitialized = () => {
                if (monacoLoaderOnload) {
                    resolve();
                } else {
                    setTimeout(checkInitialized, 100); // 每100毫秒检查一次initialized的值
                }
            };
            checkInitialized();
        });
    }
    if (!monacoLoaderOnload) await waitForMonacoLoaderOnload();

    /**
     * 通用参数
     */
    var id = 0; // 协议中的id标识
    var workspace = language + "_workspace";
    var rootUri = OJBetter_Bridge_WorkUri + "/" + workspace;
    // 文件名
    var InstanceID = getRandomNumber(8).toString();
    var filename = language == "java" ? "hello/src/" + InstanceID : InstanceID;
    // 后缀名
    var fileExtension =
        language === "cpp"
            ? ".cpp"
            : language === "python"
                ? ".py"
                : language === "java"
                    ? ".java"
                    : "";
    var uri = rootUri + "/" + filename + fileExtension;
    var initialized = false; // 是否已初始化
    var serverInfo; // 服务器返回的支持信息
    var model; // model
    var CFBetter_monaco = {};
    window.CFBetter_monaco = CFBetter_monaco; // 全局方法

    /**
     * 一些工具函数
     */
    // 将lsp格式的rang转换为Monaco格式
    CFBetter_monaco.lspRangeToMonacoRange = function (range) {
        const { start, end } = range;
        return new monaco.Range(
            start.line + 1,
            start.character + 1,
            end.line + 1,
            end.character + 1
        );
    };
    // 将Monaco格式的rang转为lsp格式
    CFBetter_monaco.MonacoRangeTolspRange = function (range) {
        return {
            start: {
                line: range.startLineNumber - 1,
                character: range.startColumn - 1,
            },
            end: {
                line: range.endLineNumber - 1,
                character: range.endColumn - 1,
            },
        };
    };
    // 将Monaco格式的position转为lsp格式的
    CFBetter_monaco.MonacoPositionTolspPosition = function (position) {
        return {
            line: position.lineNumber - 1,
            character: position.column - 1,
        };
    };
    // 将Monaco格式的severity转为lsp格式的
    CFBetter_monaco.MonacoSeverityTolspSeverity = function (severity) {
        switch (severity) {
            case 8:
                return 1;
            case 1:
                return 4;
            case 2:
                return 3;
            case 4:
                return 2;
            default:
                return severity;
        }
    };
    // 将lsp格式的severity转为Monaco格式的
    CFBetter_monaco.lspSeverityToMonacoSeverity = function (severity) {
        switch (severity) {
            case 1:
                return 8;
            case 4:
                return 1;
            case 3:
                return 2;
            case 2:
                return 4;
            default:
                return severity;
        }
    };
    // 收集Monaco数据中的rang数据
    CFBetter_monaco.CollectRange = function (item) {
        return {
            startLineNumber: item.startLineNumber,
            startColumn: item.startColumn,
            endLineNumber: item.endLineNumber,
            endColumn: item.endColumn,
        };
    };
    // 收集Monaco position数据中的rang数据
    CFBetter_monaco.CollectRangeByPosition = function (item) {
        var word = model.getWordUntilPosition(item);
        return {
            startLineNumber: item.lineNumber,
            endLineNumber: item.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        };
    };
    // 将lsp格式的Edit转换为Monaco格式
    CFBetter_monaco.lspEditToMonacoEdit = function (edit) {
        const edits = [];

        if (language == "python") {
            for (const item1 of edit.documentChanges) {
                for (const item2 of item1.edits) {
                    const newElement = {
                        textEdit: {
                            range: CFBetter_monaco.lspRangeToMonacoRange(item2.range),
                            text: item2.newText,
                        },
                        resource: monaco.Uri.parse(item1.textDocument.uri),
                        versionId: model.getVersionId(),
                    };
                    edits.push(newElement);
                }
            }
        } else if (language == "java") {
            for (const item1 in edit.changes) {
                edit.changes[item1].forEach((item2) => {
                    const newElement = {
                        textEdit: {
                            range: CFBetter_monaco.lspRangeToMonacoRange(item2.range),
                            text: item2.newText,
                        },
                        resource: uri,
                        versionId: model.getVersionId(),
                    };
                    edits.push(newElement);
                });
            }
        } else {
            for (const key in edit.changes) {
                const arr = edit.changes[key];
                for (const item of arr) {
                    const newElement = {
                        textEdit: {
                            range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                            text: item.newText,
                        },
                        resource: monaco.Uri.parse(key),
                        versionId: model.getVersionId(),
                    };
                    edits.push(newElement);
                }
            }
        }
        return { edits: edits };
    };

    /**
     * 实例化一个editor
     */
    uri = monaco.Uri.file(uri);
    model = monaco.editor.createModel('', language, uri);
    editor = monaco.editor.create(document.getElementById("CFBetter_editor"), {
        model: model,
        rootUri: rootUri,
        fontSize: 15,
        tabSize: 4,
        theme: darkMode == "dark" ? "vs-dark" : "vs",
        bracketPairColorization: {
            enabled: true,
            independentColorPoolPerBracketType: true,
        },
        automaticLayout: true,
        lineNumbersMinChars: 3,
        matchOnWordStartOnly: false,
        wordWrap: "on",
        wrappingIndent: "same",
        glyphMargin: true,
        formatOnType: true,
        scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
        },
        suggest: {
            selectionMode: 'never' // 代码建议不自动选择
        }
    });

    /**
     * 添加快捷功能
     */
    (CFBetter_monaco.addShortCuts = async () => {
        // 从配置信息更新字体大小
        editor.updateOptions({ fontSize: parseInt(editorFontSize) });

        // 调整字体大小
        var changeSize = $(`<div><label for="fontSizeInput">字体大小：</label><input type="number" id="fontSizeInput" value="${editorFontSize}"></div>`)
        form.topRightDiv.append(changeSize);
        changeSize.find('input#fontSizeInput').on('input', function () {
            var size = $(this).val();
            editor.updateOptions({ fontSize: parseInt(size) });
            GM_setValue('editorFontSize', size);
        });

        // 全屏按钮
        var fullscreenButton = $('<button>', {
            'type': 'button',
            'class': 'html2mdButton',
            'text': '全屏'
        });
        form.topRightDiv.append(fullscreenButton);
        fullscreenButton.on('click', enterFullscreen);

        // 固定到底部按钮
        var fixToBottomButton = $('<button>', {
            'type': 'button',
            'class': 'html2mdButton',
            'text': '固定到底部'
        });
        form.topRightDiv.append(fixToBottomButton);
        fixToBottomButton.on('click', fixToBottom);

        // 固定到右侧按钮
        var fixToRightButton = $('<button>', {
            'type': 'button',
            'class': 'html2mdButton',
            'text': '固定到右侧'
        });
        form.topRightDiv.append(fixToRightButton);
        fixToRightButton.on('click', fixToRight);

        // 选择记忆
        if (!monacoEditor_position_init) {
            monacoEditor_position_init = true; // 标记是否已经初始化过
            if (monacoEditor_position == "full") {
                fullscreenButton.click();
            } else if (monacoEditor_position == "bottom") {
                fixToBottomButton.click();
            } else if (monacoEditor_position == "right") {
                fixToRightButton.click();
            }
        }

        // 禁用按钮
        function disableButtons() {
            fullscreenButton.prop("disabled", true);
            fixToBottomButton.prop("disabled", true);
            fixToRightButton.prop("disabled", true);
        }

        // 启用按钮
        function enableButtons() {
            fullscreenButton.prop("disabled", false);
            fixToBottomButton.prop("disabled", false);
            fixToRightButton.prop("disabled", false);
        }

        // 是否固定状态
        var isFixed = false;

        // 进入全屏
        function enterFullscreen() {
            if (isFixed) return; // 如果已经固定则不执行
            var editor = $('#CFBetter_editor');
            editor.addClass('fullscreen');
            var exitButton = $('<button>', {
                'id': 'exitButton',
                'class': 'html2mdButton',
                'text': '退出全屏'
            }).addClass('exit_button').on('click', exitFullscreen);
            $('body').append(exitButton);
            disableButtons();
            GM_setValue("monacoEditor_position", "full");
        }

        // 退出全屏
        function exitFullscreen() {
            var editor = $('#CFBetter_editor');
            editor.removeClass('fullscreen');
            $('#exitButton').remove();
            enableButtons();
            GM_setValue("monacoEditor_position", "initial");
        }

        // 固定到底部
        function fixToBottom() {
            if (isFixed) return; // 如果已经固定则不执行
            var editor = $('#CFBetter_editor');
            editor.addClass('fixed');

            // 创建空白框来防止遮挡下面的内容
            var halfHeight = $(window).height() * 0.5;
            var blankSpace = $('<div>', {
                'id': 'blank-space',
                'style': 'height: ' + (halfHeight + 30) + 'px;'
            });
            $('body').append(blankSpace);
            var cancelButton = $('<button>', {
                'id': 'cancelButton',
                'class': 'html2mdButton',
                'text': '取消固定'
            }).addClass('exit_button bottom').on('click', cancelFixingToBottom);
            $('body').append(cancelButton);
            disableButtons();
            GM_setValue("monacoEditor_position", "bottom");
        }

        // 取消固定到底部
        function cancelFixingToBottom() {
            var editor = $('#CFBetter_editor');
            editor.removeClass('fixed');
            // 移除空白框和取消按钮
            $('#blank-space').remove();
            $('#cancelButton').remove();
            enableButtons();
            GM_setValue("monacoEditor_position", "initial");
        }

        // 固定到右侧边栏
        var sidebarStyle;
        function fixToRight() {
            if (isFixed) return; // 如果已经固定则不执行
            $('#sidebar').hide();

            // 添加样式
            sidebarStyle = GM_addStyle(`
                #body {
                    min-width: 50vw;
                    max-width: 50vw;
                    max-height: 100vh;
                    overflow-y: auto;
                    padding: 0px;
                }
                body {
                    margin: 0px;
                }
                .content-with-sidebar {
                    margin-right: 0px !important;
                }
            `);

            // 包装一层div
            $('#body').wrap('<div id="right-side-wrapper" style="display:flex; max-width: 100vw; overflow: hidden;"></div>');
            var blankSpace = $('<div>', {
                'id': 'blank-space',
                'style': 'float: right; width: 50vw;'
            });
            $('#right-side-wrapper').append(blankSpace);

            var editor = $('#CFBetter_editor');

            // 移到右侧
            editor.prependTo('#blank-space');

            editor.after($('#CFBetter_statusBar'));
            editor.addClass('right-side');

            var cancelButton = $('<button>', {
                'id': 'cancelButton',
                'class': 'html2mdButton',
                'text': '取消固定'
            }).addClass('exit_button bottom').on('click', cancelFixingToRight);
            $('body').append(cancelButton);
            disableButtons();
            GM_setValue("monacoEditor_position", "right");

            // 补丁：修复固定到右侧导致的样例元素.sample-test相关代码重复执行的问题（具体原因未查）
            $('.sample-test').find('.title').each((i, e) => {
                if ($(e).find('.input-output-copier').length > 1) {
                    $(e).find('.input-output-copier').first().remove();
                }
            });
            darkModeStyleAdjustment();
        }

        // 取消固定到右侧边栏
        function cancelFixingToRight() {
            var sidebar = $('#sidebar');
            sidebar.show();

            // 移回来
            var editor = $('#CFBetter_editor');
            editor.insertAfter('#sourceCodeTextarea');
            editor.after($('#CFBetter_statusBar'));
            editor.removeClass('right-side');

            // 移除包装
            $('#blank-space').remove();
            $('#cancelButton').remove();
            $('#body').unwrap();

            if (sidebarStyle) {
                $(sidebarStyle).remove();
            }

            enableButtons();
            GM_setValue("monacoEditor_position", "initial");
        }

        // 代码同步与保存
        var nowUrl = window.location.href;
        nowUrl = nowUrl.replace(/#/, ""); // 当页面存在更改时url会多出一个#，去掉
        const code = await getCode(nowUrl);
        if (code) {
            editor.setValue(code); // 恢复代码
            $('#sourceCodeTextarea').val(code);
        }
        editor.onDidChangeModelContent(async () => {
            // 将monaco editor的内容同步到sourceCodeTextarea
            const code = editor.getValue();
            $('#sourceCodeTextarea').val(code);
            await saveCode(nowUrl, code);
        });
    })();

    /**
     * 注册本地自动补全
     */
    (CFBetter_monaco.RegisterLocalComplet = async () => {
        // 补全器注册函数
        function registMyCompletionItemProvider(language, genre, rule) {
            if (genre == "monaco") {
                monaco.languages.registerCompletionItemProvider(language, {
                    provideCompletionItems: function (model, position) {
                        return parseMonacoCompleter(rule, CFBetter_monaco.CollectRangeByPosition(position));
                    }
                })
            } else if (genre == "ace") {
                monaco.languages.registerCompletionItemProvider(language, {
                    provideCompletionItems: function (model, position) {
                        return parseAceCompleter(rule, CFBetter_monaco.CollectRangeByPosition(position));
                    }
                })
            }
        }

        // 注册acwing cpp 模板
        if (language == "cpp" && cppCodeTemplateComplete) {
            var acwing_cpp_code_completer = JSON.parse(GM_getResourceText("acwing_cpp_code_completer"));
            registMyCompletionItemProvider('cpp', 'ace', acwing_cpp_code_completer);
        }

        // 注册自定义的补全
        let complet_length = CompletConfig.configurations.length;
        if (complet_length > 0) {
            for (let i = 0; i < complet_length; i++) {
                let item = CompletConfig.configurations[i];
                if (item.isChoose && item.language == language) {
                    registMyCompletionItemProvider(item.language, item.genre, await getExternalJSON(item.jsonUrl));
                }
            }
        }
    })();

    if (!support || !useLSP) { return; } // 如果不支持lsp，则到此为止

    /**
     * LSP连接状态指示
     */
    let styleElement;
    var lspStateDiv = $('<div>', {
        'id': 'lspStateDiv',
        'text': '创建LSP连接……'
    }).addClass('await').on('click', () => {
        styleElement = GM_addStyle(darkenPageStyle);
        LSPLog.show();
    });
    form.topRightDiv.prepend(lspStateDiv);

    var LSPLog = $('<div id="LSPLog" style="display: none;"><button class="html2mdButton">关闭</button><div id="LSPLogList" style="overflow: auto;"></div><div>');
    $('body').append(LSPLog);
    var LSPLogList = $('<ul></ul>');
    $('#LSPLogList').append(LSPLogList);
    var closeButton = LSPLog.find('button');
    closeButton.on('click', function () {
        LSPLog.hide();
        $(styleElement).remove();
    });

    /**
     * 推送新的消息到LSP日志中
     * @param {'error' | 'warn' | 'info'} status 
     * @param {string} msg 
     * @param {boolean} data 
     */
    function pushLSPLogMessage(status, msg, data) {
        var li = $('<li>').text('[' + new Date().toLocaleString() + '] ' + msg);
        if (status === 'error') {
            li.attr('style', 'color: #f44336;');
        } else if (status === 'warn') {
            li.attr('style', 'color: #ff9800;');
        } else if (status === 'info') {
            li.attr('style', 'color: #616161;');
        }
        if (data) {
            var jsonText = JSON.stringify(data, null, 2);
            var details = $('<details>');
            var summary = $('<summary>').text('Data');
            var pre = $('<pre>').text(jsonText);
            details.append(summary, pre);
            li.append(details);
        }
        LSPLogList.append(li);
    }

    /**
     * 添加状态底栏
     */
    var statusBar = $('<div id="CFBetter_statusBar">');
    form.editorDiv.after(statusBar);

    /**
     * languageSocket
     */
    var url = OJBetter_Bridge_SocketUrl;
    var languageSocket = new WebSocket(url + language);
    monacoSocket.push(languageSocket);
    var languageSocketState = false;
    var responseHandlers = {}; // 映射表，需要等待返回数据的请求 -> 对应的事件触发函数
    languageSocket.onopen = () => {
        languageSocketState = true;
        lspStateDiv.text('等待初始化回执……');
        pushLSPLogMessage("info", "languageSocket 连接已建立");
    };
    languageSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.id === 0 && message.result) {
            // 初始化完成
            lspStateDiv.removeClass().addClass('success').text('LSP已连接');
            pushLSPLogMessage("info", "Initialization 完成");
            serverInfo = message.result; // 存下服务器支持信息
            CFBetter_monaco.openDocRequest(); // 打开文档
            if (!monacoEditor_language.includes(language)) {
                monacoEditor_language.push(language);
                CFBetter_monaco.RegistrationAfterInit(); // 注册语言及功能
            } else {
                location.reload(); // 这里有问题，先贴个补丁
            }
            CFBetter_monaco.PassiveReceiveHandler(); // 注册被动接收函数
        } else if (message.id === 0 && message.error) {
            pushLSPLogMessage("warn", "Initialization 失败");
        } else if (message.id !== undefined && responseHandlers[message.id]) {
            // 如果收到带有id字段的消息，则回传给对应的事件触发函数
            responseHandlers[message.id](message);
            delete responseHandlers[message.id]; // 删除已处理的事件触发函数
        } else if (message.method == "textDocument/publishDiagnostics") {
            // 接收代码诊断推送
            CFBetter_monaco.updateMarkers(message);
        } else if (message.method == "workspace/applyEdit") {
            // 应用服务器推送的更改
            CFBetter_monaco.applyEdit(message);
        }
    };
    languageSocket.onerror = (error) => {
        pushLSPLogMessage("error", `languageSocket 发生错误`, error);
        console.warn(`连接languageSocket错误: ${error}`)
    };
    languageSocket.onclose = (event) => {
        languageSocketState = false;
        lspStateDiv.removeClass().addClass('error').text('LSP连接已断开');
        pushLSPLogMessage("warn", "languageSocket 连接已关闭");
    };

    /**
     * 等待LanguageSocketState
     */
    async function waitForLanguageSocketState() {
        return new Promise((resolve) => {
            const checkInitialized = () => {
                if (languageSocketState) {
                    resolve();
                } else {
                    setTimeout(checkInitialized, 100); // 每100毫秒检查一次initialized的值
                }
            };
            checkInitialized();
        });
    }

    // 等待lsp响应初始化结果
    async function waitForInitialized() {
        return new Promise((resolve) => {
            const checkInitialized = () => {
                if (initialized) {
                    resolve();
                } else {
                    setTimeout(checkInitialized, 100); // 每100毫秒检查一次initialized的值
                }
            };
            checkInitialized();
        });
    }

    /**
     * 与languageSocket通信的包装方法
     */
    async function sendMessage(data, requiresResponse, callback) {
        if (!initialized) {
            await waitForInitialized(); // 等待initialized为真
        }
        if (requiresResponse) {
            responseHandlers[data.id] = callback; // 将事件触发函数与id关联起来
        }
        if (!languageSocketState) await waitForLanguageSocketState();
        languageSocket.send(JSON.stringify(data));
    }
    // 发送消息并等待返回结果
    function fetchData(params, callback) {
        sendMessage(params, true, callback);
    }
    // 发送消息，不需要等待返回结果
    function sendData(data) {
        sendMessage(data, false);
    }

    /**
     * 代码文件更新fileWebSocket
     */
    var fileWebSocket = new WebSocket(url + "file");
    var fileWebSocketState = false;
    monacoSocket.push(fileWebSocket);
    fileWebSocket.onopen = () => {
        fileWebSocketState = true;
        pushLSPLogMessage("info", "fileWebSocket 连接已建立");
    };
    fileWebSocket.onclose = (ev) => {
        fileWebSocketState = false;
        pushLSPLogMessage("warn", "fileWebSocket 连接已关闭", ev);
    };
    fileWebSocket.onmessage = (ev) => {
        let message = JSON.parse(ev.data);
        if (message.result !== "ok")
            pushLSPLogMessage("error", `update file failed: ${ev}`);
    };
    fileWebSocket.onerror = (error) => {
        console.warn(`连接fileWebSocket错误: ${error}`);
    };
    async function updateFile(workspace, filename, fileExtension, code) {
        async function waitForfileWebSocketState() {
            return new Promise((resolve) => {
                const checkInitialized = () => {
                    if (fileWebSocketState) {
                        resolve();
                    } else {
                        setTimeout(checkInitialized, 100); // 每100毫秒检查一次initialized的值
                    }
                };
                checkInitialized();
            });
        }
        if (!fileWebSocketState) await waitForfileWebSocketState();
        fileWebSocket.send(
            JSON.stringify({
                type: "update",
                workspace,
                filename,
                fileExtension,
                code,
            })
        );
    }

    /**
     * 发送初始化请求
     */
    CFBetter_monaco.Initialize = () => {
        //初始化initialize
        const capabilities = {
            workspace: {
                applyEdit: true,
            },
            textDocument: {
                publishDiagnostics: {
                    relatedInformation: true,
                    versionSupport: false,
                    tagSupport: {
                        valueSet: [1, 2],
                    },
                    codeDescriptionSupport: true,
                },
                completion: {
                    contextSupport: true,
                    completionItem: {
                        snippetSupport: true,
                        commitCharactersSupport: true,
                        documentationFormat: ["markdown", "plaintext"],
                        deprecatedSupport: true,
                        preselectSupport: true,
                        tagSupport: {
                            valueSet: [1],
                        },
                        insertReplaceSupport: true,
                        resolveSupport: {
                            properties: [
                                "documentation",
                                "detail",
                                "additionalTextEdits",
                            ],
                        },
                        insertTextModeSupport: {
                            valueSet: [1, 2],
                        },
                    },
                },
                hover: {
                    dynamicRegistration: true,
                    contentFormat: ["markdown", "plaintext"],
                },
                signatureHelp: {
                    signatureInformation: {
                        documentationFormat: ["markdown", "plaintext"],
                        parameterInformation: {
                            labelOffsetSupport: true,
                        },
                        activeParameterSupport: true,
                    },
                    contextSupport: true,
                },
                definition: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                references: {
                    dynamicRegistration: true,
                },
                documentHighlight: {
                    dynamicRegistration: true,
                },
                codeAction: {
                    codeActionLiteralSupport: {
                        codeActionKind: {
                            valueSet:
                                language == "java"
                                    ? []
                                    : [
                                        "",
                                        "quickfix",
                                        "refactor",
                                        "refactor.extract",
                                        "refactor.inline",
                                        "refactor.rewrite",
                                        "source",
                                        "source.organizeImports",
                                    ],
                        },
                    },
                },
                rename: {
                    dynamicRegistration: true,
                    prepareSupport: true,
                    prepareSupportDefaultBehavior: 1,
                    honorsChangeAnnotations: true,
                },
                documentLink: {
                    tooltipSupport: true,
                },
                typeDefinition: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                implementation: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                colorProvider: {
                    dynamicRegistration: true,
                },
                foldingRange: {
                    dynamicRegistration: true,
                    rangeLimit: 5000,
                    lineFoldingOnly: true,
                },
                declaration: {
                    dynamicRegistration: true,
                    linkSupport: true,
                },
                semanticTokens: {
                    dynamicRegistration: true,
                    tokenTypes: [
                        "namespace",
                        "type",
                        "class",
                        "enum",
                        "interface",
                        "struct",
                        "typeParameter",
                        "parameter",
                        "variable",
                        "property",
                        "enumMember",
                        "event",
                        "function",
                        "method",
                        "macro",
                        "keyword",
                        "modifier",
                        "comment",
                        "string",
                        "number",
                        "regexp",
                        "operator",
                    ],
                    tokenModifiers: [
                        "declaration",
                        "definition",
                        "readonly",
                        "static",
                        "deprecated",
                        "abstract",
                        "async",
                        "modification",
                        "documentation",
                        "defaultLibrary",
                    ],
                    formats: ["relative"],
                    requests: {
                        range: true,
                        full: {
                            delta: true,
                        },
                    },
                    multilineTokenSupport: false,
                    overlappingTokenSupport: false,
                },
                callHierarchy: {
                    dynamicRegistration: true,
                },
            },
            window: {
                showMessage: {
                    messageActionItem: {
                        additionalPropertiesSupport: true,
                    },
                },
                showDocument: {
                    support: true,
                },
                workDoneProgress: true,
            },
            general: {
                regularExpressions: {
                    engine: "ECMAScript",
                    version: "ES2020",
                },
                markdown: {
                    parser: "marked",
                    version: "1.1.0",
                },
            },
        };

        const initializeRequest = {
            id: id++,
            jsonrpc: "2.0",
            method: "initialize",
            params: {
                processId: null,
                clientInfo: {
                    name: "CFMonaco" + InstanceID,
                },
                locale: "zh-CN",
                rootPath: null,
                rootUri: null,
                capabilities: capabilities,
                trace: "off",
                workspaceFolders: [
                    {
                        uri:
                            "file:///" + OJBetter_Bridge_WorkUri + workspace,
                        name:
                            "file:///" + OJBetter_Bridge_WorkUri + workspace,
                    },
                ],
            },
        };
        languageSocket.send(JSON.stringify(initializeRequest));

        // 打开文档函数
        CFBetter_monaco.openDocRequest = function () {
            const initializ = {
                jsonrpc: "2.0",
                method: "initialized",
                params: {},
            };
            languageSocket.send(JSON.stringify(initializ));
            const openDocRequest = {
                jsonrpc: "2.0",
                method: "textDocument/didOpen",
                params: {
                    textDocument: {
                        uri: model.uri.toString(),
                        languageId: language,
                        version: model.getVersionId(),
                        text: model.getValue(),
                    },
                },
            };
            languageSocket.send(JSON.stringify(openDocRequest));
            initialized = true; // 初始化完成，这里确认逻辑待完善
        };

        // 初始化更新文件
        updateFile(workspace, filename, fileExtension, model.getValue());
    }

    /**
     * 注册语言及功能
     */
    CFBetter_monaco.RegistrationAfterInit = () => {
        // 注册语言
        monaco.languages.register({ id: language });

        // 注册"Command"
        (function registerCommand() {
            serverInfo.capabilities.executeCommandProvider.commands.forEach(
                (item) => {
                    pushLSPLogMessage("info", `已注册命令↓`, item);
                    monaco.editor.registerCommand(item, (accessor, ...args) => {
                        sendData({
                            jsonrpc: "2.0",
                            id: id++,
                            method: "workspace/executeCommand",
                            params: {
                                command: item,
                                arguments: args,
                            },
                        });
                    });
                }
            );
        })();

        // 注册"增量更新"
        model.onDidChangeContent((event) => {
            updateFile(workspace, filename, fileExtension, model.getValue()); // 更新文件
            const changeDocRequest = {
                jsonrpc: "2.0",
                method: "textDocument/didChange",
                params: {
                    textDocument: {
                        uri: model.uri.toString(),
                        version: model.getVersionId(),
                    },
                    contentChanges: event.changes.map((change) => ({
                        range: CFBetter_monaco.MonacoRangeTolspRange(change.range),
                        rangeLength: change.rangeLength,
                        text: change.text,
                    })),
                },
            };
            sendData(changeDocRequest);
        });

        //注册"自动补全"
        monaco.languages.registerCompletionItemProvider(language, {
            provideCompletionItems: (model, position, context) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/completion",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        position: CFBetter_monaco.MonacoPositionTolspPosition(position),
                        context: {
                            triggerKind: context.triggerKind + 1, // 这里要+1，两边的定义不一样。。。
                            triggerCharacter: context.triggerCharacter,
                        },
                    },
                };
                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `completion 当前收到的数据↓`, response);
                        if (!result) return resolve(null);
                        const CompletionItems = {
                            suggestions: result.items.map(
                                ({
                                    label,
                                    kind,
                                    filterText,
                                    insertText,
                                    insertTextFormat,
                                    sortText,
                                    textEdit,
                                    documentation,
                                    additionalTextEdits,
                                }) => ({
                                    additionalTextEdits: additionalTextEdits
                                        ? additionalTextEdits.map(({ newText, range }) => ({
                                            text: newText,
                                            range: CFBetter_monaco.lspRangeToMonacoRange(range),
                                        }))
                                        : [],
                                    documentation: documentation ? documentation.value : "",
                                    filterText,
                                    insertText: insertText ? insertText : textEdit.newText,
                                    insertTextRules:
                                        insertTextFormat === 2
                                            ? monaco.languages.CompletionItemInsertTextRule
                                                .InsertAsSnippet
                                            : monaco.languages.CompletionItemInsertTextRule
                                                .KeepWhitespace,
                                    kind,
                                    label,
                                    sortText,
                                    range: textEdit
                                        ? textEdit.range
                                            ? CFBetter_monaco.lspRangeToMonacoRange(textEdit.range)
                                            : CFBetter_monaco.lspRangeToMonacoRange(textEdit.insert)
                                        : null,
                                })
                            ),
                        };
                        pushLSPLogMessage("info", `completion 传递给monaco的数据↓`, CompletionItems);
                        resolve(CompletionItems);
                    });
                });
            },
        });

        // 注册"代码修复"
        monaco.languages.registerCodeActionProvider(language, {
            provideCodeActions: (model, range, context) => {
                const request = {
                    id: id++,
                    jsonrpc: "2.0",
                    method: "textDocument/codeAction",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        range: CFBetter_monaco.MonacoRangeTolspRange(range),
                        context: {
                            diagnostics: context.markers.map((item) => ({
                                range: CFBetter_monaco.MonacoRangeTolspRange({
                                    startLineNumber: item.startLineNumber,
                                    startColumn: item.startColumn,
                                    endLineNumber: item.endLineNumber,
                                    endColumn: item.endColumn,
                                }),
                                severity: CFBetter_monaco.MonacoSeverityTolspSeverity(
                                    item.severity
                                ),
                                code: item.code,
                                source: item.source,
                                message: item.message,
                                tags: item.tags,
                                relatedInformation: item.relatedInformation
                                    ? item.relatedInformation.map((item) => ({
                                        location: {
                                            uri: item.resource.toString(),
                                            range: CFBetter_monaco.MonacoRangeTolspRange({
                                                startLineNumber: item.startLineNumber,
                                                startColumn: item.startColumn,
                                                endLineNumber: item.endLineNumber,
                                                endColumn: item.endColumn,
                                            }),
                                        },
                                        message: item.message,
                                    }))
                                    : null,
                            })),
                            only: context.only ? [context.only] : [],
                            triggerKind: context.trigger,
                        },
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `codeAction 当前收到的数据↓`, response);
                        if (!result) return resolve(null);
                        const codeAction = {
                            actions: result.map((item) => ({
                                title: item.title,
                                kind: item.kind ? item.kind : "quickfix",
                                command: item.command
                                    ? item.command.command
                                        ? {
                                            id: item.command.command,
                                            arguments: item.command.arguments,
                                            title: item.command.title,
                                        }
                                        : null
                                    : null,
                                diagnostics: item.diagnostics
                                    ? item.diagnostics.map((item) => ({
                                        code: item.code,
                                        message: item.message,
                                        range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                                        severity: CFBetter_monaco.lspSeverityToMonacoSeverity(
                                            item.severity
                                        ),
                                        source: item.source,
                                    }))
                                    : null,
                                edit: item.edit
                                    ? CFBetter_monaco.lspEditToMonacoEdit(item.edit)
                                    : item.arguments
                                        ? {
                                            edits: item.arguments.flatMap(
                                                (item1) => CFBetter_monaco.lspEditToMonacoEdit(item1).edits
                                            ),
                                        }
                                        : null,
                            })),
                            dispose: () => { },
                        };
                        pushLSPLogMessage("info", `codeAction 传递给monaco的数据↓`, codeAction);

                        resolve(codeAction);
                    });
                });
            },
        });

        // 注册"hover提示"
        monaco.languages.registerHoverProvider(language, {
            provideHover: (model, position) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/hover",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        position: CFBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        pushLSPLogMessage("info", `Hover 当前收到的数据↓`, response);
                        const result = response.result;

                        if (!result) return resolve(null);
                        const Hover = {
                            range: result.range
                                ? CFBetter_monaco.lspRangeToMonacoRange(result.range)
                                : new monaco.Range(
                                    position.lineNumber,
                                    position.column,
                                    position.lineNumber,
                                    position.column
                                ),
                            contents: Array.isArray(result.contents)
                                ? result.contents.map((item) => ({
                                    value: item.value ? item.value : item,
                                }))
                                : [
                                    {
                                        value: result.contents.value,
                                    },
                                ],
                        };
                        pushLSPLogMessage("info", `Hover 传递给monaco的数据↓`, Hover);
                        resolve(Hover);
                    });
                });
            },
        });

        // 注册"inlay提示"
        if (language == "cpp" || language == "java")
            monaco.languages.registerInlayHintsProvider(language, {
                provideInlayHints: (model, range, token) => {
                    return new Promise((resolve, reject) => {
                        const request = {
                            jsonrpc: "2.0",
                            id: id++,
                            method: "textDocument/inlayHint",
                            params: {
                                textDocument: {
                                    uri: model.uri.toString(),
                                },
                                range: CFBetter_monaco.MonacoRangeTolspRange(range),
                            },
                        };

                        fetchData(request, (response) => {
                            const result = response.result;
                            pushLSPLogMessage("info", `Inlay Hints 当前收到的数据↓`, response);

                            if (!result) return resolve(null);

                            const inlayHints = {
                                hints: result.map((item) => {
                                    return {
                                        kind: item.kind,
                                        label: item.label,
                                        paddingLeft: item.paddingLeft,
                                        paddingRight: item.paddingRight,
                                        position: {
                                            lineNumber: item.position.line + 1,
                                            column: item.position.character + 1,
                                        },
                                    };
                                }),
                            };
                            pushLSPLogMessage("info", `Inlay Hints 传递给monaco的数据↓`, inlayHints);

                            resolve(inlayHints);
                        });
                    });
                },
            });

        // 注册"转到定义"
        monaco.languages.registerDefinitionProvider(language, {
            provideDefinition: (model, position) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/definition",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        position: CFBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `definition 当前收到的数据↓`, response);

                        if (result.length == 0) return resolve(null);
                        const definition = result.map((item) => ({
                            range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                            uri: monaco.Uri.parse(item.uri), //
                        }));
                        pushLSPLogMessage("info", `definition 传递给monaco的数据↓`, definition);

                        resolve(definition);
                    });
                });

                return null; // 如果没有内容，则返回null
            },
        });

        // 注册"转到引用"
        monaco.languages.registerReferenceProvider(language, {
            provideReferences: (model, position, context) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/references",
                    params: {
                        context: context,
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        position: CFBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `references 当前收到的数据↓`, response);

                        if (result.length == 0) return resolve([]);

                        const references = result.map((item) => ({
                            range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                            uri: monaco.Uri.parse(item.uri), //
                        }));
                        pushLSPLogMessage("info", `references 传递给monaco的数据↓`, references);
                        resolve(references);
                    });
                });
                return []; // 如果没有内容，则返回空数组
            },
        });

        // 注册"符号引用点击高亮"
        monaco.languages.registerDocumentHighlightProvider(language, {
            provideDocumentHighlights: (model, position) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/documentHighlight",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        position: CFBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `documentHighlight 当前收到的数据↓`, response);

                        if (!result || result.length == 0) return resolve([]);
                        const highlights = result.map((item) => ({
                            range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                            kind: item.kind,
                        }));
                        pushLSPLogMessage("info",
                            `documentHighlight 传递给monaco的数据↓`,
                            highlights
                        );

                        resolve(highlights);
                    });
                });
                return []; // 如果没有内容，则返回空数组
            },
        });

        // 注册"文件链接"
        if (language == "cpp" || language == "java")
            monaco.languages.registerLinkProvider(language, {
                provideLinks: (model) => {
                    const request = {
                        jsonrpc: "2.0",
                        id: id++,
                        method: "textDocument/documentLink",
                        params: {
                            textDocument: {
                                uri: model.uri.toString(),
                            },
                        },
                    };

                    return new Promise((resolve, reject) => {
                        fetchData(request, (response) => {
                            const result = response.result;
                            pushLSPLogMessage("info", `DocumentLink 当前收到的数据↓`, response);

                            if (!result) return resolve(null);
                            const links = {
                                links: result.map((item) => ({
                                    range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                                    url: item.target.toString(),
                                    tooltip: item.tooltip ? item.tooltip : null,
                                })),
                            };
                            pushLSPLogMessage("info", `DocumentLink 传递给monaco的数据↓`, links);
                            resolve(links);
                        });
                    });
                },
            });

        // 注册"格式化"
        monaco.languages.registerDocumentFormattingEditProvider(language, {
            provideDocumentFormattingEdits: (model, options, token) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/formatting",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        options: options,
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `formatting 当前收到的数据↓`, response);

                        const TextEdit = result.map((edit) => ({
                            range: CFBetter_monaco.lspRangeToMonacoRange(edit.range),
                            text: edit.newText,
                        }));
                        pushLSPLogMessage("info", `formatting 传递给monaco的数据↓`, TextEdit);
                        resolve(TextEdit);
                    });
                });
            },
        });

        // 注册"部分格式化"
        monaco.languages.registerDocumentRangeFormattingEditProvider(language, {
            provideDocumentRangeFormattingEdits: (model, range, options) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/rangeFormatting",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        range: CFBetter_monaco.MonacoRangeTolspRange(range),
                        options,
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `rangeFormatting 当前收到的数据↓`, response);

                        if (!result || result.length == 0) return resolve([]);
                        const edits = result.map((item) => ({
                            range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                            text: item.newText,
                        }));
                        pushLSPLogMessage("info", `rangeFormatting 传递给monaco的数据↓`, edits);
                        resolve(edits);
                    });
                });
            },
        });

        // 注册"重命名"
        monaco.languages.registerRenameProvider(language, {
            provideRenameEdits: (model, position, newName, token) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/rename",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        position: CFBetter_monaco.MonacoPositionTolspPosition(position),
                        newName: newName,
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `rename 当前收到的数据↓`, response);

                        const rename = CFBetter_monaco.lspEditToMonacoEdit(result);
                        pushLSPLogMessage("info", `rename 传递给monaco的数据↓`, rename);
                        resolve(rename);
                    });
                });
            },
        });

        // 注册"折叠范围分析"
        monaco.languages.registerFoldingRangeProvider(language, {
            provideFoldingRanges: (model) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/foldingRange",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `FoldingRange 当前收到的数据↓`, response);

                        if (!result) return resolve([]);
                        const foldingRanges = result.map((item) => ({
                            start: item.startLine + 1,
                            end: item.endLine + 1,
                            kind: monaco.languages.FoldingRangeKind.fromValue(item.kind),
                        }));
                        pushLSPLogMessage("info", `FoldingRange 传递给monaco的数据↓`, foldingRanges);
                        resolve(foldingRanges);
                    });
                });
            },
        });

        // 注册"方法签名提示"
        monaco.languages.registerSignatureHelpProvider(language, {
            signatureHelpTriggerCharacters:
                serverInfo.capabilities.signatureHelpProvider.triggerCharacters,
            provideSignatureHelp: (model, position, token, context) => {
                const request = {
                    jsonrpc: "2.0",
                    id: id++,
                    method: "textDocument/signatureHelp",
                    params: {
                        textDocument: {
                            uri: model.uri.toString(),
                        },
                        position: {
                            line: position.lineNumber - 1,
                            character: position.column - 1,
                        },
                        context: {
                            triggerKind: context.triggerKind,
                            triggerCharacter: context.triggerCharacter,
                            isRetrigger: context.isRetrigger,
                            activeSignatureHelp: context.activeSignatureHelp,
                        },
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;

                        pushLSPLogMessage("info", `方法签名提示 当前收到的数据↓`, response);

                        if (!result) return resolve(null);
                        const SignatureHelpResult = {
                            value: {
                                activeParameter: result.activeParameter,
                                activeSignature: result.activeSignature,
                                signatures: result.signatures,
                            },
                            dispose: () => { },
                        };

                        pushLSPLogMessage("info",
                            `方法签名提示 传递给monaco的数据↓`,
                            SignatureHelpResult
                        );
                        resolve(SignatureHelpResult);
                    });
                });
            },
        });

        // 注册"渐进式自动格式化" 如果server有这个
        if (serverInfo.capabilities.documentOnTypeFormattingProvider)
            monaco.languages.registerOnTypeFormattingEditProvider(language, {
                autoFormatTriggerCharacters: [
                    serverInfo.capabilities.documentOnTypeFormattingProvider
                        .firstTriggerCharacter,
                ],
                provideOnTypeFormattingEdits: (model, position, ch, options) => {
                    const request = {
                        jsonrpc: "2.0",
                        id: id++,
                        method: "textDocument/onTypeFormatting",
                        params: {
                            textDocument: {
                                uri: model.uri.toString(),
                            },
                            position: CFBetter_monaco.MonacoPositionTolspPosition(position),
                            ch,
                            options,
                        },
                    };

                    return new Promise((resolve, reject) => {
                        fetchData(request, (response) => {
                            const result = response.result;
                            pushLSPLogMessage("info", `onTypeFormatting 当前收到的数据↓`, response);

                            if (!result || result.length == 0) return resolve([]);

                            const edits = result.map((item) => ({
                                range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                                text: item.newText,
                            }));
                            pushLSPLogMessage("info", `onTypeFormatting 传递给monaco的数据↓`, edits);
                            resolve(edits);
                        });
                    });
                },
            });
    };

    /**
     * 被动式接收处理
     */
    CFBetter_monaco.PassiveReceiveHandler = () => {

        // "实时代码诊断"
        CFBetter_monaco.updateMarkers = function (message) {
            const params = message.params;
            pushLSPLogMessage("info", `Markers 当前收到的数据↓`, message);

            if (!params) return;
            const markers = params.diagnostics.map((item1) => ({
                code: item1.code,
                message: item1.message,
                ...CFBetter_monaco.lspRangeToMonacoRange(item1.range),
                relatedInformation: item1.relatedInformation
                    ? item1.relatedInformation.map((item2) => ({
                        ...(item2.location.range
                            ? CFBetter_monaco.lspRangeToMonacoRange(item2.location.range)
                            : CFBetter_monaco.lspRangeToMonacoRange(item2.location)),
                        message: item2.message,
                        resource: monaco.Uri.parse(item2.location.uri),
                    }))
                    : null,
                severity: CFBetter_monaco.lspSeverityToMonacoSeverity(item1.severity),
                source: item1.source,
            }));

            pushLSPLogMessage("info", `Markers 传递给monaco的数据↓`, markers);
            monaco.editor.setModelMarkers(model, "eslint", markers);

            // 更新状态底栏信息
            const nowMarks = monaco.editor.getModelMarkers();
            warningCount = 0;
            errorCount = 0;
            for (const marker of nowMarks) {
                if (marker.severity === monaco.MarkerSeverity.Warning) {
                    warningCount++;
                } else if (marker.severity === monaco.MarkerSeverity.Error) {
                    errorCount++;
                }
            }
            $('#CFBetter_statusBar').text(`Warnings: ${warningCount}, Errors: ${errorCount}`);
        };

        // "应用服务器推送的更改"(代码修复)
        CFBetter_monaco.applyEdit = function (message) {
            const params = message.params;
            pushLSPLogMessage("info", `applyEdit 当前收到的数据↓`, message);

            if (!params) return;
            const operations = Object.values(params.edit.changes)
                .flat()
                .map((item) => ({
                    range: CFBetter_monaco.lspRangeToMonacoRange(item.range),
                    text: item.newText,
                }));

            pushLSPLogMessage("info", `applyEdit 传递给monaco的数据↓`, operations);
            model.pushEditOperations([], operations, () => null); // 入栈编辑操作
        };
    }

    if (!languageSocketState) await waitForLanguageSocketState();
    CFBetter_monaco.Initialize();
}

// 语言更改
function changeMonacoLanguage(form) {
    let nowSelect = form.selectLang.val();
    // 记忆更改
    GM_setValue('compilerSelection', nowSelect);
    // 销毁旧的编辑器
    try {
        if (editor) editor.dispose();
    } catch (error) {
        console.warn("销毁旧的编辑器时遇到了错误，这大概不会影响你的正常使用", error)
    }
    // 关闭旧的socket
    monacoSocket.forEach(socket => {
        socket.close();
    });
    // 移除相关元素
    form.topRightDiv.empty();
    $('#LSPLog').remove();
    $('#CFBetter_statusBar').remove();
    // 创建新的编辑器
    if (nowSelect in value_monacoLanguageMap) {
        let language = value_monacoLanguageMap[nowSelect];
        if (language == "python" || language == "cpp") {
            createMonacoEditor(language, form, true);
        } else {
            createMonacoEditor(language, form, false);
        }
    } else {
        createMonacoEditor(null, false);
    }
    // 更新在线编译器参数
    changeCompilerArgs(nowSelect);
}

// 收集样例数据
function collectTestData() {
    var testData = {};

    // 从pre中获取文本信息
    function getTextFromPre(node) {
        let text;
        if (node.find("br").length > 0) {
            text = node.html().replace(/<br>/g, "\n"); // <br>作换行符的情况
        } else {
            text = node.text();
        }
        return text;
    }

    $('.input').each(function (index) {
        var inputText = '';
        if ($(this).find('pre').find('div').length > 0) {
            $(this).find('pre').find('div').each(function () {
                inputText += getTextFromPre($(this)) + '\n';
            });
        } else {
            inputText = getTextFromPre($(this).find('pre'));
        }
        var outputText = '';
        if ($('.output').eq(index).find('pre').find('div').length > 0) {
            $('.output').eq(index).find('pre').find('div').each(function () {
                inputText += getTextFromPre($(this)) + '\n';
            });
        } else {
            outputText = getTextFromPre($('.output').eq(index).find('pre'));
        }

        testData[index + 1] = {
            input: inputText.trim(),
            output: outputText.trim()
        };
    });
    return testData;
}

// 初始化自定义测试数据面板
function CustomTestInit() {
    const url = window.location.href;

    restoreText();

    // 添加
    $('#addCustomTest').click(function () {
        var sampleDiv = $('<div class="sampleDiv">');
        var inputTextarea = $('<p style="padding: 0px 5px;">input</p><textarea class="dynamicTextarea inputTextarea"></textarea>');
        var outputTextarea = $('<p style="padding: 0px 5px;">output</p><textarea class="dynamicTextarea outputTextarea"></textarea>');
        var deleteCustomTest = $(`<button type="button" class="deleteCustomTest">${closeIcon}</button>`);
        sampleDiv.append(deleteCustomTest);
        sampleDiv.append(inputTextarea);
        sampleDiv.append(outputTextarea);
        $('#customTests').append(sampleDiv);
    });

    // 实时保存文本内容到 IndexedDB 中
    $(document).on('input', '.inputTextarea, .outputTextarea', function () {
        CFBetterDB.transaction('rw', CFBetterDB.samplesData, function () {
            var objectStore = CFBetterDB.samplesData;
            var samples = {
                url: url,
                samples: []
            };
            var index = 0;
            $('.sampleDiv').each(function () {
                var $sampleDiv = $(this);
                var inputTextarea = $sampleDiv.find('.inputTextarea');
                var outputTextarea = $sampleDiv.find('.outputTextarea');
                $sampleDiv.attr('data-index', index);
                inputTextarea.attr('id', 'input' + index);
                outputTextarea.attr('id', 'output' + index);
                var sample = {
                    id: index,
                    input: inputTextarea.val(),
                    output: outputTextarea.val()
                };
                samples.samples.push(sample);
                index++;
            });
            objectStore.put(samples);
        });
    });

    // 删除
    $(document).on('click', '.deleteCustomTest', function () {
        var $sampleDiv = $(this).closest('.sampleDiv');
        CFBetterDB.transaction('rw', CFBetterDB.samplesData, function () {
            var objectStore = CFBetterDB.samplesData;
            var index = parseInt($sampleDiv.attr('data-index'));
            if (!isNaN(index)) {
                objectStore.get(url).then(row => {
                    let samples = row.samples;
                    samples.splice(index, 1); // 移除第index个元素
                    objectStore.put({
                        url: url,
                        samples: samples
                    });
                })
            }
            $sampleDiv.remove();
        });
    });

    // 恢复保存的内容
    function restoreText() {
        CFBetterDB.transaction('r', CFBetterDB.samplesData, function () {
            return CFBetterDB.samplesData.get(url);
        }).then(function (data) {
            if (data.samples && data.samples.length > 0) {
                data.samples.forEach(function (item, index) {
                    var sampleDiv = $('<div class="sampleDiv">');
                    var inputTextarea = $(`<p style="padding: 0px 5px;">input</p><textarea id="input${index}" class="dynamicTextarea inputTextarea"></textarea>`);
                    var outputTextarea = $(`<p style="padding: 0px 5px;">output</p><textarea id="output${index}" class="dynamicTextarea outputTextarea"></textarea>`);
                    var deleteCustomTest = $(`<button type="button" class="deleteCustomTest">${closeIcon}</button>`);

                    inputTextarea.val(item.input);
                    outputTextarea.val(item.output);

                    sampleDiv.append(deleteCustomTest);
                    sampleDiv.append(inputTextarea);
                    sampleDiv.append(outputTextarea);
                    sampleDiv.attr('data-index', index)
                    $('#customTests').append(sampleDiv);
                });
            }
        });
    }
}

// 获取自定义测试数据
function getCustomTestData() {
    const url = window.location.href;

    return new Promise(function (resolve) {
        var customTestData = {};
        CFBetterDB.transaction('r', CFBetterDB.samplesData, function () {
            return CFBetterDB.samplesData.get(url);
        }).then(function (data) {
            if (!data) resolve(customTestData);
            if (data.samples && data.samples.length > 0) {
                data.samples.forEach(function (item, index) {
                    customTestData[index + 1] = {
                        input: item.input,
                        output: item.output
                    };
                });
            }
            resolve(customTestData);
        });
    });
}

// codeforces编译器参数列表
let officialLanguage = "";
function officialCompilerArgsChange(nowSelect) {
    officialLanguage = nowSelect;
    $('#CompilerArgsInput').prop("disabled", true);
}

// codeforces编译器通信
async function officialCompiler(code, input) {
    var data = new FormData();
    data.append('csrf_token', CF_csrf_token);
    data.append('source', code);
    data.append('tabSize', '4');
    data.append('programTypeId', officialLanguage);
    data.append('input', input);
    data.append('output', '');
    data.append('communityCode', '');
    data.append('action', 'submitSourceCode');
    data.append('programTypeId', officialLanguage);
    data.append('sourceCode', code);
    var result = {
        Errors: '',
        Result: '',
        Stats: ''
    };

    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: hostAddress + '/data/customtest',
            data: data,
            headers: {
                'X-Csrf-Token': CF_csrf_token
            },
            onload: function (responseDetails) {
                if (responseDetails.status !== 200 || !responseDetails.response) {
                    result.Errors = `提交代码到 codeforces 服务器时发生了错误，请重试 ${findHelpText1}`;
                    resolve(result);
                } else {
                    try {
                        const response = JSON.parse(responseDetails.response);
                        resolve(response.customTestSubmitId);
                    } catch (error) {
                        result.Errors = `解析响应数据 customTestSubmitId 时发生了错误，请重试 ${findHelpText1}`;
                        resolve(result);
                    }
                }
            },
            onerror: function () {
                result.Errors = '请求 customTestSubmitId 时网络错误';
                resolve(result);
            }
        });
    }).then(customTestSubmitId => {
        if (result.Errors !== '') return result; // 产生了错误，直接返回
        return new Promise((resolve, reject) => {
            let retryCount = 0;
            var newdata = new FormData();
            newdata.append('csrf_token', CF_csrf_token);
            newdata.append('action', 'getVerdict');
            newdata.append('customTestSubmitId', customTestSubmitId);
            function makeRequest() {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: hostAddress + '/data/customtest',
                    data: newdata,
                    headers: {
                        'X-Csrf-Token': CF_csrf_token
                    },
                    onload: function (responseDetails) {
                        if (responseDetails.status !== 200 || !responseDetails.response) {
                            result.Errors = `请求运行结果时发生了错误，请重试 ${findHelpText1}`;
                            resolve(result);
                        } else {
                            try {
                                const response = JSON.parse(responseDetails.response);
                                if (!response.stat && retryCount < 10) {
                                    retryCount++;
                                    setTimeout(makeRequest, 1000);
                                } else if (retryCount >= 15) {
                                    result.Errors = `结果获取已超时，请重试 ${findHelpText1}`;
                                    resolve(result);
                                } else {
                                    const result = {
                                        Errors: response.verdict == "OK" ? null : response.verdict + '<br>' + response.output,
                                        Result: response.output.replace(/\r\n/g, "\n"),
                                        Stats: `Status: ${response.stat}`
                                    };
                                    resolve(result);
                                }
                            } catch (error) {
                                result.Errors = '请求运行结果时响应数据解析错误';
                                resolve(result);
                            }
                        }
                    },
                    onerror: function () {
                        result.Errors = '请求运行结果时网络错误';
                        resolve(result);
                    }
                });
            }

            makeRequest();
        });
    });
}

// rextester编译器参数列表
let rextesterLanguage = "", rextesterCompilerArgs = "";
function rextesterCompilerArgsChange(nowSelect) {
    let LanguageChoiceList = {
        "4": "9", "6": "8", "7": "5", "9": "1", "13": "13", "19": "42", "20": "21", "28": "30", "31": "24", "32": "20",
        "34": "17", "36": "4", "43": "6", "45": "7", "46": "4", "50": "7", "51": "9", "52": "27", "54": "7", "55": "23", "60": "4",
        "61": "7", "65": "1", "67": "12", "70": "5", "73": "7", "74": "4", "75": "46", "77": "43", "79": "1", "80": "27", "83": "43", "87": "4"
    }
    let CompilerArgsList = {
        "6": "-Wall -std=gnu99 -O2 -o a.out source_file.c",
        "7": "-Wall -std=c++14 -O2 -o a.out source_file.cpp",
        "20": "-o a.out source_file.go",
        "27": "-Wall -std=c++14 -stdlib=libc++ -O2 -o a.out source_file.cpp",
        "30": "source_file.d -ofa.out"
    }
    if (nowSelect in LanguageChoiceList) {
        $('#RunTestButton').prop("disabled", false);
        rextesterLanguage = LanguageChoiceList[nowSelect];
    } else {
        $('#RunTestButton').prop("disabled", true);
    }
    if (rextesterLanguage in CompilerArgsList) {
        rextesterCompilerArgs = CompilerArgsList[rextesterLanguage];
        $('#CompilerArgsInput').val(rextesterCompilerArgs);
    } else {
        $('#CompilerArgsInput').val("");
    }
}

// rextester编译器通信
async function rextesterCompiler(code, input) {
    var data = new FormData();
    data.append('LanguageChoiceWrapper', rextesterLanguage);
    data.append('EditorChoiceWrapper', '1');
    data.append('LayoutChoiceWrapper', '1');
    data.append('Program', code);
    data.append('CompilerArgs', rextesterCompilerArgs);
    data.append('Input', input);
    data.append('ShowWarnings', 'false');
    data.append('IsInEditMode', 'false');
    data.append('IsLive', 'false');
    var result = {
        Errors: '',
        Result: '',
        Stats: ''
    };

    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://rextester.com/rundotnet/Run',
            data: data,
            onload: function (responseDetails) {
                if (responseDetails.status !== 200 || !responseDetails.response) {
                    result.Errors = `发生了未知的错误，请重试 ${findHelpText1}`;
                    resolve(result);
                } else {
                    try {
                        const response = JSON.parse(responseDetails.response);
                        result.Errors = response.Errors;
                        result.Result = response.Result;
                        result.Stats = response.Stats;
                        resolve(result);
                    } catch (error) {
                        result.Errors = '响应数据解析错误';
                        resolve(result);
                    }
                }
            },
            onerror: function () {
                result.Errors = '网络错误';
                resolve(result);
            }
        });
    });
}

// wandbox编译器参数列表
var wandboxlist = JSON.parse(GM_getResourceText("wandboxlist"));
function wandboxCompilerArgsChange(nowSelect) {
    let LanguageChoiceList = {
        "6": "PHP", "7": "Python", "9": "C#", "12": "Haskell", "13": "Perl", "19": "OCaml",
        "20": "Scala", "28": "D", "31": "Python", "32": "Go", "34": "JavaScript", "36": "Java", "40": "Python", "41": "Python",
        "43": "C++", "50": "C++", "51": "Pascal", "52": "C++", "54": "C++", "60": "Java", "61": "C++", "65": "C#", "67": "Ruby",
        "70": "Python", "73": "C++", "74": "Java", "75": "Rust", "79": "C#", "80": "C++", "87": "Java"
    }

    // 移除旧的
    $('#CompilerChange').remove();

    if (nowSelect in LanguageChoiceList) {
        $('#RunTestButton').prop("disabled", false);
        const Languagefiltered = wandboxlist.filter(obj => obj.language === LanguageChoiceList[nowSelect]);

        // 创建编译器下拉框
        var CompilerChange = $('<select id="CompilerChange" style="width: 100%;"></select>');
        $('#CompilerSetting').append(CompilerChange);
        for (let i = 0; i < Languagefiltered.length; i++) {
            let Compiler = Languagefiltered[i];
            let op = $("<option></option>")
                .val(Compiler.name)
                .text(Compiler["display-name"] + " " + Compiler.version);
            $("#CompilerChange").append(op);
        }

        // 编译器参数刷新
        function refreshCompilerArgs() {
            var flags = '';
            $("#CompilerBox").find("*").each(function () {
                if ($(this).is("input[type='checkbox']")) {
                    let flag = $(this).prop("checked") ? $(this).val() : '';
                    flags += flag + (flag ? ' ' : '');
                } else if ($(this).is("select") || $(this).is("input") || $(this).is("textarea")) {
                    let flag = $(this).val();
                    flags += flag + (flag ? ' ' : '');
                }
            });
            $("#CompilerArgsInput").val(flags);
            $("#CompilerArgsInput").prop("readonly", true); // 只读
        }

        // 编译器切换监听
        CompilerChange.change(function () {
            let selectedName = $('#CompilerChange').val();
            let Compiler = Languagefiltered.find(
                (obj) => obj.name === selectedName
            );

            $("#CompilerArgsInput").val(); // 初始化编译器输入框

            $("#CompilerBox").remove();
            let div = $("<div id='CompilerBox'></div>");

            let display_compile_command = $(`<input id='${Compiler.name}' value='${Compiler['display-compile-command']}' style="display:none;"}></input>`);
            div.append(display_compile_command);

            let switches = Compiler.switches;
            for (let i = 0; i < switches.length; i++) {
                let switche = switches[i];

                if (switche.type == "single") {
                    let single = $(`
                    <div>
                        <input type='checkbox' id='${switche.name}' value='${switche['display-flags']}' ${switche.default ? 'checked' : ''}></input>
                        <label for='${switche.name}'>${switche['display-name']}</label>
                    </div>
                    `);
                    div.append(single);
                    single.find("input").change(function () {
                        refreshCompilerArgs();
                    });
                } else if (switche.type == "select") {
                    let select = $(`<select id='${switche.name}'></select>`);
                    select.data('previousValue', switche.options[0]['display-flags']);
                    div.append(select);
                    for (let i = 0; i < switche.options.length; i++) {
                        let option = switche.options[i];
                        let op = $("<option></option>")
                            .val(option['display-flags'])
                            .text(option['display-name']);
                        select.append(op);
                    }
                    select.change(function () {
                        refreshCompilerArgs();
                    });
                }
            }

            if (Compiler['compiler-option-raw'] == true) {
                let textarea = $(`<textarea id="compiler_option_raw" placeholder="Raw compiler options" style="resize: vertical;"></textarea>`);
                div.append(textarea);
                textarea.on('input', function () {
                    refreshCompilerArgs();
                });
            }
            if (Compiler['runtime-option-raw'] == true) {
                let textarea = $(`<textarea id="runtime_option_raw" placeholder="Raw runtime options" style="resize: vertical;"></textarea>`);
                div.append(textarea);
                textarea.on('input', function () {
                    refreshCompilerArgs();
                });
            }
            $("#CompilerSetting").append(div);

            refreshCompilerArgs();  // 初始化
        });

        CompilerChange.trigger("change"); // 初始化
    } else {
        $('#RunTestButton').prop("disabled", true);
    }
}

// wandbox编译器通信
async function wandboxCompiler(code, input) {
    var data = {
        code: code,
        codes: [],
        compiler: $('#CompilerChange').val().replace($('#compiler_option_raw').val(), '').replace($('#runtime_option_raw').val(), ''),
        'compiler-option-raw': $('#compiler_option_raw').val(),
        'runtime-option-raw': $('#runtime_option_raw').val(),
        options: $("#CompilerArgsInput").val(),
        description: '',
        stdin: input,
        title: ''
    }
    var result = {
        Errors: '',
        Result: '',
        Stats: ''
    };

    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://wandbox.org/api/compile.json',
            data: JSON.stringify(data),
            onload: function (responseDetails) {
                if (responseDetails.status !== 200 || !responseDetails.response) {
                    result.Errors = `发生了未知的错误，请重试 ${findHelpText1}`;
                    resolve(result);
                } else {
                    try {
                        const response = JSON.parse(responseDetails.response);
                        result.Errors = response.compiler_error == "" ? response.signal : response.compiler_error;
                        result.Result = response.program_output;
                        result.Stats = response.status == "0" ? "Finish" : "Error";
                        resolve(result);
                    } catch (error) {
                        result.Errors = '响应数据解析错误';
                        resolve(result);
                    }
                }
            },
            onerror: function () {
                result.Errors = '网络错误';
                resolve(result);
            }
        });
    });
}

// 更改编译器参数
function changeCompilerArgs(nowSelect) {
    if (onlineCompilerChoice == "official") {
        officialCompilerArgsChange(nowSelect);
    } else if (onlineCompilerChoice == "rextester") {
        rextesterCompilerArgsChange(nowSelect);
    } else if (onlineCompilerChoice == "wandbox") {
        wandboxCompilerArgsChange(nowSelect);
    }
}

// 在线编译器通信
async function onlineCompilerConnect(code, input) {
    if (onlineCompilerChoice == "official") {
        return await officialCompiler(code, input);
    } else if (onlineCompilerChoice == "rextester") {
        return await rextesterCompiler(code, input);
    } else if (onlineCompilerChoice == "wandbox") {
        return await wandboxCompiler(code, input);
    }
}

// 差异对比
function codeDiff(expectedText, actualText) {
    // 将文本按行拆分
    var expectedLines = expectedText.split('\n');
    var actualLines = actualText.split('\n');

    var output = $('<div>');
    for (var i = 0; i < expectedLines.length; i++) {
        var expectedLine = expectedLines[i];
        var actualLine = actualLines[i];
        var LineDiv = $(`<div class="DiffLine"><span class="LineNo">${i + 1}</span></div>`);
        if (actualLine == undefined) {
            LineDiv.append(`<span class="added">${expectedLine}</span>`);
        } else {
            let div = $('<div class="LineContent">');
            if (expectedLine === actualLine) {
                div.append(`<span style="padding-left:3px;">${actualLine}</span>`);
            } else {
                div.append(`<span class="removed" style="padding-left:3px;">${actualLine}</span>`);
                div.append(`<span class="added" style="padding-left:3px;">${expectedLine}</span>`);
            }
            LineDiv.append(div);
        }
        output.append(LineDiv);
    }

    // 处理多余的 actualLines
    for (var j = expectedLines.length; j < actualLines.length; j++) {
        output.append(`<span class="removed" style="padding-left:3px;">${actualLines[j]}</span>`);
    }

    return output.html();
}

// 样例测试函数
async function runCode(event, sourceDiv, submitDiv) {
    event.preventDefault();
    const loadingImage = $('<img class="CFBetter_loding" src="//codeforces.org/s/84141/images/ajax-loading-24x24.gif">');
    $('#RunTestButton').after(loadingImage);
    $('#statePanel').remove(); // 移除旧结果

    // 评测结果面板
    var statePanel = $(`<div id="statePanel">`);
    submitDiv.after(statePanel);

    // 更新状态
    rextesterCompilerArgs = $('#CompilerArgsInput').val();

    // 获取数据
    const testData = collectTestData();
    const customtestData = await getCustomTestData();

    // 测试
    const handleResult = (prefix, data, item, result) => {
        if (result.Errors) {
            statePanel.append($(`<div class="RunState_title error">${prefix}${item} Compilation error or Time limit</div>`));
            // 渲染终端转义序列
            GM_addStyle(GM_getResourceText("xtermcss"));
            let terminalContainer = $(`<div id="terminal-container" style="overflow: auto;margin-bottom: 5px;"></div>`);
            statePanel.append(terminalContainer);
            const term = new Terminal({
                rows: 10,
                cols: 150
            });
            term.setOption('theme', {
                background: '#2d2e2c',
            });
            term.setOption('convertEol', true); // 将\n转换为\r\n
            term.write(result.Errors);
            term.open(terminalContainer.get(0));
        } else if (result.Result.trim() === data.output.trim()) {
            statePanel.append($(`<div class="RunState_title ok">${prefix}${item} Accepted</div>`));
        } else {
            statePanel.append($(`<div class="RunState_title error">${prefix}${item} Wrong Answer</div>`));
            if ($('#DontShowDiff').prop('checked')) statePanel.append($(`<div class="outputDiff" style="white-space: break-spaces;">${result.Result.trim()}</div>`));
            else statePanel.append($(`<p>差异对比：</p><div class="outputDiff">${codeDiff(data.output.trim(), result.Result.trim())}</div>
            <p style="color: grey; font-size: 12px;">说明：如果该题有多个可能的答案，你的答案也可能并不是错误的</p>`));
        }
        statePanel.append($(`<div style="color:${result.Errors ? 'red' : ''};">状态： ${result.Stats}</div>`));
    };

    // 遍历数据并测试
    for (const [item, data] of Object.entries(customtestData)) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 延迟500毫秒
        const result = await onlineCompilerConnect(sourceDiv.val(), data.input);
        handleResult('自定义样例', data, item, result);
    }

    if (!$('#onlyCustomTest').prop('checked')) {
        for (const [item, data] of Object.entries(testData)) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 延迟500毫秒
            const result = await onlineCompilerConnect(sourceDiv.val(), data.input);
            handleResult('题目样例', data, item, result);
        }
    }

    loadingImage.remove();
}


async function addProblemPageCodeEditor() {
    if (typeof ace === 'undefined') {
        console.log("%c无法加载编辑器必要的数据，可能当前未登录/未报名/非题目页/比赛结束冻结期间/该比赛禁止结束后练习", "border:1px solid #000;padding:10px;");
        return; // 未登录，不存在ace库
    }

    const href = window.location.href;
    let submitUrl = /\/problemset\//.test(href) ?
        hostAddress + '/problemset/submit' :
        /\/gym\//.test(href) ?
            hostAddress + '/gym/' + ((href) => {
                const regex = /\/gym\/(?<num>[0-9a-zA-Z]*?)\/problem\//;
                const match = href.match(regex);
                return match && match.groups.num;
            })(href) + '/submit' :
            href.replace(/\/problem[A-Za-z0-9\/#]*/, "/submit")
        ;
    let cloneHTML = await getSubmitHTML(submitUrl);

    // 创建
    let form = await CreateCodeDevForm(submitUrl, cloneHTML);
    let selectLang = form.selectLang;
    let submitButton = form.submitButton;
    let runButton = form.runButton;

    // 初始化
    CustomTestInit(); // 自定义测试数据面板
    selectLang.val(compilerSelection);
    changeMonacoLanguage(form);

    selectLang.on('change', () => changeMonacoLanguage(form)); // 编辑器语言切换监听

    // 样例测试
    runButton.on('click', (event) => runCode(event, form.sourceDiv, form.submitDiv));

    // 提交
    submitButton.on('click', async function (event) {
        event.preventDefault();
        if (isCodeSubmitConfirm) {
            let content = ``;
            const submit = await createDialog("确认提交代码吗", content, ['提交', '否']); //提交确认
            if (submit) {
                submitButton.after(`<img class="CFBetter_loding" src="//codeforces.org/s/84141/images/ajax-loading-24x24.gif">`);
                $('#CFBetter_SubmitForm').submit();
            } else {
                submitButton.addClass('disabled');
                setTimeout(function () {
                    submitButton.removeClass('disabled');
                }, 300);
            }
        } else {
            $('#CFBetter_SubmitForm').submit();
        }
    });
}


// 翻译服务
//
// ChatGPT
async function translate_openai(raw) {
    var openai_retext = "";
    var data;
    if (is_oldLatex || is_acmsguru) {
        data = {
            model: (openai_model !== null && openai_model !== "") ? openai_model : 'gpt-3.5-turbo',
            messages: [{
                role: "user",
                content: "请将下面的文本翻译为中文，这是一道编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的【】、HTML标签本身以及其中的内容不翻译不变动，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw
            }],
            temperature: 0.7,
            ...Object.assign({}, ...openai_data)
        };
    } else {
        data = {
            model: (openai_model !== null && openai_model !== "") ? openai_model : 'gpt-3.5-turbo',
            messages: [{
                role: "user",
                content: "请将下面的文本翻译为中文，这是一道编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的latex公式不翻译，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw
            }],
            temperature: 0.7,
            ...Object.assign({}, ...openai_data)
        };
    };
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: (openai_proxy !== null && openai_proxy !== "") ? openai_proxy : 'https://api.openai.com/v1/chat/completions',

            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + openai_key,
                ...Object.assign({}, ...openai_header)
            },
            data: JSON.stringify(data),
            responseType: 'json',
            onload: function (response) {
                if (!response.response) {
                    reject(`发生了未知的错误，如果你启用了代理API，请确认是否填写正确，并确保代理能够正常工作。${findHelpText1} 请注意打码响应报文的敏感部分\n\n响应报文: ${JSON.stringify(response)}`);
                }
                else if (!response.response.choices || response.response.choices.length < 1 || !response.response.choices[0].message) {
                    resolve(`翻译出错，请重试 ${findHelpText1} \n\n报错信息: ${JSON.stringify(response.response, null, '\n')}`);
                } else {
                    openai_retext = response.response.choices[0].message.content;
                    resolve(openai_retext);
                }
            },
            onerror: function (response) {
                reject(`发生了未知的错误，请确认你是否能正常访问OpenAi的接口，如果使用代理API，请检查是否正常工作 ${findHelpText1} 请注意打码响应报文的敏感部分\n\n响应报文: ${JSON.stringify(response)}`);
            },
        });
    });
}

// ChatGPT 流式传输
async function* translate_openai_stream(raw) {
    var data;
    if (is_oldLatex || is_acmsguru) {
        data = {
            model: (openai_model !== null && openai_model !== "") ? openai_model : 'gpt-3.5-turbo',
            messages: [{
                role: "user",
                content: "请将下面的文本翻译为中文，这是一道编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的【】、HTML标签本身以及其中的内容不翻译不变动，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw
            }],
            temperature: 0.7,
            stream: true,
            ...Object.assign({}, ...openai_data)
        };
    } else {
        data = {
            model: (openai_model !== null && openai_model !== "") ? openai_model : 'gpt-3.5-turbo',
            messages: [{
                role: "user",
                content: "请将下面的文本翻译为中文，这是一道编程竞赛题描述的一部分，注意术语的翻译，注意保持其中的latex公式不翻译，你只需要回复翻译后的内容即可，不要回复任何其他内容：\n\n" + raw
            }],
            temperature: 0.7,
            stream: true,
            ...Object.assign({}, ...openai_data)
        };
    };
    const response = await fetch((openai_proxy !== null && openai_proxy !== "") ? openai_proxy : 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + openai_key,
            ...Object.assign({}, ...openai_header)
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // 用于累积数据片段的缓冲区

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }); // 将新的数据片段追加到缓冲区
            let lines = buffer.split("\n\n"); // 处理累积的数据

            // 缓冲区的最后一行可能还未完整接收，保留在缓冲区中，-1
            for (let i = 0; i < lines.length - 1; i++) {
                let line = lines[i];
                line = line.substring(5); // 移除 'data:' 前缀
                if (line.includes('[DONE]')) {
                    return; // End
                }
                try {
                    let data = JSON.parse(line);
                    let delta = data['choices'][0]['delta'];
                    let content = delta['content'] ? delta['content'] : "";
                    yield content; // 传递数据给调用者
                } catch (error) {
                    console.warn(`Error parsing JSON: ${error}\n\nError data: ${line}`);
                }
            }

            // 保留最后一行在缓冲区中
            buffer = lines.slice(-1);
        }
    } finally {
        reader.releaseLock();
    }
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
                const translatedText = $(html).filter('.result-container').text() || $(html).find('.result-container').text();
                resolve(translatedText);
            },
            onerror: function (response) {
                reject(`发生了未知的错误，请确认你是否能正常访问Google翻译， ${findHelpText1} 请注意打码报错信息的敏感部分\n\n响应报文: ${JSON.stringify(response)}`);
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

//--彩云翻译--start
async function translate_caiyun_startup() {
    const browser_id = CryptoJS.MD5(Math.random().toString()).toString();
    sessionStorage.setItem('caiyun_id', browser_id);
    const options = {
        method: "POST",
        url: 'https://api.interpreter.caiyunai.com/v1/user/jwt/generate',
        headers: {
            "Content-Type": "application/json",
            "X-Authorization": "token:qgemv4jr1y38jyq6vhvi",
            "Origin": "https://fanyi.caiyunapp.com",
        },
        data: JSON.stringify({ browser_id }),
    }
    const res = await Request(options);
    sessionStorage.setItem('caiyun_jwt', JSON.parse(res.responseText).jwt);
}

async function translate_caiyun(raw) {
    const source = "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm";
    const dic = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"].reduce((dic, current, index) => { dic[current] = source[index]; return dic }, {});
    // 解码
    const decodeUnicode = str => {
        const decoder = new TextDecoder();
        const data = Uint8Array.from(atob(str), c => c.charCodeAt(0));
        return decoder.decode(data);
    };
    const decoder = line => decodeUnicode([...line].map(i => dic[i] || i).join(""));
    const options = {
        method: "POST",
        url: 'https://api.interpreter.caiyunai.com/v1/translator',
        data: JSON.stringify({
            "source": raw.split('\n'),
            "trans_type": "auto2zh",
            "detect": true,
            "browser_id": sessionStorage.getItem('caiyun_id')
        }),
        headers: {
            "X-Authorization": "token:qgemv4jr1y38jyq6vhvi",
            "T-Authorization": sessionStorage.getItem('caiyun_jwt')
        }
    }
    return await BaseTranslate('彩云小译', raw, options, res => JSON.parse(res).target.map(decoder).join('\n'))
}
//--彩云翻译--end

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

//--讯飞听见翻译--end
async function translate_iflyrec(text) {
    const options = {
        method: "POST",
        url: 'https://www.iflyrec.com/TranslationService/v1/textTranslation',
        data: JSON.stringify({
            "from": "2",
            "to": "1",
            "contents": [{
                "text": text,
                "frontBlankLine": 0
            }]
        }),
        anonymous: true,
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.iflyrec.com',
        },
        responseType: "json",
    };
    return await BaseTranslate('讯飞翻译', text, options, res => JSON.parse(res).biz[0].translateResult.replace(/\\n/g, "\n\n"));
}
//--讯飞听见翻译--end

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
                console.warn(err);
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
            let result = await processer(tmp);
            return result;
        } catch (err) {
            errtext = tmp;
            throw {
                responseText: tmp,
                err: err
            }
        }
    }
    return await PromiseRetryWrap(toDo, { RetryTimes: 3, ErrProcesser: () => `翻译出错，请查看报错信息，并重试或更换翻译接口 ${findHelpText1} 请注意打码报错信息的敏感部分\n\n报错信息: ${errtext} ` })
}

function Request(options) {
    return new Promise((reslove, reject) => GM_xmlhttpRequest({ ...options, onload: reslove, onerror: reject }))
}

//--异步请求包装工具--end

// 开始
document.addEventListener("DOMContentLoaded", function () {
    function checkJQuery(retryDelay) {
        if (typeof jQuery === 'undefined') {
            console.warn("JQuery未加载，" + retryDelay + "毫秒后重试");
            setTimeout(function () {
                var newRetryDelay = Math.min(retryDelay * 2, 2000);
                checkJQuery(newRetryDelay);
            }, retryDelay);
        } else {
            executeFunctions();
        }
    }
    checkJQuery(50);
    function executeFunctions() {
        init();
        showAnnounce();
        alertZh();
        darkModeStyleAdjustment();
        ShowAlertMessage();
        settingPanel();
        checkScriptVersion();
        toZH_CN();
        var newElement = $("<div></div>").addClass("alert alert-info CFBetter_alert")
            .html(`${OJBetterName} —— 正在等待页面资源加载……`)
            .css({
                "margin": "1em",
                "text-align": "center",
                "font-weight": "600",
                "position": "relative"
            });

        async function processPage() {
            if (showLoading) newElement.html(`${OJBetterName} —— 正在等待LaTeX渲染队列全部完成……`);
            await waitUntilIdleThenDo(async function () {
                if (showJumpToLuogu && is_problem) CF2luogu();
                Promise.resolve()
                    .then(async () => {
                        if (showLoading) newElement.html(`${OJBetterName} —— 正在连接数据库……`);
                        await delay(100);
                        await initDB();
                    })
                    .then(() => {
                        if (showLoading && expandFoldingblocks) newElement.html(`${OJBetterName} —— 正在展开折叠块……`);
                        return delay(100).then(() => { if (expandFoldingblocks) ExpandFoldingblocks() });
                    })
                    .then(() => {
                        if (showLoading && commentPaging) newElement.html(`${OJBetterName} —— 正在对评论区分页……`);
                        return delay(100).then(() => { if (commentPaging) CommentPagination() });
                    })
                    .then(() => {
                        if (showLoading && is_acmsguru) newElement.html(`${OJBetterName} —— 正在为acmsguru题面重新划分div……`);
                        return delay(100).then(() => { if (is_acmsguru) acmsguruReblock() });
                    })
                    .then(() => {
                        if (showLoading) newElement.html(`${OJBetterName} —— 正在加载按钮相关函数……`);
                        return delay(100).then(() => initTranslateButtonFunc());
                    })
                    .then(() => {
                        if (showLoading) newElement.html(`${OJBetterName} —— 正在加载按钮……`);
                        return delay(100).then(() => addConversionButton());
                    })
                    .then(() => {
                        if (showLoading && commentTranslationMode == "2") newElement.html(`${OJBetterName} —— 正在加载选段翻译……`);
                        return delay(100).then(() => { if (commentTranslationMode == "2") multiChoiceTranslation() });
                    })
                    .then(async () => {
                        if (showLoading && renderPerfOpt) newElement.html(`${OJBetterName} —— 正在优化折叠块渲染……`);
                        await delay(100);
                        if (renderPerfOpt) await RenderPerfOpt();
                    })
                    .then(async () => {
                        if (showLoading && is_problem && memoryTranslateHistory) newElement.html(`${OJBetterName} —— 正在恢复上一次的翻译记录……`);
                        return delay(100).then(async () => { if ((is_problem || is_completeProblemset) && memoryTranslateHistory) await initTransResultsRecover() });
                    })
                    .then(async () => {
                        if (showLoading && autoTranslation) newElement.html(`${OJBetterName} —— 正在初始化短文本自动翻译……`);
                        return delay(100).then(() => { if (autoTranslation) initTransWhenViewable() });
                    })
                    .then(async () => {
                        if (showLoading && standingsRecolor && is_cfStandings) newElement.html(`${OJBetterName} —— 正在为榜单重新着色……`);
                        await delay(100);
                        if (standingsRecolor && is_cfStandings) await recolorStandings();
                    })
                    .then(async () => {
                        if (showLoading && is_problem) newElement.html(`${OJBetterName} —— 正在添加代码编辑器……`);
                        await delay(100);
                        if (is_problem && problemPageCodeEditor) await addProblemPageCodeEditor();
                    })
                    .then(async () => {
                        await delay(100);
                        if (showClistRating_contest && is_contest) {
                            if (showLoading) newElement.html(`${OJBetterName} —— 正在加载Clist数据……`);
                            await showRatingByClist_contest();
                        }
                        if (showClistRating_problemset && is_problemset) {
                            if (showLoading) newElement.html(`${OJBetterName} —— 正在加载Clist数据……`);
                            await showRatingByClist_problemset();
                        }
                        if (showClistRating_problem && is_problem) {
                            if (showLoading) newElement.html(`${OJBetterName} —— 正在加载Clist数据……`);
                            await showRatingByClist_problem();
                        }
                    })
                    .then(() => {
                        if (showLoading) {
                            newElement.html(`${OJBetterName} —— 加载已完成`);
                            newElement.removeClass('alert-info').addClass('alert-success');
                            setTimeout(function () {
                                newElement.remove();
                            }, 3000);
                        }
                    })
                    .catch((error) => {
                        console.warn(error);
                    });
            });
        }

        function delay(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }

        if (showLoading) {
            if (is_mSite) $("header").after(newElement);
            else $(".menu-box:first").next().after(newElement);
        }

        if (loaded) {
            processPage();
        } else {
            // 页面完全加载完成后执行
            window.onload = function () {
                processPage();
            };
        }
    }
});

// 配置自动迁移代码（将在10个小版本后移除-1.71）
if (GM_getValue("darkMode") === true || GM_getValue("darkMode") === false) {
    GM_setValue("darkMode", "follow");
    location.reload();
}