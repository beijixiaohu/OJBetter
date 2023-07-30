// ==UserScript==
// @name         Nowcoder mdCopy
// @namespace    https://greasyfork.org/users/747162
// @version      0.1
// @description  Nowcoder题目题解markdown一键复制
// @author       北极小狐
// @match        https://ac.nowcoder.com/*
// @connect      greasyfork.org
// @grant        GM_info
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @icon         https://aowuucdn.oss-cn-beijing.aliyuncs.com/nowcoder.png
// @require      https://cdn.staticfile.org/turndown/7.1.2/turndown.min.js
// @require      https://cdn.staticfile.org/markdown-it/13.0.1/markdown-it.min.js
// @license      MIT
// @compatible	 Chrome
// @compatible	 Firefox
// @compatible	 Edge
// ==/UserScript==

// 样式
GM_addStyle(`
span.mdViewContent {
    white-space: pre-wrap;
}
/*按钮*/
.html2md-panel {
    display: flex;
    justify-content: flex-end;
}
.html2md-panel a {
    text-decoration: none;
}
button.html2mdButton {
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: #ffffff;
    color: #606266;
    height: 22px;
    width: auto;
    font-size: 13px;
    border-radius: 0.3rem;
    padding: 1px 5px;
    margin: 5px;
    border: 1px solid #dcdfe6;
}
button.html2mdButton:hover {
    color: #409eff;
    border-color: #409eff;
}
button.html2mdButton.copied {
    background-color: #f0f9eb;
    color: #67c23e;
    border: 1px solid #b3e19d;
}
button.html2mdButton.mdViewed {
    background-color: #fdf6ec;
    color: #e6a23c;
    border: 1px solid #f3d19e;
}
`);

// html2md转换/处理规则
var turndownService = new TurndownService({ bulletListMarker: '-', escape: (text) => text });
var turndown = turndownService.turndown;

// 保留原始
turndownService.keep(['del']);

turndownService.addRule('removeByClass', {
    filter: function (node) {
        return node.classList.contains('html2md-panel') ||
            node.classList.contains('div-btn-copy') ||
            node.classList.contains('btn-copy')
    },
    replacement: function () {
        return '';
    }
});

// inline math
turndownService.addRule('inline-math1', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex";
    },
    replacement: function (content, node) {
        var text = $(node).find('annotation').text();
        if (text == ""){
            text = $(node).find('math').contents().filter(function () {
                return this.nodeType === Node.TEXT_NODE;
            }).text();
        }
        return "$" + text + "$";
    }
});
turndownService.addRule('inline-math2', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex-mathml";
    },
    replacement: function (content, node) {
        var text = "";
        $(node).contents().each(function () {
            if (this.nodeType === Node.TEXT_NODE) {
                text += $(this).text();
            }
        });
        return "$" + text + "$";
    }
});

// block math
turndownService.addRule('block-math', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "span" && node.className == "katex-display";
    },
    replacement: function (content, node) {
        return "\n$$\n" + $(node).find('annotation').text() + "\n$$\n";
    }
});

// pre
turndownService.addRule('pre', {
    filter: function (node, options) {
        return node.tagName.toLowerCase() == "pre";
    },
    replacement: function (content, node) {
        return "```\n" + content + "```\n";
    }
});

// bordertable
turndownService.addRule('bordertable', {
    filter: 'table',
    replacement: function (content, node) {
        if (node.classList.contains('table')) {
            var output = [],
                thead = '',
                trs = node.querySelectorAll('tr');
            if (trs.length > 0) {
                var ths = trs[0].querySelectorAll('th');
                if (ths.length > 0) {
                    thead = '| ' + Array.from(ths).map(th => turndownService.turndown(th.innerHTML.trim())).join(' | ') + ' |\n'
                        + '| ' + Array.from(ths).map(() => ' --- ').join('|') + ' |\n';
                }
            }
            var rows = node.querySelectorAll('tr');
            Array.from(rows).forEach(function (row, i) {
                if (i > 0) {
                    var cells = row.querySelectorAll('td,th');
                    var trow = '| ' + Array.from(cells).map(cell => turndownService.turndown(cell.innerHTML.trim())).join(' | ') + ' |';
                    output.push(trow);
                }
            });
            return thead + output.join('\n');
        } else {
            return content;
        }
    }
});


// 随机数生成
function getRandomNumber(numDigits) {
    let min = Math.pow(10, numDigits - 1);
    let max = Math.pow(10, numDigits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 按钮面板
function addButtonPanel(parent, suffix, type) {
    let htmlString = `<div class='html2md-panel'>
    <button class='html2mdButton html2md-view${suffix}'>MarkDown视图</button>
    <button class='html2mdButton html2md-cb${suffix}'>Copy</button>
  </div>`;
    if (type === "this_level") {
        $(parent).before(htmlString);
    } else if (type === "child_level") {
        $(parent).prepend(htmlString);
    }
}

function addButtonWithHTML2MD(parent, suffix, type) {
    $(document).on("click", ".html2md-view" + suffix, function () {
        var target, removedChildren = $();
        if (type === "this_level") {
            target = $(".html2md-view" + suffix).parent().next().get(0);
        } else if (type === "child_level") {
            target = $(".html2md-view" + suffix).parent().parent().get(0);
            removedChildren = $(".html2md-view" + suffix).parent().parent().children(':first').detach();
        }
        if (target.viewmd) {
            target.viewmd = false;
            $(this).text("MarkDown视图");
            $(this).removeClass("mdViewed");
            $(target).html(target.original_html);
        } else {
            target.viewmd = true;
            if (!target.original_html) {
                target.original_html = $(target).html();
            }
            if (!target.markdown) {
                target.markdown = turndownService.turndown($(target).html());
            }
            $(this).text("原始内容");
            $(this).addClass("mdViewed");
            $(target).html(`<span class="mdViewContent" oninput="$(this).parent().get(0).markdown=this.value;" style="width:auto; height:auto;">${target.markdown}</span>`);
        }
        // 恢复删除的元素
        if (removedChildren) $(target).prepend(removedChildren);
    });
}

function addButtonWithCopy(parent, suffix, type) {
    $(document).on("click", ".html2md-cb" + suffix, function () {
        let target, removedChildren, text;
        if (type === "this_level") {
            target = $(".html2md-cb" + suffix).parent().next().eq(0).clone();
        } else if (type === "child_level") {
            target = $(".html2md-cb" + suffix).parent().parent().eq(0).clone();
            $(target).children(':first').remove();
        }
        if ($(target).find('.mdViewContent').length <= 0) {
            text = turndownService.turndown($(target).html());
        } else {
            text = $(target).find('.mdViewContent').text();
        }
        GM_setClipboard(text);
        $(this).addClass("copied");
        $(this).text("Copied");
        // 更新复制按钮文本
        setTimeout(() => {
            $(this).removeClass("copied");
            $(this).text("Copy");
        }, 2000);
        $(target).remove();
    });
}

function addConversionButton() {
    // 添加按钮到题目部分
    $('.subject-question').each(function () {
        let id = "_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
    });

    // 添加按钮到pre部分
    $('pre').each(function () {
        let id = "_pre_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
    });

    // 添加按钮到题解部分
    $('div.nc-post-content').each(function () {
        let id = "_nc-post-content_" + getRandomNumber(8);
        addButtonPanel(this, id, "this_level");
        addButtonWithHTML2MD(this, id, "this_level");
        addButtonWithCopy(this, id, "this_level");
    });
};

window.onload = function () {
    addConversionButton();
}