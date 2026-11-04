const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../../../..');

function success(text) {
    return {
        status: 200,
        responseText: JSON.stringify({ translations: [{ text, detected_source_language: 'en' }] })
    };
}

for (const platform of ['codeforces', 'atcoder']) {
    const source = fs.readFileSync(path.join(ROOT, `script/dev/${platform}-better.user.js`), 'utf8');
    function createHarness(implementation = options => success(JSON.parse(options.data).text[0]), language = 'ZH') {
        const requests = [];
        const context = vm.createContext({
            console: { warn() {} },
            i18next: { t: key => key },
            getTargetLanguage: () => language,
            OJB_GMRequest: async options => {
                requests.push(options);
                return implementation(options, requests.length);
            }
        });
        for (const [startMarker, endMarker] of [
            ['async function OJB_promiseRetryWrapper(', 'function OJB_GMRequest('],
            ['async function BaseTranslate(', '/**\n * 查询服务余额'],
            ['async function translate_deepl(raw)', '/**']
        ]) {
            const start = source.indexOf(startMarker);
            const end = source.indexOf(endMarker, start + startMarker.length);
            assert.ok(start >= 0 && end > start, `${platform}: missing ${startMarker}`);
            vm.runInContext(source.slice(start, end), context);
        }
        return { translate: raw => context.translate_deepl(raw), requests };
    }

    test(`${platform}: translates through anonymous oneshot with the new response schema`, async () => {
        const harness = createHarness(() => success('输出两个整数的和。'));
        const result = await harness.translate('Print the sum of two integers.');
        assert.equal(result.done, true);
        assert.equal(result.text, '输出两个整数的和。');
        assert.equal(harness.requests.length, 1);
        const options = harness.requests[0];
        assert.equal(options.url, 'https://oneshot-free.www.deepl.com/v1/translate');
        assert.equal(options.method, 'POST');
        assert.deepEqual(JSON.parse(options.data), {
            text: ['Print the sum of two integers.'],
            target_lang: 'zh-Hans'
        });
        assert.equal(options.headers.Authorization, 'None');
        assert.equal(options.headers['Content-Type'], 'application/json');
        assert.equal(options.anonymous, true);
        assert.equal(options.timeout, 30000);
        assert.match(source, /@connect\s+oneshot-free\.www\.deepl\.com/);
    });

    for (const [input, expected] of [
        ['ZH', 'zh-Hans'], ['EN', 'en-US'], ['PT', 'pt-BR'],
        ['DE', 'DE'], ['JA', 'JA'], ['FR', 'FR'], ['KO', 'KO'],
        ['ES', 'ES'], ['IT', 'IT'], ['ZH-HANT', 'ZH-HANT'], ['EN-GB', 'EN-GB']
    ]) {
        test(`${platform}: preserves target language ${input}`, async () => {
            const harness = createHarness(undefined, input);
            assert.equal((await harness.translate('source')).done, true);
            assert.equal(JSON.parse(harness.requests[0].data).target_lang, expected);
        });
    }

    test(`${platform}: preserves surrounding whitespace, formulas and literal entities`, async () => {
        const harness = createHarness(() => success('公式 {12345678} 和代码 [87654321] &amp; &lt;。\n第二行。'));
        const result = await harness.translate(' \n\tFormula {12345678} and code [87654321].\nSecond line.\n\n ');
        assert.equal(result.done, true);
        assert.equal(result.text, ' \n\t公式 {12345678} 和代码 [87654321] &amp; &lt;。\n第二行。\n\n ');
    });

    test(`${platform}: splits long input within the upstream limit and joins in order`, async () => {
        const raw = 'first paragraph.\n\n' + 'second sentence. '.repeat(250) + '\nlast paragraph.\n';
        let active = 0;
        const harness = createHarness(async options => {
            active++;
            assert.equal(active, 1, 'chunks must be sent sequentially');
            await Promise.resolve();
            const content = JSON.parse(options.data).text[0];
            assert.ok(content.length <= 1500);
            active--;
            return success(content.toUpperCase());
        });
        const result = await harness.translate(raw);
        assert.equal(result.done, true);
        assert.equal(result.text, raw.toUpperCase());
        assert.ok(harness.requests.length > 1);
    });

    for (const raw of [
        'x'.repeat(1500),
        'x'.repeat(1501),
        'x'.repeat(1499) + '😀' + 'y'.repeat(1600),
        '😀'.repeat(1600),
        ...['{12345678}', '[12345678]', '【12345678】', '\\[12345678\\]', '{ 12345678 }']
            .map(token => 'x'.repeat(1497) + token + 'y'.repeat(1600))
    ]) {
        test(`${platform}: preserves characters and complete tokens at a ${raw.length}-unit boundary (${raw.slice(1497, 1512)})`, async () => {
            const harness = createHarness();
            const result = await harness.translate(raw);
            assert.equal(result.done, true);
            assert.equal(result.text, raw);
            for (const options of harness.requests) {
                const content = JSON.parse(options.data).text[0];
                assert.ok(content.length <= 1500);
                assert.doesNotMatch(content, /^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/);
            }
            for (const token of raw.match(/(?:【\d+】|\\?\[\d+\\?\]|\{\s*\d+\s*\})/g) || []) {
                assert.ok(harness.requests.some(options => JSON.parse(options.data).text[0].includes(token)));
            }
        });
    }

    for (const raw of ['', ' \n\t', '\n'.repeat(3500)]) {
        test(`${platform}: returns blank input without network requests (${raw.length} units)`, async () => {
            const harness = createHarness();
            const result = await harness.translate(raw);
            assert.equal(result.done, true);
            assert.equal(result.text, raw);
            assert.equal(harness.requests.length, 0);
        });
    }

    for (const [name, responseText] of [
        ['legacy upgrade banner', JSON.stringify({
            result: { texts: [{ text: "You're using an older version of DeepL." }] }
        })],
        ['JSON-RPC error', '{"error":{"message":"Too many requests"}}'],
        ['oneshot error object', '{"title":"OutdatedClient","detail":"Update required"}'],
        ['missing translations', '{}'],
        ['empty translations', '{"translations":[]}'],
        ['wrong translation count', '{"translations":[{"text":"first"},{"text":"second"}]}'],
        ['null translation', '{"translations":[null]}'],
        ['non-string translation', '{"translations":[{"text":42}]}'],
        ['empty translation', '{"translations":[{"text":" \\n"}]}'],
        ['invalid JSON', '<html>Bad Gateway</html>'],
        ['null JSON', 'null']
    ]) {
        test(`${platform}: rejects ${name} instead of returning it as a translation`, async () => {
            const harness = createHarness(() => ({ status: 200, responseText }));
            const result = await harness.translate('source text');
            assert.equal(result.done, false);
            assert.equal(result.text, '');
            assert.ok(result.error.message);
            assert.ok(result.message);
        });
    }

    for (const status of [0, 400, 403, 429, 503]) {
        test(`${platform}: stops on HTTP ${status} without immediately retrying`, async () => {
            const harness = createHarness(() => ({ ...success('must not be accepted'), status }));
            const result = await harness.translate('source text');
            assert.equal(result.done, false);
            assert.equal(result.text, '');
            assert.equal(result.message, status === 429 ? 'error.deepl429' : `DeepL request failed: HTTP ${status}`);
            assert.equal(harness.requests.length, 1);
        });
    }

    test(`${platform}: discards partial translations and stops after a later chunk fails`, async () => {
        const harness = createHarness((options, count) => count === 1
            ? success('first chunk translated')
            : { status: 429, responseText: '' });
        const result = await harness.translate('source text '.repeat(500));
        assert.equal(result.done, false);
        assert.equal(result.text, '');
        assert.equal(result.message, 'error.deepl429');
        assert.equal(harness.requests.length, 2);
    });

    test(`${platform}: reports network failure without returning partial text`, async () => {
        const harness = createHarness(() => { throw new Error('Network failure'); });
        const result = await harness.translate('source text');
        assert.equal(result.done, false);
        assert.equal(result.text, '');
        assert.equal(result.error.source, 'GMRequest');
    });
}
