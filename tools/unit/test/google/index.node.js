const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

for (const platform of ['codeforces', 'atcoder']) {
    const source = fs.readFileSync(path.resolve(__dirname, `../../../../script/dev/${platform}-better.user.js`), 'utf8');
    async function translate(response, raw = 'Hello world') {
        const context = vm.createContext({
            URLSearchParams,
            console: { warn() {} },
            i18next: { t: key => key },
            getTargetLanguage: () => 'zh-CN',
            OJB_GMRequest: async options => {
                const url = new URL(options.url);
                assert.equal(options.method, 'GET');
                assert.equal(url.origin + url.pathname, 'https://translate.googleapis.com/translate_a/single');
                for (const [key, value] of Object.entries({ client: 'gtx', sl: 'auto', tl: 'zh-CN', dt: 't', q: raw })) {
                    assert.equal(url.searchParams.get(key), value);
                }
                return typeof response === 'function' ? response(options) : response;
            },
        });
        for (const [startMarker, endMarker] of [
            ['async function OJB_promiseRetryWrapper(', 'function OJB_GMRequest('],
            ['async function BaseTranslate(', '/**\n * 查询服务余额'],
            ['async function translate_gg(raw)', '/**'],
        ]) {
            const start = source.indexOf(startMarker);
            const end = source.indexOf(endMarker, start + startMarker.length);
            assert.ok(start >= 0 && end > start);
            vm.runInContext(source.slice(start, end), context);
        }
        return context.translate_gg(raw);
    }
    test(`${platform}: joins JSON segments without damaging whitespace or literal entities`, async () => {
        const result = await translate({ status: 200, responseText: JSON.stringify([[['你好 &amp; 世界\n', 'Hello'], ['公式 $a < b$。', 'formula']]]) }, 'Hello & ? # +\n公式 $a < b$');
        assert.equal(result.done, true);
        assert.equal(result.text, '你好 &amp; 世界\n公式 $a < b$。');
        assert.match(source, /@connect\s+translate\.googleapis\.com/);
    });
    for (const [name, status, responseText, error] of [
        ['rate limit', 429, '<html>Unusual traffic</html>', /HTTP 429/],
        ['server error', 503, '', /HTTP 503/],
        ['verification page', 200, '<html>Verify you are human</html>', /JSON|Unexpected token/],
        ['error object', 200, '{"error":"denied"}', /invalid translation/],
        ['missing segments', 200, '[null]', /invalid translation/],
        ['empty segments', 200, '[[]]', /invalid translation/],
        ['malformed segment', 200, '[[[null]]]', /invalid translation/],
        ['partially malformed segments', 200, '[[["valid"],[null]]]', /invalid translation/],
        ['empty result', 200, '[[[" "]]]', /no translation/],
    ]) {
        test(`${platform}: reports ${name} instead of success`, async () => {
            const result = await translate({ status, responseText });
            assert.equal(result.done, false);
            assert.match(result.error.message, error);
            assert.ok(result.message);
        });
    }
    test(`${platform}: reports network failure`, async () => {
        const result = await translate(async () => { throw new Error('Network failure'); });
        assert.equal(result.done, false);
        assert.equal(result.error.source, 'GMRequest');
    });
}
