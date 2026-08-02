// =============== test data setup ===============
let translation = "deepl";
let replaceSymbol = "2";
function getRandomNumber() {
    return "12345678";
}
// ===============================================

// latex替换
function replaceBlock(text, matches, replacements) {
    try {
        for (let i = 0; i < matches.length; i++) {
            let match = matches[i];
            let replacement = '';
            if (replaceSymbol === "1") {
                replacement = `【${i + 1}】`;
            } else if (replaceSymbol === "2") {
                replacement = `{${i + 1}}`;
            } else if (replaceSymbol === "3") {
                replacement = `[${i + 1}]`;
            }
            text = text.replace(match, replacement);
            replacements[replacement] = match;
        }
    } catch (e) { }
    return text;
}

// 翻译框/翻译处理器
var text = "";
async function translateProblemStatement(text) {
    let status = 0;
    let id = getRandomNumber(8);
    let matches = [];
    let replacements = {};
    
    // ...

    // 替换latex公式
    if (translation !== "openai") {
        // 使用GPT翻译时不必替换latex公式
        let regex = /\$\$(\\.|[^\$])*?\$\$|\$(\\.|[^\$])*?\$/g;
        matches = matches.concat(text.match(regex));
        text = replaceBlock(text, matches, replacements);
    }

    // =============== test data setup ===============
    return text;
    // ===============================================
}

module.exports = {
    replaceBlock,
    translateProblemStatement,
};
