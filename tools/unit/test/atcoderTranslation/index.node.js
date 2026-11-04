const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');
const markdownit = require('markdown-it');
const TurndownService = require('turndown');

const ROOT = path.resolve(__dirname, '../../../..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'script/dev/atcoder-better.user.js'), 'utf8');
const SUBS = JSON.parse(fs.readFileSync(path.join(ROOT, 'resources/subs/atcoder-better.json'), 'utf8'));

function section(startMarker, endMarker) {
    const start = SOURCE.indexOf(startMarker);
    const end = SOURCE.indexOf(endMarker, start + startMarker.length);
    assert.ok(start >= 0 && end > start, `missing production section: ${startMarker}`);
    return SOURCE.slice(start, end);
}

async function harness(t, { html = '<section id="source"><p>Explanation</p></section>',
    url = 'https://atcoder.jp/contests/abc481/editorial/27922', stream = false,
    endpoint = 'responses', response = value => value.replace('Explanation', '说明') } = {}) {
    const dom = new JSDOM(html, { url });
    t.after(() => dom.window.close());
    const $ = jquery(dom.window);
    dom.window.markdownit = markdownit;
    const requests = [];
    const renders = [];
    const saved = [];
    let clipboard;
    let nextId = 30000000;
    const OJBetter = {
        typeOfPage: { isEditorial: true, is_problem: true },
        translation: {
            choice: 'openai', replaceSymbol: '2', targetLang: 'zh',
            comment: { choice: '0', transMode: '0' }, auto: { shortTextLength: 2000 },
            memory: { enabled: true, ttTree: {
                refreshNode() {},
                addTransResultMap(id, value) { saved.push(value); },
                getNodeData() { return []; },
                getTransResultMap() { return {}; }
            } }
        },
        chatgpt: {
            isStream: stream, customPrompt: '', asSystemPrompt: true,
            config: {
                name: 'test', model: 'test-model', key: 'test-key',
                proxy: `https://example.test/v1/${endpoint === 'responses' ? 'responses' : 'chat/completions'}`,
                data: [], header: [], quota: {}
            }
        },
        common: { taskQueue: { addTask: (_service, task) => task() } },
        localization: { websiteLang: 'zh' },
        dev: {}, preference: {}
    };
    const context = vm.createContext({
        $, window: dom.window, document: dom.window.document,
        Node: dom.window.Node, NodeFilter: dom.window.NodeFilter,
        DOMParser: dom.window.DOMParser,
        console: { warn() {}, error() {} }, TextDecoder, TextEncoder,
        setTimeout: dom.window.setTimeout.bind(dom.window),
        clearTimeout: dom.window.clearTimeout.bind(dom.window),
        i18next: { t: key => key },
        OJBetter, TurndownService,
        getTargetLanguage: () => 'Chinese',
        OJB_getRandomNumber: () => nextId++,
        OJB_safeCreateJQElement: value => $(value),
        OJB_debounce: callback => callback,
        OJB_observeElement() {},
        getLocalizeWebsiteJson: async () => SUBS,
        GM_getValue: () => 'openai',
        GM_setClipboard: value => { clipboard = value; },
        updateTransDBData() {},
        isEmptyText: value => !value.trim(),
        OJB_GMRequest: async options => {
            const data = JSON.parse(options.data);
            requests.push(data);
            const raw = endpoint === 'responses' ? data.input.at(-1).content : data.messages.at(-1).content;
            const text = response(raw);
            if (!stream) return { status: 200, response: endpoint === 'responses'
                ? { output: [{ content: [{ type: 'output_text', text }] }] }
                : { choices: [{ message: { content: text } }] } };
            // 每个字符一个 SSE 事件，覆盖代码占位符跨数据块接收的情况。
            const records = [...text].map(character => endpoint === 'responses'
                ? `event: response.output_text.delta\ndata: ${JSON.stringify({ delta: character })}\n\n`
                : `data: ${JSON.stringify({ choices: [{ delta: { content: character } }] })}\n\n`);
            records.push(endpoint === 'responses'
                ? 'event: response.completed\ndata: {}\n\n'
                : 'data: [DONE]\n\n');
            return { status: 200, response: new ReadableStream({
                start(controller) {
                    for (const record of records) controller.enqueue(new TextEncoder().encode(record));
                    controller.close();
                }
            }) };
        }
    });
    for (const [start, end] of [
        ['const OJB_PLACEHOLDER_TOKEN_PAIRS =', 'class OJB_GMError extends Error'],
        ['class TextBlockReplacer {', '// 一些工具函数'],
        ['function OJB_getCodeFromPre(', '// =================处理代码块语言'],
        ['async function initHTML2MarkDown()', '/**\n * 任务队列'],
        ['async function initButtonFunc()', '/**\n * 获取当前翻译模式'],
        ['class TranslateDiv {', '// 元素关系树'],
        ['const OJB_REPLACE_ORIGINAL_PROTOCOL_VERSION', 'async function translateMain('],
        ['async function translateMain(', '//弹窗翻译'],
        ['function isOpenAIResponsesEndpoint', '/**\n * @typedef {Object} CheckResponseResult'],
        ['async function OJB_promiseRetryWrapper(', 'function OJB_GMRequest('],
        ['async function BaseTranslate(', '/**\n * 查询服务余额'],
        ['function getAtCoderEditorialContent()', '/**\n * 等待LaTeX']
    ]) {
        vm.runInContext(section(start, end), context);
    }
    vm.runInContext(section('const OJB_unescapeHtml =', '/**\n * 获取对象中指定路径'), context);
    await context.initHTML2MarkDown();
    await context.initButtonFunc();
    vm.runInContext(`
        const originalUpdate = TranslateDiv.prototype.updateTranslateDiv;
        TranslateDiv.prototype.updateTranslateDiv = function (text, ...options) {
            __recordRender(text);
            return originalUpdate.call(this, text, ...options);
        };
        globalThis.createDiv = () => new TranslateDiv("test-panel");
        globalThis.prepareOriginal = OJB_prepareReplaceOriginalState;
    `, Object.assign(context, { __recordRender: value => renders.push(value) }));
    return { context, $, dom, OJBetter, requests, renders, saved, clipboard: () => clipboard,
        translate: (raw, state = null) => context.translateMain(raw, $('#source').get(0), false, undefined, state) };
}

test('formatting and copying preserve inline formula syntax and literal HTML entities (#459)', async t => {
    const h = await harness(t);
    const raw = 'Explanation &lt; bound\n\n`$Q$ $\\mathrm{query}_1$ &amp; &#95;`\n\n~~~cpp\ncout << "$a_b$ &amp;";\n~~~';
    const result = await h.translate(raw);
    assert.equal(result.status, 'ok');
    assert.equal(result.translatedText, raw.replace('Explanation', '说明'));
    assert.equal(result.translateDiv.mainDiv.find('code').first().text(), '$Q$ $\\mathrm{query}_1$ &amp; &#95;');
    result.translateDiv.copyButton.trigger('click');
    assert.equal(h.clipboard(), raw.replace('Explanation &lt;', '说明 <'));
});

test('machine translation also leaves formulas inside code unchanged (#459)', async t => {
    const h = await harness(t);
    h.context.translate_gg = async raw => ({ done: true, text: raw.replace('Explanation', '说明') });
    const result = await h.context.translateMain(
        'Explanation\n\n`$Q$ $\\mathrm{query}_1$ $\\mathrm{query}_2$`',
        h.$('#source').get(0), false, 'google'
    );
    assert.equal(result.status, 'ok');
    assert.equal(result.translateDiv.mainDiv.find('code').text(), '$Q$ $\\mathrm{query}_1$ $\\mathrm{query}_2$');
    assert.doesNotMatch(result.translatedText, /&#95;/);
});

for (const raw of [
    'Before\n\n```cpp\nint x = 1;\n```\n\nAfter',
    'Before\r\n\r\n~~~~cpp\r\nstd::cout << "```";\r\n~~~~\r\n\r\nAfter',
    'Before\n\n````text\n```\n$a_b$ &amp; $& $` $\'\n```\n````\n\nAfter',
    'Before\n\n    int x = 1;\n    return x;\n\nAfter',
    '> ```cpp\n> int x = 1;\n> ```\n\nAfter',
    '- item\n\n  ```cpp\n  int x = 1;\n  ```\n\nAfter',
    'Before\n\n```cpp\nunclosed code fence'
]) {
    test(`code-block round trip: ${JSON.stringify(raw.slice(0, 30))}`, async t => {
        const h = await harness(t);
        const protection = h.context.OJB_protectMarkdownCode(raw, { translation: true });
        assert.doesNotMatch(protection.text, /int x|return x|std::cout|unclosed code|a_b/);
        assert.equal(protection.recover(protection.text), raw);
        const formatting = h.context.OJB_protectMarkdownCode(raw, { inline: true });
        assert.equal(formatting.recover(formatting.text), raw);
    });
}

for (const stream of [false, true]) {
    for (const endpoint of ['responses', 'chat']) {
        test(`AI ${endpoint}, stream=${stream}: keeps large source code out of the request and restores it (#464)`, async t => {
            const h = await harness(t, { stream, endpoint });
            const code = 'int secret_source = 1;\n'.repeat(200);
            const raw = `Explanation with inline \`x_i\`.\n\n\`\`\`cpp\n${code}\`\`\`\n\nEnd.`;
            const result = await h.translate(raw);
            assert.equal(result.status, 'ok');
            assert.equal(h.requests.length, 1);
            const request = JSON.stringify(h.requests[0]);
            assert.doesNotMatch(request, /secret_source/);
            assert.match(request, /x_i/);
            assert.match(request, /placeholder.*unchanged and exactly once/);
            assert.equal(result.translatedText, raw.replace('Explanation', '说明'));
            assert.equal(result.translateDiv.mainDiv.find('pre code').text(), code);
            assert.equal(h.saved[0], result.translatedText);
            if (stream) {
                assert.ok(h.renders.some(value => value.includes(code.trimEnd())));
                assert.ok(!h.renders.some(value => /\{3\d{0,7}\}?/.test(value)));
            }
        });
    }
}

for (const stream of [false, true]) {
    for (const [name, response] of [
        ['missing placeholder', raw => raw.replace(/\{\d{8}\}/, '')],
        ['duplicate placeholder', raw => `${raw}\n${raw.match(/\{\d{8}\}/)[0]}`]
    ]) {
        test(`stream=${stream}: rejects ${name} and never saves incomplete translated code`, async t => {
            const h = await harness(t, { response, stream });
            const result = await h.translate('Explanation\n\n```cpp\nint secret_source;\n```\n\nEnd.');
            assert.equal(result.status, 'error');
            assert.equal(result.rawData.done, false);
            assert.equal(result.rawData.error.source, 'codeProtection');
            assert.equal(h.saved.length, 0);
        });
    }
}

test('all placeholder styles round trip without colliding with existing numeric source', async t => {
    const h = await harness(t);
    for (const style of ['1', '2', '3']) {
        h.OJBetter.translation.replaceSymbol = style;
        const raw = 'Existing {30000000} and [30000001].\n\n```text\nvalue\n```\n';
        const protectedCode = h.context.OJB_protectMarkdownCode(raw, { translation: true });
        assert.equal(protectedCode.recover(protectedCode.text), raw);
        assert.equal(protectedCode.recover(protectedCode.text.replace(/(\n\n[【[{])(\d{8})/, '$1 $2 ')), raw);
    }
});

test('source replacement mode leaves original code DOM untouched and out of the AI request', async t => {
    const h = await harness(t, { html: '<section id="source"><p>Explanation</p><pre><code>int secret_source;</code></pre></section>' });
    const code = h.$('#source pre').get(0);
    const state = h.context.prepareOriginal(h.$('#source').get(0));
    assert.ok(state);
    const result = await h.translate(state.raw, state);
    assert.equal(result.status, 'ok');
    assert.doesNotMatch(JSON.stringify(h.requests), /secret_source/);
    assert.equal(h.$('#source pre').get(0), code);
    assert.equal(h.$('#source p').text(), '说明');
    state.restore();
    assert.equal(h.$('#source p').text(), 'Explanation');
});

for (const mode of ['1', '2', 'whole']) {
    test(`mode=${mode}: code stays local when translating segments or the whole target`, async t => {
        const h = await harness(t, {
            html: '<section id="source"><p class="block_selected">Explanation</p><pre><code>int secret_source;</code></pre></section>'
        });
        h.OJBetter.translation.comment.transMode = mode;
        vm.runInContext(section('function getTranslationButtonDefaultText()', 'class TranslateDiv {'), h.context);
        const button = h.$('<button>');
        const originalCode = h.$('#source pre').get(0);
        const raw = h.$('#source').getMarkdown();
        await h.context.executeTranslation(button, h.$('#source').get(0), 'this_level', false, undefined,
            mode === 'whole' ? raw : undefined);
        assert.ok(h.requests.length > 0);
        assert.doesNotMatch(JSON.stringify(h.requests), /secret_source/);
        assert.equal(h.$('#source pre').first().get(0), originalCode);
        assert.equal(button.data('buttonState'), 'success');
    });
}

test('locates the print editorial body without contest navigation (#465)', async t => {
    const h = await harness(t, {
        url: 'https://atcoder.jp/contests/abc481/editorial/27922/print?lang=en',
        html: '<div id="main-container"><div class="row"><div class="col-sm-12"><h2>Title</h2><hr><div id="body"><p>Explanation</p><pre><code>int x;</code></pre></div></div></div></div>'
    });
    assert.equal(h.context.getAtCoderEditorialContent().attr('id'), 'body');
});

test('retains normal editorial targeting and ignores unrelated navigation-free pages', async t => {
    const normal = await harness(t, { html: '<div id="contest-nav-tabs"></div><div id="normal-body">Explanation</div>' });
    assert.equal(normal.context.getAtCoderEditorialContent().attr('id'), 'normal-body');
    const other = await harness(t, { url: 'https://atcoder.jp/contests/abc481/editorial', html: '<div id="main-container"><div class="row"><div class="col-sm-12"><h2>Index</h2><div>List</div></div></div></div>' });
    assert.equal(other.context.getAtCoderEditorialContent().length, 0);
});

test('print editorial receives all three existing conversion actions', async t => {
    const h = await harness(t, {
        url: 'https://atcoder.jp/contests/abc481/editorial/27922/print',
        html: '<div id="main-container"><div class="row"><div class="col-sm-12"><h2>Title</h2><hr><div id="body"><p>Explanation</p><pre><code>int secret_source;</code></pre></div></div></div></div>'
    });
    h.OJBetter.typeOfPage.is_problem = false;
    vm.runInContext(section('function getTranslationButtonDefaultText()', 'class TranslateDiv {'), h.context);
    await h.context.addConversionButton();
    assert.equal(h.context.getAtCoderEditorialContent().attr('id'), 'body');
    assert.equal(h.$('#body').prev('.html2md-panel').find('button').length, 3);
    assert.equal(h.$('button[type=submit]').length, 0);
    h.$('[id^=html2md-cb]').trigger('click');
    assert.match(h.clipboard(), /Explanation/);
    assert.match(h.clipboard(), /int secret_source;/);
    h.$('[id^=html2md-view]').trigger('click');
    assert.equal(h.$('#body').attr('viewmd'), 'true');
    h.$('[id^=html2md-view]').trigger('click');
    assert.equal(h.$('#body').attr('viewmd'), 'false');
    await h.$('.translateButton').data('translatedItBy')();
    assert.equal(h.requests.length, 1);
    assert.doesNotMatch(JSON.stringify(h.requests), /secret_source/);
    assert.equal(h.$('.translate-problem-statement p').first().text(), '说明');
    assert.equal(h.$('.translate-problem-statement pre code').text(), 'int secret_source;\n');
});

test('localizes the editorial print link (#465)', async t => {
    const h = await harness(t, {
        html: '<a class="btn" href="/contests/abc481/editorial/27922/print">Editorial for printing</a>'
    });
    const start = SOURCE.indexOf('async function localizeWebsite()');
    const end = SOURCE.indexOf('\nasync function ', start + 1);
    vm.runInContext(SOURCE.slice(start, end), h.context);
    await h.context.localizeWebsite();
    assert.equal(h.$('a.btn').text(), '打印版题解');
    assert.equal(h.$('a.btn').attr('href'), '/contests/abc481/editorial/27922/print');
});
