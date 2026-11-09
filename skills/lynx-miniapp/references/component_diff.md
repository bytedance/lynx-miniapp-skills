# Lynx Miniapp Component Diff

Use this reference when TTML components, component attributes, component events, or component behavior affect the task. It records Lynx miniapp component differences from webview-rendered Douyin miniapp behavior. Components and attributes not mentioned here are preserved by default (compatibility-model.md). Status markers ✅/🔁/⚠️/🚫 are defined in `compatibility-model.md`.

## Contents

- [Support Matrix](#support-matrix)
- [Lynx-Added Components](#lynx-added-components)
- [Component Placement and Internal Content](#component-placement-and-internal-content)
- [Review Rules](#review-rules)

## Support Matrix

Component event `target` and `currentTarget` objects do not expose `offsetLeft` or `offsetTop`. When migration logic needs element geometry, query the explicit node with `NodesRef.boundingClientRect` instead of reading offset fields from the event object.

### Basic content

| Component | Status | Differences |
| --- | --- | --- |
| `text` | 🔁 | Unsupported attribute: `space`. `decode` setting is ineffective — HTML entities are always decoded. Behavior: `text` is block-level by default, so sibling `text`s stack vertically; wrap them in a parent `text` to get inline flow. |
| `rich-text` | ⚠️ | `class` attribute unsupported. Rendered through web-view: avoid many instances on one page (high memory). |
| `progress` | ✅ | — |
| `icon` | ✅ | — |

For fixed-size `text` actions, follow [Component Placement and Internal Content](#component-placement-and-internal-content): let a layout container center the text node instead of relying on Flex to center the glyphs inside the text node.

```html
<!-- text is block-level by default: nest child text in a parent text for inline flow -->
<text class="price">
  <text class="currency">¥</text>
  <text class="amount">{{amount}}</text>
</text>

<!-- rich-text: keep it for rich content, but move class styling to a wrapper view -->
<view class="article">
  <rich-text nodes="{{nodes}}" />
</view>
```

### View containers

| Component | Status | Differences |
| --- | --- | --- |
| `view` | ✅ | Raw text inside `view` does not need a `text` wrapper (generation-constraints.md#text-wrapping). |
| `mask` | ✅ | — |
| `scroll-view` | 🔁 | Unsupported attributes: `enhanced`, `refresher-threshold`. Behavior: `bounces` works directly (no enhanced mode needed); class-selector based node selection unsupported. Page-level scrolling: root `scroll-view` with `height: 100%` (generation-constraints.md#page-scrolling). Horizontal scrolling: wrap all content in one direct child `view` track laid out as a Flex row with an explicit total width — see `css_diff.md` §4.2; avoid extra wrappers between `scroll-view` and the track. High-performance list mode is available through `type="list"` plus direct `list-item` children; see [High-Performance List Mode](#high-performance-list-mode). |
| `swiper` / `swiper-item` | 🔁 | Unsupported attributes: `display-multiple-items`, `easing-function`. `indicator-color`/`indicator-active-color` only accept `rgb()`/`rgba()` formats. |
| `movable-area` / `movable-view` | 🚫 | Report unsupported draggable behavior; propose gesture/JS alternatives only if requirements allow. |

### Forms

| Component | Status | Differences |
| --- | --- | --- |
| `form` | 🔁 | Unsupported attributes: `conversion-target`, `clue-component-id`. For `bindsubmit`/`bindreset` geometry, apply the component event rule above. |
| `button` | 🔁 | Lynx-added attribute: `hide-border` (hides the native border — never `button::after { border: none; }`, see `css_diff.md` §4.8). `hover-stay-time` is unsupported. Preserve supported `hover-start-time` and `hover-stop-propagation` behavior; do not rely on a post-touch hover duration. |
| `checkbox-group` / `checkbox` | 🔁 | Multi-level `checkbox-group` nesting is unsupported. Multiline checkbox layouts can render incorrectly; flatten groups and verify multiline form rows. |
| `radio-group` / `radio` | ✅ | — |
| `slider` | ✅ | — |
| `switch` | ✅ | — |
| `input` | 🔁 | Unsupported attributes: `placeholder-class`. Style placeholders with `::placeholder` instead. `type="number"` does not display masked `**` content. |
| `textarea` | 🔁 | Unsupported attributes: `auto-height`, `disable-default-padding`, `show-confirm-bar`, `placeholder-class`. Unsupported event: `bindlinechange`; `bindkeyboardheightchange.detail.duration` is unavailable. Set explicit height instead of `auto-height`. For both `input` and `textarea`, keyboard dismissal differs from WebView because Lynx defaults to page-tap dismissal, not scroll dismissal. |
| `label` | 🔁 | Raw text inside `label` does not need a `text` wrapper. `bindtap` events lack `touches`, `changedTouches`, and `detail`; do not read those fields from label taps. |
| `picker` | 🔁 | `mode="region"` unsupported. iOS native picker panel styling may differ from WebView and needs visual verification when exact parity matters. |
| `picker-view` | 🔁 | Unsupported attribute: `immediate-change`. No inline `view`/`text` children — data-driven rendering only. |
| `picker-view-column` | ✅ | — |

### Navigation

| Component | Status | Differences |
| --- | --- | --- |
| `navigator` | 🚫 | Use JS navigation APIs or project navigation patterns. |

### Media

| Component | Status | Differences |
| --- | --- | --- |
| `image` | 🔁 | Unsupported attribute: `lazy-load`. `mode` only supports `scaleToFill`, `aspectFit`, `aspectFill`, `center`. `webp` attribute is ineffective — WebP always parses. Does not render `.svg`; use the Lynx-added `svg` component. Give images explicit size or `aspect-ratio`. |
| `video` | 🔁 | Miniapp base library `>= 4.28.0` (corresponding Douyin client `40.2.0`) aligns with WebView video support. Below that boundary, unsupported attributes include `loop`, `controls`, `vslide-gesture`, `vslide-gesture-in-fullscreen`, `enable-progress-gesture`, `enable-play-gesture`, `enable-play-in-background`, `show-mute-btn`, `show-playback-rate-btn`, `show-screen-lock-button`, `show-casting-button`, `show-progress`, `show-bottom-progress`, `playback-rate-list`, `direction`, `signature`, `definition`, `poster-size`, `duration-limit`, `encrypted-token`, `enable-dark-water-mark`; unsupported events include `bindwaiting`, `bindloadedmetadata`, `bindcontroltap`, `bindenterbackground`, `bindclosebackground`, `bindleavebackground`, `bindcontrolstoggle`, `bindplaybackratelistchange`. |
| `live-preview` | 🚫 | Report unsupported live preview. |
| `camera` | 🚫 | Report unsupported camera. |

### Canvas

| Component | Status | Differences |
| --- | --- | --- |
| `canvas` | 🔁 | Requires a page.json switch (below). Unsupported: `canvas-id` (Canvas V1), `Canvas.createPath2D`. Related API limits: `api_diff.md`. |

```json
{
  "renderOptions": {
    "lynx": {
      "enableCanvas": true
    }
  }
}
```

### Map and open capabilities

| Component / capability | Status | Differences |
| --- | --- | --- |
| `map` | ✅ | Simulator unsupported — verify on a real device. |
| `web-view` | ✅ | Simulator unsupported — verify on a real device. |
| `open-data` | 🚫 | Report unsupported platform data display. |
| `aweme-data` | 🚫 | Report unsupported Douyin data component. |
| `button` open capabilities: share, acquire phone number, IM customer service, platform customer service, navigate to video page, open Aweme user profile, open webcast room, private-message authorization, privacy agreement, add to desktop | ✅ | Still check the base `button` attribute diffs above. |

## Lynx-Added Components

### `svg`

Renders `.svg` files (`image` cannot). Set explicit `width`/`height` through `style`; use `src` or `content`, not both. Never load SVG through CSS (`css_diff.md` CSS Hard Rule 8).

### High-Performance List Mode

Use this when the page needs long-list virtualization. It is a Lynx miniapp extension on `scroll-view`, not a replacement for ordinary page scroll.

- Enable it with `<scroll-view type="list">`; `list` is the only effective `type` value for this mode, and other values currently do not enable list rendering. The first-level children must be `list-item` nodes. If there is only one direct child, virtualization benefits can disappear.
- `list-item` must be explicitly enabled in `app.json` before use:

```json
{
  "enableComponents": ["list-item"]
}
```

- A same-name custom `list-item` component takes priority by default. If the developer explicitly enables built-in priority, the built-in component wins; confirm that setting before changing an existing custom component.
- `scroll-view` owns the list container controls:
  - `sticky` is optional and defaults to `false`; enable it when child list items need sticky behavior.
  - `sticky-offset` is optional and defaults to `0`; it is a number in px from the list viewport top or bottom for sticky positioning.
  - `scroll-into-view` in list mode is pending publication; use it only after target-baseline support is confirmed. In list mode it targets a direct first-level `list-item` by unique stable id and does not target descendants inside a cell.
  - `scroll-into-view-offset` is pending publication; use it only after target-baseline support is confirmed. It defaults to `0` and only takes effect together with list-mode `scroll-into-view`; it reserves a px distance between the target list item and the list viewport start.
  - `cache-extent` and `scroll-anchoring` remain `scroll-view` concerns.
- `list-item` owns the item-level controls:
  - `item-key` is optional but should be set to a unique, stable data identity when available; if omitted, the child `nodeId` is used.
  - `full-span` marks a list child as occupying the full row or column; use it for headers, footers, loading rows, or sticky rows that must not share a lane.
  - `sticky-top` and `sticky-bottom` are declared on first-level `list-item` nodes to pin that item to the top or bottom. List mode supports only first-level sticky items, not sticky grandchildren.
  - `estimated-main-axis-size-px` is pending publication; use it only when the target baseline confirms support. It accepts finite values greater than `0`, supports dynamic updates, uses px, and improves off-screen size estimation for long-distance positioning.
- On lower or unknown target baselines, do not generate or rely on the three pending-publication attributes above. A documentation example is not proof that its pending attributes have shipped.
- Dynamic or lazy content inside a list item reduces the optimization benefit. Render the item with its content, provide an explicit item height, or use `estimated-main-axis-size-px` after confirming target support.
- Unsupported or risky list-mode patterns: arbitrary multi-level nested scrolling, arbitrary dynamic waterfall layouts, reuse across different `itemType` shapes, long-distance jumps without a height estimate, `position: fixed` inside list items, and z-indexed grandchildren without a `z-index` on the owning `list-item`.

## Component Placement and Internal Content

For `text`, distinguish positioning the whole text node from aligning its glyphs inside a fixed-size box. A parent `view` can use Flex to center a `text` child. For a fixed-size text action, prefer that structure rather than relying on `display: flex`, `align-items`, and `justify-content` on the `text` itself to center its glyphs. See [Flex centering of text actions](css_diff.md#flex-centering-of-text-actions) for one example.

Apply this distinction by component behavior, not by a blanket “non-container” category:

| Component | What is being arranged | Generation guidance |
| --- | --- | --- |
| `text` | Text content is typeset inside a text node | Let a parent `view` arrange the whole node; use supported text styles for its text content. |
| `input` / `textarea` | Editable text, placeholder, and caret belong to the editing control | Use supported control attributes and text styles internally; parent Flex arranges the whole control. Do not infer the same centering defect as `text` without target evidence. |
| `image` | The image is drawn within the image node's bounds | Use a supported `mode` for image fitting/alignment; parent Flex arranges the whole image node. |
| `rich-text` | Rich content has its own internal rendering structure | Separate outer placement from internal content formatting; outer Flex does not lay out the rich-text paragraphs. |
| `button` | A control with its own content structure and default styling | Preserve button behavior, form semantics, and open capabilities; do not replace it solely because of the `text` guidance. |
| `view` / `label` | Child nodes participate in container layout | Use their supported layout behavior; do not introduce wrappers merely based on a component's name. |

The text-action pattern is a generation recommendation, not a blanket unsupported-Flex rule. Do not ban Flex on every non-container component, and do not require every raw text node inside `view` or `label` to gain a `text` wrapper. A device-specific failure still needs a controlled before/after check before claiming its runtime cause is verified.

## Review Rules

- Treat 🚫 components as blocking: replace with supported UI or report that direct migration is impossible; never silently keep them.
- For 🔁 components, flag only the listed attributes/events/behaviors; preserve everything else as webview behavior.
- Text-wrapper reports: raw miniapp text inside `view`/`label` is not an issue by itself (generation-constraints.md#text-wrapping).
- Simulator-only validation is insufficient for `map` and `web-view`; recommend real-device verification in migration reports.
