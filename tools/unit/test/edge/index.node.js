const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
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

function createEdgeHarness(scriptCase) {
    const source = fs.readFileSync(scriptCase.path, 'utf8').replace(/\r\n/g, '\n');
    const startMarker = 'class EdgeTranslator {';
    const endMarker = '// 实例化全局的 Edge 翻译器';
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);
    const retryStart = source.indexOf('async function OJB_promiseRetryWrapper(');
    const retryEnd = source.indexOf('function OJB_GMRequest(', retryStart);
    const baseTranslateStart = source.indexOf('async function BaseTranslate(');
    const baseTranslateEnd = source.indexOf('/**\n * 查询服务余额', baseTranslateStart);

    assert.notEqual(start, -1, `${scriptCase.name}: EdgeTranslator start not found`);
    assert.ok(end > start, `${scriptCase.name}: EdgeTranslator end not found`);
    assert.notEqual(retryStart, -1, `${scriptCase.name}: retry helper start not found`);
    assert.ok(retryEnd > retryStart, `${scriptCase.name}: retry helper end not found`);
    assert.notEqual(
        baseTranslateStart,
        -1,
        `${scriptCase.name}: BaseTranslate start not found`
    );
    assert.ok(
        baseTranslateEnd > baseTranslateStart,
        `${scriptCase.name}: BaseTranslate end not found`
    );

    const requests = [];
    let requestImplementation = async () => {
        throw new Error('No request implementation configured');
    };

    const request = async (options) => {
        requests.push(options);
        return requestImplementation(options);
    };

    const context = vm.createContext({
        console: { warn() {} },
        i18next: { t: (key) => key },
        OJB_GMRequest: request
    });
    vm.runInContext(
        `${source.slice(retryStart, retryEnd)}\n` +
        `${source.slice(baseTranslateStart, baseTranslateEnd)}\n` +
        `${source.slice(start, end)}\n` +
        'globalThis.__EdgeTranslator = EdgeTranslator;',
        context,
        { filename: scriptCase.path }
    );

    return {
        createTranslator: () => new context.__EdgeTranslator(),
        requests,
        setRequestImplementation(implementation) {
            requestImplementation = implementation;
        }
    };
}

function successResponse(text) {
    return {
        status: 200,
        statusText: 'OK',
        responseText: JSON.stringify([
            { translations: [{ text, to: 'zh-Hans' }] }
        ])
    };
}

for (const scriptCase of SCRIPT_CASES) {
    test(`${scriptCase.name}: caches a validated Edge token`, async () => {
        const harness = createEdgeHarness(scriptCase);
        harness.setRequestImplementation(async () => ({
            status: 200,
            responseText: '  test-token  '
        }));
        const translator = harness.createTranslator();

        assert.equal(await translator.getToken(), 'test-token');
        assert.equal(await translator.getToken(), 'test-token');
        assert.equal(harness.requests.length, 1);
        assert.equal(harness.requests[0].timeout, 30000);
    });

    test(`${scriptCase.name}: normalizes token network errors to strings`, async () => {
        const harness = createEdgeHarness(scriptCase);
        harness.setRequestImplementation(async () => {
            throw { error: 'DNS failure', status: 0 };
        });
        const result = await harness.createTranslator()._doTranslate(
            'source text',
            'zh-Hans'
        );

        assert.equal(result.done, false);
        assert.equal(result.text, 'source text');
        assert.equal(result.message, 'DNS failure');
        assert.equal(typeof result.message, 'string');
    });

    test(`${scriptCase.name}: accepts only a valid Edge translation schema`, async () => {
        const harness = createEdgeHarness(scriptCase);
        harness.setRequestImplementation(async (options) => {
            if (options.url.includes('/translate/auth')) {
                return { status: 200, responseText: 'test-token' };
            }
            return successResponse('The literal "error" remains valid.');
        });
        const result = await harness.createTranslator()._doTranslate(
            'source text',
            'zh-Hans'
        );

        assert.equal(result.done, true);
        assert.equal(result.text, 'The literal "error" remains valid.');
        assert.equal(harness.requests[1].timeout, 30000);
    });

    test(`${scriptCase.name}: rejects non-success HTTP responses`, async () => {
        const harness = createEdgeHarness(scriptCase);
        harness.setRequestImplementation(async (options) => {
            if (options.url.includes('/translate/auth')) {
                return { status: 200, responseText: 'test-token' };
            }
            return {
                ...successResponse('must not be accepted'),
                status: 502,
                statusText: 'Bad Gateway'
            };
        });
        const result = await harness.createTranslator()._doTranslate(
            'source text',
            'zh-Hans'
        );

        assert.equal(result.done, false);
        assert.equal(typeof result.message, 'string');
        assert.equal(harness.requests.length, 4);
    });

    test(`${scriptCase.name}: rejects invalid JSON and missing translation data`, async (t) => {
        for (const [label, responseText] of [
            ['invalid JSON', '<html>Bad Gateway</html>'],
            ['missing schema', JSON.stringify([])]
        ]) {
            await t.test(label, async () => {
                const harness = createEdgeHarness(scriptCase);
                harness.setRequestImplementation(async (options) => {
                    if (options.url.includes('/translate/auth')) {
                        return { status: 200, responseText: 'test-token' };
                    }
                    return { status: 200, statusText: 'OK', responseText };
                });
                const result = await harness.createTranslator()._doTranslate(
                    'source text',
                    'zh-Hans'
                );

                assert.equal(result.done, false);
                assert.equal(typeof result.message, 'string');
                assert.equal(harness.requests.length, 4);
            });
        }
    });

    test(`${scriptCase.name}: clears a rejected Edge token`, async () => {
        const harness = createEdgeHarness(scriptCase);
        harness.setRequestImplementation(async (options) => {
            if (options.url.includes('/translate/auth')) {
                return { status: 200, responseText: 'expired-token' };
            }
            return {
                status: 401,
                statusText: 'Unauthorized',
                responseText: JSON.stringify({
                    error: { code: 401000, message: 'Token expired' }
                })
            };
        });
        const translator = harness.createTranslator();
        const result = await translator._doTranslate('source text', 'zh-Hans');

        assert.equal(result.done, false);
        assert.equal(typeof result.message, 'string');
        assert.equal(translator.cachedToken, null);
        assert.equal(translator.tokenExpireTime, 0);
        assert.equal(harness.requests.length, 4);
    });

    test(`${scriptCase.name}: rejects an HTTP 200 Edge error payload`, async () => {
        const harness = createEdgeHarness(scriptCase);
        harness.setRequestImplementation(async (options) => {
            if (options.url.includes('/translate/auth')) {
                return { status: 200, responseText: 'expired-token' };
            }
            return {
                status: 200,
                statusText: 'OK',
                responseText: JSON.stringify({
                    error: { code: 401000, message: 'Token expired' }
                })
            };
        });
        const translator = harness.createTranslator();
        const result = await translator._doTranslate('source text', 'zh-Hans');

        assert.equal(result.done, false);
        assert.equal(typeof result.message, 'string');
        assert.equal(translator.cachedToken, null);
        assert.equal(translator.tokenExpireTime, 0);
        assert.equal(harness.requests.length, 4);
    });
}
