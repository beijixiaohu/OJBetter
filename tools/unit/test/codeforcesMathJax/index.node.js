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

function extractNamedFunction(source, name) {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);
    assert.notEqual(start, -1, `missing production helper ${name}`);

    const bodyStart = source.indexOf('{', start + marker.length);
    assert.notEqual(bodyStart, -1, `missing body for ${name}`);

    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;

    for (let index = bodyStart; index < source.length; index++) {
        const character = source[index];
        const nextCharacter = source[index + 1];

        if (lineComment) {
            if (character === '\n') lineComment = false;
            continue;
        }
        if (blockComment) {
            if (character === '*' && nextCharacter === '/') {
                blockComment = false;
                index++;
            }
            continue;
        }
        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (character === '\\') {
                escaped = true;
            } else if (character === quote) {
                quote = null;
            }
            continue;
        }
        if (character === '/' && nextCharacter === '/') {
            lineComment = true;
            index++;
            continue;
        }
        if (character === '/' && nextCharacter === '*') {
            blockComment = true;
            index++;
            continue;
        }
        if (character === "'" || character === '"' || character === '`') {
            quote = character;
            continue;
        }
        if (character === '{') depth++;
        if (character === '}') {
            depth--;
            if (depth === 0) return source.slice(start, index + 1);
        }
    }

    assert.fail(`unterminated production helper ${name}`);
}

class FakeClock {
    constructor() {
        this.nextId = 1;
        this.intervals = new Map();
        this.timeouts = new Map();
    }

    setInterval(callback) {
        const id = this.nextId++;
        this.intervals.set(id, callback);
        return id;
    }

    clearInterval(id) {
        this.intervals.delete(id);
    }

    setTimeout(callback) {
        const id = this.nextId++;
        this.timeouts.set(id, callback);
        return id;
    }

    clearTimeout(id) {
        this.timeouts.delete(id);
    }

    runIntervals() {
        for (const callback of [...this.intervals.values()]) callback();
    }

    runTimeouts() {
        for (const callback of [...this.timeouts.values()]) callback();
    }
}

const NODE_FILTER = Object.freeze({
    SHOW_TEXT: 4,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2
});

function createRoot(text, options = {}) {
    const textNode = {
        nodeValue: String(text),
        parentElement: {
            closest() {
                return options.ignored ? {} : null;
            }
        }
    };
    const ownerDocument = {
        defaultView: { NodeFilter: NODE_FILTER },
        createTreeWalker(_root, _whatToShow, filter) {
            let visited = false;
            return {
                nextNode() {
                    if (visited) return null;
                    visited = true;
                    return filter.acceptNode(textNode) === NODE_FILTER.FILTER_ACCEPT
                        ? textNode
                        : null;
                }
            };
        }
    };
    return {
        nodeType: 1,
        ownerDocument,
        textNode,
        modern: Boolean(options.modern),
        rendered: Boolean(options.rendered)
    };
}

function createJQuery() {
    return function $(element) {
        const roots = Array.isArray(element) ? element : [element];
        return {
            get() {
                return roots;
            },
            find(selector) {
                const renderedOnly = selector === '.MathJax, .MathJax_Display';
                const length = roots.some((root) => renderedOnly
                    ? root?.rendered
                    : root?.modern || root?.rendered
                ) ? 1 : 0;
                return {
                    addBack() {
                        return { length };
                    }
                };
            }
        };
    };
}

function loadProductionApi(clock) {
    const helperNames = [
        'OJB_normalizeCodeforcesLatexDelimiters',
        'OJB_getTranslationLatexRegex',
        'containsUnrenderedCodeforcesLatex',
        'containsModernMathJax',
        'waitForMathJaxIdle'
    ];
    const formattingHelperStart = SOURCE.indexOf(
        'function OJB_protectMarkdownCodeForFormatting('
    );
    const formattingHelperEnd = SOURCE.indexOf(
        '\n\n// ------------------------------',
        formattingHelperStart
    );
    assert.notEqual(formattingHelperStart, -1, 'missing formatting code helper');
    assert.ok(formattingHelperEnd > formattingHelperStart,
        'missing formatting code helper end');
    const helperSources = helperNames.map(
        (name) => extractNamedFunction(SOURCE, name)
    );
    helperSources.push(SOURCE.slice(formattingHelperStart, formattingHelperEnd));
    const helpers = helperSources.join('\n');
    const context = vm.createContext({
        console: { warn() {} },
        document: createRoot('').ownerDocument,
        NodeFilter: NODE_FILTER,
        $: createJQuery(),
        setInterval: (callback) => clock.setInterval(callback),
        clearInterval: (id) => clock.clearInterval(id),
        setTimeout: (callback) => clock.setTimeout(callback),
        clearTimeout: (id) => clock.clearTimeout(id)
    });
    let nextId = 10000000;
    context.OJB_getRandomNumber = () => nextId++;

    vm.runInContext(`
        const OJB_UNRENDERED_LATEX_IGNORED_SELECTOR =
            "code, pre, kbd, samp, script, style, textarea, noscript, .MathJax, .MathJax_Display, .katex, .monaco-editor, .translateDiv, .html2md-panel, .mdViewContent";
        const OJB_MATHJAX_WAIT_TIMEOUT_MS = 10000;
        ${helpers}
        globalThis.__api = {
            normalize: OJB_normalizeCodeforcesLatexDelimiters,
            getLatexRegex: OJB_getTranslationLatexRegex,
            protectMarkdownCode: OJB_protectMarkdownCodeForFormatting,
            containsModernMathJax,
            containsUnrenderedCodeforcesLatex,
            waitForMathJaxIdle,
            setMathJax(value) { globalThis.MathJax = value; },
            clearMathJax() { delete globalThis.MathJax; }
        };
    `, context, { filename: SCRIPT_PATH });

    return context.__api;
}

async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

test('normalizes Codeforces inline and display formulas without touching code', () => {
    const api = loadProductionApi(new FakeClock());
    const markdown = [
        'The page is represented by $$$s$$$, and the answer is $$$0$$$.',
        '$$$$$$x + y$$$$$$',
        '`inline $$$literal$$$`',
        '`display $$$$$$literal$$$$$$`',
        '```text',
        'fenced $$$literal$$$',
        '```'
    ].join('\n');

    assert.equal(api.normalize(markdown), [
        'The page is represented by $s$, and the answer is $0$.',
        '$$x + y$$',
        '`inline $$$literal$$$`',
        '`display $$$$$$literal$$$$$$`',
        '```text',
        'fenced $$$literal$$$',
        '```'
    ].join('\n'));
});

test('leaves standard and non-Codeforces dollar runs unchanged', () => {
    const api = loadProductionApi(new FakeClock());
    const markdown = '$x$ $$y$$ $$$$literal$$$$';

    assert.equal(api.normalize(markdown), markdown);
    assert.equal(
        api.normalize('$$$inline$$$ and $$$$$$display$$$$$$'),
        '$inline$ and $$display$$'
    );
});

test('does not pair Codeforces formulas across a code span', () => {
    const api = loadProductionApi(new FakeClock());
    for (const markdown of [
        '$$$unclosed then `$$$in code$$$` tail',
        '$$$start `x $$$ close-in-code` tail',
        '$$$$$$unclosed then `$$$$$$in code$$$$$$` tail',
        '$$$$$$start `x $$$$$$ close-in-code` tail'
    ]) {
        assert.equal(api.normalize(markdown), markdown);
    }
});

test('protects only formulas after normalizing the exact problem markdown', () => {
    const api = loadProductionApi(new FakeClock());
    const source = [
        'The page is represented by a string $$$s$$$, where the character # denotes a line.',
        'Each second, Iskander erases $$$1$$$ centimeter from the right end.',
        'If there are no lines, the answer is $$$0$$$ seconds.'
    ].join('\n\n');
    const normalized = api.normalize(source);
    const matches = normalized.match(api.getLatexRegex(true));

    assert.deepEqual(Array.from(matches), ['$s$', '$1$', '$0$']);
    assert.match(normalized, /where the character # denotes a line/);
    assert.match(normalized, /Each second, Iskander erases/);
    assert.doesNotMatch(normalized, /\$\$\$/);
});

test('restores code exactly after dollar-sign formatting', () => {
    const api = loadProductionApi(new FakeClock());
    for (const [markdown, expected] of [
        ['$s$ `code` $t$', '$$$s$$$ `code` $$$t$$$'],
        ['$s$`code`$t$', '$$$s$$$`code`$$$t$$$'],
        ['$s$ `cost $5` $t$', '$$$s$$$ `cost $5` $$$t$$$'],
        ['$s$ `echo $$` $t$', '$$$s$$$ `echo $$` $$$t$$$'],
        ['$s$ `echo $&` $t$', '$$$s$$$ `echo $&` $$$t$$$'],
        ['$s$ ``echo $` literal`` $t$', '$$$s$$$ ``echo $` literal`` $$$t$$$'],
        ["$s$ `echo $'` $t$", "$$$s$$$ `echo $'` $$$t$$$"]
    ]) {
        const protectedCode = api.protectMarkdownCode(markdown);
        const formatted = protectedCode.text.replace(/\$/g, () => '$$$');
        const restored = protectedCode.recover(formatted);

        assert.doesNotMatch(restored, /OJBetterMarkdownCode\d+Slot/);
        assert.equal(restored, expected);
    }
});

test('recognizes unrendered Codeforces formulas as pending MathJax', () => {
    const api = loadProductionApi(new FakeClock());

    assert.equal(api.containsModernMathJax(createRoot('before $$$s$$$ after')), true);
    assert.equal(
        api.containsModernMathJax(createRoot('before $$$$$$s$$$$$$ after')),
        true
    );
    assert.equal(api.containsModernMathJax(createRoot('plain text')), false);
    assert.equal(
        api.containsModernMathJax(createRoot('code $$$literal$$$', { ignored: true })),
        false
    );
    assert.equal(api.containsModernMathJax(createRoot('$s$', { modern: true })), true);
});

test('waits until raw formulas disappear even when the queue is idle', async () => {
    const clock = new FakeClock();
    const api = loadProductionApi(clock);
    const root = createRoot('before $$$s$$$ after');
    api.setMathJax({ Hub: { queue: { pending: 0, running: 0 } } });

    let resolved = false;
    const waiting = api.waitForMathJaxIdle(root).then(() => {
        resolved = true;
    });
    await flushPromises();

    assert.equal(resolved, false);
    assert.equal(clock.intervals.size, 1);
    assert.equal(clock.timeouts.size, 1);

    clock.runIntervals();
    await flushPromises();
    assert.equal(resolved, false);

    root.textNode.nodeValue = 'before $s$ after';
    root.modern = true;
    clock.runIntervals();
    await waiting;

    assert.equal(resolved, true);
    assert.equal(clock.intervals.size, 0);
    assert.equal(clock.timeouts.size, 0);
});

test('waits for display-only raw formulas', async () => {
    const clock = new FakeClock();
    const api = loadProductionApi(clock);
    const root = createRoot('before $$$$$$s$$$$$$ after');
    api.setMathJax({ Hub: { queue: { pending: 0, running: 0 } } });

    let resolved = false;
    const waiting = api.waitForMathJaxIdle(root).then(() => {
        resolved = true;
    });
    clock.runIntervals();
    await flushPromises();
    assert.equal(resolved, false);

    root.textNode.nodeValue = 'before $$s$$ after';
    root.modern = true;
    clock.runIntervals();
    await waiting;

    assert.equal(resolved, true);
    assert.equal(clock.intervals.size, 0);
    assert.equal(clock.timeouts.size, 0);
});

test('returns immediately for plain text and fails open on timeout', async () => {
    const plainClock = new FakeClock();
    const plainApi = loadProductionApi(plainClock);
    await plainApi.waitForMathJaxIdle(createRoot('plain text'));
    assert.equal(plainClock.intervals.size, 0);
    assert.equal(plainClock.timeouts.size, 0);

    const timeoutClock = new FakeClock();
    const timeoutApi = loadProductionApi(timeoutClock);
    const waiting = timeoutApi.waitForMathJaxIdle(createRoot('$$$s$$$'));
    assert.equal(timeoutClock.intervals.size, 1);
    assert.equal(timeoutClock.timeouts.size, 1);

    timeoutClock.runTimeouts();
    await waiting;
    assert.equal(timeoutClock.intervals.size, 0);
    assert.equal(timeoutClock.timeouts.size, 0);
});

test('wires normalization into every Markdown translation-source entry point', () => {
    assert.match(
        SOURCE,
        /const newMarkdown = OJB_normalizeCodeforcesLatexDelimiters\(\s*OJBetter\.common\.turndownService\.turndown\(htmlContent\)/
    );
    assert.match(
        SOURCE,
        /text: OJB_normalizeCodeforcesLatexDelimiters\(\s*OJBetter\.common\.turndownService\.turndown\(sourceRoot\.html\(\) \|\| ""\)/
    );
    assert.match(
        SOURCE,
        /if \(translationSource\.format === "markdown"\) \{\s*text = OJB_normalizeCodeforcesLatexDelimiters\(text\)/
    );
    assert.match(
        SOURCE,
        /protectedMarkdownCode = OJB_protectMarkdownCodeForFormatting\(text\)/
    );
    assert.match(
        SOURCE,
        /protectedMarkdownCode\.recover\(text\)/
    );
});
