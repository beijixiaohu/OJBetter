// ==UserScript==
// @name         Atcoder Better!
// @namespace    https://greasyfork.org/users/747162
// @version      1.12
// @description  Atcoder界面汉化、题目翻译、markdown视图、一键复制题目、跳转到洛谷
// @author       北极小狐
// @match        https://atcoder.jp/*
// @run-at       document-start
// @connect      www2.deepl.com
// @connect      www.iflyrec.com
// @connect      m.youdao.com
// @connect      api.interpreter.caiyunai.com
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
// @icon         https://aowuucdn.oss-cn-beijing.aliyuncs.com/atcoder.png
// @require      https://cdn.staticfile.org/turndown/7.1.2/turndown.min.js
// @require      https://cdn.staticfile.org/markdown-it/13.0.1/markdown-it.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
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

var darkMode = getGMValue("darkMode", "follow");
var is_problem, is_homepage;
var bottomZh_CN, showLoading, hoverTargetAreaDisplay, expandFoldingblocks, enableSegmentedTranslation, translation;
var openai_model, openai_key, openai_proxy, openai_header, openai_data, opneaiConfig;
var replaceSymbol, commentPaging, showJumpToLuogu, loaded;
var isEnglishLanguage;
function init() {
    const { hostname, href } = window.location;
    is_problem = href.includes('/tasks/');
    is_homepage = (href === 'https://atcoder.jp/' || href === 'https://atcoder.jp/?lang=ja');
    bottomZh_CN = getGMValue("bottomZh_CN", true);
    showLoading = getGMValue("showLoading", true);
    hoverTargetAreaDisplay = getGMValue("hoverTargetAreaDisplay", false);
    expandFoldingblocks = getGMValue("expandFoldingblocks", true);
    commentPaging = getGMValue("commentPaging", true);
    enableSegmentedTranslation = getGMValue("enableSegmentedTranslation", false);
    showJumpToLuogu = getGMValue("showJumpToLuogu", true);
    loaded = getGMValue("loaded", false);
    translation = getGMValue("translation", "deepl");
    replaceSymbol = getGMValue("replaceSymbol", "2");
    //openai
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
}

// 常量
const helpCircleHTML = '<div class="help-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592 0-42.944-14.08-76.736-42.24-101.376-28.16-25.344-65.472-37.312-111.232-37.312zm-12.672 406.208a54.272 54.272 0 0 0-38.72 14.784 49.408 49.408 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.848 54.848 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.968 51.968 0 0 0-15.488-38.016 55.936 55.936 0 0 0-39.424-14.784z"></path></svg></div>';
const unfoldIcon = `<svg t="1695971616104" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2517" width="16" height="16"><path d="M747.451 527.394L512.376 707.028l-235.071-185.71a37.975 37.975 0 0 0-23.927-8.737 38 38 0 0 0-29.248 13.674 37.984 37.984 0 0 0 4.938 53.552l259.003 205.456c14.013 11.523 34.219 11.523 48.231 0l259.003-199.002a37.974 37.974 0 0 0 5.698-53.552 37.982 37.982 0 0 0-53.552-5.315z m0 0" p-id="2518"></path><path d="M488.071 503.845c14.013 11.522 34.219 11.522 48.231 0l259.003-199.003a37.97 37.97 0 0 0 13.983-25.591 37.985 37.985 0 0 0-8.285-27.959 37.97 37.97 0 0 0-25.591-13.979 37.985 37.985 0 0 0-27.96 8.284L512.376 425.61 277.305 239.899a37.974 37.974 0 0 0-23.927-8.736 37.993 37.993 0 0 0-29.248 13.674 37.984 37.984 0 0 0 4.938 53.552l259.003 205.456z m0 0" p-id="2519"></path></svg>`;
const putawayIcon = `<svg t="1695971573189" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2266" width="16" height="16"><path d="M276.549 496.606l235.075-179.634 235.071 185.711a37.975 37.975 0 0 0 23.927 8.737 38 38 0 0 0 29.248-13.674 37.986 37.986 0 0 0-4.938-53.552L535.929 238.737c-14.013-11.523-34.219-11.523-48.231 0L228.695 437.739a37.974 37.974 0 0 0-5.698 53.552 37.982 37.982 0 0 0 53.552 5.315z m0 0" p-id="2267"></path><path d="M535.929 520.155c-14.013-11.522-34.219-11.522-48.231 0L228.695 719.158a37.97 37.97 0 0 0-13.983 25.591 37.985 37.985 0 0 0 8.285 27.959 37.97 37.97 0 0 0 25.591 13.979 37.985 37.985 0 0 0 27.96-8.284L511.624 598.39l235.071 185.711a37.974 37.974 0 0 0 23.927 8.736 37.993 37.993 0 0 0 29.248-13.674 37.984 37.984 0 0 0-4.938-53.552L535.929 520.155z m0 0" p-id="2268"></path></svg>`;
const copyIcon = `<svg t="1695970366492" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2499" width="16" height="16"><path d="M720 192h-544A80.096 80.096 0 0 0 96 272v608C96 924.128 131.904 960 176 960h544c44.128 0 80-35.872 80-80v-608C800 227.904 764.128 192 720 192z m16 688c0 8.8-7.2 16-16 16h-544a16 16 0 0 1-16-16v-608a16 16 0 0 1 16-16h544a16 16 0 0 1 16 16v608z" p-id="2500"></path><path d="M848 64h-544a32 32 0 0 0 0 64h544a16 16 0 0 1 16 16v608a32 32 0 1 0 64 0v-608C928 99.904 892.128 64 848 64z" p-id="2501"></path><path d="M608 360H288a32 32 0 0 0 0 64h320a32 32 0 1 0 0-64zM608 520H288a32 32 0 1 0 0 64h320a32 32 0 1 0 0-64zM480 678.656H288a32 32 0 1 0 0 64h192a32 32 0 1 0 0-64z" p-id="2502"></path></svg>`;
const darkenPageStyle = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 1100; }`;
const darkenPageStyle2 = `body::before { content: ""; display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.4); z-index: 1300; }`;

// 切换系统黑暗监听
const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
const changeEventListeners = [];
function handleColorSchemeChange(event) {
    const newColorScheme = event.matches ? $('html').attr('data-theme', 'dark') : $('html').attr('data-theme', 'light');
    if (!event.matches) {
        var originalColor = $(this).data("original-color");
        $(this).css("background-color", originalColor);
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
        html[data-theme=dark] .float-container>#main-container, html[data-theme=dark] .alert-success, html[data-theme=dark] .alert-info, html[data-theme=dark] .alert-danger,
        html[data-theme=dark] .alert-warning, html[data-theme=dark] .panel-default>.panel-heading, html[data-theme=dark] #header a,
        html[data-theme=dark] .pagination>li>a, html[data-theme=dark] .pagination>li>span, html[data-theme=dark] .dropdown-menu,
        html[data-theme=dark] .select2-container--bootstrap .select2-selection--single .select2-selection__rendered,
        html[data-theme=dark] .ace-tm .ace_gutter, html[data-theme=dark] .translate-problem-statement-panel,
        html[data-theme=dark] .translate-problem-statement, 
        html[data-theme=dark] .select2-container--bootstrap .select2-results__option--highlighted[aria-selected],
        html[data-theme=dark] .nav-pills>li.active>a, html[data-theme=dark] .user-unrated, html[data-theme=dark] #header .header-page li.is-active a,
        html[data-theme=dark] .m-box_inner, html[data-theme=dark] .m-list-job_item, html[data-theme=dark] .a-btn_arrow,
        html[data-theme=dark] #header, html[data-theme=dark] #header .header-sub_page li a,
        html[data-theme=dark] .select2-container--default .select2-selection--single .select2-selection__rendered, html[data-theme=dark] .select2-results{
            color: #a0adb9 !important;
        }
        /* 文字颜色2 */
        html[data-theme=dark] pre, html[data-theme=dark] .html2mdButton, html[data-theme=dark] .btn-default, html[data-theme=dark] .btn-pre,
        html[data-theme=dark] small.contest-duration, html[data-theme=dark] .select2-container--bootstrap .select2-results__option,
        html[data-theme=dark] #ace_settingsmenu, #kbshortcutmenu, html[data-theme=dark] code{
            color: #9099a3;
        }
        /* 文字颜色3 */
        html[data-theme=dark] input, html[data-theme=dark] #header .header-page li a:hover{
            color: #6385a6 !important;
        }
        /* 文字颜色4 */
        html[data-theme=dark] .katex{
            color: #cbd6e2 !important;
        }
        /* 链接颜色 */
        html[data-theme=dark] a:link {
            color: #a0adb9;
        }
        html[data-theme=dark] a:visited {
            color: #8590a6;
        }
        /* 按钮 */
        html[data-theme=dark] input:hover, html[data-theme=dark] .btn-default:hover{
            background-color: #22272e !important;
        } 
        /* 背景层次1 */
        html[data-theme=dark] body, html[data-theme=dark] #main-div.float-container, html[data-theme=dark] pre,
        html[data-theme=dark] .html2mdButton:hover, html[data-theme=dark] .pagination>.active>a, html[data-theme=dark] .ace-tm,
        html[data-theme=dark] .dropdown-menu>li>a:hover, html[data-theme=dark] .dropdown-menu>li>a:focus,
        html[data-theme=dark] .dropdown-menu .divider, html[data-theme=dark] .select2-container--bootstrap .select2-selection,
        html[data-theme=dark] .ace-tm .ace_gutter-active-line, html[data-theme=dark] .select2-dropdown,
        html[data-theme=dark] input, html[data-theme=dark] button, html[data-theme=dark] select, html[data-theme=dark] textarea,
        html[data-theme=dark] code, html[data-theme=dark] .AtBetter_setting_menu,
        html[data-theme=dark] .AtBetter_setting_sidebar li a.active, html[data-theme=dark] .AtBetter_setting_sidebar li,
        html[data-theme=dark] .AtBetter_setting_menu::-webkit-scrollbar-track, html[data-theme=dark] .AtBetter_setting_content::-webkit-scrollbar-track,
        html[data-theme=dark] .AtBetter_modal, html[data-theme=dark] .AtBetter_modal button:hover, html[data-theme=dark] #config_bar_list,
        html[data-theme=dark] .translate-problem-statement-panel, html[data-theme=dark] .translate-problem-statement,
        html[data-theme=dark] #keyvisual .keyvisual-inner:before, html[data-theme=dark] .m-box_inner,
        html[data-theme=dark] .m-list-job_item, html[data-theme=dark] .select2-container--default .select2-selection--single,
        html[data-theme=dark] ol.linenums, html[data-theme=dark] li.L0, html[data-theme=dark] li.L1, html[data-theme=dark] li.L2,
        html[data-theme=dark] li.L3, html[data-theme=dark] li.L4, html[data-theme=dark] li.L5, html[data-theme=dark] li.L6,
        html[data-theme=dark] li.L7, html[data-theme=dark] li.L8, html[data-theme=dark] li.L9{
            background-color: #22272e !important;
        }
        /* 背景层次2 */
        html[data-theme=dark] .float-container>#main-container, html[data-theme=dark] #contest-nav-tabs,
        html[data-theme=dark] .btn-default, html[data-theme=dark] .html2mdButton,
        html[data-theme=dark] .nav-tabs>li.active>a, html[data-theme=dark] .nav-tabs>li.active>a:hover, html[data-theme=dark] .nav-tabs>li.active>a:focus,
        html[data-theme=dark] .nav>li>a:hover, html[data-theme=dark] .nav>li>a:focus, html[data-theme=dark] .panel, 
        html[data-theme=dark] .table-striped>tbody>tr:nth-of-type(odd), html[data-theme=dark] .insert-participant-box,
        html[data-theme=dark] .btn-pre, html[data-theme=dark] .alert-success, html[data-theme=dark] .alert-info, html[data-theme=dark] .alert-danger,
        html[data-theme=dark] .alert-warning, html[data-theme=dark] .panel-default>.panel-heading,
        html[data-theme=dark] .pagination>li>a, html[data-theme=dark] .pagination>li>span, html[data-theme=dark] .dropdown-menu,
        html[data-theme=dark] .ace-tm .ace_gutter, html[data-theme=dark] .select2-container--bootstrap .select2-results__option[aria-selected=true],
        html[data-theme=dark] #ace_settingsmenu, #kbshortcutmenu, html[data-theme=dark] .AtBetter_setting_sidebar li,
        html[data-theme=dark] .AtBetter_setting_list, html[data-theme=dark] #header .header-inner,
        html[data-theme=dark] .AtBetter_setting_menu hr, html[data-theme=dark] .AtBetter_setting_sidebar li a,
        html[data-theme=dark] .AtBetter_setting_menu::-webkit-scrollbar-thumb, html[data-theme=dark] .AtBetter_setting_content::-webkit-scrollbar-thumb,
        html[data-theme=dark] .AtBetter_modal button, html[data-theme=dark] ul#config_bar_ul::-webkit-scrollbar-thumb,
        html[data-theme=dark] .panel-info>.panel-heading, html[data-theme=dark] .post-footer, html[data-theme=dark] .a-btn_arrow:before,
        html[data-theme=dark] .table-hover>tbody>tr:hover, html[data-theme=dark] .AtBetter_contextmenu,
        html[data-theme=dark] li.L1, html[data-theme=dark] li.L3, html[data-theme=dark] li.L5, html[data-theme=dark] li.L7,
        html[data-theme=dark] li.L9{
            background-color: #2d333b !important;
        }
        /* 实线边框颜色-圆角 */
        html[data-theme=dark] input{
            border: 1px solid #424b56 !important;
            border-radius: 2px;
        }
        /* 实线边框颜色-无圆角 */
        html[data-theme=dark] .btn-default, html[data-theme=dark] .html2mdButton, html[data-theme=dark] .nav-tabs>li>a:hover,
        html[data-theme=dark] .nav-tabs>li.active>a, html[data-theme=dark] .nav-tabs>li.active>a:hover,
        html[data-theme=dark] .nav-tabs>li.active>a:focus, html[data-theme=dark] .btn-pre, html[data-theme=dark] .btn-pre:hover,
        html[data-theme=dark] pre, html[data-theme=dark] .pagination>li>a, html[data-theme=dark] .pagination>li>span,
        html[data-theme=dark] .table-bordered>thead>tr>th, html[data-theme=dark] .table-bordered>tbody>tr>th, html[data-theme=dark] .table-bordered>tfoot>tr>th,
        html[data-theme=dark] .table-bordered>thead>tr>td, html[data-theme=dark] .table-bordered>tbody>tr>td, html[data-theme=dark] .table-bordered>tfoot>tr>td,
        html[data-theme=dark] .panel, html[data-theme=dark] #editor, html[data-theme=dark] .AtBetter_setting_list,
        html[data-theme=dark] .AtBetter_setting_sidebar li, html[data-theme=dark] .AtBetter_setting_menu select,
        html[data-theme=dark] .AtBetter_modal button, html[data-theme=dark] div#config_bar_list, html[data-theme=dark] label.config_bar_ul_li_text,
        html[data-theme=dark] .translate-problem-statement-panel, html[data-theme=dark] .translate-problem-statement,
        html[data-theme=dark] .select2-container--bootstrap .select2-selection, html[data-theme=dark] .select2-container--default .select2-selection--single{
            border: 1px solid #424b56 !important;
        }
        html[data-theme=dark] hr, html[data-theme=dark] .panel-footer,
        html[data-theme=dark] .table>thead>tr>th, html[data-theme=dark] .table>tbody>tr>th, html[data-theme=dark] .table>tfoot>tr>th,
        html[data-theme=dark] .table>thead>tr>td, html[data-theme=dark] .table>tbody>tr>td, html[data-theme=dark] .table>tfoot>tr>td{
            border-top: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .nav-tabs, html[data-theme=dark] .panel-info>.panel-heading, html[data-theme=dark] .panel-default>.panel-heading,
        html[data-theme=dark] .a-btn_arrow{
            border-bottom: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .table>thead>tr>th{
            border-bottom: 2px solid #424b56 !important;
        }
        html[data-theme=dark] .AtBetter_setting_sidebar {
            border-right: 1px solid #424b56 !important;
        }
        /* 双实线边框颜色 */
        html[data-theme=dark] #header .header-inner{
            border-bottom: 5px double #22272e !important;
        }
        /* 阴影 */
        html[data-theme=dark] .float-container>#main-container{
            box-shadow: 0px 0px 10px 5px #fff0;
        }
        /* 虚线边框颜色 */
        html[data-theme=dark] .AtBetter_setting_menu_label_text, html[data-theme=dark] li#add_button{
            border: 1px dashed #424b56 !important;
        }
        /* focus-visible 
        html[data-theme=dark] {
            border-width: 1.5px !important;
            outline: none;
        }*/
        /* 图片-亮度 */
        html[data-theme=dark] img{
            opacity: .75; 
        }
        /* 反转 */
        html[data-theme=dark] .ace_content, html[data-theme=dark] #header .header-logo img, html[data-theme=dark] pre code{
            filter: invert(1) hue-rotate(.5turn);
        }
        /* 区域遮罩 */
        html[data-theme=dark] .overlay {
            background: repeating-linear-gradient(135deg, #49525f6e, #49525f6e 30px, #49525f29 0px, #49525f29 55px);
            color: #9099a3;
            text-shadow: 0px 0px 2px #000000;
        }
        /* 其他样式 */
        html[data-theme=dark] .nav-tabs>li.active>a, html[data-theme=dark] .nav-tabs>li.active>a:hover, html[data-theme=dark] .nav-tabs>li.active>a:focus{
            border-bottom-color: transparent !important;
        }
        html[data-theme=dark] .AtBetter_setting_menu, html[data-theme=dark] .AtBetter_modal{
            box-shadow: 0px 0px 0px 4px #2d333b;
            border: 1px solid #2d333b;
        }
        html[data-theme=dark] .collapsible-topic.collapsed .content .collapsible-topic-options:before{
            background-image: linear-gradient(#22272e00, #22272e);
        }
        html[data-theme=dark] .alert{
            text-shadow: none;
        }
        html[data-theme=dark] input[type="radio"]:checked+.AtBetter_setting_menu_label_text {
            color: #a0adb9 !important;
            border: 1px solid #326154 !important;
        }
        html[data-theme=dark] .AtBetter_setting_menu .btn-close{
            background-color: #ef5350a1 !important;
        }
        html[data-theme=dark] .m-box-news_post:before{
            background: linear-gradient(0deg, #22272e 50%, rgba(255,255,255,0) 100%);
        }
        html[data-theme=dark] #header .header-sub_page li a:before, html[data-theme=dark] #header .header-page li a:before{
            background-color: #9e9e9e !important;
        }
        html[data-theme=dark] .standings-score{
            color: #2196f3;
        }
        html[data-theme=dark] pre code{
            background-color: transparent !important;
        }
    `);
})()

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
    margin: -1px 0px 10px 0px;
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

.translate-problem-statement a, .translate-problem-statement a:link {
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
.html2mdButton:hover {
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
    margin: 10px !important;
    border: 0px;
}

button.html2mdButton.AtBetter_setting.open {
  background-color: #e6e6e61f;
  color: #727378;
  cursor: not-allowed;
}
.AtBetter_setting_menu {
    z-index: 1200;
    box-shadow: 0px 0px 0px 4px #ffffff;
    display: grid;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 485px;
    height: 600px;
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
.AtBetter_setting_menu h4,.AtBetter_setting_menu h5 {
    font-weight: 600;
    margin: 15px 0px 10px 0px;
}
.AtBetter_setting_menu h3 {
    margin-top: 10px;
}
.AtBetter_setting_menu hr {
    border: none;
    height: 1px;
    background-color: #ccc;
    margin: 10px 0;
}
.AtBetter_setting_menu .badge {
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
.AtBetter_setting_container {
    display: flex;
}
.AtBetter_setting_sidebar {
    width: 120px;
    padding: 6px 10px 6px 6px;
    margin: 20px 0px;
    border-right: 1px solid #d4d8e9;
}
.AtBetter_setting_content {
    flex-grow: 1;
    width: 350px;
    margin: 20px 0px 0px 20px;
    padding-right: 10px;
    max-height: 580px;
    overflow-y: auto;
    box-sizing: border-box;
}
.AtBetter_setting_sidebar h3 {
    margin-top: 0;
}
.AtBetter_setting_sidebar hr {
    margin-top: 10px;
    margin-bottom: 10px;
    border: none;
    border-top: 1px solid #DADCE0;
}
.AtBetter_setting_sidebar ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
}
.AtBetter_setting_sidebar li {
    margin: 5px 0px;
    background-color: #ffffff;
    border: 1px solid #d4d8e9;
    border-radius: 4px;
    font-size: 16px;
}
.AtBetter_setting_sidebar li a {
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
.AtBetter_setting_sidebar li a.active {
    background-color: #eceff1c7;
}
/* 下拉选择框 */
.AtBetter_setting_menu select {
    margin-left: 6px;
    border-style: solid;
    border-color: #26A69A;
    color: #009688;
    font-size: 15px;
}
.AtBetter_setting_menu select:focus-visible {
    outline: none;
}
/*设置面板-滚动条*/
.AtBetter_setting_menu::-webkit-scrollbar, .AtBetter_setting_content::-webkit-scrollbar {
    width: 5px;
    height: 7px;
    background-color: #aaa;
}
.AtBetter_setting_menu::-webkit-scrollbar-thumb, .AtBetter_setting_content::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
}
.AtBetter_setting_menu::-webkit-scrollbar-track, .AtBetter_setting_content::-webkit-scrollbar-track {
    background-color: #f1f1f1;
}
/*设置面板-关闭按钮*/
.AtBetter_setting_menu .tool-box {
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

.AtBetter_setting_menu .btn-close {
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

.AtBetter_setting_menu .btn-close:hover {
    width: 20px;
    height: 20px !important;
    font-size: 17px;
    color: #ffffff;
    background-color: #ff0000cc;
    box-shadow: 0 5px 5px 0 #00000026;
}

.AtBetter_setting_menu .btn-close:active {
    width: 20px;
    height: 20px;
    font-size: 1px;
    color: #ffffffde;
    --shadow-btn-close: 0 3px 3px 0 #00000026;
    box-shadow: var(--shadow-btn-close);
}

/*设置面板-checkbox*/
.AtBetter_setting_menu input[type=checkbox]:focus {
    outline: 0px;
}

.AtBetter_setting_menu input[type="checkbox"] {
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

.AtBetter_setting_menu input[type="checkbox"]::before {
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

.AtBetter_setting_menu input[type="checkbox"]::after {
	content: url("data:image/svg+xml,%3Csvg xmlns='://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.55021 5.84315L17.1568 16.4498L16.4497 17.1569L5.84311 6.55026L6.55021 5.84315Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17.1567 6.55021L6.55012 17.1568L5.84302 16.4497L16.4496 5.84311L17.1567 6.55021Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3C/svg%3E");
	position: absolute;
	top: 0;
	left: 24px;
}

.AtBetter_setting_menu input[type="checkbox"]:checked {
	border: 1.5px solid #C5CAE9;
	background: #E8EAF6;
}

.AtBetter_setting_menu input[type="checkbox"]:checked::before {
	background: #C5CAE9;
	border: 1.5px solid #7986CB;
	transform: translate(122%, 2%);
	transition: all 0.3s ease-in-out;
}

.AtBetter_setting_menu input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    position: absolute;
    top: 1.5px;
    left: 4.5px;
}

.AtBetter_setting_menu label, #darkMode_span, #loaded_span {
    font-size: 16px;
    font-weight: initial;
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
.AtBetter_setting_menu #translation-settings label {
    display: grid;
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

input[type="radio"]:checked+.AtBetter_setting_menu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    font-weight: 500;
}

.AtBetter_setting_menu label input[type="radio"], .AtBetter_contextmenu label input[type="radio"]{
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

.AtBetter_setting_menu input[type="text"] {
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

.AtBetter_setting_menu .AtBetter_setting_list input[type="text"] {
    margin-left: 5px;
}

.AtBetter_setting_menu input[type="text"]:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}

.AtBetter_setting_menu_input {
    width: 100%;
    display: grid;
    margin-top: 5px;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
.AtBetter_setting_menu input::placeholder {
    color: #727378;
}
.AtBetter_setting_menu input.no_default::placeholder{
    color: #BDBDBD;
}
.AtBetter_setting_menu input.is_null::placeholder{
    color: red;
    border-width: 1.5px;
}
.AtBetter_setting_menu input.is_null{
    border-color: red;
}
.AtBetter_setting_menu textarea {
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
.AtBetter_setting_menu textarea:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}
.AtBetter_setting_menu textarea::placeholder{
    color: #BDBDBD;
    font-size: 14px;
}

.AtBetter_setting_menu #save {
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
.AtBetter_setting_menu button#debug_button.debug_button {
    width: 18%;
}

.AtBetter_setting_menu span.tip {
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
    z-index: 1100;
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
.AtBetter_setting_menu .AtBetter_setting_menu_label_text .help_tip .help-icon {
    color: #7fbeb2;
}
.help_tip .help-icon:hover + .tip_text, .help_tip .tip_text:hover {
    display: block;
    cursor: help;
    width: 250px;
}

/*确认弹窗*/
.AtBetter_modal {
    z-index: 1600;
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
.AtBetter_modal h2 {
    font-size: 1.6em;
    margin: 0px;
}
.AtBetter_modal .buttons{
    display: flex;
    padding-top: 15px;
}
.AtBetter_modal button {
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
.AtBetter_modal button#cancelButton{
    background-color:#4DB6AC;
}
.AtBetter_modal button:hover{
    background-color:#4DB6AC;
}
.AtBetter_modal button#cancelButton:hover {
    background-color: #80CBC4;
}
.AtBetter_modal .help-icon {
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
.AtBetter_modal p {
    margin: 5px 0px;
}
/*更新检查*/
div#update_panel {
    z-index: 1200;
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
    width: 340px;
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
    z-index: 1300;
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
    z-index: 1300;
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
.dark-mode-selection > * {
    margin: 6px;
}
.dark-mode-selection .AtBetter_setting_menu_label_text {
    border-radius: 8px;
}
/* 右键菜单 */
.AtBetter_contextmenu {
    z-index: 1500;
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
input[type="radio"]:checked+.AtBetter_contextmenu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    font-weight: 500;
}
.AtBetter_contextmenu label{
    margin: 0px;
    font-weight: initial;
}
.AtBetter_contextmenu_label_text {
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
.AtBetter_contextmenu_label_text:hover {
    color: #F44336;
    border: 1px dashed #009688;
    background-color: #ffebcd;
}
/* alert提示 */
.AtBetter_alert{
    margin: 1em;
    text-align: center;
    font-weight: 600;
    position: relative;
    margin-left: -15px;
    margin-right: -15px;
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

        isSpecialMouseDown = $(e.target).is('label, p, input, textarea, span, select');

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

    // 语言判断
    isEnglishLanguage = (function () {
        var metaElement = $('meta[http-equiv="Content-Language"]');
        var contentValue = metaElement.attr('content');
        return (contentValue === 'en');
    })();

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

    // 日语汉化
    if (!isEnglishLanguage) {
        const rules1 = [
            { match: 'コンテスト', replace: '比赛' },
            { match: 'Jobs', replace: '工作' },
            { match: '検定', replace: '考试' },
            { match: 'CareerDesign', replace: '职业规划' },
            { match: 'マイプロフィール', replace: '我的个人资料' },
            { match: '基本設定', replace: '基本设置' },
            { match: 'アイコン設定', replace: '头像设置' },
            { match: 'パスワードの変更', replace: '修改密码' },
            { match: 'お気に入り管理', replace: '收藏夹管理' },
            { match: 'ログアウト', replace: '注销' }
        ];
        traverseTextNodes($('.header-inner'), rules1);

        const rules2 = [
            { match: 'コンテスト', replace: '比赛' },
            { match: '最新コンテスト', replace: '最新比赛' },
            { match: 'ランキング', replace: '排名' },
            { match: 'お知らせ', replace: '公告' },
            { match: 'AtCoderJobs', replace: 'AtCoder工作' },
            { match: '検定', replace: '考试' },
            { match: 'アルゴリズム実技検定についてはこちらから！', replace: '有关算法实际技能考试，请点击此处！' },
            { match: '過去問公開中', replace: '过去问题公开中' },
        ];
        traverseTextNodes($('.a-title_ttl'), rules2);

        const rules3 = [
            { match: '詳細を見る', replace: '查看详情' },
            { match: '求人情報を見る', replace: '查看职位信息' },
            { match: '採用担当者の方へ', replace: '致招聘负责人' },
            { match: '詳細ページ', replace: '详细页面' },
            { match: 'マイページ', replace: '我的页面' },
            { match: 'コンテスト一覧', replace: '比赛列表' },
            { match: 'すべて表示', replace: '显示全部' },
            { match: '殿堂入り', replace: '名人堂' },
            { match: 'お知らせ一覧', replace: '公告列表' },
        ];
        traverseTextNodes($('.a-btnarea'), rules3);

        const rules4 = [
            { match: '解けた！を', replace: '解决了！' },
            { match: '世界に届けたい。', replace: '给全世界。' },
            { match: 'AtCoderは、世界最高峰の競技プログラミングサイトです。', replace: 'AtCoder是世界最高水平的竞技编程网站。' },
            { match: 'リアルタイムのオンラインコンテストで競い合うことや、', replace: '您可以参加实时在线比赛，' },
            { match: '5,000以上の過去問にいつでもチャレンジすることができます。', replace: '随时挑战超过5,000道历年题目。' },
        ];
        traverseTextNodes($('.keyvisual-grid'), rules4);

        const rules5 = [
            { match: 'コンテスト', replace: '比赛' },
            { match: '開催中のコンテスト', replace: '进行中的比赛' },
            { match: '常設中のコンテスト', replace: '长期持续的比赛' },
            { match: '予定されたコンテスト', replace: '计划中的比赛' },
            { match: '終了後のコンテスト(最新 10 件)', replace: '已结束的比赛（最新10场）' },
            { match: '終了後のコンテスト(最新 50 件)', replace: '已结束的比赛（最新10场）' },
            { match: 'ランキング', replace: '排名' },
            { match: 'インフォメーション', replace: '信息' },
            { match: '過去のコンテスト', replace: '过去的比赛' },
            { match: '過去のコンテストを検索', replace: '搜索过去的比赛' },
        ];
        strictTraverseTextNodes($('.panel-title'), rules5);
        strictTraverseTextNodes($('h3'), rules5);
        strictTraverseTextNodes($('.h3'), rules5);
        strictTraverseTextNodes($('h4'), rules5);

        const rules6 = [
            { match: 'ホーム', replace: '主页' },
            { match: 'コンテスト一覧', replace: '比赛列表' },
            { match: 'ランキング', replace: '排名' },
            { match: '便利リンク集', replace: '实用链接' },
        ];
        traverseTextNodes($('.header-sub_nav'), rules6);
        traverseTextNodes($('.h3'), rules6);

        const rules7 = [
            { match: '現在のコンテスト', replace: '现在的比赛' },
            { match: '過去のコンテスト', replace: '过去的比赛' },
            { match: 'Algorithm', replace: '算法' },
            { match: 'Heuristic', replace: '启发式' },
            { match: 'アクティブユーザのみ', replace: '仅活跃用户' },
            { match: '全ユーザ', replace: '所有用户' },
            { match: '新エディタテストコンテスト', replace: '新编辑器测试比赛' },
            { match: '日本語', replace: '日语' },
            { match: 'English', replace: '英语' },
            { match: 'bjxh (Guest)', replace: 'bjxh（游客）' },
            { match: 'マイプロフィール', replace: '个人资料' },
            { match: '基本設定', replace: '基本设置' },
            { match: 'アイコン設定', replace: '头像设置' },
            { match: 'パスワードの変更', replace: '修改密码' },
            { match: 'お気に入り管理', replace: '收藏管理' },
            { match: 'ログアウト', replace: '登出' },
            { match: 'トップ', replace: '首页' },
            { match: '問題', replace: '问题' },
            { match: '質問', replace: '提问' },
            { match: '提出', replace: '提交' },
            { match: '提出結果', replace: '提交结果' },
            { match: 'すべての提出', replace: '所有提交' },
            { match: '自分の提出', replace: '我的提交' },
            { match: '自分の得点状況', replace: '我的得分情况' },
            { match: 'バーチャル順位表', replace: '虚拟排名表' },
            { match: '順位表', replace: '排名表' },
            { match: 'チーム戦排名表', replace: '团队比赛排名表' },
            { match: 'コードテスト', replace: '代码测试' },
            { match: '解説', replace: '题解' },
            { match: 'すべての提交', replace: '所有提交' },
            { match: '自分の提交', replace: '我的提交' },
            { match: 'プロフィール', replace: '个人资料' },
            { match: 'コンテスト成績表', replace: '比赛成绩表' },
            { match: '設定', replace: '设置' },
            { match: 'メールアドレスの更新・認証', replace: '更新/认证电子邮件地址' },
            { match: '收藏管理', replace: '收藏管理' },
            { match: 'ユーザ名照会', replace: '用户名查询' },
            { match: 'ユーザ名の変更', replace: '更改用户名' },
            { match: '退会', replace: '注销' },
            { match: 'その他', replace: '其他' },
        ];
        traverseTextNodes($('.nav'), rules7);

        const rules8 = [
            { match: 'Rated対象', replace: '限定范围' },
            { match: 'ABCクラス', replace: 'ABC类别' },
            { match: '(Rated上限: 1999)', replace: '(Rated上限: 1999)' },
            { match: 'ARCクラス', replace: 'ARC类别' },
            { match: '(Rated上限: 2799)', replace: '(Rated上限: 2799)' },
            { match: 'AGCクラス', replace: 'AGC类别' },
            { match: '(Rated上限なし)', replace: '(无Rated上限)' },
            { match: 'AHCクラス', replace: 'AHC类别' },
            { match: 'カテゴリ', replace: '分类' },
            { match: '全て', replace: '全部' },
            { match: 'AtCoder Typical Contest', replace: 'AtCoder经典比赛' },
            { match: 'PAST過去問', replace: 'PAST历年问题' },
            { match: '非公式コンテスト(unrated)', replace: '非官方比赛（未评级）' },
            { match: 'JOI過去問', replace: 'JOI历年问题' },
            { match: '企業コンテスト決勝', replace: '企业比赛决赛' },
            { match: '企業オープンコンテスト(rated)', replace: '企业公开比赛（已评级）' },
            { match: '企業オープンコンテスト(unrated)', replace: '企业公开比赛（未评级）' },
            { match: '企業ABC', replace: '企业ABC' },
            { match: '企業ARC', replace: '企业ARC' },
            { match: 'ヒューリスティック', replace: '启发式' },
            { match: '企業ヒューリスティック', replace: '企业启发式' },
            { match: '検索', replace: '搜索' },
            { match: 'リセット', replace: '重置' },
            { match: 'コンテスト名', replace: '比赛名称' },
        ];
        strictTraverseTextNodes($('#collapse-search'), rules8);

        const rules9 = [
            { match: 'もっと見る', replace: '查看更多' },
            { match: '自分の得点状況', replace: '我的得分情况' },
            { match: '印刷用問題文', replace: '打印问题集' },
            { match: '記事アーカイブ', replace: '文章存档' },
            { match: '詳細', replace: '详情' },
            { match: 'すべて表示', replace: '显示全部' },
            { match: '殿堂入り', replace: '名人堂' },
        ];
        strictTraverseTextNodes($('.btn-text'), rules9);

        const rules10 = [
            { match: 'ホーム', replace: '主页' },
            { match: 'コンテスト一覧', replace: '比赛列表' },
            { match: 'コンテスト', replace: '比赛' },
            { match: 'ランキング', replace: '排名' },
            { match: '便利リンク集', replace: '实用链接' },
            { match: 'AtCoderJobs', replace: 'AtCoder职位' },
            { match: 'AtCoderJobsトップ', replace: 'AtCoder职位首页' },
            { match: '2024年新卒採用求人一覧', replace: '2024年应届毕业生招聘职位列表' },
            { match: '2025年新卒採用求人一覧', replace: '2025年应届毕业生招聘职位列表' },
            { match: '中途採用求人一覧', replace: '社会人招聘职位列表' },
            { match: 'インターン求人一覧', replace: '实习职位列表' },
            { match: 'アルバイト求人一覧', replace: '兼职职位列表' },
            { match: 'その他求人一覧', replace: '其他职位列表' },
            { match: 'AtCoder社による職業紹介求人一覧', replace: '由AtCoder公司提供的职业介绍职位列表' },
            { match: '採用担当者の方へ', replace: '给招聘负责人的信息' },
            { match: '検定', replace: '认证考试' },
            { match: '検定トップ', replace: '认证考试首页' },
            { match: 'マイページ', replace: '个人主页' },
            { match: 'AtCoderCareerDesign', replace: 'AtCoder职业设计' },
            { match: 'キャリアデザイントップ', replace: '职业设计首页' },
            { match: 'About', replace: '关于' },
            { match: '企業情報', replace: '企业信息' },
            { match: 'よくある質問', replace: '常见问题' },
            { match: 'お問い合わせ', replace: '联系我们' },
            { match: '資料請求', replace: '索取资料' },
            { match: '利用規約', replace: '使用规范' },
            { match: 'ルール', replace: '规则' },
            { match: '用語集', replace: '术语表' },
            { match: 'プライバシーポリシー', replace: '隐私政策' },
            { match: '個人情報保護方針', replace: '个人信息保护政策' },
            { match: 'Copyright Since 2012 (C) AtCoder Inc. All rights reserved.', replace: '版权所有 © 2012年起 AtCoder公司。保留所有权利。' },
        ];
        strictTraverseTextNodes($('#footer'), rules10);
        strictTraverseTextNodes($('.footer'), rules10);

        const rules11 = [
            { match: 'ファイルを開く', replace: '打开文件' },
            { match: 'カスタマイズ', replace: '自定义' },
            { match: 'エディタ切り替え', replace: '切换编辑器' },
            { match: '高さ自動調節', replace: '自动调整高度' },
        ];
        traverseTextNodes($('.editor-buttons'), rules11);

        const rules12 = [
            { match: '問題', replace: '问题' },
            { match: '言語', replace: '语言' },
            { match: 'ソースコード', replace: '源代码' },
            { match: '標準入力', replace: '标注输入' },
            { match: '標準出力', replace: '标准输出' },
            { match: '標準エラー出力', replace: '标准错误输出' },
        ];
        traverseTextNodes($('.control-label'), rules12);

        const rules13 = [
            { match: 'トップ', replace: '首页' },
            { match: '問題', replace: '问题' },
            { match: '質問', replace: '提问' },
            { match: '提出', replace: '提交' },
            { match: '提出結果', replace: '提交结果' },
            { match: 'すべての提交', replace: '所有提交' },
            { match: '自分の提交', replace: '我的提交' },
            { match: '自分の得点状況', replace: '我的得分情况' },
            { match: 'バーチャル順位表', replace: '虚拟排名表' },
            { match: '順位表', replace: '排名表' },
            { match: 'コードテスト', replace: '代码测试' },
            { match: '解説', replace: '题解' },
        ];
        traverseTextNodes($('.h2'), rules13);
        traverseTextNodes($('h2'), rules13);

        const rules14 = [
            { match: 'トップ', replace: '首页' },
            { match: '問題', replace: '问题' },
            { match: '質問', replace: '提问' },
            { match: '提出', replace: '提交' },
            { match: '提出結果', replace: '提交结果' },
            { match: 'すべての提交', replace: '所有提交' },
            { match: '自分の提交', replace: '我的提交' },
            { match: '自分の得点状況', replace: '我的得分情况' },
            { match: 'バーチャル順位表', replace: '虚拟排名表' },
            { match: '順位表', replace: '排名表' },
            { match: 'コードテスト', replace: '代码测试' },
            { match: '解説', replace: '题解' },
        ];
        traverseTextNodes($('.panel-heading'), rules14);

        const rules15 = [
            { match: '開催中', replace: '进行中' },
            { match: '予定', replace: '即将举行' },
            { match: '終了', replace: '已结束' },
        ];
        traverseTextNodes($('.status'), rules15);

        const rules16 = [
            { match: 'コンテスト名', replace: '比赛名称' },
            { match: 'Rated対象', replace: '计分对象' },
            { match: '時間', replace: '时长' },
            { match: '開始時刻', replace: '开始时间' },
        ];
        traverseTextNodes($('th.text-center'), rules16);

        const rules17 = [
            { match: 'コンテスト名', replace: '比赛名称' },
            { match: '開始時刻', replace: '开始时间' },
            { match: 'ユーザ', replace: '用户' },
        ];
        traverseTextNodes($('.table-responsive tr th'), rules17);

        const rules19 = [
            { match: '問題名', replace: '问题名称' },
            { match: '実行時間制限', replace: '执行时间限制' },
            { match: 'メモリ制限', replace: '内存限制' },
        ];
        traverseTextNodes($('.table-bordered tr th'), rules19);

        const rules20 = [
            { match: 'ページトップ', replace: '返回顶部' },
        ];
        traverseTextNodes($('#scroll-page-top'), rules20);

        const rules21 = [
            { match: 'AtCoderホームへ戻る', replace: '返回 AtCoder 主页' },
        ];
        traverseTextNodes($('.back-to-home'), rules21);

        const rules22 = [
            { match: '参加登録', replace: '报名' },
            { match: 'バーチャル参加', replace: '虚拟参与' },
        ];
        traverseTextNodes($('.btn'), rules22);

        return;
    }

    // 英语汉化
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
        { match: 'Change Photo', replace: '更改头像' },
        { match: 'Change Password', replace: '更改密码' },
        { match: 'Manage Fav', replace: '管理收藏' },
        { match: 'Other', replace: '其他' },
        { match: 'Remind Username', replace: '提醒用户名' },
        { match: 'Change Username', replace: '更改用户名' },
        { match: 'Delete Account', replace: '删除账户' }
    ];
    traverseTextNodes($('.nav'), rules1);

    const rules2 = [
        { match: 'My 个人资料', replace: '我的个人资料' },
        { match: 'General Settings', replace: '常规设置' },
        { match: 'Change Photo', replace: '更改照片' },
        { match: 'Change Password', replace: '更改密码' },
        { match: 'Manage Fav', replace: '管理收藏' },
        { match: 'Sign Out', replace: '退出登录' }
    ];
    traverseTextNodes($('.dropdown-menu'), rules2);

    const rules3 = [
        { match: 'Search in Archive', replace: '搜索存档' },
        { match: 'Permanent Contests', replace: '长期持续的比赛' },
        { match: 'Upcoming Contests', replace: '即将举行的比赛' },
        { match: 'Recent Contests', replace: '最近的比赛' },
        { match: 'Ranking', replace: '排行' },
        { match: 'Contest Archive', replace: '比赛档案' },
        { match: 'Information', replace: '信息' },
        { match: 'About the situation where it is difficult to access the contest site', replace: '关于难以访问比赛网站的情况' },
    ];
    traverseTextNodes($('.panel-title'), rules3);
    traverseTextNodes($('.h3'), rules3);
    strictTraverseTextNodes($('h3'), rules3);

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
        { match: 'Customize', replace: '个性化' },
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

    const rules12 = [
        { match: 'Editorial', replace: '题解' },
    ];
    strictTraverseTextNodes($('.btn'), rules12);

    const rules13 = [
        { match: 'Official', replace: '官方' },
    ];
    strictTraverseTextNodes($('.label'), rules13);

    const rules14 = [
        { match: 'Contest Duration', replace: '比赛时间' },
        { match: 'local time', replace: '当地时间' }
    ];
    traverseTextNodes($('.contest-duration'), rules14);
};

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

const AtBetterSettingMenuHTML = `
    <div class='AtBetter_setting_menu' id='AtBetter_setting_menu'>
    <div class="tool-box">
        <button class="btn-close">×</button>
    </div>
    <div class="AtBetter_setting_container">
        <div class="AtBetter_setting_sidebar">
        <ul>
            <li><a href="#basic-settings" id="sidebar-basic-settings" class="active">基本设置</a></li>
            <li><a href="#translation-settings" id="sidebar-translation-settings">翻译设置</a></li>
            <li><a href="#compatibility-settings" id="sidebar-compatibility-settings">兼容设置</a></li>
        </ul>
        </div>
        <div class="AtBetter_setting_content">
        <div id="basic-settings" class="settings-page active">
            <h3>基本设置</h3>
            <hr>
            <div class='AtBetter_setting_list' style="padding: 0px 10px;">
                <span id="darkMode_span">黑暗模式</span>
                <div class="dark-mode-selection">
                    <label>
                        <input class="radio-input" type="radio" name="darkMode" value="dark" />
                        <span class="AtBetter_setting_menu_label_text">黑暗</span>
                        <span class="radio-icon"> </span>
                    </label>
                    <label>
                        <input checked="" class="radio-input" type="radio" name="darkMode" value="light" />
                        <span class="AtBetter_setting_menu_label_text">白天</span>
                        <span class="radio-icon"> </span>
                    </label>
                    <label>
                        <input class="radio-input" type="radio" name="darkMode" value="follow" />
                        <span class="AtBetter_setting_menu_label_text">跟随系统</span>
                        <span class="radio-icon"> </span>
                    </label>
                </div>
            </div>
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
                <label for="hoverTargetAreaDisplay">显示目标区域范围</label>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                    <p>开启后当鼠标悬浮在 MD视图/复制/翻译 按钮上时，会显示其目标区域的范围</p>
                    </div>
                </div>
                <input type="checkbox" id="hoverTargetAreaDisplay" name="hoverTargetAreaDisplay">
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
        </div>
        <div id="translation-settings" class="settings-page">
            <h3>翻译设置</h3>
            <hr>
            <h4>首选项</h4>
            <label>
                <input type='radio' name='translation' value='deepl'>
                <span class='AtBetter_setting_menu_label_text'>deepl翻译</span>
            </label>
            <label>
                <input type='radio' name='translation' value='iflyrec'>
                <span class='AtBetter_setting_menu_label_text'>讯飞听见翻译</span>
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
                <input type='radio' name='translation' value='caiyun'>
                <span class='AtBetter_setting_menu_label_text'>彩云小译翻译</span>
            </label>
            <label>
                <input type='radio' name='translation' value='openai'>
                <span class='AtBetter_setting_menu_label_text'>使用ChatGPT翻译(API)
                    <div class="help_tip">
                        `+ helpCircleHTML + `
                        <div class="tip_text">
                        <p><b>请在下方选定你想使用的配置信息</b></p>
                        <p>脚本的所有请求均在本地完成</p>
                        </div>
                    </div>
                </span>
            </label>
            <div class='AtBetter_setting_menu_input' id='openai' style='display: none;'>
                <div id="chatgpt-config"></div>
            </div>
            <h4>高级</h4>
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
                <label for="translation_replaceSymbol" style="display: flex;">LaTeX替换符</label>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                    <p>脚本通过先取出所有的LaTeX公式，并使用替换符占位，来保证公式不会被翻译接口所破坏</p>
                    <p>对于各个翻译服务，不同的替换符本身遭到破坏的概率有所不同，具体请阅读脚本页的说明</p>
                    <p>注意：使用ChatGPT翻译时不需要上述操作, 因此不受此选项影响</p>
                    <p>具体您可以前往阅读脚本页的说明</p>
                    </div>
                </div>
                <select id="translation_replaceSymbol" name="translation_replaceSymbol">
                    <option value=2>使用{}</option>    
                    <option value=1>使用【】</option>
                    <option value=3>使用[]</option>
                </select>
            </div>
        </div>
        <div id="compatibility-settings" class="settings-page">
            <h3>兼容设置</h3>
            <hr>
            <div class='AtBetter_setting_list'>
                <label for="loaded"><span id="loaded_span">不等待页面资源加载</span></label>
                <div class="help_tip">
                    `+ helpCircleHTML + `
                    <div class="tip_text">
                    <p>为了防止在页面资源未加载完成前（主要是各种js）执行脚本产生意外的错误，脚本默认会等待 window.onload 事件</p>
                    <p>如果您的页面上方的加载信息始终停留在：“等待页面资源加载”，即使页面已经完成加载</p>
                    <p><u>您首先应该确认是否是网络问题，</u></p>
                    <p>如果不是，那这可能是由于 window.onload 事件在您的浏览器中触发过早（早于DOMContentLoaded），</p>
                    <p>您可以尝试开启该选项来不再等待 window.onload 事件</p>
                    <p><u>注意：如果没有上述问题，请不要开启该选项</u></p>
                    </div>
                </div>
                <input type="checkbox" id="loaded" name="loaded">
            </div>
        </div>
    </div>
`;

const chatgptConfigEditHTML = `
    <div class='AtBetter_setting_menu' id='config_edit_menu'>
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

// 配置改变保存确认
function saveConfirmation() {
    return new Promise(resolve => {
        const styleElement = GM_addStyle(darkenPageStyle2);
        let htmlString = `
        <div class="AtBetter_modal">
            <h2>配置已更改，是否保存？</h2>
            <div class="buttons">
                <button id="cancelButton">不保存</button><button id="saveButton">保存</button>
            </div>
        </div>
      `;
        $('body').before(htmlString);
        addDraggable($('.AtBetter_modal'));
        $("#saveButton").click(function () {
            $(styleElement).remove();
            $('.AtBetter_modal').remove();
            resolve(true);
        });
        $("#cancelButton").click(function () {
            $(styleElement).remove();
            $('.AtBetter_modal').remove();
            resolve(false);
        });
    });
}

// 设置按钮面板
async function settingPanel() {
    // 添加按钮
    var htmlContent = "<button class='html2mdButton AtBetter_setting'>AtcoderBetter设置</button>";
    if (isEnglishLanguage) {
        $('#navbar-collapse > ul:nth-child(2) > li:last-child').after("<li class='dropdown'>" + htmlContent + "</li>");
    } else {
        if ($('.header-mypage').length > 0) $('.header-mypage').after(htmlContent);
        else $('#navbar-collapse > ul:nth-child(2) > li:last-child').after("<li class='dropdown'>" + htmlContent + "</li>");
    }
    const $settingBtns = $(".AtBetter_setting");
    $settingBtns.click(() => {
        const styleElement = GM_addStyle(darkenPageStyle);
        $settingBtns.prop("disabled", true).addClass("open");
        $("body").append(AtBetterSettingMenuHTML);

        // 窗口初始化
        addDraggable($('#AtBetter_setting_menu'));

        // 选项卡切换
        $('.AtBetter_setting_sidebar a').click(function (event) {
            event.preventDefault();
            $('.AtBetter_setting_sidebar a').removeClass('active');
            $(this).addClass('active');
            $('.settings-page').removeClass('active');
            const targetPageId = $(this).attr('href').substring(1);
            $('#' + targetPageId).addClass('active');
        });

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
        tempConfig = setupConfigManagement('#chatgpt-config', tempConfig, chatgptStructure, chatgptConfigEditHTML, checkable);

        // 状态更新
        $("#bottomZh_CN").prop("checked", GM_getValue("bottomZh_CN") === true);
        $("input[name='darkMode'][value='" + darkMode + "']").prop("checked", true);
        $("#showLoading").prop("checked", GM_getValue("showLoading") === true);
        $("#enableSegmentedTranslation").prop("checked", GM_getValue("enableSegmentedTranslation") === true);
        $("#showJumpToLuogu").prop("checked", GM_getValue("showJumpToLuogu") === true);
        $("#loaded").prop("checked", GM_getValue("loaded") === true);
        $("#hoverTargetAreaDisplay").prop("checked", GM_getValue("hoverTargetAreaDisplay") === true);
        $("input[name='translation'][value='" + translation + "']").prop("checked", true);
        $("input[name='translation']").css("color", "gray");
        if (translation == "openai") {
            $("#openai").show();
            if (tempConfig) {
                $("input[name='config_item'][value='" + tempConfig.choice + "']").prop("checked", true);
            }
        }
        $('#translation_replaceSymbol').val(GM_getValue("replaceSymbol"));

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

        // 关闭
        const $settingMenu = $(".AtBetter_setting_menu");
        $settingMenu.on("click", ".btn-close", async () => {
            const settings = {
                bottomZh_CN: $("#bottomZh_CN").prop("checked"),
                darkMode: $("input[name='darkMode']:checked").val(),
                showLoading: $("#showLoading").prop("checked"),
                hoverTargetAreaDisplay: $("#hoverTargetAreaDisplay").prop("checked"),
                enableSegmentedTranslation: $("#enableSegmentedTranslation").prop("checked"),
                showJumpToLuogu: $("#showJumpToLuogu").prop("checked"),
                loaded: $("#loaded").prop("checked"),
                translation: $("input[name='translation']:checked").val(),
                replaceSymbol: $('#translation_replaceSymbol').val()
            };
            // 判断是否改变
            let hasChange = false;
            for (const [key, value] of Object.entries(settings)) {
                if (!hasChange && GM_getValue(key) != value) hasChange = true;
            }
            if (!hasChange && JSON.stringify(GM_getValue('chatgpt-config')) != JSON.stringify(tempConfig)) hasChange = true;

            if (hasChange) {
                const shouldSave = await saveConfirmation();
                if (shouldSave) {
                    // 数据校验
                    if (settings.translation === "openai") {
                        var selectedIndex = $('input[name="config_item"]:checked').closest('li').index();
                        if (selectedIndex === -1) {
                            $('#configControlTip').text('请选择一项配置！');
                            $('.AtBetter_setting_sidebar a').removeClass('active');
                            $('#sidebar-translation-settings').addClass('active');
                            $('.settings-page').removeClass('active');
                            $('#translation-settings').addClass('active');
                            return;
                        }
                    }

                    // 保存数据
                    let refreshPage = false; // 是否需要刷新页面
                    for (const [key, value] of Object.entries(settings)) {
                        if (!refreshPage && !(key == 'enableSegmentedTranslation' || key == 'translation' || key == 'darkMode' ||
                            key == 'replaceSymbol')) {
                            if (GM_getValue(key) != value) refreshPage = true;
                        }
                        GM_setValue(key, value);
                    }
                    GM_setValue('chatgpt-config', tempConfig);

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
                            } else {
                                $('html').attr('data-theme', 'light');
                                // 移除旧的事件监听器
                                const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
                                window.matchMedia('(prefers-color-scheme: dark)');
                            }
                        }
                        // 更新配置信息
                        enableSegmentedTranslation = settings.enableSegmentedTranslation;
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
            };

            $settingMenu.remove();
            $settingBtns.prop("disabled", false).removeClass("open");
            $(styleElement).remove();
        });
    });
};

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
            node.classList.contains('overlay')
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
        var latex = $(node).find('annotation').text();
        latex = latex.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return "$" + latex + "$";
    }
});

// block math
turndownService.addRule('block-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex-display";
    },
    replacement: function (content, node) {
        var latex = $(node).find('annotation').text();
        latex = latex.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return "\n$$\n" + latex + "\n$$\n";
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
                var ths = trs[0].querySelectorAll('th, td');
                if (ths.length > 0) {
                    thead = '| ' + Array.from(ths).map(th => turndownService.turndown(th.innerHTML.trim())).join(' | ') + ' |\n'
                    thead += '| ' + Array.from(ths).map(() => ' --- ').join('|') + ' |\n';
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
                "z-index": "1400"
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
            if (previousCSS) {
                $(target).css(previousCSS);
            }
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
                "z-index": "1400"
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
            if (previousCSS) {
                $(target).css(previousCSS);
            }
            $(".html2md-cb" + suffix).parent().css({
                "position": "static"
            })
        });
    }
}

async function addButtonWithTranslation(parent, suffix, type) {
    var result;
    $(document).on('click', '.translateButton' + suffix, debounce(async function () {
        $(this).trigger('mouseout')
            .removeClass("translated")
            .text("翻译中")
            .css("cursor", "not-allowed")
            .prop("disabled", true);
        var target, element_node, block, errerNum = 0;
        if (type === "this_level") block = $(".translateButton" + suffix).parent().next();
        else if (type === "child_level") block = $(".translateButton" + suffix).parent().parent();

        // 重新翻译
        if (result) {
            if (result.translateDiv) $(result.translateDiv).remove();
            if (result.copyDiv) $(result.copyDiv).remove();
            if (result.panelDiv) $(result.panelDiv).remove();
            $(block).find(".translate-problem-statement, .translate-problem-statement-panel").remove();
            // 移除旧的事件
            $(document).off("mouseover", ".translateButton" + suffix);
            $(document).off("mouseout", ".translateButton" + suffix);
            // 重新绑定悬停事件
            if (hoverTargetAreaDisplay) bindHoverEvents(suffix, type);
        }

        // 分段翻译
        if (enableSegmentedTranslation) {
            var pElements = block.find("p, li:not(pre li)");
            pElements.find('pre').remove();
            for (let i = 0; i < pElements.length; i++) {
                target = $(pElements[i]).eq(0).clone();
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
            $(target).find('pre').remove();
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
                "z-index": "1400"
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

    // 右键菜单
    $(document).on('contextmenu', '.translateButton' + suffix, function (e) {
        e.preventDefault();

        // 移除旧的
        if (!$(event.target).closest('.AtBetter_contextmenu').length) {
            $('.AtBetter_contextmenu').remove();
        }

        var menu = $('<div class="AtBetter_contextmenu"></div>');
        var translations = [
            { value: 'deepl', name: 'deepl翻译' },
            { value: 'iflyrec', name: '讯飞听见翻译' },
            { value: 'youdao', name: '有道翻译' },
            { value: 'google', name: 'Google翻译' },
            { value: 'caiyun', name: '彩云小译翻译' },
            { value: 'openai', name: 'ChatGPT翻译' }
        ];
        translations.forEach(function (translation) {
            var label = $(`<label><input type="radio" name="translation" value="${translation.value}">
            <span class="AtBetter_contextmenu_label_text">${translation.name}</span></label>`);
            menu.append(label);
        });

        // 初始化
        menu.find(`input[name="translation"][value="${translation}"]`).prop('checked', true);
        menu.css({
            top: e.pageY + 'px',
            left: e.pageX + 'px'
        }).appendTo('body');

        $(document).one('change', 'input[name="translation"]', function () {
            translation = $('input[name="translation"]:checked').val();
            GM_setValue("translation", translation);
            $('.AtBetter_contextmenu').remove();
        });

        // 点击区域外关闭菜单
        function handleClick(event) {
            if (!$(event.target).closest('.AtBetter_contextmenu').length) {
                $('.AtBetter_contextmenu').remove();
                $(document).off('change', 'input[name="translation"]');
            } else {
                $(document).one('click', handleClick);
            }
        }
        $(document).one('click', handleClick);
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
            .text("翻译出错")
            .css("cursor", "pointer")
            .prop("disabled", false);
        $(target).remove();
    }
    return result;
}

function addConversionButton() {
    // 基本添加
    if (!is_homepage) {
        $('section').each(function () {
            let id = "_" + getRandomNumber(8);
            addButtonPanel(this, id, "this_level");
            addButtonWithHTML2MD(this, id, "this_level");
            addButtonWithCopy(this, id, "this_level");
            addButtonWithTranslation(this, id, "this_level");
        });
    }

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
            .html(`<button style="height: 29px;border: 1px solid #ccc;" class="html2mdButton"><img style="width:45px; margin-right:2px;" src="https://cdn.luogu.com.cn/fe/logo.png"></button>`);
        problemLink.appendTo('.h2');
    }
}

// 字数超限确认
function showWordsExceededDialog(button, textLength, realTextLength) {
    return new Promise(resolve => {
        const styleElement = GM_addStyle(darkenPageStyle);
        $(button).removeClass("translated");
        $(button).text("字数超限");
        $(button).css("cursor", "not-allowed");
        $(button).prop("disabled", true);
        let htmlString = `
        <div class="AtBetter_modal">
          <h2>字符数超限! </h2>
          <p>即将翻译的内容共 <strong>${realTextLength}</strong> 字符</p>
          <p>这超出了当前翻译服务的 <strong>${textLength}</strong> 字符上限，请更换翻译服务，或在设置面板中开启“分段翻译”</p>
          
          <div style="display:flex; padding:5px 0px; align-items: center;">
            `+ helpCircleHTML + `
                <p>
                注意，可能您选择了错误的翻译按钮<br>
                由于实现方式，区域中会出现多个翻译按钮，请点击更小的子区域中的翻译按钮
                </p>
            </div>
            <p>您确定要继续翻译吗？</p>
            <div class="buttons">
                <button id="continueButton">继续</button><button id="cancelButton">取消</button>
            </div>
        </div>
        `;
        $('body').before(htmlString);
        $("#continueButton").click(function () {
            $(styleElement).remove();
            $('.AtBetter_modal').remove();
            resolve(true);
        });
        $("#cancelButton").click(function () {
            $(styleElement).remove();
            $('.AtBetter_modal').remove();
            resolve(false);
        });
    });
}

// 跳过折叠块确认
function skiFoldingBlocks() {
    return new Promise(resolve => {
        const styleElement = GM_addStyle(darkenPageStyle);
        let htmlString = `
    <div class="AtBetter_modal">
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
        <div class="buttons">
          <button id="cancelButton">否</button><button id="skipButton">跳过</button>
        </div>
    </div>
    `;
        $('body').before(htmlString);
        $("#skipButton").click(function () {
            $(styleElement).remove();
            $('.AtBetter_modal').remove();
            resolve(true);
        });
        $("#cancelButton").click(function () {
            $(styleElement).remove();
            $('.AtBetter_modal').remove();
            resolve(false);
        });
    });
}

// latex替换
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

// latex还原
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

        regex = new RegExp(latexMatch + `【\\s*${i + 1}(?![】\\d])|(?<![【\\d])${i + 1}\\s*】|(?<!\\\\)\\[\\s*${i + 1}(?![\\]\\d])|(?<![\\[\\d])${i + 1}\\s*\\]|{\\s*${i + 1}(?![}\\d])|(?<![{\\d])${i + 1}\\s*}`, 'g');
        translatedText = translatedText.replace(regex, function (match, ...args) {
            // LaTeX中的不替换
            const groups = args[args.length - 1]; 
            if (groups.latex_block || groups.latex_inline) return match;
            // 没有空格则加一个
            const offset = args[args.length - 3]; // offset是replace方法的倒数第三个参数
            let leftSpace = "", rightSpace = "";
            if (!/\s/.test(translatedText[offset - 1])) leftSpace = " ";
            if (!/\s/.test(translatedText[offset + match.length])) rightSpace = " ";
            return leftSpace + replacement + rightSpace;
        });
    }
    return translatedText;
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
        let regex = /\$\$(\\.|[^\$])*?\$\$|\$(\\.|[^\$])*?\$/g;
        matches = matches.concat(text.match(regex));
        text = replaceBlock(text, matches, replacements);
    }
    // 字符数上限
    const translationLimits = {
        deepl: 5000,
        iflyrec: 2000,
        youdao: 600,
        google: 5000,
        caiyun: 5000
    };
    if (translationLimits.hasOwnProperty(translation) && text.length > translationLimits[translation]) {
        const shouldContinue = await showWordsExceededDialog(button, translationLimits[translation], text.length);
        if (!shouldContinue) {
            status = 1;
            return {
                translateDiv: translateDiv,
                status: status
            };
        }
    }
    // 翻译
    async function translate(translation) {
        try {
            if (translation == "deepl") {
                translateDiv.innerHTML = "正在使用 deepl 翻译中……请稍等";
                translatedText = await translate_deepl(text);
            } else if (translation == "iflyrec") {
                translateDiv.innerHTML = "正在使用 讯飞听见 翻译中……请稍等";
                translatedText = await translate_iflyrec(text);
            } else if (translation == "youdao") {
                translateDiv.innerHTML = "正在使用 有道 翻译中……请稍等";
                translatedText = await translate_youdao_mobile(text);
            } else if (translation == "google") {
                translateDiv.innerHTML = "正在使用 google 翻译中……请稍等";
                translatedText = await translate_gg(text);
            } else if (translation == "caiyun") {
                translateDiv.innerHTML = "正在使用 彩云小译 翻译中……请稍等";
                await translate_caiyun_startup();
                translatedText = await translate_caiyun(text);
            } else if (translation == "openai") {
                translateDiv.innerHTML = "正在使用 ChatGPT 翻译中……" +
                    "<br><br>应用的配置：" + opneaiConfig.configurations[opneaiConfig.choice].note +
                    "<br><br>使用 ChatGPT 翻译需要很长的时间，请耐心等待";
                translatedText = await translate_openai(text);

            }
            if (/^翻译出错/.test(translatedText)) status = 2;
        } catch (error) {
            status = 2;
            translatedText = error;
        }
    }
    await translate(translation);

    // 还原latex公式
    translatedText = translatedText.replace(/】\s*【/g, '】 【');
    translatedText = translatedText.replace(/\]\s*\[/g, '] [');
    translatedText = translatedText.replace(/\}\s*\{/g, '} {');
    if (translation != "openai") {
        translatedText = recoverBlock(translatedText, matches, replacements);
    }

    // 结果复制按钮
    // 创建一个隐藏的元素来保存 translatedText 的值
    var textElement = document.createElement("div");
    textElement.style.display = "none";
    textElement.textContent = translatedText;
    translateDiv.parentNode.insertBefore(textElement, translateDiv);

    // panel
    var panelDiv = document.createElement("div");
    $(panelDiv).addClass("translate-problem-statement-panel");
    // 收起按钮
    var closeButton = document.createElement("div");
    closeButton.innerHTML = putawayIcon;
    $(closeButton).addClass("borderlessButton");
    $(panelDiv).append(closeButton);
    // 复制按钮
    var copyButton = document.createElement("div");
    copyButton.innerHTML = copyIcon;
    $(copyButton).addClass("borderlessButton");
    $(panelDiv).append(copyButton);

    var buttonState = "expand";
    closeButton.addEventListener("click", function () {
        if (buttonState === "expand") {
            this.innerHTML = unfoldIcon;
            $(translateDiv).css({
                display: "none",
                transition: "height 2s"
            });
            buttonState = "collapse";
        } else if (buttonState === "collapse") {
            // 执行收起操作
            this.innerHTML = putawayIcon;
            $(translateDiv).css({
                display: "",
                transition: "height 2s"
            });
            buttonState = "expand";
        }
    });

    copyButton.addEventListener("click", function () {
        var translatedText = textElement.textContent;
        GM_setClipboard(translatedText);
        // $(this).addClass("copied").text("Copied");
        // // 更新复制按钮文本
        // setTimeout(() => {
        //     $(this).removeClass("copied");
        //     $(this).text("Copy");
        // }, 2000);
    });
    translateDiv.parentNode.insertBefore(panelDiv, translateDiv);

    // 转义LaTex中的特殊符号
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
        var escapedText = matchedText;
        for (const rule of escapeRules) {
            escapedText = escapedText.replaceAll(rule.pattern, rule.replacement);
        }
        escapedText = escapedText.replace(/\$\$/g, "$$$$$$$$");// $$符号（因为后面需要作为replacement）
        translatedText = translatedText.replace(matchedText, escapedText);
    }

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
        panelDiv: panelDiv
    };

}

// ChatGPT
async function translate_openai(raw) {
    var openai_retext = "";
    var data = {
        model: (openai_model !== null && openai_model !== "") ? openai_model : 'gpt-3.5-turbo',
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
            onerror: function (response) {
                reject("发生了未知的错误，请确认你是否能正常访问Google翻译，\n\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/471106/feedback 反馈 请注意打码报错信息的敏感部分\n\n响应报文：" + JSON.stringify(response))
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
    return await PromiseRetryWrap(toDo, { RetryTimes: 3, ErrProcesser: () => "翻译出错，请查看报错信息，并重试或更换翻译接口\n\n如果无法解决，请前往 https://greasyfork.org/zh-CN/scripts/471106/feedback 反馈 请注意打码报错信息的敏感部分\n\n报错信息：" + errtext })
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
            init();
            settingPanel();
            checkScriptVersion();
            toZH_CN();
            var newElement = $("<div></div>").addClass("alert alert-info AtBetter_alert")
                .html(`AtCoder Better! —— 正在等待页面资源加载……`)
            var tip_SegmentedTranslation = $("<div></div>").addClass("alert alert-danger AtBetter_alert")
                .html(`AtCoder Better! —— 注意！分段翻译已开启，这会造成负面效果，
                <p>除非你现在需要翻译超长篇的博客或者题目，否则请前往设置关闭分段翻译</p>`)

            async function processPage() {
                if (enableSegmentedTranslation) $("#main-container").prepend(tip_SegmentedTranslation); //显示分段翻译警告
                if (showJumpToLuogu && is_problem) At2luogu();

                Promise.resolve()
                    .then(() => {
                        if (showLoading) newElement.html('AtCoder Better! —— 正在加载按钮……');
                        return delay(100).then(() => addConversionButton());
                    })
                    .then(() => {
                        if (showLoading) {
                            newElement.html('AtCoder Better! —— 加载已完成');
                            newElement.removeClass('alert-info').addClass('alert-success');
                            setTimeout(function () {
                                newElement.remove();
                            }, 3000);
                        }
                    })
                    .catch((error) => {
                        console.warn(error);
                    });
            }

            function delay(ms) {
                return new Promise((resolve) => setTimeout(resolve, ms));
            }

            if (showLoading) $("#main-container").prepend(newElement);

            if (loaded) {
                processPage();
            } else {
                // 页面完全加载完成后执行
                window.onload = function () {
                    processPage();
                };
            }
        }
    }
    checkJQuery(50);
});

// 配置自动迁移代码（将在10个小版本后移除-1.19）
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
