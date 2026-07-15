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
        globalThis.OJB_GMRequest = async function () {
            return {
                response: {
                    getReader() {
                        return {
                            async read() {
                                if (__streamIndex < __streamChunks.length) {
                                    return { done: false, value: __streamChunks[__streamIndex++] };
                                }
                                return { done: true, value: undefined };
                            }
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
            },
            stream(raw, onReasoning) {
                if (typeof openai_stream !== 'function') return null;
                const source = { text: raw, format: 'markdown', legacyLatex: null };
                return ${JSON.stringify(scriptCase.kind)} === 'atcoder'
                    ? openai_stream(raw, onReasoning)
                    : openai_stream(raw, source, onReasoning);
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
        const finalEvent = `data: ${JSON.stringify({ choices: [{ delta: { content: 'tail' } }] })}`;
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
