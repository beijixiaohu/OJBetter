## 1.13

> This update synchronizes changes from Codeforces Better v1.68 - 1.74 to AtCoder Better.

- Add button to jump to VJudge

- Add "beautify code block" function, use monaco editor to replace the pre code block on the page, this will also improve the code display effect in dark mode.

- Improvements to various request methods in Clist Rating to address issues where data was not fetched correctly

- Improve the prompt of ChatGPT translations and fix a possible injection error that could lead to incomplete translations.

- Improvements to LaTeX Replace/Restore related code, which now restores correctly in the case of multiple nesting

- Enhancing the robustness of website localization methods

- Adjusting the code related to dark mode, using variables to facilitate uniformity of style and management

- Replace CDN staticfile.org with staticfile.net

- Fix the problem that the clist rating of some topics on the question list page may be displayed as not found.

- Fix an issue where clist scores are displayed abnormally on the topic set page

- Fix the problem of unaligned difference comparison styles in code online testing

- Fix deepl 429 not displaying correct alert message after reporting an error

- Fixes the issue where the title page Clist Rating may show Not Found

- Fix for the Lobo jump method reporting errors in older versions of Tampermonkey

- Fix an unexpected dead loop that causes the page to get stuck when the MathJax library file is not loaded correctly

- Fixed the issue that DeepL did not correctly display the in-translation message when translating in free mode.

- Fix for scripts that may not load correctly

- Fixes an issue where typography between neighboring LaTeX formulas could be broken

- Some other tweaks and improvements

***

- Separate website localized data into external JSON for easy maintenance
- Scripts support internationalization and use the crowdin platform to automate localization efforts.
- Replace some buttons with icon buttons
- Add support for the DeepL API, including the official api-free, api-pro, and deeplx, thanks to @Vistarin for the suggestion!
- Add support for deepl and chatgpt to configure balance lookups, noting that this also requires your service provider to support and provide an API for it
- Add judgment on the text before translation, if it is suspected to be a code snippet, it will not be automatically translated, and a pop-up window will be prompted before clicking on the translation.
- Add the ability to select the target language for translation services
- Add an about page, as well as an update channel and update source selection item
- Add debugging maintenance page, including cache refresh, data clear, import and export
- Add custom option： 'Code Editor Submit Button Position', defaults to bottom, thanks to @lishufood for the suggestion!
- Improve each loading function, remove some unnecessary waiting relationships, speed up the script loading time
- Improvements to the translation function and the display of error messages.
- Improvements to the performance of automatic translations, as well as issues that may not be translated automatically
- Improvements to code samples related to running the code online
- Improved method for comparing differences in run results codeDiff()
- Improved dialog window background content no longer scrolls with the mouse.
- Improve the style of the code editor when it is fixed to the right side, bottom, and full screen, thanks to @lishufood for the suggestion!
- Improved display of .html2md-panel panel in simple mode
- Improved styling of the configuration page in the settings panel
- Fix acmsguru topic title page editor reporting errors
- Fix the problem with the issue page code editor reporting errors after switching between mobile/desktop versions of the site
- Fix a bug in the getMarkdown() method, which incorrectly stored data directly into the DOM, resulting in a performance degradation.
- Fix the problem that the translation button inside the folded block doesn't show up after turning off 'Folded Block Auto Expand', thanks to @MoYuToGo's feedback!
- Since the "Do not wait for page resources to fully load" option is theoretically meaningless, it was renamed to uncheck the previously possible state
- Adjustment of a large number of code structures
- **lots of css class renaming, so you may need to tweak that if you're using stylus custom styles**
- Some other adjustments and improvements

***

- Fix ChatGPT configuration panel not showing, thanks for the feedback @caoxuanming
- Add a configuration switch "Mouse Scroll Lock" which is enabled by default, thanks to @liuhao6 for the suggestion!

***

- Updated API for clist rating to v4, adjusted how data is fetched on title page to be fetched via API, thanks to @wrkwrk for the suggestion!
- Add ChatGPT translation "Streaming" option, enabled by default
- Fix Google Translate results are empty Thanks to @shicxin for the feedback!
- Add a configure switch "Double confirmation for code commits", on by default Thanks to @Rikkual for the suggestion!
- Buttons to add small areas to the full title set page
- Fix the problem that the translation results are not shown when the complete topic set page is right-clicked to print Thanks to @zfs732 for the feedback!

***

- Add a code editor at the bottom of the title page to support online code testing, code submission, etc. Please read the information page.
- Fixed the problem that when inserting script buttons and translating results, they were treated as changes to the title description.
- Improvement of the Chinese version of the portfolio mixing management page
- Add "Auto-translate short text" function, off by default.
- Improved implementation of translation wait intervals, now wait intervals take effect globally
- Improvement of the "Show target area range" implementation
- Improved dark mode, improved hover styles on sample elements Thanks to @SUPERLWR for the feedback!
- Add settings panel option: Translation - Filter \*\*signs in text Thanks to @Dog_E, CreMicro for their feedback!
- Fixed the issue that Clist Rating could not be displayed correctly after turning off "Show loading alerts", thanks to Vistarin's feedback.
- Some other improvements and fixes
