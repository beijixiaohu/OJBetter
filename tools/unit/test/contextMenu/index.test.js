const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../../../..');
const SCRIPT_CASES = [
    {
        name: 'Codeforces',
        path: path.join(ROOT, 'script/dev/codeforces-better.user.js')
    },
    {
        name: 'AtCoder',
        path: path.join(ROOT, 'script/dev/atcoder-better.user.js')
    }
];

const HOST_RECT = Object.freeze({
    left: 200,
    top: 100,
    right: 822,
    bottom: 622,
    width: 622,
    height: 522
});
const MENU_SIZE = Object.freeze({ width: 80, height: 96 });
const VIEWPORT = Object.freeze({ left: 0, top: 0, width: 1024, height: 768 });

function extractNamedFunction(source, name, scriptPath) {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);
    assert.notEqual(start, -1, `${scriptPath}: missing production helper ${name}`);

    const bodyStart = source.indexOf('{', start + marker.length);
    assert.notEqual(bodyStart, -1, `${scriptPath}: missing body for ${name}`);

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

    assert.fail(`${scriptPath}: unterminated production helper ${name}`);
}

function loadPositionHelper(scriptPath) {
    const source = fs.readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
    const helperSource = extractNamedFunction(
        source,
        'OJB_calculateContextMenuPosition',
        scriptPath
    );
    const context = vm.createContext({});

    vm.runInContext(
        `${helperSource}\n` +
        'globalThis.__contextMenuPosition = OJB_calculateContextMenuPosition;',
        context,
        { filename: scriptPath }
    );
    return context.__contextMenuPosition;
}

function createHost({ scrollLeft = 0, scrollTop = 0, rect = HOST_RECT } = {}) {
    return {
        clientLeft: 1,
        clientTop: 1,
        scrollLeft,
        scrollTop,
        getBoundingClientRect() {
            return { ...rect };
        }
    };
}

function normalizePosition(position) {
    return { left: position.left, top: position.top };
}

function projectToViewport(position, host) {
    const rect = host.getBoundingClientRect();
    return {
        left: rect.left + host.clientLeft + position.left - host.scrollLeft,
        top: rect.top + host.clientTop + position.top - host.scrollTop
    };
}

describe.each(SCRIPT_CASES)('$name configuration context menu', ({ path: scriptPath }) => {
    let calculatePosition;
    let source;

    beforeAll(() => {
        source = fs.readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
        calculatePosition = loadPositionHelper(scriptPath);
    });

    test('uses an absolute menu wired to the viewport-coordinate helper', () => {
        const handler = source.match(
            /\/\/ 添加右键菜单\s+li\.on\(["']contextmenu["'],[\s\S]*?\n\s*return li;/
        );

        assert.ok(handler, `${scriptPath}: missing configuration context-menu handler`);
        assert.match(
            source,
            /#config_bar_menu\s*\{[\s\S]*?position:\s*absolute;/,
            `${scriptPath}: context menu must use the settings dialog as its containing block`
        );
        assert.match(handler[0], /OJB_calculateContextMenuPosition\(/);
        assert.doesNotMatch(handler[0], /event\.page[XY]/);
    });

    test('uses client coordinates instead of page coordinates after window scrolling', () => {
        const atDocumentTop = calculatePosition(
            { clientX: 420, clientY: 260, pageX: 420, pageY: 260 },
            createHost(),
            MENU_SIZE,
            VIEWPORT
        );
        const afterWindowScroll = calculatePosition(
            { clientX: 420, clientY: 260, pageX: 420, pageY: 1060 },
            createHost(),
            MENU_SIZE,
            VIEWPORT
        );

        assert.deepEqual(normalizePosition(atDocumentTop), { left: 219, top: 159 });
        assert.deepEqual(normalizePosition(afterWindowScroll), { left: 219, top: 159 });
    });

    test('accounts for scrolling of the positioning host itself', () => {
        const event = { clientX: 420, clientY: 260, pageX: 420, pageY: 260 };
        const beforeHostScroll = calculatePosition(
            event,
            createHost(),
            MENU_SIZE,
            VIEWPORT
        );
        const afterHostScroll = calculatePosition(
            event,
            createHost({ scrollLeft: 40, scrollTop: 320 }),
            MENU_SIZE,
            VIEWPORT
        );

        assert.deepEqual(normalizePosition(beforeHostScroll), { left: 219, top: 159 });
        assert.deepEqual(normalizePosition(afterHostScroll), { left: 259, top: 479 });
    });

    test('keeps the viewport position stable after the settings dialog moves', () => {
        const event = { clientX: 420, clientY: 260, pageX: 420, pageY: 1060 };
        const originalHost = createHost();
        const movedHost = createHost({
            rect: {
                left: 300,
                top: 160,
                right: 922,
                bottom: 682,
                width: 622,
                height: 522
            }
        });
        const originalPosition = calculatePosition(
            event,
            originalHost,
            MENU_SIZE,
            VIEWPORT
        );
        const movedPosition = calculatePosition(
            event,
            movedHost,
            MENU_SIZE,
            VIEWPORT
        );

        assert.deepEqual(projectToViewport(originalPosition, originalHost), {
            left: 420,
            top: 260
        });
        assert.deepEqual(projectToViewport(movedPosition, movedHost), {
            left: 420,
            top: 260
        });
    });

    test('clamps against a visual viewport with non-zero offsets', () => {
        const position = calculatePosition(
            { clientX: 700, clientY: 600, pageX: 700, pageY: 1400 },
            createHost(),
            MENU_SIZE,
            { left: 120, top: 80, width: 500, height: 400 }
        );

        assert.deepEqual(normalizePosition(position), { left: 335, top: 279 });
    });

    test('clamps the menu inside the viewport at the bottom-right edge', () => {
        const position = calculatePosition(
            { clientX: 1000, clientY: 750, pageX: 1000, pageY: 1550 },
            createHost(),
            MENU_SIZE,
            VIEWPORT
        );

        assert.deepEqual(normalizePosition(position), { left: 739, top: 567 });
    });

    test('uses the current target bottom-left corner for a keyboard context menu', () => {
        const currentTarget = {
            getBoundingClientRect() {
                return {
                    left: 360,
                    top: 220,
                    right: 460,
                    bottom: 260,
                    width: 100,
                    height: 40
                };
            }
        };
        const position = calculatePosition(
            {
                clientX: 0,
                clientY: 0,
                pageX: 0,
                pageY: 800,
                currentTarget
            },
            createHost(),
            MENU_SIZE,
            VIEWPORT
        );

        assert.deepEqual(normalizePosition(position), { left: 159, top: 159 });
    });
});
