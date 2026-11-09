# Lynx Miniapp CSS Support Matrix: Properties, Values, Units

Evidence reference for long-tail TTSS/CSS property and value checks. Enter from `css_diff.md`; this file is not a decision document. When this matrix and `css_diff.md` disagree, `css_diff.md` wins and the conflict should be reported to a maintainer.

Scope: property/value/unit support facts for the Lynx render engine used by Lynx miniapp. Webview-rendered Douyin miniapp behavior is the migration baseline. Resolution for a property a webview page uses: marked unsupported/partial here → follow `css_diff.md`; absent here **and** absent from `css_diff.md` → preserve as Douyin behavior (Compatibility Model), flagging low confidence in review reports when the property is uncommon.

## Contents

- [Defaults That Differ From Webview Miniapp CSS](#defaults-that-differ-from-webview-miniapp-css)
- [Supported Properties](#supported-properties)
- [Unsupported Properties](#unsupported-properties)
- [Units and Values](#units-and-values)
- [Lynx-Specific Extensions (Recognize Only)](#lynx-specific-extensions-recognize-only)

## Defaults That Differ From Webview Miniapp CSS

| Item | Lynx default | Webview miniapp default |
| --- | --- | --- |
| `display` | `linear` (Lynx layout, vertical) | `block` flow layout |
| `box-sizing` | `auto`, normally `border-box`; legacy Web-aligned configuration may resolve to `content-box` | `content-box` |
| `position` | `relative`-like; `static` does not exist | `static` |
| `justify-content` (flex) | `stretch` | `flex-start` |
| Text wrapping | text may not wrap unless `white-space: normal` | wraps by default |
| Margin collapsing | never collapses; margins add up | collapses per CSS spec |
| Flex item min size | no automatic min-content floor (acts like `min-width: 0` / `min-height: 0`) | `min-width: auto` / `min-height: auto` |

## Supported Properties

### Layout

- `display: none | block | flex | grid | linear | relative`
  - Known rendering issue: when a parent uses `display: none`, a `text` child can remain visible. Pair `overflow: hidden` with `display: none` on the same hidden parent selector; do not put the workaround on the text child or a general visible-state container (`css_diff.md` §3.1).
  - `block` is supported as a declaration but carries no Web BFC semantics — no auto full-width children, no margin collapse (`css_diff.md` §3.1).
  - `linear` and `relative` are Lynx-specific layout models, recognized as legacy input only — never generated (output stays on Flex/Grid, `css_diff.md` Legacy section); property semantics in `layout.md`.
  - `display: inline`, `inline-block`, `table*`, `list-item`, `contents`, `run-in` are unsupported.
- Flex: `flex-direction`, `flex-wrap`, `flex-flow`, `justify-content`, `align-items`, `align-self`, `align-content`, `flex-grow`, `flex-shrink`, `flex-basis`, `flex`, `order`, `gap`, `row-gap`, `column-gap`. Details and defaults: `layout.md`.
- Grid: `grid-template-columns`, `grid-template-rows`, `grid-auto-columns`, `grid-auto-rows`, `grid-column-start/end`, `grid-row-start/end`, `grid-column-span` / `grid-row-span` (Lynx-specific), `grid-auto-flow`, `justify-items`, `justify-self`, `align-items`, `align-self`, `gap` family. `grid-column` / `grid-row` are available when both the Douyin client is `40.3.0` or later and the miniapp base library is `4.30.0.0` or later; otherwise use start/end longhands. Public guidance must use only those two public version boundaries. `grid-area`, named grid lines, and `subgrid` remain unsupported. Details: `layout.md`.
- Linear (Lynx-specific, recognize in legacy code): `linear-orientation`, `linear-direction`, `linear-gravity`, `linear-layout-gravity`, `linear-cross-gravity`, `linear-weight`, `linear-weight-sum`.
- Relative (Lynx-specific, recognize in legacy code): `relative-id`, `relative-align-top/bottom/left/right`, `relative-align-inline-start/end`, `relative-top-of` / `relative-bottom-of` / `relative-left-of` / `relative-right-of`, `relative-inline-start-of` / `relative-inline-end-of`, `relative-center`.

### Position

- `position: relative | absolute | fixed | sticky`
  - `position: static` is unsupported; do not emit it.
  - `sticky` only has meaning inside a scrolling container; in Lynx miniapp that means inside `scroll-view`. Verify on target device for layered cases.
- `top`, `right`, `bottom`, `left`
- `z-index` (requires positioned element; see stacking notes in `layout.md`)
- `inset-inline-start`, `inset-inline-end` (RTL)

### Box Model

- `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height`, `aspect-ratio`
- `margin` and per-side margins; `margin-inline-start/end` (RTL)
  - Negative margins work in both axes (pull-back / overlap).
- `padding` and per-side paddings; `padding-inline-start/end` (RTL)
  - Warning: Lynx parses negative padding as a valid length and applies it (webview treats it as invalid and falls back to `0`). Never emit negative padding.
- `border`, per-side borders, `border-width/style/color`, `border-radius`, per-corner radii, logical corner radii (`border-start-start-radius` etc.)
- `box-shadow`
- `box-sizing: auto | border-box | content-box` (initial `auto`: normally `border-box`, but legacy Web-aligned configuration may resolve it to `content-box`). Set `border-box` or `content-box` explicitly for configuration-independent sizing.
- `overflow` / `overflow-x` / `overflow-y`: `visible | hidden | scroll` (partial; actual scrolling belongs to `scroll-view`, use `overflow` only for clipping/ellipsis)
- `clip-path` (verify complex shapes on target)

### Visual

- `background`, `background-color`, `background-image`, `background-size`, `background-position`, `background-repeat`, `background-origin`, `background-clip`
  - `background-attachment` is unsupported; expand webview shorthands that carry `fixed` / `scroll` slots into the supported longhand properties.
  - Multi-layer `background-image` lists should not carry `none` placeholder layers; remove the layer and re-align the other `background-*` lists, or split layers into nested `view`s.
  - Small repeated bitmaps can show approximately 1 px seams at some Android display scale factors. For strictly seamless output use a larger seamless asset, a solid color, or separate `image`/`view` layers.
  - The `background-clip` longhand default is `border-box`, but an image-bearing `background` shorthand without clip/origin can paint its image relative to `padding-box`. Dotted/dashed border gaps can expose the underlay. Split into longhands and set `background-clip: border-box`, or use a solid border/separate outer background and inner image layers.
- `color`, `opacity`
- `visibility: visible | hidden`
- `transform` (`translate/translateX/translateY/translate3d`, `scale/scaleX/scaleY`, `rotate/rotateX/rotateY/rotateZ`, `matrix3d`), `transform-origin`
- `mask-image` (partial; verify on target, never with SVG sources)

### Text

- `font-size`, `font-weight`, `font-family`, `font-style`, `line-height`
- `color`, `text-align`, `text-decoration`
- `text-overflow: clip | ellipsis` (only these values; `fade` unsupported)
- `white-space: normal | nowrap` (only these values)
- `direction: ltr | rtl | normal`

### Transition and Animation

- `transition`, `transition-property`, `transition-duration`, `transition-timing-function`, `transition-delay`
- `animation`, `animation-name`, `animation-duration`, `animation-timing-function`, `animation-delay`, `animation-iteration-count`, `animation-direction`, `animation-fill-mode`
- `@keyframes` basics work; keep keyframes simple (transform/opacity first) and verify advanced combinations on target.
- `scale3d` and `rotate3d` are unsupported: either makes the whole transform declaration invalid, and a corresponding transform keyframe is omitted from the animation curve. Use `scale(x, y)` for XY scaling, `rotateX/Y/Z` for single-axis rotation, or `matrix3d(...)` for Z scaling/arbitrary-axis rotation. `translate3d` remains supported.

## Unsupported Properties

Emitting these produces no effect or a template-encode warning ("Unsupported property ... was removed during template encode"). Treat encoder warnings as review failures, not cosmetic noise.

- Layout: `float`, `clear`, `position: static`, `display: inline | inline-block | table* | list-item | contents`
- Multi-column layout: `columns`, `column-count`, `column-width`, `column-rule*`, `column-span`, `column-fill` — absent from the Lynx support matrix and layout-critical, treat as unsupported. Note: `column-gap` itself stays valid in flex/grid contexts.
- CSS shapes: `shape-outside`, `shape-margin` — absent from the support matrix (and float, which shapes depend on, is unsupported).
- Table: `table-layout`, `border-collapse`, `border-spacing`, `caption-side`, `empty-cells`
- Lists / generated content: `list-style-type`, `list-style-image`, `list-style-position`, `content`, `quotes`, `counter-reset`, `counter-increment`
- Text: `text-transform`, `word-spacing`, `word-break`, `word-wrap` / `overflow-wrap`, `hyphens`, `tab-size`, `writing-mode`, `text-orientation`, `unicode-bidi`, `white-space: pre | pre-wrap | pre-line | break-spaces`
- Interaction / scroll: `pointer-events`, `cursor`, `resize`, `scroll-behavior`, `scroll-snap-*`, `overscroll-behavior`
- 3D: `transform-style`
- Background: `background-attachment`

Partial / verify-on-target properties: `letter-spacing`, `text-indent`, `vertical-align`, `user-select`, `perspective`, `will-change`, `mask-image`, `clip-path` (complex shapes), `minmax()` beyond basic use.

## Units and Values

### Length Units

| Unit | Status | Notes |
| --- | --- | --- |
| `px` | supported | |
| `rpx` | supported | Standard miniapp responsive unit. Same conversion as webview miniapp: `value × screen_width / 750`. Keep `rpx` from migrated TTSS as-is; do not convert. |
| `%` | supported | Percentage height needs an explicit parent size chain. |
| `vw` / `vh` | supported | |
| `rem` / `em` | supported | `rem` + `vw` root sizing is an alternative fluid strategy when a page avoids `rpx`. |
| `vmin` / `vmax` | partial | Inconsistent support; prefer `vw` / `vh`. |
| `cm` / `mm` / `in` / `pt` / `pc` | unsupported | Not normalized at runtime. Convert before output; `1in = 96px` is a safe CSS-rule conversion. Do not extrapolate a conversion for other units. |
| `ch` / `ex` | unsupported | Font-relative; no conversion rule. Replace with `px` / `em` / `rem`. |

### Intrinsic Sizing

- `max-content`: supported.
- `fit-content`: supported in normal flow. For an absolute box stretched by opposing `top/bottom` or `left/right` insets, `max-height: fit-content` or `max-width: fit-content` does not constrain the stretched size; use explicit `height` or `width`.
- `min-content`: unsupported for intrinsic `width` or `height`; in `flex-basis`, it parses but degrades to `0px`. Use `auto` or explicit sizes instead.
- `stretch` as a length value: unsupported.

### Colors

Named colors, `transparent`, hex (`#f00`, `#ff351a`, `#ff351a80`), `rgb()` / `rgba()`, `hsl()` / `hsla()` are supported. `currentColor` is partial — prefer explicit colors or CSS variables. Newer color spaces and functions (`oklch()`, `lab()`, `color-mix()`, ...) are absent from the support matrix — resolve them to hex/`rgb()`/`hsl()` before output.

### Keywords

`auto`, `none`, `inherit`, `initial` work in their usual property contexts.

### Functions

| Function | Status | Notes |
| --- | --- | --- |
| `calc()` | partial | Length properties only; see allowlist below. |
| `var()` | supported | CSS custom properties with `:root` / `page` scope work; recommended for theming tokens. Provide fallback values (`var(--color-bg, #fff)`) for resilience. |
| `env(safe-area-inset-top/right/bottom/left)` | supported | Only the four safe-area values; all other `env()` values unsupported. |
| `min()` / `max()` / `clamp()` | unsupported | Use explicit sizes, `rpx`, or JS class switching. |
| `linear-gradient()` / `radial-gradient()` | supported | Keep gradients simple. |
| `cubic-bezier(x1, y1, x2, y2)` | supported | Control points outside `[0, 1]` parse and take effect via linear extrapolation; stay in the standard range unless the effect is verified. |
| `steps(n, direction)` | supported | Direction is mandatory: `start`, `jump-start`, `end`, `jump-end`, `jump-none`, `jump-both`. `steps(5)` without direction is invalid. |
| `minmax()` | partial | Basic use in grid tracks; complex intrinsic-size combinations may diverge from webview. |
| `url()` | supported | Bitmap image sources only (PNG / WebP / JPG). Do not reference SVG files, SVG data URIs, or SVG base64 from CSS. |

`calc()` allowlist (length properties only):

- Size: `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height`
- Position: `top`, `right`, `bottom`, `left`
- Box: `margin-*`, `padding-*`
- Logical: `margin-inline-start/end`, `padding-inline-start/end`, `inset-inline-start/end`
- Flex/Grid: `flex-basis`, `gap`, `row-gap`, `column-gap`, `grid-row-gap`, `grid-column-gap`
- Text: `font-size`, `text-indent`
- Visual: `perspective`

`calc()` must not be used on enum, color, integer, border-radius, or transform values.

### Timing Functions

Keywords: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `ease-in-ease-out`, `step-start`, `step-end`.

Behavior difference: inside Lynx, `ease`, `ease-in-out`, and `ease-in-ease-out` map to the same curve, unlike web CSS where `ease` and `ease-in-out` are different beziers. Use explicit `cubic-bezier()` when the motion must match webview exactly.

### At-rules

| At-rule | Status | Notes |
| --- | --- | --- |
| `@media` | unsupported | Never generated; does not take effect at runtime. Use `rpx` / `vw` fluid sizing or JS class switching. |
| `@supports`, `@layer`, `@charset`, `@namespace` | unsupported | |
| `@container`, `@scope` | unsupported | Absent from the support matrix; same no-effect class as `@supports`/`@layer`. |
| `@import` | partial | Build-chain dependent; prefer the project's build imports. |
| `@font-face` | partial | Platform dependent. Android does not support woff/woff2 fonts. Replace woff/woff2 with base64 data URIs (`src: url("data:...")`) or a verified format. Prefer system font stacks; custom fonts need target verification. |
| `@keyframes` | partial | Basics work; advanced features need verification. |

## Lynx-Specific Extensions (Recognize Only)

Legacy Lynx code may carry these; do not generate them in new miniapp TTSS without a concrete reason:

- Text: `-x-auto-font-size`, `-x-auto-font-size-preset-sizes`
- Misc: `-x-handle-color`, `-x-handle-size`, `-x-app-region`, `-x-overlay` (iOS)
- Timing: `square-bezier()`
