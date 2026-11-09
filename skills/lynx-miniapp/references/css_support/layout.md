# Lynx Miniapp CSS Support Matrix: Layout Engines

Evidence reference for Flex/Grid details and for recognizing Lynx-specific Linear/Relative layout in existing code. Enter from `../css_diff.md`; generation policy and legacy-layout adaptation follow `../css_diff.md` and `../generation-constraints.md#layout-output`.

## Contents

- [Flex](#flex)
- [Grid](#grid)
- [Linear (Lynx-specific, default layout)](#linear-lynx-specific-default-layout)
- [Relative (Lynx-specific, recognize only)](#relative-lynx-specific-recognize-only)
- [Sizing Chain and Percentages](#sizing-chain-and-percentages)
- [z-index, Stacking Context, and Scroll Containers](#z-index-stacking-context-and-scroll-containers)

## Flex

### Defaults (differ from webview miniapp)

| Property | Lynx default | Webview default |
| --- | --- | --- |
| `flex-direction` | `row` | `row` |
| `flex-wrap` | `nowrap` | `nowrap` |
| `justify-content` | `stretch` | `flex-start` |
| `align-items` | `stretch` | `stretch` |
| `flex-grow` / `flex-shrink` / `flex-basis` | `0` / `1` / `auto` | `0` / `1` / `auto` |

Because `justify-content` defaults differ, always declare `flex-direction`, `justify-content`, and `align-items` explicitly in generated TTSS.

### Value vocabulary

- `flex-direction`: `row`, `column`, `row-reverse`, `column-reverse`
- `flex-wrap`: `nowrap`, `wrap`, `wrap-reverse`
- `justify-content`: `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly`, `stretch`
- `align-items` / `align-self`: `stretch`, `flex-start`, `center`, `flex-end`, `baseline` (`align-self` adds `auto`)
- `align-content` (multi-line): `stretch`, `flex-start`, `center`, `flex-end`, `space-between`, `space-around`
- Shorthand mappings: `flex: 1` = `1 1 0%`, `flex: auto` = `1 1 auto`, `flex: none` = `0 0 auto`
- `order`, `gap` / `row-gap` / `column-gap` supported

### Shrink behavior (top migration risk)

`flex-shrink` triggers only when the main axis has negative free space (row → width, column → height). Negative space is distributed by scaled shrink factor:

```text
scaled shrink factor = flex-shrink × flex base size
```

`flex base size` comes from `flex-basis`, falling back to main-axis `width` / `height` or measured content. Items with a larger base size absorb more shrinkage even at equal `flex-shrink`.

The difference from webview: webview flex items have an automatic `min-width: auto` / `min-height: auto` content floor; Lynx does not. Lynx behaves as if every flex item had `min-width: 0` (row) / `min-height: 0` (column). Text, images, and nested content keep shrinking below their content size unless explicitly protected.

- Protect content: `flex-shrink: 0`, or explicit `min-width` / `min-height` on the item.
- Make a webview preview match Lynx: add `min-width: 0` / `min-height: 0` on the webview side.
- `flex-basis: min-content` is treated as `0px`; `flex-basis: max-content` is treated as `auto`. Never use `min-content` in `flex-basis`.

## Grid

### Supported

- Tracks: fixed lengths, `fr`, `repeat()`, mixed lists; `grid-auto-columns` / `grid-auto-rows`; `minmax()` basic usage.
- Flow: `grid-auto-flow: row | column | dense | row dense | column dense`.
- Placement: `grid-column-start` / `grid-column-end`, `grid-row-start` / `grid-row-end`, `grid-column-start: span N`, and Lynx-specific `grid-column-span: N` / `grid-row-span: N`.
- Alignment: `justify-items` / `justify-self` use `start | center | end | stretch` (+ `auto` for self); `align-items` / `align-self` use flex-style values `flex-start | center | flex-end | stretch | baseline` (+ `auto` for self). Note the asymmetry: horizontal alignment uses Grid-style keywords, vertical alignment uses Flex-style keywords.
- `gap` / `row-gap` / `column-gap`.

### Conditional shorthand support

- `grid-column` / `grid-row` placement shorthands are available when both the Douyin client is `40.3.0` or later and the miniapp base library is `4.30.0.0` or later. If either version is unknown or below the boundary, use `grid-column-start` / `grid-column-end` and `grid-row-start` / `grid-row-end`.
- Generated guidance uses only the public boundary: Douyin client `40.3.0` or later and miniapp base library `4.30.0.0` or later. If either public version is lower or unknown, use the longhands.

### Unsupported

- `grid-area` shorthand.
- Named grid lines (`[start] 1fr [end]`), `subgrid`.
- `minmax()` with complex intrinsic sizes (`minmax(min-content, max-content)`) may diverge from webview; use fixed lengths or `fr`.

### Table-to-grid mapping

`display: table*`, `table-layout`, `border-collapse`, `border-spacing` are unsupported. Grid is the replacement: `<table>` → grid container, columns → `grid-template-columns: repeat(N, <width>)`, `border-spacing` → `gap`, `border-collapse` → container `gap` + cell background/border simulation. Layouts that depend on table auto column-width distribution or `table-cell` vertical alignment semantics cannot be reproduced exactly.

## Linear (Lynx-specific, default layout)

Linear is Lynx's default layout when no `display` is set — similar to a vertical linear list. This skill never outputs Linear: output stays on Web-baseline layout primitives (generation-constraints.md#layout-output), so this section exists only for **reading** legacy Linear code and rewriting it to Flex. Official docs demonstrate the horizontal `scroll-view` track with Linear; the skill's replacement is the flex-row track in `css_diff.md` §4.2.

### Key behavioral facts

- Default direction is vertical.
- Children do NOT auto-fill the parent width (unlike webview block flow). An unstyled nested `view` chain can collapse to size 0.
- Child sizing fixes: explicit `width: 100%` on the child, `linear-layout-gravity: stretch` on the child, or `linear-cross-gravity: stretch` on the container.
- No wrapping, no `order`, no `align-content`. If legacy Linear code needs wrap/reorder/multi-line alignment, rewrite to Flex.

### Property reference

| Property | Role | Values |
| --- | --- | --- |
| `linear-orientation` | container direction | `horizontal`/`row`, `vertical`/`column` (default), `horizontal-reverse`/`row-reverse`, `vertical-reverse`/`column-reverse` |
| `linear-direction` | newer alias of orientation | `row`, `column` (default), `row-reverse`, `column-reverse` |
| `linear-gravity` | container main-axis alignment | `none`, `top`, `bottom`, `left`, `right`, `center-vertical`, `center-horizontal`, `center`, `start`, `end`, `space-between` |
| `linear-layout-gravity` | per-child cross-axis alignment | `none`, `top`, `bottom`, `left`, `right`, `center-vertical`, `center-horizontal`, `center`, `fill-vertical`, `fill-horizontal`, `stretch`, `start`, `end` |
| `linear-cross-gravity` | container cross-axis default alignment | `none`, `start`, `end`, `center`, `stretch` |
| `linear-weight` | per-child share of remaining main-axis space | number (like a grow weight) |
| `linear-weight-sum` | override total weight | number |

Reading guide: `linear-weight: 1` on a child ≈ `flex: 1` main-axis behavior; `linear-layout-gravity: stretch` ≈ `align-self: stretch`; `linear-gravity: center` ≈ `justify-content: center`.

### Flex rewrite mapping (when migrating legacy Linear to Flex)

| Linear | Flex equivalent |
| --- | --- |
| `display: linear` (default vertical) | `display: flex; flex-direction: column;` |
| `linear-orientation: horizontal` | `flex-direction: row` |
| `linear-weight: N` | `flex-grow: N; flex-shrink: 1; flex-basis: 0;` |
| `linear-gravity: center` | `justify-content: center` |
| `linear-gravity: space-between` | `justify-content: space-between` |
| `linear-layout-gravity: center` | `align-self: center` |
| `linear-layout-gravity: stretch` | `align-self: stretch` |
| `linear-cross-gravity: stretch` | `align-items: stretch` |

## Relative (Lynx-specific, recognize only)

Android-RelativeLayout-style positioning. Children carry a numeric `relative-id` and position themselves against `parent` or sibling ids.

- Anchors: `relative-align-top/bottom/left/right: parent | <id>`; logical variants `relative-align-inline-start/end`.
- Ordering: `relative-top-of` / `relative-bottom-of` / `relative-left-of` / `relative-right-of: <id>`; logical variants `relative-inline-start-of` / `relative-inline-end-of`.
- Centering: `relative-center: none | vertical | horizontal | both`.
- Constraints: `relative-id` must be unique within the container; circular references break layout; a child with no relative properties stacks at the top-left.

Most Relative layouts translate to Flex rows/columns or `position: absolute` anchoring; rewrite when touching the layout, keep as-is when only reviewing unrelated changes.

## Sizing Chain and Percentages

- Percentage sizes resolve against an explicitly sized parent. A percentage-height chain must be anchored: e.g. `scroll-view { height: 100% }` works only if every ancestor up to the page root has a resolvable height.
- Empty `view`s without explicit size are typically 0×0 in Linear layout; give containers explicit sizes or let Flex distribute space.
- A percentage depends cyclically on an ancestor when that ancestor uses `auto`, `fit-content`, or `max-content` on the same axis and derives its size from content. Linear favors a single measurement pass: the percentage can have no effect, and an empty node can have main-axis size `0`, unlike Web or Flex remeasurement.
- Break the cycle with explicit sizes on key ancestors. Allocate remaining space with `flex-grow`/`flex-shrink` instead of content-sized percentages. If percentage remeasurement is required, verify the whole subtree uses Flex; intervening Linear layout or custom text measurement can change the result.

## z-index, Stacking Context, and Scroll Containers

- `z-index` requires a positioned element (`position: relative | absolute | fixed | sticky`).
- Inside scroll containers (`scroll-view` and similar), a child with `z-index` is promoted to its own compositing layer and may stop following the container's scroll offset.
- Fix: give the parent container its own stacking context with `position: relative; z-index: 0;` so children stay in the same layer and follow the scroll.

```css
.scroll-header {
  position: relative;
  z-index: 0; /* keeps z-indexed children following the scroll */
}

.scroll-header .badge {
  position: absolute;
  z-index: 10;
}
```
