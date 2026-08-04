const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

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
