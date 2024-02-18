// ==UserScript==
// @name         Codeforces Better!
// @namespace    https://greasyfork.org/users/747162
// @version      1.72.45
// @description  Codeforces界面汉化、黑暗模式支持、题目翻译、markdown视图、一键复制题目、跳转到洛谷、评论区分页、ClistRating分显示、榜单重新着色、题目页代码编辑器、快捷提交，在线测试运行，自定义样例测试、LSP服务，编辑器自定义代码补全
// @author       北极小狐
// @match        *://*.codeforces.com/*
// @match        *://*.codeforc.es/*
// @run-at       document-start
// @connect      www2.deepl.com
// @connect      api-free.deepl.com
// @connect      api.deepl.com
// @connect      api.deeplx.org
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
// @connect      aowuucdn.oss-cn-beijing.aliyuncs.com
// @connect      aowuucdn.oss-accelerate.aliyuncs.com
// @connect      127.0.0.1
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_getResourceText
// @icon         https://aowuucdn.oss-accelerate.aliyuncs.com/codeforces.png
// @require      https://cdn.staticfile.org/turndown/7.1.2/turndown.min.js
// @require      https://cdn.staticfile.org/markdown-it/13.0.1/markdown-it.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// @require      https://cdn.staticfile.org/chroma-js/2.4.2/chroma.min.js
// @require      https://cdn.staticfile.org/xterm/3.9.2/xterm.min.js
// @require      https://cdn.staticfile.org/dexie/3.2.4/dexie.min.js
// @require      https://cdn.staticfile.org/i18next/23.5.1/i18next.min.js
// @require      https://cdn.staticfile.org/i18next-http-backend/2.2.2/i18nextHttpBackend.min.js
// @require      https://cdn.staticfile.org/jquery-i18next/1.2.1/jquery-i18next.min.js
// @require      https://aowuucdn.oss-cn-beijing.aliyuncs.com/js/i18nextChainedBackend.min.js
// @require      https://aowuucdn.oss-cn-beijing.aliyuncs.com/js/i18nextLocalStorageBackend.min.js
// @resource     acwing_cpp_code_completer https://aowuucdn.oss-accelerate.aliyuncs.com/acwing_cpp_code_completer-0.0.11.json
// @resource     wandboxlist https://wandbox.org/api/list.json
// @resource     xtermcss https://cdn.staticfile.org/xterm/3.9.2/xterm.min.css
// @license      GPL3
// @compatible	 Chrome
// @compatible	 Firefox
// @compatible	 Edge
// @incompatible safari
// @supportURL   https://github.com/beijixiaohu/OJBetter/issues
// ==/UserScript==

/**
 * @namespace OJBetter
 * @desc 主命名空间
 */
const OJBetter = {};

/**
 * @namespace state
 * @desc 描述脚本的当前状态。
 * @memberof OJBetter
 */
OJBetter.state = {
    /** @type {string} 脚本名*/
    name: GM_info.script.name,
    /** @type {string} 版本号*/
    version: GM_info.script.version,
    /** @type {boolean?} 是否跳过页面加载等待 */
    notWaiteLoaded: undefined,
    /** @type {string} 最后公告版本，用于标识版本更新完成提示 */
    lastAnnounceVer: undefined,
    /** @type {string} 最后读取的有效公告版本 */
    lastReadAnnounceVer: undefined,
    /** @type {number} 当前已打开的模态对话框数量*/
    openDialogCount: 0
};

/**
 * @namespace common
 * @desc 通用设置和属性。
 * @memberof OJBetter
 */
OJBetter.common = {
    /** @type {string} 网站的主机地址 */
    hostAddress: location.origin,
    /** @type {string?} Codeforces的CSRF令牌 */
    cf_csrf_token: undefined,
    /** @type {Array?} 任务队列 */
    taskQueue: undefined,
    /** @type {object} CFBetter数据库连接实例*/
    database: undefined
};

/**
 * @namespace basic
 * @desc 基本的用户界面设置。
 * @memberof OJBetter
 */
OJBetter.basic = {
    /** @type {string} 黑暗模式设置 */
    darkMode: undefined,
    /** @type {boolean?} 是否展开折叠块 */
    expandFoldingblocks: undefined,
    /** @type {boolean?} 是否开启折叠块渲染性能优化 */
    renderPerfOpt: undefined,
    /** @type {boolean?} 评论区分页 */
    commentPaging: undefined,
    /** @type {boolean?} 显示跳转到Luogu按钮 */
    showJumpToLuogu: undefined,
    /** @type {boolean?} 比赛排行榜重新着色 */
    standingsRecolor: undefined
};

/**
 * @namespace typeOfPage
 * @desc 页面类型判断。
 * @memberof OJBetter
 */
OJBetter.typeOfPage = {
    /** @type {boolean?} 是否是轻量站 */
    is_mSite: undefined,
    /** @type {boolean?} 是否是acmsguru页面 */
    is_acmsguru: undefined,
    /** @type {boolean?} 是否是旧版LaTeX页面 */
    is_oldLatex: undefined,
    /** @type {boolean?} 是否是比赛页面 */
    is_contest: undefined,
    /** @type {boolean?} 是否是题目页面 */
    is_problem: undefined,
    /** @type {boolean?} 是否是完整的问题集页面 */
    is_completeProblemset: undefined,
    /** @type {boolean?} 是否是问题集中的问题页面 */
    is_problemset_problem: undefined,
    /** @type {boolean?} 是否是问题集页面 */
    is_problemset: undefined,
    /** @type {boolean?} 是否是Codeforces排名页面 */
    is_cfStandings: undefined,
    /** @type {boolean?} 是否是提交页面 */
    is_submitPage: undefined
};

/**
 * @namespace localization
 * @desc 本地化设置。
 * @memberof OJBetter
 */
OJBetter.localization = {
    /** @type {string?} 网站语言 */
    websiteLang: undefined,
    /** @type {string?} 脚本语言 */
    scriptLang: undefined
};

/**
 * @namespace translation
 * @desc 翻译设置。
 * @memberof OJBetter
 */
OJBetter.translation = {
    /** @type {string?} 翻译服务选择 */
    choice: undefined,
    /** @type {string?} 目标语言 */
    targetLang: undefined,
    comment: {
        /** @type {string?} 评论翻译服务选择 */
        choice: undefined,
        /** @type {string?} 评论翻译模式 */
        transMode: undefined
    },
    auto: {
        /** @type {boolean?} 自动翻译开关 */
        enabled: undefined,
        /** @type {number?} 短文本长度限制 */
        shortTextLength: undefined,
        mixTrans: {
            /** @type {boolean?} 混合翻译开关 */
            enabled: undefined,
            /** @type {Array?} 混合翻译服务列表 */
            servers: undefined
        }
    },
    memory: {
        /** @type {boolean?} 翻译记忆开关 */
        enabled: undefined,
        /** @type {Object?} 翻译记忆树 */
        ttTree: undefined
    },
    /** @type {string?} 重翻译时的行为 */
    retransAction: undefined,
    /** @type {number?} 等待时间 */
    waitTime: undefined,
    /** @type {boolean?} 替换符 */
    replaceSymbol: undefined,
    /** @type {boolean?} 过滤文本中的*号 */
    filterTextWithoutEmphasis: undefined
};

/**
 * @namespace clist
 * @desc Clist相关设置。
 * @memberof OJBetter
 */
OJBetter.clist = {
    enabled: {
        /** @type {boolean?} 比赛页面开关 */
        contest: undefined,
        /** @type {boolean?} 问题页面开关 */
        problem: undefined,
        /** @type {boolean?} 问题集页面开关 */
        problemset: undefined
    },
    /** @type {boolean?} Rating数据防剧透 */
    ratingHidden: undefined,
    /** @type {string?} Clist key */
    authorization: undefined
};

/**
 * @namespace monaco
 * @desc Monaco编辑器配置。
 * @memberof OJBetter
 */
OJBetter.monaco = {
    /** @type {boolean?} 在问题页面上启用Monaco编辑器 */
    enableOnProblemPage: undefined,
    /** @type {boolean} Monaco编辑器加载完成标志 */
    loaderOnload: false,
    lsp: {
        /** @type {Array?} LSP套接字数组 */
        socket: [],
        /** @type {boolean?} 是否启用LSP */
        enabled: undefined,
        /** @type {string?} 工作路径 */
        workUri: undefined,
        /** @type {string?} 套接字URL */
        socketUrl: undefined
    },
    complet: {
        /** @type {boolean?} 是否启用C++代码补全模板 */
        cppCodeTemplate: undefined,
        /** @type {Object?} 自定义配置 */
        customConfig: undefined
    },
    /** @type {Object?} Monaco编辑器实例 */
    editor: null,
    /** @type {string?} 在线编译器选择 */
    onlineCompilerChoice: undefined,
    /** @type {string?} 编译器选择 */
    compilerSelection: undefined,
    setting: {
        /** @type {Array?} 语言设置数组 */
        language: [],
        /** @type {string?} 位置 */
        position: undefined,
        /** @type {boolean} 位置初始化标志 */
        position_initialized: false,
        /** @type {number?} 字体大小 */
        fontsize: undefined,
        /** @type {boolean?} 鼠标滚动锁定 */
        alwaysConsumeMouseWheel: undefined,
        /** @type {boolean?} 提交代码二次确认 */
        isCodeSubmitDoubleConfirm: undefined,
        /** @type {string?} 提交按钮位置 */
        submitButtonPosition: undefined
    }
};

/**
 * @namespace deepl
 * @desc DeepL翻译服务配置。
 * @memberof OJBetter
 */
OJBetter.deepl = {
    /** @type {Object?} DeepL配置对象 */
    configs: undefined,
    config: {
        /** @type {string?} 类型 */
        type: undefined,
        /** @type {string?} 名称 */
        name: undefined,
        /** @type {string?} API类型 */
        apiGenre: undefined,
        /** @type {string?} API密钥 */
        key: undefined,
        /** @type {string?} 代理 */
        proxy: undefined,
        /** @type {Object?} 额外请求头 */
        header: undefined,
        /** @type {Object?} 额外请求数据 */
        data: undefined,
        quota: {
            /** @type {string?} 余额URL */
            url: undefined,
            /** @type {string?} 余额请求方法 */
            method: undefined,
            /** @type {Object?} 余额请求头 */
            header: undefined,
            /** @type {Object?} 余额请求数据 */
            data: undefined,
            /** @type {number?} 剩余配额 */
            surplus: undefined
        }
    },
    /** @type {boolean?} 启用重点保护 */
    enableEmphasisProtection: undefined,
    /** @type {boolean?} 启用链接保护 */
    enableLinkProtection: undefined
};

/**
 * @namespace chatgpt
 * @desc ChatGPT服务配置。
 * @memberof OJBetter
 */
OJBetter.chatgpt = {
    /** @type {Object?} ChatGPT配置对象 */
    configs: undefined,
    config: {
        /** @type {string?} 名称 */
        name: undefined,
        /** @type {string?} 模型 */
        model: undefined,
        /** @type {string?} API密钥 */
        key: undefined,
        /** @type {string?} 代理 */
        proxy: undefined,
        /** @type {Object?} 额外请求头 */
        header: undefined,
        /** @type {Object?} 额外请求数据 */
        data: undefined,
        quota: {
            /** @type {string?} 余额URL */
            url: undefined,
            /** @type {string?} 余额请求方法 */
            method: undefined,
            /** @type {Object?} 余额请求头 */
            header: undefined,
            /** @type {Object?} 余额请求数据 */
            data: undefined,
            /** @type {number?} 剩余配额 */
            surplus: undefined
        }
    },
    /** @type {boolean?} 是否为流式传输 */
    isStream: undefined
};

/**
 * @namespace preference
 * @desc 偏好设置
 * @memberof OJBetter
 */
OJBetter.preference = {
    /** @type {boolean?} 是否显示加载动画 */
    showLoading: undefined,
    /** @type {boolean?} 是否显示悬停目标区域 */
    hoverTargetAreaDisplay: undefined,
    /** @type {string?} 按钮图标大小 */
    iconButtonSize: undefined,
};

/**
 * @namespace about
 * @desc 关于页信息
 * @memberof OJBetter
 */
OJBetter.about = {
    /** @type {string?} 更新通道 */
    updateChannel: undefined,
    /** @type {string?} 更新源 */
    updateSource: undefined
};

/**
 * @namespace supportList
 * @desc 支持列表
 * @memberof OJBetter
 */
OJBetter.supportList = {
    /** @type {object} 翻译支持列表和对应语言代码*/
    translationSupport: {
        'deepl': { 'zh': 'ZH', 'de': 'DE', 'fr': 'FR', 'ko': 'KO', 'pt': 'PT', 'ja': 'JA', 'es': 'ES', 'it': 'IT' },
        'iflyrec': { 'zh': '1' },
        'youdao': { 'zh': 'AUTO' },
        'google': { 'zh': 'zh-CN', 'zh-Hant': 'zh-TW', 'de': 'de', 'fr': 'fr', 'ko': 'ko', 'pt': 'pt', 'ja': 'ja', 'es': 'es', 'it': 'it', 'hi': 'hi' },
        'caiyun': { 'zh': 'auto2zh', 'ja': 'auto2ja', 'ko': 'auto2ko', 'es': 'auto2es', 'fr': 'auto2fr' },
        'openai': { 'zh': '中文', 'zh-Hant': '繁體中文', 'de': 'Deutsch', 'fr': 'Français', 'ko': '한국어', 'pt': 'Português', 'ja': '日本語', 'es': 'Español', 'it': 'Italiano', 'hi': 'हिन्दी' }
    },
    /** @type {object} 更新源支持列表*/
    updateSourceSupportList: {
        'greasyfork': {
            'release': true,
            'dev': false
        },
        'github': {
            'release': true,
            'dev': true
        },
        'aliyunoss': {
            'release': true,
            'dev': true
        }
    }
}

// ------------------------------
// 一些工具函数
// ------------------------------

/**
 * 将数字或者字符串解析为数字。
 * @memberof OJBetter.common
 * @param {string} val 要解析的字符串
 * @param {boolean} [strict=false] 是否进行严格类型检查
 * @returns {number} 解析结果
 * @throws {Error} 如果解析失败，则抛出错误
 */
const OJB_parseNumber = (val, strict = false) => {
    const num = Number(val);
    if (isNaN(num) || (strict && val.toString() !== num.toString())) {
        throw new Error('Invalid number');
    }
    return num;
};

/**
 * 将字符串解析为布尔值
 * @param {string} val - 要解析的字符串
 * @param {boolean} strict - 是否进行严格类型检查
 * @returns {boolean} - 解析结果
 * @throws {Error} - 如果解析失败，则抛出错误
 */
const OJB_parseBoolean = (val, strict) => {
    if (strict) {
        if (val === true || val === false) return val;
        throw new Error('Invalid boolean');
    }
    return val === 'true' ? true : val === 'false' ? false : val;
};

/**
 * 将字符串解析为对象
 * @param {string} val - 要解析的字符串
 * @returns {Object} - 解析结果
 * @throws {Error} - 如果解析失败，则抛出错误
 */
const OJB_parseObject = val => {
    try {
        return JSON.parse(val);
    } catch {
        throw new Error('Invalid JSON');
    }
};

/**
 * 将字符串解析为键值对数组
 * @param {string} val - 要解析的字符串
 * @returns {Object[]} - 解析结果
 * @throws {Error} - 如果解析失败，则抛出错误
 */
const OJB_parseLinePairArray = val => {
    if (typeof val !== 'string' || val.trim() === '') return [];
    return val.split("\n").filter(line => line.trim() !== '').map(line => {
        const indexOfFirstColon = line.indexOf(":");
        if (indexOfFirstColon === -1) throw new Error('Invalid LinePairArray format: ":" is missing');
        const key = line.substring(0, indexOfFirstColon).trim();
        const value = line.substring(indexOfFirstColon + 1).trim();
        return { [key]: value };
    });
};

/**
 * 获取对象中指定路径表达式的值
 * @param {Object} obj - 要计算的对象
 * @param {string} pathOrExpression - 要计算的路径表达式
 * @returns {any} - 计算结果
 * @example
 * const obj = {
 *   "a": {
 *     "b": 1
 *   },
 *   "c": 2
 * };
 * evaluatePathOrExpression(obj, "a.b"); // 1
 * evaluatePathOrExpression(obj, "a.b + c"); // 3
 * evaluatePathOrExpression(obj, "a.b + a.c"); // 1 
 */
function OJB_evaluatePathOrExpression(obj, pathOrExpression) {
    const hasOperator = /[\+\-\*\/]/.test(pathOrExpression);
    const getPathValue = (obj, path) => {
        return path.split('.').reduce((acc, part) => {
            return acc !== undefined && acc !== null && acc.hasOwnProperty(part) ? acc[part] : undefined;
        }, obj);
    };
    const evaluateExpression = (obj, expression) => {
        const tokens = expression.split(/([\+\-\*\/])/).map(token => token.trim());
        const values = tokens.map(token => {
            if (/[\+\-\*\/]/.test(token)) {
                return token;
            } else {
                const value = getPathValue(obj, token);
                return value !== undefined ? value : 0;
            }
        });
        const evaluatedExpression = values.join(' ');
        try {
            return Function(`'use strict'; return (${evaluatedExpression});`)();
        } catch (e) {
            console.error('Expression evaluation error:', e);
            return undefined;
        }
    };
    return hasOperator ? evaluateExpression(obj, pathOrExpression) : getPathValue(obj, pathOrExpression);
}

/**
 * 获取 GM 存储的值并根据类型进行处理
 * @param {string} key - 要检索的值的键。
 * @param {any} defaultValue - 如果值未找到，则返回的默认值。
 * @param {Object} [options={}] - 配置选项对象。
 * @param {string} [options.type='string'] - 期望的值的类型。可选值：'string', 'number', 'boolean', 'object', 'array', 'linePairArray'。
 * @param {boolean} [options.strict=false] - 用于数字和布尔类型，表示是否进行严格类型检查。
 * @param {string} [options.pathOrExpression=''] - 用于对象或数组类型，表示路径表达式或获取元素的索引。
 * @returns {any} - 检索到的值。
 */
const OJB_getGMValue = (key, defaultValue, { type = 'string', strict = false, pathOrExpression = '' } = {}) => {
    let value = GM_getValue(key);
    if (value === undefined || value === null || value === "") {
        GM_setValue?.(key, defaultValue);
        return defaultValue;
    }

    const parsers = {
        string: val => val,
        number: (val) => OJB_parseNumber(val, strict),
        boolean: (val) => OJB_parseBoolean(val, strict),
        object: OJB_parseObject,
        array: OJB_parseObject,
        linePairArray: OJB_parseLinePairArray
    };

    if (!(type in parsers)) {
        console.error(`Unsupported type: ${type}`);
        return defaultValue;
    }

    try {
        value = parsers[type](value);
    } catch (e) {
        console.error('Error:', e.message);
        return defaultValue;
    }

    // The pathOrExpression processing is not applicable to linePairArray type
    if ((type === 'object' || type === 'array') && pathOrExpression) {
        const evaluated = OJB_evaluatePathOrExpression(value, pathOrExpression);
        if (evaluated === undefined) {
            console.error('Path or expression evaluation returned undefined');
            return defaultValue;
        }
        value = evaluated;
    }

    return value;
};

/**
 * 版本号比较方法
 * @param {string} version1 版本号1
 * @param {string} version2 版本号2
 * @returns {number} -1: version1 < version2, 0: version1 = version2, 1: version1 > version2
 */
const OJB_compareVersions = function (version1 = "0", version2 = "0") {
    const v1Array = version1.split(".").map(Number);
    const v2Array = version2.split(".").map(Number);
    const length = Math.max(v1Array.length, v2Array.length);
    for (let i = 0; i < length; i++) {
        const diff = (v1Array[i] || 0) - (v2Array[i] || 0);
        if (diff) return Math.sign(diff);
    }
    return 0;
}

/**
 * 初始化全局变量
 */
async function initVar() {
    const { hostname, href } = window.location;
    OJBetter.state.lastAnnounceVer = OJB_getGMValue("lastAnnounceVer", "0");
    OJBetter.state.lastReadAnnounceVer = OJB_getGMValue("lastReadAnnounceVer", "0");
    OJBetter.typeOfPage.is_mSite = /^m[0-9]/.test(hostname);
    OJBetter.typeOfPage.is_oldLatex = $('.tex-span').length;
    OJBetter.typeOfPage.is_acmsguru = href.includes("acmsguru") && href.includes('/problem/');
    OJBetter.typeOfPage.is_contest = /\/contest\/[\d\/\s]+$/.test(href) && !href.includes('/problem/');
    OJBetter.typeOfPage.is_problem = href.includes('/problem/');
    OJBetter.typeOfPage.is_completeProblemset = /problems\/?$/.test(href);
    OJBetter.typeOfPage.is_problemset_problem = href.includes('/problemset/') && href.includes('/problem/');
    OJBetter.typeOfPage.is_problemset = href.includes('/problemset') && !href.includes('/problem/');
    OJBetter.typeOfPage.is_submitPage = href.includes('/submit');
    OJBetter.typeOfPage.is_cfStandings = href.includes('/standings') &&
        $('.standings tr:first th:nth-child(n+5)')
            .map(function () {
                return $(this).find('span').text();
            })
            .get()
            .every(score => /^[0-9]+$/.test(score));
    OJBetter.localization.websiteLang = OJB_getGMValue("localizationLanguage", "zh");
    OJBetter.localization.scriptLang = OJB_getGMValue("scriptL10nLanguage", "zh");
    OJBetter.basic.renderPerfOpt = OJB_getGMValue("renderPerfOpt", false);
    OJBetter.basic.commentPaging = OJB_getGMValue("commentPaging", true);
    OJBetter.basic.showJumpToLuogu = OJB_getGMValue("showJumpToLuogu", true);
    OJBetter.basic.standingsRecolor = OJB_getGMValue("standingsRecolor", true);
    OJBetter.state.notWaiteLoaded = OJB_getGMValue("notWaiteLoaded", false);
    OJBetter.translation.targetLang = OJB_getGMValue("transTargetLang", "zh");
    OJBetter.translation.choice = OJB_getGMValue("translation", "deepl");
    OJBetter.translation.comment.transMode = OJB_getGMValue("commentTranslationMode", "0");
    OJBetter.translation.comment.choice = OJB_getGMValue("commentTranslationChoice", "0");
    OJBetter.translation.memory.enabled = OJB_getGMValue("memoryTranslateHistory", true);
    OJBetter.translation.auto.enabled = OJB_getGMValue("autoTranslation", false);
    OJBetter.translation.auto.shortTextLength = OJB_getGMValue("shortTextLength", "2000");
    OJBetter.translation.retransAction = OJB_getGMValue("retransAction", "0");
    OJBetter.translation.waitTime = OJB_getGMValue("transWaitTime", "200");
    OJBetter.translation.auto.mixTrans.enabled = OJB_getGMValue("allowMixTrans", true);
    OJBetter.translation.auto.mixTrans.servers = OJB_getGMValue("mixedTranslation", ['deepl', 'iflyrec', 'youdao', 'caiyun']);
    OJBetter.common.taskQueue = new TaskQueue();
    OJBetter.translation.replaceSymbol = OJB_getGMValue("replaceSymbol", "2");
    OJBetter.translation.filterTextWithoutEmphasis = OJB_getGMValue("filterTextWithoutEmphasis", false);
    OJBetter.clist.enabled.contest = OJB_getGMValue("showClistRating_contest", false);
    OJBetter.clist.enabled.problem = OJB_getGMValue("showClistRating_problem", false);
    OJBetter.clist.enabled.problemset = OJB_getGMValue("showClistRating_problemset", false);
    OJBetter.clist.ratingHidden = OJB_getGMValue("RatingHidden", false);
    OJBetter.clist.authorization = OJB_getGMValue("clist_Authorization", "");
    //deepl
    OJBetter.deepl.config.type = OJB_getGMValue("deepl_type", "free");
    OJBetter.deepl.configs = OJB_getGMValue("deepl_config", {
        "choice": "",
        "configurations": []
    });
    if (OJBetter.deepl.configs.choice !== "" && OJBetter.deepl.configs.configurations.length !== 0) {
        const choice = OJBetter.deepl.configs.choice;
        const configuration = OJBetter.deepl.configs.configurations.find(obj => obj.name === choice);;
        if (configuration == undefined) {
            let existingConfig = GM_getValue('deepl_config');
            existingConfig.choice = "";
            GM_setValue('deepl_config', existingConfig);
            location.reload();
        }
        OJBetter.deepl.config.name = configuration.name;
        OJBetter.deepl.config.apiGenre = configuration.apiGenre;
        OJBetter.deepl.config.key = configuration.key;
        OJBetter.deepl.config.proxy = configuration.proxy;
        OJBetter.deepl.config.header = OJB_parseLinePairArray(configuration._header);
        OJBetter.deepl.config.data = OJB_parseLinePairArray(configuration._data);
        OJBetter.deepl.config.quota.url = configuration.quota_url;
        OJBetter.deepl.config.quota.method = configuration.quota_method;
        OJBetter.deepl.config.quota.header = OJB_parseLinePairArray(configuration.quota_header);
        OJBetter.deepl.config.quota.data = OJB_parseLinePairArray(configuration.quota_data);
        OJBetter.deepl.config.quota.surplus = configuration.quota_surplus;
    }
    OJBetter.deepl.enableEmphasisProtection = OJB_getGMValue("enableEmphasisProtection", true);
    OJBetter.deepl.enableLinkProtection = OJB_getGMValue("enableLinkProtection", true);
    //openai
    OJBetter.chatgpt.isStream = OJB_getGMValue("openai_isStream", true);
    OJBetter.chatgpt.configs = OJB_getGMValue("chatgpt_config", {
        "choice": "",
        "configurations": []
    });
    if (OJBetter.chatgpt.configs.choice !== "" && OJBetter.chatgpt.configs.configurations.length !== 0) {
        const choice = OJBetter.chatgpt.configs.choice;
        const configuration = OJBetter.chatgpt.configs.configurations.find(obj => obj.name === choice);;
        if (configuration == undefined) {
            let existingConfig = GM_getValue('chatgpt_config');
            existingConfig.choice = "";
            GM_setValue('chatgpt_config', existingConfig);
            location.reload();
        }
        OJBetter.chatgpt.config.name = configuration.name;
        OJBetter.chatgpt.config.model = configuration.model;
        OJBetter.chatgpt.config.key = configuration.key;
        OJBetter.chatgpt.config.proxy = configuration.proxy;
        OJBetter.chatgpt.config.header = OJB_parseLinePairArray(configuration._header);
        OJBetter.chatgpt.config.data = OJB_parseLinePairArray(configuration._data);
        OJBetter.chatgpt.config.quota.url = configuration.quota_url;
        OJBetter.chatgpt.config.quota.method = configuration.quota_method;
        OJBetter.chatgpt.config.quota.header = OJB_parseLinePairArray(configuration.quota_header);
        OJBetter.chatgpt.config.quota.data = OJB_parseLinePairArray(configuration.quota_data);
        OJBetter.chatgpt.config.quota.surplus = configuration.quota_surplus;
    }
    // 编辑器
    if (!OJBetter.typeOfPage.is_mSite) OJBetter.common.cf_csrf_token = Codeforces.getCsrfToken();
    else OJBetter.common.cf_csrf_token = "";
    OJBetter.monaco.compilerSelection = OJB_getGMValue("compilerSelection", "61");
    OJBetter.monaco.setting.fontsize = OJB_getGMValue("editorFontSize", "15");
    OJBetter.monaco.enableOnProblemPage = OJB_getGMValue("problemPageCodeEditor", true);
    OJBetter.monaco.complet.cppCodeTemplate = OJB_getGMValue("cppCodeTemplateComplete", true);
    OJBetter.monaco.onlineCompilerChoice = OJB_getGMValue("onlineCompilerChoice", "official");
    OJBetter.monaco.setting.isCodeSubmitDoubleConfirm = OJB_getGMValue("isCodeSubmitConfirm", true);
    OJBetter.monaco.setting.alwaysConsumeMouseWheel = OJB_getGMValue("alwaysConsumeMouseWheel", true);
    OJBetter.monaco.setting.submitButtonPosition = OJB_getGMValue("submitButtonPosition", "bottom");
    //自定义补全
    OJBetter.monaco.complet.customConfig = OJB_getGMValue("Complet_config", {
        "choice": -1,
        "configurations": []
    });
    /**
    * 加载monaco编辑器资源
    */
    OJBetter.monaco.lsp.enabled = OJB_getGMValue("useLSP", false);
    OJBetter.monaco.setting.position = OJB_getGMValue("monacoEditor_position", "initial");
    OJBetter.monaco.lsp.workUri = OJB_getGMValue("OJBetter_Bridge_WorkUri", "C:/OJBetter_Bridge");
    OJBetter.monaco.lsp.socketUrl = OJB_getGMValue("OJBetter_Bridge_SocketUrl", "ws://127.0.0.1:2323/");
    if (OJBetter.monaco.enableOnProblemPage) {
        let monacoLoader = document.createElement("script");
        monacoLoader.src = "https://cdn.staticfile.org/monaco-editor/0.44.0/min/vs/loader.min.js";
        document.head.prepend(monacoLoader);
        monacoLoader.onload = () => {
            require.config({
                paths: { vs: "https://cdn.staticfile.org/monaco-editor/0.44.0/min/vs" },
                "vs/nls": { availableLanguages: { "*": "zh-cn" } },
            });
            require(["vs/editor/editor.main"], () => {
                OJBetter.monaco.loaderOnload = true;
            });
        }
    }
    OJBetter.preference.showLoading = OJB_getGMValue("showLoading", true);
    OJBetter.preference.hoverTargetAreaDisplay = OJB_getGMValue("hoverTargetAreaDisplay", false);
    OJBetter.basic.expandFoldingblocks = OJB_getGMValue("expandFoldingblocks", true);
    OJBetter.preference.iconButtonSize = OJB_getGMValue("iconButtonSize", "16");
    OJBetter.about.updateChannel = OJB_getGMValue("updateChannel", "release");
    OJBetter.about.updateSource = OJB_getGMValue("updateSource", "greasyfork");
}

/**
 * 公告
 */
async function showAnnounce() {
    /** @type {string} 最新公告版本*/
    const lastAnnounceVer = i18next.t('lastVersion', { ns: 'announce' });
    if (OJB_compareVersions(OJBetter.state.version, OJBetter.state.lastAnnounceVer) === 1) {
        const title = `🎉${i18next.t('announce.title', { ns: 'dialog' })} ${OJBetter.state.version}`;
        /** @type {Boolean} 是否是新的公告 */
        const isNewAnnounceVer = OJB_compareVersions(lastAnnounceVer, OJBetter.state.lastReadAnnounceVer) === 1;
        /** @type {Boolean} 是否展示新的公告(高于当前版本的测试公告不展示) */
        const showNewAnnounceVer = OJB_compareVersions(lastAnnounceVer, OJBetter.state.version) !== 1;
        const content = (() => {
            if (isNewAnnounceVer && showNewAnnounceVer) {
                return i18next.t(`${lastAnnounceVer}`, { ns: 'announce' });
            } else {
                return i18next.t('announce.divContent', { ns: 'dialog' });
            }
        })();
        const ok = await OJB_createDialog(
            title,
            content,
            [
                null,
                i18next.t('announce.buttons.0', { ns: 'dialog' })
            ],
            true
        ); //跳过折叠块确认
        if (ok) {
            if (isNewAnnounceVer && showNewAnnounceVer) {
                GM_setValue('lastReadAnnounceVer', lastAnnounceVer);
            }
            GM_setValue('lastAnnounceVer', OJBetter.state.version);
        }
    }
};

/**
 * 显示警告消息
 */
function showWarnMessage() {
    if (OJBetter.typeOfPage.is_oldLatex) {
        const loadingMessage = new LoadingMessage();
        loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('warning.is_oldLatex', { ns: 'alert' })}`, 'warning');
    }
    if (OJBetter.typeOfPage.is_acmsguru) {
        const loadingMessage = new LoadingMessage();
        loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('warning.is_acmsguru', { ns: 'alert' })}`, 'warning');
    }
    if (OJBetter.translation.comment.transMode == "1") {
        const loadingMessage = new LoadingMessage();
        loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('warning.trans_segment', { ns: 'alert' })}`, 'warning');
    }
    if (OJBetter.translation.comment.transMode == "2") {
        const loadingMessage = new LoadingMessage();
        loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('warning.trans_select', { ns: 'alert' })}`, 'warning');
    }
    if (OJBetter.typeOfPage.is_submitPage && OJBetter.monaco.enableOnProblemPage) {
        const loadingMessage = new LoadingMessage();
        loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('warning.is_submitPage', { ns: 'alert' })}`, 'warning');
    }
}

// 常量
const helpCircleHTML = '<div class="help-icon"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592 0-42.944-14.08-76.736-42.24-101.376-28.16-25.344-65.472-37.312-111.232-37.312zm-12.672 406.208a54.272 54.272 0 0 0-38.72 14.784 49.408 49.408 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.848 54.848 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.968 51.968 0 0 0-15.488-38.016 55.936 55.936 0 0 0-39.424-14.784z"></path></svg></div>';
const closeIcon = `<svg t="1696693011050" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4322" width="14" height="14"><path d="M0 0h1024v1024H0z" fill-opacity="0" p-id="4323"></path><path d="M240.448 168l2.346667 2.154667 289.92 289.941333 279.253333-279.253333a42.666667 42.666667 0 0 1 62.506667 58.026666l-2.133334 2.346667-279.296 279.210667 279.274667 279.253333a42.666667 42.666667 0 0 1-58.005333 62.528l-2.346667-2.176-279.253333-279.253333-289.92 289.962666a42.666667 42.666667 0 0 1-62.506667-58.005333l2.154667-2.346667 289.941333-289.962666-289.92-289.92a42.666667 42.666667 0 0 1 57.984-62.506667z" p-id="4324"></path></svg>`;
const translateIcon = `<svg t="1696837407077" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6325" width="22" height="22"><path d="M536.380952 121.904762a73.142857 73.142857 0 0 1 73.142858 73.142857v219.428571h219.428571a73.142857 73.142857 0 0 1 73.142857 73.142858v341.333333a73.142857 73.142857 0 0 1-73.142857 73.142857H487.619048a73.142857 73.142857 0 0 1-73.142858-73.142857v-219.428571H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142858V195.047619a73.142857 73.142857 0 0 1 73.142857-73.142857h341.333333zM243.809524 682.666667v97.523809h97.523809v73.142857h-97.523809a73.142857 73.142857 0 0 1-73.142857-73.142857v-97.523809h73.142857z m585.142857-195.047619h-219.428571v48.761904a73.142857 73.142857 0 0 1-73.142858 73.142858h-48.761904v219.428571h341.333333V487.619048z m-115.760762 89.526857L787.21219 780.190476h-62.025142l-14.043429-42.715428h-76.068571L620.739048 780.190476h-60.854858l74.605715-203.044571h78.701714z m-38.034286 50.029714h-3.510857l-21.065143 63.488h45.348572l-20.772572-63.488zM536.380952 195.047619H195.047619v341.333333h341.333333V195.047619z 
m-195.072 49.883429l44.78781 1.072762v37.278476h87.698286v145.359238h-87.698286v65.974857h-44.78781v-65.974857h-87.698285v-145.359238h87.698285v-38.351238z m0 83.139047h-44.787809v56.05181h44.787809v-56.05181z m89.307429 0h-44.519619v56.05181h44.519619v-56.05181zM780.190476 170.666667a73.142857 73.142857 0 0 1 73.142857 73.142857v97.523809h-73.142857v-97.523809h-97.523809V170.666667h97.523809z" p-id="6326"></path></svg>`;
const clistIcon = `<svg width="37.7pt" height="10pt" viewBox="0 0 181 48" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="#0057b8ff"><path fill="#0057b8" opacity="1.00" d=" M 17.36 0.00 L 18.59 0.00 C 23.84 6.49 30.28 11.92 36.01 17.98 C 34.01 19.99 32.01 21.99 30.00 23.99 C 26.02 19.97 22.02 15.98 18.02 11.99 C 14.01 15.98 10.01 19.99 6.00 23.99 C 4.16 22.04 2.30 20.05 0.00 18.61 L 0.00 17.37 C 3.44 15.11 6.00 11.84 8.96 9.03 C 11.79 6.05 15.09 3.47 17.36 0.00 Z" /></g><g id="#a0a0a0ff"><path fill="#a0a0a0" opacity="1.00" d=" M 56.76 13.74 C 61.48 4.80 76.07 3.90 81.77 12.27 C 83.09 13.94 83.44 16.10 83.91 18.12 C 81.53 18.23 79.16 18.24 76.78 18.23 C 75.81 15.72 73.99 13.31 71.14 12.95 C 67.14 12.02 63.45 15.29 62.48 18.99 C 61.30 23.27 61.71 28.68 65.34 31.70 C 67.82 34.05 72.19 33.93 74.61 31.55 C 75.97 30.18 76.35 28.23 76.96 26.48 C 79.36 26.43 81.77 26.44 84.17 26.56 C 83.79 30.09 82.43 33.49 79.89 36.02 C 74.14 41.35 64.17 40.80 58.77 35.25 C 53.52 29.56 53.18 20.38 56.76 13.74 Z" />
<path fill="#a0a0a0" opacity="1.00" d=" M 89.01 7.20 C 91.37 7.21 93.74 7.21 96.11 7.22 C 96.22 15.71 96.10 24.20 96.18 32.69 C 101.25 32.76 106.32 32.63 111.39 32.79 C 111.40 34.86 111.41 36.93 111.41 39.00 C 103.94 39.00 96.47 39.00 89.00 39.00 C 89.00 28.40 88.99 17.80 89.01 7.20 Z" /><path fill="#a0a0a0" opacity="1.00" d=" M 115.00 7.21 C 117.33 7.21 119.66 7.21 121.99 7.21 C 122.01 17.81 122.00 28.40 122.00 39.00 C 119.67 39.00 117.33 39.00 115.00 39.00 C 115.00 28.40 114.99 17.80 115.00 7.21 Z" /><path fill="#a0a0a0" opacity="1.00" d=" M 133.35 7.47 C 139.11 5.56 146.93 6.28 150.42 11.87 C 151.42 13.39 151.35 15.31 151.72 17.04 C 149.33 17.05 146.95 17.05 144.56 17.03 C 144.13 12.66 138.66 11.12 135.34 13.30 C 133.90 14.24 133.54 16.87 135.35 17.61 C 139.99 20.02 145.90 19.54 149.92 23.19 C 154.43 26.97 153.16 35.36 147.78 37.72 C 143.39 40.03 137.99 40.11 133.30 38.69 C 128.80 37.34 125.34 32.90 125.91 28.10 C 128.22 28.10 130.53 28.11 132.84 28.16 C 132.98 34.19 142.68 36.07 145.18 30.97 C 146.11 27.99 142.17 27.05 140.05 26.35 C 135.54 25.04 129.83 24.33 127.50 19.63 C 125.30 14.78 128.42 9.00 133.35 7.47 Z" />
<path fill="#a0a0a0" opacity="1.00" d=" M 153.31 7.21 C 161.99 7.21 170.67 7.21 179.34 7.21 C 179.41 9.30 179.45 11.40 179.48 13.50 C 176.35 13.50 173.22 13.50 170.09 13.50 C 170.05 21.99 170.12 30.48 170.05 38.98 C 167.61 39.00 165.18 39.00 162.74 39.00 C 162.64 30.52 162.73 22.04 162.69 13.55 C 159.57 13.49 156.44 13.49 153.32 13.50 C 153.32 11.40 153.31 9.31 153.31 7.21 Z" /></g><g id="#ffd700ff"><path fill="#ffd700" opacity="1.00" d=" M 12.02 29.98 C 14.02 27.98 16.02 25.98 18.02 23.98 C 22.01 27.99 26.03 31.97 30.00 35.99 C 34.01 31.99 38.01 27.98 42.02 23.99 C 44.02 25.98 46.02 27.98 48.01 29.98 C 42.29 36.06 35.80 41.46 30.59 48.00 L 29.39 48.00 C 24.26 41.42 17.71 36.08 12.02 29.98 Z" /></g></svg>`;

/**
 * 连接数据库
 */
async function initDB() {
    OJBetter.common.database = new Dexie('CFBetterDB');
    OJBetter.common.database.version(3).stores({
        samplesData: '&url',
        editorCode: '&url',
        translateData: '&url',
        localizeSubsData: '&lang'
    });

    // 等待数据库打开
    await OJBetter.common.database.open();
}

/**
 * 清空数据库
 */
async function clearDatabase() {
    const isConfirmed = await OJB_createDialog(
        i18next.t('isClearDatabase.title', { ns: 'dialog' }),
        i18next.t('isClearDatabase.content', { ns: 'dialog' }),
        [
            i18next.t('isClearDatabase.buttons.0', { ns: 'dialog' }),
            i18next.t('isClearDatabase.buttons.1', { ns: 'dialog' })
        ]
    );
    if (!isConfirmed) {
        try {
            // 开启一个读写事务，包含数据库中的所有表
            await OJBetter.common.database.transaction('rw', OJBetter.common.database.tables, async () => {
                // 遍历所有表
                for (const table of OJBetter.common.database.tables) {
                    // 清空当前表
                    await table.clear();
                }
            });
            console.log("All tables in the database have been cleared.");
            alert("All tables in the database have been cleared.");
        } catch (error) {
            console.error("Error clearing the database:", error);
        }
    }
}

/**
 * 导出数据库
 * @returns {Promise<string>} 数据库的JSON字符串
 */
async function exportDatabase() {
    try {
        // 创建一个存储数据的对象
        const exportData = {};
        // 获取数据库中所有表的名称
        const tableNames = OJBetter.common.database.tables.map(table => table.name);

        // 遍历每一个表，获取数据
        for (const tableName of tableNames) {
            const tableData = await OJBetter.common.database.table(tableName).toArray();
            exportData[tableName] = tableData;
        }

        // 将数据对象转换为JSON字符串
        const jsonData = JSON.stringify(exportData, null, 4);
        return jsonData;
    } catch (error) {
        console.error("Error exporting database:", error);
    }
}

/**
 * 导入数据库
 * @param {string} jsonData 数据库的JSON字符串
 */
async function importDatabase(jsonData) {
    const isConfirmed = await OJB_createDialog(
        i18next.t('isImportDatabase.title', { ns: 'dialog' }),
        i18next.t('isImportDatabase.content', { ns: 'dialog' }),
        [
            i18next.t('isImportDatabase.buttons.0', { ns: 'dialog' }),
            i18next.t('isImportDatabase.buttons.1', { ns: 'dialog' })
        ]
    );
    if (!isConfirmed) {
        try {
            // 将JSON字符串解析为对象
            const importData = JSON.parse(jsonData);

            // 开启一个事务，并清空现有数据
            await OJBetter.common.database.transaction('rw', OJBetter.common.database.tables, async () => {
                // 清空所有表的数据
                for (const tableName of OJBetter.common.database.tables.map(table => table.name)) {
                    await OJBetter.common.database.table(tableName).clear();
                }

                // 插入新数据
                for (const [tableName, rows] of Object.entries(importData)) {
                    await OJBetter.common.database.table(tableName).bulkAdd(rows);
                }
            });
            alert("Data imported successfully");
        } catch (error) {
            console.error("Error importing database:", error);
        }
    }
}

/**
 * 将数据下载为文件
 * @param {string} data 数据
 * @param {string} filename 文件名，默认为'export.json'
 * @param {string} fileType 文件MIME类型，默认为'application/json'
 * @returns {void}
 */
function downloadDataAsFile(data, filename = 'export.json', fileType = 'application/json') {
    // 创建一个blob对象，指定文件类型
    const blob = new Blob([data], { type: fileType });
    const url = URL.createObjectURL(blob);

    // 创建一个隐藏的a标签，模拟点击进行下载
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


/**
 * 从文件中读取数据
 * @param {Function} callback 回调函数
 * @returns {void}
 */
function readFileInput(callback) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none'; // 隐藏input元素

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target.result;
                if (callback && typeof callback === 'function') {
                    callback(fileContent); // 调用回调函数，传入文件内容
                }
            };
            reader.readAsText(file);
        }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

/**
 * 删除所有设置
 */
async function deleteAllConfigSettings() {
    const isConfirmed = await OJB_createDialog(
        i18next.t('isDeleteAllConfigSettings.title', { ns: 'dialog' }),
        i18next.t('isDeleteAllConfigSettings.content', { ns: 'dialog' }),
        [
            i18next.t('isDeleteAllConfigSettings.buttons.0', { ns: 'dialog' }),
            i18next.t('isDeleteAllConfigSettings.buttons.1', { ns: 'dialog' })
        ]
    );
    if (!isConfirmed) {
        const keys = GM_listValues();

        keys.forEach(key => {
            GM_deleteValue(key);
        });

        alert('All settings have been deleted.');
        window.location.reload();
    }
}

/**
 * 导出设置到JSON
 * @returns {string} JSON字符串
 */
function exportSettingsToJSON() {
    const keys = GM_listValues();
    let settings = {};

    keys.forEach(key => {
        settings[key] = GM_getValue(key);
    });

    return JSON.stringify(settings, null, 4);
}

/**
 * 从JSON导入设置
 * @param {string} jsonData JSON字符串
 * @returns {void}
 */
async function importSettingsFromJSON(jsonData) {
    const isConfirmed = await OJB_createDialog(
        i18next.t('isImportSettings.title', { ns: 'dialog' }),
        i18next.t('isImportSettings.content', { ns: 'dialog' }),
        [
            i18next.t('isImportSettings.buttons.0', { ns: 'dialog' }),
            i18next.t('isImportSettings.buttons.1', { ns: 'dialog' })
        ]
    );
    if (!isConfirmed) {
        let settings;
        try {
            settings = JSON.parse(jsonData);
        } catch (e) {
            console.error('JSON parsing error:', e);
            return;
        }

        Object.keys(settings).forEach(key => {
            GM_setValue(key, settings[key]);
        });

        alert('Settings imported successfully!');
        window.location.reload();
    }
}

/**
 * 加载元素本地化语言数据
 * @param {JQuery} element jQuery元素
 * @param {number} [retries=10] 重试次数
 * @param {number} [interval=50] 重试间隔
 */
function elementLocalize(element, retries = 10, interval = 50) {
    if ($.isFunction(element.localize)) {
        element.localize();
    } else if (retries > 0) {
        setTimeout(elementLocalize, interval, element, retries - 1, interval);
    } else {
        console.error('Unable to localize', element);
    }
}

// 切换系统黑暗监听
const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
const changeEventListeners = [];
function handleColorSchemeChange(event) {
    event.matches ? $('html').attr('data-theme', 'dark') : $('html').attr('data-theme', 'light');
    if (!event.matches) {
        var originalColor = $(this).data("original-color");
        $(this).css("background-color", originalColor);
        if (OJBetter.monaco.editor) {
            monaco.editor.setTheme('vs');
        }
    } else {
        if (OJBetter.monaco.editor) {
            monaco.editor.setTheme('vs-dark');
        }
    }
}

/**
 * 黑暗模式
 */
(function setDark() {
    /**
     * 初始化
     */
    function setDarkTheme() {
        const htmlElement = document.querySelector('html');
        if (htmlElement) {
            htmlElement.setAttribute('data-theme', 'dark');
        } else {
            setTimeout(setDarkTheme, 100);
        }
    }
    OJBetter.basic.darkMode = OJB_getGMValue("darkMode", "follow")
    if (OJBetter.basic.darkMode == "dark") {
        setDarkTheme();
    } else if (OJBetter.basic.darkMode == "follow") {
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
        html[data-theme=dark] .setting-name, html[data-theme=dark] .OJBetter_setting_menu, html[data-theme=dark] .help_tip .tip_text,
        html[data-theme=dark] textarea, html[data-theme=dark] .user-black, html[data-theme=dark] .comments label.show-archived,
        html[data-theme=dark] .comments label.show-archived *, html[data-theme=dark] table,
        html[data-theme=dark] #items-per-page, html[data-theme=dark] #pagBar, html[data-theme=dark] .OJBetter_setting_sidebar li a:link,
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
        html[data-theme=dark] .user-admin, html[data-theme=dark] .ojb_btn:hover,
        html[data-theme=dark] .OJBetter_modal button, html[data-theme=dark] #OJBetter_statusBar,
        html[data-theme=dark] #RunTestButton, html[data-theme=dark] #programTypeId, html[data-theme=dark] #addCustomTest,
        html[data-theme=dark] #customTestBlock, html[data-theme=dark] .OJBetter_setting_list.alert_info{
            color: #9099a3 !important;
        }
        /* 文字颜色3 */
        html[data-theme=dark] .ojb_btn, html[data-theme=dark] #program-source-text-copy{
            color: #6385a6;
        }
        html[data-theme=dark] input{
            color: #6385a6 !important;
        }
        /* 文字颜色4 */
        html[data-theme=dark] .ttypography .MathJax, html[data-theme=dark] .MathJax span{
            color: #cbd6e2 !important;
        }
        /* 文字颜色 浅绿 */
        html[data-theme=dark] #SubmitButton{
            color: #43A047;
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
        html[data-theme=dark] .OJBetter_setting_menu, html[data-theme=dark] .help_tip .tip_text, html[data-theme=dark] li#add_button:hover,
        html[data-theme=dark] textarea, html[data-theme=dark] .state, html[data-theme=dark] .ace-chrome .ace_gutter-active-line,
        html[data-theme=dark] .sidebar-menu ul li:hover, html[data-theme=dark] .sidebar-menu ul li.active,
        html[data-theme=dark] .ojb_btn:hover,
        html[data-theme=dark] .OJBetter_setting_sidebar li a.active, html[data-theme=dark] .OJBetter_setting_sidebar li,
        html[data-theme=dark] .OJBetter_setting_menu::-webkit-scrollbar-track, html[data-theme=dark] .OJBetter_setting_content::-webkit-scrollbar-track,
        html[data-theme=dark] .OJBetter_modal, html[data-theme=dark] .OJBetter_modal button:hover,
        html[data-theme=dark] .popup .content, html[data-theme=dark] .file.input-view .text, html[data-theme=dark] .file.output-view .text,
        html[data-theme=dark] .file.answer-view .text, html[data-theme=dark] .file.checker-comment-view .text,
        html[data-theme=dark] .config_bar_list, html[data-theme=dark] #LSPLog,
        html[data-theme=dark] .OJBetter_setting_menu .OJBetter_checkboxs,
        html[data-theme=dark] .OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"]::before,
        html[data-theme=dark] .OJBetter_setting_menu a, html[data-theme=dark] .OJBetter_setting_menu .OJBetter_setting_list button:hover{
            background-color: #22272e !important;
            background-image: none;
        }
        /* 背景层次2 */
        html[data-theme=dark] .roundbox, html[data-theme=dark] .roundbox .dark, html[data-theme=dark] .bottom-links,
        html[data-theme=dark] .ojb_btn, html[data-theme=dark] .spoiler-content, html[data-theme=dark] input,
        html[data-theme=dark] .problem-statement .test-example-line-even, html[data-theme=dark] .highlight-blue,
        html[data-theme=dark] .ttypography .tt, html[data-theme=dark] select,
        html[data-theme=dark] .alert-success, html[data-theme=dark] .alert-info, html[data-theme=dark] .alert-error,
        html[data-theme=dark] .alert-warning, html[data-theme=dark] .SumoSelect>.optWrapper>.options li.opt:hover,
        html[data-theme=dark] .translate-problem-statement-panel,
        html[data-theme=dark] .aceEditorTd, html[data-theme=dark] .ace-chrome .ace_gutter,
        html[data-theme=dark] .translate-problem-statement, html[data-theme=dark] .datatable,
        html[data-theme=dark] .OJBetter_setting_list,
        html[data-theme=dark] .OJBetter_setting_menu hr, 
        html[data-theme=dark] .highlighted-row td, html[data-theme=dark] .highlighted-row th,
        html[data-theme=dark] .pagination span.active, html[data-theme=dark] .OJBetter_setting_sidebar li a,
        html[data-theme=dark] .OJBetter_setting_menu::-webkit-scrollbar-thumb, html[data-theme=dark] .OJBetter_setting_content::-webkit-scrollbar-thumb,
        html[data-theme=dark] .OJBetter_modal button, html[data-theme=dark] .test-for-popup pre,
        html[data-theme=dark] .popup .content pre, html[data-theme=dark] .popup .content pre code,
        html[data-theme=dark] ul.config_bar_ul::-webkit-scrollbar-thumb,  html[data-theme=dark] #OJBetter_statusBar,
        html[data-theme=dark] #RunTestButton, html[data-theme=dark] #programTypeId, html[data-theme=dark] .sampleDiv,
        html[data-theme=dark] #addCustomTest, html[data-theme=dark] #LSPLog li:nth-child(odd),
        html[data-theme=dark] .OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"]:checked::before,
        html[data-theme=dark] .config::before, html[data-theme=dark] .config li.tempConfig_add_button:hover,
        html[data-theme=dark] .OJBetter_setting_menu details, html[data-theme=dark] #config_bar_menu,
        html[data-theme=dark] .OJBetter_setting_menu .OJBetter_setting_list button{
            background-color: #2d333b !important;
        }
        /* 实线边框颜色-圆角 */
        html[data-theme=dark] .roundbox, html[data-theme=dark] .roundbox .rtable td,
        html[data-theme=dark] .ojb_btn, html[data-theme=dark] .sidebar-menu ul li,
        html[data-theme=dark] input, html[data-theme=dark] .ttypography .tt, html[data-theme=dark] #items-per-page,
        html[data-theme=dark] .datatable td, html[data-theme=dark] .datatable th,
        html[data-theme=dark] .alert-success, html[data-theme=dark] .alert-info, html[data-theme=dark] .alert-error,
        html[data-theme=dark] .alert-warning, html[data-theme=dark] .translate-problem-statement,
        html[data-theme=dark] textarea, html[data-theme=dark] .input-output-copier{
            border: 1px solid #424b56 !important;
            border-radius: 2px;
        }
        /* 实线边框颜色-无圆角 */
        html[data-theme=dark] .OJBetter_setting_list, html[data-theme=dark] .config_bar_list,
        html[data-theme=dark] label.config_bar_ul_li_text, html[data-theme=dark] .problem-statement .sample-tests .input,
        html[data-theme=dark] .problem-statement .sample-tests .output, html[data-theme=dark] .pagination span.active,
        html[data-theme=dark] .OJBetter_setting_sidebar li, html[data-theme=dark] .OJBetter_setting_menu select,
        html[data-theme=dark] .translate-problem-statement-panel, html[data-theme=dark] .OJBetter_modal button,
        html[data-theme=dark] .test-for-popup pre, html[data-theme=dark] #OJBetter_editor, html[data-theme=dark] #OJBetter_statusBar,
        html[data-theme=dark] #RunTestButton, html[data-theme=dark] #programTypeId, html[data-theme=dark] #customTestBlock,
        html[data-theme=dark] #addCustomTest, 
        html[data-theme=dark] #CompilerSetting select, html[data-theme=dark] #CompilerSetting textarea, html[data-theme=dark] #CompilerBox,
        html[data-theme=dark] .OJBetter_setting_menu .OJBetter_checkboxs, html[data-theme=dark] .OJBetter_setting_menu a,
        html[data-theme=dark] .help_tip .tip_text, html[data-theme=dark] .config::before,
        html[data-theme=dark] #statePanel, html[data-theme=dark] .test-case{
            border: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .roundbox .titled, html[data-theme=dark] .roundbox .rtable th {
            border-bottom: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .roundbox .bottom-links, html[data-theme=dark] #footer, html[data-theme=dark] #customTestBlock #customTests{
            border-top: 1px solid #424b56 !important;
        }
        html[data-theme=dark] .topic .content {
            border-left: 4px solid #424b56 !important;
        }
        html[data-theme=dark] .OJBetter_setting_sidebar {
            border-right: 1px solid #424b56 !important;
        }
        html[data-theme=dark] hr {
            border-color: #424b56 !important;
        }
        /* 虚线边框颜色 */
        html[data-theme=dark] .comment-table, html[data-theme=dark] li#add_button,
        html[data-theme=dark] .OJBetter_setting_menu_label_text{
            border: 1px dashed #424b56 !important;
        }
        html[data-theme=dark] li#add_button:hover{
            border: 1px dashed #03A9F4 !important;
            background-color: #2d333b !important;
            color: #03A9F4 !important;
        }
        /* 无边框 */
        html[data-theme=dark] .translate-problem-statement-panel .ojb_btn{
            border: none !important;
        }
        /* input-output-copier特殊处理 */
        html[data-theme=dark] .html2md-panel.input-output-copier,
        html[data-theme=dark] .translateDiv.input-output-copier,
        html[data-theme=dark] #OJBetter_SubmitForm.input-output-copier{
            border: none !important;
        }
        html[data-theme=dark] .html2md-panel.input-output-copier:hover, 
        html[data-theme=dark] #OJBetter_SubmitForm.input-output-copier:hover{
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
        /* 图标按钮状态样式 */
        html[data-theme=dark] .ojb_btn_popover.success i:before, html[data-theme=dark] .ojb_btn_popover.success i {
            color: #2e7d32;
        }
        html[data-theme=dark] .ojb_btn_popover i:before {
            text-shadow: 1px 1px 0px #2d333b, 1px -1px 0px #2d333b, -1px -1px 0px #2d333b, -1px 1px 0px #2d333b;
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
        html[data-theme=dark] .OJBetter_setting_menu, html[data-theme=dark] .OJBetter_modal{
            box-shadow: 0px 0px 0px 4px #2d333b;
            border: 1px solid #2d333b;
        }
        html[data-theme=dark] .collapsible-topic.collapsed .content .collapsible-topic-options:before{
            background-image: linear-gradient(#22272e00, #22272e);
        }
        html[data-theme=dark] .alert{
            text-shadow: none;
        }
        html[data-theme=dark] input[type="radio"]:checked+.OJBetter_setting_menu_label_text {
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
        html[data-theme=dark] .problem-statement .darkhighlight {
          background-color: #455a64 !important;
        }
    `);
})()

/**
 * 黑暗模式额外的处理事件
 */
function darkModeStyleAdjustment() {
    $(".test-example-line").off("mouseenter mouseleave"); // 移除上面原本的事件
    // 为奇数行添加悬停效果
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

    // 为偶数行添加悬停效果
    $('.test-example-line-even').hover(
        function () {
            $(this).addClass('darkhighlight');
            $(this).prevUntil(':not(.test-example-line-even)').addClass('darkhighlight');
            $(this).nextUntil(':not(.test-example-line-even)').addClass('darkhighlight');
        },
        function () {
            $(this).removeClass('darkhighlight');
            $(this).prevUntil(':not(.test-example-line-even)').removeClass('darkhighlight');
            $(this).nextUntil(':not(.test-example-line-even)').removeClass('darkhighlight');
        }
    );
}

// 样式
GM_addStyle(`
/*动画*/
@keyframes shake {
    0% { transform: translateX(-5px); }
    100% { transform: translateX(5px); }
}
@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
@keyframes rippleout {
    0% {
        box-shadow: 0 0 0 0 rgba(96, 98, 102, 0.2);
    }

    100% {
        box-shadow: 0 0 0 6px rgba(0, 0, 0, 0);
    }
}
@keyframes bounce-in {
	20%,40%,60%,80%,from,to {
		animation-timing-function: cubic-bezier(.215,.61,.355,1);
	}

	0% {
		opacity: 0;
		transform: scale3d(.995,.995,.995);
	}

	20% {
        opacity: 1;
		transform: scale3d(1.005,1.005,1.005);
	}

	40% {
		transform: scale3d(.998,.998,.998);
	}

	60% {
		transform: scale3d(1.002,1.002,1.002);
	}

	80% {
		transform: scale3d(.995,.995,.995);
	}

	to {
		opacity: 1;
		transform: scale3d(1,1,1);
	}
}
/*iconfont图标*/
.iconfont {
    font-family: "iconfont" !important;
    font-size: 16px;
    font-style: normal !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
@font-face {
  font-family: 'iconfont';  /* Project id 4284341 */
  src: url('//at.alicdn.com/t/c/font_4284341_a8harv4inf8.woff2?t=1707293059995') format('woff2'),
       url('//at.alicdn.com/t/c/font_4284341_a8harv4inf8.ttf?t=1707293059995') format('truetype');
}
html {
    scroll-behavior: smooth;
}
:root {
    --vp-font-family-base: "Chinese Quotes", "Inter var", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
span.mdViewContent {
    white-space: pre-wrap;
}

/* 特殊处理，加上input-output-copier类, 让convertStatementToText方法忽略该元素 */
.translateDiv.input-output-copier, .html2md-panel.input-output-copier, #OJBetter_SubmitForm.input-output-copier {
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
.translateDiv.input-output-copier:hover, .html2md-panel.input-output-copier:hover, #OJBetter_SubmitForm.input-output-copier:hover {
  background-color: #ffffff00;
}

/* dialog */
dialog {
    margin: 0px;
}
dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
}

/*题目页链接栏样式*/
#problemToolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    overflow: auto;
    height: 100%;
    margin: 0.5em;
}

/*html2md面板*/
.html2md-panel {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
.html2md-panel a {
    text-decoration: none;
}
.html2md-panel > button {
    margin: 5px;
}
.html2md-panel.is_simple {
    position: absolute;
    right: 2%;
}

/*通用按钮*/
.ojb_btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: #ffffff;
    color: #606266;
    width: auto;
    font-size: 13px;
    border-radius: 0.3rem;
    padding: 2px 5px;
    margin: 0px 5px;
    border: 1px solid #dcdfe6;
}
.ojb_btn[disabled] {
    cursor: not-allowed !important;
    color: rgb(168, 171, 178) !important;
    border: 1px solid rgb(228, 231, 237) !important;
    background-color: rgb(255, 255, 255) !important;
}
.ojb_btn:hover {
    color: #409eff;
    border-color: #409eff;
    background-color: #f1f8ff;
    z-index: 150;
}
.ojb_btn.primary {
    color: #ffffff;
    border: 1px solid #409eff;
    background-color: #409eff;
}
.ojb_btn.primary:hover {
    color: #ffffff;
    border: 1px solid #79bbff;
    background-color: #79bbff;
}
.ojb_btn.success {  
    color: #4caf50;
    border: 1px solid #C8E6C9;
    background-color: #f0f9eb;
}
.ojb_btn.warning {
    color: #e6a23c;
    border: 1px solid #f3d19e;
    background-color: #fdf6ec;
}
.ojb_btn.error {
    color: #f56c6c;
    border: 1px solid #fab6b6;
    background-color: #fef0f0;
}
.ojb_btn.enabled {
    color: #42A5F5;
    border: 1px solid #90CAF9;
    background-color: #fafbff;
}
.ojb_btn.active {
    animation: rippleout 0.5s ease-in-out;
}
a.ojb_btn {
    text-decoration: none;
}
a.ojb_btn:link {
    color: #606266;
}
a.ojb_btn span {
    margin-left: 2px;
}
/*按钮图标和popover*/
.ojb_btn_popover {
    display: flex;
    justify-content: center;
    position: relative;
    outline: none;
    appearance: none;
}
.ojb_btn_popover:hover span {
    opacity: 1;
    visibility: visible;
}
.ojb_btn_popover i:before {
    position: absolute;
    text-shadow: 1px 1px 0px #ffffff, 1px -1px 0px #ffffff, -1px -1px 0px #ffffff, -1px 1px 0px #ffffff;
}
.ojb_btn_popover span {
    cursor: initial;
    position: absolute;
    left: 50%;
    opacity: 0;
    visibility: hidden;
    padding: 4px 8px;
    background-color: rgba(33, 33, 33, 0.8);
    color: rgba(255, 255, 255, 0.9019607843);
    font-size: 12px;
    border-radius: 6px;
    line-height: 1.6;
    text-align: left;
    white-space: nowrap;
    transition: all 0.15s ease-in-out;
    z-index: 999;
}
.ojb_btn_popover span:hover {
    opacity: 0;
    visibility: hidden;
}
.ojb_btn_popover.top:hover span {
    transform: translate(-50%, 0);
}
.ojb_btn_popover.top span {
    bottom: 100%;
    transform: translate(-50%, -20%);
    margin-bottom: 4px;
}
.ojb_btn_popover.top span:hover {
    transform: translate(-50%, -20%);
}
.ojb_btn_popover.bottom:hover span {
    transform: translate(-50%, 105%);
}
.ojb_btn_popover.bottom span {
    bottom: -2%;
    transform: translate(-50%, 100%);
    margin-top: 4px;
}
.ojb_btn_popover.bottom span:hover {
    transform: translate(-50%, 50%);
}
.ojb_btn_popover.loading i {
    color: rgba(33, 33, 33, 0.1);
}
.ojb_btn_popover.loading i:before {
    content: "\\e640";
    color: rgb(168, 171, 178);
    animation: rotate 2s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
}
.ojb_btn_popover.running i {
    color: rgba(33, 33, 33, 0.1);
}
.ojb_btn_popover.running i:before {
    content: "\\e600";
    color: rgb(168, 171, 178);
    animation: rotate 1s linear infinite;
}
.ojb_btn_popover.warning i {
    color: rgba(230, 162, 61, 0.8);
}
.ojb_btn_popover.warning i:before {
    content: "\\e68b";
    font-size: 15px;
    left: 10px;
    bottom: 0%;
    color: #ff9800;
}
.ojb_btn_popover.error i {
    color: rgba(245, 108, 108, 0.8);
}
.ojb_btn_popover.error i:before {
    content: "\\e651";
    font-size: 15px;
    left: 10px;
    bottom: 0%;
    color: #F44336;
}
.ojb_btn_popover.success i {
    color: rgba(76, 175, 80, 0.9);
}
.ojb_btn_popover.success i:before {
    content: "\\e61e";
    font-size: 15px;
    left: 10px;
    bottom: 0%;
    color: #4caf50;
}
.ojb_btn_popover.enabled i {
    color: rgba(33, 150, 243, 0.6);
}
.ojb_btn_popover.enabled i:before {
    content: "\\e6f4";
    font-size: 15px;
    left: 10px;
    bottom: 0%;
    color: #2196F3;
}
.ojb_btn_popover.redo i {
    color: rgba(33, 33, 33, 0.1);
}
.ojb_btn_popover.redo i:before {
    content: "\\e831";
    color: #616161;
}
.ojb_btn_popover.reverse i {
    transform: rotate(180deg);
}

/*translateDiv样式*/
.translateDiv .topText {
    display: flex;
    margin-left: 5px;
    color: #9e9e9e;
    font-size: 13px;
    align-items: center;
}
.translateDiv .borderlessButton{
    display: flex;
    align-items: center;
    margin: 2.5px 7px;
    fill: #9E9E9E;
}
.translateDiv .borderlessButton:hover{
    cursor: pointer;
    fill: #059669;
}
.translateDiv.bounce-in {
    animation: bounce-in 1s forwards;
}
html:not([data-theme='dark']) .translateDiv {
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
.translate-problem-statement-panel{
    display: flex;
    justify-content: space-between;
    background-color: #f9f9fa;
    border: 1px solid #c5ebdf;
    border-radius: 0.3rem;
    margin: 4px 0px;
}
.translate-problem-statement-panel .ojb_btn {
    background: none;
    border: none;
    color: #9e9e9e;
}
.translate-problem-statement-panel.error, .translate-problem-statement.error {
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
    word-wrap: break-word;
}
.problem-statement p:last-child {
    margin-bottom: 0px !important;
}

/*设置按钮*/
header .enter-or-register-box, header .languages {
    position: absolute;
    right: 170px;
}
.ojb_btn.OJBetter_setting {
    float: right;
    height: 30px;
    background: #60a5fa;
    color: white;
    margin: 10px;
    border: 1px solid #60a5fa;
}
.ojb_btn.OJBetter_setting.open {
    background-color: #e6e6e6;
    color: #727378;
    cursor: not-allowed;
}

/*设置面板*/
.OJBetter_setting_menu {
    box-shadow: 0px 0px 0px 4px #ffffff;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 600px;
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
.OJBetter_setting_menu h3 {
    margin-top: 10px;
}
.OJBetter_setting_menu h4 {
    margin: 15px 0px 10px 0px;
}
.OJBetter_setting_menu h4,.OJBetter_setting_menu h5 {
    font-weight: 600;
}
.OJBetter_setting_menu hr {
    border: none;
    height: 1px;
    background-color: #ccc;
    margin: 10px 0;
}
.OJBetter_setting_menu details {
    padding: 10px;
    margin-bottom: 5px;
    background-color: #ffffff;
    border-bottom: 1px solid #c9c6c696;
    border-radius: 8px;
}
.OJBetter_setting_menu .badge {
    border-radius: 4px;
    border: 1px solid #009688;
    color: #009688;
    font-size: 12px;
    padding: 0.5px 4px;
    margin-left: 5px;
    margin-right: auto;
}
.OJBetter_setting_menu .missing {
    box-shadow: inset 0px 0px 1px 1px red;
}
/* 页面切换 */
.OJBetter_setting_menu .settings-page {
    display: none;
}
.OJBetter_setting_menu .settings-page.active {
    display: block;
}
.OJBetter_setting_container {
    display: flex;
}
.OJBetter_setting_sidebar {
    flex: 0 0 auto;
    min-width: 110px;
    padding: 6px 10px 6px 6px;
    margin: 20px 0px;
    border-right: 1px solid #d4d8e9;
}
.OJBetter_setting_content {
    flex-grow: 1;
    margin: 20px 0px 0px 12px;
    padding-right: 10px;
    max-height: 580px;
    overflow-y: auto;
    box-sizing: border-box;
}
.OJBetter_setting_sidebar h3 {
    margin-top: 0;
}
.OJBetter_setting_sidebar hr {
    margin-top: 10px;
    margin-bottom: 10px;
    border: none;
    border-top: 1px solid #DADCE0;
}
.OJBetter_setting_sidebar ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
}
.OJBetter_setting_sidebar li {
    margin: 5px 0px;
    background-color: #ffffff;
    border: 1px solid #d4d8e9;
    border-radius: 4px;
    font-size: 16px;
}
.OJBetter_setting_sidebar li a {
    text-decoration: none;
    display: flex;
    width: 100%;
    font-size: 16px;
    color: gray;
    background-color: #ffffff;
    border: none;
    letter-spacing: 2px;
    padding: 7px;
    margin: 0px;
    border-radius: 4px;
    align-items: center;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
.OJBetter_setting_sidebar li a.active {
    background-color: #eceff1c7;
}
/* 链接样式 */
.OJBetter_setting_menu a {
    font-size: 13px;
    color: #009688;
    background-color: #E0F2F1;
    border: 1px solid #009688;
    border-radius: 4px;
    padding: 0px 5px;
    margin: 0px 5px;
    text-decoration: none;
}
/* 下拉选择框 */
.OJBetter_setting_menu select {
    appearance: none;
    padding: 5px 10px;
    margin: -5px 0px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
    color: #009688;
    font-size: 15px;
}
.OJBetter_setting_menu select:focus-visible {
    outline: none;
}
.OJBetter_setting_menu select option:disabled {
    color: #EEEEEE;
}
/* 数值输入框 */
.OJBetter_setting_menu input[type="number"] {
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
.OJBetter_setting_menu input[type="number"]:focus-visible {
    outline: none;
}
.OJBetter_setting_menu input[type="number"]::-webkit-inner-spin-button,
.OJBetter_setting_menu input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
/*设置面板-滚动条*/
.OJBetter_setting_menu::-webkit-scrollbar, .OJBetter_setting_content::-webkit-scrollbar {
    width: 5px;
    height: 7px;
    background-color: #aaa;
}
.OJBetter_setting_menu::-webkit-scrollbar-thumb, .OJBetter_setting_content::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
}
.OJBetter_setting_menu::-webkit-scrollbar-track, .OJBetter_setting_content::-webkit-scrollbar-track {
    background-color: #f1f1f1;
}
/*设置面板-关闭按钮*/
.OJBetter_setting_menu .tool-box {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 3px;
    right: 3px;
}
.OJBetter_setting_menu .btn-close {
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
.OJBetter_setting_menu .btn-close:hover {
    color: #ffffff;
    background-color: #ff0000cc;
    box-shadow: 0 5px 5px 0 #00000026;
}
.OJBetter_setting_menu .btn-close:active {
    color: #ffffffde;
    background-color: #ff000080;
}
/*设置面板-checkbox*/
.OJBetter_setting_menu input[type=checkbox]:focus {
    outline: 0px;
}
.OJBetter_setting_menu .OJBetter_setting_list input[type="checkbox"] {
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
.OJBetter_setting_menu .OJBetter_setting_list input[type="checkbox"]::before {
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
.OJBetter_setting_menu .OJBetter_setting_list input[type="checkbox"]::after {
	content: url("data:image/svg+xml,%3Csvg xmlns='://www.w3.org/2000/svg' width='23' height='23' viewBox='0 0 23 23' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M6.55021 5.84315L17.1568 16.4498L16.4497 17.1569L5.84311 6.55026L6.55021 5.84315Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17.1567 6.55021L6.55012 17.1568L5.84302 16.4497L16.4496 5.84311L17.1567 6.55021Z' fill='%23EA0707' fill-opacity='0.89'/%3E%3C/svg%3E");
	position: absolute;
	top: 0;
	left: 24px;
}
.OJBetter_setting_menu .OJBetter_setting_list input[type="checkbox"]:checked {
	border: 1.5px solid #C5CAE9;
	background: #E8EAF6;
}
.OJBetter_setting_menu .OJBetter_setting_list input[type="checkbox"]:checked::before {
    background: #C5CAE9;
    border: 1.5px solid #7986CB;
    transform: translate(122%, 2%);
    transition: all 0.3s ease-in-out;
}
.OJBetter_setting_menu .OJBetter_setting_list input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    position: absolute;
    top: 1.5px;
    left: 4.5px;
}
.OJBetter_setting_menu .OJBetter_setting_list button {
    cursor: pointer;
    color: #7986cb;
    background-color: #e8eaf6;
    border: 1px solid #7986cb;
    border-radius: 6px;
    width: 100px;
    margin: -5px 2px;
    padding: 5px 10px;
}
.OJBetter_setting_menu .OJBetter_setting_list button:hover {
    color: #e8eaf6;
    background-color: #7986cb;
    border: 1px solid #7986cb;
}
.OJBetter_setting_menu label, #darkMode_span, #loaded_span {
    font-size: 16px;
}
.OJBetter_setting_list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 10px;
    margin: 5px 0px;
    background-color: #ffffff;
    border: 1px solid #c9c6c642;
    border-bottom-color: #c9c6c696;
    border-radius: 8px;
    justify-content: space-between;
}
.OJBetter_setting_list.alert_danger {
    color: #F44336;
    background-color: #FFEBEE;
    border: 1px solid #F44336;
    margin: 10px 0px;
}
.OJBetter_setting_list.alert_warn {
    color: #E65100;
    background-color: #FFF3E0;
    border: 1px solid #FF9800;
    margin: 10px 0px;
}
.OJBetter_setting_list.alert_tip {
    color: #009688;
    background-color: #E0F2F1;
    border: 1px solid #009688;
    margin: 10px 0px;
}
.OJBetter_setting_list.alert_info {
    color: #ffffff;
    background-color: #009688;
    margin: 10px 0px;
    box-shadow: rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;
}
.OJBetter_setting_list p:not(:last-child) {
    margin-bottom: 10px;
}
.OJBetter_setting_list p:not(:first-child) {
    margin-top: 10px;
}
/*设置面板-checkboxs*/
.OJBetter_setting_menu .OJBetter_checkboxs {
    flex-basis: 100%;
    display: flex;
    padding: 8px;
    margin: 10px 0px 0px 0px;
    border-bottom: 1px solid #c9c6c696;
    border-radius: 8px;
    border: 1px solid #c5cae9;
    background-color: #f0f8ff;
}
.OJBetter_setting_menu .OJBetter_checkboxs label {
    font-size: 13px;
    margin: 0px 6px 0px 3px;
}
.OJBetter_setting_menu .OJBetter_checkboxs input[type=checkbox]:checked+label{
    color: #7986cb;
}
.OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"] {
    border: none;
    width: 16px;
    height: 16px;
}
.OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"]::before{
    background: #ffffff;
    transform: none;
    width: 16px;
    height: 16px;
}
.OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"]:checked {
	background: none;
    border: none;
}
.OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"]:checked::before {
    border: 1.5px solid #95a2de;
    background: #e8eaf6;
	transform: none;
}
.OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"]:checked::after {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 15 13' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M14.8185 0.114533C15.0314 0.290403 15.0614 0.605559 14.8855 0.818454L5.00187 12.5L0.113036 6.81663C-0.0618274 6.60291 -0.0303263 6.2879 0.183396 6.11304C0.397119 5.93817 0.71213 5.96967 0.886994 6.18339L5.00187 11L14.1145 0.181573C14.2904 -0.0313222 14.6056 -0.0613371 14.8185 0.114533Z' fill='%2303A9F4' fill-opacity='0.9'/%3E%3C/svg%3E");
    top: 0px;
    left: 3.5px;
}
.OJBetter_setting_menu .OJBetter_checkboxs input[type="checkbox"]:disabled+label {
    color: #BDBDBD;
}
/*设置面板-radio*/
.OJBetter_setting_menu label {
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 3px 0px;
    overflow-x: visible;
}
.OJBetter_setting_menu_label_text {
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
input[type="radio"]:checked+.OJBetter_setting_menu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    text-shadow: 0px 0px 0.5px green;
}
input[type="radio"]:disabled+.OJBetter_setting_menu_label_text {
    background: #fafafa00;
    border: 1px solid #e0e0e07a;
    color: #e0e0e0;
}
.OJBetter_setting_menu label input[type="radio"], .OJBetter_contextmenu label input[type="radio"]{
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
/*设置面板-文本输入框*/
.OJBetter_setting_menu input[type="text"] {
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
.OJBetter_setting_menu .OJBetter_setting_list input[type="text"] {
    margin-left: 5px;
}
.OJBetter_setting_menu input[type="text"]:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}
.OJBetter_setting_menu_config_box {
    width: 100%;
    display: grid;
    margin-top: 5px;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
.OJBetter_setting_menu input::placeholder {
    color: #727378;
}
.OJBetter_setting_menu input.no_default::placeholder{
    color: #BDBDBD;
}
.OJBetter_setting_menu input.is_null::placeholder{
    color: red;
    border-width: 1.5px;
}
.OJBetter_setting_menu input.is_null{
    border-color: red;
}
.OJBetter_setting_menu textarea {
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
.OJBetter_setting_menu textarea:focus-visible{
    border-style: solid;
    border-color: #3f51b5;
    outline: none;
}
.OJBetter_setting_menu textarea::placeholder{
    color: #BDBDBD;
    font-size: 14px;
}
.OJBetter_setting_menu #tempConfig_save {
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
.OJBetter_setting_menu button#debug_button.debug_button {
    width: 18%;
}
.OJBetter_setting_menu span.tip {
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
.OJBetter_setting_menu .OJBetter_setting_menu_label_text .help_tip .help-icon {
    color: #7fbeb2;
}
.help_tip .help-icon:hover + .tip_text, .help_tip .tip_text:hover {
    display: block;
    cursor: help;
    width: 250px;
}
/* 版本信息 */
.OJBetter_setting_menu .versionInfo{
    display: grid;
    justify-items: center;
    font-size: 16px;
    padding: 10px;
}
.OJBetter_setting_menu .versionInfo>* {
    margin: 10px 0px;
}

/* 配置管理面板 */
.config{
    width: 100%;
    margin: 10px 0px;
}
.config li.tempConfig_add_button {
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
.config li.tempConfig_add_button:hover {
    border: 1px dashed #03A9F4;
    background-color: #d7f0fb8c;
    color: #03A9F4;
}
.config .config_bar_list {
    display: flex;
    width: 100%;
    padding-bottom: 2px;
    border: 1px solid #c5cae9;
    background-color: #f0f8ff;
    box-sizing: border-box;
    border-radius: 0px 0px 8px 8px;
}
.config .config_bar_list input[type="radio"] {
    appearance: none;
    width: 0;
    height: 0;
    overflow: hidden;
}
.config .config_bar_list input[type="radio"] {
    margin: 0px;
}
.config .config_bar_list input[type=radio]:focus {
    outline: 0px;
}
.config .config_bar_ul_li_text {
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
.config .config_bar_ul li button {
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
.config .config_bar_ul {
    display: flex;
    align-items: center;
    list-style-type: none;
    padding-inline-start: 0px;
    overflow-x: auto;
    max-width: 100%;
    margin: 0px;
    padding: 5px;
}
.config .config_bar_ul li {
    width: 80px;
    display: grid;
    margin: 4px 4px;
    min-width: 100px;
    box-sizing: border-box;
}
.config .config_bar_ul_li_text:hover {
    background-color: #eae4dc24;
}
input[type="radio"]:checked + .config_bar_ul_li_text {
    background: #41b3e430;
    border: 1px solid #5e7ce0;
    color: #5e7ce0;
}
.config .config_bar_ul::-webkit-scrollbar {
    width: 5px;
    height: 4px;
}
.config .config_bar_ul::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
    border-radius: 8px;
}
.config .config_bar_ul::-webkit-scrollbar-button:start:decrement {
    width: 4px;
    background-color: transparent;
}
.config .config_bar_ul::-webkit-scrollbar-button:end:increment {
    width: 4px;
    background-color: transparent;
}
.config .config_bar_ul::-webkit-scrollbar-track {
    border-radius: 5px;
}
.config .config_bar_ul_li_text::-webkit-scrollbar {
    width: 5px;
    height: 7px;
    background-color: #aaa;
}
.config .config_bar_ul_li_text::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d7d9e4;
}
.config .config_bar_ul_li_text::-webkit-scrollbar-track {
    background-color: #f1f1f1;
}
.config .config_bar_list_add_div {
    display: flex;
    height: 40px;
    margin: 4px 2px;
}

/* 修改菜单 */
#config_bar_menu {
    z-index: 400;
    position: fixed;
    width: 60px;
    background: #ffffff;
    box-shadow: 1px 1px 4px 0px #0000004d;
    border: 0px solid rgba(0,0,0,0.04);
    border-radius: 4px;
    padding: 8px 0;
}
.config_bar_menu_item {
    cursor: pointer;
    padding: 2px 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 32px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: inset 0px 0px 0px 0px #8bb2d9;
}
#config_bar_menu_edit:hover {
    background-color: #00aeec;
    color: white;
}
#config_bar_menu_delete:hover {
    background-color: #FF5722;
    color: white;
}

/* 配置编辑页面 */
#config_edit_menu {
    z-index: 300;
    width: 450px;
}

/* 黑暗模式选项按钮 */
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
.dark-mode-selection .OJBetter_setting_menu_label_text {
    border-radius: 8px;
    margin-bottom: 0px;
}

/*确认弹窗*/
.OJBetter_modal {
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
.OJBetter_modal .buttons{
    display: flex;
    padding-top: 15px;
}
.OJBetter_modal button {
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
.OJBetter_modal button.secondary{
    background-color:#4DB6AC;
}
.OJBetter_modal button:hover{
    background-color:#4DB6AC;
}
.OJBetter_modal button.secondary:hover {
    background-color: #80CBC4;
}
.OJBetter_modal .help-icon {
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
.OJBetter_modal p {
    margin: 5px 0px;
}

/* 右键菜单 */
.OJBetter_contextmenu {
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
input[type="radio"]:checked+.OJBetter_contextmenu_label_text {
    background: #41e49930;
    border: 1px solid green;
    color: green;
    font-weight: 500;
}
.OJBetter_contextmenu_label_text {
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
.OJBetter_contextmenu_label_text:hover {
    color: #F44336;
    border: 1px dashed #009688;
    background-color: #ffebcd;
}

/* RatingByClist */
.ratingBadge, html[data-theme=dark] button.ratingBadge{
    display: block;
    font-weight: 700;
    font-size: 11px;
    margin-top: 5px;
    padding: 2px;
    border-radius: 4px;
    color: #B0BEC5;
    border: 1px solid #cccccc66;
}

/* 多选翻译 */
.block_selected{
    box-shadow: 0px 0px 0px 1px #FF9800;
    outline: none;
}

/* 悬浮菜单 */
.OJBetter_MiniTranslateButton {
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
.OJBetter_MiniTranslateButton:hover {
    cursor: pointer;
    box-shadow: 0px 0px 0px 2px #FFB74D;
}

/* acmsguru划分块 */
.OJBetter_acmsguru {
    margin: 0 0 1em!important;
}

/* 代码提交表单 */
#OJBetter_SubmitForm.input-output-copier:hover {
    background-color: #ffffff00;
}
#OJBetter_SubmitForm input[type="number"] {
    width: 40px;
    color: #009688;
    appearance: none;
    border-radius: 6px;
    border-style: solid;
    border: none;
    background-color: #ffffff00;
}
#OJBetter_SubmitForm :focus-visible {
    outline: none;
}
#OJBetter_SubmitForm .topDiv {
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0px;
}
#OJBetter_SubmitForm .topDiv .topRightDiv {
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 0px;
}

/* 顶部区域 */
#OJBetter_SubmitForm .topRightDiv>* {
    height: 100%;
    box-sizing: border-box;
}
#OJBetter_SubmitForm .topRightDiv>button{
    padding: 0px 8px;
}
#OJBetter_SubmitForm .topRightDiv {
    display: flex;
    flex-wrap: wrap;
    gap: 0px;
    align-items: center;
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

/* 代码编辑器 */
#OJBetter_editor{
    box-sizing: border-box;
    height: 600px;
    border: 1px solid #d3d3d3;
    width: 100%;
    resize: vertical;
    display: flex;
    flex-direction: column;
}
#OJBetter_editor.fullscreen{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 100;
}
#OJBetter_editor.bottom{
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50vh;
    z-index: 100;
}
.ojb_btn.exit_button_bottom {
    position: fixed;
    bottom: 30px;
    right: 15px;
    z-index: 100;
    height: 28px;
}

/* monaco */
#OJBetter_monaco {
    flex: 1;
    min-height: 0;
    width: 100%;
}
#OJBetter_monaco .highlight {
    border: 1px solid #ffffff00;
    background-color: #ffffff00!important
}
.monaco-hover hr {
    margin: 4px -8px 4px !important;
}

/* 状态底栏 */
#OJBetter_statusBar{
    height: 22px;
    font-size: 12px;
    color: #757575;
    border: 1px solid #d3d3d3;
    background-color: #f8f8f8;
    padding: 3px;
    box-sizing: border-box;
}

/* 提交 */
#OJBetter_submitDiv{
    display: flex;
    padding-top: 15px;
    height: 35px;
}
#OJBetter_submitDiv >* {
    border-radius: 6px;
}
#OJBetter_submitDiv > button {
    height: 100%;
    aspect-ratio: 1 / 1;
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
#programTypeId{
    height: 100%;
    padding: 5px 10px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
    color: #212529;
}

/* 调试 */
.OJBetter_loding{
    padding: 6px 0px 0px 5px;
    height: 22px;
}
#CompilerArgsInput{
    flex-grow: 1;
    width: 100%;
    height: 100%;
    margin-bottom: 10px;
    padding: 5px 10px;
    border-radius: 6px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    box-shadow: inset 0px 1px 1px rgba(0,0,0,.075);
}
#CompilerArgsInput[disabled] {
    cursor: not-allowed;
}
#CompilerSetting{
    font-size: 14px;
    margin-top: 10px;
    display: none;
}
#CompilerSetting select, #CompilerSetting textarea{
    padding: 4px 10px;
    border-radius: 6px;
    border-style: solid;
    border: 1px solid #ced4da;
    color: #212529;
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

/* 自定义样例 */
#customTestBlock {
    margin-top: 10px;
    font-size: 14px;
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

/* 调试结果 */
#statePanel{
    display: none;
    padding: 5px;
    margin-top: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}
.test-case {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
}
.test-case:not(:first-child){
    margin-top: 5px;
}
.test-case > * {
    margin: 5px 0px;
}
.test-case > :first-child {
    margin-top: 0px;
}
.test-case > :last-child {
    margin-bottom: 0px;
}
.test-case-title, .test-case-status {
    font-size: 16px;
    display: inline;
}
.test-case-status{
    margin-left: 5px;
}
.test-case-status.error{
    color: red;
}
.test-case-status.success{
    color: #449d44;
}
.test-case-judge {
    font-size: 13px;
}

/* 差异对比 */
.output_diff {
    color: #5d4037;
    margin: 5px 0px;
    display: grid;
    border: 1px solid #bcaaa4;
    font-size: 13px;
    font-family: Consolas, "Lucida Console", "Andale Mono", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace;
    overflow: auto;
}
.output_diff .added {
    background-color: #c8f7c5;
    user-select: none;
    padding-left: 3px;
}
.output_diff .removed {
    background-color: #f7c5c5;
    padding-left: 3px;
}
.output_diff .diffLine {
    display: flex;

}
.output_diff .diffLine:nth-child(odd) {
    background-color: #f5f5f5;
}
.lineNo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 17px;
    color: #BDBDBD;
    font-size: 10px;
    border-right: 1px solid;
    user-select: none;
}
.lineContent {
    display: grid;
    width: 100%;
}
.lineContent>span {
    height: 16px;
}
.output_no_diff {
    padding: 5px;
    border: 1px solid #ddd;
}
.diff_note {
    font-size: 10px;
}

/* 覆盖网站原本的样式 */
#footer > div:nth-child(7) {
    left: 0px !important;
}

/* 移动设备 */
@media (max-device-width: 450px) {
    .ojb_btn{
        height: 2em;
        font-size: 1.2em;
    }
    .ojb_btn.OJBetter_setting{
        height: 2.5em;
        font-size: 1em;
    }
    .OJBetter_setting_menu{
        width: 90%;
    }
    .OJBetter_setting_menu label, #darkMode_span, #loaded_span, .OJBetter_setting_menu_label_text,
    .OJBetter_setting_sidebar li{
        font-size: 1em;
    }
    .translate-problem-statement{
        font-size: 1.2em;
    }
    .OJBetter_modal{
        font-size: 1.5em;
    }
    .OJBetter_setting_list, .translate-problem-statement{
        padding: 0.5em;
    }
    .OJBetter_setting_menu_label_text{
        height: 2.5em;
        padding: 0.5em;
    }
    #pagBar #jump-input, #pagBar #items-per-page, .OJBetter_modal button{
        height: 2.5em;
        font-size: 1em;
    }
    .translate-problem-statement p, .translate-problem-statement ul li{
        line-height: 1.5em !important;
    }
    .OJBetter_contextmenu_label_text{
        height: 3em;
        font-size: 1em;
    }
}
`);

/**
 * 添加一些依赖库和条件加载的css样式
 */
function addDependencyStyles() {
    GM_addStyle(GM_getResourceText("xtermcss"));
    // 自定义图标大小
    GM_addStyle(`
        .iconfont {
            font-size: ${OJBetter.preference.iconButtonSize}px;
        }
    `);
}

/**
 * 添加包含i18n内容的css样式
 */
function addI18nStyles() {
    GM_addStyle(`
    /* 加载鼠标悬浮覆盖层css */
    .overlay::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(135deg, rgb(77 208 225 / 30%), rgb(77 208 225 / 30%) 30px, rgb(77 208 225 / 10%) 0px, rgb(77 208 225 / 10%) 55px);
        z-index: 100;
    }
    .overlay::after {
        content: '${i18next.t('targetArea', { ns: 'common' })}';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #00695C;
        font-size: 16px;
        font-weight: bold;
        z-index: 100;
    }

    .config::before {
        content: "${i18next.t('common.configManageTitle', { ns: 'settings' })}";
        display: block;
        height: 20px;
        background-color: #f0f8ff;
        border: 1px solid #c5cae9;
        border-bottom: 0px;
        line-height: 20px;
        padding: 2px 10px;
        border-radius: 8px 8px 0px 0px;
    }
    .config.missing::before {
        content: "${i18next.t('common.missing.radio', { ns: 'settings' })}";
        background-color: #fef0f0;
        color: #f56c6c;
        border: 1px solid #fab6b6;
    }
    `);
}

// ------------------------------
// 一些工具函数
// ------------------------------

/**
 * 延迟函数 
 * @param {number} ms 延迟时间（毫秒） 
 * @returns {Promise<void>}
 */
function OJB_delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 深度比较两个对象或数组是否完全相等。
 * @param {any} a - 第一个比较对象。
 * @param {any} b - 第二个比较对象。
 * @returns {boolean} - 如果两个对象或数组深度相等，则返回true，否则返回false。
 */
function OJB_deepEquals(a, b) {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (let key of keysA) {
        if (!b.hasOwnProperty(key)) return false;
        if (!OJB_deepEquals(a[key], b[key])) return false;
    }
    return true;
}

/**
 * 用于封装需要重试的异步函数
 * @param {Function} task 需要封装的异步函数
 * @param {Object} options 配置项
 * @param {Number} options.maxRetries 重试次数，默认为 5
 * @param {Number} options.retryInterval 重试时间间隔，默认为 0 毫秒
 * @param {Function} options.errorHandler 错误处理函数，默认为抛出错误
 * @param {...any} args task 函数的参数
 * @returns {Promise} 返回 Promise
 */
async function OJB_promiseRetryWrapper(task, {
    maxRetries = 5,
    retryInterval = 0,
    errorHandler = (err) => { throw err }
} = {}, ...args) {
    let attemptsLeft = maxRetries;
    while (attemptsLeft--) {
        try {
            return await task(...args);
        } catch (err) {
            if (attemptsLeft <= 0) {
                return errorHandler(err, maxRetries, attemptsLeft);
            }
            if (retryInterval > 0) {
                await OJB_delay(retryInterval);
            }
        }
    }
}

/**
 * 自定义错误类，以区分不同的错误类型
 */
class GMError extends Error {
    constructor(type, message, originalError) {
        super(message);
        this.name = 'GMError';
        this.type = type;
        this.stack = originalError.stack;
        Object.assign(this, originalError);
    }
}

/**
 * GM_xmlhttpRequest 的 Promise 封装
 * @param {Object} options GM_xmlhttpRequest 的参数
 * @param {Boolean} isStream 是否为流式请求
 * @returns {Promise} 返回 Promise
 */
function OJB_GMRequest(options, isStream = false) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            ...options,
            ...(isStream ? {
                onloadstart: resolve
            } : {
                onload: resolve
            }),
            onerror: (error) => reject(new GMError('error', 'An error occurred during the request.', error)),
            ontimeout: (error) => reject(new GMError('timeout', 'The request timed out.', error)),
            onabort: (error) => reject(new GMError('abort', 'The request was aborted.', error)),
        });
    });
}

/**
 * 获取cookie
 * @param {string} name cookie名称
 * @returns {string} cookie值
 */
function OJB_getCookie(name) {
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

/**
 * 随机数生成
 * @param {number} numDigits 位数
 * @returns {number}
 */
function OJB_getRandomNumber(numDigits) {
    let min = Math.pow(10, numDigits - 1);
    let max = Math.pow(10, numDigits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 防抖函数
 * @param {Function} callback 回调函数
 * @returns {Function}
 */
function OJB_debounce(callback) {
    let timer;
    let immediateExecuted = false;
    const delay = 500;
    return function () {
        clearTimeout(timer);
        if (!immediateExecuted) { callback.call(this); immediateExecuted = true; }
        timer = setTimeout(() => { immediateExecuted = false; }, delay);
    };
}

/**
 * 为元素添加鼠标拖拽支持
 * @param {JQuery<HTMLElement>} element 要添加拖拽支持的元素
 * @returns {void}
 */
function OJB_addDraggable(element) {
    let isDragging = false;
    let x, y, l, t, nl, nt;
    let isSpecialMouseDown = false; // 选取某些元素时不拖动

    element.on('mousedown', function (e) {
        isSpecialMouseDown = $(e.target).is('label, p, input, textarea, span, select, details, summary');
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

/**
 * 切换元素的折叠/展开过渡动画
 * @param {HTMLElement} element
 */
function OJB_toggleCollapseExpand(element) {
    // 设置transitionend事件监听器的函数
    const setTransitionListener = (listener) => {
        const listenerName = `transitionEndListener${Date.now()}`;
        window[listenerName] = listener;
        element.addEventListener('transitionend', listener);
        element.setAttribute('data-transition-end-listener', listenerName);
    };

    // 移除事件监听器的函数
    const removeTransitionListener = () => {
        const transitionEndListenerName = element.getAttribute('data-transition-end-listener');
        if (transitionEndListenerName) {
            element.removeEventListener('transitionend', window[transitionEndListenerName]);
            element.removeAttribute('data-transition-end-listener');
        }
    };

    const collapsed = element.getAttribute('data-collapsed') === 'true';
    const sectionHeight = element.scrollHeight;

    // 移除事件监听器
    removeTransitionListener();

    // 设置初始样式
    element.style.overflow = 'hidden';
    element.style.transition = 'height 0.3s ease-out 0s';
    element.style.height = collapsed ? `0px` : `${sectionHeight}px`;
    element.style.opacity = collapsed ? '' : '1';

    // 需要立即开始动画
    requestAnimationFrame(() => {
        // 设置结束样式
        element.style.height = collapsed ? `${sectionHeight}px` : `0px`;
    });

    const transitionEndListener = (event) => {
        if (event.propertyName === 'height') {
            if (collapsed) {
                // 展开后的设置
                element.style.height = '';
                element.style.overflow = '';
            } else {
                // 折叠后的设置
                element.style.opacity = '0';
            }
            removeTransitionListener();
        }
    };

    setTransitionListener(transitionEndListener);

    // 更新data-collapsed属性
    element.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
}

/**
 * 获取外部JSON并转换为Object
 * @param {string} url JSON Url
 * @returns {Promise<Object>} JSON Object
 */
async function OJB_getExternalJSON(url) {
    const response = await OJB_GMRequest({
        method: "GET",
        url: url
    });
    try {
        return JSON.parse(response.responseText);
    } catch (e) {
        throw new Error(`JSON parse error\n${e}`);
    }
}

/**
 * 创建确认对话框dialog
 * @param {string} title 标题
 * @param {string} content 内容
 * @param {string[]} buttons 按钮 (取消 确定) 可以为null
 * @param {boolean} renderMarkdown 是否使用markdown渲染文本
 * @returns {Promise<boolean>} 用户点击了确定按钮返回true, 否则返回false
 */
function OJB_createDialog(title, content, buttons, renderMarkdown = false) {
    return new Promise(resolve => {
        let contentHtml = content;

        if (renderMarkdown) {
            const md = window.markdownit();
            contentHtml = md.render(content);
        }

        const dialog = $(`
        <dialog class="OJBetter_modal">
            <h2>${title}</h2>
            <div class="content">${contentHtml}</div>
        </dialog>
        `);
        const buttonbox = $(`<div class="buttons"></div>`);
        const cancelButton = $(`<button class="cancelButton">${buttons[0]}</button>`)
            .addClass("secondary");
        const continueButton = $(`<button class="continueButton">${buttons[1]}</button>`);
        if (buttons[0] !== null) buttonbox.append(cancelButton);
        if (buttons[1] !== null) buttonbox.append(continueButton);
        dialog.append(buttonbox);
        $('body').before(dialog);

        OJB_showModal(dialog);
        OJB_addDraggable(dialog);

        continueButton.click(function () {
            OJB_closeAndRemoveModal(dialog);
            resolve(true);
        });

        cancelButton.click(function () {
            OJB_closeAndRemoveModal(dialog);
            resolve(false);
        });
    });
}

/**
 * 显示模态对话框并阻止页面滚动，同时考虑滚动条宽度变化和原始marginRight
 * @param {JQuery<HTMLElement>} element
 */
function OJB_showModal(element) {
    const dialog = element.get(0);
    dialog.showModal();
    OJBetter.state.openDialogCount++;

    if (OJBetter.state.openDialogCount === 1) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        // 获取原始的body marginRight，考虑到可能的非数字值，比如auto
        const originalMarginRight = window.getComputedStyle(document.body).marginRight;
        const marginRightValue = parseFloat(originalMarginRight) || 0; // 将非数字值转换为0

        if (scrollbarWidth > 0) {
            // 保存原始的marginRight，并设置新的值以补偿滚动条宽度
            document.body.style.setProperty('--original-margin-right', originalMarginRight);
            document.body.style.marginRight = `${marginRightValue + scrollbarWidth}px`;
        }

        // 保存原始的overflow样式
        document.body.setAttribute('data-original-overflow', document.body.style.overflow);
        document.body.style.overflow = 'hidden';
    }

    const allowScrollIfNeeded = () => {
        OJBetter.state.openDialogCount--;
        if (OJBetter.state.openDialogCount === 0) {
            // 恢复原始的body marginRight和overflow样式
            const originalMarginRight = document.body.style.getPropertyValue('--original-margin-right');
            document.body.style.marginRight = originalMarginRight;
            document.body.style.removeProperty('--original-margin-right');

            const originalOverflow = document.body.getAttribute('data-original-overflow');
            document.body.style.overflow = originalOverflow;
            document.body.removeAttribute('data-original-overflow');
        }
    };

    dialog.addEventListener('close', allowScrollIfNeeded);
}

/**
 * 关闭并移除模态对话框
 * @param {JQuery<HTMLElement>} element
 */
function OJB_closeAndRemoveModal(element) {
    const dialog = element.get(0);
    dialog.close();
    dialog.remove();
}

/**
 * 关闭并移除模态对话框
 * @param {JQuery<HTMLElement>} element
 */
function OJB_closeModal(element) {
    const dialog = element.get(0);
    dialog.close();
}

/**
 * 清除i18next的缓存数据并刷新
 */
function clearI18nextCache() {
    Object.keys(localStorage)
        .filter(key => key.startsWith('i18next_res_'))
        .forEach(key => localStorage.removeItem(key));
    window.location.reload();
}

/**
 * 更新检查
 */
async function checkScriptVersion() {
    try {
        const versionResponse = await OJB_GMRequest({
            method: "GET",
            url: "https://aowuucdn.oss-accelerate.aliyuncs.com/script/versions.json",
            timeout: 10 * 1e3,
            nocache: true
        });
        const versionData = JSON.parse(versionResponse.responseText);
        const { 'codeforces-better': { dev: version_dev, release: version_release } } = versionData;
        const baseUrls = {
            greasyfork: 'https://update.greasyfork.org/scripts/465777/Codeforces%20Better%21.user.js',
            github: `https://github.com/beijixiaohu/OJBetter/raw/main/script/${OJBetter.about.updateChannel}/codeforces-better.user.js`,
            aliyunoss: `https://aowuucdn.oss-accelerate.aliyuncs.com/script/${OJBetter.about.updateChannel}/codeforces-better.user.js`
        };
        /** @type {string} 更新跳转url */
        const updateUrl = baseUrls[OJBetter.about.updateSource];
        /** @type {string} 是否暂时跳过cookie */
        const skipUpdate = OJB_getCookie("skipUpdate");
        /** @type {string} 当前更新频道的最新版本 */
        const version = OJBetter.about.updateChannel == "release" ? version_release : version_dev;
        if (OJB_compareVersions(version, OJBetter.state.version) === 1 && skipUpdate !== "true") {
            const updateConfirmed = await OJB_createDialog(
                i18next.t('update.title', { ns: 'dialog', scriptName: OJBetter.state.name }),
                i18next.t('update.content', { ns: 'dialog', oldVersion: OJBetter.state.version, newVersion: version }),
                [
                    i18next.t('update.buttons.0', { ns: 'dialog' }),
                    i18next.t('update.buttons.1', { ns: 'dialog' })
                ],
                true
            );

            if (updateConfirmed) {
                window.location.href = updateUrl;
            } else {
                document.cookie = "skipUpdate=true; expires=session; path=/";
            }
        }
    } catch (error) {
        console.error("Update check failed: ", error);
    }
}

/**
 * 提示信息类
 */
class LoadingMessage {
    constructor() {
        this._statusElement = null;
        this._isDisplayed = false;
        this.init();
    }

    /**
     * 初始化加载提示信息
     */
    init() {
        this._statusElement = this.createStatusElement();
        this.insertStatusElement();
    }

    /**
     * 创建提示信息元素
     */
    createStatusElement() {
        const statusElement = $("<div></div>").addClass("alert OJBetter_alert")
            .css({
                "margin": "1em",
                "text-align": "center",
                "position": "relative"
            }).hide();
        return statusElement;
    }

    /**
     * 插入提示信息
     * @returns {void}
     */
    insertStatusElement() {
        (OJBetter.typeOfPage.is_mSite ? $("header") : $(".menu-box:first").next()).after(this._statusElement);
    }

    /**
     * 显示提示信息
     */
    showStatus() {
        this._statusElement.show();
        this._isDisplayed = true;
    }

    /**
     * 隐藏提示信息
     */
    hideStatus() {
        this._statusElement.fadeOut(500);
        this._isDisplayed = false;
    }

    /**
     * 移除提示信息
     */
    removeStatus() {
        this._statusElement.remove();
        this._isDisplayed = false;
    }

    /**
     * 更新提示信息
     * @param {string} text 提示信息文本
     * @param {string} type 提示信息类型，可选值：info, success, warning, error
     * @param {number} timeout 提示信息显示的持续时间（毫秒）, 默认为无限长
     */
    updateStatus(text, type = 'info', timeout = Infinity, isMarkdown = false) {
        if (isMarkdown) {
            var md = window.markdownit({
                html: !is_escapeHTML,
            });
            text = md.render(text);
        }
        this._statusElement.html(text).removeClass("alert-info alert-success alert-warning alert-error").addClass(`alert-${type}`);
        if (!this._isDisplayed) {
            this.showStatus();
        }
        if (timeout !== Infinity) {
            setTimeout(() => {
                this.hideStatus();
            }, timeout);
        }
    }
}

/**
 * 获取网站本地化的数据
 * @param {*} localizationLanguage 本地化语言
 * @returns {Promise<Object>} 本地化数据
 */
async function getLocalizeWebsiteJson(localizationLanguage) {
    let data = await OJBetter.common.database.localizeSubsData.get(localizationLanguage);
    let url = localizationLanguage === "zh" ?
        "https://aowuucdn.oss-accelerate.aliyuncs.com/resources/subs/Codeforces-subs.json" :
        `https://aowuucdn.oss-accelerate.aliyuncs.com/i18n/${localizationLanguage}/resources/subs/Codeforces-subs.json`;
    if (data) data = data.data;
    if (!data) {
        // 如果本地没有数据，从远端获取并保存
        data = await OJB_getExternalJSON(url);
        await OJBetter.common.database.localizeSubsData.put({ lang: localizationLanguage, data: data });
    } else {
        // 如果本地有数据，先返回旧数据，然后在后台更新
        (async () => {
            try {
                const newData = await OJB_getExternalJSON(url);
                await OJBetter.common.database.localizeSubsData.put({ lang: localizationLanguage, data: newData });
            } catch (error) {
                console.error('Failed to update localization data:', error);
            }
        })();
    }
    return data;
}

/**
 * 网站本地化替换
 * @returns 
 */
async function localizeWebsite() {
    if (OJBetter.localization.websiteLang === "initial") return;

    // 设置网页语言
    var htmlTag = document.getElementsByTagName("html")[0];
    htmlTag.setAttribute("lang", OJBetter.localization.websiteLang);

    // 获取网站本地化的数据
    var subs = await getLocalizeWebsiteJson(OJBetter.localization.websiteLang);

    /**
     * 文本节点遍历替换
     * @param {JQuery} $nodes jQuery对象
     * @param {Object} textReplaceRules 文本替换规则对象
     */
    function traverseTextNodes($nodes, textReplaceRules) {
        if (!$nodes) return;

        $nodes.each(function () {
            let node = this;
            if (node.nodeType === Node.TEXT_NODE) {
                Object.keys(textReplaceRules).forEach(match => {
                    const replace = textReplaceRules[match];
                    const regex = new RegExp(match, 'g');
                    node.textContent = node.textContent.replace(regex, replace);
                });
            } else {
                $(node).contents().each(function () {
                    traverseTextNodes($(this), textReplaceRules);
                });
            }
        });
    }

    /**
     * value替换
     * @param {JQuery} $nodes jQuery对象
     * @param {Object} valueReplaceRules 值替换规则对象
     */
    function traverseValueNodes($nodes, valueReplaceRules) {
        if (!$nodes) return;

        $nodes.each(function () {
            let $node = $(this);
            if ($node.is('[value]')) {
                Object.keys(valueReplaceRules).forEach(match => {
                    const replace = valueReplaceRules[match];
                    const regex = new RegExp(match, 'g');
                    let currentValue = $node.val();
                    let newValue = currentValue.replace(regex, replace);
                    $node.val(newValue);
                });
            } else {
                $node.children().each(function () {
                    traverseValueNodes($(this), valueReplaceRules);
                });
            }
        });
    }

    /**
     * 严格的文本节点遍历替换
     * @param {JQuery} $node jQuery对象
     * @param {Object} textReplaceRules 文本替换规则对象
     */
    function strictTraverseTextNodes($nodes, textReplaceRules) {
        if (!$nodes) return;

        $nodes.each(function () {
            let $node = $(this);
            if ($node.nodeType === Node.TEXT_NODE) {
                const trimmedNodeText = $node.textContent.trim();
                Object.keys(textReplaceRules).forEach(match => {
                    if (trimmedNodeText === match) {
                        $node.textContent = textReplaceRules[match];
                    }
                });
            } else {
                $($node).contents().each(function () {
                    strictTraverseTextNodes($(this), textReplaceRules);
                });
            }
        });
    }

    /**
     * 应用文本替换
     */
    let commonReplacements = subs.commonReplacements;
    Object.entries(commonReplacements).forEach(([key, value]) => {
        const classSelectors = Array.isArray(value.class) ? value.class : [value.class]; // 兼容，class的值可以为数组或者字符串
        classSelectors.forEach(classSelector => {
            if (value.isStrict) {
                strictTraverseTextNodes($(`${classSelector}`), value.rules);
            } else {
                traverseTextNodes($(`${classSelector}`), value.rules);
            }
        });
    });

    // 测试
    {
        // var translations = {
        //     
        // };
        // traverseTextNodes($('xxx'), translations);
    };

    /**
     * 应用value替换
     */
    let InputValueReplacements = subs.InputValueReplacements;
    Object.entries(InputValueReplacements).forEach(([key, value]) => {
        const classSelectors = Array.isArray(value.class) ? value.class : [value.class];
        classSelectors.forEach(classSelector => {
            traverseValueNodes($(`${classSelector}`), value.rules);
        });
    });

    // 杂项
    (function () {
        // 选项汉化input[type="radio"]
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

    // 轻量站特殊
    if (OJBetter.typeOfPage.is_mSite) {
        traverseTextNodes($('nav'), commonReplacements['.second-level-menu']['rules']);
    }
    if (OJBetter.typeOfPage.is_mSite) {
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

/**
 * i18next初始化
 */
async function initI18next() {
    return new Promise((resolve, reject) => {
        i18next
            .use(i18nextChainedBackend)
            .init({
                lng: OJBetter.localization.scriptLang,
                ns: ['common', 'settings', 'config', 'dialog', 'alert', 'translator',
                    'button', 'codeEditor', 'comments', 'announce', 'logMessage'], // 命名空间列表
                defaultNS: 'settings',
                fallbackLng: ['zh', OJBetter.translation.targetLang],
                load: 'currentOnly',
                debug: false,
                backend: {
                    backends: [
                        i18nextLocalStorageBackend,
                        i18nextHttpBackend
                    ],
                    backendOptions: [{
                        prefix: 'i18next_res_',
                        expirationTime: 7 * 24 * 60 * 60 * 1000,
                        defaultVersion: `v${OJBetter.state.version}`,
                        store: typeof window !== 'undefined' ? window.localStorage : null
                    }, {
                        /* options for secondary backend */
                        loadPath: (lng, ns) => {
                            if (lng[0] === 'zh' || lng[0] === 'zh-Hans') {
                                return `https://aowuucdn.oss-accelerate.aliyuncs.com/resources/locales/Codeforces/${ns}.json`;
                            }
                            return `https://aowuucdn.oss-accelerate.aliyuncs.com/i18n/${lng}/resources/locales/Codeforces/${ns}.json`;
                        }
                    }]
                }
            }, (err, t) => {
                if (err) {
                    reject(err);
                } else {
                    jqueryI18next.init(i18next, $);
                    resolve(t);
                }
            });
    });
};

/**
 * 抽象命令类
 */
class Command {
    execute() { }
    undo() { }
}

/**
 * 命令调用者
 */
class CommandInvoker {
    constructor() {
        this.history = [];
    }

    /**
     * 执行命令
     * @param {Command} command 命令对象
     */
    execute(command) {
        this.history.push(command);
        command.execute();
    }

    /**
     * 撤销命令
     */
    undo() {
        const command = this.history.pop();
        if (command) {
            command.undo();
        }
    }
}

/**
 * 接收者
 */
class DOMContainer {
    /**
     * @param {JQueryObject} element 容器对象
     */
    constructor(element) {
        this.containerElement = element;
    }

    /**
     * 添加元素
     * @param {JQueryObject} element 元素对象
     * @returns {JQueryObject} 添加的元素对象
     */
    add(element) {
        this.containerElement.append(element);
        return this.containerElement.children().last();
    }

    /**
     * 删除元素
     * @param {JQueryObject} element 元素对象
     */
    remove(element) {
        $(element).remove();
    }
}

/**
 * 具体命令类：添加元素
 */
class AddElementCommand extends Command {
    /**
     * @param {DOMContainer} receiver 接收者
     * @param {JQueryObject} element 元素对象
     */
    constructor(receiver, element) {
        super();
        this.receiver = receiver;
        this.element = element;
        this.addedElement = null;
    }

    execute() {
        this.addedElement = this.receiver.add(this.element);
    }

    undo() {
        if (this.addedElement) {
            this.receiver.remove(this.addedElement);
        }
    }
}

/**
 * 具体命令类：删除元素
 */
class RemoveElementCommand extends Command {
    /**
     * @param {DOMContainer} receiver 接收者
     * @param {JQueryObject} element 元素对象
     */
    constructor(receiver, element) {
        super();
        this.receiver = receiver;
        this.element = element;
        this.parent = $(element).parent();
        this.nextSibling = $(element).next();
    }

    execute() {
        this.receiver.remove(this.element);
    }

    undo() {
        if (this.nextSibling.length > 0) {
            $(this.element).insertBefore(this.nextSibling);
        } else {
            this.parent.append(this.element);
        }
    }
}

/**
 * 验证器
 */
class Validator {
    /**
     * 表单必填项空值校验
     */
    static required(structure) {
        let config = {};
        let allFieldsValid = true;
        for (const key in structure) {
            let value = key.type == 'checkbox' ?
                $(key).prop("checked") : $(key).val();

            config[structure[key].value] = value;

            if (value || structure[key].require === false) {
                $(key).removeClass('is_null');
            } else {
                $(key).addClass('is_null');
                allFieldsValid = false;
            }
        }
        return {
            valid: allFieldsValid,
            config: config
        };
    }

    /**
     * 表单合法性校验
     */
    static checkKeyValuePairs(structure, config) {
        let errorKeys = [];
        let allFieldsValid = true;

        for (const key in structure) {
            const { check, value } = structure[key];
            const fieldValue = config[value];

            // 如果字段没有值或校验类型不匹配，则跳过当前迭代
            if (!fieldValue) continue;

            let isValid = true;
            switch (check) {
                case 'keyValuePairs':
                    isValid = Validator.keyValuePairs(fieldValue);
                    break;
                case 'dotSeparatedPath':
                    isValid = Validator.validateDotSeparatedPath(fieldValue);
                    break;
                default:
                    // 没有匹配的校验类型
                    continue;
            }

            Validator.toggleErrorDisplay(key, isValid);
            if (!isValid) {
                allFieldsValid = false;
                errorKeys.push(key);
            }
        }

        return {
            valid: allFieldsValid,
            errorKeys: errorKeys
        };
    }

    /**
     * 切换错误信息的显示和隐藏
     * @param {string} key - 字段的键
     * @param {boolean} isValid - 字段值是否有效
     */
    static toggleErrorDisplay(key, isValid) {
        const errorMessage = i18next.t('common.unValid', { ns: 'settings' });
        const $errorSpan = $(key).prev('span.text-error');
        if (!isValid) {
            if (!$errorSpan.length) {
                $(key).before(`<span class="text-error" style="color: red;">${errorMessage}</span>`);
            }
        } else {
            $errorSpan.remove();
        }
    }

    /**
     * 键值对合法性校验
     * @param {string} value
     * @returns {boolean}
     */
    static keyValuePairs(value) {
        const keyValuePairs = value.split('\n');
        // 允许值中包含空格和冒号
        const regex = /^[a-zA-Z0-9_-]+\s*:\s*.+$/;
        return keyValuePairs.every(pair => regex.test(pair));
    }


    /**
     * 点分隔符路径格式校验，允许加减运算
     * @param {string} path
     * @returns {boolean}
     */
    static validateDotSeparatedPath(path) {
        // 正则表达式允许标识符之间有点号，标识符可以包含加减运算
        const regex = /^([a-zA-Z0-9_-]+(\s*[\+\-]\s*[a-zA-Z0-9_-]+)*\.)*([a-zA-Z0-9_-]+(\s*[\+\-]\s*[a-zA-Z0-9_-]+)*)$/;
        return regex.test(path);
    }
}

/**
 * 配置管理
 */
class ConfigManager {
    /**
     * @param {HTMLElement} element - 挂载容器
     * @param {string} prefix - 前缀
     * @param {object} tempConfig - 配置内容
     * @param {object} structure - 配置结构
     * @param {object} configHTML - 配置编辑页面HTML
     * @param {boolean} allowChoice - 是否允许选择列表项
     */
    constructor(element, prefix, tempConfig, structure, configHTML, allowChoice = true) {
        /** @param 设置面板DIV */
        this.settingMenuDiv = $('#OJBetter_setting_menu');
        this.element = $(element);
        this.prefix = prefix;
        this.tempConfig = tempConfig;
        this.structure = structure;
        this.configHTML = configHTML;
        this.allowChoice = allowChoice;

        this.controlTip = null;
        this.config_bar_list = null;
        this.config_bar_ul = null;
        this.config_add_button = null;
        this.menu = null;
        this.editItem = null;
        this.deleteItem = null;

        // 绑定方法
        this.onAdd = this.onAdd.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.createListItemElement = this.createListItemElement.bind(this);

        this.lastItemId = 0; // 列表中当前最后一个元素的id号
        this.init();
    }

    init() {
        this.createControlBar();
        this.createContextMenu();
        this.renderList();
    }

    /**
     * 创建控制栏
     */
    createControlBar() {
        this.controlTip = $(`<div id='${this.prefix}configControlTip' style='color:red;'></div>`);
        this.config_bar_list = $(`<div class='config_bar_list' id='${this.prefix}config_bar_list'></div>`);
        this.config_bar_ul = $(`<ul class='config_bar_ul' id='${this.prefix}config_bar_ul'></ul>`);
        this.element.append(this.controlTip);
        this.element.append(this.config_bar_list);
        this.config_bar_list.append(this.config_bar_ul);
    }

    /**
     * 创建右键菜单
     */
    createContextMenu() {
        const menu = $(`<div id='config_bar_menu' style='display: none;'></div>`);
        const editItem = $(`
        <div class='config_bar_menu_item' id='config_bar_menu_edit'>
            ${i18next.t('contextMenu.edit', { ns: 'translator' })}
        </div>`);
        const deleteItem = $(`
        <div class='config_bar_menu_item' id='config_bar_menu_delete'>
            ${i18next.t('contextMenu.delete', { ns: 'translator' })}
        </div>`);
        menu.append(editItem);
        menu.append(deleteItem);
        this.editItem = editItem;
        this.deleteItem = deleteItem;
        this.menu = menu;
        this.settingMenuDiv.append(menu);
    }

    /**
     * 关闭右键菜单
     */
    closeContextMenu() {
        this.menu.css({ display: "none" });
    }

    /**
     * 创建列表项
     * @param {string} text - 列表项文本
     * @returns {HTMLElement} - 列表项
     */
    createListItemElement(text) {
        const id = OJB_getRandomNumber(4);
        const li = $("<li></li>");
        const radio = $(`<input type='radio' name='${this.prefix}config_item'></input>`)
            .attr("value", text)
            .attr("id", id)
            .attr("prev_id", this.lastItemId)
            .appendTo(li);
        if (!this.allowChoice) {
            radio.prop("disabled", true);
        }
        const label = $(`<label for='${id}' class='config_bar_ul_li_text'>${text}</label>`).appendTo(li);


        this.lastItemId = id;

        // 添加右键菜单
        li.on("contextmenu", (event) => {
            event.preventDefault();
            this.menu.css({
                display: "block",
                left: event.pageX, top: event.pageY
            });

            const deleteItem = this.deleteItem;
            const editItem = this.editItem;

            // 移除旧事件
            deleteItem.off("click");
            editItem.off("click");

            // 获取 li 在 ul 中的索引
            const index = li.index();

            deleteItem.on("click", () => this.onDelete(index, li));
            editItem.on("click", () => this.onEdit(index, li));

            $(document).one("click", (event) => {
                if (!this.menu.get(0).contains(event.target)) {
                    this.closeContextMenu();
                    deleteItem.off("click", () => this.onDelete);
                    editItem.off("click", () => this.onEdit);
                }
            });
        });

        return li;
    }

    /**
     * 渲染配置列表
     */
    renderList() {
        const list = this.config_bar_ul;
        list.empty(); // 清空
        this.tempConfig.configurations.forEach((item) => {
            list.append(this.createListItemElement(item['name']));
        });

        // 添加按钮
        let addButton = $(`<li id='${this.prefix}add_button' class="tempConfig_add_button">
            <span>+ ${i18next.t('add', { ns: 'common' })}</span>
        </li>`);
        this.config_add_button = addButton;
        list.append(addButton);
        addButton.on("click", this.onAdd);
    }

    /**
     * 添加配置项
     */
    onAdd() {
        const configMenu = this.createConfigHTML();
        const structure = this.structure;

        configMenu.on("click", "#tempConfig_save", () => {

            // 检查必填字段
            const { valid, config } = Validator.required(structure);
            if (!valid) return;

            // 检查键值对
            const { valid: checkOk, errorKey } = Validator.checkKeyValuePairs(structure, config);
            if (!checkOk) return;

            this.tempConfig.configurations.push(config);

            this.createListItemElement(config.name).insertBefore(this.config_add_button);

            configMenu.remove();
        });

        configMenu.on("click", ".btn-close", () => {
            configMenu.remove();
        });
    }

    /**
     * 修改配置项
     * @param {number} index - 配置项索引
     * @param {HTMLElement} li - 配置项
     * @returns {void}
     */
    onEdit(index, li) {
        const configMenu = this.createConfigHTML();
        const structure = this.structure;

        this.closeContextMenu();

        // 填充表单
        for (const [key, { value, type }] of Object.entries(this.structure)) {
            const configValue = this.tempConfig.configurations[index][value];
            const $element = $(key);
            if (type === 'checkbox') {
                $element.prop("checked", configValue);
            } else {
                $element.val(configValue);
            }
        }

        configMenu.on("click", "#tempConfig_save", () => {
            // 检查必填字段
            const { valid, config } = Validator.required(structure);
            if (!valid) return;

            // 检查键值对
            const { valid: checkOk, errorKey } = Validator.checkKeyValuePairs(structure, config);
            if (!checkOk) return;

            // 更新配置
            this.tempConfig.configurations[index] = config;
            li.find('label').text(config.name);

            OJB_closeAndRemoveModal(configMenu);
        });

        configMenu.on("click", ".btn-close", () => {
            OJB_closeAndRemoveModal(configMenu);
        });
    }

    /**
     * 删除配置项
     * @param {number} index - 配置项索引
     * @param {HTMLElement} li - 配置项
     * @returns {void}
     */
    onDelete(index, li) {
        this.closeContextMenu();
        this.tempConfig.configurations.splice(index, 1);
        li.remove();
    }

    /**
     * 创建配置编辑页面
     * @returns {JQuery<HTMLElement>} 返回配置编辑页面
     */
    createConfigHTML() {
        const configMenu = $(this.configHTML);
        this.settingMenuDiv.after(configMenu);
        OJB_showModal(configMenu);
        OJB_addDraggable(configMenu);
        elementLocalize(configMenu);
        return configMenu;
    }

    /**
     * 获取配置内容
     * @returns {object} - 配置内容
     */
    getTempConfig() {
        return this.tempConfig;
    }

    /**
     * 注册列表项选中改变监听
     */
    registerChoiceChange() {
        this.config_bar_ul.on("change", "input[type='radio']", (event) => {
            const value = event.target.value;
            this.tempConfig.choice = value;
        });
    }
}

const OJBetter_setting_sidebar_HTML = `
<div class="OJBetter_setting_sidebar">
    <ul>
        <li><a href="#basic-settings" id="sidebar-basic-settings" class="active" data-i18n="settings:sidebar.basic"></a></li>
        <li><a href="#l10n_settings" id="sidebar-l10n_settings" data-i18n="settings:sidebar.localization"></a></li>
        <li><a href="#translation-settings" id="sidebar-translation-settings" data-i18n="settings:sidebar.translation"></a></li>
        <li><a href="#clist_rating-settings" id="sidebar-clist_rating-settings" data-i18n="settings:sidebar.clist"></a></li>
        <li><a href="#code_editor-settings" id="sidebar-code_editor-settings" data-i18n="settings:sidebar.monaco"></a></li>
        <li><a href="#preference-settings" id="sidebar-preference-settings" data-i18n="settings:sidebar.preference"></a></li>
        <li><a href="#dev-settings" id="sidebar-dev-settings" data-i18n="settings:sidebar.dev"></a></li>
        <li><a href="#about-settings" id="sidebar-about-settings" data-i18n="settings:sidebar.about"></a></li>
    </ul>
</div>
`;

const basic_settings_HTML = `
<div id="basic-settings" class="settings-page active">
    <h3 data-i18n="settings:basic.title"></h3>
    <hr>
    <div class='OJBetter_setting_list' style="padding: 0px 10px;">
        <span id="darkMode_span" data-i18n="settings:basic.darkMode.name"></span>
        <div class="dark-mode-selection">
            <label>
                <input class="radio-input" type="radio" name="darkMode" value="dark" />
                <span class="OJBetter_setting_menu_label_text"
                    data-i18n="settings:basic.darkMode.options.dark"></span>
                <span class="radio-icon"> </span>
            </label>
            <label>
                <input checked="" class="radio-input" type="radio" name="darkMode" value="light" />
                <span class="OJBetter_setting_menu_label_text"
                    data-i18n="settings:basic.darkMode.options.light"></span>
                <span class="radio-icon"> </span>
            </label>
            <label>
                <input class="radio-input" type="radio" name="darkMode" value="follow" />
                <span class="OJBetter_setting_menu_label_text"
                    data-i18n="settings:basic.darkMode.options.system"></span>
                <span class="radio-icon"> </span>
            </label>
        </div>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="expandFoldingblocks" data-i18n="settings:basic.expandBlocks"></label>
        <input type="checkbox" id="expandFoldingblocks" name="expandFoldingblocks">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="renderPerfOpt" data-i18n="settings:basic.renderOptimization.label"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:basic.renderOptimization.helpText"></div>
        </div>
        <input type="checkbox" id="renderPerfOpt" name="renderPerfOpt">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="commentPaging" data-i18n="settings:basic.paging.label"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:basic.paging.helpText"></div>
        </div>
        <input type="checkbox" id="commentPaging" name="commentPaging">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="showJumpToLuogu" data-i18n="settings:basic.luoguJump.label"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:basic.luoguJump.helpText"></div>
        </div>
        <input type="checkbox" id="showJumpToLuogu" name="showJumpToLuogu">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="standingsRecolor" data-i18n="settings:basic.recolor.label"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:basic.recolor.helpText"></div>
        </div>
        <input type="checkbox" id="standingsRecolor" name="standingsRecolor">
    </div>
</div>
`;

const l10n_settings_HTML = `
<div id="l10n_settings" class="settings-page">
    <h3 data-i18n="settings:localization.title"></h3>
    <hr>
    <div class='OJBetter_setting_list'>
        <label for="scriptL10nLanguage" style="display: flex;" data-i18n="settings:localization.scriptLanguageLabel"></label>
        <select id="scriptL10nLanguage" name="scriptL10nLanguage">
            <option value="zh">简体中文</option>
            <option value="zh-Hant">繁體中文</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="ko">한국어</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="hi">हिन्दी</option>
        </select>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="localizationLanguage" style="display: flex;" data-i18n="settings:localization.websiteLanguageLabel"></label>
        <select id="localizationLanguage" name="localizationLanguage">
            <option value="initial">——</option>
            <option value="zh">简体中文</option>
            <option value="zh-Hant">繁體中文</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="ko">한국어</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="hi">हिन्दी</option>
        </select>
    </div>
    <div class='OJBetter_setting_list alert_tip'>
        <div data-i18n="[html]settings:localization.notice.1"></div>
    </div>
    <div class='OJBetter_setting_list alert_tip'>
        <div data-i18n="[html]settings:localization.notice.2"></div>
    </div>
</div>
`;

const translation_settings_HTML = `
<div id="translation-settings" class="settings-page">
    <h3 data-i18n="settings:translation.title"></h3>
    <hr>
    <h4 data-i18n="settings:translation.options.title"></h4>
    <div class='OJBetter_setting_list'>
        <label for="transTargetLang" style="display: flex;" data-i18n="settings:translation.preference.target.title"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.preference.target.helpText"></div>
        </div>
        <select id="transTargetLang" name="transTargetLang">
            <option value="zh">简体中文</option>
            <option value="zh-Hant">繁體中文</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="ko">한국어</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="hi">हिन्दी</option>
        </select>
    </div>
    <div id="translationServices">
        <label>
            <input type='radio' name='translation' value='deepl'>
            <span class='OJBetter_setting_menu_label_text'
                data-i18n="settings:translation.options.services.deepl"></span>
        </label>
        <label>
            <input type='radio' name='translation' value='iflyrec'>
            <span class='OJBetter_setting_menu_label_text'
                data-i18n="settings:translation.options.services.iflyrec"></span>
        </label>
        <label>
            <input type='radio' name='translation' value='youdao'>
            <span class='OJBetter_setting_menu_label_text'
                data-i18n="settings:translation.options.services.youdao"></span>
        </label>
        <label>
            <input type='radio' name='translation' value='google'>
            <span class='OJBetter_setting_menu_label_text'
                data-i18n="settings:translation.options.services.google"></span>
        </label>
        <label>
            <input type='radio' name='translation' value='caiyun'>
            <span class='OJBetter_setting_menu_label_text'
                data-i18n="settings:translation.options.services.caiyun"></span>
        </label>
        <label>
            <input type='radio' name='translation' value='openai'>
            <span class='OJBetter_setting_menu_label_text'
                data-i18n="settings:translation.options.services.openai.name">
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text"
                        data-i18n="[html]settings:translation.options.services.openai.helpText"></div>
                </div>
            </span>
        </label>
    </div>
    <hr>
    <h4>DeepL</h4>
    <div class='OJBetter_setting_list'>
        <label for="deepl_type" style="display: flex;" data-i18n="settings:translation.deepl.mode.title"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.deepl.mode.helpText"></div>
        </div>
        <select id="deepl_type" name="deepl_type">
            <option value="free" data-i18n="settings:translation.deepl.mode.select.free"></option>
            <option value="api" data-i18n="settings:translation.deepl.mode.select.api"></option>
        </select>
    </div>
    <div id="deepl_config" class="config"></div>
    <div class='OJBetter_setting_list'>
        <label for="enableEmphasisProtection" data-i18n="settings:translation.deepl.enableEmphasisProtection.title"></label>
        <div class="help_tip" style="margin-right: initial;">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.deepl.enableEmphasisProtection.helpText"></div>
        </div>
        <div class="badge">Official API Only</div>
        <input type="checkbox" id="enableEmphasisProtection" name="enableEmphasisProtection">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="enableLinkProtection" data-i18n="settings:translation.deepl.enableLinkProtection.title"></label>
        <div class="help_tip" style="margin-right: initial;">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.deepl.enableLinkProtection.helpText"></div>
        </div>
        <div class="badge">Official API Only</div>
        <input type="checkbox" id="enableLinkProtection" name="enableLinkProtection">
    </div>
    <hr>
    <h4>ChatGPT</h4>
    <div id="chatgpt_config" class="config"></div>
    <div class='OJBetter_setting_list'>
        <label for="openai_isStream" data-i18n="settings:translation.chatgpt.isStream.name"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.chatgpt.isStream.helpText"></div>
        </div>
        <input type="checkbox" id="openai_isStream" name="openai_isStream">
    </div>
    <hr>
    <h4 data-i18n="settings:translation.preference.title"></h4>
    <div class='OJBetter_setting_list'>
        <label for="comment_translation_choice" style="display: flex;"
            data-i18n="settings:translation.preference.comment_translation_choice.title">
        </label>
        <select id="comment_translation_choice" name="comment_translation_choice">
            <option value="0" data-i18n="settings:translation.preference.comment_translation_choice.services.follow"></option>
            <option value="deepl" data-i18n="settings:translation.preference.comment_translation_choice.services.deepl"></option>
            <option value="iflyrec" data-i18n="settings:translation.preference.comment_translation_choice.services.iflyrec"></option>
            <option value="youdao" data-i18n="settings:translation.preference.comment_translation_choice.services.youdao"></option>
            <option value="google" data-i18n="settings:translation.preference.comment_translation_choice.services.google"></option>
            <option value="caiyun" data-i18n="settings:translation.preference.comment_translation_choice.services.caiyun"></option>
            <option value="openai" data-i18n="settings:translation.preference.comment_translation_choice.services.openai"></option>
        </select>
    </div>
    <hr>
    <h4 data-i18n="settings:translation.autoTranslation.title"></h4>
    <div class='OJBetter_setting_list'>
        <label for="autoTranslation" data-i18n="settings:translation.autoTranslation.enable"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.autoTranslation.helpText"></div>
        </div>
        <input type="checkbox" id="autoTranslation" name="autoTranslation">
    </div>
    <div class='OJBetter_setting_list'>
        <label for='shortTextLength'>
            <div style="display: flex;align-items: center;"
                data-i18n="settings:translation.autoTranslation.shortTextLength.name"></div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.autoTranslation.shortTextLength.helpText">
            </div>
        </div>
        <input type='number' id='shortTextLength' class='no_default' require=true data-i18n="[placeholder]settings:translation.autoTranslation.shortTextLength.placeholder">
        <span data-i18n="settings:translation.autoTranslation.shortTextLength.end"></span>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="allowMixTrans" data-i18n="settings:translation.autoTranslation.allowMixTrans.name"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.autoTranslation.allowMixTrans.helpText">
            </div>
        </div>
        <input type="checkbox" id="allowMixTrans" name="allowMixTrans">
        <div class='OJBetter_checkboxs'>
            <input type="checkbox" id="deepl" name="mixedTranslation" value="deepl">
            <label for="deepl" data-i18n="settings:translation.autoTranslation.allowMixTrans.checkboxs.deepl"></label>
            <input type="checkbox" id="iflyrec" name="mixedTranslation" value="iflyrec">
            <label for="iflyrec" data-i18n="settings:translation.autoTranslation.allowMixTrans.checkboxs.iflyrec"></label>
            <input type="checkbox" id="youdao" name="mixedTranslation" value="youdao">
            <label for="youdao" data-i18n="settings:translation.autoTranslation.allowMixTrans.checkboxs.youdao"></label>
            <input type="checkbox" id="google" name="mixedTranslation" value="google">
            <label for="google" data-i18n="settings:translation.autoTranslation.allowMixTrans.checkboxs.google">Google</label>
            <input type="checkbox" id="caiyun" name="mixedTranslation" value="caiyun">
            <label for="caiyun" data-i18n="settings:translation.autoTranslation.allowMixTrans.checkboxs.caiyun"></label>
        </div>
    </div>
    <hr>
    <h4 data-i18n="settings:translation.advanced.name"></h4>
    <div class='OJBetter_setting_list'>
        <label for="comment_translation_mode" style="display: flex;" data-i18n="settings:translation.advanced.mode.name"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.advanced.mode.helpText"></div>
        </div>
        <select id="comment_translation_mode" name="comment_translation_mode">
            <option value="0" data-i18n="settings:translation.advanced.mode.options.0"></option>
            <option value="1" data-i18n="settings:translation.advanced.mode.options.1"></option>
            <option value="2" data-i18n="settings:translation.advanced.mode.options.2"></option>
        </select>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="memoryTranslateHistory" data-i18n="settings:translation.advanced.memory.name"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.advanced.memory.helpText"></div>
        </div>
        <input type="checkbox" id="memoryTranslateHistory" name="memoryTranslateHistory">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="translation_retransAction" style="display: flex;" data-i18n="settings:translation.advanced.retrans.name"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.advanced.retrans.helpText"></div>
        </div>
        <select id="translation_retransAction" name="translation_retransAction">
            <option value=0 data-i18n="settings:translation.advanced.retrans.options.0"></option>
            <option value=1 data-i18n="settings:translation.advanced.retrans.options.1"></option>
        </select>
    </div>
    <div class='OJBetter_setting_list'>
        <label for='transWaitTime'>
            <div style="display: flex;align-items: center;" data-i18n="settings:translation.advanced.transWaitTime.name"></div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.advanced.transWaitTime.helpText"></div>
        </div>
        <input type='number' id='transWaitTime' class='no_default' require=true data-i18n="[placeholder]settings:translation.advanced.transWaitTime.placeholder">
        <span data-i18n="settings:translation.advanced.transWaitTime.end"></span>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="translation_replaceSymbol" style="display: flex;" data-i18n="settings:translation.advanced.replaceSymbol.name"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.advanced.replaceSymbol.helpText"></div>
        </div>
        <select id="translation_replaceSymbol" name="translation_replaceSymbol">
            <option value=2 data-i18n="settings:translation.advanced.replaceSymbol.options.2"></option>
            <option value=1 data-i18n="settings:translation.advanced.replaceSymbol.options.1"></option>
            <option value=3 data-i18n="settings:translation.advanced.replaceSymbol.options.3"></option>
        </select>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="filterTextWithoutEmphasis" data-i18n="settings:translation.advanced.filterTextWithoutEmphasis.name"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:translation.advanced.filterTextWithoutEmphasis.helpText"></div>
        </div>
        <input type="checkbox" id="filterTextWithoutEmphasis" name="filterTextWithoutEmphasis">
    </div>
</div>
`;

const clist_rating_settings_HTML = `
<div id="clist_rating-settings" class="settings-page">
    <h3 data-i18n="settings:clist.title"></h3>
    <hr>
    <h4 data-i18n="settings:clist.basics.name"></h4>
    <div class='OJBetter_setting_list alert_tip'>
        <div>
            <p data-i18n="[html]settings:clist.basics.notice"></p>
        </div>
    </div>
    <div class='OJBetter_setting_list'>
        <label for='clist_Authorization'>
            <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="settings:clist.basics.key.title"></span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:clist.basics.key.helpText"></div>
        </div>
        <input type='text' id='clist_Authorization' class='no_default' required="true"
            data-i18n="[placeholder]settings:clist.basics.key.keyPlaceholder">
    </div>
    <hr>
    <h4 data-i18n="settings:clist.displayRating.title"></h4>
    <div class='OJBetter_setting_list'>
        <label for="showClistRating_contest"><span data-i18n="settings:clist.displayRating.contest.name"></span></label>
        <input type="checkbox" id="showClistRating_contest" name="showClistRating_contest">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="showClistRating_problem"><span data-i18n="settings:clist.displayRating.problem.name"></span></label>
        <input type="checkbox" id="showClistRating_problem" name="showClistRating_problem">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="showClistRating_problemset"><span data-i18n="settings:clist.displayRating.problemset.name"></span></label>
        <input type="checkbox" id="showClistRating_problemset" name="showClistRating_problemset">
    </div>
    <hr>
    <div class='OJBetter_setting_list'>
        <label for="RatingHidden"><span data-i18n="settings:clist.spoilerProtection.title"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:clist.spoilerProtection.helpText"></div>
        </div>
        <input type="checkbox" id="RatingHidden" name="RatingHidden">
    </div>
</div>
`;

const code_editor_settings_HTML = `
<div id="code_editor-settings" class="settings-page">
    <h3 data-i18n="settings:codeEditor.title"></h3>
    <hr>
    <h4 data-i18n="settings:codeEditor.basics"></h4>
    <div class='OJBetter_setting_list'>
        <label for="problemPageCodeEditor"><span
                data-i18n="settings:codeEditor.problemPageCodeEditor.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="settings:codeEditor.problemPageCodeEditor.helpText"></div>
        </div>
        <input type="checkbox" id="problemPageCodeEditor" name="problemPageCodeEditor">
    </div>
    <hr>
    <h4 data-i18n="settings:codeEditor.preferences.title"></h4>
    <div class='OJBetter_setting_list'>
        <label for="isCodeSubmitConfirm"><span
                data-i18n="settings:codeEditor.preferences.isCodeSubmitConfirm.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="settings:codeEditor.preferences.isCodeSubmitConfirm.helpText"></div>
        </div>
        <input type="checkbox" id="isCodeSubmitConfirm" name="isCodeSubmitConfirm">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="alwaysConsumeMouseWheel"><span
                data-i18n="settings:codeEditor.preferences.alwaysConsumeMouseWheel.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="settings:codeEditor.preferences.alwaysConsumeMouseWheel.helpText"></div>
        </div>
        <input type="checkbox" id="alwaysConsumeMouseWheel" name="alwaysConsumeMouseWheel">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="submitButtonPosition"><span
                data-i18n="settings:codeEditor.preferences.submitButtonPosition.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="settings:codeEditor.preferences.submitButtonPosition.helpText"></div>
        </div>
        <select id="submitButtonPosition" name="submitButtonPosition">
            <option value="bottom" data-i18n="settings:codeEditor.preferences.submitButtonPosition.options.bottom"></option>
            <option value="top" data-i18n="settings:codeEditor.preferences.submitButtonPosition.options.top"></option>
        </select>
    </div>
    <hr>
    <h4 data-i18n="settings:codeEditor.onlineCodeExecution.title"></h4>
    <label>
        <input type='radio' name='compiler' value='official'>
        <span class='OJBetter_setting_menu_label_text'
            data-i18n="settings:codeEditor.onlineCodeExecution.compilerOptions.codeforces"></span>
    </label>
    <label>
        <input type='radio' name='compiler' value='wandbox'>
        <span class='OJBetter_setting_menu_label_text'
            data-i18n="settings:codeEditor.onlineCodeExecution.compilerOptions.wandbox"></span>
    </label>
    <label>
        <input type='radio' name='compiler' value='rextester'>
        <span class='OJBetter_setting_menu_label_text'
            data-i18n="settings:codeEditor.onlineCodeExecution.compilerOptions.rextester"></span>
    </label>
    <hr>
    <h4 data-i18n="settings:codeEditor.lsp.title"></h4>
    <div class='OJBetter_setting_list'>
        <label for="useLSP"><span data-i18n="settings:codeEditor.lsp.useLSP.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:codeEditor.lsp.useLSP.helpText"></div>
        </div>
        <input type="checkbox" id="useLSP" name="useLSP">
    </div>
    <div class='OJBetter_setting_list'>
        <label for='OJBetter_Bridge_WorkUri'>
            <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="settings:codeEditor.lsp.OJBetter_Bridge_WorkUri.label"></span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:codeEditor.lsp.OJBetter_Bridge_WorkUri.helpText"></div>
        </div>
        <input type='text' id='OJBetter_Bridge_WorkUri' class='no_default'
            require=true data-i18n="[placeholder]settings:codeEditor.lsp.OJBetter_Bridge_WorkUri.placeholder">
    </div>
    <div class='OJBetter_setting_list'>
        <label for='OJBetter_Bridge_SocketUrl'>
            <div style="display: flex;align-items: center;">
                <span class="input_label"
                    data-i18n="settings:codeEditor.lsp.OJBetter_Bridge_SocketUrl.label"></span>
            </div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:codeEditor.lsp.OJBetter_Bridge_SocketUrl.helpText"></div>
        </div>
        <input type='text' id='OJBetter_Bridge_SocketUrl' class='no_default'
            require=true data-i18n="[placeholder]settings:codeEditor.lsp.OJBetter_Bridge_SocketUrl.placeholder">
    </div>
    <hr>
    <h4 data-i18n="settings:codeEditor.staticCompletionEnhancement.title"></h4>
    <div class='OJBetter_setting_list'>
        <label for="cppCodeTemplateComplete"><span
                data-i18n="settings:codeEditor.staticCompletionEnhancement.cppCodeTemplateComplete.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:codeEditor.staticCompletionEnhancement.cppCodeTemplateComplete.helpText"></div>
        </div>
        <input type="checkbox" id="cppCodeTemplateComplete" name="cppCodeTemplateComplete">
    </div>
    <hr>
    <h5 data-i18n="settings:codeEditor.staticCompletionEnhancement.customization"></h5>
    <div class='OJBetter_setting_list alert_warn'>
        <div>
            <p data-i18n="settings:codeEditor.staticCompletionEnhancement.performanceWarning"></p>
        </div>
    </div>
    <div id="Complet_config" class="config"></div>
</div>
`;

const preference_settings_HTML = `
<div id="preference-settings" class="settings-page">
    <h3 data-i18n="settings:preference.title"></h3>
    <hr>
    <div class='OJBetter_setting_list'>
        <label for="showLoading" data-i18n="settings:preference.loadingInfo.label"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:preference.loadingInfo.helpText"></div>
        </div>
        <input type="checkbox" id="showLoading" name="showLoading">
    </div>
    <div class='OJBetter_setting_list'>
        <label for="hoverTargetAreaDisplay" data-i18n="settings:preference.targetArea.label"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:preference.targetArea.helpText"></div>
        </div>
        <input type="checkbox" id="hoverTargetAreaDisplay" name="hoverTargetAreaDisplay">
    </div>
    <div class='OJBetter_setting_list'>
        <label for='iconButtonSize'>
            <div style="display: flex;align-items: center;" data-i18n="settings:preference.iconButtonSize.title"></div>
        </label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:preference.iconButtonSize.helpText"></div>
        </div>
        <input type='number' id='iconButtonSize' class='no_default' require=true data-i18n="[placeholder]settings:preference.iconButtonSize.placeholder">
        <span>px</span>
    </div>
</div>
`;

const dev_settings_HTML = `
<div id="dev-settings" class="settings-page">
    <h3 data-i18n="settings:dev.title"></h3>
    <hr>
    <div class='OJBetter_setting_list alert_danger'>
        <div>
            <p data-i18n="[html]settings:dev.notice"></p>
        </div>
    </div>
    <hr>
    <h5 data-i18n="settings:dev.load.title"></h5>
    <div class='OJBetter_setting_list'>
        <label for="notWaiteLoaded"><span data-i18n="settings:dev.load.notWaiteLoaded.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:dev.load.notWaiteLoaded.helpText"></div>
        </div>
        <input type="checkbox" id="notWaiteLoaded" name="notWaiteLoaded">
    </div>
    <hr>
    <h5 data-i18n="settings:dev.l10n.title"></h5>
    <div class='OJBetter_setting_list'>
        <label><span data-i18n="settings:dev.l10n.refreshScrpitCache.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:dev.l10n.refreshScrpitCache.helpText"></div>
        </div>
        <button type="button" id="l10n_refreshScrpitCacheButton" name="l10n_refreshScrpitCacheButton" data-i18n="settings:dev.l10n.refreshScrpitCache.button"></button>
    </div>
    <hr>
    <h5 data-i18n="settings:dev.indexedDB.title"></h5>
    <div class='OJBetter_setting_list'>
        <label><span data-i18n="settings:dev.indexedDB.clear.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:dev.indexedDB.clear.helpText"></div>
        </div>
        <button type="button" id="indexedDB_clearButton" name="indexedDB_clearButton" data-i18n="settings:dev.indexedDB.clear.button"></button>
    </div>
    <div class='OJBetter_setting_list'>
        <label><span data-i18n="settings:dev.indexedDB.inputOrExport.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:dev.indexedDB.inputOrExport.helpText"></div>
        </div>
        <button type="button" id="indexedDB_exportButton" name="indexedDB_exportButton" data-i18n="settings:dev.indexedDB.inputOrExport.export"></button>
        <button type="button" id="indexedDB_importButton" name="indexedDB_importButton" data-i18n="settings:dev.indexedDB.inputOrExport.import"></button>
    </div>
    <hr>
    <h5 data-i18n="settings:dev.configuration.title"></h5>
    <div class='OJBetter_setting_list'>
        <label><span data-i18n="settings:dev.configuration.clear.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:dev.configuration.clear.helpText"></div>
        </div>
        <button type="button" id="configuration_clearButton" name="configuration_clearButton" data-i18n="settings:dev.configuration.clear.button"></button>
    </div>
    <div class='OJBetter_setting_list'>
        <label><span data-i18n="settings:dev.configuration.inputOrExport.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:dev.configuration.inputOrExport.helpText"></div>
        </div>
        <button type="button" id="configuration_exportButton" name="configuration_exportButton" data-i18n="settings:dev.configuration.inputOrExport.export"></button>
        <button type="button" id="configuration_importButton" name="configuration_importButton" data-i18n="settings:dev.configuration.inputOrExport.import"></button>
    </div>
</div>
`;

// TODO 2
const about_settings_HTML = `
<div id="about-settings" class="settings-page">
    <h3 data-i18n="settings:about.title"></h3>
    <hr>
    <div class='versionInfo'>
        <p>Codeforces Better!</p>
        <p><span data-i18n="settings:about.version"></span><span id="nowVersion">${OJBetter.state.version}</span></p>
        <p> @北极小狐 <a target="_blank" href="https://github.com/beijixiaohu/OJBetter">Github</a> 
        <a target="_blank" href="https://greasyfork.org/zh-CN/scripts/465777">GreasyFork</a></p>
    </div>
    <hr>
    <h5 data-i18n="settings:about.update.title"></h5>
    <div id="thanksforDevChannelNotice" class='OJBetter_setting_list alert_info'>
        <div data-i18n="[html]settings:about.update.thanksforDevChannelNotice"></div>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="updateChannel"><span data-i18n="settings:about.update.channel.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:about.update.channel.helpText"></div>
        </div>
        <select id="updateChannel" name="updateChannel">
            <option value="release" data-i18n="settings:about.update.channel.options.release"></option>
            <option value="dev" data-i18n="settings:about.update.channel.options.dev"></option>
        </select>
    </div>
    <div class='OJBetter_setting_list'>
        <label for="updateSource"><span data-i18n="settings:about.update.source.label"></span></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]settings:about.update.source.helpText"></div>
        </div>
        <select id="updateSource" name="updateSource">
            <option value="greasyfork" data-i18n="settings:about.update.source.options.greasyfork"></option>
            <option value="github" data-i18n="settings:about.update.source.options.github"></option>
            <option value="aliyunoss" data-i18n="settings:about.update.source.options.aliyunoss"></option>
        </select>
    </div>
</div>
`;

const OJBetter_setting_content_HTML = `
<div class="OJBetter_setting_content">
    ${basic_settings_HTML}
    ${l10n_settings_HTML}
    ${translation_settings_HTML}
    ${clist_rating_settings_HTML}
    ${code_editor_settings_HTML}
    ${preference_settings_HTML}
    ${dev_settings_HTML}
    ${about_settings_HTML}
</div>
`;

// 设置界面HTML
const CFBetterSettingMenu_HTML = `
    <dialog class='OJBetter_setting_menu' id='OJBetter_setting_menu'>
        <div class="tool-box">
            <button class="btn-close">×</button>
        </div>
        <div class="OJBetter_setting_container">
            ${OJBetter_setting_sidebar_HTML}
            ${OJBetter_setting_content_HTML}
        </div>
    </dialog>
`;

const apiCustomConfigHTML = (prefix) => {
    return `
    <div class="OJBetter_setting_list">
        <label for='${prefix}_header'>
            <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="config:common.advanced.header.label"></span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text" data-i18n="[html]config:common.advanced.header.tipText"></div>
                </div>
            </div>
        </label>
        <textarea id="${prefix}_header" placeholder='' require = false data-i18n="[placeholder]config:common.advanced.header.placeholder"></textarea>
    </div>
    <div class="OJBetter_setting_list">
        <label for='${prefix}_data'>
            <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="config:common.advanced.data.label"></span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text" data-i18n="[html]config:common.advanced.data.tipText"></div>
                </div>
            </div>
        </label>
        <textarea id="${prefix}_data" placeholder='' require = false data-i18n="[placeholder]config:common.advanced.data.placeholder"></textarea>
    </div>
    `;
};

const apiQuotaConfigHTML = (prefix) => {
    return `
    <div class="OJBetter_setting_list">
        <label for='${prefix}_quota_url'>
        <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="config:common.quota.url.label"></span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text" data-i18n="[html]config:common.quota.url.tipText"></div>
                </div>
            </div>
        </label>
        <input type='text' id='${prefix}_quota_url' class='no_default' placeholder='' require = true data-i18n="[placeholder]config:common.quota.url.placeholder">
    </div>
    <div class="OJBetter_setting_list">
        <label for="${prefix}_quota_method" style="display: flex;" data-i18n="config:common.quota.method.label"></label>
        <div class="help_tip">
            ${helpCircleHTML}
            <div class="tip_text" data-i18n="[html]config:common.quota.method.tipText"></div>
        </div>
        <select id="${prefix}_quota_method" name="${prefix}_quota_method">
            <option value="get">GET</option>
            <option value="post">POST</option>
        </select>
    </div>
    <div class="OJBetter_setting_list">
        <label for='${prefix}_quota_header'>
            <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="config:common.quota.header.label"></span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text" data-i18n="[html]config:common.quota.header.tipText"></div>
                </div>
            </div>
        </label>
        <textarea id="${prefix}_quota_header" placeholder='' require = false data-i18n="[placeholder]config:common.quota.header.placeholder"></textarea>
    </div>
    <div class="OJBetter_setting_list">
        <label for='${prefix}_quota_data'>
            <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="config:common.quota.data.label"></span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text" data-i18n="[html]config:common.quota.data.tipText"></div>
                </div>
            </div>
        </label>
        <textarea id="${prefix}_quota_data" placeholder='' require = false data-i18n="[placeholder]config:common.quota.data.placeholder"></textarea>
    </div>
    <div class="OJBetter_setting_list">
        <div style="display: flex;align-items: center;">
                <span class="input_label" data-i18n="config:common.quota.surplus.label"></span>
                <div class="help_tip">
                    ${helpCircleHTML}
                    <div class="tip_text" data-i18n="[html]config:common.quota.surplus.tipText"></div>
                </div>
            </div>
        </label>
        <input type='text' id='${prefix}_quota_surplus' class='no_default' placeholder='' require = true data-i18n="[placeholder]config:common.quota.surplus.placeholder">
    </div>
    `;
}

const deeplConfigEditHTML = `
    <dialog class='OJBetter_setting_menu' id='config_edit_menu'>
    <div class='OJBetter_setting_content'>
        <div class="tool-box">
            <button class="btn-close">×</button>
        </div>
        <h4 data-i18n="config:deepl.title"></h4>
        <h5 data-i18n="config:deepl.basic.title"></h5>
        <hr>
        <div class="OJBetter_setting_list">
            <label for='name'>
                <span class="input_label" data-i18n="config:deepl.basic.name.label"></span>
            </label>
            <input type='text' id='name' class='no_default' placeholder='' require = true data-i18n="[placeholder]config:deepl.basic.name.placeholder">
        </div>
        <div class='OJBetter_setting_list'>
            <label for="deepl_apiGenre" style="display: flex;" data-i18n="config:deepl.genre.label"></label>
            <div class="help_tip">
                ${helpCircleHTML}
                <div class="tip_text" data-i18n="[html]config:deepl.genre.tipText"></div>
            </div>
            <select id="deepl_apiGenre" name="deepl_apiGenre">
                <option value="api-free">api-free</option>
                <option value="api-pro">api-pro</option>
                <option value="deeplx">deeplx</option>
            </select>
        </div>
        <div class="OJBetter_setting_list">
            <label for='deepl_key'>
                <div style="display: flex;align-items: center;">
                    <span class="input_label" data-i18n="config:deepl.basic.key.label"></span>
                    <div class="help_tip">
                        ${helpCircleHTML}
                        <div class="tip_text" data-i18n="[html]config:deepl.basic.key.tipText"></div>
                    </div>
                </div>
            </label>
            <input type='text' id='deepl_key' class='no_default' placeholder='' require = true data-i18n="[placeholder]config:deepl.basic.key.placeholder">
        </div>
        <div class="OJBetter_setting_list">
            <label for='deepl_proxy'>
                <div style="display: flex;align-items: center;">
                    <span class="input_label" data-i18n="config:deepl.basic.proxy.label">Proxy API:</span>
                    <div class="help_tip">
                        ${helpCircleHTML}
                        <div class="tip_text" data-i18n="[html]config:deepl.basic.proxy.tipText"></div>
                    </div>
                </div>
            </label>
            <input type='text' id='deepl_proxy' placeholder='' require = false>
        </div>
        <hr>
        <details>
            <summary data-i18n="config:common.advanced.title"></summary>
            ${apiCustomConfigHTML('deepl')}
        </details>
        <details>
            <summary data-i18n="config:common.quota.title"></summary>
            ${apiQuotaConfigHTML('deepl')}
        </details>
        <button id='tempConfig_save' data-i18n="common:save"></button>
    </div>
    </dialog>
`;

const chatgptConfigEditHTML = `
    <dialog class='OJBetter_setting_menu' id='config_edit_menu'>
    <div class='OJBetter_setting_content'>
        <div class="tool-box">
            <button class="btn-close">×</button>
        </div>
        <h4 data-i18n="config:chatgpt.title"></h4>
        <h5 data-i18n="config:chatgpt.basic.title"></h5>
        <hr>
        <div class="OJBetter_setting_list">
            <label for='name'>
                <span class="input_label" data-i18n="config:chatgpt.basic.name.label"></span>
            </label>
            <input type='text' id='name' class='no_default' placeholder='' require = true data-i18n="[placeholder]config:chatgpt.basic.name.placeholder">
        </div>
        <div class="OJBetter_setting_list">
            <label for='chatgpt_model'>
                <div style="display: flex;align-items: center;">
                    <span class="input_label" data-i18n="[html]config:chatgpt.basic.model.label"></span>
                    <div class="help_tip">
                        ${helpCircleHTML}
                        <div class="tip_text" data-i18n="[html]config:chatgpt.basic.model.tipText"></div>
                    </div>
                </div>
            </label>
            <input type='text' id='chatgpt_model' placeholder='gpt-3.5-turbo' require = false>
        </div>
        <div class="OJBetter_setting_list">
            <label for='chatgpt_key'>
                <div style="display: flex;align-items: center;">
                    <span class="input_label" data-i18n="config:chatgpt.basic.key.label"></span>
                    <div class="help_tip">
                        ${helpCircleHTML}
                        <div class="tip_text" data-i18n="[html]config:chatgpt.basic.key.tipText"></div>
                    </div>
                </div>
            </label>
            <input type='text' id='chatgpt_key' class='no_default' placeholder='' require = true data-i18n="[placeholder]config:chatgpt.basic.key.placeholder">
        </div>
        <div class="OJBetter_setting_list">
            <label for='chatgpt_proxy'>
                <div style="display: flex;align-items: center;">
                    <span class="input_label" data-i18n="config:chatgpt.basic.proxy.label">Proxy API:</span>
                    <div class="help_tip">
                        ${helpCircleHTML}
                        <div class="tip_text" data-i18n="[html]config:chatgpt.basic.proxy.tipText"></div>
                    </div>
                </div>
            </label>
            <input type='text' id='chatgpt_proxy' placeholder='https://api.openai.com/v1/chat/completions' require = false>
        </div>
        <hr>
        <details>
            <summary data-i18n="config:common.advanced.title"></summary>
            ${apiCustomConfigHTML('chatgpt')}
        </details>
        <details>
            <summary data-i18n="config:common.quota.title"></summary>
            ${apiQuotaConfigHTML('chatgpt')}
        </details>
        <button id='tempConfig_save' data-i18n="common:save"></button>
    </div>
    </dialog>
`;

const CompletConfigEditHTML = `
    <dialog class='OJBetter_setting_menu' id='config_edit_menu'>
    <div class='OJBetter_setting_content'>
        <div class="tool-box">
            <button class="btn-close">×</button>
        </div>
        <h4 data-i18n="config:complet.title"></h4>
        <hr>
        <div class="OJBetter_setting_list">
            <label for='name'>
                <span class="input_label" data-i18n="config:complet.name.label"></span>
            </label>
            <input type='text' id='name' class='no_default' placeholder='' require = true  data-i18n="[placeholder]config:complet.name.placeholder">
        </div>
        <div class='OJBetter_setting_list'>
            <label for="complet_isChoose"><span id="loaded_span" data-i18n="config:complet.choose.label"></span></label>
            <input type="checkbox" id="complet_isChoose" name="complet_isChoose" require = false>
        </div>
        <div class='OJBetter_setting_list'>
            <label for="complet_genre" style="display: flex;" data-i18n="config:complet.genre.label"></label>
            <div class="help_tip">
                ${helpCircleHTML}
                <div class="tip_text" data-i18n="[html]config:complet.genre.tipText"></div>
            </div>
            <select id="complet_genre" name="complet_genre">
                <option value="monaco">monaco</option>
                <option value="ace">ace</option>
            </select>
        </div>
        <div class='OJBetter_setting_list'>
            <label for="complet_language" style="display: flex;" data-i18n="config:complet.language.label"></label>
            <select id="complet_language" name="complet_language">
                <option value="cpp">cpp</option>
                <option value="python">python</option>
                <option value="java">java</option>
                <option value="c">c</option>
            </select>
        </div>
        <div class="OJBetter_setting_list">
            <label for='complet_jsonUrl'>
                <div style="display: flex;align-items: center;">
                    <span class="input_label">JSON URL:</span>
                    <div class="help_tip">
                        ${helpCircleHTML}
                        <div class="tip_text" data-i18n="[html]config:complet.jsonurl.tipText"></div>
                    </div>
                </div>
            </label>
            <div class='OJBetter_setting_list alert_warn' data-i18n="[html]config:complet.jsonurl.alert"></div>
            <input type='text' id='complet_jsonUrl' class='no_default' placeholder='' require = true data-i18n="[placeholder]config:complet.jsonurl.placeholder">
        </div>
        <button id='tempConfig_save' data-i18n="common:save"></button>
    </div>
    </dialog>
`;

/**
 * 加载设置按钮面板
 */
async function initSettingsPanel() {
    // 添加右上角设置按钮
    function insertCFBetterSettingButton(location, method) {
        $(location)[method](`<button class='ojb_btn OJBetter_setting'>
        Codeforces Better ${i18next.t('settings', { ns: 'common' })}</button>`);
    }

    insertCFBetterSettingButton(".lang-chooser", "before");
    insertCFBetterSettingButton(".enter-or-register-box", "after");
    if (OJBetter.typeOfPage.is_completeProblemset) insertCFBetterSettingButton(".lang", "before");

    const $settingBtns = $(".OJBetter_setting");
    $settingBtns.click(() => {
        $settingBtns.prop("disabled", true).addClass("open");

        // 设置面板div
        const settingMenu = $(CFBetterSettingMenu_HTML)
        $("body").append(settingMenu);

        elementLocalize(settingMenu); // 加载i18n
        OJB_showModal(settingMenu);
        OJB_addDraggable($('#OJBetter_setting_menu')); // 窗口支持拖拽

        // help帮助悬浮窗位置更新
        $(document).on('mouseenter', '.help-icon', function (event) {
            var menuOffset = $('.OJBetter_setting_menu:last').offset();
            var mouseX = event.pageX - menuOffset.left;
            var mouseY = event.pageY - menuOffset.top;

            $('.tip_text').css({
                'top': mouseY + 'px',
                'left': mouseX + 'px'
            });
        });

        // 选项卡切换
        $('.OJBetter_setting_sidebar a').click(function (event) {
            event.preventDefault();
            $('.OJBetter_setting_sidebar a').removeClass('active');
            $('.settings-page').removeClass('active');
            $(this).addClass('active');
            const targetPageId = $(this).attr('href').substring(1);
            $('#' + targetPageId).addClass('active');
        });

        /**
         * 更新单选按钮组的可用状态
         * @param {string} selector 单选按钮组的选择器
         * @param {string} targetLanguage 目标语言
         * @param {Object} translationSupport 翻译支持的语言对应表
         */
        const updateRadioButtonsAvailability = (selector, targetLanguage) => {
            Object.entries(OJBetter.supportList.translationSupport).forEach(([service, languages]) => {
                const radioButton = $(selector).find(`input[value="${service}"]`);
                const isEnabled = languages[targetLanguage];
                $(radioButton).prop('disabled', !isEnabled);
                if (!isEnabled) {
                    $(radioButton).prop('checked', false);
                }
            });
        };

        /**
         * 检查下拉框选中项是否有效，若无效则清空
         * @param {string} selector 下拉框的选择器
         */
        const validateSelectOption = (selector) => {
            const selectedValue = $(selector).val();
            if (!selectedValue) {
                $(selector).val('');
            }
        };

        /**
         * 更新翻译目标语言下拉框的可用状态
         * @param {string} selector 下拉框的选择器
         * @param {string} targetLanguage 目标语言
         * @param {Object} translationSupport 翻译支持的语言对应表
         */
        const updateSelectOptionsAvailability = (selector, targetLanguage) => {
            $(selector).children('option').each(function () {
                const optionValue = $(this).val();
                const isEnabled = OJBetter.supportList.translationSupport[optionValue] ? OJBetter.supportList.translationSupport[optionValue][targetLanguage] : true;
                $(this).prop('disabled', !isEnabled);
            });
            validateSelectOption(selector);
        };

        /**
         * 更新翻译服务复选框的可用状态
         * @param {string} selector 复选框的选择器
         * @param {string} targetLanguage 目标语言
         * @param {Object} translationSupport 翻译支持的语言对应表
         */
        const updateCheckboxesAvailability = (selector, targetLanguage) => {
            $(selector).children('input').each(function () {
                const checkboxValue = $(this).val();
                const isEnabled = OJBetter.supportList.translationSupport[checkboxValue][targetLanguage];
                $(this).prop('disabled', !isEnabled);
                if (!isEnabled) {
                    $(this).prop('checked', false);
                }
            });
        };

        /**
         * 更新更新源下拉框的可用状态
         * @param {string} selector 下拉框的选择器
         * @param {string} targetLanguage 目标语言
         * @param {Object} translationSupport 翻译支持的语言对应表
         */
        const updateUpdateSourceSelectOptionsAvailability = (selector, updateChannel) => {
            $(selector).children('option').each(function () {
                const optionValue = $(this).val();
                const isEnabled = OJBetter.supportList.updateSourceSupportList[optionValue][updateChannel];
                $(this).prop('disabled', !isEnabled);
            });
            validateSelectOption(selector);
        };

        /**
         * 创建配置结构
         * @param {string} type - 该字段的在表单中的类型
         * @param {string} value - 在配置中的键值
         * @param {boolean} require - 是否是表单的必填项
         * @param {string} [check=""] check - 调用的合法性检查
         */
        function createStructure(type, value, require, check = "") {
            return { type, value, require, check };
        }

        // deepl配置
        const deeplStructure = {
            '#name': createStructure('text', 'name', true),
            '#deepl_apiGenre': createStructure('text', 'apiGenre', true),
            '#deepl_key': createStructure('text', 'key', false),
            '#deepl_proxy': createStructure('text', 'proxy', false),
            '#deepl_header': createStructure('text', '_header', false, 'keyValuePairs'),
            '#deepl_data': createStructure('text', '_data', false, 'keyValuePairs'),
            '#deepl_quota_url': createStructure('text', 'quota_url', false),
            '#deepl_quota_method': createStructure('text', 'quota_method', false),
            '#deepl_quota_header': createStructure('text', 'quota_header', false, 'keyValuePairs'),
            '#deepl_quota_data': createStructure('text', 'quota_data', false, 'keyValuePairs'),
            '#deepl_quota_surplus': createStructure('text', 'quota_surplus', false, 'dotSeparatedPath'),
        };
        let tempConfig_deepl = GM_getValue('deepl_config'); // 获取配置信息
        const configManager_deepl = new ConfigManager('#deepl_config', 'deepl_config_', tempConfig_deepl, deeplStructure, deeplConfigEditHTML);
        configManager_deepl.registerChoiceChange();

        // chatgpt配置
        const chatgptStructure = {
            '#name': createStructure('text', 'name', true),
            '#chatgpt_model': createStructure('text', 'model', false),
            '#chatgpt_key': createStructure('text', 'key', true),
            '#chatgpt_proxy': createStructure('text', 'proxy', false),
            '#chatgpt_header': createStructure('text', '_header', false, 'keyValuePairs'),
            '#chatgpt_data': createStructure('text', '_data', false, 'keyValuePairs'),
            '#chatgpt_quota_url': createStructure('text', 'quota_url', false),
            '#chatgpt_quota_header': createStructure('text', 'quota_header', false, 'keyValuePairs'),
            '#chatgpt_quota_data': createStructure('text', 'quota_data', false, 'keyValuePairs'),
            '#chatgpt_quota_surplus': createStructure('text', 'quota_surplus', false, 'dotSeparatedPath'),
            '#chatgpt_quota_method': createStructure('text', 'quota_method', false),
        };
        let tempConfig_chatgpt = GM_getValue('chatgpt_config'); // 获取配置信息
        const configManager_chatgpt = new ConfigManager('#chatgpt_config', 'chatgpt_config_', tempConfig_chatgpt, chatgptStructure, chatgptConfigEditHTML);
        configManager_chatgpt.registerChoiceChange();

        // Complet配置
        const CompletStructure = {
            '#name': createStructure('text', 'name', true),
            '#complet_isChoose': createStructure('checkbox', 'isChoose', true),
            '#complet_genre': createStructure('text', 'genre', true),
            '#complet_language': createStructure('text', 'language', true),
            '#complet_jsonUrl': createStructure('text', 'jsonUrl', true)
        };
        let tempConfig_Complet = GM_getValue('Complet_config'); // 获取配置信息
        const configManager_complet = new ConfigManager('#Complet_config', 'complet_config_', tempConfig_Complet, CompletStructure, CompletConfigEditHTML, false);

        // 状态更新
        $("input[name='darkMode'][value='" + OJBetter.basic.darkMode + "']").prop("checked", true);
        $("#showLoading").prop("checked", GM_getValue("showLoading") === true);
        $("#expandFoldingblocks").prop("checked", GM_getValue("expandFoldingblocks") === true);
        $("#renderPerfOpt").prop("checked", GM_getValue("renderPerfOpt") === true);
        $("#commentPaging").prop("checked", GM_getValue("commentPaging") === true);
        $("#standingsRecolor").prop("checked", GM_getValue("standingsRecolor") === true);
        $("#showJumpToLuogu").prop("checked", GM_getValue("showJumpToLuogu") === true);
        $("#hoverTargetAreaDisplay").prop("checked", GM_getValue("hoverTargetAreaDisplay") === true);
        $("#showClistRating_contest").prop("checked", GM_getValue("showClistRating_contest") === true);
        $("#showClistRating_problemset").prop("checked", GM_getValue("showClistRating_problemset") === true);
        $("#showClistRating_problem").prop("checked", GM_getValue("showClistRating_problem") === true);
        $("#RatingHidden").prop("checked", GM_getValue("RatingHidden") === true);
        $('#scriptL10nLanguage').val(GM_getValue("scriptL10nLanguage"));
        $('#localizationLanguage').val(GM_getValue("localizationLanguage"));
        $("input[name='translation'][value='" + OJBetter.translation.choice + "']").prop("checked", true);
        $("input[name='translation']").css("color", "gray");
        $('#deepl_type').val(GM_getValue("deepl_type"));
        $("#deepl_config_config_bar_ul").find(`input[name='deepl_config_config_item'][value='${tempConfig_deepl.choice}']`).prop("checked", true);
        $('#enableEmphasisProtection').prop("checked", GM_getValue("enableEmphasisProtection") === true);
        $('#enableLinkProtection').prop("checked", GM_getValue("enableLinkProtection") === true);
        $("#chatgpt_config_config_bar_ul").find(`input[name='chatgpt_config_config_item'][value='${tempConfig_chatgpt.choice}']`).prop("checked", true);
        $("#openai_isStream").prop("checked", GM_getValue("openai_isStream") === true);
        $('#comment_translation_choice').val(GM_getValue("commentTranslationChoice"));
        $('#iconButtonSize').val(GM_getValue("iconButtonSize"));
        $("#autoTranslation").prop("checked", GM_getValue("autoTranslation") === true);
        $('#shortTextLength').val(GM_getValue("shortTextLength"));
        $("#allowMixTrans").prop("checked", GM_getValue("allowMixTrans") === true);
        $('.OJBetter_checkboxs').find('input[type="checkbox"][name="mixedTranslation"]').each(function () {
            if (OJBetter.translation.auto.mixTrans.servers.indexOf($(this).val()) > -1) {
                $(this).prop('checked', true);
            }
        });
        // 翻译目标语言下拉框
        $('#transTargetLang').change(function () {
            var selectedLang = $(this).val();
            updateRadioButtonsAvailability('#translationServices', selectedLang);
            updateSelectOptionsAvailability('#comment_translation_choice', selectedLang);
            updateCheckboxesAvailability('.OJBetter_checkboxs', selectedLang);
        });
        $('#transTargetLang').val(GM_getValue("transTargetLang"));
        $('#transTargetLang').change();
        // 
        $('#comment_translation_mode').val(GM_getValue("commentTranslationMode"));
        $("#memoryTranslateHistory").prop("checked", GM_getValue("memoryTranslateHistory") === true);
        $('#transWaitTime').val(GM_getValue("transWaitTime"));
        $('#translation_replaceSymbol').val(GM_getValue("replaceSymbol"));
        $("#filterTextWithoutEmphasis").prop("checked", GM_getValue("filterTextWithoutEmphasis") === true);
        $('#translation_retransAction').val(GM_getValue("retransAction"));
        $("#clist_Authorization").val(GM_getValue("clist_Authorization"));
        $("#problemPageCodeEditor").prop("checked", GM_getValue("problemPageCodeEditor") === true);
        $("#isCodeSubmitConfirm").prop("checked", GM_getValue("isCodeSubmitConfirm") === true);
        $("#alwaysConsumeMouseWheel").prop("checked", GM_getValue("alwaysConsumeMouseWheel") === true);
        $("#submitButtonPosition").val(GM_getValue("submitButtonPosition"));
        $("#cppCodeTemplateComplete").prop("checked", GM_getValue("cppCodeTemplateComplete") === true);
        $("#useLSP").prop("checked", GM_getValue("useLSP") === true);
        $("#OJBetter_Bridge_WorkUri").val(GM_getValue("OJBetter_Bridge_WorkUri"));
        $("#OJBetter_Bridge_SocketUrl").val(GM_getValue("OJBetter_Bridge_SocketUrl"));
        $("input[name='compiler'][value='" + OJBetter.monaco.onlineCompilerChoice + "']").prop("checked", true);
        $("input[name='compiler']").css("color", "gray");
        // 调试
        $("#notWaiteLoaded").prop("checked", GM_getValue("notWaiteLoaded") === true);
        // TODO 3
        $('#l10n_refreshScrpitCacheButton').click(clearI18nextCache);
        $('#indexedDB_clearButton').click(async () => { await clearDatabase(); });
        $('#indexedDB_exportButton').click(async () => { downloadDataAsFile(await exportDatabase(), 'database_export.json') });
        $('#indexedDB_importButton').click(() => { readFileInput(async (fileContent) => { await importDatabase(fileContent); }); });
        $('#configuration_clearButton').click(deleteAllConfigSettings);
        $('#configuration_exportButton').click(() => { downloadDataAsFile(exportSettingsToJSON(), 'configuration_export.json') });
        $('#configuration_importButton').click(() => { readFileInput((fileContent) => { importSettingsFromJSON(fileContent); }) });
        // 关于
        $('#updateChannel').val(GM_getValue("updateChannel"));
        $('#updateSource').val(GM_getValue("updateSource"));
        $('#updateChannel').change(function () {
            var selectedLang = $(this).val();
            updateUpdateSourceSelectOptionsAvailability('#updateSource', selectedLang);
            if (selectedLang == "dev") $('#thanksforDevChannelNotice').show();
            else $('#thanksforDevChannelNotice').hide();
        });
        $('#updateChannel').change();

        // 关闭
        const $settingMenu = $(".OJBetter_setting_menu");
        $settingMenu.on("click", ".btn-close", async () => {
            // 设置的数据
            const settings = {
                darkMode: $("input[name='darkMode']:checked").val(),
                showLoading: $("#showLoading").prop("checked"),
                hoverTargetAreaDisplay: $("#hoverTargetAreaDisplay").prop("checked"),
                expandFoldingblocks: $("#expandFoldingblocks").prop("checked"),
                renderPerfOpt: $("#renderPerfOpt").prop("checked"),
                commentPaging: $("#commentPaging").prop("checked"),
                standingsRecolor: $("#standingsRecolor").prop("checked"),
                showJumpToLuogu: $("#showJumpToLuogu").prop("checked"),
                scriptL10nLanguage: $('#scriptL10nLanguage').val(),
                localizationLanguage: $('#localizationLanguage').val(),
                transTargetLang: $('#transTargetLang').val(),
                translation: $("input[name='translation']:checked").val(),
                deepl_type: $('#deepl_type').val(),
                enableEmphasisProtection: $("#enableEmphasisProtection").prop("checked"),
                enableLinkProtection: $("#enableLinkProtection").prop("checked"),
                openai_isStream: $("#openai_isStream").prop("checked"),
                commentTranslationChoice: $('#comment_translation_choice').val(),
                iconButtonSize: $('#iconButtonSize').val(),
                autoTranslation: $("#autoTranslation").prop("checked"),
                shortTextLength: $('#shortTextLength').val(),
                allowMixTrans: $("#allowMixTrans").prop("checked"),
                mixedTranslation: (() => {
                    let mixedTranslation = [];
                    $('.OJBetter_checkboxs').find('input[type="checkbox"][name="mixedTranslation"]').each(function () {
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
                alwaysConsumeMouseWheel: $("#alwaysConsumeMouseWheel").prop("checked"),
                submitButtonPosition: $('#submitButtonPosition').val(),
                cppCodeTemplateComplete: $("#cppCodeTemplateComplete").prop("checked"),
                useLSP: $("#useLSP").prop("checked"),
                OJBetter_Bridge_WorkUri: $('#OJBetter_Bridge_WorkUri').val().replace(/\\/g, '/').replace(/\/$/, ''),
                OJBetter_Bridge_SocketUrl: $('#OJBetter_Bridge_SocketUrl').val(),
                onlineCompilerChoice: $("input[name='compiler']:checked").val(),
                notWaiteLoaded: $("#notWaiteLoaded").prop("checked"),
                updateChannel: $('#updateChannel').val(),
                updateSource: $('#updateSource').val()
            };
            // tempConfigs的数据
            const tempConfigs = {
                'deepl_config': configManager_deepl.getTempConfig(),
                'chatgpt_config': configManager_chatgpt.getTempConfig(),
                'Complet_config': configManager_complet.getTempConfig()
            }

            // 判断是否改变
            let changes = {};
            const combinedConfigs = Object.assign({}, settings, tempConfigs); // 合并settings和tempConfigs对象
            for (const [key, value] of Object.entries(combinedConfigs)) {
                const storedValue = GM_getValue(key);
                if (!OJB_deepEquals(value, storedValue)) {
                    changes[key] = { oldValue: storedValue, newValue: value };
                }
            }

            // 如果changes对象不为空，则有变化
            if (Object.keys(changes).length > 0) {
                console.log("Changes detected:", changes);
                const shouldSave = await OJB_createDialog(
                    i18next.t('saveSetting.title', { ns: 'dialog' }),
                    i18next.t('saveSetting.content', { ns: 'dialog' }),
                    [
                        i18next.t('saveSetting.buttons.0', { ns: 'dialog' }),
                        i18next.t('saveSetting.buttons.1', { ns: 'dialog' })
                    ]
                ); // 配置改变保存确认
                if (shouldSave) {
                    // 数据校验
                    // TODO
                    if (settings.deepl_type !== 'free') {
                        let selectedIndex = $('input[name="deepl_config_config_item"]:checked').length > 0;
                        if (!selectedIndex) {
                            $('.deepl_config a').removeClass('active');
                            $('.settings-page').removeClass('active');
                            $('#sidebar-translation-settings').addClass('active');
                            $('#translation-settings').addClass('active');

                            $('#deepl_config').addClass('missing');
                            return;
                        } else {
                            $('#deepl_config').removeClass('missing');
                        }
                    }
                    if (settings.translation === "openai") {
                        let selectedIndex = $('input[name="chatgpt_config_config_item"]:checked').length > 0;
                        if (!selectedIndex) {
                            $('.chatgpt_config a').removeClass('active');
                            $('.settings-page').removeClass('active');
                            $('#sidebar-translation-settings').addClass('active');
                            $('#translation-settings').addClass('active');

                            $('#chatgpt_config').addClass('missing');
                            return;
                        } else {
                            $('#chatgpt_config').removeClass('missing');
                        }
                    }
                    {
                        let selectedIndex = $('input[name="translation"]:checked').length > 0;
                        if (!selectedIndex) {
                            $('.OJBetter_setting_sidebar a').removeClass('active');
                            $('.settings-page').removeClass('active');
                            $('#sidebar-translation-settings').addClass('active');
                            $('#translation-settings').addClass('active');

                            $('#translationServices').addClass('missing');
                            return;
                        } else {
                            $('#translationServices').removeClass('missing');
                        }
                    }

                    // 保存数据
                    let refreshPage = false; // 是否需要刷新页面
                    for (const [key, value] of Object.entries(settings)) {
                        if (!refreshPage && !(key == 'translation' || key == 'darkMode' || key == 'commentTranslationChoice')) {
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
                        if (OJBetter.basic.darkMode != settings.darkMode) {
                            OJBetter.basic.darkMode = settings.darkMode;
                            // 移除旧的事件监听器
                            changeEventListeners.forEach(listener => {
                                mediaQueryList.removeEventListener('change', listener);
                            });

                            if (OJBetter.basic.darkMode == "follow") {
                                changeEventListeners.push(handleColorSchemeChange);
                                mediaQueryList.addEventListener('change', handleColorSchemeChange);
                                $('html').removeAttr('data-theme');
                            } else if (OJBetter.basic.darkMode == "dark") {
                                $('html').attr('data-theme', 'dark');
                                if (OJBetter.monaco.editor) {
                                    monaco.editor.setTheme('vs-dark');
                                }
                            } else {
                                $('html').attr('data-theme', 'light');
                                if (OJBetter.monaco.editor) {
                                    monaco.editor.setTheme('vs');
                                }
                                // 移除旧的事件监听器
                                const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
                                window.matchMedia('(prefers-color-scheme: dark)');
                            }
                        }
                        // 更新配置信息
                        OJBetter.translation.choice = settings.translation;
                        OJBetter.translation.comment.choice = settings.commentTranslationChoice;
                    }
                }
            }
            OJB_closeAndRemoveModal(settingMenu);
            $settingBtns.prop("disabled", false).removeClass("open");
        });
    });
};

// html2markdown转换/处理规则
const turndownService = new TurndownService({ bulletListMarker: '-' });

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

// property-title
turndownService.addRule('property-title', {
    filter: function (node) {
        return (
            node.nodeName === 'DIV' &&
            node.classList.contains('property-title')
        )
    },
    replacement: function (content) {
        return content + ': '
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
            return OJBetter.translation.waitTime;
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

/**
 * 检测文本是否可能为代码片段
 * @param {string} text 待检测的文本
 * @returns {boolean} 是否可能为代码片段
 */
function isLikelyCodeSnippet(text) {
    // 移除LaTeX公式部分
    const cleanedText = text.replace(/(\$\$?[\s\S]*?\$\$?)/g, '');

    // 代码的关键字
    const keywords = [
        'int', 'float', 'return', 'if', 'else', 'while', 'for', 'switch', 'case', 'break', 'continue',
        'class', 'public', 'private', 'protected', 'void', 'static', 'const', 'enum', 'struct',
        'char', 'double', 'long', 'include', 'def', 'import', 'from', 'as', 'elif', 'try', 'except',
        'raise', 'with', 'lambda', 'print'
    ];
    // 代码的特殊字符
    const codeChars = [';', '{', '}', '<', '>', '=', '+', '-',
        '&', '|', '#', ':', '\'\'\'', '\"\"\"', '->'];

    // 普通文本的标点符号
    const textChars = ['.', ',', '?', '!', ':', '"', "'"];

    // 关键字的数量
    const keywordCount = keywords.reduce((count, keyword) => {
        const regex = new RegExp("\\b" + keyword + "\\b", 'gi');
        return count + (cleanedText.match(regex) || []).length;
    }, 0);

    // 特殊字符的数量
    const codeCharCount = codeChars.reduce((count, char) => {
        const regex = new RegExp("\\" + char, 'g');
        return count + (cleanedText.match(regex) || []).length;
    }, 0);

    // 普通文本字符的数量
    const textCharCount = textChars.reduce((count, char) => {
        const regex = new RegExp("\\" + char, 'g');
        return count + (cleanedText.match(regex) || []).length;
    }, 0);

    // 检查Python的缩进特征
    const hasPythonIndentation = cleanedText.includes('\n    ') || cleanedText.includes('\n\t');

    // 如果代码关键字数量或者特殊代码字符数量显著高于普通文本标点符号数量，或者存在Python缩进，则可能是代码
    if (keywordCount > textCharCount * 2 || codeCharCount > textCharCount * 2 || hasPythonIndentation) {
        return true;
    }

    return false;
}

/**
 * 加载按钮相关函数
 */
async function initButtonFunc() {
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
     * 为按钮设置图标
     * @param {string} icon 图标
     * @returns {JQuery<HTMLElement>} 按钮
     */
    $.fn.setButtonIcon = function (icon) {
        let i = this.find("i");
        if (i.length != 0 && i.hasClass("iconfont")) {
            i.html(icon);
        } else {
            i = $(`<i>${icon}</i>`);
            this.prepend(i);
        }
        return this;
    }

    /** 
     * 设置按钮为加载等待状态
     */
    $.fn.setButtonLoading = function () {
        this.addClass("loading");
        this.prop("disabled", true);
        return this;
    }

    /**
     * 解除按钮的加载等待状态
     */
    $.fn.setButtonLoaded = function () {
        this.removeClass("loading");
        this.prop("disabled", false);
        return this;
    }

    /**
     * 为按钮设置popover提示文本
     * @param {string} text 文本
     * @returns {JQuery<HTMLElement>} 按钮
     */
    $.fn.setButtonPopover = function (text) {
        // find if has popover_content class element
        let popover_content = this.find(".popover_content");
        if (popover_content.length != 0) {
            popover_content.text(text);
        } else {
            popover_content = $(`<span class="popover_content">${text}</span>`);
            this.append(popover_content);
        }
        return this;
    }

    /**
     * 获取MarkDown
     * @returns {string} MarkDown
     */
    $.fn.getMarkdown = function () {
        const markdown = this.data('markdown');
        if (markdown === undefined) {
            const htmlContent = this.html();
            const newMarkdown = turndownService.turndown(htmlContent);
            this.data('markdown', newMarkdown);
            return newMarkdown;
        }
        return markdown;
    }

    // 设置按钮状态
    $.fn.setButtonState = function (state, popoverText = null, disabled = false) {
        this.data('buttonState', state)
            .prop('disabled', disabled)
            .css('cursor', disabled ? 'not-allowed' : 'pointer')
            .removeClass('running success enabled error loading redo');
        if (popoverText) this.setButtonPopover(popoverText);

        if (state !== 'initial') this.addClass(state);
        return this;
    };

    // 为按钮添加鼠标悬浮重试
    $.fn.setHoverRedo = function () {
        this.hover(() => {
            prevState = this.getButtonState();
            if (prevState !== "normal" && prevState !== "running") {
                this.setButtonState('redo');
            }
        }, () => {
            const currentState = this.getButtonState();
            if (prevState !== "normal" && ["normal", "redo"].includes(currentState)) {
                this.setButtonState(prevState);
                prevState = null;
            }
        });
    };

    // 获取按钮状态
    $.fn.getButtonState = function () {
        return this.data('buttonState') || 'normal';
    };

    // 设置翻译按钮状态
    $.fn.setTransButtonState = function (state, text = null) {
        const popoverText = text || i18next.t(`trans.${state}`, { ns: 'button' });
        const disabled = state === 'running' || state === 'loading';
        this.setButtonState(state, popoverText, disabled);
        return this;
    };

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

    // 按钮点击效果
    $(document).on('mousedown', '.ojb_btn', function () {
        $(this).addClass('active').on('animationend', () => $(this).removeClass('active'));
    });
}

/**
 * 添加题目markdown转换/复制/翻译按钮面板
 * @param {HTMLElement} element 需要添加按钮面板的元素
 * @param {string} suffix 按钮面板id后缀
 * @param {string} type 按钮面板添加位置
 * @param {boolean} is_simple 是否是简单模式
 * @returns {object} 返回按钮面板元素
 */
function addButtonPanel(element, suffix, type, is_simple = false) {
    let text;
    if (OJBetter.translation.comment.transMode == "1") text = i18next.t('trans.segment', { ns: 'button' });
    else if (OJBetter.translation.comment.transMode == "2") text = i18next.t('trans.select', { ns: 'button' });
    else text = i18next.t('trans.normal', { ns: 'button' });

    let panel = $(`<div class='html2md-panel input-output-copier ${is_simple ? 'is_simple' : ''}'></div>`);
    let viewButton = $(`
        <button class='ojb_btn ojb_btn_popover top' id='html2md-view${suffix}'>
            <i class="iconfont">&#xe7e5;</i>
            <span class="popover_content">${i18next.t('md.normal', { ns: 'button' })}</span>
        </button>`);
    let copyButton = $(`
        <button class='ojb_btn ojb_btn_popover top' id='html2md-cb${suffix}'>
            <i class="iconfont">&#xe608;</i>
            <span class="popover_content">${i18next.t('copy.normal', { ns: 'button' })}</span>
        </button>`);
    let translateButton = $(`
        <button class='ojb_btn translateButton ojb_btn_popover top' id='translateButton${suffix}'>
            <i class="iconfont">&#xe6be;</i>
            <span class="popover_content">${text}</span>
        </button>`);
    if (!is_simple) panel.append(viewButton);
    if (!is_simple) panel.append(copyButton);
    panel.append(translateButton);
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
async function addButtonWithHTML2MD(button, element, suffix, type) {
    /**
     * 改变按钮状态
     * @param {string} state 状态
     */
    function changeButtonState(state) {
        if (state == "loading") {
            button.setButtonLoading();
            button.setButtonPopover(i18next.t('state.waitMathJax', { ns: 'button' }));
        } else if (state == "loaded") {
            button.setButtonLoaded();
            button.setButtonPopover(i18next.t('md.normal', { ns: 'button' }));
        } else if (state == "normal") {
            button.removeClass("enabled");
            button.setButtonPopover(i18next.t('md.normal', { ns: 'button' }));
        } else if (state == "mdView") {
            button.addClass("enabled");
            button.setButtonPopover(i18next.t('md.reduction', { ns: 'button' }));
        } else if (state == "disabled") {
            button.prop("disabled", true);
            button.setButtonPopover(i18next.t('md.disabled', { ns: 'button' }));
        }
    }

    if (OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru) {
        changeButtonState("disabled");
        return;
    } else {
        changeButtonState("loading");
        await waitForMathJaxIdle();
        changeButtonState("loaded");
    }

    button.click(OJB_debounce(function () {
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
                changeButtonState("mdView");
            } else {
                changeButtonState("normal");
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

    if (OJBetter.preference.hoverTargetAreaDisplay && !OJBetter.typeOfPage.is_oldLatex && !OJBetter.typeOfPage.is_acmsguru) {
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
async function addButtonWithCopy(button, element, suffix, type) {
    /**
     * 改变按钮状态
     * @param {string} state 状态
     */
    function changeButtonState(state) {
        if (state == "loading") {
            button.setButtonLoading();
            button.setButtonPopover(i18next.t('state.waitMathJax', { ns: 'button' }));
        } else if (state == "loaded") {
            button.setButtonLoaded();
            button.setButtonPopover(i18next.t('copy.normal', { ns: 'button' }));
        } else if (state == "normal") {
            button.setButtonPopover(i18next.t('copy.normal', { ns: 'button' }));
        } else if (state == "copied") {
            button.setButtonPopover(i18next.t('copy.copied', { ns: 'button' }));
        } else if (state == "disabled") {
            button.prop("disabled", true);
            button.setButtonPopover(i18next.t('copy.disabled', { ns: 'button' }));
        }
    }

    // 等待MathJax队列完成
    if (OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru) {
        changeButtonState("disabled");
        return;
    } else {
        changeButtonState("loading");
        await waitForMathJaxIdle();
        changeButtonState("loaded");
    }

    button.click(OJB_debounce(function () {
        var target = $(element).get(0);

        var markdown = $(element).getMarkdown();

        GM_setClipboard(markdown);

        $(this).addClass("success");
        changeButtonState("copied");


        // 更新复制按钮文本
        setTimeout(() => {
            $(this).removeClass("success");
            changeButtonState("normal")
        }, 2000);
    }));

    if (OJBetter.preference.hoverTargetAreaDisplay && !OJBetter.typeOfPage.is_oldLatex && !OJBetter.typeOfPage.is_acmsguru) {
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
    // 添加可指定翻译服务的方法调用
    button.data("translatedItBy", function (translation) {
        button.setTransButtonState('running', i18next.t('trans.wait', { ns: 'button' }));
        OJBetter.common.taskQueue.addTask(translation, () => transTask(button, element, type, is_comment, translation), translation == 'openai');
    });

    // 等待MathJax队列完成
    button.setButtonLoading();
    await waitForMathJaxIdle();
    button.setButtonLoaded();

    // 标记目标文本是短字符文本
    {
        let text = $(element).getMarkdown();
        let length = text.length;
        if (length > OJBetter.translation.auto.shortTextLength || isLikelyCodeSnippet(text)) {
            button.setNotAutoTranslate();
        }
        // button.after(`<span>${length}</span>`); // 显示字符数
    }

    button.click(OJB_debounce(async function () {
        // 重新翻译
        let resultStack = $(this).getResultFromTransButton();
        if (resultStack) {
            let pElements = $(element).find("p.block_selected:not(li p), li.block_selected");
            for (let item of resultStack) {
                if (OJBetter.translation.retransAction == "0") {
                    // 选段翻译不直接移除旧结果
                    if (OJBetter.translation.comment.transMode == "2") {
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
        button.setTransButtonState('running', i18next.t('trans.wait', { ns: 'button' }));
        OJBetter.common.taskQueue.addTask(OJBetter.translation.choice, () => transTask(button, element, type, is_comment), OJBetter.translation.choice == 'openai');
    }));

    // 重新翻译提示
    let prevState;
    button.hover(() => {
        prevState = button.getButtonState();
        if (prevState !== "normal" && prevState !== "running") {
            button.setTransButtonState('redo');
        }
    }, () => {
        const currentState = button.getButtonState();
        if (prevState !== "normal" && ["normal", "redo"].includes(currentState)) {
            button.setTransButtonState(prevState);
            prevState = null;
        }
    });

    // 目标区域指示
    if (OJBetter.preference.hoverTargetAreaDisplay) {
        button.addHoverOverlay($(element));
    }

    // 翻译右键切换菜单
    $(document).on('contextmenu', '#translateButton' + suffix, function (e) {
        e.preventDefault();

        // 是否为评论的翻译
        let is_comment = button.IsCommentButton();

        // 移除旧的
        if (!$(e.target).closest('.OJBetter_contextmenu').length) {
            $('.OJBetter_contextmenu').remove();
        }

        var menu = $('<div class="OJBetter_contextmenu"></div>');
        var translations = [
            { value: 'deepl', name: i18next.t('translation.options.services.deepl', { ns: 'settings' }) },
            { value: 'iflyrec', name: i18next.t('translation.options.services.iflyrec', { ns: 'settings' }) },
            { value: 'youdao', name: i18next.t('translation.options.services.youdao', { ns: 'settings' }) },
            { value: 'google', name: i18next.t('translation.options.services.google', { ns: 'settings' }) },
            { value: 'caiyun', name: i18next.t('translation.options.services.caiyun', { ns: 'settings' }) },
            { value: 'openai', name: i18next.t('translation.options.services.openai.name', { ns: 'settings' }) }
        ];

        // Function to check if the service supports the target language
        function supportsTargetLanguage(service, targetLang) {
            return OJBetter.supportList.translationSupport[service] && OJBetter.supportList.translationSupport[service][targetLang] !== undefined;
        }

        if (is_comment) {
            var label = $(`<label><input type="radio" name="translation" value="0">
            <span class="OJBetter_contextmenu_label_text">
            ${i18next.t('translation.preference.comment_translation_choice.services.follow', { ns: 'settings' })}
            </span></label>`);
            menu.append(label);
        }
        translations.forEach(function (translation) {
            if (supportsTargetLanguage(translation.value, OJBetter.translation.targetLang)) {
                var label = $(`<label><input type="radio" name="translation" value="${translation.value}">
                <span class="OJBetter_contextmenu_label_text">${translation.name}</span></label>`);
                menu.append(label);
            }
        });

        // 初始化
        if (is_comment) {
            menu.find(`input[name="translation"][value="${OJBetter.translation.comment.choice}"]`).prop('checked', true);
        } else {
            menu.find(`input[name="translation"][value="${OJBetter.translation.choice}"]`).prop('checked', true);
        }
        menu.css({
            top: e.pageY + 'px',
            left: e.pageX + 'px'
        }).appendTo('body');

        $(document).one('change', 'input[name="translation"]', function () {
            if (is_comment) {
                OJBetter.translation.comment.choice = $('input[name="translation"]:checked').val();
                GM_setValue("commentTranslationChoice", OJBetter.translation.comment.choice);
            } else {
                OJBetter.translation.choice = $('input[name="translation"]:checked').val();
                GM_setValue("translation", OJBetter.translation.choice);
            }
            $('.OJBetter_contextmenu').remove();
        });

        // 点击区域外关闭菜单
        function handleClick(event) {
            if (!$(event.target).closest('.OJBetter_contextmenu').length) {
                $('.OJBetter_contextmenu').remove();
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
    if (OJBetter.translation.comment.transMode == "1") {
        // 分段翻译
        var pElements = $(element).find("p:not(li p), li, .OJBetter_acmsguru");
        for (let i = 0; i < pElements.length; i++) {
            target = $(pElements[i]).eq(0).clone();
            element_node = pElements[i];
            await process(button, target, element_node, type, is_comment, count, translation);
        }
    } else if (OJBetter.translation.comment.transMode == "2") {
        // 选段翻译
        var pElements = $(element).find("p.block_selected:not(li p), li.block_selected, .OJBetter_acmsguru");
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
        button.setTransButtonState('success');
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
        const shouldSkip = await OJB_createDialog(
            i18next.t('skipFold.title', { ns: 'dialog' }),
            i18next.t('skipFold.content', { ns: 'dialog' }),
            [
                i18next.t('skipFold.buttons.0', { ns: 'dialog' }),
                i18next.t('skipFold.buttons.1', { ns: 'dialog' })
            ],
            true
        ); //跳过折叠块确认
        if (shouldSkip) {
            $(target).find('.spoiler').remove();
        } else {
            $(target).find('.html2md-panel').remove();
        }
    }

    // 等待结果
    let result;
    button.setTransButtonState('running');
    result = await blockProcessing(button, target, element_node, is_comment, translation);
    button.pushResultToTransButton(result);

    if (result.status == "error") count.errerNum += 1;
    else if (result.status == "skip") count.skipNum += 1;
    $(target).remove();
}

// 块处理
async function blockProcessing(button, target, element_node, is_comment, translation) {
    if (OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru) {
        target.markdown = $(target).html();
    } else if (!target.markdown) {
        target.markdown = turndownService.turndown($(target).html());
    }
    var result = await translateProblemStatement(button, target.markdown, element_node, is_comment, translation);
    if (result.status == "skip") {
        button.setTransButtonState('error', i18next.t('trans.tooLong', { ns: 'button' }));
        result.translateDiv.close();
    } else if (result.status == "error" || !result.rawData.done) {
        result.translateDiv.setError();
        result.translateDiv.setRawData(result.rawData);
        result.translateDiv.showDebugButton();
        button.setTransButtonState('error', i18next.t('trans.error', { ns: 'button' }));
        $(target).remove();
    }
    return result;
}

/**
 * 选段翻译支持
 */
async function multiChoiceTranslation() {
    GM_addStyle(`
        .topic .content .ttypography {
            overflow: initial;
        }
    `);

    $(document).on('click', 'p, li:not(:has(.comment)), .OJBetter_acmsguru', function (e) {
        let $this = $(this);
        e.stopPropagation();
        if ($this.hasClass('block_selected')) {
            $this.removeClass('block_selected');
            // 移除对应的按钮 
            $('.OJBetter_MiniTranslateButton').remove("#translateButton_selected_" + $this.attr('OJBetter_p_id'));
        } else {
            let id = OJB_getRandomNumber(8);
            $this.attr('OJBetter_p_id', id);
            $this.addClass('block_selected');
            // 添加按钮 
            let menu = $(`<div class="OJBetter_MiniTranslateButton" id='translateButton_selected_${id}'>${translateIcon}</div>`)
                .css({
                    left: $($this).outerWidth(true) + $($this).position().left + 10 + 'px',
                });
            $this.before(menu);

            $("#translateButton_selected_" + id).click(async function () {
                // 处理旧的结果
                if ($this.attr('translated')) {
                    let result = $this.data("resultData");
                    if (OJBetter.translation.retransAction == "0") {
                        result.translateDiv.close();
                    } else {
                        result.translateDiv.foldMainDiv();
                    }
                }
                // 翻译
                let target = $this.eq(0).clone();
                let result = await blockProcessing(OJBetter.translation.choice, target, $this.eq(0), $("#translateButton_selected_" + id), false);
                $this.data("resultData", result);
                $this.removeClass('block_selected');
                // 移除对应的按钮 
                $('.OJBetter_MiniTranslateButton').remove("#translateButton_selected_" + id);
                $this.attr('translated', '1'); // 标记已翻译
            });
        }
    });
}

/**
 * 为acmsguru题面重新划分div
 */
async function acmsguruReblock() {
    if (OJBetter.translation.comment.transMode == '0') {
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
                '<div align="left" class="OJBetter_acmsguru" >$<text></div>');
            $(this).html(replacedHtml);
        });
    }
}

/**
 * 添加MD/复制/翻译按钮
 */
async function addConversionButton() {
    // 题目页添加按钮
    if (OJBetter.typeOfPage.is_problem) {
        let exContentsPageClasses = ["sample-tests"];
        $('.problem-statement').children('div').each((i, e) => {
            var className = $(e).attr('class');
            if (!exContentsPageClasses.includes(className)) {
                var id = "_problem_" + OJB_getRandomNumber(8);
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
        if (!OJBetter.typeOfPage.is_problem || OJBetter.typeOfPage.is_acmsguru) {
            let id = "_ttypography_" + OJB_getRandomNumber(8);
            let panel = addButtonPanel(this, id, "this_level");
            addButtonWithHTML2MD(panel.viewButton, this, id, "this_level");
            addButtonWithCopy(panel.copyButton, this, id, "this_level");
            addButtonWithTranslation(panel.translateButton, this, id, "this_level", is_comment);
        }
    });

    // 完整题目集页特殊处理
    if (OJBetter.typeOfPage.is_completeProblemset) {
        let exContentsPageClasses = ["sample-tests"];
        $('.problem-statement').each(function () {
            $(this).children('div').each(function (i, e) {
                var className = $(e).attr('class');
                if (!exContentsPageClasses.includes(className)) {
                    var id = "_problem_" + OJB_getRandomNumber(8);
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
            let id = "_spoiler_" + OJB_getRandomNumber(8);
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
                let id = "_titled_" + OJB_getRandomNumber(8);
                let nextDiv = $(this).next().children().get(0);
                if (!nextDiv) return;
                let panel = addButtonPanel(nextDiv, id, "child_level", true);
                addButtonWithTranslation(panel.translateButton, nextDiv, id, "child_level");
            });
        });
    })();
    if (OJBetter.typeOfPage.is_mSite) {
        $("div[class='_IndexPage_notice']").each(function () {
            let id = "_titled_" + OJB_getRandomNumber(8);
            let panel = addButtonPanel(this, id, "this_level", true);
            addButtonWithTranslation(panel.translateButton, this, id, "this_level");
        });
    }

    // 添加按钮到比赛QA部分
    $(".question-response").each(function () {
        let id = "_question_" + OJB_getRandomNumber(8);
        let panel = addButtonPanel(this, id, "this_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "this_level");
    });
    if (OJBetter.typeOfPage.is_mSite) {
        $("div._ProblemsPage_announcements table tbody tr:gt(0)").each(function () {
            var $nextDiv = $(this).find("td:first");
            let id = "_question_" + OJB_getRandomNumber(8);
            let panel = addButtonPanel($nextDiv, id, "this_level", true);
            addButtonWithTranslation(panel.translateButton, $nextDiv, id, "this_level");
        });
    }

    // 添加按钮到弹窗confirm-proto部分
    $(".confirm-proto").each(function () {
        let id = "_titled_" + OJB_getRandomNumber(8);
        var $nextDiv = $(this).children().get(0);
        let panel = addButtonPanel($nextDiv, id, "this_level", true);
        addButtonWithTranslation(panel.translateButton, $nextDiv, id, "this_level");
    });

    // 添加按钮到_CatalogHistorySidebarFrame_item部分
    $("._CatalogHistorySidebarFrame_item").each(function () {
        let id = "_history_sidebar_" + OJB_getRandomNumber(8);
        let panel = addButtonPanel(this, id, "this_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "this_level");
    });

    $(".problem-lock-link").on("click", function () {
        $(".popup .content div").each(function () {
            let id = "_popup_" + OJB_getRandomNumber(8);
            let panel = addButtonPanel(this, id, "this_level", true);
            addButtonWithTranslation(panel.translateButton, this, id, "this_level");
        });
    });

    // 添加按钮到弹窗alert部分
    $(".alert:not(.OJBetter_alert)").each(function () {
        let id = "_alert_" + OJB_getRandomNumber(8);
        let panel = addButtonPanel(this, id, "child_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "child_level");
    });

    // 添加按钮到talk-text部分
    $(".talk-text").each(function () {
        let id = "_talk-text_" + OJB_getRandomNumber(8);
        let panel = addButtonPanel(this, id, "child_level", true);
        addButtonWithTranslation(panel.translateButton, this, id, "child_level");
    });
};

/**
 * 等待LaTeX渲染队列全部完成
 * @returns {Promise} 完成渲染
 */
function waitForMathJaxIdle() {
    return new Promise((resolve, reject) => {
        var intervalId = setInterval(() => {
            var queue = MathJax.Hub.queue;
            if (queue.pending === 0 && queue.running === 0) {
                clearInterval(intervalId);
                resolve();
            }
        }, 100);
    });
}

// 块替换
function replaceBlock(text, matches, replacements) {
    try {
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            let replacement = '';
            if (OJBetter.translation.replaceSymbol === "1") {
                replacement = `【${i + 1}】`;
            } else if (OJBetter.translation.replaceSymbol === "2") {
                replacement = `{${i + 1}}`;
            } else if (OJBetter.translation.replaceSymbol === "3") {
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

/**
 * 翻译结果面板
 */
class TranslateDiv {
    /**
     * 构造函数
     * @param {string} id 指定翻译框的id
     */
    constructor(id) {
        this.id = id;
        this.div = $('<div>').attr('id', id).addClass('translateDiv bounce-in');
        if (!OJBetter.typeOfPage.is_completeProblemset) {
            this.div.addClass('input-output-copier');
        }
        this.panelDiv = $('<div>').addClass('translate-problem-statement-panel');
        this.div.append(this.panelDiv);

        // 主要信息
        this.mainDiv = $('<div>').addClass('translate-problem-statement');
        this.span = $('<span>');
        this.mainDiv.append(this.span);
        this.div.append(this.mainDiv);
        this.mainDivState = {
            current: 'transHTML',
            transHTML: '',
            rawDataHTML: ''
        };

        // 顶栏信息
        this.topText = $('<div>').addClass('topText');
        this.panelDiv.append(this.topText);

        // 右侧
        this.rightDiv = $('<div>').css('display', 'flex');
        this.panelDiv.append(this.rightDiv);
        this.debugButton = $(`
        <button class='ojb_btn ojb_btn_popover top'>
            <i class="iconfont">&#xe641;</i>
            <span class="popover_content">${i18next.t('rawData.normal', { ns: 'button' })}</span>
        </button>`).hide();
        this.rightDiv.append(this.debugButton);
        this.queryBalanceButton = $(`
        <button class='ojb_btn ojb_btn_popover top'>
            <i class="iconfont">&#xe6ae;</i>
            <span class="popover_content">${i18next.t('queryBalance.normal', { ns: 'button' })}</span>
        </button>`).hide();
        this.rightDiv.append(this.queryBalanceButton);
        this.copyButton = $(`
        <button class='ojb_btn ojb_btn_popover top'>
            <i class="iconfont">&#xe608;</i>
            <span class="popover_content">${i18next.t('copy.normal', { ns: 'button' })}</span>
        </button>`);
        this.rightDiv.append(this.copyButton);
        this.upButton = $(`
        <button class='ojb_btn ojb_btn_popover top'>
            <i class="iconfont">&#xe601;</i>
            <span class="popover_content">${i18next.t('fold.normal', { ns: 'button' })}</span>
        </button>`);
        this.rightDiv.append(this.upButton);
        this.closeButton = $(`
        <button class='ojb_btn ojb_btn_popover top'>
            <i class="iconfont">&#xe614;</i>
            <span class="popover_content">${i18next.t('close.normal', { ns: 'button' })}</span>
        </button>`);
        this.rightDiv.append(this.closeButton);
    }

    /**
     * 获取翻译框
     * @returns {JQuery<HTMLElement>} 返回翻译框
     */
    getDiv() {
        return this.div;
    }

    /**
     * 设置翻译框顶部的文本
     * @param {string} text 翻译框顶部的文本
     */
    setTopText(text) {
        this.div.attr("data-topText", text);
        this.topText.text(text);
    }

    /**
     * 获取翻译框顶部的文本
     * @returns {string} 返回翻译框顶部的文本
     */
    getTopText() {
        return this.topText.text();
    }

    /**
     * 更新翻译框内容
     * @param {string} text 文本内容
     * @param {boolean} is_escapeHTML 是否转义HTML标签，为true则HTML标签将作为普通文本处理，默认为true
     * @param {boolean} is_renderLaTeX 是否渲染LaTeX，为true则会渲染LaTeX，默认为true
     */
    updateTranslateDiv(text, is_escapeHTML = true, is_renderLaTeX = true,) {
        // 渲染MarkDown
        let md = window.markdownit({
            html: !is_escapeHTML,
        });
        if (!text) text = "";
        let html = md.render(text);
        this.mainDiv.html(html);
        // 渲染Latex
        if (is_renderLaTeX) {
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.mainDiv.get(0)]);
        }
    }

    /**
     * 关闭元素
     */
    close() {
        this.closeButton.click();
    }

    /**
     * 注册收起按钮事件
     */
    registerUpButtonEvent() {
        this.upButton.on("click", () => {
            // 如果没有reverse类，说明是展开状态
            if (!this.upButton.hasClass("reverse")) {
                // 执行收起操作
                this.upButton.addClass("reverse");
                this.upButton.setButtonState('initial', i18next.t('fold.unfold', { ns: 'button' }));
                OJB_toggleCollapseExpand(this.mainDiv.get(0));
            } else {
                // 执行展开操作
                this.upButton.removeClass("reverse");
                this.upButton.setButtonState('initial', i18next.t('fold.normal', { ns: 'button' }));
                OJB_toggleCollapseExpand(this.mainDiv.get(0));
            }
        });
    }

    /**
     * 注册关闭按钮事件
     */
    registerCloseButtonEvent() {
        this.closeButton.on("click", () => {
            $(this.div).remove();
            $(this.panelDiv).remove();
            if (OJBetter.typeOfPage.is_problem && OJBetter.translation.memory.enabled) {
                OJBetter.translation.memory.ttTree.rmTransResultMap(this.id); // 移除ttTree中的数据
                OJBetter.translation.memory.ttTree.refreshNode(".ttypography");
                updateTransDBData(OJBetter.translation.memory.ttTree.getNodeDate(), OJBetter.translation.memory.ttTree.getTransResultMap()); // 更新DB中的数据
            }
        });
    }

    /**
     * 注册复制按钮事件
     * @param {string} text 复制的文本
     */
    registerCopyButtonEvent(text) {
        this.copyButton.on("click", () => {
            GM_setClipboard(text);
            this.copyButton.setButtonState('success', i18next.t('copy.copied', { ns: 'button' }));
            // 复制提示
            setTimeout(() => {
                this.copyButton.setButtonState('initial', i18next.t('copy.normal', { ns: 'button' }));
            }, 2000);
        });
    }

    /**
     * 禁用复制按钮
     */
    disableCopyButton() {
        this.copyButton.css({ 'fill': '#ccc' });
        this.copyButton.off("click");
    }

    /**
     * 设置面板为error状态
     */
    setError() {
        this.div.addClass('error');
        this.panelDiv.addClass('error');
        this.mainDiv.addClass('error');
    }

    /**
     * 设置原始数据数据
     * @param {Object} Object 原始数据
     */
    setRawData(Object) {
        this.mainDivState.rawDataHTML = $("<pre>").text(JSON.stringify(Object, null, 4)).get(0);
        if (this.mainDivState.current === 'rawDataHTML') {
            this.renderMainDiv();
        }
    }

    /**
     * 切换结果面板与原始数据面板
     */
    switchMainDiv() {
        // 在切换之前，保存当前内容的状态
        this.mainDivState[this.mainDivState.current] = this.mainDiv.html();
        // 切换当前状态
        this.debugButton.setButtonState(this.mainDivState.current === 'transHTML' ? 'enabled' : 'initial');
        this.mainDivState.current = this.mainDivState.current === 'transHTML' ? 'rawDataHTML' : 'transHTML';
        // 渲染新的当前状态
        this.renderMainDiv();
    }

    // 渲染当前内容到 mainDiv
    renderMainDiv() {
        requestAnimationFrame(() => {
            this.mainDiv.html(this.mainDivState[this.mainDivState.current]);
        });
    }

    /**
     * 注册debug按钮事件
     */
    registerDebugButtonEvent() {
        this.debugButton.on("click", () => {
            this.switchMainDiv();
        });
    }

    /**
     * 显示debug按钮
     */
    showDebugButton() {
        this.debugButton.show();
        this.registerDebugButtonEvent();
    }

    /**
     * 注册查询余额按钮事件
     * @param {function} callback 查询回调函数
     */
    registerQueryBalanceButtonEvent(callback) {
        this.queryBalanceButton.on("click", async () => {
            this.queryBalanceButton.setButtonState('loading', i18next.t('queryBalance.loading', { ns: 'button' }));
            try {
                const balance = await callback();
                this.queryBalanceButton.setButtonState('success', `${i18next.t('queryBalance.success', { ns: 'button' })} ${balance}`);
            } catch (error) {
                this.queryBalanceButton.setButtonState('error', `${i18next.t('queryBalance.error', { ns: 'button' })} ${error.message}`);
            }
        });
    }

    /**
     * 显示余额查询按钮
     * @param {string} server 服务名称
     */
    showQueryBalanceButton(server) {
        if (server == 'deepl') {
            const quotaConfig = OJBetter.deepl.config.quota;
            if (quotaConfig.url && quotaConfig.surplus && quotaConfig.header) {
                this.queryBalanceButton.show();
                this.registerQueryBalanceButtonEvent(() => {
                    return queryServerBalance(OJBetter.deepl.config.quota);
                });
            }
        } else if (server == 'openai') {
            const quotaConfig = OJBetter.chatgpt.config.quota;
            if (quotaConfig.url && quotaConfig.surplus && quotaConfig.header) {
                this.queryBalanceButton.show();
                this.registerQueryBalanceButtonEvent(() => {
                    return queryServerBalance(OJBetter.chatgpt.config.quota);
                });
            }
        }
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
        if (!OJBetter.typeOfPage.is_oldLatex && !OJBetter.typeOfPage.is_acmsguru) {
            translateDiv.registerCopyButtonEvent(translatedText);
        } else {
            translateDiv.disableCopyButton();
        }
        translateDiv.updateTranslateDiv(translatedText, !(OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru));
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
        transButton.setTransButtonState('success');
    }
}

// 更新TransDB中的翻译数据
async function updateTransDBData(nodeDate, transResultMap) {
    var url = window.location.href.replace(/#/, "");
    try {
        await OJBetter.common.database.translateData.put({ url, transResultMap, nodeDate });
        return 'translateData saved successfully';
    } catch (error) {
        throw new Error(`Failed to save translateData: ${error}`);
    }
}

// 获取TransDB中保存的翻译数据
async function getTransDBData() {
    var url = window.location.href.replace(/#/, "");
    try {
        const result = await OJBetter.common.database.translateData.get(url);
        return result;
    } catch (error) {
        throw new Error(`Failed to get translateData: ${error}`);
    }
}

/**
 * 翻译结果恢复功能初始化
 * @returns 
 */
async function initTransResultsRecover() {
    OJBetter.translation.memory.ttTree = new ElementsTree(".ttypography"); // 初始化当前页面.ttypography元素的结构树
    let result = await getTransDBData();
    if (!result) return;
    OJBetter.translation.memory.ttTree.setNodeDate(result.nodeDate);
    OJBetter.translation.memory.ttTree.setTransResultMap(result.transResultMap);
    OJBetter.translation.memory.ttTree.recover($(".ttypography"));
}

/**
 * 自动翻译
 */
async function initTransWhenViewable() {
    await waitForMathJaxIdle();

    const elements = $('.ttypography, .comments').find('.translateButton');
    const observers = [];

    // Use a single Intersection Observer for all elements
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const button = $(entry.target);
                const state = button.getButtonState();
                const notAutoTranslate = button.getNotAutoTranslate();
                // Check if the button meets the criteria
                if (state === 'normal' && !notAutoTranslate) {
                    let trans = OJBetter.translation.choice;

                    if (OJBetter.translation.auto.mixTrans.enabled && button.IsCommentButton() && OJBetter.translation.auto.mixTrans.servers.length > 0) {
                        const randomIndex = Math.floor(Math.random() * OJBetter.translation.auto.mixTrans.servers.length);
                        trans = OJBetter.translation.auto.mixTrans.servers[randomIndex];
                    }
                    button.data("translatedItBy")(trans);
                }

                // Stop observing the element
                obs.unobserve(entry.target);
            }
        });
    });

    // Observe each element
    elements.each((i, e) => {
        observer.observe(e);
    });

    // Store the observer in case you need to disconnect it later
    observers.push(observer);
}

// 翻译主方法
async function translateProblemStatement(button, text, element_node, is_comment, translation_) {
    let status = "ok";
    let id = OJB_getRandomNumber(8);
    let matches = [];
    let replacements = {};
    let translatedText = "";
    let rawData = {
        done: false
    };

    /**
     * LaTeX替换
     * @param {string} text 
     * @returns {string}
     */
    function replaceLatex(text) {
        if (OJBetter.typeOfPage.is_oldLatex) {
            let regex = /<span\s+class="tex-span">.*?<\/span>/gi;
            matches = matches.concat(text.match(regex));
            text = replaceBlock(text, matches, replacements);
            text = text.replace(/<p>(.*?)<\/p>/g, "$1\n\n"); // <p/>标签换为换行
        } else if (OJBetter.typeOfPage.is_acmsguru) {
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
        if (OJBetter.typeOfPage.is_oldLatex) {
            translatedText = translatedText.replace(/(.+?)(\n\n|$)/g, "<p>$1</p>"); // 换行符还原为<p/>标签
            translatedText = recoverBlock(translatedText, matches, replacements);
        } else if (OJBetter.typeOfPage.is_acmsguru) {
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
        if (!OJBetter.typeOfPage.is_oldLatex && !OJBetter.typeOfPage.is_acmsguru) {
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
        if (is_comment && OJBetter.translation.comment.choice != "0") realTranlate = OJBetter.translation.comment.choice;
        else realTranlate = OJBetter.translation.choice;
    }

    // 信息
    translateDiv.setTopText(i18next.t('servers.' + realTranlate, { ns: 'translator' }) +
        i18next.t('translateDiv.topTextSuffix', { ns: 'translator' }));

    // 注册按钮
    translateDiv.registerUpButtonEvent();
    translateDiv.registerCloseButtonEvent();
    if (OJBetter.translation.choice == 'openai' || OJBetter.translation.choice == 'deepl') {
        translateDiv.showQueryBalanceButton(OJBetter.translation.choice); // 额度查询
    }

    // 翻译内容是否可能为代码片段
    if (isLikelyCodeSnippet(text)) {
        const shouldContinue = await OJB_createDialog(
            i18next.t('isLikelyCodeSnippet.title', { ns: 'dialog' }),
            i18next.t('isLikelyCodeSnippet.content', { ns: 'dialog' }),
            [
                i18next.t('isLikelyCodeSnippet.buttons.0', { ns: 'dialog' }),
                i18next.t('isLikelyCodeSnippet.buttons.1', { ns: 'dialog' })
            ],
            true
        );
        if (shouldContinue) {
            return {
                translateDiv: translateDiv,
                status: "skip",
                rawData: rawData
            };
        }
    }

    // 替换latex公式
    text = replaceLatex(text);

    // 过滤**号
    if (OJBetter.translation.filterTextWithoutEmphasis && GM_getValue("translation") !== "openai") { // TODO
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
        const shouldContinue = await OJB_createDialog(
            i18next.t('transTextLimits.title', { ns: 'dialog' }),
            i18next.t('transTextLimits.content', { ns: 'dialog', textLength: textLength, realTextLength: realTextLength }),
            [
                i18next.t('transTextLimits.buttons.0', { ns: 'dialog' }),
                i18next.t('transTextLimits.buttons.1', { ns: 'dialog' })
            ],
            true
        ); // 字数超限确认
        if (shouldContinue) {
            return {
                translateDiv: translateDiv,
                status: "skip",
                rawData: rawData
            };
        }
    }

    // 翻译
    async function translate(translation) {
        const is_renderLaTeX = !(OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru);
        const servername = i18next.t('servers.' + realTranlate, { ns: 'translator' });
        let rawData = {};
        try {
            if (translation == "deepl") {
                if (OJBetter.deepl.config.type == 'free') {
                    rawData = await translate_deepl(text);
                    translateDiv.updateTranslateDiv(`${i18next.t('transingTip.basic', { ns: 'translator', server: servername })}`, is_renderLaTeX);
                } else if (OJBetter.deepl.config.type == 'api') {
                    translateDiv.updateTranslateDiv(`${i18next.t('transingTip.deeplApi', { ns: 'translator', deepl_configName: OJBetter.deepl.config.name })}`, is_renderLaTeX);
                    if (OJBetter.deepl.config.apiGenre == 'deeplx') {
                        rawData = await translate_deeplx(text);
                    } else {
                        if (OJBetter.deepl.enableEmphasisProtection) text = convertBoldMarkdownToHTML(text);
                        if (OJBetter.deepl.enableLinkProtection) text = convertLinksMarkdownToHTML(text);
                        if (OJBetter.deepl.config.apiGenre == 'api-free') {
                            rawData = await translate_deepl_api_free(text);
                        } else if (OJBetter.deepl.config.apiGenre == 'api-pro') {
                            rawData = await translate_deepl_api_pro(text);
                        }
                        if (OJBetter.deepl.enableEmphasisProtection) rawData.text = convertBoldHTMLToMarkdown(rawData.text);
                        if (OJBetter.deepl.enableLinkProtection) rawData.text = convertLinksHTMLToMarkdown(rawData.text);
                    }
                }
            } else if (translation == "iflyrec") {
                translateDiv.updateTranslateDiv(`${i18next.t('transingTip.basic', { ns: 'translator', server: servername })}`, is_renderLaTeX);
                rawData = await translate_iflyrec(text);
            } else if (translation == "youdao") {
                translateDiv.updateTranslateDiv(`${i18next.t('transingTip.basic', { ns: 'translator', server: servername })}`, is_renderLaTeX);
                rawData = await translate_youdao_mobile(text);
            } else if (translation == "google") {
                translateDiv.updateTranslateDiv(`${i18next.t('transingTip.basic', { ns: 'translator', server: servername })}`, is_renderLaTeX);
                rawData = await translate_gg(text);
            } else if (translation == "caiyun") {
                translateDiv.updateTranslateDiv(`${i18next.t('transingTip.basic', { ns: 'translator', server: servername })}`, is_renderLaTeX);
                await translate_caiyun_startup();
                rawData = await translate_caiyun(text);
            } else if (translation == "openai") {
                translateDiv.updateTranslateDiv(`${i18next.t('transingTip.openai', { ns: 'translator', openai_name: OJBetter.chatgpt.config.name })}${!OJBetter.chatgpt.isStream
                    ? i18next.t('transingTip.openai_isStream', { ns: 'translator' }) : ""}`,
                    is_renderLaTeX);
                if (OJBetter.chatgpt.isStream) {
                    // 流式传输
                    rawData = await translate_openai_stream(text, translateDiv);
                } else {
                    // 普通模式
                    rawData = await translate_openai(text);
                }
            }
            translatedText = rawData.text;
            if (!rawData.done) {
                status = "error";
            }
        } catch (e) {
            status = "error";
            rawData.message = i18next.t('error.unexpected', { ns: 'translator' });
            console.warn(e);
        }
        return rawData;
    }
    rawData = await translate(realTranlate);

    if (status == "error") {
        translateDiv.updateTranslateDiv(rawData.message);
        return {
            status: status,
            translateDiv: translateDiv,
            rawData: rawData
        };
    }

    // 还原latex公式
    translatedText = recoverLatex(translatedText);

    // 注册结果复制按钮
    if (!OJBetter.typeOfPage.is_oldLatex && !OJBetter.typeOfPage.is_acmsguru) {
        translateDiv.registerCopyButtonEvent(translatedText);
    } else {
        translateDiv.disableCopyButton();
    }

    // 翻译结果格式化
    translatedText = formatText(translatedText);

    // 保存翻译结果
    if ((OJBetter.typeOfPage.is_problem || OJBetter.typeOfPage.is_completeProblemset) && OJBetter.translation.memory.enabled) {
        OJBetter.translation.memory.ttTree.refreshNode(".ttypography"); // 刷新当前页面.ttypography元素的结构树实例
        OJBetter.translation.memory.ttTree.addTransResultMap(id, translatedText);
        updateTransDBData(OJBetter.translation.memory.ttTree.getNodeDate(), OJBetter.translation.memory.ttTree.getTransResultMap()); // 更新翻译结果到transDB
    }

    // 翻译结果面板更新
    translateDiv.updateTranslateDiv(translatedText, !(OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru));

    return {
        status: status,
        translateDiv: translateDiv,
        rawData: rawData
    };
}

//弹窗翻译
function alertZh() {
    // var _alert = window.alert;
    // window.alert = async function (msg) {
    //     _alert(msg + "\n=========翻译=========\n" + await translate_deepl(msg));
    //     return true;
    // }
};

/**
 * 折叠块展开
 */
function ExpandFoldingblocks() {
    $('.spoiler').addClass('spoiler-open');
    $('.spoiler-content').attr('style', '');
};

/**
 * 折叠块渲染优化
 */
function RenderPerfOpt() {
    GM_addStyle(`
        .spoiler-content {
            contain: layout style;
        }
    `);
}

/**
 * 评论区分页
 */
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
                <label for="items-per-page">${i18next.t('perpage', { ns: 'comments' })}</label>
                <select id="items-per-page" style="margin-right: 15px;">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
                <div class="paging" style="margin-right: 15px;">
                    <span id="current-page">1</span> / <span id="total-pages"></span>
                </div>
                <input type="text" id="jump-input" placeholder="${i18next.t('jumpTo', { ns: 'comments' })}">
                <button type="button" id="jump-btn" class="ojb_btn">${i18next.t('jump', { ns: 'comments' })}</button>
                <button id="prev-page-btn" class="ojb_btn">${i18next.t('prev', { ns: 'comments' })}</button>
                <button id="next-page-btn" class="ojb_btn">${i18next.t('next', { ns: 'comments' })}</button>
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

/**
 * 题目页相关链接栏
 */
class ProblemPageLinkbar {
    constructor() {
        this.containerElement = this.createToolbar();
        this.commandInvoker = new CommandInvoker();
    }

    /**
     * 创建工具栏
     */
    createToolbar() {
        const toolbarElement = $("<div>").attr("id", "problemToolbar").insertBefore($(".problemindexholder"));
        return new DOMContainer(toolbarElement);
    }

    /**
     * 添加按钮
     * @param {string} id 按钮id
     * @param {string} url 按钮链接
     * @param {string} text 按钮文字
     * @param {JQueryObject} icon 按钮图标
     * @param {string} iconHeight 图标高度
     * @returns {object} 按钮对象
     */
    addLinkButton(id, url, text, icon = $('<div>'), iconHeight = "22px") {
        const linkElement = $("<a>")
            .attr("href", url)
            .attr("target", "_blank")
            .addClass("ojb_btn")
            .attr("id", id);

        linkElement.append(icon);
        icon.css("height", iconHeight);

        const textSpan = $("<span>").html(text);
        linkElement.append(textSpan);

        this.commandInvoker.execute(new AddElementCommand(this.containerElement, linkElement));
        return {
            element: linkElement,
            text: textSpan,
            icon: icon
        };
    }

    /**
     * 更新链接
     * @param {object} button 按钮对象
     * @param {string} url 按钮链接
     */
    updateUrl(button, url) {
        button.element.attr("href", url);
    }

    /**
     * 更新文字
     * @param {object} button 按钮对象
     * @param {string} text 按钮文字
     */
    updateText(button, text) {
        button.text.html(text);
    }

    /**
     * 设置文字为粗体
     * @param {object} button 按钮对象
     */
    setBold(button) {
        button.text.css("font-weight", "bold");
    }

    /**
     * 更新图标
     * @param {object} button 按钮对象
     * @param {JQueryObject} icon 按钮图标
     * @param {string} iconHeight 图标高度
     */
    updateIcon(button, icon, iconHeight = "16px") {
        button.icon.remove();
        button.text.prepend(icon);
        icon.css("height", iconHeight);
        button.icon = icon;
    }

    /**
     * 添加类
     * @param {object} button 按钮对象
     * @param {string} className 类名
     */
    addClass(button, className) {
        button.element.addClass(className);
    }

    /**
     * 禁用链接按钮
     * @param {object} button 按钮对象
     */
    disableButton(button) {
        button.element.addClass("disabled");
    }

    /**
     * 启用链接按钮
     * @param {object} button 按钮对象
     */
    enableButton(button) {
        button.element.removeClass("disabled");
    }
}

/**
 * 获取题目的id
 * @param {String} url 题目的链接 
 * @returns 题目的id，形如2000A
 */
function getProblemId(url) {
    const regex = url.includes('/contest/')
        ? /\/contest\/(\d+)\/problem\/([A-Za-z\d]+)/
        : /\/problemset\/problem\/(\d+)\/([A-Za-z\d]+)/;
    const matchResult = url.match(regex);
    return matchResult && matchResult.length >= 3 ? `${matchResult[1]}${matchResult[2]}` : '';
};

/**
 * 跳转到洛谷
 * @param {ProblemPageLinkbar} problemToolbar 
 */
async function CF2luogu(problemToolbar) {
    const url = window.location.href;
    const problemId = getProblemId(url);
    const luoguButton = problemToolbar.addLinkButton(
        "luoguButton",
        "https://www.luogu.com.cn/",
        i18next.t('state.loading', { ns: 'button' }),
        $("<img>").attr("src", "https://cdn.luogu.com.cn/fe/logo.png")
    );
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

    const LuoguUrl = `https://www.luogu.com.cn/problem/CF${problemId}`;
    const result = await checkLinkExistence(LuoguUrl);
    if (problemId && result) {
        problemToolbar.updateText(luoguButton, "");
        problemToolbar.updateUrl(luoguButton, LuoguUrl);
    } else {
        problemToolbar.updateText(luoguButton, i18next.t('state.404', { ns: 'button' }));
        problemToolbar.disableButton(luoguButton);
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

/**
 * clist 访问有效性检查
 * @param {boolean} onlyCookie 是否只检查Cookie
 * @returns {Promise<boolean>} 是否有效
 */
async function validateClistConnection(onlyCookie = false) {
    const clistApiUrl = "https://clist.by:443/api/v4/contest/?limit=1&resource_id=1";
    const requestOptions = {
        method: "GET",
        url: clistApiUrl,
        timeout: 5000,
    };

    // 尝试发送请求
    async function tryRequest(options) {
        try {
            const response = await OJB_GMRequest(options);
            if (response.status === 200) {
                return { ok: true };
            } else if (response.status === 401) {
                throw new Error('unauthorized');
            } else if (response.status === 404) {
                throw new Error('not_found');
            } else {
                throw new Error('other_error');
            }
        } catch (error) {
            console.warn(`Error accessing clist.by: ${error.message}`);
            return { ok: false, error: error.message };
        }
    }

    // 尝试携带Key发送请求
    let result = await tryRequest(requestOptions);
    if (!onlyCookie && !result.ok) {
        requestOptions.headers = { "Authorization": OJBetter.clist.authorization };
        result = await tryRequest(requestOptions);
    }

    // 根据结果显示错误信息
    if (!result.ok) {
        let errorType = result.error;
        const loadingMessage = new LoadingMessage();
        let state;
        if (errorType === 'not_found') {
            state = i18next.t('error.clist.404', { ns: 'alert' });
        } else if (errorType === 'unauthorized') {
            state = i18next.t('error.clist.cookie', { ns: 'alert' });
        } else {
            state = i18next.t('error.clist.other', { ns: 'alert' });
        }
        loadingMessage.updateStatus(`${OJBetter.state.name} —— ${state}`, 'error');
    }
    return result.ok;
}

/**
 * 创建Rating相关css
 * @param {boolean} [hasBorder=true] 是否有边框
 */
function creatRatingCss(hasBorder = true) {
    const defaultBorderColor = '#dcdfe6';
    let dynamicCss = "";
    let hoverSelector = OJBetter.clist.ratingHidden ? ":hover" : "";
    for (let cssClass in cssMap) {
        dynamicCss += `a.${cssClass}${hoverSelector}, a.${cssClass}${hoverSelector}:link {\n`;
        let borderColor = hasBorder ? cssMap[cssClass] : defaultBorderColor;
        dynamicCss += `    color: ${cssMap[cssClass]} ${OJBetter.clist.ratingHidden ? "!important" : ""};\n`;
        dynamicCss += `    border: 1px solid ${borderColor} ${OJBetter.clist.ratingHidden ? "!important" : ""};\n`;
        dynamicCss += `}\n`;
    }
    GM_addStyle(dynamicCss);
    if (OJBetter.clist.ratingHidden) {
        GM_addStyle(`
        #clistButton {
            color: #ffffff00;
        }
    `);
    }
}

/**
 * 模拟clist网页访问获取rating
 * @param {string} problem 题目名称
 * @param {string} problem_url 题目链接
 * @param {string} contest 比赛名称
 * @returns {Promise<{rating: number, problem: string}>} 题目难度
 */
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
                reject(`No data found for the question of ${problem} .`);
            },
            onerror: function (response) {
                reject(`An error occurred while handling the ${problem} problem.`);
            }
        });
    });
}

/**
 * 从clist API获取题目的rating
 * @param {string} problem 题目名
 * @param {string} problem_url 题目链接
 * @returns {Promise<number>} 题目rating
 */
async function getRatingFromApi_problem(problem, problem_url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://clist.by:443/api/v4/problem/?name=${problem}&resource__regex=codeforces.com`,
            headers: {
                "Authorization": OJBetter.clist.authorization
            },
            onload: function (response) {
                if (!response) reject('An unknown error occurred!');
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

/**
 * 从clist API获取比赛的题目rating
 * @param {string} event 比赛名
 * @returns {Promise<Map<string, number>>} 题目rating
 */
async function getRatingFromApi_contest(event) {
    const options = {
        method: "GET",
        url: `https://clist.by:443/api/v4/contest/?limit=1&with_problems=true&event=${event}`,
        headers: {
            "Authorization": OJBetter.clist.authorization
        }
    }
    let response = await OJB_GMRequest(options);
    let data = JSON.parse(response.responseText);
    let objects = data.objects;
    let problemsMap = new Map();
    if (objects.length > 0) {
        var problems = objects[0].problems;
        for (var i = 0; i < problems.length; i++) {
            var problem = problems[i];
            problemsMap.set(problem.url, problem.rating ? problem.rating : NaN);
        }
    }
    return problemsMap;
}

/**
 * 根据rating获取对应的颜色class名
 * @param {number} rating 题目rating
 * @returns {string} 颜色class名
 */
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

/**
 * problem页显示Rating
 * @param {ProblemPageLinkbar} problemToolbar 
 * @returns {Promise<void>}
 */
async function showRatingByClist_problem(problemToolbar) {
    // 题目名
    let problem = $('.header .title').eq(0).text().replace(/[\s\S]*?. /, '');
    if (OJBetter.typeOfPage.is_acmsguru) problem = $('h4').eq(0).text().replace(/[\s\S]*?. /, '');

    // 创建Rating按钮元素
    creatRatingCss(false);
    // TODO
    const clistButton = problemToolbar.addLinkButton(
        'clistButton',
        `https://clist.by/problems/?search=${problem}&resource=1`,
        i18next.t('state.wait', { ns: 'button' }),
        $("<img>").attr("src", "https://clist.by/static/img/logo-48.png"),
        "15px"
    );

    // 检测clist连接
    if (!await validateClistConnection()) {
        problemToolbar.updateText(clistButton, i18next.t('state.netError', { ns: 'button' }));
        return;
    }

    // 题目链接
    let problem_url = window.location.href;
    if (problem_url.includes('/contest/')) {
        problem_url = problem_url.replace(/\/contest\/(\d+)\/problem\/(\w+)[^\w]*/, '/contest/$1/problem/$2');
    } else {
        problem_url = problem_url.replace(/\/problemset\/problem\/(\d+)\/(\w+)/, '/contest/$1/problem/$2');
    }
    if (OJBetter.typeOfPage.is_mSite) problem_url = problem_url.replace(/\/\/(\w+).codeforces.com/, '//codeforces.com'); // 轻量站

    // 比赛名
    // let contest = $('#sidebar').children().first().find('.rtable th').first().text();

    // rating
    problemToolbar.updateText(clistButton, i18next.t('state.loading', { ns: 'button' }));
    let rating = await getRatingFromApi_problem(problem, problem_url);
    if (rating) {
        let className = getClassNameByRating(rating);
        problemToolbar.updateText(clistButton, rating);
        problemToolbar.setBold(clistButton);
        problemToolbar.addClass(clistButton, className);
    } else {
        problemToolbar.updateText(clistButton, i18next.t('state.404', { ns: 'button' }));
        problemToolbar.disableButton(clistButton);
    }
}

/**
 * contest页显示Rating
 * @returns {Promise<void>}
 */
async function showRatingByClist_contest() {
    // 创建Rating显示框
    creatRatingCss();
    let ratingBadges = {};
    $('.datatable .id.left').each(function () {
        let href = 'https://codeforces.com' + $(this).find('a').attr('href');
        let badge = $(`<a id="clistButton" class="ratingBadge">${i18next.t('state.wait', { ns: 'button' })}</a>`);
        $(this).find('a').after(badge);
        ratingBadges[href] = badge;
    });

    // 检测clist连接
    if (!await validateClistConnection()) {
        for (let href in ratingBadges) {
            ratingBadges[href].text('error').addClass('ratingBadge_error');
        }
        return;
    }

    // 显示loading
    for (let href in ratingBadges) {
        ratingBadges[href].text(i18next.t('state.loading', { ns: 'button' })).addClass('ratingBadge_loading');
    }

    // 获取Rating
    let event = encodeURIComponent($('#sidebar').children().first().find('.rtable th').first().text());
    let problemsMap = await getRatingFromApi_contest(event);

    // 填充数据
    for (let href in ratingBadges) {
        if (problemsMap.has(href)) {
            let rating = problemsMap.get(href);
            let className = getClassNameByRating(rating);
            ratingBadges[href].text(rating).addClass(className);
        } else {
            ratingBadges[href].text(i18next.t('state.404', { ns: 'button' })).addClass('ratingBadge_no');
        }
    }
}

/**
 * problemset页显示Rating
 * @returns {Promise<void>}
 */
async function showRatingByClist_problemset() {
    creatRatingCss();
    let ratingBadges = [];
    const $problems = $('.problems');
    const $trs = $problems.find('tbody tr:gt(0)');

    // 先创建Rating显示框，并将关系存进数组ratingBadges
    for (let i = 0; i < $trs.length; i++) {
        const $tds = $($trs[i]).find('td');
        let problem = $($tds[0]).text();
        let problem_url = $($tds[0]).find('a').attr('href');
        problem_url = problem_url.replace(/^\/problemset\/problem\/(\d+)\/(\w+)/, 'https://codeforces.com/contest/$1/problem/$2');

        const ratingBadge = $(`<a id="clistButton" class="ratingBadge"></a>`);
        const rating = $(`<span class="rating">${i18next.t('state.wait', { ns: 'button' })}</span>`);
        ratingBadge.append(rating);
        $($tds[0]).find('a').after(ratingBadge);
        ratingBadges.push({ ratingBadge, rating, problem, problem_url });
    }

    // 检测clist连接
    if (!await validateClistConnection()) {
        for (let i = 0; i < rating.length; i++) {
            ratingBadges[i].rating.text(i18next.t('state.netError', { ns: 'button' }));
        }
        return;
    }

    // 每次只获取3个rating
    for (let i = 0; i < ratingBadges.length; i += 3) {
        const promises = [];
        const endIndex = Math.min(i + 3, ratingBadges.length);

        for (let j = i; j < endIndex; j++) {
            const ratingBadge = ratingBadges[j];
            // 显示请求中
            ratingBadge.rating.text(i18next.t('state.loading', { ns: 'button' }));
            promises.push(getRating(ratingBadge.problem, ratingBadge.problem_url).catch(error => console.warn(error)));
        }

        const results = await Promise.all(promises);

        for (let j = i; j < endIndex; j++) {
            const result = results[j - i];
            const ratingBadge = ratingBadges[j];
            if (result) {
                let className = getClassNameByRating(result.rating);
                ratingBadge.ratingBadge.addClass(className);
                ratingBadge.rating.text(result.rating);
            } else {
                ratingBadge.rating.text(i18next.t('state.404', { ns: 'button' }));
            }
        }
    }
}

/**
 * cf赛制榜单重新着色
 */
async function recolorStandings() {
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

/**
 * 存放编辑器语言select的值与Monaco语言对应关系的map.
 * @type {Object.<string, string>}
 */
const value_monacoLanguageMap = {
    "4": "pascal", "6": "php", "7": "python", "9": "csharp", "13": "perl", "20": "scala", "31": "python",
    "32": "go", "34": "javascript", "36": "java", "40": "python", "41": "python", "43": "cpp",
    "50": "cpp", "51": "pascal", "52": "cpp", "54": "cpp", "55": "javascript", "59": "cpp", "60": "java",
    "61": "cpp", "65": "csharp", "67": "ruby", "70": "python", "73": "cpp", "74": "java", "75": "rust",
    "77": "kotlin", "79": "csharp", "80": "cpp", "83": "kotlin", "87": "java"
};

/**
 * 更新代码提交页的HTML
 * @param {string} submitUrl 
 * @param {string} cacheKey 
 * @returns {Promise<jQuery>}
 */
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
                reject('A network error occurred while retrieving the HTML for the code submission page.');
            }
        });
    });
}

/**
 * 获取代码提交页的HTML元素
 * @param {string} submitUrl 
 * @returns {Promise<jQuery>}
 */
async function getSubmitHTML(submitUrl) {
    const cacheKey = 'OJBetter_CloneOriginalHTML';
    const cookieKey = 'OJBetter_CloneOriginalHTML_time';
    if (OJB_getCookie(cookieKey) === '1') {
        // 存在缓存
        CloneOriginalHTML(submitUrl, cacheKey);
        // 校验
        let cloneHTML = $(localStorage.getItem(cacheKey));
        if (cloneHTML.find('form.submit-form').length > 0) {
            return cloneHTML;
        } else {
            // 存在错误，更新缓存
            console.warn(`Cache error detected!\nattempting to update, cache destination submitUrl:\n${submitUrl}`);
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
        await OJBetter.common.database.editorCode.put({ url, code });
        return 'Code saved successfully';
    } catch (error) {
        throw new Error('Failed to save code');
    }
}

async function getCode(url) {
    try {
        const result = await OJBetter.common.database.editorCode.get(url);
        return result ? result.code : null;
    } catch (error) {
        throw new Error('Failed to get code');
    }
}

// 创建代码编辑调试表单元素
async function createCodeEditorForm(submitUrl, cloneHTML) {
    // 表单
    let formDiv = $('<form method="post" id="OJBetter_SubmitForm" class="input-output-copier"></form>');
    $('.ttypography').after(formDiv);
    formDiv.attr('action', submitUrl + "?csrf_token=" + OJBetter.common.cf_csrf_token);

    // 顶部区域
    let topDiv = $(`<div class="topDiv"></div>`);
    let selectLang = cloneHTML.find('select[name="programTypeId"]'); // 语言选择
    selectLang.css({ 'margin': '10px 0px' }).attr('id', 'programTypeId');
    topDiv.append(selectLang);
    let topRightDiv = $(`<div class="topRightDiv"></div>`);
    topDiv.append(topRightDiv);
    formDiv.append(topDiv);

    // 问题选择/编号
    let selectProblem = $('<input name="submittedProblemIndex" style="display:none;"></input>');
    let problemCode;
    if (OJBetter.typeOfPage.is_acmsguru) {
        problemCode = $('h4').eq(0).text();
        let matchResult = problemCode.match(/([A-Z0-9]+)/);
        problemCode = matchResult[0];
    } else if (OJBetter.typeOfPage.is_problemset_problem) {
        let match = window.location.href.match(/\/problem\/([0-9]+?)\/([A-Z0-9]+?)(?!=[A-Z0-9])/);
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
    let sourceDiv = $('<textarea id="sourceCodeTextarea" name="source" style="display: none;"></textarea>');
    formDiv.append(sourceDiv);

    // 代码编辑器
    let editorDiv = $('<div id="OJBetter_editor"></div>');
    formDiv.append(editorDiv);

    // monaco
    let monaco = $('<div id="OJBetter_monaco"></div>');
    editorDiv.append(monaco);

    // 自定义调试
    let customTestDiv = $(`
        <details id="customTestBlock">
            <summary >${i18next.t('customTestBlock.title', { ns: 'codeEditor' })}</summary>
            <div id="customTests" style="min-height: 30px;"></div>
            <div id="control" style="display:flex;">
                <div style="display: flex;margin: 5px;">
                    <input type="checkbox" id="onlyCustomTest"}><label for="onlyCustomTest">
                    ${i18next.t('customTestBlock.onlyCustom', { ns: 'codeEditor' })}
                    </label>
                </div>
                <div style="display: flex;margin: 5px;">
                    <input type="checkbox" id="DontShowDiff"}>
                    <label for="DontShowDiff">
                        ${i18next.t('customTestBlock.DontShowDiff', { ns: 'codeEditor' })}
                    </label>
                </div>
                <button type="button" id="addCustomTest">${i18next.t('customTestBlock.add', { ns: 'codeEditor' })}</button>
            </div>
        </details>
    `)
    formDiv.append(customTestDiv);

    // 调试/提交
    let submitDiv = $('<div id="OJBetter_submitDiv"></div>');
    let CompilerArgsInput = $('<input type="text" id="CompilerArgsInput">');
    submitDiv.append(CompilerArgsInput);

    let runButton = $(`
        <button type="button" id="RunTestButton" class="ojb_btn ojb_btn_popover top">
            <i class="iconfont">&#xe6c1;</i>
            <span class="popover_content">${i18next.t('runTestButton.initial', { ns: 'codeEditor' })}</span>
        </button>
    `);
    let submitButton = $(`
        <button id="SubmitButton" class="ojb_btn ojb_btn_popover top" type="submit">
            <i class="iconfont">&#xe633;</i>
            <span class="popover_content">${i18next.t('submitButton', { ns: 'codeEditor' })}</span>
        </button>
    `);
    if (OJBetter.monaco.setting.submitButtonPosition == "bottom") {
        // 添加测试/提交按钮到底部
        submitDiv.append(runButton);
        submitDiv.append(submitButton);
    }

    formDiv.append(submitDiv);
    let CompilerSetting = $(`
        <div id="CompilerSetting"></div>
    `);
    formDiv.append(CompilerSetting);
    let statePanel = $(`
        <div id="statePanel"></div>
    `);
    formDiv.append(statePanel);

    let from = {
        formDiv: formDiv,
        selectLang: selectLang,
        topRightDiv: topRightDiv,
        sourceDiv: sourceDiv,
        editorDiv: editorDiv,
        monaco: monaco,
        runButton: runButton,
        submitButton: submitButton,
        submitDiv: submitDiv,
        CompilerSetting: CompilerSetting,
        statePanel: statePanel
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
                if (OJBetter.monaco.loaderOnload) {
                    resolve();
                } else {
                    setTimeout(checkInitialized, 100); // 每100毫秒检查一次initialized的值
                }
            };
            checkInitialized();
        });
    }
    if (!OJBetter.monaco.loaderOnload) await waitForMonacoLoaderOnload();

    /**
     * 通用参数
     */
    var id = 0; // 协议中的id标识
    var workspace = language + "_workspace";
    var rootUri = OJBetter.monaco.lsp.workUri + "/" + workspace;
    // 文件名
    var InstanceID = OJB_getRandomNumber(8).toString();
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
    var OJBetter_monaco = {};
    window.OJBetter_monaco = OJBetter_monaco; // 全局方法

    /**
     * 一些工具函数
     */
    // 将lsp格式的rang转换为Monaco格式
    OJBetter_monaco.lspRangeToMonacoRange = function (range) {
        const { start, end } = range;
        return new monaco.Range(
            start.line + 1,
            start.character + 1,
            end.line + 1,
            end.character + 1
        );
    };
    // 将Monaco格式的rang转为lsp格式
    OJBetter_monaco.MonacoRangeTolspRange = function (range) {
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
    OJBetter_monaco.MonacoPositionTolspPosition = function (position) {
        return {
            line: position.lineNumber - 1,
            character: position.column - 1,
        };
    };
    // 将Monaco格式的severity转为lsp格式的
    OJBetter_monaco.MonacoSeverityTolspSeverity = function (severity) {
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
    OJBetter_monaco.lspSeverityToMonacoSeverity = function (severity) {
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
    OJBetter_monaco.CollectRange = function (item) {
        return {
            startLineNumber: item.startLineNumber,
            startColumn: item.startColumn,
            endLineNumber: item.endLineNumber,
            endColumn: item.endColumn,
        };
    };
    // 收集Monaco position数据中的rang数据
    OJBetter_monaco.CollectRangeByPosition = function (item) {
        var word = model.getWordUntilPosition(item);
        return {
            startLineNumber: item.lineNumber,
            endLineNumber: item.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        };
    };
    // 将lsp格式的Edit转换为Monaco格式
    OJBetter_monaco.lspEditToMonacoEdit = function (edit) {
        const edits = [];

        if (language == "python") {
            for (const item1 of edit.documentChanges) {
                for (const item2 of item1.edits) {
                    const newElement = {
                        textEdit: {
                            range: OJBetter_monaco.lspRangeToMonacoRange(item2.range),
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
                            range: OJBetter_monaco.lspRangeToMonacoRange(item2.range),
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
                            range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
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
    OJBetter.monaco.editor = monaco.editor.create(document.getElementById("OJBetter_monaco"), {
        model: model,
        rootUri: rootUri,
        fontSize: 15,
        tabSize: 4,
        theme: OJBetter.basic.darkMode == "dark" ? "vs-dark" : "vs",
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
            alwaysConsumeMouseWheel: OJBetter.monaco.setting.alwaysConsumeMouseWheel
        },
        suggest: {
            selectionMode: 'never' // 代码建议不自动选择
        }
    });

    /**
     * 添加快捷功能
     */
    (OJBetter_monaco.addShortCuts = async () => {
        // 从配置信息更新字体大小
        OJBetter.monaco.editor.updateOptions({ fontSize: parseInt(OJBetter.monaco.setting.fontsize) });

        // 调整字体大小
        let changeSize = $(`
        <div class="ojb_btn ojb_btn_popover top">
            <input type="number" id="fontSizeInput" value="${OJBetter.monaco.setting.fontsize}">
            <span class="popover_content">${i18next.t('fontSizeInput', { ns: 'codeEditor' })}</span>
        </div>`)
        form.topRightDiv.append(changeSize);
        changeSize.find('input#fontSizeInput').on('input', function () {
            var size = $(this).val();
            OJBetter.monaco.editor.updateOptions({ fontSize: parseInt(size) });
            GM_setValue('editorFontSize', size);
        });

        // 全屏按钮
        let fullscreenButton = $(`
        <button type="button" class="ojb_btn ojb_btn_popover top">
            <i class="iconfont">&#xe606;</i>
            <span class="popover_content">${i18next.t('fullscreenButton', { ns: 'codeEditor' })}</span>
        </button>
        `);
        form.topRightDiv.append(fullscreenButton);
        fullscreenButton.on('click', enterFullscreen);

        // 固定到底部按钮
        let fixToBottomButton = $(`
        <button type="button" class="ojb_btn ojb_btn_popover top">
            <i class="iconfont">&#xe607;</i>
            <span class="popover_content">${i18next.t('fixToBottomButton', { ns: 'codeEditor' })}</span>
        </button>
        `);
        form.topRightDiv.append(fixToBottomButton);
        fixToBottomButton.on('click', fixToBottom);

        // 固定到右侧按钮
        let fixToRightButton = $(`
        <button type="button" class="ojb_btn ojb_btn_popover top">
            <i class="iconfont">&#xe605;</i>
            <span class="popover_content">${i18next.t('fixToRightButton', { ns: 'codeEditor' })}</span>
        </button>
        `);
        form.topRightDiv.append(fixToRightButton);
        fixToRightButton.on('click', fixToRight);

        // 添加测试/提交按钮到顶部
        if (OJBetter.monaco.setting.submitButtonPosition == "top") {
            form.topRightDiv.append(form.runButton);
            form.topRightDiv.append(form.submitButton);
        }

        // 选择记忆
        if (!OJBetter.monaco.setting.position_initialized) {
            OJBetter.monaco.setting.position_initialized = true; // 标记是否已经初始化过
            if (OJBetter.monaco.setting.position == "full") {
                fullscreenButton.click();
            } else if (OJBetter.monaco.setting.position == "bottom") {
                fixToBottomButton.click();
            } else if (OJBetter.monaco.setting.position == "right") {
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

        // 进入全屏
        function enterFullscreen() {
            let editor = $('#OJBetter_editor');
            editor.addClass('fullscreen');

            // 取消按钮
            let cancelButton = $(`
                <button type="button" class="ojb_btn ojb_btn_popover top primary exit_button_bottom">
                    <i class="iconfont">&#xe60b;</i>
                    <span class="popover_content">${i18next.t('exitFullscreenButton', { ns: 'codeEditor' })}</span>
                </button>
            `).on('click', () => exitFullscreen(cancelButton));
            $('body').append(cancelButton);

            disableButtons();
            GM_setValue("monacoEditor_position", "full");
        }

        // 退出全屏
        const exitFullscreen = (cancelButton) => {
            let editor = $('#OJBetter_editor');
            editor.removeClass('fullscreen');
            cancelButton.remove();
            enableButtons();
            GM_setValue("monacoEditor_position", "initial");
        };

        // 固定到底部
        function fixToBottom() {
            let editor = $('#OJBetter_editor');
            editor.addClass('bottom');

            let halfHeight = $(window).height() * 0.5;
            let blankSpace = $('<div>', {
                'class': 'blank-space',
                'style': 'height: ' + (halfHeight + 30) + 'px;'
            });
            $('body').append(blankSpace);

            let cancelButton = $(`
                <button type="button" class="ojb_btn ojb_btn_popover top enabled exit_button_bottom">
                    <i class="iconfont">&#xe625;</i>
                    <span class="popover_content">${i18next.t('cancelFixButton', { ns: 'codeEditor' })}</span>
                </button>
            `).on('click', () => cancelFixingToBottom(cancelButton, blankSpace));
            $('body').append(cancelButton);

            disableButtons();
            GM_setValue("monacoEditor_position", "bottom");
        }

        // 取消固定到底部
        const cancelFixingToBottom = (cancelButton, blankSpace) => {
            let editor = $('#OJBetter_editor');
            editor.removeClass('bottom');
            cancelButton.remove();
            blankSpace.remove();
            enableButtons();
            GM_setValue("monacoEditor_position", "initial");
        };

        // 固定到右侧边栏
        function fixToRight() {
            const sidebar = $('#sidebar').hide();

            // 添加样式
            const styleElement = GM_addStyle(`
                #body {
                    min-width: 50vw;
                    max-width: 50vw;
                    max-height: 100vh;
                    overflow-x: hidden;
                    overflow-y: auto;
                    padding: 1rem;
                    box-sizing: border-box;
                }
                body {
                    margin: 0px;
                }
                .content-with-sidebar {
                    margin-right: 0px !important;
                }
                .menu-list li {
                    margin-right: 0.5em;
                }
                .menu-list li a {
                    font-size: 1.4rem;
                }
                #OJBetter_editor{
                    height: 100vh;
                    width: 50vw;
                }
            `);

            // 包装一层div
            $('#body').wrap('<div id="right-side-wrapper" style="display:flex; max-width: 100vw; overflow: hidden;"></div>');
            const blankSpace = $('<div>').appendTo('#right-side-wrapper');

            // 移动编辑器
            const editor = $('#OJBetter_editor').prependTo(blankSpace).addClass('right-side');

            // 取消按钮
            const cancelButton = $(`
                <button type="button" class="ojb_btn ojb_btn_popover top enabled exit_button_bottom">
                    <i class="iconfont">&#xe625;</i>
                    <span class="popover_content">${i18next.t('cancelFixButton', { ns: 'codeEditor' })}</span>
                </button>
            `).on('click', () => cancelFixingToRight(sidebar, styleElement, editor, cancelButton)).appendTo('body');

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

        const cancelFixingToRight = (sidebar, styleElement, editor, cancelButton) => {
            sidebar.show();
            // 移回来
            editor.insertAfter('#sourceCodeTextarea').removeClass('right-side');

            // 移除包装
            $('#body').unwrap();
            cancelButton.remove();
            styleElement.remove(); // 移除添加的样式

            enableButtons();
            GM_setValue("monacoEditor_position", "initial");
        }

        // 代码同步与保存
        var nowUrl = window.location.href;
        nowUrl = nowUrl.replace(/#/, ""); // 当页面存在更改时url会多出一个#，去掉
        const code = await getCode(nowUrl);
        if (code) {
            OJBetter.monaco.editor.setValue(code); // 恢复代码
            $('#sourceCodeTextarea').val(code);
        }
        OJBetter.monaco.editor.onDidChangeModelContent(async () => {
            // 将monaco editor的内容同步到sourceCodeTextarea
            const code = OJBetter.monaco.editor.getValue();
            $('#sourceCodeTextarea').val(code);
            await saveCode(nowUrl, code);
        });
    })();

    /**
     * 注册本地自动补全
     */
    (OJBetter_monaco.RegisterLocalComplet = async () => {
        // 补全器注册函数
        function registMyCompletionItemProvider(language, genre, rule) {
            if (genre == "monaco") {
                monaco.languages.registerCompletionItemProvider(language, {
                    provideCompletionItems: function (model, position) {
                        return parseMonacoCompleter(rule, OJBetter_monaco.CollectRangeByPosition(position));
                    }
                })
            } else if (genre == "ace") {
                monaco.languages.registerCompletionItemProvider(language, {
                    provideCompletionItems: function (model, position) {
                        return parseAceCompleter(rule, OJBetter_monaco.CollectRangeByPosition(position));
                    }
                })
            }
        }

        // 注册acwing cpp 模板
        if (language == "cpp" && OJBetter.monaco.complet.cppCodeTemplate) {
            var acwing_cpp_code_completer = JSON.parse(GM_getResourceText("acwing_cpp_code_completer"));
            registMyCompletionItemProvider('cpp', 'ace', acwing_cpp_code_completer);
        }

        // 注册自定义的补全
        let complet_length = OJBetter.monaco.complet.customConfig.configurations.length;
        if (complet_length > 0) {
            for (let i = 0; i < complet_length; i++) {
                let item = OJBetter.monaco.complet.customConfig.configurations[i];
                if (item.isChoose && item.language == language) {
                    registMyCompletionItemProvider(item.language, item.genre, await OJB_getExternalJSON(item.jsonUrl));
                }
            }
        }
    })();

    if (!support || !OJBetter.monaco.lsp.enabled) { return; } // 如果不支持lsp，则到此为止

    /**
     * LSP连接状态指示
     */
    const lspStateButton = $(`
    <div id="lspStateDiv" class="ojb_btn ojb_btn_popover top loading">
        <i class="iconfont">&#xe658;</i>
        <span class="popover_content">${i18next.t('lsp.connect', { ns: 'codeEditor' })}</span>
    </div>
    `).on('click', () => {
        OJB_showModal(LSPLogDiv);
        LSPLogDiv.show();
    });
    form.topRightDiv.prepend(lspStateButton);

    const LSPLogDiv = $(`
    <dialog id="LSPLog" style="display: none;">
        <button class="ojb_btn">${i18next.t('close', { ns: 'common' })}</button>
        <div id="LSPLogList" style="overflow: auto;"></div>
    <dialog>`);
    $('body').append(LSPLogDiv);

    const LSPLogList = $('<ul></ul>');
    $('#LSPLogList').append(LSPLogList);

    const closeButton = LSPLogDiv.find('button');
    closeButton.on('click', function () {
        OJB_closeModal(LSPLogDiv);
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
    var statusBar = $('<div id="OJBetter_statusBar">');
    form.editorDiv.append(statusBar);

    /**
     * languageSocket
     */
    var url = OJBetter.monaco.lsp.socketUrl;
    var languageSocket = new WebSocket(url + language);
    OJBetter.monaco.lsp.socket.push(languageSocket);
    var languageSocketState = false;
    var responseHandlers = {}; // 映射表，需要等待返回数据的请求 -> 对应的事件触发函数
    languageSocket.onopen = () => {
        languageSocketState = true;
        lspStateButton.setButtonPopover(i18next.t('lsp.waitingAnswer', { ns: 'codeEditor' }));
        pushLSPLogMessage("info", `languageSocket ${i18next.t('lsp.socket.open', { ns: 'logMessage' })}`);
    };
    languageSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.id === 0 && message.result) {
            // 初始化完成
            lspStateButton.setButtonState('success', i18next.t('lsp.connected', { ns: 'codeEditor' }));
            pushLSPLogMessage("info", `Initialization ${i18next.t('lsp.state.finished', { ns: 'logMessage' })}`);
            serverInfo = message.result; // 存下服务器支持信息
            OJBetter_monaco.openDocRequest(); // 打开文档
            if (!OJBetter.monaco.setting.language.includes(language)) {
                OJBetter.monaco.setting.language.push(language);
                OJBetter_monaco.RegistrationAfterInit(); // 注册语言及功能
            } else {
                location.reload(); // 这里有问题，先贴个补丁
            }
            OJBetter_monaco.PassiveReceiveHandler(); // 注册被动接收函数
        } else if (message.id === 0 && message.error) {
            pushLSPLogMessage("warn", `Initialization ${i18next.t('lsp.state.error', { ns: 'logMessage' })}`);
        } else if (message.id !== undefined && responseHandlers[message.id]) {
            // 如果收到带有id字段的消息，则回传给对应的事件触发函数
            responseHandlers[message.id](message);
            delete responseHandlers[message.id]; // 删除已处理的事件触发函数
        } else if (message.method == "textDocument/publishDiagnostics") {
            // 接收代码诊断推送
            OJBetter_monaco.updateMarkers(message);
        } else if (message.method == "workspace/applyEdit") {
            // 应用服务器推送的更改
            OJBetter_monaco.applyEdit(message);
        }
    };
    languageSocket.onerror = (error) => {
        pushLSPLogMessage("error", `languageSocket ${i18next.t('lsp.state.error', { ns: 'logMessage' })}`, error);
        console.warn(`Error connecting to languageSocket: ${error}`)
    };
    languageSocket.onclose = (event) => {
        languageSocketState = false;
        lspStateButton.setButtonState('error', i18next.t('lsp.error', { ns: 'codeEditor' }));
        pushLSPLogMessage("warn", `languageSocket ${i18next.t('lsp.socket.close', { ns: 'logMessage' })}`);
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
    OJBetter.monaco.lsp.socket.push(fileWebSocket);
    fileWebSocket.onopen = () => {
        fileWebSocketState = true;
        pushLSPLogMessage("info", `fileWebSocket ${i18next.t('lsp.socket.open', { ns: 'logMessage' })}`);
    };
    fileWebSocket.onclose = (ev) => {
        fileWebSocketState = false;
        pushLSPLogMessage("warn", `fileWebSocket ${i18next.t('lsp.socket.close', { ns: 'logMessage' })}`, ev);
    };
    fileWebSocket.onmessage = (ev) => {
        let message = JSON.parse(ev.data);
        if (message.result !== "ok")
            pushLSPLogMessage("error", `update file failed: ${ev}`);
    };
    fileWebSocket.onerror = (error) => {
        console.warn(`Error connecting to fileWebSocket: ${error}`);
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
    OJBetter_monaco.Initialize = () => {
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
                            "file:///" + OJBetter.monaco.lsp.workUri + workspace,
                        name:
                            "file:///" + OJBetter.monaco.lsp.workUri + workspace,
                    },
                ],
            },
        };
        languageSocket.send(JSON.stringify(initializeRequest));

        // 打开文档函数
        OJBetter_monaco.openDocRequest = function () {
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
    OJBetter_monaco.RegistrationAfterInit = () => {
        // 注册语言
        monaco.languages.register({ id: language });

        // 注册"Command"
        (function registerCommand() {
            serverInfo.capabilities.executeCommandProvider.commands.forEach(
                (item) => {
                    pushLSPLogMessage("info", `${i18next.t('lsp.server.regist', { ns: 'logMessage' })}`, item);
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
                        range: OJBetter_monaco.MonacoRangeTolspRange(change.range),
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
                        position: OJBetter_monaco.MonacoPositionTolspPosition(position),
                        context: {
                            triggerKind: context.triggerKind + 1, // 这里要+1，两边的定义不一样。。。
                            triggerCharacter: context.triggerCharacter,
                        },
                    },
                };
                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `completion ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);
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
                                            range: OJBetter_monaco.lspRangeToMonacoRange(range),
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
                                            ? OJBetter_monaco.lspRangeToMonacoRange(textEdit.range)
                                            : OJBetter_monaco.lspRangeToMonacoRange(textEdit.insert)
                                        : null,
                                })
                            ),
                        };
                        pushLSPLogMessage("info", `completion ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, CompletionItems);
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
                        range: OJBetter_monaco.MonacoRangeTolspRange(range),
                        context: {
                            diagnostics: context.markers.map((item) => ({
                                range: OJBetter_monaco.MonacoRangeTolspRange({
                                    startLineNumber: item.startLineNumber,
                                    startColumn: item.startColumn,
                                    endLineNumber: item.endLineNumber,
                                    endColumn: item.endColumn,
                                }),
                                severity: OJBetter_monaco.MonacoSeverityTolspSeverity(
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
                                            range: OJBetter_monaco.MonacoRangeTolspRange({
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
                        pushLSPLogMessage("info", `codeAction ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);
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
                                        range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                                        severity: OJBetter_monaco.lspSeverityToMonacoSeverity(
                                            item.severity
                                        ),
                                        source: item.source,
                                    }))
                                    : null,
                                edit: item.edit
                                    ? OJBetter_monaco.lspEditToMonacoEdit(item.edit)
                                    : item.arguments
                                        ? {
                                            edits: item.arguments.flatMap(
                                                (item1) => OJBetter_monaco.lspEditToMonacoEdit(item1).edits
                                            ),
                                        }
                                        : null,
                            })),
                            dispose: () => { },
                        };
                        pushLSPLogMessage("info", `codeAction ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, codeAction);

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
                        position: OJBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        pushLSPLogMessage("info", `Hover ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);
                        const result = response.result;

                        if (!result) return resolve(null);
                        const Hover = {
                            range: result.range
                                ? OJBetter_monaco.lspRangeToMonacoRange(result.range)
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
                        pushLSPLogMessage("info", `Hover ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, Hover);
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
                                range: OJBetter_monaco.MonacoRangeTolspRange(range),
                            },
                        };

                        fetchData(request, (response) => {
                            const result = response.result;
                            pushLSPLogMessage("info", `Inlay Hints ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

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
                            pushLSPLogMessage("info", `Inlay Hints ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, inlayHints);

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
                        position: OJBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `definition ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                        if (result.length == 0) return resolve(null);
                        const definition = result.map((item) => ({
                            range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                            uri: monaco.Uri.parse(item.uri), //
                        }));
                        pushLSPLogMessage("info", `definition ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, definition);

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
                        position: OJBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `references ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                        if (result.length == 0) return resolve([]);

                        const references = result.map((item) => ({
                            range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                            uri: monaco.Uri.parse(item.uri), //
                        }));
                        pushLSPLogMessage("info", `references ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, references);
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
                        position: OJBetter_monaco.MonacoPositionTolspPosition(position),
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `documentHighlight ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                        if (!result || result.length == 0) return resolve([]);
                        const highlights = result.map((item) => ({
                            range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                            kind: item.kind,
                        }));
                        pushLSPLogMessage("info",
                            `documentHighlight ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`,
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
                            pushLSPLogMessage("info", `DocumentLink ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                            if (!result) return resolve(null);
                            const links = {
                                links: result.map((item) => ({
                                    range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                                    url: item.target.toString(),
                                    tooltip: item.tooltip ? item.tooltip : null,
                                })),
                            };
                            pushLSPLogMessage("info", `DocumentLink ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, links);
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
                        pushLSPLogMessage("info", `formatting ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                        const TextEdit = result.map((edit) => ({
                            range: OJBetter_monaco.lspRangeToMonacoRange(edit.range),
                            text: edit.newText,
                        }));
                        pushLSPLogMessage("info", `formatting ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, TextEdit);
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
                        range: OJBetter_monaco.MonacoRangeTolspRange(range),
                        options,
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `rangeFormatting ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                        if (!result || result.length == 0) return resolve([]);
                        const edits = result.map((item) => ({
                            range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                            text: item.newText,
                        }));
                        pushLSPLogMessage("info", `rangeFormatting ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, edits);
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
                        position: OJBetter_monaco.MonacoPositionTolspPosition(position),
                        newName: newName,
                    },
                };

                return new Promise((resolve, reject) => {
                    fetchData(request, (response) => {
                        const result = response.result;
                        pushLSPLogMessage("info", `rename ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                        const rename = OJBetter_monaco.lspEditToMonacoEdit(result);
                        pushLSPLogMessage("info", `rename ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, rename);
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
                        pushLSPLogMessage("info", `FoldingRange ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                        if (!result) return resolve([]);
                        const foldingRanges = result.map((item) => ({
                            start: item.startLine + 1,
                            end: item.endLine + 1,
                            kind: monaco.languages.FoldingRangeKind.fromValue(item.kind),
                        }));
                        pushLSPLogMessage("info", `FoldingRange ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, foldingRanges);
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

                        pushLSPLogMessage("info", `signatureHelp ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

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
                            `signatureHelp ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`,
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
                            position: OJBetter_monaco.MonacoPositionTolspPosition(position),
                            ch,
                            options,
                        },
                    };

                    return new Promise((resolve, reject) => {
                        fetchData(request, (response) => {
                            const result = response.result;
                            pushLSPLogMessage("info", `onTypeFormatting ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, response);

                            if (!result || result.length == 0) return resolve([]);

                            const edits = result.map((item) => ({
                                range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                                text: item.newText,
                            }));
                            pushLSPLogMessage("info", `onTypeFormatting ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, edits);
                            resolve(edits);
                        });
                    });
                },
            });
    };

    /**
     * 被动式接收处理
     */
    OJBetter_monaco.PassiveReceiveHandler = () => {

        // "实时代码诊断"
        OJBetter_monaco.updateMarkers = function (message) {
            const params = message.params;
            pushLSPLogMessage("info", `Markers ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, message);

            if (!params) return;
            const markers = params.diagnostics.map((item1) => ({
                code: item1.code,
                message: item1.message,
                ...OJBetter_monaco.lspRangeToMonacoRange(item1.range),
                relatedInformation: item1.relatedInformation
                    ? item1.relatedInformation.map((item2) => ({
                        ...(item2.location.range
                            ? OJBetter_monaco.lspRangeToMonacoRange(item2.location.range)
                            : OJBetter_monaco.lspRangeToMonacoRange(item2.location)),
                        message: item2.message,
                        resource: monaco.Uri.parse(item2.location.uri),
                    }))
                    : null,
                severity: OJBetter_monaco.lspSeverityToMonacoSeverity(item1.severity),
                source: item1.source,
            }));

            pushLSPLogMessage("info", `Markers ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, markers);
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
            $('#OJBetter_statusBar').text(`Warnings: ${warningCount}, Errors: ${errorCount}`);
        };

        // "应用服务器推送的更改"(代码修复)
        OJBetter_monaco.applyEdit = function (message) {
            const params = message.params;
            pushLSPLogMessage("info", `applyEdit ${i18next.t('lsp.server.receive', { ns: 'logMessage' })}`, message);

            if (!params) return;
            const operations = Object.values(params.edit.changes)
                .flat()
                .map((item) => ({
                    range: OJBetter_monaco.lspRangeToMonacoRange(item.range),
                    text: item.newText,
                }));

            pushLSPLogMessage("info", `applyEdit ${i18next.t('lsp.server.transmit', { ns: 'logMessage' })}`, operations);
            model.pushEditOperations([], operations, () => null); // 入栈编辑操作
        };
    }

    if (!languageSocketState) await waitForLanguageSocketState();
    OJBetter_monaco.Initialize();
}

// 语言更改
function changeMonacoLanguage(form) {
    let nowSelect = form.selectLang.val();
    // 记忆更改
    GM_setValue('compilerSelection', nowSelect);
    // 销毁旧的编辑器
    try {
        if (OJBetter.monaco.editor) OJBetter.monaco.editor.dispose();
    } catch (error) {
        console.warn("Encountered an error while attempting to delete the old editor, but it should not affect your regular usage.", error)
    }
    // 关闭旧的socket
    OJBetter.monaco.lsp.socket.forEach(socket => {
        socket.close();
    });
    // 移除相关元素
    form.topRightDiv.empty();
    $('#LSPLog').remove();
    $('#OJBetter_statusBar').remove();
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
function getTestData() {
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
        OJBetter.common.database.transaction('rw', OJBetter.common.database.samplesData, function () {
            var objectStore = OJBetter.common.database.samplesData;
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
        OJBetter.common.database.transaction('rw', OJBetter.common.database.samplesData, function () {
            var objectStore = OJBetter.common.database.samplesData;
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
        OJBetter.common.database.transaction('r', OJBetter.common.database.samplesData, function () {
            return OJBetter.common.database.samplesData.get(url);
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
        OJBetter.common.database.transaction('r', OJBetter.common.database.samplesData, function () {
            return OJBetter.common.database.samplesData.get(url);
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
    const data = new FormData();
    data.append('csrf_token', OJBetter.common.cf_csrf_token);
    data.append('source', code);
    data.append('tabSize', '4');
    data.append('programTypeId', officialLanguage);
    data.append('input', input);
    data.append('output', '');
    data.append('communityCode', '');
    data.append('action', 'submitSourceCode');
    data.append('programTypeId', officialLanguage);
    data.append('sourceCode', code);

    const requestOptions = {
        method: 'POST',
        url: `${OJBetter.common.hostAddress}/data/customtest`,
        data: data,
        headers: {
            'X-Csrf-Token': OJBetter.common.cf_csrf_token
        }
    };

    const result = {
        Errors: '',
        Result: '',
        Stats: ''
    };

    try {
        const submitResponse = await OJB_GMRequest(requestOptions);
        if (submitResponse.status !== 200 || !submitResponse.response) {
            result.Errors = `${i18next.t('compiler.official.pushError', { ns: 'codeEditor' })}`;
            return result;
        }

        const submitResult = JSON.parse(submitResponse.response);
        const customTestSubmitId = submitResult.customTestSubmitId;

        const verdictResponse = await OJB_promiseRetryWrapper(
            getOfficialCompilerVerdict,
            {
                maxRetries: 10,
                retryInterval: 500
            },
            customTestSubmitId
        );
        return verdictResponse;
    } catch (error) {
        result.Errors = error.message;
        return result;
    }
}

// 获取codeforces编译器的执行结果
async function getOfficialCompilerVerdict(customTestSubmitId) {
    const newdata = new FormData();
    newdata.append('csrf_token', OJBetter.common.cf_csrf_token);
    newdata.append('action', 'getVerdict');
    newdata.append('customTestSubmitId', customTestSubmitId);

    const requestOptions = {
        method: 'POST',
        url: `${OJBetter.common.hostAddress}/data/customtest`,
        data: newdata,
        headers: {
            'X-Csrf-Token': OJBetter.common.cf_csrf_token
        }
    };

    const responseDetails = await OJB_GMRequest(requestOptions);
    if (responseDetails.status !== 200 || !responseDetails.response) {
        throw new Error(`${i18next.t('compiler.official.getResultError', { ns: 'codeEditor' })}`);
    }

    const response = JSON.parse(responseDetails.response);
    if (!response.stat) {
        throw new Error('Verdict not ready, retrying...');
    }

    return {
        Errors: response.verdict === "OK" ? null : response.verdict + '<br>' + response.output,
        Result: response.output.replace(/\r\n/g, "\n"),
        Stats: `Status: ${response.stat}`
    };
}

// rextester编译器参数列表
let rextesterLanguage = "";
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
        const rextesterCompilerArgs = CompilerArgsList[rextesterLanguage];
        $('#CompilerArgsInput').val(rextesterCompilerArgs);
    } else {
        $('#CompilerArgsInput').val("");
    }
}

// rextester编译器通信
async function rextesterCompiler(code, input) {
    try {
        const result = await OJB_promiseRetryWrapper(rextesterCompilerRequest, {
            maxRetries: 5,
            retryInterval: 500,
            errorHandler: (err) => ({ Errors: err.message, Result: '', Stats: '' })
        }, code, input);
        return result;
    } catch (error) {
        return { Errors: error.message, Result: '', Stats: '' };
    }
}

// rextester编译器请求方法
async function rextesterCompilerRequest(code, input) {
    const data = new FormData();
    data.append('LanguageChoiceWrapper', rextesterLanguage);
    data.append('EditorChoiceWrapper', '1');
    data.append('LayoutChoiceWrapper', '1');
    data.append('Program', code);
    data.append('CompilerArgs', $('#CompilerArgsInput').val());
    data.append('Input', input);
    data.append('ShowWarnings', 'false');
    data.append('IsInEditMode', 'false');
    data.append('IsLive', 'false');

    const responseDetails = await OJB_GMRequest({
        method: 'POST',
        url: 'https://rextester.com/rundotnet/Run',
        data: data
    });

    if (responseDetails.status !== 200 || !responseDetails.response) {
        throw new Error(`${i18next.t('compiler.common.error', { ns: 'codeEditor' })}`);
    }

    const response = JSON.parse(responseDetails.response);
    return {
        Errors: response.Errors || '',
        Result: response.Result || '',
        Stats: response.Stats || ''
    };
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
        let CompilerChange = $('<select id="CompilerChange" style="width: 100%;"></select>');

        $('#CompilerSetting').show().append(CompilerChange);
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
            let selectedName = CompilerChange.val();
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
    try {
        const result = await OJB_promiseRetryWrapper(wandboxCompilerRequest, {
            maxRetries: 5,
            retryInterval: 500,
            errorHandler: (err) => ({ Errors: err.message, Result: '', Stats: '' })
        }, code, input);
        return result;
    } catch (error) {
        return { Errors: error.message, Result: '', Stats: '' };
    }
}

// wandbox编译器请求方法
async function wandboxCompilerRequest(code, input) {
    const data = {
        code: code,
        codes: [],
        compiler: $('#CompilerChange').val().replace($('#compiler_option_raw').val(), '').replace($('#runtime_option_raw').val(), ''),
        'compiler-option-raw': $('#compiler_option_raw').val(),
        'runtime-option-raw': $('#runtime_option_raw').val(),
        options: $("#CompilerArgsInput").val(),
        description: '',
        stdin: input,
        title: ''
    };

    const responseDetails = await OJB_GMRequest({
        method: 'POST',
        url: 'https://wandbox.org/api/compile.json',
        data: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (responseDetails.status !== 200 || !responseDetails.response) {
        throw new Error(`${i18next.t('compiler.common.error', { ns: 'codeEditor' })}`);
    }

    const response = JSON.parse(responseDetails.response);
    return {
        Errors: response.compiler_error === "" ? response.signal : response.compiler_error,
        Result: response.program_output || '',
        Stats: response.status === "0" ? "Finish" : "Error"
    };
}

// 更改编译器参数
function changeCompilerArgs(nowSelect) {
    if (OJBetter.monaco.onlineCompilerChoice == "official") {
        officialCompilerArgsChange(nowSelect);
    } else if (OJBetter.monaco.onlineCompilerChoice == "rextester") {
        rextesterCompilerArgsChange(nowSelect);
    } else if (OJBetter.monaco.onlineCompilerChoice == "wandbox") {
        wandboxCompilerArgsChange(nowSelect);
    }
}

// 在线编译器通信
async function onlineCompilerConnect(code, input) {
    if (OJBetter.monaco.onlineCompilerChoice == "official") {
        return await officialCompiler(code, input);
    } else if (OJBetter.monaco.onlineCompilerChoice == "rextester") {
        return await rextesterCompiler(code, input);
    } else if (OJBetter.monaco.onlineCompilerChoice == "wandbox") {
        return await wandboxCompiler(code, input);
    }
}

// 差异对比
function codeDiff(expectedText, actualText) {
    // 将文本按行拆分
    const expectedLines = expectedText ? expectedText.split('\n') : [];
    const actualLines = actualText ? actualText.split('\n') : [];

    const output = document.createElement('div');

    const createLineElement = (lineNo, contentElement) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'diffLine';

        const lineNoDiv = document.createElement('div');
        lineNoDiv.className = 'lineNo';
        lineNoDiv.textContent = lineNo;

        lineDiv.appendChild(lineNoDiv);
        lineDiv.appendChild(contentElement);

        return lineDiv;
    };

    const createContentElement = (isEquals = true, expected = null, removed = null) => {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'lineContent';

        if (isEquals) {
            contentDiv.textContent = expected;
        } else {
            if (removed != null) {
                const removedSpan = document.createElement('span');
                removedSpan.className = 'removed';
                removedSpan.textContent = removed;
                contentDiv.appendChild(removedSpan);
            }
            if (expected != null) {
                const addedSpan = document.createElement('span');
                addedSpan.className = 'added';
                addedSpan.textContent = expected;
                contentDiv.appendChild(addedSpan);
            }
        }

        return contentDiv;
    };

    let index = 1;

    expectedLines.forEach((expectedLine, i) => {
        const actualLine = actualLines[i];
        if (actualLine === undefined) {
            output.appendChild(createLineElement(index++, createContentElement(false, expectedLine)));
        } else if (expectedLine === actualLine) {
            output.appendChild(createLineElement(index++, createContentElement(true, expectedLine)));
        } else {
            output.appendChild(createLineElement(index++, createContentElement(false, expectedLine, actualLine)));
        }
    });

    // 处理多余的 actualLines
    for (let i = expectedLines.length; i < actualLines.length; i++) {
        output.appendChild(createLineElement(index++, createContentElement(false, null, actualLines[i])));
    }

    return output.innerHTML;
}

// 内容类型常量
const TestCaseContentType = {
    TERMINAL: 'terminal',
    DIFF: 'diff',
    NO_DIFF: 'no_diff',
    SUCCESS: 'success'
};

// 样例测试状态类
class TestCaseStatus {
    constructor(item, prefix) {
        this.testCase = $(`<div class="test-case"></div>`);
        this.item = item;
        this.prefix = prefix;
        this.titleElement = $(`<div class="test-case-title">${this.prefix} ${this.item}</div>`);
        this.statusElement = $(`<div class="test-case-status"></div>`);
        this.contentElement = $(`<div class="test-case-content"></div>`);
        this.judgeElement = $(`<div class="test-case-judge"></div>`);
        this.testCase.append(this.titleElement, this.statusElement, this.contentElement, this.judgeElement);
        $('#statePanel').append(this.testCase);
        this.setStatus('Queued', 'queued');
    }

    setTitle(title) {
        this.titleElement.text(title);
    }

    setStatus(text, status) {
        this.statusElement.text(text).removeClass('queued running success error').addClass(status);
    }

    setContent(content, type) {
        // 如果内容类型为SUCCESS，隐藏内容元素并提前返回
        if (type === TestCaseContentType.SUCCESS) {
            this.contentElement.hide();
            return;
        }

        // 根据内容类型创建内容元素
        const createContentElementByType = (content, type) => {
            let contentElement;
            switch (type) {
                case TestCaseContentType.TERMINAL:
                    // 为TERMINAL类型创建一个新的终端容器
                    contentElement = $(`<div class="terminal-container" style="overflow: auto;"></div>`);
                    break;
                case TestCaseContentType.DIFF:
                case TestCaseContentType.NO_DIFF:
                    // 为DIFF和NO_DIFF类型创建相应的内容元素，并添加差异说明
                    const className = type === TestCaseContentType.DIFF ? "output_diff" : "output_no_diff";
                    contentElement = $(`<pre class="${className}">${content}</pre>`);
                    appendDiffNote();
                    break;
                default:
                    throw new Error("Unsupported content type.");
            }
            return contentElement;
        };

        // 初始化终端
        const initializeTerminal = (content, contentElement) => {
            const term = new Terminal({ rows: 10, cols: 150 });
            term.setOption('theme', { background: '#2d2e2c' });
            term.setOption('convertEol', true); // 将换行符\n转换为\r\n
            term.write(content);
            term.open(contentElement.get(0));
        };

        // 添加差异说明
        const appendDiffNote = () => {
            const diffNote = $(`<div class="diff_note">${i18next.t('resultBlock.diffNote', { ns: 'codeEditor' })}</div>`);
            this.testCase.append(diffNote);
        };

        // 创建并追加内容元素
        const contentElement = createContentElementByType(content, type);
        this.contentElement.append(contentElement);

        // 如果内容类型为TERMINAL，初始化并打开终端
        if (type === TestCaseContentType.TERMINAL) {
            initializeTerminal(content, contentElement);
        }
    }

    setJudge(judge) {
        this.judgeElement.text(judge);
    }
}

// 样例测试函数
async function runCode(event, runButton, sourceDiv, submitDiv) {
    event.preventDefault();
    const statePanel = $('#statePanel').show().empty();
    const testData = getTestData();
    const customTestData = await getCustomTestData();
    const totalTests = Object.keys(customTestData).length + Object.keys(testData).length;

    let passedTests = 0;
    let failedTests = 0;
    let hasError = false;

    // 定义一个对象队列，包括创建的样例块实例和对应的样例数据
    const queue = [];

    // 先生成各个样例的块，并显示排队中，将创建的各个对象存到队列中，以便后面更新
    for (const [item, data] of Object.entries(customTestData)) {
        const testCase = new TestCaseStatus(item, i18next.t('resultBlock.title.custom', { ns: 'codeEditor' }));
        queue.push({ testCase, data });
    }

    if (!$('#onlyCustomTest').prop('checked')) {
        for (const [item, data] of Object.entries(testData)) {
            const testCase = new TestCaseStatus(item, i18next.t('resultBlock.title.sample', { ns: 'codeEditor' }));
            queue.push({ testCase, data });
        }
    }

    // 测试函数
    const runTest = async (testCase, data, index) => {
        runButton.setButtonState('running', `${index}/${totalTests}`);

        testCase.setStatus('Running', 'running');
        const result = await onlineCompilerConnect(sourceDiv.val(), data.input);

        if (result.Errors) {
            testCase.setStatus('Compilation error or Time limit', 'error');
            testCase.setContent(result.Errors, TestCaseContentType.TERMINAL);
            hasError = true;
        } else if (result.Result.trim() === data.output.trim()) {
            testCase.setStatus('Accepted', 'success');
            testCase.setContent('The output is correct.', TestCaseContentType.SUCCESS);
            passedTests++;
        } else {
            testCase.setStatus('Wrong Answer', 'error');
            const diffContent = $('#DontShowDiff').prop('checked') ? result.Result.trim() : codeDiff(data.output.trim(), result.Result.trim());
            const contentType = $('#DontShowDiff').prop('checked') ? TestCaseContentType.NO_DIFF : TestCaseContentType.DIFF;
            testCase.setContent(diffContent, contentType);
            failedTests++;
        }

        const judgeStats = `${i18next.t('resultBlock.state', { ns: 'codeEditor' })}${result.Stats}`;
        testCase.setJudge(judgeStats);

        await OJB_delay(500); // 等待500毫秒
    };

    // 对队列中的对象进行测试
    for (let i = 0; i < queue.length; i++) {
        const { testCase, data } = queue[i];
        await runTest(testCase, data, i + 1);
    }

    // 测试完成后更新按钮状态
    if (hasError) {
        runButton.setButtonState('error', i18next.t('runTestButton.error', { ns: 'codeEditor' }));
    } else if (failedTests > 0) {
        runButton.setButtonState('error', `${passedTests}/${totalTests} ` + i18next.t('runTestButton.partial', { ns: 'codeEditor' }));
    } else {
        runButton.setButtonState('success', i18next.t('runTestButton.success', { ns: 'codeEditor' }));
    }
}

/**
 * 添加题目页代码编辑器
 * @returns 
 */
async function addProblemPageCodeEditor() {
    if (typeof ace === 'undefined') {
        const loadingMessage = new LoadingMessage();
        loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('error.codeEditor.load', { ns: 'alert' })}`, 'error');
        return; // 因为Codeforces设定的是未登录时不能访问提交页，也不会加载ace库
    }

    // 获取提交页链接
    const href = window.location.href;
    let submitUrl;
    if (/\/problemset\//.test(href)) {
        // problemset
        submitUrl = OJBetter.common.hostAddress + '/problemset/submit';
    } else if (/\/gym\//.test(href)) {
        // gym 题目
        submitUrl = OJBetter.common.hostAddress + '/gym/' + ((href) => {
            const regex = /\/gym\/(?<num>[0-9a-zA-Z]*?)\/problem\//;
            const match = href.match(regex);
            return match && match.groups.num;
        })(href) + '/submit';
    } else if (OJBetter.typeOfPage.is_acmsguru) {
        // acmsguru 题目
        submitUrl = href.replace(/\/problemsets[A-Za-z0-9\/#]*/, "/problemsets/acmsguru/submit");
    } else {
        submitUrl = href.replace(/\/problem[A-Za-z0-9\/#]*/, "/submit");
    }

    // 获取提交页HTML
    let cloneHTML = await getSubmitHTML(submitUrl);

    // 创建
    let form = await createCodeEditorForm(submitUrl, cloneHTML);
    let selectLang = form.selectLang;
    let submitButton = form.submitButton;
    let runButton = form.runButton;

    // 初始化
    CustomTestInit(); // 自定义测试数据面板
    selectLang.val(OJBetter.monaco.compilerSelection);
    changeMonacoLanguage(form);

    selectLang.on('change', () => changeMonacoLanguage(form)); // 编辑器语言切换监听

    // 样例测试
    runButton.on('click', (event) => runCode(event, runButton, form.sourceDiv, form.submitDiv))
        .setHoverRedo();

    // 提交
    submitButton.on('click', async function (event) {
        event.preventDefault();
        if (OJBetter.monaco.setting.isCodeSubmitDoubleConfirm) {
            const submit = await OJB_createDialog(
                i18next.t('submitCode.title', { ns: 'dialog' }),
                i18next.t('submitCode.content', { ns: 'dialog' }),
                [
                    i18next.t('submitCode.buttons.0', { ns: 'dialog' }),
                    i18next.t('submitCode.buttons.1', { ns: 'dialog' })
                ]
            ); //提交确认
            if (submit) {
                submitButton.after(`<img class="OJBetter_loding" src="//codeforces.org/s/84141/images/ajax-loading-24x24.gif">`);
                $('#OJBetter_SubmitForm').submit();
            } else {
                submitButton.addClass('disabled');
                setTimeout(function () {
                    submitButton.removeClass('disabled');
                }, 300);
            }
        } else {
            $('#OJBetter_SubmitForm').submit();
        }
    });
}

/**
 * 获取翻译服务目标语言的对应代码
 * @param {string} serverName 服务名称
 * @returns {string} 目标语言，如果没有对应代码则返回中文
 */
function getTargetLanguage(serverName) {
    let targetLanguage = OJBetter.supportList.translationSupport[serverName][OJBetter.translation.targetLang];
    if (targetLanguage) return targetLanguage;
    else return OJBetter.supportList.translationSupport[serverName]['zh'];
}

/**
 * 将文本中Markdown格式的加粗**转换成HTML格式。
 * @param {string} text 文本
 * @returns {string} 替换后的字符串
 */
function convertBoldMarkdownToHTML(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
* 将文本中Markdown格式的链接文本转换成HTML格式。
* @param {string} text 文本
* @returns {string} 替换后的字符串
*/
function convertLinksMarkdownToHTML(text) {
    return text.replace(/(?<!!)\[(.*?)\]\(([^"]*?)("(.*?)")*\)/g, '<a href="$2" title="$4">$1</a>');
}

/**
 * 将HTML格式的加粗文本转换回Markdown格式。
 * @param {string} text 文本
 * @returns {string} 替换后的字符串
 */
function convertBoldHTMLToMarkdown(text) {
    return text.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
}

/**
 * 将HTML格式的链接文本转换回Markdown格式。
 * @param {string} html - 包含HTML链接标签<a>的字符串。
 * @returns {string} 转换后的字符串，其中HTML链接标签被替换为Markdown的链接语法。
 */
function convertLinksHTMLToMarkdown(html) {
    return html.replace(/<a href="([^"]*)"( title="([^"]*)")*>([^<]+)<\/a>/g, '[$4]($1 "$3")');
}

/**
 * DeepL翻译
 * @param {string} raw 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
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
                target_lang: getTargetLanguage('deepl'),
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
    return await BaseTranslate(options, res => JSON.parse(res).result.texts[0].text, res => {
        const resObj = {
            status: true,
            message: 'ok'
        };
        if (res.includes('"error":{"code":1042912,"message":"Too many requests"}')) {
            resObj.status = false;
            resObj.message = i18next.t('error.deepl429', { ns: 'translator' }); // Too many requests 提示
            return resObj;
        };
        return resObj;
    });
}

/**
 * 使用 DeepL Free API 进行翻译
 * @param {string} raw 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_deepl_api_free(raw) {
    const data = JSON.stringify({
        text: [raw],
        target_lang: getTargetLanguage('deepl'),
        split_sentences: '1',
        ...(OJBetter.deepl.enableEmphasisProtection || OJBetter.deepl.enableLinkProtection ? { tag_handling: 'html' } : {}),
        ...Object.assign({}, ...OJBetter.deepl.config.data)
    });

    const options = {
        method: "POST",
        url: OJBetter.deepl.config.proxy || "https://api-free.deepl.com/v2/translate",
        headers: {
            "Authorization": `DeepL-Auth-Key ${OJBetter.deepl.config.key}`,
            "Content-Type": "application/json",
            ...Object.assign({}, ...OJBetter.deepl.config.header)
        },
        data: data,
        onload: response => response.responseText,
        onerror: error => console.error(error)
    };

    return await BaseTranslate(options, res => JSON.parse(res).translations[0].text);
}

/**
 * 使用 DeepL Pro API 进行翻译
 * @param {string} raw 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_deepl_api_pro(raw) {
    const data = JSON.stringify({
        text: [raw],
        target_lang: getTargetLanguage('deepl'),
        split_sentences: '1',
        ...(OJBetter.deepl.enableEmphasisProtection || OJBetter.deepl.enableLinkProtection ? { tag_handling: 'html' } : {}),
        ...Object.assign({}, ...OJBetter.deepl.config.data)
    });

    const options = {
        method: "POST",
        url: OJBetter.deepl.config.proxy || "https://api.deepl.com/v2/translate",
        headers: {
            "Authorization": `DeepL-Auth-Key ${OJBetter.deepl.config.key}`,
            "Content-Type": "application/json",
            ...Object.assign({}, ...OJBetter.deepl.config.header)
        },
        data: data,
        onload: response => response.responseText,
        onerror: error => console.error(error)
    };

    return await BaseTranslate(options, res => JSON.parse(res).translations[0].text);
}

/**
 * 使用 DeepLX 进行翻译
 * @param {String} text 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_deeplx(text) {
    const options = {
        method: "POST",
        url: OJBetter.deepl.config.proxy || 'https://api.deeplx.org/translate',
        data: JSON.stringify({
            "text": text,
            "source_lang": "EN",
            "target_lang": getTargetLanguage('deepl'),
        }),
        headers: {
            'Content-Type': 'application/json',
            ...(OJBetter.deepl.config.key ? { Authorization: `Bearer ${OJBetter.deepl.config.key}` } : {})
        },
        responseType: "json",
    };

    return await BaseTranslate(options, res => {
        const parsedResponse = JSON.parse(res);
        if (parsedResponse.code === 200 && parsedResponse.data) {
            return parsedResponse.data;
        } else {
            throw new Error('Translation failed or invalid response format.');
        }
    });
}

function getTimeStamp(iCount) {
    const ts = Date.now();
    if (iCount !== 0) {
        iCount = iCount + 1;
        return ts - (ts % iCount) + iCount;
    } else {
        return ts;
    }
}

/**
 * 讯飞听见翻译
 * @param {String} text 要翻译的文本
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_iflyrec(text) {
    const options = {
        method: "POST",
        url: 'https://www.iflyrec.com/TranslationService/v1/textTranslation',
        data: JSON.stringify({
            "from": "2",
            "to": getTargetLanguage('iflyrec'),
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
    return await BaseTranslate(options, res => JSON.parse(res).biz[0].translateResult.replace(/\\n/g, "\n\n"));
}

/**
 * 有道翻译
 * @param {string} raw 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_youdao_mobile(raw) {
    const options = {
        method: "POST",
        url: 'http://m.youdao.com/translate',
        data: "inputtext=" + encodeURIComponent(raw) + "&type=" + getTargetLanguage('youdao'),
        anonymous: true,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            'Host': 'm.youdao.com',
            'Origin': 'http://m.youdao.com',
            'Referer': 'http://m.youdao.com/translate',
        }
    }
    return await BaseTranslate(options,
        res => {
            const array = /id="translateResult">\s*?<li>([\s\S]*?)<\/li>\s*?<\/ul/.exec(res);
            if (array && array.length > 1) {
                return array[1];
            } else {
                return res;
            }
        },
        res => {
            const resObj = {
                status: true,
                message: 'ok'
            };
            if (res.includes('<title>413 Request Entity Too Large</title>')) {
                resObj.status = false;
                resObj.message = i18next.t('error.youdao413', { ns: 'translator' }); // Request Entity Too Large 提示
                return resObj;
            };
            return resObj;
        })
}

/**
 * 谷歌翻译
 * @param {string} raw 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_gg(raw) {
    const params = `tl=${getTargetLanguage('google')}&q=${encodeURIComponent(raw)}`;
    const options = {
        method: "GET",
        url: `https://translate.google.com/m?${params}`,
    }
    return await BaseTranslate(options,
        res => $(res).filter('.result-container').text() || $(res).find('.result-container').text());
}

/**
 * 彩云翻译预处理
 */
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
    const res = await OJB_GMRequest(options);
    sessionStorage.setItem('caiyun_jwt', JSON.parse(res.responseText).jwt);
}

/**
 * 彩云翻译
 * @param {string} raw 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
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
            "trans_type": getTargetLanguage('caiyun'),
            "detect": true,
            "browser_id": sessionStorage.getItem('caiyun_id')
        }),
        headers: {
            "X-Authorization": "token:qgemv4jr1y38jyq6vhvi",
            "T-Authorization": sessionStorage.getItem('caiyun_jwt')
        }
    }
    return await BaseTranslate(options, res => JSON.parse(res).target.map(decoder).join('\n'))
}

/**
 * ChatGPT
 * @param {string} raw 原文
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_openai(raw) {
    const modelDefault = 'gpt-3.5-turbo';
    const lang = getTargetLanguage('openai');
    const prompt = (OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru) ?
        i18next.t('chatgpt_prompt.notLaTeX', { ns: 'translator', transTargetLang: lang, lng: OJBetter.translation.targetLang }) :
        i18next.t('chatgpt_prompt.common', { ns: 'translator', transTargetLang: lang, lng: OJBetter.translation.targetLang });
    const data = {
        model: OJBetter.chatgpt.config.model || modelDefault,
        messages: [{
            role: "user",
            content: prompt + raw
        }],
        temperature: 0.7,
        ...Object.assign({}, ...OJBetter.chatgpt.config.data)
    }
    const options = {
        method: "POST",
        url: OJBetter.chatgpt.config.proxy || 'https://api.openai.com/v1/chat/completions',
        data: JSON.stringify(data),
        responseType: 'json',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + OJBetter.chatgpt.config.key,
            ...Object.assign({}, ...OJBetter.chatgpt.config.header)
        }
    }
    return await BaseTranslate(options,
        res => res,
        undefined,
        response => response.response.choices[0].message.content);
}

/**
 * ChatGPT 流式传输
 * @param {string} raw 原文
 * @param {TranslateDiv} translateDiv 翻译结果面板
 * @returns {Promise<TranslateResult>} 翻译结果对象
 */
async function translate_openai_stream(raw, translateDiv) {
    const result = {
        done: true,
        checkPassed: null,
        response: null,
        responseText: null,
        text: "",
        error: null,
        message: null
    };
    const helpText = i18next.t('error.basic', { ns: 'translator' }); // 基本帮助提示信息
    try {
        for await (const delta of openai_stream(raw)) {
            result.text += delta;
            // 翻译结果面板更新
            translateDiv.updateTranslateDiv(result.text, !(OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru), false);
        }
        return result;
    } catch (err) {
        console.warn(err);
        result.error = {
            message: err.message || null,
            stack: err.stack ? err.stack.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;') : null,
            enumerable: err,
            source: 'openai_stream'
        };
        result.message = `${i18next.t('error.GMRequest', { ns: 'translator' })}${helpText}`;
    }

    return result;
}

/**
 * 流式传输
 * @param {string} raw 原文
 * @returns {AsyncGenerator<string>} 返回 AsyncGenerator
 */
async function* openai_stream(raw) {
    const modelDefault = 'gpt-3.5-turbo';
    const lang = getTargetLanguage('openai');
    const prompt = (OJBetter.typeOfPage.is_oldLatex || OJBetter.typeOfPage.is_acmsguru) ?
        i18next.t('chatgpt_prompt.notLaTeX', { ns: 'translator', transTargetLang: lang, lng: OJBetter.translation.targetLang }) :
        i18next.t('chatgpt_prompt.common', { ns: 'translator', transTargetLang: lang, lng: OJBetter.translation.targetLang });
    const data = {
        model: OJBetter.chatgpt.config.model || modelDefault,
        messages: [{
            role: "user",
            content: prompt + raw
        }],
        temperature: 0.7,
        stream: true,
        ...Object.assign({}, ...OJBetter.chatgpt.config.data)
    }
    const options = {
        method: "POST",
        url: OJBetter.chatgpt.config.proxy || 'https://api.openai.com/v1/chat/completions',
        data: JSON.stringify(data),
        responseType: 'stream',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + OJBetter.chatgpt.config.key,
            ...Object.assign({}, ...OJBetter.chatgpt.config.header)
        }
    }
    const response = await OJB_GMRequest(options, true);
    const reader = response.response.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // 用于累积数据片段的缓冲区

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

    return buffer;
}

/**
 * @typedef {Object} CheckResponseResult
 * @property {boolean} status 检查是否通过
 * @property {string} message 检查失败时的消息
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {Object} message 错误消息
 * @property {Object} stack 错误堆栈
 * @property {Object} enumerable 可枚举的错误属性
 * @property {string} source 错误来源
 */

/**
 * @typedef {Object} TranslateResult
 * @property {boolean} done 操作是否完成
 * @property {CheckResponseResult|null} checkPassed 检查是否通过的结果
 * @property {Object|null} response 响应对象
 * @property {string|null} text 处理后的文本
 * @property {ErrorResponse} error 错误列表
 * @property {string|null} message 可能的消息
 */

/**
 * 通用翻译函数
 * @param {Object} options GM_xmlhttpRequest 的参数
 * @param {Function} processer 响应再处理函数，它接收响应文本，并应返回处理后的文本。
 * @param {Function} checkResponse 检查文本是否符合预期的函数，它接收文本，并返回一个Object，包含状态和信息。默认为返回 { status: true, message: 'ok' }
 * @param {Function} getResponseText 重写响应文本获取函数，它接收response，并返回响应文本。 默认为 response.responseText
 * @returns {Promise<TranslateResult>} 返回 Promise，其解析值为翻译结果对象
 */
async function BaseTranslate(options, processer, checkResponse = () => { return { status: true, message: 'ok' } }, getResponseText = (response) => response.responseText) {
    const result = {
        done: false,
        checkPassed: null,
        response: null,
        responseText: null,
        text: "",
        error: null,
        message: null
    };
    const helpText = i18next.t('error.basic', { ns: 'translator' }); // 基本帮助提示信息
    const toDo = async () => {
        try {
            result.response = await OJB_GMRequest(options);
            result.responseText = result.response.responseText;
            result.text = getResponseText(result.response);
        } catch (err) {
            console.warn(err);
            result.error = {
                message: err.message || null,
                stack: err.stack ? err.stack.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;') : null,
                enumerable: err,
                source: 'GMRequest'
            };
            result.message = `${i18next.t('error.GMRequest', { ns: 'translator' })}${helpText}`;
            throw result;
        }
        try {
            result.text = processer(result.text);
        } catch (err) {
            console.warn(err);
            result.error = {
                message: err.message || null,
                stack: err.stack ? err.stack.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;') : null,
                enumerable: err,
                source: 'processer'
            };
            result.message = `${i18next.t('error.processer', { ns: 'translator' })}${helpText}`;
            throw result;
        }
        try {
            result.checkPassed = checkResponse(result.text);
            if (result.checkPassed.status) result.done = true;
            else result.message = result.checkPassed.message;
            return result;
        } catch (err) {
            console.warn(err);
            result.error = {
                message: err.message || null,
                stack: err.stack ? err.stack.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;') : null,
                enumerable: err,
                source: 'checkResponse'
            };
            result.message = `${i18next.t('error.checkResponse', { ns: 'translator' })}${helpText}`;
            throw result;
        }
    };

    return await OJB_promiseRetryWrapper(toDo, {
        maxRetries: 3,
        errorHandler: (err, maxRetries, attemptsLeft) => {
            const detailedError = {
                maxRetries: maxRetries,
                attemptsLeft: attemptsLeft,
                ...err
            };
            return detailedError;
        }
    });
}

/**
 * 查询服务余额
 * @param {Object} quotaConfig - 配额配置对象
 * @returns {Promise} 返回包含余额信息的 Promise
 */
async function queryServerBalance(quotaConfig) {
    // 确保传入了有效的配置对象
    if (!quotaConfig || !quotaConfig.url) {
        return Promise.reject(new Error('Quota configuration is missing.'));
    }

    // 准备请求选项
    const requestOptions = {
        method: quotaConfig.method || 'GET',
        url: quotaConfig.url,
        headers: {
            ...Object.assign({}, ...quotaConfig.header)
        },
        data: JSON.stringify({ ...Object.assign({}, ...quotaConfig.data) })
    };

    // 发送请求并返回 Promise
    return OJB_GMRequest(requestOptions).then(response => {
        try {
            const responseData = JSON.parse(response.responseText);
            // 从响应数据中提取余额
            const surplusPath = quotaConfig.surplus;
            const surplusValue = OJB_evaluatePathOrExpression(responseData, surplusPath);
            return surplusValue;
        } catch (error) {
            return Promise.reject(new Error('Failed to parse balance response.'));
        }
    }).catch(error => {
        console.warn('Error querying balance:', error);
        return Promise.reject(error);
    });
}

/**
 * 确认 jQuery 已加载
 * @param {number} retryDelay 重试延迟（毫秒）
 * @returns {Promise<void>}
 */
async function ensureJQueryIsLoaded(retryDelay = 50) {
    while (typeof jQuery === 'undefined') {
        console.warn(`JQuery is not loaded. Retry after ${retryDelay} ms.`);
        await OJB_delay(retryDelay);
        retryDelay = Math.min(retryDelay * 2, 2000);
    }
}

/**
 * 加载必须的函数
 * @returns {Promise<LoadingMessage>} 加载提示信息
 */
async function loadRequiredFunctions() {
    await initVar();// 初始化全局变量
    return Promise.allSettled([
        initDB(), // 连接数据库
        initI18next(), // i18next初始化
        initButtonFunc(), // 加载按钮相关函数
        checkScriptVersion(), // 更新检查
        ...(OJBetter.typeOfPage.is_acmsguru ? [acmsguruReblock()] : []) // 为acmsguru题面重新划分div
    ]);
}

/**
 * DOM加载后即可执行
 */
function initOnDOMReady() {
    showAnnounce(); // 显示公告
    showWarnMessage(); // 显示警告消息
    initSettingsPanel(); // 加载设置按钮面板
    localizeWebsite(); // 网站本地化替换
    addDependencyStyles(); // 添加一些依赖库的样式
    addI18nStyles(); // 添加包含i18n内容的样式
    if (OJBetter.basic.expandFoldingblocks) ExpandFoldingblocks(); // 折叠块展开
    if (OJBetter.basic.renderPerfOpt) RenderPerfOpt(); // 折叠块渲染优化
    if (OJBetter.typeOfPage.is_problem) {
        const problemPageLinkbar = new ProblemPageLinkbar(); // 创建题目页相关链接栏
        if (OJBetter.basic.showJumpToLuogu) CF2luogu(problemPageLinkbar); // 跳转到洛谷按钮
        if (OJBetter.clist.enabled.problem) showRatingByClist_problem(problemPageLinkbar); // problem页显示Rating
    }
    if (OJBetter.typeOfPage.is_contest) {
        if (OJBetter.clist.enabled.contest) showRatingByClist_contest(); // contest页显示Rating
    }
    if (OJBetter.typeOfPage.is_problemset) {
        if (OJBetter.clist.enabled.problemset) showRatingByClist_problemset(); // problemset页显示Rating
    }
    if (OJBetter.typeOfPage.is_problem && OJBetter.monaco.enableOnProblemPage) {
        addProblemPageCodeEditor(); // 添加题目页代码编辑器
    }
}

/**
 * 需要在页面资源完全加载后执行的函数
 */
function onResourcesReady(loadingMessage) {
    if (OJBetter.preference.showLoading) loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('loadFunc', { ns: 'alert' })}`);
    initializeInParallel(loadingMessage);
    initializeSequentially(loadingMessage);
}

/**
 * 可以异步并行的函数
 */
function initializeInParallel(loadingMessage) {
    if (OJBetter.basic.darkMode == "dark") darkModeStyleAdjustment(); // 黑暗模式额外的处理事件
    if (OJBetter.basic.commentPaging) CommentPagination(); // 评论区分页
    if (OJBetter.translation.comment.transMode == "2") multiChoiceTranslation(); // 选段翻译支持
}

/**
 * 必须按序执行的函数
 */
async function initializeSequentially(loadingMessage) {
    await addConversionButton(); // 添加MD/复制/翻译按钮
    if ((OJBetter.typeOfPage.is_problem || OJBetter.typeOfPage.is_completeProblemset) && OJBetter.translation.memory.enabled) {
        await initTransResultsRecover(); // 翻译结果恢复功能初始化
    }
    if (OJBetter.translation.auto.enabled) {
        await initTransWhenViewable(); // 自动翻译
    }
    if (OJBetter.basic.standingsRecolor && OJBetter.typeOfPage.is_cfStandings) {
        await recolorStandings(); // cf赛制榜单重新着色
    }
    if (OJBetter.preference.showLoading) loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('loadSuccess', { ns: 'alert' })}`, 'success', 3000);
}

/**
 * 脚本开始加载
 */
document.addEventListener("DOMContentLoaded", async () => {
    await ensureJQueryIsLoaded(); // 等待jQuery加载
    const loadingMessage = new LoadingMessage();
    await loadRequiredFunctions(); // 加载必须的函数
    initOnDOMReady(); // DOM加载后即可执行的函数
    if (OJBetter.preference.showLoading) loadingMessage.updateStatus(`${OJBetter.state.name} —— ${i18next.t('onload', { ns: 'alert' })}`);

    // 检查页面资源是否已经完全加载
    if (OJBetter.state.notWaiteLoaded) {
        onResourcesReady(loadingMessage);
    } else {
        if (document.readyState === 'complete') {
            onResourcesReady(loadingMessage);
        } else {
            window.addEventListener('load', () => onResourcesReady(loadingMessage));
        }
    }
});

// ------------------------------
// 配置自动迁移代码（将在10个小版本后移除-1.83）
// ------------------------------

{
    let bottomZh_CN = GM_getValue("bottomZh_CN");
    if (bottomZh_CN !== undefined) {
        if (bottomZh_CN == true) {
            GM_setValue("localizationLanguage", "zh");
        } else {
            GM_setValue("localizationLanguage", "initial");
        }
        GM_deleteValue("bottomZh_CN");
        location.reload();
    }
}
{
    let config = GM_getValue("chatgpt-config");
    if (config && config !== undefined) {
        let index = parseInt(config.choice, 10);
        if (index == -1) config.choice = "";
        else config.choice = config.configurations[index].note;
        config.configurations.forEach(function (item) {
            item.name = item.note;
            delete item.note;
        });
        GM_deleteValue("chatgpt-config");
        GM_setValue("chatgpt_config", config);
        location.reload();
    }
}
{
    let config = GM_getValue("Complet_config");
    if (config && config.changed === undefined) {
        config.changed = true; // 设置一个迁移标志
        config.configurations.forEach(function (item) {
            if (item.note !== undefined) {
                item.name = item.note;
                delete item.note;
            }
        });
        GM_setValue("Complet_config", config);
        location.reload();
    }
}
