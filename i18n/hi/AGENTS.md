# OJBETTER REFERENCE REPO GUIDE

## OVERVIEW

Upstream reference checkout.
Tampermonkey script project, not the active implementation target in this workspace.
Use it to study legacy behavior and feature scope, then port the right ideas into `/workspace/ojbetter/`.

## STRUCTURE

- `script/` — released and dev userscript outputs
- `resources/` — script assets and bundled resources
- `i18n/` — translation-localized README variants and language content
- `docs/` — supporting documentation
- `OJBetter_Bridge/` — bridge-side tooling and local workspaces
- `tools/` — repo-local helper scripts and utilities

## WHERE TO LOOK

| Task                             | Location                     | Notes                                                                        |
| -------------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| Understand feature surface       | `README.md`                  | Lists major user-facing features                                             |
| Compare published userscripts    | `script/`                    | Release vs dev outputs                                                       |
| Check assets and static payloads | `resources/`                 | Useful for migration reference                                               |
| Review translation footprint     | `i18n/`                      | Large subtree; translation work is already considered done in this workspace |
| Inspect bridge/tooling ideas     | `OJBetter_Bridge/`, `tools/` | Reference only unless explicitly targeted                                    |

## CONVENTIONS

- Treat this repo as read-mostly migration context.
- Port desired behavior into `/workspace/ojbetter/` instead of editing this checkout by default.
- Reuse only the parts that still fit current priorities: non-translation, non-localization feature parity.
- If a task explicitly targets this nested repo, keep changes local and do not let them spill into parent guidance.

## ANTI-PATTERNS

- Doing default feature work here instead of in `/workspace/ojbetter/`.
- Reopening translation or localization migration as the main goal.
- Treating bridge or tooling directories as shared runtime code for `wavext/` without proving reusability first.
- Assuming this repo follows the same build/runtime structure as the MV3 extension in `ojbetter/`.

## NOTES

- This directory has its own `.git/` boundary and should be treated as an independent nested repo.
- `temp/AGENTS.md` remains the parent policy file; this child file narrows it to the upstream OJBetter checkout.
