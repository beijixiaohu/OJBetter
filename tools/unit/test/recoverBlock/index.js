// =============== test data setup ===============
let translation = "deepl";
let is_oldLatex = false;
let replaceSymbol = "2";
// ===============================================

// latex替换
function recoverBlock(translatedText, matches, replacements) {
    for (let i = 0; i < matches.length; i++) {
        let match = matches[i];
        let replacement = replacements[`【${i + 1}】`] || replacements[`[${i + 1}]`] || replacements[`{${i + 1}}`];

        let latexMatch = '(?<latex_block>\\$\\$(\\\\.|[^\\$])*?\\$\\$)|(?<latex_inline>\\$(\\\\.|[^\\$])*?\\$)|';

        let regex = new RegExp(latexMatch + `【\\s*${i + 1}\\s*】|\\[\\s*${i + 1}\\s*\\]|{\\s*${i + 1}\\s*}`, 'g');
        translatedText = translatedText.replace(regex, function (match, ...args) {
            // LaTeX中的不替换
            const groups = args[args.length - 1]; // groups是replace方法的最后一个参数
            if (groups.latex_block || groups.latex_inline) return match;
            // 没有空格则加一个
            const offset = args[args.length - 3]; // offset是replace方法的倒数第三个参数
            let leftSpace = "", rightSpace = "";
            if (!/\s/.test(translatedText[offset - 1])) leftSpace = " ";
            if (!/\s/.test(translatedText[offset + match.length])) rightSpace = " ";
            return leftSpace + replacement + rightSpace;
        });

        regex = new RegExp(latexMatch + `【\\s*${i + 1}(?![】\\d])|(?<![【\\d])${i + 1}\\s*】|(?<!\\\\)\\[\\s*${i + 1}(?![\\]\\d])|(?<![\\[\\d])${i + 1}\\s*\\]|{\\s*${i + 1}(?![}\\d])|(?<![{\\d])${i + 1}\\s*}`, 'g');
        translatedText = translatedText.replace(regex, function (match, ...args) {
            // LaTeX中的不替换
            const groups = args[args.length - 1]; 
            if (groups.latex_block || groups.latex_inline) return match;
            // 没有空格则加一个
            const offset = args[args.length - 3]; // offset是replace方法的倒数第三个参数
            let leftSpace = "", rightSpace = "";
            if (!/\s/.test(translatedText[offset - 1])) leftSpace = " ";
            if (!/\s/.test(translatedText[offset + match.length])) rightSpace = " ";
            return leftSpace + replacement + rightSpace;
        });
    }
    return translatedText;
}

// =============== test data setup ===============
var data = {
    translatedText: "",
    matches: [],
    replacements: {}
}
// ===============================================

// 翻译框/翻译处理器
async function translateProblemStatement() {

    // =============== test data setup ===============
    let translatedText = data.translatedText;
    let matches = data.matches;
    let replacements = data.replacements;
    // ===============================================

    // 还原latex公式
    translatedText = translatedText.replace(/】\s*【/g, '】 【');
    translatedText = translatedText.replace(/\]\s*\[/g, '] [');
    translatedText = translatedText.replace(/\}\s*\{/g, '} {');
    if (is_oldLatex) {
        translatedText = "<p>" + translatedText + "</p>";
        translatedText = recoverBlock(translatedText, matches, replacements);
    } else if (translation != "openai") {
        translatedText = recoverBlock(translatedText, matches, replacements);
    }

    // =============== test data setup ===============
    return translatedText;
    // ===============================================
}

module.exports = {
    data,
    recoverBlock,
    translateProblemStatement,
};
