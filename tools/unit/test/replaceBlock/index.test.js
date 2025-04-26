const { translateProblemStatement } = require('./index');

describe('Testing replaceBlock function', () => {
    test('inline', async () => {
        const text = 'If `ABC` does not appear in $S$, print `-1`.';
        const expectedText = 'If `ABC` does not appear in {1}, print `-1`.';

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });

    test('inline wrap', async () => {
        const text = `$S
        + n$`;
        const expectedText = `{1}`;

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });

    test('block ', async () => {
        const text = `
        $$
        x + y = z
        $$
        $$
        x + y = z

        $$
        $$

        x + y = z

        $$
        `;
        const expectedText = `
        {1}
        {2}
        {3}
        `;

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });

    test('mix', async () => {
        const text = `
        You are given $3$ integers — $n$, $x$, $y$. Let's call the score of a permutation$^\dagger$ $p_1, \ldots, p_n$ the following value:
        $$
        (p_{1 \cdot x} + p_{2 \cdot x} + \ldots + p_{\lfloor \frac{n}{x} \rfloor \cdot x}) - (p_{1 \cdot y} + p_{2 \cdot y} + \ldots + p_{\lfloor \frac{n}{y} \rfloor \cdot y})
        $$
        You are given $3$ integers — $n$, $x$, $y$. Let's call the score of a permutation$^\dagger$ $p_1, \ldots, p_n$ the following value:
        `;
        const expectedText = `
        You are given {1} integers — {2}, {3}, {4}. Let's call the score of a permutation{5} {6} the following value:
        {7}
        You are given {8} integers — {9}, {10}, {11}. Let's call the score of a permutation{12} {13} the following value:
        `;

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });

    test('escaped $ symbols - 1', async () => {
        const text = 'The test string is $n \\$ m$';
        const expectedText = 'The test string is {1}';

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });

    test('escaped $ symbols - 2', async () => {
        const text = 'The test string is $n \\$ \\$ m$';
        const expectedText = 'The test string is {1}';

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });

    test('escaped $ symbols - 3', async () => {
        const text = `
        The test string is
        $$
        n \\$ \\$ m
        $$
        `;
        const expectedText = `
        The test string is
        {1}
        `;

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });

    test('escaped replace symbols', async () => {
        const text = `
        ### \[1\] The test string is $X$ and $Y$
        ### \[2\] Solution to the original problem
        `;
        const expectedText = `
        ### \[1\] The test string is {1} and {2}
        ### \[2\] Solution to the original problem
        `;

        const result = await translateProblemStatement(text);
        expect(result).toBe(expectedText);
    });
});
