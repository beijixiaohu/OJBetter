// Node's built-in test runner exercises the production userscript helpers directly.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ATCODER_SCRIPT_PATH = path.resolve(
    __dirname,
    '../../../../script/dev/atcoder-better.user.js'
);
const CODEFORCES_SCRIPT_PATH = path.resolve(
    __dirname,
    '../../../../script/dev/codeforces-better.user.js'
);

function loadProductionHelpers(scriptPath) {
    const source = fs.readFileSync(scriptPath, 'utf8');
    const codecStartMarker = 'const OJB_PLACEHOLDER_TOKEN_PAIRS = Object.freeze({';
    const codecEndMarker = 'class OJB_GMError extends Error {';
    const migrationStartMarker = '// OJBLOCK 翻译缓存一次性迁移';
    const migrationCallMarker = 'initDB().then(() => OJB_migrateOjbBlockTranslationCache())';
    const startMarker = 'const OJB_REPLACE_ORIGINAL_PROTOCOL_VERSION';
    const endMarker = 'async function translateMain(';
    const codecStart = source.indexOf(codecStartMarker);
    const codecEnd = source.indexOf(codecEndMarker, codecStart);
    const migrationStart = source.lastIndexOf(migrationStartMarker);
    const migrationCall = source.indexOf(migrationCallMarker);
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);

    assert.notEqual(codecStart, -1, `missing production helper marker: ${codecStartMarker}`);
    assert.notEqual(codecEnd, -1, `missing production helper marker: ${codecEndMarker}`);
    assert.notEqual(migrationStart, -1, `missing production helper marker: ${migrationStartMarker}`);
    assert.notEqual(migrationCall, -1, `missing production helper marker: ${migrationCallMarker}`);
    assert.ok(migrationStart > migrationCall, 'OJBLOCK migration module must stay in the bottom migration section');
    assert.notEqual(start, -1, `missing production helper marker: ${startMarker}`);
    assert.notEqual(end, -1, `missing production helper marker: ${endMarker}`);

    const context = vm.createContext({
        console: { warn() {} },
        OJBetter: { translation: { replaceSymbol: "2" } },
        OJB_getRandomNumber: (() => {
            let nextId = 30000000;
            return () => nextId++;
        })()
    });
    vm.runInContext(
        `${source.slice(codecStart, codecEnd)}\n` +
        `${source.slice(start, end)}\n` +
        `${source.slice(migrationStart)}\n` +
        `globalThis.__replaceOriginalTestApi = {
            applyReplaceOriginalText: OJB_applyReplaceOriginalText,
            formatPlaceholderToken: OJB_formatPlaceholderToken,
            formatReplaceOriginalToken: OJB_formatReplaceOriginalToken,
            migrateOjbBlockTranslationCache: OJB_migrateOjbBlockTranslationCache,
            migrateOjbBlockTranslationResults: OJB_migrateOjbBlockTranslationResults,
            normalizePlaceholderTokenStyle: OJB_normalizePlaceholderTokenStyle,
            prepareReplaceOriginalState: OJB_prepareReplaceOriginalState,
            setMigrationTestEnvironment(environment) {
                OJBetter.common = { database: environment.database };
            },
            setReplaceSymbol(style) { OJBetter.translation.replaceSymbol = style; }
        };`,
        context,
        { filename: scriptPath }
    );
    return context.__replaceOriginalTestApi;
}

const atcoderHelpers = loadProductionHelpers(ATCODER_SCRIPT_PATH);
const {
    applyReplaceOriginalText,
    formatPlaceholderToken,
    formatReplaceOriginalToken,
    migrateOjbBlockTranslationResults,
    normalizePlaceholderTokenStyle,
    prepareReplaceOriginalState,
    setReplaceSymbol
} = atcoderHelpers;
const codeforcesHelpers = loadProductionHelpers(CODEFORCES_SCRIPT_PATH);
const codeforcesMigration = codeforcesHelpers.migrateOjbBlockTranslationResults;

class FakeNode {
    constructor(ownerDocument, nodeType) {
        this.ownerDocument = ownerDocument;
        this.nodeType = nodeType;
        this.parentNode = null;
        this.parentElement = null;
        this.isConnected = true;
    }
}

class FakeText extends FakeNode {
    constructor(ownerDocument, value) {
        super(ownerDocument, 3);
        this.value = String(value);
        this.failNextWrite = false;
    }

    get textContent() {
        return this.value;
    }

    set textContent(value) {
        if (this.failNextWrite) {
            this.failNextWrite = false;
            throw new Error('simulated scalar commit failure');
        }
        this.value = String(value);
    }

    get nodeValue() {
        return this.value;
    }

    set nodeValue(value) {
        this.textContent = value;
    }

    cloneNode() {
        return new FakeText(this.ownerDocument, this.value);
    }
}

class FakeFragment extends FakeNode {
    constructor(ownerDocument) {
        super(ownerDocument, 11);
        this.childNodes = [];
    }

    appendChild(node) {
        this.childNodes.push(node);
        node.parentNode = this;
        node.parentElement = null;
        return node;
    }
}

class FakeElement extends FakeNode {
    constructor(ownerDocument, tagName, children = []) {
        super(ownerDocument, 1);
        this.tagName = tagName.toUpperCase();
        this.childNodes = [];
        this.replaceChildren(...children);
    }

    replaceChildren(...nodes) {
        for (const child of this.childNodes) {
            child.parentNode = null;
            child.parentElement = null;
        }

        const children = [];
        for (const node of nodes) {
            if (node.nodeType === 11) {
                children.push(...node.childNodes);
                node.childNodes = [];
            } else {
                children.push(node);
            }
        }

        this.childNodes = children;
        for (const child of children) {
            child.parentNode = this;
            child.parentElement = this;
        }
    }

    get textContent() {
        return this.childNodes.map(node => node.textContent).join('');
    }

    set textContent(value) {
        this.replaceChildren(this.ownerDocument.createTextNode(value));
    }

    cloneNode(deep = false) {
        return new FakeElement(
            this.ownerDocument,
            this.tagName,
            deep ? this.childNodes.map(node => node.cloneNode(true)) : []
        );
    }

    closest() {
        return null;
    }
}

class FakeDocument {
    constructor() {
        this.defaultView = {
            NodeFilter: {
                SHOW_TEXT: 4,
                FILTER_ACCEPT: 1,
                FILTER_REJECT: 2
            }
        };
    }

    createDocumentFragment() {
        return new FakeFragment(this);
    }

    createTextNode(value) {
        return new FakeText(this, value);
    }

    createTreeWalker(root, _whatToShow, filter) {
        const textNodes = [];
        const visit = node => {
            for (const child of node.childNodes || []) {
                if (child.nodeType === 3) textNodes.push(child);
                else visit(child);
            }
        };
        visit(root);
        let index = 0;
        return {
            nextNode: () => {
                while (index < textNodes.length) {
                    const node = textNodes[index++];
                    if (filter.acceptNode(node) === this.defaultView.NodeFilter.FILTER_ACCEPT) return node;
                }
                return null;
            }
        };
    }
}

const IDS = Object.freeze({
    composite: '10000001',
    n: '20000001',
    k: '20000002',
    scalar: '10000002',
    terminal: '99999999'
});

function token(id, style = "2") {
    return formatPlaceholderToken(id, style);
}

function createReplaceOriginalFixture() {
    const document = new FakeDocument();
    const leading = document.createTextNode('  ');
    const n = new FakeElement(document, 'var', [document.createTextNode('n')]);
    const middle = document.createTextNode(' is a multiple of ');
    const k = new FakeElement(document, 'var', [document.createTextNode('K')]);
    const trailing = document.createTextNode('\n');
    const composite = new FakeElement(document, 'p', [leading, n, middle, k, trailing]);
    const originalChildren = Array.from(composite.childNodes);

    const scalar = document.createTextNode('\tThere are test cases.\n');
    const records = [
        {
            kind: 'composite',
            element: composite,
            node: composite,
            originalChildren,
            prefix: '  ',
            suffix: '\n',
            markerId: IDS.composite,
            slots: [
                { id: IDS.n, node: n, kind: 'element', tagName: 'var' },
                { id: IDS.k, node: k, kind: 'element', tagName: 'var' }
            ]
        },
        {
            kind: 'scalar',
            node: scalar,
            originalText: '\tThere are test cases.\n',
            prefix: '\t',
            suffix: '\n',
            text: 'There are test cases.',
            markerId: IDS.scalar,
            slots: []
        }
    ];

    const state = {
        version: 2,
        records,
        terminalId: IDS.terminal,
        applied: false,
        restore() {
            if (!this.applied) return;
            composite.replaceChildren(...originalChildren);
            scalar.textContent = records[1].originalText;
            this.applied = false;
        }
    };

    return {
        composite,
        originalChildren,
        scalar,
        state
    };
}

function validReplaceOriginalTranslation(style = "2") {
    return [
        token(IDS.composite, style),
        `${token(IDS.k, style)} 是 ${token(IDS.n, style)} 的倍数。`,
        '',
        token(IDS.scalar, style),
        '共给出若干测试用例。',
        '',
        token(IDS.terminal, style)
    ].join('\n');
}

function compositeSignature(element) {
    return element.childNodes.map(node => node.nodeType === 3
        ? `text:${JSON.stringify(node.textContent)}`
        : `${node.tagName.toLowerCase()}:${node.textContent}`
    );
}

function snapshotFixture(fixture) {
    return {
        composite: compositeSignature(fixture.composite),
        scalar: fixture.scalar.textContent,
        originalChildrenStillInstalled: fixture.composite.childNodes.every(
            (node, index) => node === fixture.originalChildren[index]
        )
    };
}

function assertRejectedAtomically(translatedText) {
    const fixture = createReplaceOriginalFixture();
    const before = snapshotFixture(fixture);
    const result = applyReplaceOriginalText(fixture.state, translatedText);

    assert.equal(result.applied, false);
    assert.equal(result.completed, false);
    assert.deepEqual(snapshotFixture(fixture), before);
    assert.equal(fixture.state.applied, false);
}

test('shared placeholder codec follows all configured styles and defaults to braces', () => {
    const expected = new Map([
        ["1", `【${IDS.n}】`],
        ["2", `{${IDS.n}}`],
        ["3", `[${IDS.n}]`]
    ]);

    for (const [style, formatted] of expected) {
        assert.equal(normalizePlaceholderTokenStyle(style), style);
        assert.equal(formatPlaceholderToken(IDS.n, style), formatted);
        setReplaceSymbol(style);
        assert.equal(formatReplaceOriginalToken(IDS.n), formatted);
    }

    assert.equal(normalizePlaceholderTokenStyle(undefined), "2");
    assert.equal(normalizePlaceholderTokenStyle("invalid"), "2");
    assert.equal(formatPlaceholderToken(IDS.n, "invalid"), `{${IDS.n}}`);
});

test('replace-original generation snapshots the setting and rejects incomplete schemas', () => {
    const document = new FakeDocument();
    const root = new FakeElement(document, 'div', [document.createTextNode('Translate this sentence.')]);
    const stylePatterns = new Map([
        ["1", /^【\d{8}】\nTranslate this sentence\.\n\n【\d{8}】$/],
        ["2", /^\{\d{8}\}\nTranslate this sentence\.\n\n\{\d{8}\}$/],
        ["3", /^\[\d{8}\]\nTranslate this sentence\.\n\n\[\d{8}\]$/]
    ]);
    const generatedStates = new Map();

    for (const [style, pattern] of stylePatterns) {
        setReplaceSymbol(style);
        const state = prepareReplaceOriginalState(root);
        generatedStates.set(style, state);
        assert.equal(state.tokenStyle, style);
        assert.equal(state.schema.tokenStyle, style);
        assert.match(state.raw, pattern);
    }

    const configuredState = generatedStates.get("1");
    setReplaceSymbol("3");
    const restoredConfiguredState = prepareReplaceOriginalState(root, "", configuredState.schema);
    assert.equal(restoredConfiguredState.tokenStyle, "1");
    assert.match(restoredConfiguredState.raw, /^【\d{8}】[\s\S]*【\d{8}】$/);

    const incompleteSchema = JSON.parse(JSON.stringify(configuredState.schema));
    delete incompleteSchema.tokenStyle;
    assert.equal(prepareReplaceOriginalState(root, "", incompleteSchema), null);

    setReplaceSymbol("2");
});

test('replace-original strict parser accepts every complete configured wrapper', async t => {
    for (const style of ["1", "2", "3"]) {
        await t.test(`style ${style}`, () => {
            const fixture = createReplaceOriginalFixture();
            const result = applyReplaceOriginalText(fixture.state, validReplaceOriginalTranslation(style));

            assert.equal(result.applied, true);
            assert.equal(result.completed, true);
            assert.equal(fixture.scalar.textContent, '\t共给出若干测试用例。\n');
        });
    }
});

test('replace-original remains compatible when a service normalizes or mixes wrapper styles', () => {
    const fixture = createReplaceOriginalFixture();
    const translated = [
        token(IDS.composite, "1"),
        `${token(IDS.k, "2")} 是 ${token(IDS.n, "3")} 的倍数。`,
        '',
        token(IDS.scalar, "3"),
        '共给出若干测试用例。',
        '',
        token(IDS.terminal, "1")
    ].join('\n');

    const result = applyReplaceOriginalText(fixture.state, translated);

    assert.equal(result.applied, true);
    assert.equal(result.completed, true);
    assert.deepEqual(compositeSignature(fixture.composite), [
        'text:"  "',
        'var:K',
        'text:" 是 "',
        'var:n',
        'text:" 的倍数。"',
        'text:"\\n"'
    ]);
});

test('replace-original applies scalar and composite records while allowing slots to reorder', () => {
    const fixture = createReplaceOriginalFixture();
    const result = applyReplaceOriginalText(fixture.state, validReplaceOriginalTranslation());

    assert.equal(result.applied, true);
    assert.equal(result.completed, true);
    assert.equal(fixture.state.applied, true);
    assert.deepEqual(compositeSignature(fixture.composite), [
        'text:"  "',
        'var:K',
        'text:" 是 "',
        'var:n',
        'text:" 的倍数。"',
        'text:"\\n"'
    ]);
    assert.equal(fixture.scalar.textContent, '\t共给出若干测试用例。\n');
});

test('replace-original keeps a grouped MathJax preview, render node, and source script together', () => {
    const document = new FakeDocument();
    const before = document.createTextNode('Formula: ');
    const preview = new FakeElement(document, 'span');
    const rendered = new FakeElement(document, 'span', [document.createTextNode('n')]);
    const source = new FakeElement(document, 'script', [document.createTextNode('n')]);
    const after = document.createTextNode('.');
    const element = new FakeElement(document, 'p', [before, preview, rendered, source, after]);
    const originalChildren = Array.from(element.childNodes);
    const state = {
        version: 2,
        terminalId: IDS.terminal,
        applied: false,
        records: [{
            kind: 'composite',
            element,
            originalChildren,
            prefix: '',
            suffix: '',
            markerId: IDS.composite,
            slots: [{
                id: IDS.n,
                node: preview,
                nodes: [preview, rendered, source],
                kind: 'group',
                tagName: 'span.MathJax_Preview+span.MathJax+script[math/tex]'
            }]
        }],
        restore() {
            if (!this.applied) return;
            element.replaceChildren(...originalChildren);
            this.applied = false;
        }
    };
    const translated = `${token(IDS.composite)}\n公式 ${token(IDS.n)}。\n\n${token(IDS.terminal)}`;

    const result = applyReplaceOriginalText(state, translated);

    assert.equal(result.completed, true);
    assert.deepEqual(compositeSignature(element), [
        'text:"公式 "',
        'span:',
        'span:n',
        'script:n',
        'text:"。"'
    ]);
    assert.equal(element.childNodes[1], preview);
    assert.equal(element.childNodes[2], rendered);
    assert.equal(element.childNodes[3], source);
    state.restore();
    assert.equal(element.childNodes.every((node, index) => node === originalChildren[index]), true);
});

test('replace-original rejects malformed structure before writing either DOM record', async t => {
    const valid = validReplaceOriginalTranslation();
    const malformedCases = {
        'missing slot': valid.replace(token(IDS.n), ''),
        'duplicate slot': valid.replace(token(IDS.k), `${token(IDS.k)} ${token(IDS.k)}`),
        'mismatched slot wrapper': valid.replace(token(IDS.n), `[${IDS.n}}`),
        'reverse mismatched slot wrapper': valid.replace(token(IDS.n), `{${IDS.n}]`),
        'incomplete record marker': valid.replace(token(IDS.scalar), `{${IDS.scalar}`),
        'incomplete square slot': valid.replace(token(IDS.n), `[${IDS.n}`),
        'reordered records': [
            token(IDS.scalar),
            '共给出若干测试用例。',
            '',
            token(IDS.composite),
            `${token(IDS.k)} 是 ${token(IDS.n)} 的倍数。`,
            '',
            token(IDS.terminal)
        ].join('\n'),
        'leading residual text': `DeepL prefix\n${valid}`,
        'trailing residual text': `${valid}\nDeepL tail`,
        'record marker moved inline': valid.replace(
            `\n\n${token(IDS.scalar)}`,
            ` moved text ${token(IDS.scalar)}`
        ),
        'punctuation appended to marker line': valid.replace(
            `${token(IDS.composite)}\n`,
            `${token(IDS.composite)}。\n`
        )
    };

    for (const [name, translatedText] of Object.entries(malformedCases)) {
        await t.test(name, () => assertRejectedAtomically(translatedText));
    }
});

test('replace-original allowPartial reports pending and never writes live DOM', () => {
    const fixture = createReplaceOriginalFixture();
    const before = snapshotFixture(fixture);
    const result = applyReplaceOriginalText(fixture.state, validReplaceOriginalTranslation(), true);

    assert.equal(result.applied, false);
    assert.equal(result.completed, false);
    assert.equal(result.pending, true);
    assert.deepEqual(snapshotFixture(fixture), before);
});

test('replace-original rolls back the composite record when the scalar commit throws', () => {
    const fixture = createReplaceOriginalFixture();
    const before = snapshotFixture(fixture);
    fixture.scalar.failNextWrite = true;

    const result = applyReplaceOriginalText(fixture.state, validReplaceOriginalTranslation());

    assert.equal(result.applied, false);
    assert.equal(result.completed, false);
    assert.equal(fixture.state.applied, false);
    assert.deepEqual(snapshotFixture(fixture), before);
});

function ojblockCacheBlock(index, body) {
    const id = String(index).padStart(4, '0');
    return `[[OJBLOCK_${id}]]\n${body}\n[[/OJBLOCK_${id}]]`;
}

function createOjbBlockCacheMigrationHarness(api, initialRecords) {
    let storedRecords = initialRecords;
    let bulkPutError = null;
    const bulkPutCalls = [];
    const transactionCalls = [];
    const table = {
        async get(url) {
            return storedRecords.find(record => record.url === url);
        },
        async toArray() {
            return storedRecords;
        },
        async bulkPut(records) {
            if (bulkPutError) throw bulkPutError;
            bulkPutCalls.push(records);
            const replacements = new Map(records.map(record => [record.url, record]));
            storedRecords = storedRecords.map(record => replacements.get(record.url) || record);
            records.forEach(record => {
                if (!storedRecords.some(storedRecord => storedRecord.url === record.url)) {
                    storedRecords.push(record);
                }
            });
        }
    };
    const database = {
        translateData: table,
        async transaction(mode, transactionTable, callback) {
            transactionCalls.push({ mode, table: transactionTable });
            return callback();
        }
    };

    api.setMigrationTestEnvironment({
        database
    });

    return {
        bulkPutCalls,
        transactionCalls,
        getStoredRecords: () => storedRecords,
        setBulkPutError: error => {
            bulkPutError = error;
        }
    };
}

test('OJBLOCK cache migration converts matching entries to plain text and is idempotent', async t => {
    const implementations = new Map([
        ['AtCoder', migrateOjbBlockTranslationResults],
        ['Codeforces', codeforcesMigration]
    ]);

    for (const [name, migrate] of implementations) {
        await t.test(name, () => {
            const empty = migrate(null);
            assert.equal(empty.migratedCount, 0);
            assert.deepEqual(Object.keys(empty.transResultMap), []);

            const ojblockEntryWithoutVersion = {
                replaceOriginal: true,
                text: `${ojblockCacheBlock(0, '第一段。')}\n\n${ojblockCacheBlock(1, '第二段。')}`,
                extraIgnoredSelector: ', .ignored'
            };
            const ojblockEntryWithVersionField = {
                version: 1,
                replaceOriginal: true,
                text: '［ ［ojblock_0000］ ］\n另一段。\n［ ［/ojblock_0000］ ］'
            };
            const ojblockEntryWithoutMarkers = {
                version: null,
                replaceOriginal: true,
                text: '标记已被翻译服务移除，但正文仍可保留。'
            };
            const ojblockEntryWithDamagedMarkers = {
                version: 1,
                replaceOriginal: true,
                text: '[[ojblock_0008]]]。\n第一行。\n\n\n第二行。\n / OJBLOCK_0008 ！'
            };
            const ojblockEmptyEntry = {
                version: 1,
                replaceOriginal: true,
                text: ojblockCacheBlock(0, '')
            };
            const structuredTokenEntry = {
                version: 2,
                replaceOriginal: true,
                text: '{10000001}\n当前协议正文\n\n{99999999}',
                displayText: '当前协议正文',
                schema: { tokenStyle: '2' }
            };
            const nonMatchingProtocolEntry = {
                version: 3,
                replaceOriginal: true,
                text: 'unrecognized payload'
            };
            const ordinaryObject = { replaceOriginal: false, text: '普通对象缓存' };
            const sourceMap = {
                plain: '普通译文，即使包含字面量 [[OJBLOCK_0000]] 也不能迁移。',
                ojblockEntryWithoutVersion,
                ojblockEntryWithVersionField,
                ojblockEntryWithoutMarkers,
                ojblockEntryWithDamagedMarkers,
                ojblockEmptyEntry,
                structuredTokenEntry,
                nonMatchingProtocolEntry,
                ordinaryObject
            };
            const sourceSnapshot = JSON.stringify(sourceMap);

            const first = migrate(sourceMap);

            assert.equal(first.migratedCount, 5);
            assert.notEqual(first.transResultMap, sourceMap);
            assert.deepEqual(Object.keys(first.transResultMap).sort(), Object.keys(sourceMap).sort());
            assert.equal(first.transResultMap.ojblockEntryWithoutVersion, '第一段。\n\n第二段。');
            assert.equal(first.transResultMap.ojblockEntryWithVersionField, '另一段。');
            assert.equal(first.transResultMap.ojblockEntryWithoutMarkers, '标记已被翻译服务移除，但正文仍可保留。');
            assert.equal(first.transResultMap.ojblockEntryWithDamagedMarkers, '第一行。\n\n\n第二行。');
            assert.equal(first.transResultMap.ojblockEmptyEntry, '');
            assert.equal(first.transResultMap.plain, sourceMap.plain);
            assert.equal(first.transResultMap.structuredTokenEntry, structuredTokenEntry);
            assert.equal(first.transResultMap.nonMatchingProtocolEntry, nonMatchingProtocolEntry);
            assert.equal(first.transResultMap.ordinaryObject, ordinaryObject);
            assert.equal(JSON.stringify(sourceMap), sourceSnapshot);

            const second = migrate(first.transResultMap);
            assert.equal(second.migratedCount, 0);
            assert.equal(second.transResultMap, first.transResultMap);
            assert.equal(JSON.stringify(second.transResultMap), JSON.stringify(first.transResultMap));
        });
    }
});

test('OJBLOCK cache migration scans the table once per database and retries after failure', async t => {
    const implementations = new Map([
        ['AtCoder', atcoderHelpers],
        ['Codeforces', codeforcesHelpers]
    ]);

    for (const [name, api] of implementations) {
        await t.test(name, async () => {
            const ojblockPayload = {
                replaceOriginal: true,
                text: ojblockCacheBlock(0, '缓存译文。')
            };
            const markerlessPayload = {
                version: 1,
                replaceOriginal: true,
                text: '行标记已被翻译服务删除。'
            };
            const structuredTokenEntry = {
                version: 2,
                replaceOriginal: true,
                text: '{10000001}\n结构化译文\n\n{99999999}',
                displayText: '结构化译文',
                schema: { tokenStyle: '2' }
            };
            const nonMatchingProtocolEntry = {
                version: 3,
                replaceOriginal: true,
                text: 'unrecognized payload'
            };
            const storedRecords = [
                {
                    url: 'https://example.test/problem-a',
                    nodeDate: [{ id: 'node-a' }],
                    retainedTopLevelField: 'keep me',
                    transResultMap: {
                        ojblock: ojblockPayload,
                        plain: '普通译文。',
                        structuredTokenEntry,
                        nonMatchingProtocolEntry
                    }
                },
                {
                    url: 'https://example.test/problem-b',
                    nodeDate: [{ id: 'node-b' }],
                    transResultMap: { markerless: markerlessPayload }
                },
                {
                    url: 'https://example.test/problem-c',
                    nodeDate: [{ id: 'node-c' }],
                    transResultMap: { plain: '无需迁移。' }
                }
            ];
            const sourceSnapshot = JSON.stringify(storedRecords);
            const harness = createOjbBlockCacheMigrationHarness(api, storedRecords);

            const migratedCount = await api.migrateOjbBlockTranslationCache();

            assert.equal(migratedCount, 2);
            assert.equal(harness.transactionCalls.length, 1);
            assert.equal(harness.transactionCalls[0].mode, 'rw');
            assert.equal(harness.bulkPutCalls.length, 1);
            assert.equal(harness.bulkPutCalls[0].length, 3);
            const migratedA = harness.getStoredRecords().find(record => record.url.endsWith('problem-a'));
            const migratedB = harness.getStoredRecords().find(record => record.url.endsWith('problem-b'));
            const untouchedC = harness.getStoredRecords().find(record => record.url.endsWith('problem-c'));
            assert.equal(migratedA.transResultMap.ojblock, '缓存译文。');
            assert.equal(migratedA.transResultMap.plain, '普通译文。');
            assert.equal(migratedA.transResultMap.structuredTokenEntry, structuredTokenEntry);
            assert.equal(migratedA.transResultMap.nonMatchingProtocolEntry, nonMatchingProtocolEntry);
            assert.equal(migratedA.retainedTopLevelField, 'keep me');
            assert.equal(migratedB.transResultMap.markerless, '行标记已被翻译服务删除。');
            assert.equal(untouchedC, storedRecords[2]);
            assert.equal(JSON.stringify(storedRecords), sourceSnapshot);

            const migrationMarkerUrl = '__ojbetter_migration__:ojblock_translation_cache';
            assert.ok(harness.getStoredRecords().some(record => record.url === migrationMarkerUrl));
            assert.equal(await api.migrateOjbBlockTranslationCache(), 0);
            assert.equal(harness.transactionCalls.length, 1);
            assert.equal(harness.bulkPutCalls.length, 1);

            const retryHarness = createOjbBlockCacheMigrationHarness(api, [{
                url: 'https://example.test/retry',
                nodeDate: [],
                transResultMap: { ojblock: ojblockPayload }
            }]);
            retryHarness.setBulkPutError(new Error('simulated bulkPut failure'));

            await assert.rejects(api.migrateOjbBlockTranslationCache(), /simulated bulkPut failure/);
            assert.equal(retryHarness.getStoredRecords().some(record => record.url === migrationMarkerUrl), false);
            retryHarness.setBulkPutError(null);
            assert.equal(await api.migrateOjbBlockTranslationCache(), 1);
            assert.equal(retryHarness.transactionCalls.length, 2);
            assert.ok(retryHarness.getStoredRecords().some(record => record.url === migrationMarkerUrl));
        });
    }
});

test('replace-original apply path rejects a state with a mismatched protocol version without touching DOM', () => {
    const fixture = createReplaceOriginalFixture();
    const before = snapshotFixture(fixture);
    fixture.state.version = 1;

    const result = applyReplaceOriginalText(fixture.state, validReplaceOriginalTranslation());

    assert.equal(result.applied, false);
    assert.equal(result.completed, false);
    assert.deepEqual(snapshotFixture(fixture), before);
});
