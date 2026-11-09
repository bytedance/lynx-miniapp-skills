# Lynx Miniapp CSS/TTSS Diff

Decision document for generating, migrating, and reviewing TTSS for Lynx-rendered Douyin miniapp pages. The baseline is **webview-rendered Douyin miniapp TTSS**: any style a webview miniapp page can use is assumed to work unless this document marks it otherwise. Do not infer limits from browser CSS, WeChat miniapp, or generic Lynx docs.

## Contents

- [How to Use](#how-to-use)
- [CSS Hard Rules](#css-hard-rules)
- [Core Differences](#core-differences)
- [Capability Tables](#capability-tables)
- [Common Alternatives](#common-alternatives)
- [Legacy Lynx Layout in Existing Code](#legacy-lynx-layout-in-existing-code)
- [Review Checklist](#review-checklist)
- [Debug Order](#debug-order)
- [Evidence Drill-down](#evidence-drill-down)

## How to Use

1. Identify which capability area the input TTSS uses (display, flex, text, selectors, units, ...).
2. Check its status in the capability tables: ✅ supported, 🔁 diff, ⚠️ partial, 🚫 unsupported (semantics defined in compatibility-model.md).
3. If the status is 🔁/⚠️/🚫, rewrite following the listed alternative; prefer rewrites that stay valid webview miniapp TTSS so both render modes work.
4. For long-tail properties not listed here, check the evidence matrix in `css_support/properties.md`, `css_support/selectors.md`, and `css_support/layout.md` before judging. If neither source lists a restriction, preserve the webview behavior; for uncommon properties, note low confidence in review reports instead of inventing a support claim.
5. Judge values separately from properties: a property can be supported while a specific value, unit, or function of it is not (`white-space`, `text-overflow`, `flex-basis: min-content`, `steps(n)` are the canonical cases).

Silent failure warning: unsupported properties are stripped at template encode with a devtool warning ("Unsupported property 'float' was removed during template encode"), and unsupported selectors parse but never match. Nothing crashes — the style just doesn't apply. Treat encode warnings and never-match selectors as review failures.

## CSS Hard Rules

These are this document's own rules, numbered independently from the shared generation constraints. Cross-references below say "CSS Hard Rule N" for this list; shared rendering policies use named anchors in generation-constraints.md.

1. Never rely on webview default layout. Lynx's default `display` is `linear` (a Lynx-specific vertical layout), not block flow: children do not auto-fill parent width, and unstyled nested `view`s can collapse to size 0. Layout containers must declare `display: flex` plus explicit `flex-direction`, `justify-content`, `align-items`. Output stays on Web-baseline layout primitives (Flex/Grid): never emit `display: linear`, `linear-*`, or `relative-*` in output TTSS (generation-constraints.md#layout-output).
2. Generation quality rule: declare an explicit shrink policy on flex children — full three-value `flex: <grow> <shrink> <basis>` or explicit `flex-shrink` — because Lynx has no automatic min-content floor; protect non-compressible content with `flex-shrink: 0` or `min-width`/`min-height`. In review, a missing shrink declaration is a ⚠️ risky finding when content may be compressed, not an unsupported feature.
3. Keep `rpx` as the primary responsive unit. Lynx converts `rpx` exactly like webview miniapp (`value × screen_width / 750`); never convert `rpx` values during migration.
4. Never generate `@media`. Use `rpx`/`vw` fluid sizing or JS-driven class switching.
5. Never generate `::before`/`::after`, structural pseudo-classes (`:first-child`, `:nth-child()`, ...), or state pseudo-classes (`:checked`, `:disabled`). Use real TTML nodes and data-driven classes.
6. Page-level vertical scrolling requires a root `scroll-view` with `height: 100%` (generation-constraints.md#page-scrolling); webview's default document scrolling does not exist. Do not express real scrolling with `overflow`; use `overflow: hidden` only for clipping.
7. `z-index` requires a positioned element. Inside `scroll-view`, give the parent `position: relative; z-index: 0;` so z-indexed children keep following the scroll.
8. No SVG through CSS or `image`: no `url(*.svg)`, SVG data URIs, or SVG base64 in `background-image`/`mask-image`, and `image` does not render `.svg`. Use the Lynx-added `svg` component with explicit `width`/`height` in `style`.
9. Convert unsupported units before output: physical units (`cm`/`mm`/`in`/`pt`/`pc`) and `ch`/`ex` are not normalized at runtime (`1in = 96px` is the only safe conversion rule). Never emit negative `padding` — Lynx applies it instead of discarding it.
10. Animate with `transform` and `opacity` first; keep `@keyframes` simple.

## Core Differences

### 1. Default layout model

Webview miniapp `view`s follow block flow: children fill parent width and stack vertically. Lynx defaults to its own linear layout where children size to content.

```css
/* Webview: .child fills 200px automatically */
.parent { width: 200px; }

/* Lynx: make the layout explicit */
.parent {
  width: 200px;
  display: flex;
  flex-direction: column;
}
.child { width: 100%; }
```

Nested containers need an explicit size chain — every level declares its size or receives it from flex:

```css
.card { width: 100%; height: 240rpx; display: flex; flex-direction: column; }
.card-body { width: 100%; flex: 1 1 0; }
```

### 2. Page scrolling model

Webview pages scroll as a document; `onPageScroll`/`onReachBottom` and `tt.pageScrollTo` build on that. Lynx pages do not scroll by themselves — scrolling regions are `scroll-view` components (see Alternative 4.1). The related JS APIs and lifecycles are unsupported; route them through `api_diff.md` and `framework_diff.md`.

### 3. Box model defaults

Lynx initially uses `box-sizing: auto`, which normally resolves to `border-box`; legacy Web-aligned configuration can resolve it to `content-box`. Webview miniapp defaults to `content-box`. Set the box model explicitly so width, padding, and border calculations remain independent of configuration:

```css
/* Preserve webview sizing on migrated code */
* { box-sizing: content-box; }

/* Or normalize new code */
* { box-sizing: border-box; }
```

`box-sizing` only fixes size math; it does not fix block-flow, float, or percentage-chain differences.

### 4. Margin collapsing

Webview collapses adjacent vertical margins; Lynx always adds them.

```css
/* Webview: 20rpx gap (collapsed). Lynx: 40rpx gap. */
.a { margin-bottom: 20rpx; }
.b { margin-top: 20rpx; }

/* Fix: single-sided margins ... */
.b { margin-top: 0; }

/* ... or gap on a flex container */
.list { display: flex; flex-direction: column; gap: 20rpx; }
.list .item { margin: 0; }
```

Parent-child margins also do not collapse: when webview relied on a parent margin collapsing with the first child's margin, redistribute the values so the sum equals the webview visual gap.

### 5. Flex shrink and the missing content floor

Shrinkage distributes by `flex-shrink × base size`, and Lynx items shrink below their content size (as if `min-width: 0`/`min-height: 0` were set). Webview items stop at their content's minimum size. Consequences:

```css
/* Risky: relies on webview's content floor */
.label { width: 400rpx; flex-shrink: 1; }

/* Stable: uniform basis + explicit floors */
.main { flex: 1 1 0; min-width: 0; }
.icon { flex: 0 0 auto; }
```

Do not distribute overflow with different `flex-shrink` weights on different widths; use uniform-basis `flex-grow` ratios, explicit sizes, or `flex-shrink: 0`.

### 6. Text wrapping and ellipsis

Only `white-space: normal | nowrap` exist, and Lynx text may not wrap by default — set `white-space: normal` when wrapping matters. Single-line ellipsis needs the full trio plus a resolvable width:

```css
.one-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* container or self must have a definite width/max-width */
}
```

`word-break`, `overflow-wrap`/`word-wrap`, `text-transform`, `letter-spacing` (partial), and the `pre*` white-space values do not carry over; wrap/transform text in the data layer instead. Multi-line clamping: see Alternative 4.11.

#### Flex centering of text actions

Centering a component and centering the content drawn inside it are different operations. For a fixed-size text action, put the size, background, and Flex alignment on a `view`, with a `text` child carrying the label. Do not rely on Flex alignment on the `text` node itself to center its glyphs inside that box.

```html
<view class="action" bindtap="handleAction">
  <text class="action-label">Continue</text>
</view>
```

```css
.action {
  width: 200rpx;
  height: 72rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #2a66d9;
  border-radius: 16rpx;
}
.action-label { color: #ffffff; font-size: 28rpx; }
```

For Taro, express the same structure with `View` / `Text` and `onClick`; verify the compiled TTML/TTSS. Preserve disabled handling and interaction feedback when adapting existing controls. Keep native `button` when its form or open capabilities are required.

Use `image.mode` for fitting the image inside its bounds, and supported `input` / `textarea` rules for editing content. Do not treat their internal pixels, glyphs, or caret as ordinary Flex children. These distinctions do not prohibit the component itself from being a Flex item. See [component-specific guidance](component_diff.md#component-placement-and-internal-content); do not turn this recommended text-action structure into a universal non-container Flex error.

### 7. Fonts

Android does not support woff/woff2 fonts. Prefer system font stacks; if a custom font is required, replace woff/woff2 sources with base64-encoded data URIs or a verified format:

```css
@font-face {
  font-family: 'CustomFont';
  src: url("data:application/font-woff2;base64,...");
}
```

Treat `@font-face` as needing target verification on both platforms.

### 8. The `page` root

`page` exists as the root selector in Lynx TTSS, but do not assume webview's default page background/scroll behavior. Full-page background belongs on `page`; content-container background belongs on the root `view`. H5-derived styles that targeted `body` map to `page` (page-wide) or the root `view` (content area). When `html` and `body` have separate backgrounds, normally map them to `page` and the root `view` respectively. An ordinary `.body` view paints only its own layout bounds; it does not propagate a background to the viewport.

## Capability Tables

Columns: webview miniapp TTSS writing → Lynx status → difference → alternative.

### 3.1 Display

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| (no `display`, block flow) | 🔁 | Default is Lynx linear, not block flow | Declare `display: flex` + direction explicitly |
| `display: block` | 🔁 | Supported as a declaration, but carries no Web BFC semantics: no auto full-width children, no margin collapse | Preserve the declaration; audit children for width/margin assumptions. For layout-sensitive containers prefer explicit `display: flex` |
| `display: inline` | 🚫 | No inline text flow | Remove; style text through `text` nodes/classes |
| `display: inline-block` | 🚫 | No inline boxes | Flex row + `flex-wrap` (see 4.6) |
| `display: flex` | ✅ | Defaults differ (`justify-content: stretch`) | Declare direction/justify/align explicitly |
| `display: grid` | ✅ | Subset; placement shorthands require the public version boundary | See 3.3 |
| `display: table*` | 🚫 | No table layout algorithm | Grid (see 4.7) |
| `display: list-item` | 🚫 | No list markers | Real marker nodes |
| `display: contents` | 🚫 | Box cannot be skipped | Keep the container or flatten manually |
| `display: none` | 🔁 | Removes the parent from layout, but a `text` child can remain visible in the current Lynx rendering behavior | Put `display: none` and `overflow: hidden` on the same hidden parent selector |

When a hidden subtree contains `text`, keep the workaround scoped to the hidden state and apply both declarations to the same parent. Do not move `overflow: hidden` to the `text` child or a general visible-state container.

```html
<view class="panel {{hidden ? 'is-hidden' : ''}}">
  <text>{{message}}</text>
</view>
```

```css
.is-hidden {
  display: none;
  overflow: hidden;
}
```

### 3.2 Flex

> **Evidence drill-down:** flex defaults table and the shrink-algorithm details — `css_support/layout.md`.

| Capability | Lynx | Rule |
| --- | --- | --- |
| `flex-direction` / `flex-wrap` / `flex-flow` | ✅ | Declare direction explicitly |
| `justify-content` | 🔁 | Lynx default is `stretch`, webview default is `flex-start`; never rely on the default |
| `align-items` / `align-self` / `align-content` | ✅ | — |
| `flex-grow` | ✅ | — |
| `flex-shrink` | 🔁 | No auto min-content floor; declare per-item shrink policy when generating (CSS Hard Rule 2). In review, missing declarations are a ⚠️ risky finding, not unsupported |
| `flex-basis` | ⚠️ | `min-content` becomes `0px`, `max-content` becomes `auto`; use lengths or `auto` |
| `flex` shorthand | ✅ | Prefer full three-value form (`flex: 1 1 0`, `flex: 0 0 auto`) |
| `order`, `gap`/`row-gap`/`column-gap` | ✅ | Prefer `gap` for spacing |

```css
/* Recommended: everything explicit — defaults differ from webview */
.row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start; /* Lynx default is stretch, not flex-start */
  align-items: center;
  gap: 16rpx;
}
.row .main { flex: 1 1 0; min-width: 0; }  /* fills, may shrink, protected floor */
.row .icon { flex: 0 0 auto; }             /* never compressed */
```

### 3.3 Grid

> **Evidence drill-down:** grid tracks, placement, and alignment vocabulary — `css_support/layout.md`.

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `grid-template-columns/rows` (lengths, `fr`, `repeat()`) | ✅ | — | — |
| `grid-auto-columns/rows`, `grid-auto-flow` | ✅ | — | — |
| `gap` family | ✅ | — | — |
| `justify-items` / `justify-self` | ✅ | Values: `start`/`center`/`end`/`stretch` | — |
| `align-items` / `align-self` | 🔁 | Vertical alignment uses flex-style values | `flex-start`/`center`/`flex-end`/`stretch`/`baseline` |
| `grid-column`, `grid-row` placement shorthands | ⚠️ | Available when both Douyin client `>= 40.3.0` and miniapp base library `>= 4.30.0.0` | Prefer start/end longhands when either version is lower or unknown |
| `grid-area` shorthand | 🚫 | Unsupported | Split into start/end |
| Named lines, `subgrid` | 🚫 | — | Numeric lines; flatten structure |
| `minmax()` complex forms | ⚠️ | Intrinsic-size combos may diverge | Fixed lengths or `fr` |

Generated user-facing guidance must use only the public boundary: Douyin client `>= 40.3.0` and miniapp base library `>= 4.30.0.0`. Do not add non-public runtime, rollout, engine, or feature-flag interpretations.

```css
/* Available with Douyin client >= 40.3.0 and miniapp base library >= 4.30.0.0 */
.wide { grid-column: 1 / 3; }

/* Default-safe output when either public version is lower or unknown */
.wide { grid-column-start: 1; grid-column-end: 3; }
.wide-alt { grid-column-start: span 2; }  /* or: grid-column-span: 2 */
```

Grid children that contain shrinking text or scrollable content need the same explicit floors as flex items: `min-width: 0` / `min-height: 0`.

### 3.4 Position

> **Evidence drill-down:** stacking context and compositing behavior inside scroll containers — `css_support/layout.md`.

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `position: static` | 🚫 | Does not exist | Remove; default already behaves as non-static |
| `position: relative` / `absolute` | ✅ | Declare offsets explicitly for absolute | — |
| `position: fixed` | 🔁 | Missing/auto `left` or `top` resolves to viewport zero on that axis rather than the Web static-flow position; specify offsets explicitly. Fixed to the viewport, but inside `scroll-view` the reference frame can shift to the scroll context and stacking is affected by the container | For generation, prefer fixed elements as siblings of the root `scroll-view` and pair with `env(safe-area-inset-*)` (4.12). For an existing interaction failure, treat moving the element as a structural candidate and follow `interaction_failure_diagnosis.md` before recommending it. |
| `position: sticky` | 🔁 | Supported; requires a scrolling container — in Lynx miniapp that means inside `scroll-view` (webview sticks to the page scroll) | Place sticky elements inside the root `scroll-view` (4.3) |
| `z-index` | 🔁 | Needs positioned element; compositing can detach children from scroll | CSS Hard Rule 7 |
| `inset-inline-start/end` | ✅ | Logical insets for RTL | — |

For a visible-but-untappable element, these positioning and stacking
differences are candidate causes, not confirmed root causes. Static structure
cannot prove which node wins runtime event hit testing. A hit test that returns
an ancestor or sibling proves only that the intended target did not win that
tap. Use the consumer workflow’s interaction executor and
`interaction_failure_diagnosis.md` for environment-scoped hit testing,
controlled experiments, and causal confidence. Do not claim that raising
`z-index`, changing `pointer-events`, removing a sibling, or restructuring the
fixed element cannot work unless that exact mutation was tested in the failing
environment.

```css
/* z-indexed children inside scroll-view can stop following the scroll (CSS Hard Rule 7) */
.list-header {
  position: relative;
  z-index: 0; /* parent establishes the stacking context */
}
.list-header .badge {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  z-index: 10; /* now follows the scroll with its parent */
}
```

### 3.5 Box Model

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `width`/`height`, min/max variants | ✅ | Percentages need an explicit parent size chain | Build the chain or use flex |
| `aspect-ratio` | ✅ | — | Good for media placeholders |
| `margin` | 🔁 | No collapsing; negative margins work | Single-sided margins or `gap` (see Core 4) |
| `padding` | 🔁 | Negative values are applied, not discarded | Never emit negative padding |
| `border*`, `border-radius`, logical radii | ✅ | — | — |
| `box-sizing` | 🔁 | Initial `auto`: normally `border-box`, legacy Web-aligned configuration may use `content-box`; webview defaults to `content-box` | Set explicitly (see Core 3) |
| `box-shadow` | ✅ | — | — |
| `overflow` | ⚠️ | `hidden` clips; real scrolling is not expressed via CSS | `scroll-view` for scrolling; `overflow: hidden` for clipping/ellipsis |
| `clip-path` / `mask-image` | ⚠️ | Complex shapes/masks need target verification; no SVG sources | Simplify or use bitmap assets |

```css
/* overflow is for clipping only — real scrolling belongs to scroll-view (4.1/4.2) */
.thumb-wrap { overflow: hidden; border-radius: 16rpx; }

/* Never emit negative padding: webview discards it, Lynx applies it */
.bad { padding-bottom: -2rpx; }
.fixed { padding-bottom: 0; }
```

### 3.6 Text

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `color`, `font-size`, `font-weight`, `font-style`, `line-height`, `text-align`, `text-decoration` | ✅ | — | — |
| `font-family` | ⚠️ | Platform fonts; Android has no woff/woff2 | System stacks first (Core 7) |
| `white-space: normal / nowrap` | 🔁 | Only these two; wrapping may need explicit `normal` | Set explicitly on text that must wrap |
| `white-space: pre / pre-wrap / pre-line / break-spaces` | 🚫 | — | Real line-break nodes or preprocessed text |
| `text-overflow: clip / ellipsis` | ✅ | Only these values (`fade` unsupported) | Pair with nowrap + overflow + width |
| `-webkit-line-clamp` / `display: -webkit-box` | 🚫 | Webview-only multi-line clamp | See 4.11 |
| `word-break` / `overflow-wrap` / `word-wrap` | 🚫 | Stripped at encode | Control container width and `white-space` |
| `text-transform` | 🚫 | — | Transform in the data layer |
| `letter-spacing` / `word-spacing` | ⚠️/🚫 | `letter-spacing` partial, `word-spacing` unsupported | Verify on target or adjust content/layout |
| `text-indent` | ⚠️ | Partial | Padding/margin indent |
| `vertical-align` | ⚠️ | Not a layout tool | Flex alignment |
| `writing-mode` / `text-orientation` / `unicode-bidi` / `hyphens` / `tab-size` | 🚫 | — | Data-layer handling; `transform` rotation if truly needed |
| `direction: ltr / rtl` | ✅ | Pair with logical properties for RTL | — |

```javascript
// text-transform is stripped — transform in the data layer instead
this.setData({ label: rawLabel.toUpperCase() }); // instead of text-transform: uppercase
```

### 3.7 Selectors

> **Evidence drill-down:** full selector/pseudo-class matrix, including every parse-but-never-match selector — `css_support/selectors.md`.

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| tag / class / ID / universal | ✅ | — | Prefer classes |
| descendant / child / sibling / group | ✅ | General sibling: keep simple | — |
| `[attr]`, `[attr='v']` | 🚫 | Parse but never match for styling | Explicit state classes |
| `[attr*=]`, `[attr^=]`, `[attr$=]` | 🚫 | Parse but never match for styling | Explicit state classes |
| `[attr~='v']`, `[attr|='v']` | 🚫 | Parse but never match for styling | Classes; use `.active` for class-token matching |
| `:active`, `:focus`, `:root`, `:not()` | ✅ | Don't nest unsupported selectors in `:not()` | — |
| `:hover` | ⚠️ | Platform dependent | Never the only feedback on mobile |
| `::placeholder`, `::selection` | ✅ | — | — |
| `:first-child`, `:nth-child()`, all structural | 🚫 | Parse but never match — silent | Index classes via `tt:for` (4.9) |
| `:checked`, `:disabled`, `:enabled` | 🚫 | Parse but never match | State classes from data (`.disabled`) |
| `:is()`, `:where()`, `:has()` | 🚫 | — | Expand to explicit classes |
| `::before`, `::after`, `::first-line`, `::first-letter`, `::marker`, `::backdrop` | 🚫 | Parse but never render | Real nodes (4.8) |
| `html` / `body` type selectors | 🚫 | No such nodes in the TTML tree — never match | Map to `page` / root `view` (Core 8) |
| `::v-deep` / `>>>` / `/deep/` scoped-style escapes | 🚫 | Framework-source syntax, not TTSS | Resolve at framework source (`third_party_framework_diff.md`) |

DOM node-query attribute syntax is a separate capability and does not prove TTSS support or miniapp API availability. The generic engine query subset uses unquoted attribute values; details and miniapp routing are in `css_support/selectors.md`.

```css
/* :disabled / :checked parse but never match — bind state classes from data (4.9) */
.button.disabled { opacity: 0.5; }
.checkbox.checked { border-color: #ff4d4f; }
```

### 3.8 Units and Values

> **Evidence drill-down:** full unit/value/color support matrix — `css_support/properties.md`.

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `rpx` | ✅ | Identical 750-based conversion | Keep as-is; primary responsive unit |
| `px`, `%`, `vw`, `vh`, `rem`, `em` | ✅ | `%` needs a resolvable size chain; content-sized `auto`/`fit-content`/`max-content` ancestors can create cycles | Set explicit ancestor sizes or use Flex space allocation; check intervening Linear/text measurement (`css_support/layout.md`) |
| `vmin` / `vmax` | ⚠️ | Inconsistent | `vw`/`vh` |
| `cm`/`mm`/`in`/`pt`/`pc` | 🚫 | Not normalized at runtime | Convert first (`1in = 96px`) |
| `ch` / `ex` | 🚫 | — | `px`/`em`/`rem` |
| `max-content` | ✅ | — | — |
| `fit-content` | ⚠️ | Works in normal flow; on absolute boxes stretched by opposing insets, `max-height`/`max-width: fit-content` does not constrain size | Explicit `height`/`width` |
| `min-content` | 🚫 | Unsupported for intrinsic `width`/`height`; parses as `0px` inside `flex-basis` | `auto` or fixed values |
| `currentColor` | ⚠️ | Partial | Explicit colors / CSS variables |
| `oklch()` / `lab()` / `color-mix()` and other modern color functions | 🚫 | Absent from the support matrix | Resolve to hex/`rgb()`/`hsl()` before output |
| `inherit` / `initial` / `auto` / `none` | ✅ | — | — |

```css
/* Keep rpx exactly as written in webview TTSS */
.card { width: 340rpx; padding: 24rpx; }

/* Convert physical units before output — not normalized at runtime */
.stamp { width: 0.25in; }  /* webview input */
.stamp { width: 24px; }    /* Lynx output: 1in = 96px */
```

### 3.9 Functions

> **Evidence drill-down:** the complete `calc()` allowlist and timing-function facts — `css_support/properties.md`.

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `calc()` | ⚠️ | Length properties only | No calc on enum/color/integer/radius/transform |
| `var()` | ✅ | Theming tokens | — |
| `env(safe-area-inset-*)` | ✅ | Only the four safe-area values | — |
| other `env()` | 🚫 | — | Platform API / JS |
| `min()` / `max()` / `clamp()` | 🚫 | — | Explicit sizes, `rpx`, or JS classes |
| `linear-gradient()` / `radial-gradient()` | ✅ | Keep simple | — |
| `cubic-bezier()` | ✅ | Out-of-range control points extrapolate instead of clamping | Stay in `[0,1]` unless verified |
| `steps(n)` without direction | 🚫 | Invalid | `steps(n, end)` etc. — direction mandatory |
| timing keywords | 🔁 | `ease` ≡ `ease-in-out` ≡ `ease-in-ease-out` internally | Explicit `cubic-bezier()` for exact webview parity |

```css
/* calc(): length properties only */
.card {
  width: calc(100% - 32rpx);
  margin-inline-start: calc(var(--space) * 2);
}

/* Never on enum / color / integer / radius / transform values */
.bad {
  flex-direction: calc(row);
  z-index: calc(10);
  border-radius: calc(8rpx + 2rpx);
}

/* steps() must carry a direction */
.ticker { animation-timing-function: steps(5, end); }  /* steps(5) alone is invalid */
```

### 3.10 At-rules

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `@media` | 🚫 | Never takes effect | `rpx`/`vw` fluid sizing or JS classes (4.4) |
| `@supports` / `@layer` / `@charset` / `@namespace` / `@container` / `@scope` | 🚫 | — | Build-time or runtime branching |
| `@import` | ⚠️ | Build-chain dependent | Project build imports |
| `@font-face` | ⚠️ | Platform dependent; Android no woff/woff2 | System fonts or verified formats |
| `@keyframes` | ⚠️ | Basics fine, advanced combos unverified | Simple keyframes, transform/opacity |

### 3.11 Animation

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `transition*` | ✅ | — | Prefer transform/opacity |
| `animation*` | ⚠️ | Common properties fine; verify complex combos | Keep simple |
| `transform` | ⚠️ | `scale3d`/`rotate3d` invalidate the entire transform declaration; affected transform keyframes are omitted | Use `scale(x, y)`, `rotateX/Y/Z`, or `matrix3d`; `translate3d` remains supported |
| `transform-origin`, `opacity` | ✅ | Preferred animated properties | — |
| `transform-style` | 🚫 | No 3D contexts | Flatten |
| `perspective` | ⚠️ | Verify | Simplify 3D |
| `will-change` | ⚠️ | Optimization effect unverified | Reduce animated area instead |
| width/height/margin animation | ✅ | Triggers layout | Prefer transform/opacity |

```css
/* Preferred: transform/opacity transitions */
.button { transition: transform 0.2s ease, opacity 0.2s ease; }
.button:active { transform: scale(0.98); opacity: 0.8; }

/* Simple keyframes are safe; verify advanced combos on device */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-in { animation: fade-in 0.3s ease-out; }
```

Skeleton shimmer: an opacity pulse is the cheapest form; the documented `background-position` shimmer works but animates layout-adjacent properties — avoid it in long lists.

Note: JS animation APIs (`tt.createAnimation`, `Canvas.requestAnimationFrame`) are unsupported — see `api_diff.md`. CSS transitions/animations are the replacement.

### 3.12 Background and Visual

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `background` shorthand | ⚠️ | Attachment slots don't carry over | Expand into longhand properties |
| `background-color/-image/-size/-position/-repeat/-origin/-clip` | ✅ | No SVG sources (CSS Hard Rule 8) | Gradients or bitmap assets |
| `background-attachment` | 🚫 | No scroll-binding semantics | Drop the slot; keep the rest |
| small repeated bitmap backgrounds | ⚠️ | Some Android display scale factors expose approximately 1 px seams between tiles | Larger seamless assets, solid colors, or separate `image`/`view` layers |
| image-bearing `background` shorthand without clip/origin | 🔁 | Image layer may paint relative to `padding-box` even though the `background-clip` longhand default is `border-box`; dotted/dashed borders can expose the underlay | Split longhands and set `background-clip: border-box`; alternatively use a solid border or separate outer background/border and inner image |
| multi-layer `background-image` with `none` slots | 🔁 | `none` placeholder breaks list alignment | Remove layer + realign lists, or nest `view`s |
| `opacity`, `visibility` | ✅ | Use `display: none` to remove layout | — |

```css
/* Webview shorthand carrying an attachment slot */
.box { background: url('bg.png') 0 0 / cover no-repeat fixed #fff; }

/* Lynx: expand longhands, drop the attachment slot */
.box {
  background-image: url('bg.png');
  background-position: 0 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: #fff;
}
```

### 3.13 Interaction and Scroll CSS

| Webview TTSS | Lynx | Difference | Alternative |
| --- | --- | --- | --- |
| `pointer-events` | 🚫 | — | Conditional rendering / event handling |
| `cursor` | 🚫 | Touch platform | State-class feedback |
| `user-select` | ⚠️ | Verify on target | Component/platform capability |
| `resize` | 🚫 | — | JS-driven sizing |
| `scroll-behavior` | 🚫 | — | `scroll-view` attributes/APIs |
| `scroll-snap-*` | 🚫 | No CSS snap | `swiper` for carousels/paging |
| `overscroll-behavior` | 🚫 | — | `scroll-view` `bounces` attribute (see `component_diff.md`) |

### 3.14 Lists, Counters, Generated Content, Tables

All 🚫: `content`, `quotes`, `counter-*`, `list-style-*`, `caption-side`, `table-layout`, `border-collapse`, `border-spacing`, `empty-cells`. Alternatives: real marker nodes, data-layer numbering, grid layout (4.7).

Also 🚫 (absent from the Lynx support matrix, layout-critical): multi-column layout (`columns`, `column-count`, `column-width`, `column-rule*`, `column-span`, `column-fill` — `column-gap` itself stays valid in flex/grid) → rewrite as grid columns or flex wrap; CSS shapes (`shape-outside`, `shape-margin` — float-dependent and float is unsupported) → rewrite with explicit layout.

## Common Alternatives

Scenario index by domain — layout & scrolling: 4.1 page scroll, 4.2 horizontal scroll, 4.3 sticky header, 4.5 float, 4.6 inline-block, 4.7 table, 4.10 margin collapse, 4.12 fixed bar + safe area; responsive & theming: 4.4 @media, 4.13 dark mode; text & generated content: 4.8 pseudo-elements, 4.9 structural pseudo-classes, 4.11 multi-line ellipsis.

### 4.1 Page-level scrolling → root scroll-view

Webview pages scroll by default; Lynx pages need an explicit scroll container filling the page.

```html
<!-- page.ttml -->
<scroll-view scroll-y="{{true}}" class="page-scroll">
  <view class="page-content">...</view>
</scroll-view>
```

```css
page { height: 100%; }
.page-scroll { height: 100%; }
.page-content { display: flex; flex-direction: column; }
```

`onPageScroll`/`onReachBottom` don't fire; use `scroll-view` `bindscroll`/`bindscrolltolower` instead (see `framework_diff.md`).

### 4.2 Horizontal scrolling → scroll-view + single flex-row track

Wrap all scrollable content in one child `view` laid out as a flex row with an explicit total width.

```html
<scroll-view scroll-x="{{true}}" class="h-scroll">
  <view class="h-track">
    <view class="h-card"></view>
    <view class="h-card"></view>
    <view class="h-card"></view>
  </view>
</scroll-view>
```

```css
.h-scroll { width: 100%; height: 220rpx; }
.h-track {
  display: flex;
  flex-direction: row;
  width: 900rpx; /* explicit total width */
}
.h-card { width: 300rpx; height: 200rpx; flex: 0 0 auto; }
```

Official docs demonstrate this track with Lynx linear layout; this skill standardizes on one direct Flex row wrapper per the Web-baseline layout output policy (CSS Hard Rule 1). Keep the explicit total width on the track, lock cards with `flex: 0 0 auto`, and avoid extra wrapper levels between `scroll-view` and the track.

### 4.3 Sticky header inside scroll-view

Webview sticks to page scroll; Lynx sticky only works inside the scroll container.

```html
<scroll-view scroll-y="{{true}}" class="page-scroll">
  <view class="section">
    <view class="section-header">Header</view>
    <view class="section-body">...</view>
  </view>
</scroll-view>
```

```css
.page-scroll {
  position: relative;
  z-index: 0; /* stacking context so sticky/z-indexed children follow the scroll */
}

.section-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
}
```

### 4.4 @media → rpx fluid sizing or JS class switching

```css
/* Webview (dropped in Lynx) */
@media (min-width: 768px) { .card { width: 50%; } }

/* Lynx: fluid by rpx (scales with screen width by design) */
.card { width: 340rpx; }

/* Or flex-wrap fluid columns */
.cards { display: flex; flex-wrap: wrap; gap: 24rpx; }
.card { flex: 1 1 40vw; min-width: 0; }
```

For genuine breakpoint behavior, compute a class in JS (screen info from app/page context) and switch `class="layout wide"` / `class="layout narrow"` in TTML. Note `tt.matchMedia`/`MediaQueryObserver` are unsupported (see `api_diff.md`) — derive breakpoints from window info APIs instead.

### 4.5 float → flex

```css
/* Webview */
.avatar { float: left; margin-right: 16rpx; }

/* Lynx (float is stripped at encode) */
.profile { display: flex; flex-direction: row; align-items: center; gap: 16rpx; }
.avatar { width: 80rpx; height: 80rpx; flex: 0 0 auto; }
.name { flex: 1 1 0; min-width: 0; }
```

### 4.6 inline-block tags → flex wrap

```css
/* Webview */
.tag { display: inline-block; padding: 8rpx 16rpx; }

/* Lynx */
.tags { display: flex; flex-direction: row; flex-wrap: wrap; gap: 16rpx; }
.tag { padding: 8rpx 16rpx; flex: 0 0 auto; }
```

### 4.7 table → grid

```css
/* Webview */
.table { display: table; border-spacing: 2rpx; }
.cell { display: table-cell; width: 100rpx; height: 60rpx; }

/* Lynx */
.table { display: grid; grid-template-columns: repeat(3, 100rpx); gap: 2rpx; }
.cell { height: 60rpx; border: 1rpx solid #eee; }
```

Not reproducible: table auto column-width distribution, `table-cell` vertical-align semantics, exact `border-collapse` rendering.

### 4.8 ::before/::after → real nodes

```html
<!-- Webview relied on .label::before { content: '*'; color: red; } -->
<view class="label">
  <text class="required">*</text>
  <text>{{labelText}}</text>
</view>
```

```css
.label { display: flex; flex-direction: row; gap: 4rpx; }
.required { color: red; }
```

Special case: hiding the native button border with `button::after { border: none; }` never works in Lynx — use the Lynx-added `hide-border` attribute on `button` (see `component_diff.md`).

### 4.9 Structural pseudo-classes → tt:for index classes

```html
<view
  tt:for="{{items}}"
  tt:key="id"
  class="item {{index === 0 ? 'first' : ''}} {{index % 2 === 1 ? 'even' : ''}}"
>
  <text>{{item.name}}</text>
</view>
```

```css
.item.first { margin-top: 0; }
.item.even { background-color: #f5f5f5; }
```

Same pattern replaces `:checked`/`:disabled`: bind state classes from data (`class="checkbox {{checked ? 'checked' : ''}}"`).

### 4.10 Margin-collapse compensation

```css
/* Webview visual gap: max(24rpx, 32rpx) = 32rpx; Lynx would render 56rpx */
.section { margin-bottom: 24rpx; }
.next-title { margin-top: 32rpx; }

/* Fix: keep only the larger one */
.section { margin-bottom: 0; }
.next-title { margin-top: 32rpx; }
```

Prefer `gap` on flex containers for list rhythm; audit parent+first-child margins the same way.

### 4.11 Multi-line ellipsis

`display: -webkit-box` + `-webkit-line-clamp` does not carry over. Options, in order:

1. Single-line ellipsis per line (3.6 trio) when the design tolerates it.
2. Fixed-height clipping: compute a fixed `max-height` equal to line count times line height (e.g. `line-height: 40rpx`, 2 lines → `max-height: 80rpx`) plus `overflow: hidden` — truncates without an ellipsis character.
3. Data-layer truncation: cut the string in JS and append `…`.

Generic Lynx docs document a `text-maxline` attribute on the `text` element for multi-line truncation (`<text text-maxline="2">`). Whether the miniapp `text` component passes it through is unverified — use it only after confirming on a target device and record the evidence; otherwise stick to the options above.

### 4.12 Fixed bottom bar + safe area

```css
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: #fff;
}
/* Reserve space at the end of the scroll content */
.page-content { padding-bottom: 120rpx; }
```

Structure: keep the fixed bar a **sibling** of the root `scroll-view` (both children of the page root), not a child of it — inside `scroll-view` the fixed reference frame can shift to the scroll context (§3.4). For horizontal safe areas (landscape/notch), add `padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);`.

### 4.13 Theme switching (dark mode) → root class + CSS variables

Webview theming built on `@media (prefers-color-scheme: dark)` never fires in Lynx (§3.10), and `tt.matchMedia` is also unsupported. Drive themes with CSS variables scoped by a root class toggled from data:

```html
<view class="app-root {{theme === 'dark' ? 'theme-dark' : ''}}">
  <view class="card"><text class="card-text">{{title}}</text></view>
</view>
```

```css
.app-root {
  --color-bg: #ffffff;
  --color-text: #333333;
}
.app-root.theme-dark {
  --color-bg: #121212;
  --color-text: #e0e0e0;
}
.card { background-color: var(--color-bg, #ffffff); }
.card-text { color: var(--color-text, #333333); }
```

Provide `var()` fallbacks so components stay readable if a token fails to resolve.

Resolve the initial theme in JS from the project's theme source (system info API or project config) and `setData` it; never gate theme styles on `@media` or media-query observers.

## Legacy Lynx Layout in Existing Code

> **Evidence drill-down:** Linear/Relative property semantics and the Linear→Flex mapping table — `css_support/layout.md`.

Existing Lynx miniapp pages may already use Lynx-specific layout. Policy: this skill's CSS output stays on Web-baseline layout primitives and never contains Linear/Relative (CSS Hard Rule 1); legacy occurrences are recognized as input and rewritten.

- `display: linear` + `linear-*` properties: flag as Lynx-specific non-Web layout per the output policy and rewrite to flex using the mapping table in `css_support/layout.md` (`linear-weight: N` → `flex: N 1 0`, `linear-orientation: horizontal` → `flex-direction: row`, gravity values → justify/align). Horizontal `scroll-view` tracks rewrite to the 4.2 flex-row pattern. When the user explicitly limits the review scope away from layout, report the occurrence instead of silently rewriting.
- `display: relative` + `relative-*` properties: same policy — recognize via `css_support/layout.md`, rewrite to flex rows/columns or `position: absolute` anchoring.
- Never introduce Linear/Relative in newly generated TTSS (generation-constraints.md#layout-output, no exceptions).

## Review Checklist

- [ ] Layout containers declare `display: flex` with explicit direction/justify/align; nothing relies on block flow or Lynx linear defaults.
- [ ] No `display: linear`, `linear-*`, `display: relative`, or `relative-*` in the output; legacy occurrences are flagged and rewritten to flex.
- [ ] Generated flex children declare an explicit shrink policy; non-compressible content has `flex-shrink: 0` or a min size (missing shrink intent in reviewed code is a ⚠️ risky finding, not unsupported).
- [ ] No `display: inline/inline-block/table*/list-item/contents`; no `float`/`clear`; no explicit `position: static`. `display: block` may be preserved, with its BFC/auto-width/margin-collapse assumptions audited (§3.1).
- [ ] A hidden parent containing `text` pairs `display: none` with `overflow: hidden` in the same hidden-state selector; the workaround is not placed on the text child or a global visible-state container.
- [ ] No margin-collapse reliance; parent+child margins audited; `gap` preferred.
- [ ] No negative padding.
- [ ] `box-sizing` set explicitly on migrated code.
- [ ] Page scrolling uses root `scroll-view` with `height: 100%`; no `overflow`-based scrolling; sticky only inside `scroll-view`.
- [ ] `z-index` paired with `position`; scroll-container parents get `z-index: 0` when children are layered.
- [ ] A visible-but-untappable target is diagnosed through runtime hit testing and controlled experiments; `fixed`, scroll nesting, and stacking structure remain candidate causes until the failing environment supplies causal evidence.
- [ ] `rpx` values preserved un-converted; no physical units, `ch`/`ex`; no `min()`/`max()`/`clamp()`; `calc()` only on allowlisted length properties.
- [ ] No `@media`; responsive via `rpx`/`vw` or JS classes.
- [ ] No structural/state pseudo-classes or pseudo-elements; index/state classes bound in TTML.
- [ ] Text wrap/ellipsis handled with the supported `white-space`/`text-overflow` subset; no `-webkit-line-clamp`; no `word-break`/`text-transform`.
- [ ] No SVG via CSS or `image`; `svg` component used with explicit width/height; images have explicit size or `aspect-ratio`.
- [ ] `background` shorthands expanded; no `background-attachment`; no `none` placeholder layers.
- [ ] No `pointer-events`/`cursor`/`resize`/`scroll-behavior`/`scroll-snap-*`/`overscroll-behavior`.
- [ ] No table/list/counter/generated-content properties.
- [ ] Android font constraint respected (no woff/woff2 dependence).
- [ ] Animations prefer transform/opacity; `steps()` always has a direction; timing-critical curves use explicit `cubic-bezier()`.
- [ ] For findings where a visual check can pass while behavior or platform support is still wrong (sticky layering, fonts, animation pacing), suggest explicit `test_steps` or device verification instead of a visual-only conclusion.

## Debug Order

1. Encode warnings first: any "Unsupported property ... removed" devtool warning identifies stripped declarations.
2. Check block-flow assumptions: missing `display: flex`, children not filling width, empty `view`s collapsing to 0.
3. Check the size chain: percentage heights, nested containers, `scroll-view` height.
4. Check flex shrink: missing shrink policy, content compressed below its minimum, different-width + different-shrink patterns.
5. Check margins for missing collapse compensation.
6. Check selectors against the parse-but-never-match list (`css_support/selectors.md`).
7. Check grid shorthands (`grid-column`/`grid-row`/`grid-area`/`span` forms).
8. Check webview-only writing: `@media`, `::before`/`::after`, `:nth-child()`, `-webkit-line-clamp`.
9. Check hidden text: if a `text` child remains visible after its parent is hidden, pair `display: none` and `overflow: hidden` on that same hidden parent selector.
10. Check text: `white-space: normal` where wrapping is expected; ellipsis trio complete; width resolvable.
11. Check images/SVG: explicit sizes; no SVG through CSS/`image`.
12. Check `z-index`: positioned, and scroll-follow behavior in `scroll-view` (parent `z-index: 0`). If the symptom is failed tapping rather than visual or scroll divergence, continue through `interaction_failure_diagnosis.md`; do not promote this static check to a confirmed root cause.
13. Check units and functions: `rpx` intact, no unsupported units, `calc()` within allowlist, `steps()` direction.
14. Still diverging: confirm on-device (render mode, platform), then consult `css_support/` and report gaps to a maintainer.

## Evidence Drill-down

One file per evidence domain. Migration patterns ("how to rewrite") are **not** evidence — they live in §4 of this document; the evidence layer holds support facts only.

- `css_support/properties.md` — base CSS capabilities: property/value/unit allowlist, calc() allowlist, timing functions, at-rules.
- `css_support/selectors.md` — selectors: full matrix, parse-but-never-match enumeration.
- `css_support/layout.md` — layout semantics: flex defaults/shrink algorithm, grid details, Linear/Relative recognition, stacking-context scroll issues.
