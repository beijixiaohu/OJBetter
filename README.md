# OJBetter

OJBetter 是一个 Tampermonkey 脚本项目，旨在提升你在各个在线评测系统（OJ）网站的使用体验。

通过增加多项实用功能，改善网站界面和用户交互，使你的编程竞赛之路更加高效、便捷。

------

[简体中文](README.md) | [繁體中文](i18n/zh-Hant/README.md) | [English](i18n/en/README.md) | [Deutsch](i18n/de/README.md) | [Français](i18n/fr/README.md) | [한국어](i18n/ko/README.md) | [Português](i18n/pt/README.md) | [日本語](i18n/ja/README.md) | [Español](i18n/es/README.md) | [Italiano](i18n/it/README.md) | [हिन्दी](i18n/hi/README.md)

------

## 安装

Codeforces Better：[GreasyFork](https://greasyfork.org/zh-CN/scripts/465777-codeforces-better) | [正式版](script/release/codeforces-better.user.js) | [测试版](script/dev/codeforces-better.user.js) 

## 主要功能

安装该脚本，你可以获得：

- 黑暗模式支持：为网站添加黑暗模式，夜晚刷题不伤眼
- 多语言网站翻译：将网站的主要文本替换成你选择的语言
- 便捷按钮：在页面中添加 `MrakDown` 、 `复制` 、`翻译` 按钮
- 题目翻译功能：点击 `翻译` 按钮，一键即可翻译为目标语言，同时确保不破坏Latex公式。
- Clist Rating 分数显示：从 clist.by 网站获取题目的 Rating 分数数据，并在题目页面中显示。
- 代码编辑器与 LSP 支持：在题目页的下方集成代码编辑器，支持自动保存、快捷提交、在线测试运行等功能。
- 洛谷快捷跳转：一键跳转到该题在洛谷对应的页面
- 评论区分页显示：改进评论区显示方式，支持翻页、跳转，可选择每页显示的主楼数。
- 榜单重新着色：根据“得分/总分”比例，对 Codeforces 赛制的比赛榜单进行颜色渐变着色。
- 一些其他小功能……

> [!NOTE]
>
> 点击 **整个页面右上角** 的 **`CodeforcesBetter设置`** 按钮，即可打开设置面板，
>
> 绝大部分功能均提供了帮助文本，鼠标悬浮在旁边的 问号图标 上即可查看。

## 使用文档

了解更多详细信息和使用指南，请访问 [Wiki 页面](https://github.com/beijixiaohu/OJBetter/wiki)。

## 如何贡献

如果你有任何想法或功能请求，欢迎通过 Pull Requests 或 Issues 与我们分享。

### 改善翻译质量

项目的非中文版本主要通过机器翻译（Deepl & Google）完成，托管在 Crowdin 上。

如果你愿意帮助改进翻译，使其更准确、自然，请访问 [Crowdin 项目页面](https://zh.crowdin.com/project/codeforcesbetter) 贡献你的力量。

## 支持其他OJ?

由于作者精力有限，并不会维护太多的类似脚本，

如果你有兴趣将此脚本适配到其他在线评测系统，非常欢迎，你只需要遵守 GPL-3.0 license 许可即可。