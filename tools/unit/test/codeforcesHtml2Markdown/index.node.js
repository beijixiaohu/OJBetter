const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const TurndownService = require('turndown');

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
