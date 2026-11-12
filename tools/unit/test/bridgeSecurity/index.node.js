const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../../../..');

function bridgeInfo(workspaceRoot = 'D:/工具/OJBetter_Bridge/workspaces') {
    return {
        type: 'info', bridge: 'OJBetter_Bridge', version: '1.0.0',
        protocolVersion: 1, capabilities: ['workspace-info'],
        workspaceRoot, languages: ['cpp', 'python'],
    };
}

// Stable scripts are updated only by the release promotion workflow.
const channel = 'dev';
for (const platform of ['codeforces', 'atcoder']) {
    const source = fs.readFileSync(path.join(ROOT, `script/${channel}/${platform}-better.user.js`), 'utf8');
    const start = source.indexOf('function OJB_createBridgeSocket(');
    const end = source.indexOf('async function createMonacoEditor(', start);
    assert.ok(start >= 0 && end > start);
    const requests = [];
    const context = vm.createContext({
        URL,
        WebSocket: function (url, protocols) {
            requests.push({ url, protocols });
        }
    });
    vm.runInContext(source.slice(start, end), context);
    const connect = context.OJB_createBridgeSocket;

    function discoveryRuntime(reply, stored = {}, options = {}) {
        const values = new Map(Object.entries(stored));
        const writes = [];
        const sockets = [];
        class Socket {
            constructor(url) {
                this.url = url;
                sockets.push(this);
                queueMicrotask(() => {
                    if (options.noOpen) return;
                    this.onopen?.();
                    if (options.disconnect) this.onclose?.();
                });
            }
            send(message) {
                this.sent = JSON.parse(message);
                if (options.noReply) return;
                queueMicrotask(() => this.onmessage?.({
                    data: typeof reply === 'string' ? reply : JSON.stringify(reply),
                }));
            }
            close() { this.closed = true; }
        }
        const runtime = vm.createContext({
            URL, WebSocket: Socket, setTimeout, clearTimeout,
            GM_getValue: key => values.get(key),
            GM_setValue: (key, value) => { writes.push([key, value]); values.set(key, value); },
        });
        vm.runInContext(source.slice(start, end), runtime);
        return { runtime, values, writes, sockets };
    }

    test(`${platform}/${channel}: both sockets connect without credentials or subprotocols`, () => {
        requests.length = 0;
        for (const endpoint of ['cpp', 'python', 'java', 'file']) {
            connect('ws://127.0.0.1:2323/', endpoint);
            const request = requests.at(-1);
            assert.equal(request.url, `ws://127.0.0.1:2323/${endpoint}`);
            assert.equal(request.protocols, undefined);
        }
        assert.match(source, /OJB_createBridgeSocket\(url, language\)/);
        assert.match(source, /OJB_createBridgeSocket\(url, "file"\)/);
        assert.doesNotMatch(source, /new WebSocket\(url \+/);
    });

    test(`${platform}/${channel}: rejects remote addresses and invalid endpoints before opening any socket`, () => {
        requests.length = 0;
        for (const url of [
            'ws://evil.example:2323/', 'ws://127.0.0.1.evil.example:2323/',
            'ws://127.0.0.1@evil.example:2323/', 'https://127.0.0.1:2323/',
            'ws://0.0.0.0:2323/', 'ws://192.168.1.1:2323/',
            'ws://127.0.0.1:2323/?query=value', 'ws://127.0.0.1:2323/#fragment',
            'ws://user:pass@127.0.0.1:2323/', 'ws://127.0.0.1:2323/other/',
        ]) {
            assert.throws(() => connect(url, 'file'));
        }
        assert.throws(() => connect('ws://127.0.0.1:2323/', '../config.yml'));
        assert.equal(requests.length, 0);
    });

    test(`${platform}/${channel}: supports localhost and IPv6 loopback`, () => {
        requests.length = 0;
        for (const url of ['ws://localhost:2323/', 'ws://[::1]:2323/', 'wss://localhost:2323/']) {
            connect(url, 'file');
            assert.equal(requests.at(-1).url, url + 'file');
        }
    });

    test(`${platform}/${channel}: source paths stay wired without a pairing setting`, () => {
        assert.doesNotMatch(source, /OJBetter_Bridge_Token|bridgeToken|ojbetter-token|\.bridge-token/);
        assert.match(source, /C:\/OJBetter_Bridge\/workspaces/);
        assert.doesNotMatch(source, /"file:\/\/\/" \+ OJBetter\.monaco\.lsp\.workUri \+ workspace/);
        assert.match(source, /monaco\.Uri\.file\(rootUri\)\.toString\(\)/);
    });

    test(`${platform}/${channel}: detects the bridge before building the editor model and opening language sockets`, () => {
        const editorStart = source.indexOf('async function createMonacoEditor(');
        const detect = source.indexOf('await OJB_detectBridge(', editorStart);
        const migrate = source.indexOf('OJB_migrateBridgeWorkspace(bridgeInfo)', detect);
        const root = source.indexOf('var rootUri =', editorStart);
        const model = source.indexOf('monaco.editor.createModel(', editorStart);
        const language = source.indexOf('OJB_createBridgeSocket(url, language)', editorStart);
        assert.equal((source.match(/await OJB_detectBridge\(/g) || []).length, 1);
        assert.ok(detect > editorStart && migrate > detect && root > migrate && model > root && language > model);
        assert.match(source.slice(editorStart, detect), /if \(support && OJBetter\.monaco\.lsp\.enabled\)/);
        assert.match(source.slice(model, language), /if \(bridgeDetectionError\)[\s\S]*?return;/);
    });

    test(`${platform}/${channel}: discovers a custom path, backs up old settings and migrates only once`, async () => {
        const { runtime, values, writes, sockets } = discoveryRuntime(
            bridgeInfo(), { OJBetter_Bridge_WorkUri: 'C:/旧目录/Bridge' });
        const info = await runtime.OJB_detectBridge('ws://127.0.0.1:2323/', 100);
        assert.equal(sockets[0].sent.type, 'info');
        assert.deepEqual(Object.keys(sockets[0].sent), ['type']);
        assert.equal(sockets[0].closed, true);
        assert.equal(writes.length, 0);
        assert.equal(runtime.OJB_migrateBridgeWorkspace(info), 'D:/工具/OJBetter_Bridge/workspaces');
        assert.equal(values.get('OJBetter_Bridge_WorkUri_Backup'), 'C:/旧目录/Bridge');
        assert.equal(values.get('OJBetter_Bridge_WorkUri'), info.workspaceRoot);
        runtime.OJB_migrateBridgeWorkspace(info);
        assert.equal(writes.length, 2);
        runtime.OJB_migrateBridgeWorkspace(bridgeInfo('E:/移动后的目录/workspaces'));
        assert.equal(values.get('OJBetter_Bridge_WorkUri_Backup'), 'C:/旧目录/Bridge');
        assert.equal(values.get('OJBetter_Bridge_WorkUri'), 'E:/移动后的目录/workspaces');
    });

    test(`${platform}/${channel}: handles clean installs, already migrated paths and POSIX or UNC roots`, () => {
        for (const path of [
            'C:\\Users\\Test User\\Bridge\\workspaces\\',
            '/Users/test/Bridge/workspaces', '//server/share/Bridge/workspaces',
        ]) {
            const { runtime, values } = discoveryRuntime();
            const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
            assert.equal(runtime.OJB_migrateBridgeWorkspace(bridgeInfo(path)), normalized);
            assert.equal(values.get('OJBetter_Bridge_WorkUri'), normalized);
            assert.equal(values.has('OJBetter_Bridge_WorkUri_Backup'), false);
        }
        const { runtime, writes } = discoveryRuntime(bridgeInfo(), {
            OJBetter_Bridge_WorkUri: bridgeInfo().workspaceRoot,
        });
        runtime.OJB_migrateBridgeWorkspace(bridgeInfo());
        assert.equal(writes.length, 0);
    });

    test(`${platform}/${channel}: identifies explicit legacy responses without changing settings`, async () => {
        const { runtime, values, writes, sockets } = discoveryRuntime(
            { result: 'error', description: 'no such type' },
            { OJBetter_Bridge_WorkUri: 'C:/Bridge' });
        await assert.rejects(runtime.OJB_detectBridge('ws://127.0.0.1:2323/', 100), /旧版 Bridge/);
        assert.equal(values.get('OJBetter_Bridge_WorkUri'), 'C:/Bridge');
        assert.equal(writes.length, 0);
        assert.equal(sockets[0].closed, true);
    });

    test(`${platform}/${channel}: unknown responses, unsupported protocols and invalid paths never migrate`, async () => {
        for (const reply of [
            '{invalid', null, { result: 'error', description: 'other error' },
            { ...bridgeInfo(), protocolVersion: 2 },
            { ...bridgeInfo(), bridge: 'other service' },
            { ...bridgeInfo(), capabilities: [] },
            { ...bridgeInfo(), languages: ['shell'] },
            { ...bridgeInfo(), version: null },
            bridgeInfo('relative/workspaces'), bridgeInfo('C:/Bridge/../workspaces'),
            bridgeInfo('C:/Bridge/workspaces\0'), bridgeInfo('C:/Bridge/config.yml'),
        ]) {
            const { runtime, writes } = discoveryRuntime(reply);
            await assert.rejects(runtime.OJB_detectBridge('ws://127.0.0.1:2323/', 100), /无法识别/);
            assert.throws(() => runtime.OJB_migrateBridgeWorkspace(reply));
            assert.equal(writes.length, 0);
        }
    });

    test(`${platform}/${channel}: timeouts and disconnects stay distinct from legacy detection`, async () => {
        for (const options of [{ noOpen: true }, { noReply: true }, { noReply: true, disconnect: true }]) {
            const { runtime, writes, sockets } = discoveryRuntime(null, {}, options);
            await assert.rejects(runtime.OJB_detectBridge('ws://127.0.0.1:2323/', 10), error => {
                assert.doesNotMatch(error.message, /旧版/);
                assert.match(error.message, /原设置未修改/);
                return true;
            });
            assert.equal(writes.length, 0);
            assert.equal(sockets[0].closed, true);
        }
    });
}
