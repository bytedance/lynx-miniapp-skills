# Lynx Miniapp CSS Support Matrix: Selectors, Pseudo-classes, Pseudo-elements

Evidence reference for selector support checks. Enter from `css_diff.md`; this file is not a decision document.

The most important fact in this file: **many selectors parse without errors but never match**. A stylesheet full of `:first-child` or `::after` compiles silently and simply does nothing. Review must treat "parses but never matches" the same as unsupported.

## Working Selectors

| Selector | Status | Notes |
| --- | --- | --- |
| Tag (`view`, `text`, `image`, `page`) | supported | |
| Class (`.card`) | supported | Preferred selector form. |
| ID (`#header`) | supported | Prefer classes for reusable styles. |
| Universal (`*`) | supported | Broad matching; use deliberately (e.g. `* { box-sizing: ... }`). |
| Descendant (`.a .b`) | supported | |
| Child (`.a > .b`) | supported | |
| Adjacent sibling (`.a + .b`) | supported | |
| General sibling (`.a ~ .b`) | supported | Be careful in complex trees. |
| Group (`.a, .b`) | supported | |

## Attribute Selectors

Every stylesheet attribute selector is unsupported: presence (`[disabled]`), exact (`[type='text']`), substring (`[class*='active']`), prefix (`[attr^='v']`), suffix (`[attr$='v']`), token-list (`[attr~='v']`), and hyphen (`[attr|='v']`). The parser recognizes these forms, but the stylesheet matcher never applies them. Bind an explicit class to the state instead. Use `.active` for class-token matching; `[class*='active']` neither works for styling nor preserves token semantics because it also matches `inactive` in substring-based query systems.

Generic Lynx DOM node queries separately support a subset of unquoted attribute forms: `[attr]`, `[attr=value]`, `[attr*=value]`, `[attr^=value]`, and `[attr$=value]` over stored attributes or `data-*`. This query behavior does not imply stylesheet support, full Web selector syntax, or availability through a miniapp API. Check `api_diff.md` and `component_diff.md` for the miniapp query boundary.

## Working Pseudo-classes and Pseudo-elements

Only these seven have real matching behavior:

| Selector | Status | Notes |
| --- | --- | --- |
| `:not()` | supported | Do not nest unsupported selectors inside it: `:not(:last-child)` silently matches **every** element (the inner `:last-child` never matches anything, so nothing is excluded) — the "skip the last item" intent is lost and the style also hits the last item. |
| `:active` | supported | Primary touch-feedback state. |
| `:focus` | supported | Inputs. |
| `:hover` | partial | Platform dependent; never the only feedback channel on mobile. |
| `:root` | supported | Matches the page root; CSS variable scope. |
| `::placeholder` | supported | Input placeholder styling. |
| `::selection` | supported | Selected-text styling. |

## Parse-But-Never-Match Selectors

These are accepted by the CSS parser but the matcher does not implement them. No error, no effect.

- Structural: `:first-child`, `:last-child`, `:nth-child()`, `:nth-last-child()`, `:nth-of-type()`, `:nth-last-of-type()`, `:first-of-type`, `:last-of-type`, `:only-child`, `:only-of-type`, `:empty`
- Functional: `:is()`, `:where()`, `:has()`, `:lang()`, `:dir()`
- Link/state: `:link`, `:visited`, `:checked`, `:enabled`, `:disabled`, `:default`
- Pseudo-elements: `::before`, `::after`, `::first-line`, `::first-letter`, `::marker`, `::backdrop`

Also unsupported: `:target`, `:read-only`, `:read-write`, `:placeholder-shown`, `:indeterminate`, `:valid`, `:invalid`, `:in-range`, `:out-of-range`, `:required`, `:optional`, `:blank`, `::cue`, `::part()`, `::slotted()`, and `content` / `content: attr()` / `content: url()` generation.

Standard replacements (details and examples in `css_diff.md`):

- Structural pseudo-classes → index/state classes computed in TTML data (`tt:for` index) or JS.
- `:checked` / `:disabled` / `:enabled` → state classes toggled from data (`.checkbox.checked`, `.button.disabled`).
- `::before` / `::after` → real TTML nodes.

## Specificity

Priority order for matching selectors (high to low): inline `style=` > ID > class / pseudo-class > tag > universal. Attribute selectors may have a parsed specificity, but never match for styling.

## Notes for Migration Review

- A selector-support failure is silent: the UI renders with base styles and no console error. During review, grep the stylesheet for the parse-but-never-match list explicitly.
- Type selectors for Web-only nodes (`html`, `body`) never match: the TTML tree has no such elements. Map `body`-level styles to `page` or the root `view` (`css_diff.md` Core 8).
- Framework scoped-style escape selectors (`::v-deep`, `>>>`, `/deep/`) are not TTSS selectors. Resolve them at the framework source level before judging compiled output (`third_party_framework_diff.md`).
- Selector support here is about TTSS styling. JS node queries (`SelectorQuery`) have their own limits — see `api_diff.md` and `component_diff.md`.
