const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../../../..');
const SCRIPT_CASES = [
    {
        name: 'Codeforces',
        kind: 'codeforces',
        path: path.join(ROOT, 'script/dev/codeforces-better.user.js')
    },
    {
        name: 'AtCoder',
        kind: 'atcoder',
        path: path.join(ROOT, 'script/dev/atcoder-better.user.js')
    },
    {
        name: 'Nowcoder',
        kind: 'nowcoder',
        path: path.join(ROOT, 'script/dev/nowcoder-better.user.js')
    }
];

function createApi(scriptCase) {
    const source = fs.readFileSync(scriptCase.path, 'utf8').replace(/\r\n/g, '\n');
    const startMarker = 'function isOpenAIResponsesEndpoint';
    const endMarkers = [
        '/**\n * @typedef {Object} CheckResponseResult',
        '//--谷歌翻译--start'
    ];
    const start = source.indexOf(startMarker);
    const ends = endMarkers
        .map((marker) => source.indexOf(marker, start))
        .filter((index) => index !== -1);
    const end = Math.min(...ends);

    assert.notEqual(start, -1, `${scriptCase.name}: OpenAI helper start not found`);
    assert.ok(Number.isFinite(end) && end > start, `${scriptCase.name}: OpenAI helper end not found`);

    const context = vm.createContext({
        console: { warn() {} },
        TextDecoder,
        TextEncoder,
        setTimeout,
        clearTimeout,
        OJB_getPlaceholderTokenRegex: () => /$^/,
        OJB_getReplaceOriginalTokenRegex: () => /$^/,
        OJB_formatPlaceholderToken: (value) => `【${value}】`,
        getTargetLanguage: () => 'Chinese',
        OJBetter: {
            typeOfPage: { is_oldLatex: false, is_acmsguru: false },
            chatgpt: {
                customPrompt: '',
                asSystemPrompt: false,
                config: {
                    name: 'test',
                    model: 'test-model',
                    thinking_mode: '',
                    think_level: undefined,
                    key: 'test-key',
                    proxy: 'https://example.test/v1/responses',
                    header: [],
                    data: []
                }
            }
        }
    });

    vm.runInContext(`${source.slice(start, end)}
        let __streamChunks = [];
        let __streamIndex = 0;
        let __streamStatus = 200;
        let __streamStatusText = 'OK';
        let __streamResponseHeaders = 'Content-Type: text/event-stream\\r\\n';
        let __streamResponseText = '';
        let __streamHangAfterChunks = false;
        globalThis.OJB_GMRequest = async function () {
            return {
                status: __streamStatus,
                statusText: __streamStatusText,
                responseHeaders: __streamResponseHeaders,
                responseText: __streamResponseText,
                response: {
                    status: __streamStatus,
                    statusText: __streamStatusText,
                    responseHeaders: __streamResponseHeaders,
                    getAllResponseHeaders() {
                        return __streamResponseHeaders;
                    },
                    getReader() {
                        return {
                            async read() {
                                if (__streamIndex < __streamChunks.length) {
                                    return { done: false, value: __streamChunks[__streamIndex++] };
                                }
                                if (__streamHangAfterChunks) return new Promise(() => {});
                                return { done: true, value: undefined };
                            },
                            cancel() {}
                        };
                    }
                }
            };
        };
        globalThis.__openaiApi = {
            setChatConfig(config) {
                OJBetter.chatgpt.config = config;
            },
            setLegacyConfig(config) {
                openai_model = config.model;
                openai_thinking_mode = config.thinking_mode;
                openai_think_level = config.think_level;
                openai_proxy = config.proxy;
                openai_data = config.data || [];
            },
            getRequest(raw, isStream) {
                const source = { text: raw, format: 'markdown', legacyLatex: null };
                return typeof getOpenAITranslationRequest === 'function' && ${JSON.stringify(scriptCase.kind)} === 'nowcoder'
                    ? getOpenAITranslationRequest(raw)
                    : getOpenAITranslationRequest(raw, isStream, source);
            },
            setStreamChunks(chunks) {
                __streamChunks = chunks;
                __streamIndex = 0;
                __streamStatus = 200;
                __streamStatusText = 'OK';
                __streamResponseHeaders = 'Content-Type: text/event-stream\\r\\n';
                __streamResponseText = '';
                __streamHangAfterChunks = false;
            },
            setStreamResponse(chunks, options = {}) {
                __streamChunks = chunks;
                __streamIndex = 0;
                __streamStatus = options.status ?? 200;
                __streamStatusText = options.statusText || (__streamStatus === 200 ? 'OK' : 'Error');
                __streamResponseHeaders = options.responseHeaders ||
                    'Content-Type: ' + (options.contentType || 'text/event-stream') + '\\r\\n';
                __streamResponseText = options.responseText || '';
                __streamHangAfterChunks = Boolean(options.hangAfterChunks);
            },
            stream(raw, onReasoning, options = {}) {
                if (typeof openai_stream !== 'function') return null;
                const source = { text: raw, format: 'markdown', legacyLatex: null };
                return ${JSON.stringify(scriptCase.kind)} === 'atcoder'
                    ? openai_stream(raw, onReasoning, options)
                    : openai_stream(raw, source, onReasoning, options);
            },
            applyOpenAIReasoningConfig,
            getOpenAIChatCompletionDefaults,
            splitOpenAISSEBuffer: typeof splitOpenAISSEBuffer === 'function' ? splitOpenAISSEBuffer : null,
            parseOpenAISSEEvent: typeof parseOpenAISSEEvent === 'function' ? parseOpenAISSEEvent : null,
            getOpenAIStreamDeltas: typeof getOpenAIStreamDeltas === 'function' ? getOpenAIStreamDeltas : null,
            hasStream: typeof openai_stream === 'function'
        };`, context, { filename: scriptCase.path });

    return context.__openaiApi;
}

function createGMRequestApi(scriptCase) {
    const source = fs.readFileSync(scriptCase.path, 'utf8').replace(/\r\n/g, '\n');
    const startMarker = 'function OJB_GMRequest(';
    const endMarker = '/**\n * 获取cookie';
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);

    assert.notEqual(start, -1, `${scriptCase.name}: OJB_GMRequest start not found`);
    assert.ok(end > start, `${scriptCase.name}: OJB_GMRequest end not found`);

    let requestImplementation = () => ({ abort() {} });
    class OJB_GMError extends Error {
        constructor(type, message, originalError) {
            super(message);
            this.name = 'GMError';
            this.type = type;
            this.originalError = originalError;
        }
    }
    const context = vm.createContext({
        console: { warn() {} },
        setTimeout,
        clearTimeout,
        OJB_GMError,
        GM_xmlhttpRequest(options) {
            return requestImplementation(options);
        }
    });
    vm.runInContext(
        `${source.slice(start, end)}\nglobalThis.__gmRequest = OJB_GMRequest;`,
        context,
        { filename: scriptCase.path }
    );

    return {
        request: (...args) => context.__gmRequest(...args),
        setRequestImplementation(implementation) {
            requestImplementation = implementation;
        }
    };
}

function chatConfig(overrides = {}) {
    return {
        name: 'test',
        model: 'deepseek-v4-flash',
        thinking_mode: 'enabled',
        think_level: 'high',
        key: 'test-key',
        proxy: 'https://api.deepseek.com/v1/chat/completions',
        header: [],
        data: [],
        ...overrides
    };
}

function responseConfig(overrides = {}) {
    return {
        ...chatConfig(),
        proxy: 'https://api.openai.com/v1/responses',
        ...overrides
    };
}

async function collectStream(api, options = {}) {
    const output = [];
    for await (const text of api.stream('hello', () => {}, options)) output.push(text);
    return output;
}

async function settleWithin(promise, timeoutMs = 500) {
    let timer;
    const watchdog = new Promise((resolve) => {
        timer = setTimeout(() => resolve({ type: 'watchdog' }), timeoutMs);
    });
    const settled = promise.then(
        (value) => ({ type: 'resolved', value }),
        (error) => ({ type: 'rejected', error })
    );
    const result = await Promise.race([settled, watchdog]);
    clearTimeout(timer);
    return result;
}

for (const scriptCase of SCRIPT_CASES.filter(({ kind }) => kind !== 'nowcoder')) {
    test(`${scriptCase.name}: stream request wrapper falls back to onload`, async () => {
        const api = createGMRequestApi(scriptCase);
        const response = { status: 200, response: null };
        api.setRequestImplementation((options) => {
            queueMicrotask(() => options.onload(response));
            return { abort() {} };
        });

        const result = await api.request({ method: 'POST' }, true, 100);
        assert.equal(result, response);
    });

    test(`${scriptCase.name}: stream request start timeout aborts and rejects`, async () => {
        const api = createGMRequestApi(scriptCase);
        let abortCalls = 0;
        api.setRequestImplementation(() => ({
            abort() {
                abortCalls++;
            }
        }));

        await assert.rejects(
            api.request({ method: 'POST' }, true, 20),
            (error) => {
                assert.equal(error.type, 'timeout');
                assert.match(error.message, /stream did not start/i);
                return true;
            }
        );
        assert.equal(abortCalls, 1);
    });
}

for (const scriptCase of SCRIPT_CASES) {
    test(`${scriptCase.name}: maps thinking settings for Responses and Chat Completions`, () => {
        const api = createApi(scriptCase);

        if (scriptCase.kind === 'nowcoder') {
            api.setLegacyConfig({
                model: 'deepseek-v4-flash',
                thinking_mode: 'enabled',
                think_level: 'high',
                proxy: 'https://api.deepseek.com/v1/chat/completions',
                data: []
            });
        } else {
            api.setChatConfig(chatConfig());
        }
        const chatRequest = api.getRequest('hello', true);
        assert.deepEqual(chatRequest.data.thinking, { type: 'enabled' });
        assert.equal(chatRequest.data.reasoning_effort, 'high');
        assert.equal(chatRequest.data.temperature, undefined);

        if (scriptCase.kind === 'nowcoder') {
            api.setLegacyConfig({
                model: 'gpt-5.4',
                thinking_mode: 'enabled',
                think_level: 'medium',
                proxy: 'https://api.openai.com/v1/responses',
                data: []
            });
        } else {
            api.setChatConfig(responseConfig({ think_level: 'medium' }));
        }
        const responseRequest = api.getRequest('hello', false);
        assert.deepEqual(responseRequest.data.reasoning, { effort: 'medium' });
        assert.equal(responseRequest.data.thinking, undefined);
        assert.equal(responseRequest.data.reasoning_effort, undefined);
    });

    test(`${scriptCase.name}: preserves explicit settings and supports disabled thinking`, () => {
        const api = createApi(scriptCase);
        const customData = [
            { thinking: { type: 'disabled' } },
            { reasoning_effort: 'custom' },
            { temperature: 0.2 }
        ];

        if (scriptCase.kind === 'nowcoder') {
            api.setLegacyConfig({
                model: 'deepseek-v4-flash',
                thinking_mode: 'enabled',
                think_level: 'high',
                proxy: 'https://api.deepseek.com/v1/chat/completions',
                data: customData
            });
        } else {
            api.setChatConfig(chatConfig({ data: customData }));
        }
        const customRequest = api.getRequest('hello', false);
        assert.deepEqual(customRequest.data.thinking, { type: 'disabled' });
        assert.equal(customRequest.data.reasoning_effort, 'custom');
        assert.equal(customRequest.data.temperature, 0.2);

        if (scriptCase.kind === 'nowcoder') {
            api.setLegacyConfig({
                model: 'deepseek-v4-flash',
                thinking_mode: 'disabled',
                think_level: 'high',
                proxy: 'https://api.deepseek.com/v1/chat/completions',
                data: []
            });
        } else {
            api.setChatConfig(chatConfig({ thinking_mode: 'disabled', data: [] }));
        }
        const disabledRequest = api.getRequest('hello', false);
        assert.deepEqual(disabledRequest.data.thinking, { type: 'disabled' });
        assert.equal(disabledRequest.data.reasoning_effort, undefined);
        assert.equal(disabledRequest.data.temperature, 0.7);
    });
}

for (const scriptCase of SCRIPT_CASES.filter(({ kind }) => kind !== 'nowcoder')) {
    test(`${scriptCase.name}: parses fragmented DeepSeek SSE and keeps reasoning out of text`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());

        const events = [
            `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'internal ' } }] })}\r\n\r\n`,
            `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'notes' } }] })}\r\n\r\n`,
            `data: ${JSON.stringify({ choices: [{ delta: { content: 'translated ' } }] })}\r\n\r\n`,
            `data: ${JSON.stringify({ choices: [{ delta: { content: 'text' } }] })}\r\n\r\n`,
            'data: [DONE]\r\n\r\n'
        ];
        const bytes = Buffer.from(events.join(''), 'utf8');
        const chunks = [];
        for (let offset = 0; offset < bytes.length; offset += 7) {
            chunks.push(bytes.subarray(offset, Math.min(offset + 7, bytes.length)));
        }
        api.setStreamChunks(chunks);

        let reasoningNotifications = 0;
        const output = [];
        for await (const text of api.stream('hello', () => reasoningNotifications++)) {
            output.push(text);
        }
        assert.deepEqual(output, ['translated ', 'text']);
        assert.equal(reasoningNotifications, 1);

        const split = api.splitOpenAISSEBuffer(events[0] + events[2]);
        assert.equal(split.records.length, 2);
        assert.equal(split.remainder, '');
        const parsed = api.parseOpenAISSEEvent(split.records[0]);
        assert.equal(parsed.data.choices[0].delta.reasoning_content, 'internal ');
        assert.deepEqual(
            api.getOpenAIStreamDeltas(parsed.data, false),
            [{ type: 'reasoning', text: 'internal ' }]
        );
        assert.deepEqual(
            api.getOpenAIStreamDeltas({ choices: [{ delta: { content: null } }] }, false),
            []
        );
    });

    test(`${scriptCase.name}: flushes a final SSE record without a trailing separator`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        const finalEvent = `data: ${JSON.stringify({
            choices: [{ delta: { content: 'tail' }, finish_reason: 'stop' }]
        })}`;
        api.setStreamChunks([Buffer.from(finalEvent, 'utf8')]);

        const output = [];
        for await (const text of api.stream('hello', () => {})) output.push(text);
        assert.deepEqual(output, ['tail']);
    });

    test(`${scriptCase.name}: rejects a Chat Completions SSE error`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        const errorEvent = `data: ${JSON.stringify({ error: { message: 'request failed' } })}\n\n`;
        api.setStreamChunks([Buffer.from(errorEvent, 'utf8')]);

        await assert.rejects(async () => {
            for await (const _text of api.stream('hello', () => {})) {}
        }, /request failed/);
    });

    test(`${scriptCase.name}: rejects a partial stream that reaches EOF without completion`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        const partialEvent = `data: ${JSON.stringify({
            choices: [{ delta: { content: 'partial' }, finish_reason: null }]
        })}\n\n`;
        api.setStreamChunks([Buffer.from(partialEvent, 'utf8')]);

        await assert.rejects(
            collectStream(api),
            /without a completion signal/
        );
    });

    test(`${scriptCase.name}: accepts SSE metadata heartbeats and text/plain proxies`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        const events = [
            'event: ping\nid: 1\nretry: 1000\n\n',
            `data: ${JSON.stringify({
                choices: [{ delta: { content: 'translated' }, finish_reason: 'stop' }]
            })}\n\n`
        ];
        api.setStreamResponse([Buffer.from(events.join(''), 'utf8')], {
            contentType: 'text/plain; charset=utf-8'
        });

        assert.deepEqual(await collectStream(api), ['translated']);
    });

    test(`${scriptCase.name}: rejects an incomplete Responses stream after partial output`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(responseConfig());
        const events = [
            'event: response.output_text.delta\n',
            `data: ${JSON.stringify({ delta: 'partial' })}\n\n`,
            'event: response.incomplete\n',
            `data: ${JSON.stringify({
                response: { incomplete_details: { reason: 'max_output_tokens' } }
            })}\n\n`
        ];
        api.setStreamChunks([Buffer.from(events.join(''), 'utf8')]);

        await assert.rejects(
            collectStream(api),
            /response\.incomplete.*max_output_tokens/
        );
    });
}

for (const scriptCase of SCRIPT_CASES.filter(({ kind }) => kind !== 'nowcoder')) {
    test(`${scriptCase.name}: rejects HTTP 404 stream responses with empty or JSON bodies`, async () => {
        for (const [label, body] of [
            ['empty', ''],
            ['JSON', JSON.stringify({ error: { message: 'Not Found' } })]
        ]) {
            const api = createApi(scriptCase);
            api.setChatConfig(chatConfig());
            api.setStreamResponse(body ? [Buffer.from(body, 'utf8')] : [], {
                status: 404,
                statusText: 'Not Found',
                contentType: 'application/json',
                responseText: body
            });

            await assert.rejects(
                collectStream(api),
                `${scriptCase.name}: HTTP 404 ${label} response must reject`
            );
        }
    });

    test(`${scriptCase.name}: rejects an HTTP 200 JSON error response`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        const body = JSON.stringify({ error: { message: 'Upstream rejected the request' } });
        api.setStreamResponse([Buffer.from(body, 'utf8')], {
            status: 200,
            contentType: 'application/json',
            responseText: body
        });

        await assert.rejects(
            collectStream(api),
            /Upstream rejected the request/,
            `${scriptCase.name}: HTTP 200 application\/json error response must reject`
        );
    });

    test(`${scriptCase.name}: stops on finish_reason without waiting for DONE or EOF`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        const events = [
            `data: ${JSON.stringify({
                choices: [{ delta: { content: 'translated' }, finish_reason: null }]
            })}\n\n`,
            `data: ${JSON.stringify({
                choices: [{ delta: { content: '' }, finish_reason: 'stop' }],
                usage: { completion_tokens: 1, prompt_tokens: 1, total_tokens: 2 }
            })}\n\n`
        ];
        api.setStreamResponse([Buffer.from(events.join(''), 'utf8')], {
            hangAfterChunks: true
        });

        const outcome = await settleWithin(collectStream(api));
        assert.notEqual(outcome.type, 'watchdog', `${scriptCase.name}: ignored finish_reason: stop`);
        assert.equal(outcome.type, 'resolved', `${scriptCase.name}: finish_reason: stop must resolve`);
        assert.deepEqual(outcome.value, ['translated']);
    });

    test(`${scriptCase.name}: rejects an empty successful stream`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        api.setStreamResponse([]);
        await assert.rejects(
            collectStream(api),
            `${scriptCase.name}: an empty HTTP 200 stream must reject`
        );
    });

    test(`${scriptCase.name}: rejects when the injected stream idle timeout expires`, async () => {
        const api = createApi(scriptCase);
        api.setChatConfig(chatConfig());
        api.setStreamResponse([], { hangAfterChunks: true });

        const outcome = await settleWithin(
            collectStream(api, { idleTimeoutMs: 20 })
        );
        assert.notEqual(outcome.type, 'watchdog', `${scriptCase.name}: stream idle timeout was ignored`);
        assert.equal(outcome.type, 'rejected', `${scriptCase.name}: stream idle timeout must reject`);
    });
}

test('OpenAI stream helper recognizes Responses reasoning and content events', () => {
    const api = createApi(SCRIPT_CASES[0]);
    assert.deepEqual(
        api.getOpenAIStreamDeltas({ delta: 'summary' }, true, 'response.reasoning_summary_text.delta'),
        [{ type: 'reasoning', text: 'summary' }]
    );
    assert.deepEqual(
        api.getOpenAIStreamDeltas({ delta: 'answer' }, true, 'response.output_text.delta'),
        [{ type: 'content', text: 'answer' }]
    );
    assert.deepEqual(api.parseOpenAISSEEvent('data: [DONE]'), {
        done: true,
        eventType: '',
        raw: '[DONE]'
    });
});

test('Codeforces and AtCoder thinking settings remain localized', () => {
    const expectedI18n = [
        ['chatgpt.basic.thinkingMode.label', 'config:chatgpt.basic.thinkingMode.label'],
        ['chatgpt.basic.thinkingMode.tipText', '[html]config:chatgpt.basic.thinkingMode.tipText'],
        ['chatgpt.basic.thinkingMode.options.default', 'config:chatgpt.basic.thinkingMode.options.default'],
        ['chatgpt.basic.thinkingMode.options.enabled', 'config:chatgpt.basic.thinkingMode.options.enabled'],
        ['chatgpt.basic.thinkingMode.options.disabled', 'config:chatgpt.basic.thinkingMode.options.disabled'],
        ['chatgpt.basic.thinkLevel.label', 'config:chatgpt.basic.thinkLevel.label'],
        ['chatgpt.basic.thinkLevel.tipText', '[html]config:chatgpt.basic.thinkLevel.tipText'],
        ['chatgpt.basic.thinkLevel.placeholder', '[placeholder]config:chatgpt.basic.thinkLevel.placeholder']
    ];

    for (const scriptCase of SCRIPT_CASES.filter(({ kind }) => kind !== 'nowcoder')) {
        const source = fs.readFileSync(scriptCase.path, 'utf8');
        const templateStart = source.indexOf('const chatgptConfigEditHTML = `');
        const templateEnd = source.indexOf('const CompletConfigEditHTML = `', templateStart);
        assert.notEqual(templateStart, -1, `${scriptCase.name}: ChatGPT config template not found`);
        assert.ok(templateEnd > templateStart, `${scriptCase.name}: ChatGPT config template end not found`);
        const template = source.slice(templateStart, templateEnd);

        const configPath = path.join(
            ROOT,
            'resources/locales',
            `${scriptCase.kind}-better`,
            'config.json'
        );
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        for (const [resourcePath, dataI18n] of expectedI18n) {
            assert.ok(
                template.includes(`data-i18n="${dataI18n}"`),
                `${scriptCase.name}: template must reference ${dataI18n}`
            );
            const resource = resourcePath.split('.').reduce((value, key) => value?.[key], config);
            assert.equal(typeof resource, 'string', `${scriptCase.name}: missing config:${resourcePath}`);
            assert.ok(resource.length > 0, `${scriptCase.name}: config:${resourcePath} must not be empty`);
        }

        assert.doesNotMatch(
            template,
            /[\u3400-\u9fff]/u,
            `${scriptCase.name}: chatgptConfigEditHTML must not contain hard-coded Chinese text`
        );
    }
});
