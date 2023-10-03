var {
    data,
    translateProblemStatement
} = require('./index');

describe('Testing recoverBlock function', () => {
    test('【】', async () => {
        data.translatedText = 'This is a test 【1】. And another test 【2】. One more 【3】 test.';
        data.matches = ["【1】", "【2】", "【3】"];
        data.replacements = {
            "【1】": "replaced 1",
            "【2】": "replaced 2",
            "【3】": "replaced 3"
        };
        const expectedText = 'This is a test replaced 1 . And another test replaced 2 . One more replaced 3 test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });

    test('[]', async () => {
        data.translatedText = 'This is a test [1]. And another test [2]. One more [3] test.';
        data.matches = ["[1]", "[2]", "[3]"];
        data.replacements = {
            "[1]": "replaced 1",
            "[2]": "replaced 2",
            "[3]": "replaced 3"
        };
        const expectedText = 'This is a test replaced 1 . And another test replaced 2 . One more replaced 3 test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });

    test('{}', async () => {
        data.translatedText = 'This is a test {1}. And another test {2}. One more {3} test.';
        data.matches = ["{1}", "{2}", "{3}"];
        data.replacements = {
            "{1}": "replaced 1",
            "{2}": "replaced 2",
            "{3}": "replaced 3"
        };
        const expectedText = 'This is a test replaced 1 . And another test replaced 2 . One more replaced 3 test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });

    test('mix', async () => {
        data.translatedText = 'This is a test {1}. And another test [2]. One more 【3】 test.';
        data.matches = ["{1}", "{2}", "{3}"];
        data.replacements = {
            "{1}": "replaced 1",
            "{2}": "replaced 2",
            "{3}": "replaced 3"
        };
        const expectedText = 'This is a test replaced 1 . And another test replaced 2 . One more replaced 3 test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });

    test('left-broken x]', async () => {
        data.translatedText = 'This is a test 1}. And another test 2]. One more3】 test.';
        data.matches = ["{1}", "{2}", "{3}"];
        data.replacements = {
            "{1}": "replaced 1",
            "{2}": "replaced 2",
            "{3}": "replaced 3"
        };
        const expectedText = 'This is a test replaced 1 . And another test replaced 2 . One more replaced 3 test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });

    test('right-broken [x', async () => {
        data.translatedText = 'This is a test {1. And another test [2. One more 【3 test.';
        data.matches = ["{1}", "{2}", "{3}"];
        data.replacements = {
            "{1}": "replaced 1",
            "{2}": "replaced 2",
            "{3}": "replaced 3"
        };
        const expectedText = 'This is a test replaced 1 . And another test replaced 2 . One more replaced 3 test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });

    test('LaTeX has {}}', async () => {
        data.translatedText = 'This is a test 【1】. And another test [2]. One more 3} $$ {3} $$ test.';
        data.matches = ["{1}", "{2}", "{3}"];
        data.replacements = {
            "{1}": "replaced 1",
            "{2}": "replaced 2",
            "{3}": "replaced 3"
        };
        const expectedText = 'This is a test replaced 1 . And another test replaced 2 . One more replaced 3 $$ {3} $$ test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });

    test('adjacent LaTeXs', async () => {
        data.translatedText = 'This are some test 【1】[2]{3}. And another test [1][2]. One more 3}{1}test.';
        data.matches = ["{1}", "{2}", "{3}"];
        data.replacements = {
            "{1}": "replaced 1",
            "{2}": "replaced 2",
            "{3}": "replaced 3"
        };
        const expectedText = 'This are some test replaced 1 replaced 2 replaced 3 . And another test replaced 1 replaced 2 . One more replaced 3 replaced 1 test.';

        const result = await translateProblemStatement();
        expect(result).toBe(expectedText);
    });
});
