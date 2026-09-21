const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const TurndownService = require('turndown');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');

const SCRIPT_PATH = path.resolve(
    __dirname,
    '../../../../script/dev/codeforces-better.user.js'
);
const SOURCE = fs.readFileSync(SCRIPT_PATH, 'utf8').replace(/\r\n/g, '\n');

function loadCodeSpanHelper() {
    const start = SOURCE.indexOf('function OJB_createMarkdownCodeSpan(');
    const end = SOURCE.indexOf(
        '\n\n/**\n * 初始化html2markdown转换器',
        start
    );
    assert.notEqual(start, -1, 'missing production code-span helper');
    assert.ok(end > start, 'missing production code-span helper end');

    const context = vm.createContext({});
    vm.runInContext(
        `${SOURCE.slice(start, end)}\n` +
        'globalThis.__createMarkdownCodeSpan = OJB_createMarkdownCodeSpan;',
        context,
        { filename: SCRIPT_PATH }
    );
    return context.__createMarkdownCodeSpan;
}

function getRuleSource(name) {
    const start = SOURCE.indexOf(`turndownService.addRule("${name}", {`);
    const end = SOURCE.indexOf('\n  });', start);
    assert.notEqual(start, -1, `missing ${name} rule`);
    assert.ok(end > start, `missing ${name} rule end`);
    return SOURCE.slice(start, end + '\n  });'.length);
}

test('creates Markdown code spans without escaping literal code characters', () => {
    const createCodeSpan = loadCodeSpanHelper();

    for (const [value, expected] of [
        ['', ''],
        ['A 3 1', '`A 3 1`'],
        ['a_b[x]\\y', '`a_b[x]\\y`'],
        ['use `x`', '`` use `x` ``'],
        ['a ` b', '``a ` b``'],
        ['first\nsecond', '`first second`']
    ]) {
        assert.equal(createCodeSpan(value), expected);
    }
});

test('reads raw DOM text for both Codeforces code-style rules', () => {
    for (const name of ['tex-tt', 'text-verb']) {
        const rule = getRuleSource(name);
        assert.match(
            rule,
            /replacement: function \(_content, node\) \{\s*return OJB_createMarkdownCodeSpan\(node\.textContent\);/
        );
    }
});

async function loadConverter() {
    const start = SOURCE.indexOf('async function initHTML2MarkDown()');
    const end = SOURCE.indexOf('\n/**\n * 任务队列', start);
    assert.ok(start >= 0 && end > start);
    const context = vm.createContext({
        TurndownService,
        OJBetter: { common: {} },
        OJB_createMarkdownCodeSpan: loadCodeSpanHelper(),
    });
    vm.runInContext(SOURCE.slice(start, end), context);
    await context.initHTML2MarkDown();
    return context.OJBetter.common.turndownService;
}

test('excludes text-hidden content from Markdown regardless of formatting (#447)', async () => {
    const converter = await loadConverter();
    for (const hidden of [
        '<span class="text-hidden">hidden instructions</span>',
        '<div class="extra text-hidden"><p>hidden <strong>instructions</strong></p></div>',
        '<span class="text-hidden tex-font-style-bf">hidden instructions</span>',
        '<span class="text-hidden text-verb">hidden instructions</span>',
    ]) {
        assert.equal(converter.turndown(`<div>before${hidden}after</div>`), 'beforeafter');
    }
});

test('keeps collapsed content, hidden original code and raw formula sources', async () => {
    const converter = await loadConverter();
    assert.equal(converter.turndown('<div class="spoiler-content" style="display:none"><p>Editorial</p></div>'), 'Editorial');
    assert.match(converter.turndown('<pre style="display:none"><code>int x = 1;</code></pre>'), /int x = 1;/);
    assert.equal(converter.turndown('<p>Formula: <script type="math/tex">x+1</script></p>'), 'Formula: $x+1$');
});

async function loadTutorialCache(html) {
    const dom = new JSDOM(html);
    const $ = jquery(dom.window);
    const context = vm.createContext({
        $,
        OJBetter: { common: { turndownService: await loadConverter() } },
        OJB_normalizeCodeforcesLatexDelimiters: value => value,
        OJB_TRANSLATION_BLOCK_CACHE_KEY: 'translationBlocks',
        containsLegacyLatex: () => false,
    });
    for (const name of [
        'isPendingTutorialMarkdown', 'findTranslationBlockElements',
        'getTranslationBlockElements', 'getSelectedTranslationBlockElements',
        'cacheTranslationMarkdown',
    ]) {
        const start = SOURCE.indexOf(`function ${name}(`);
        const end = SOURCE.indexOf('\n}', start);
        assert.ok(start >= 0 && end > start, `missing ${name}`);
        vm.runInContext(SOURCE.slice(start, end + 2), context);
    }
    const start = SOURCE.indexOf('$.fn.getMarkdown = function () {');
    const end = SOURCE.indexOf('\n  };', start);
    assert.ok(start >= 0 && end > start);
    vm.runInContext(SOURCE.slice(start, end + 5), context);
    return { dom, $, context };
}

test('loads current tutorial text and blocks after replacing the loading placeholder (#448)', async () => {
    const { dom, $, context } = await loadTutorialCache(
        '<div id="tutorial" class="spoiler-content"><p>Tutorial is loading...</p></div>'
    );
    try {
        const root = $('#tutorial');
        assert.equal(context.cacheTranslationMarkdown(root[0]), 'Tutorial is loading...');
        assert.equal(root.data('markdown'), undefined);
        assert.equal(root.data('translationBlocks'), undefined);
        assert.equal(root.find('p').data('markdown'), undefined);
        root.html('<p>Loaded explanation.</p><p class="block_selected">Second paragraph.</p>');
        assert.equal(root.getMarkdown(), 'Loaded explanation.\n\nSecond paragraph.');
        assert.equal(context.getTranslationBlockElements(root[0]).length, 2);
        assert.equal(context.getSelectedTranslationBlockElements(root[0]).text(), 'Second paragraph.');
        context.cacheTranslationMarkdown(root[0]);
        assert.equal(root.data('translationBlocks').length, 2);
        root.find('p').first().text('Translated explanation.');
        assert.equal(root.getMarkdown(), 'Loaded explanation.\n\nSecond paragraph.');
        assert.equal(root.find('p').first().getMarkdown(), 'Loaded explanation.');
    } finally {
        dom.window.close();
    }
});

test('does not freeze a parent containing a pending tutorial or an initially empty block list', async () => {
    const { dom, $, context } = await loadTutorialCache(
        '<div id="blog"><p>Introduction</p><div id="tutorial" class="spoiler-content">Tutorial is loading...</div></div>'
    );
    try {
        context.cacheTranslationMarkdown($('#blog')[0]);
        context.cacheTranslationMarkdown($('#tutorial')[0]);
        assert.equal($('#blog').data('translationBlocks'), undefined);
        assert.equal($('#tutorial').data('translationBlocks'), undefined);
        $('#tutorial').html('<p>New tutorial</p>');
        assert.match($('#blog').getMarkdown(), /New tutorial/);
        assert.equal(context.getTranslationBlockElements($('#blog')[0]).length, 2);
        assert.equal(context.getTranslationBlockElements($('#tutorial')[0]).length, 1);
        assert.equal(context.isPendingTutorialMarkdown('Tutorial is loading…'), true);
        assert.equal(context.isPendingTutorialMarkdown('Tutorial\nis loading...'), true);
    } finally {
        dom.window.close();
    }
});

test('emits MathJax source exactly once across output modes (#451)', async () => {
    const converter = await loadConverter();
    const latex = String.raw`f(a) = \max (0, \smash{\displaystyle\max_{1 \leq i \leq l}} \sum_{j=1}^{i} a_j )`;
    for (const [inline, display] of [
        ['<span class="MathJax">rendered n</span>', '<div class="MathJax_Display"><span class="MathJax">rendered formula</span></div>'],
        ['<span class="MathJax_CHTML mjx-chtml"><span class="mjx-math">rendered n</span></span>', '<span class="MJXc-display"><span class="MathJax_CHTML mjx-chtml">rendered formula</span></span>'],
        ['<span class="MathJax_SVG"><svg></svg></span>', '<div class="MathJax_SVG_Display"><span class="MathJax_SVG"><svg></svg></span></div>'],
        ['', ''],
    ]) {
        for (const preview of ['', '<span class="MathJax_Preview">preview</span>']) {
            const html = `<p>Number ${preview}${inline}<script type="math/tex">n</script>.</p>${preview}${display}<script type="math/tex; mode=display">${latex}</script>`;
            assert.equal(converter.turndown(html), `Number $n$.\n\n$$\n${latex}\n$$`);
        }
    }
});

test('preserves adjacent formulas, operators and ignores assistive duplicates', async () => {
    const converter = await loadConverter();
    assert.equal(converter.turndown('<span class="MathJax_CHTML">x<span class="MJX_Assistive_MathML"><math>x</math></span></span><script type="math/tex">x</script> and <script type="math/tex">a < b > c</script>'), '$x$ and $a &lt; b &gt; c$');
});

test('converts actual MathJax 2.7.9 browser output with preview and assistive MathML', async () => {
    // Captured from MathJax 2.7.9, whose core and CommonHTML files match Codeforces byte-for-byte.
    const fixtures = require('./mathjax-2.7.9.json');
    const converter = await loadConverter();
    for (const fixture of fixtures) {
        assert.equal(converter.turndown(fixture.html), fixture.expected, fixture.renderer);
    }
});

test('preserves readable rendered content when another plugin removes the TeX source', async () => {
    const converter = await loadConverter();
    assert.equal(converter.turndown('<span class="MathJax_CHTML">x+1</span>'), 'x+1');
    assert.equal(converter.turndown('<span class="MathJax_Preview">x+1</span>'), 'x+1');
    assert.equal(converter.turndown('<span class="MJXc-display"><span class="MathJax_CHTML">x+1</span></span>'), 'x+1');
});
