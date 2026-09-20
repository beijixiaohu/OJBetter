const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

for (const platform of ['codeforces', 'atcoder']) {
    const scriptPath = path.resolve(__dirname, `../../../../script/dev/${platform}-better.user.js`);
    const source = fs.readFileSync(scriptPath, 'utf8');
    const start = source.indexOf('function OJB_getCodeFromPre(');
    const end = source.indexOf('// =================处理代码块语言', start);
    assert.ok(start >= 0 && end > start);

    test(`${platform}/dev: preserves all code fragments and intervening links (#446)`, () => {
        const dom = new JSDOM('<pre><code class="prettyprint"><span>announcement &lt;&lt; </span></code><a href="/contest/2259">Codeforces Round 1119 (Div. 3)</a><code class="prettyprint">;\nreturn 0;\n}</code></pre>');
        const context = vm.createContext({ DOMParser: dom.window.DOMParser });
        vm.runInContext(source.slice(start, end), context);
        const pre = dom.window.document.querySelector('pre');
        assert.equal(context.OJB_getCodeFromPre(pre), 'announcement << Codeforces Round 1119 (Div. 3);\nreturn 0;\n}');
        assert.equal(pre.querySelectorAll('code').length, 2);
        dom.window.close();
    });

    for (const [name, html, expected] of [
        ['line breaks and escaped operators', '<pre><code class="prettyprint">if (a &lt; b &amp;&amp; c &gt; d)<br>first();</code><BR/><a>user</a><code class="prettyprint"><br />last();</code></pre>', 'if (a < b && c > d)\nfirst();\nuser\nlast();'],
        ['single code child', '<pre><code class="prettyprint"><span>int main() {</span>\n}</code></pre>', 'int main() {\n}'],
        ['numbered pre', '<pre class="prettyprint"><ol><li>first</li><li>second</li></ol></pre>', 'first\nsecond'],
        ['numbered code child', '<pre><code class="prettyprint linenums"><ol><li>first</li><li>second</li></ol></code></pre>', 'first\nsecond'],
    ]) {
        test(`${platform}/dev: ${name}`, () => {
            const dom = new JSDOM(html);
            const context = vm.createContext({ DOMParser: dom.window.DOMParser });
            vm.runInContext(source.slice(start, end), context);
            assert.equal(context.OJB_getCodeFromPre(dom.window.document.querySelector('pre')), expected);
            dom.window.close();
        });
    }
}
