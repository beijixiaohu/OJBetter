const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../../../script/dev/atcoder-better.user.js'), 'utf8');
const start = source.indexOf('async function officialCompiler(code, input)');
const end = source.indexOf('// rextester编译器参数列表', start);
assert.ok(start >= 0 && end > start);
function harness(locks, request) {
    const context = vm.createContext({
        navigator: { locks }, URLSearchParams, officialLanguage: '5001',
        OJBetter: { common: { at_csrf_token: 'token', hostAddress: 'https://atcoder.jp' } },
        i18next: { t: key => key }, OJB_GMRequest: request,
        OJB_promiseRetryWrapper: async fn => fn(),
    });
    vm.runInContext(source.slice(start, end), context);
    return context;
}
function lockManager() {
    let tail = Promise.resolve();
    return { request(name, callback) {
        assert.equal(name, 'OJBetter:atcoder:official-custom-test');
        const task = tail.then(callback);
        tail = task.catch(() => {});
        return task;
    } };
}
test('two tabs keep each submission paired with its own output and language', async () => {
    let current;
    const events = [];
    const locks = lockManager();
    const request = async options => {
        if (options.method === 'POST') {
            current = options.data.get('sourceCode');
            events.push(`submit:${current}:${options.data.get('data.LanguageId')}`);
            await new Promise(resolve => setImmediate(resolve));
            return { status: 200 };
        }
        events.push(`read:${current}`);
        return { status: 200, response: JSON.stringify({ Result: { ExitCode: '0' }, Stdout: current, Stderr: '' }) };
    };
    const first = harness(locks, request), second = harness(locks, request);
    second.officialLanguage = '5002';
    const a = first.officialCompiler('first', '1');
    const b = second.officialCompiler('second', '2');
    second.officialLanguage = 'changed-while-waiting';
    const results = await Promise.all([a, b]);
    assert.equal(results[0].Result, 'first');
    assert.equal(results[1].Result, 'second');
    assert.deepEqual(events, ['submit:first:5001', 'read:first', 'submit:second:5002', 'read:second']);
});
test('failed submission releases queue for the next tab', async () => {
    const locks = lockManager();
    let requests = 0;
    const context = harness(locks, async () => { requests++; throw new Error('network failure'); });
    const results = await Promise.all([context.officialCompiler('a', ''), context.officialCompiler('b', '')]);
    assert.equal(requests, 2);
    assert.ok(results.every(result => result.Errors === 'network failure'));
});
test('missing cross-tab coordination fails without sending a submission', async () => {
    const context = harness(undefined, () => { assert.fail('must not submit'); });
    assert.match((await context.officialCompiler('a', '')).Errors, /Web Locks/);
});

test('Codeforces keeps concurrent verdict queries isolated by submission ID', async () => {
    const cf = fs.readFileSync(path.resolve(__dirname, '../../../../script/dev/codeforces-better.user.js'), 'utf8');
    const a = cf.indexOf('async function officialCompiler(code, input)');
    const b = cf.indexOf('// rextester编译器参数列表', a);
    const outputs = new Map();
    const context = vm.createContext({
        FormData, officialLanguage: '54',
        OJBetter: { common: { cf_csrf_token: 'token', hostAddress: 'https://codeforces.com' } },
        i18next: { t: key => key },
        OJB_promiseRetryWrapper: async (fn, options, id) => fn(id),
        OJB_GMRequest: async options => {
            const data = options.data;
            if (data.get('action') === 'submitSourceCode') {
                const id = String(outputs.size + 1);
                outputs.set(id, data.get('source'));
                await new Promise(resolve => setImmediate(resolve));
                return { status: 200, response: JSON.stringify({ customTestSubmitId: id }) };
            }
            return { status: 200, response: JSON.stringify({ stat: 'finished', verdict: 'OK', output: outputs.get(data.get('customTestSubmitId')) }) };
        },
    });
    assert.ok(a >= 0 && b > a);
    vm.runInContext(cf.slice(a, b), context);
    const result = await Promise.all([context.officialCompiler('first', ''), context.officialCompiler('second', '')]);
    assert.equal(result[0].Result, 'first');
    assert.equal(result[1].Result, 'second');
});

test('verdict polling failure also releases the lock for the next request', async () => {
    const locks = lockManager();
    let submits = 0;
    const context = harness(locks, async options => {
        if (options.method === 'POST') { submits++; return { status: 200 }; }
        throw new Error('poll failed');
    });
    const results = await Promise.all([context.officialCompiler('a', ''), context.officialCompiler('b', '')]);
    assert.equal(submits, 2);
    assert.ok(results.every(result => result.Errors === 'poll failed'));
});
