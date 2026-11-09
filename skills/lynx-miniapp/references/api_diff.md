# Lynx Miniapp API Diff

Use this reference when JS calls platform APIs, selector APIs, animation APIs, canvas APIs, media query APIs, or page location APIs. It records Lynx miniapp API differences from webview-rendered Douyin miniapp behavior; it is not a complete API support matrix. `tt.*` APIs absent from this list are supported by default (compatibility-model.md) — the replacement patterns below only use such baseline APIs. Status markers are defined in `compatibility-model.md`.

## Contents

- [Unsupported APIs](#unsupported-apis)
- [Migration Examples](#migration-examples)
- [Review Rules](#review-rules)
- [Test Case Guidance](#test-case-guidance)

## Unsupported APIs

| API | Status | Lynx impact | Suggested handling |
| --- | --- | --- | --- |
| `tt.pageScrollTo` | 🚫 | Lynx pages have no global page scroll to target. | Drive the root `scroll-view` instead (Example 1). |
| `tt.createAnimation` | 🚫 | Imperative animation builder unavailable. | CSS transitions/animations + state classes (Example 2; `css_diff.md` §3.11). |
| Canvas V1 APIs (`tt.createCanvasContext`, `canvas-id` based) | 🚫 | Canvas V1 does not exist in Lynx miniapp. | Canvas V2 node + 2D context with the page.json switch (Example 3; `component_diff.md` Canvas). |
| `Canvas.requestAnimationFrame` / `Canvas.cancelAnimationFrame` | 🚫 | Frame-loop API unavailable on Lynx canvas. | Timer-driven loop only after device verification, or report unsupported (Example 4). |
| `Canvas.createPath2D` | 🚫 | Path2D objects unavailable. | Imperative context path calls (Example 4). |
| `tt.matchMedia` | 🚫 | Runtime media queries unavailable (CSS `@media` too). | Window info + class switching (Example 5; `css_diff.md` §4.4). |
| `MediaQueryObserver` (incl. `createMediaQueryObserver`) | 🚫 | Observer never fires. | Same as `tt.matchMedia` (Example 5). |
| `SelectorQuery.selectViewport` | 🚫 | No viewport query target. | Query an explicit node instead (Example 6). |
| `NodesRef.fields.computedStyle` | 🚫 | Computed style reads unavailable. | Geometry via `boundingClientRect`; style state from data (Example 6). |

## Migration Examples

Examples show the mechanical rewrite using Douyin-baseline APIs; verify behavior (animation pacing, scroll feel) on a real device.

### Example 1: tt.pageScrollTo → scroll-view attributes

```javascript
// Webview
tt.pageScrollTo({ scrollTop: 0, duration: 300 });
```

```html
<!-- Lynx: bind the root scroll-view's position to data -->
<scroll-view scroll-y="{{true}}" class="page-scroll"
             scroll-top="{{scrollTop}}" scroll-with-animation="{{true}}">
  ...
</scroll-view>
```

```javascript
// Lynx
this.setData({ scrollTop: 0 });
// Or anchor-based: <scroll-view scroll-into-view="{{anchorId}}"> + this.setData({ anchorId: 'section-2' })
```

`onPageScroll` / `onReachBottom` rewrites onto the same root `scroll-view` (`bindscroll` / `bindscrolltolower`) — see `framework_diff.md`.

### Example 2: tt.createAnimation → CSS transition + state class

```javascript
// Webview
const animation = tt.createAnimation({ duration: 200, timingFunction: 'ease' });
animation.scale(0.98).opacity(0.8).step();
this.setData({ ani: animation.export() });
```

```javascript
// Lynx: toggle a state class; CSS owns the motion
this.setData({ pressed: true });
```

```html
<view class="card {{pressed ? 'pressed' : ''}}" animation="{{ani}}"><!-- drop animation binding --></view>
```

```css
.card { transition: transform 0.2s ease, opacity 0.2s ease; }
.card.pressed { transform: scale(0.98); opacity: 0.8; }
```

### Example 3: Canvas V1 → Canvas V2

```javascript
// Webview V1 (unavailable in Lynx)
const ctx = tt.createCanvasContext('myCanvas');
ctx.fillRect(0, 0, 100, 100);
ctx.draw();
```

```html
<!-- Lynx: V2 canvas addressed by id; page.json needs renderOptions.lynx.enableCanvas -->
<canvas id="myCanvas" style="width: 300rpx; height: 300rpx;"></canvas>
```

```javascript
// Lynx V2
tt.createSelectorQuery().select('#myCanvas').node().exec((res) => {
  const canvas = res[0].node;
  const ctx = canvas.getContext('2d');
  ctx.fillRect(0, 0, 100, 100); // no ctx.draw() in V2
});
```

### Example 4: Canvas frame loops and Path2D

```javascript
// Webview (all unavailable in Lynx: requestAnimationFrame, cancelAnimationFrame, createPath2D)
const render = () => { draw(); canvas.requestAnimationFrame(render); };
const id = canvas.requestAnimationFrame(render);
canvas.cancelAnimationFrame(id);
const p = canvas.createPath2D();

// Lynx: no rAF on canvas — a timer loop is the only in-JS option; verify frame pacing on device
let running = true;
const tick = () => { if (!running) return; draw(); setTimeout(tick, 16); };
tick();

// Path2D → imperative context calls
ctx.beginPath();
ctx.moveTo(10, 10);
ctx.lineTo(90, 90);
ctx.stroke();
```

If the feature is animation-heavy (games, charts with continuous motion), report the frame-loop capability gap instead of silently shipping a timer loop.

### Example 5: tt.matchMedia / MediaQueryObserver → window info + class switch

```javascript
// Webview (unavailable in Lynx)
const mq = tt.matchMedia({ minWidth: 768 });

// Lynx: derive the breakpoint once from window info, drive layout by class
const { windowWidth } = tt.getSystemInfoSync();
this.setData({ isWide: windowWidth >= 768 });
```

```html
<view class="layout {{isWide ? 'wide' : 'narrow'}}">...</view>
```

Prefer `rpx`/`vw` fluid sizing over breakpoints entirely when the design allows (`css_diff.md` §4.4).

### Example 6: selectViewport / computedStyle → explicit nodes and state

```javascript
// Webview (both unavailable in Lynx)
tt.createSelectorQuery().selectViewport().scrollOffset(cb).exec();
tt.createSelectorQuery().select('.card').fields({ computedStyle: ['height'] }, cb).exec();

// Lynx: query the explicit scroll container / element geometry
tt.createSelectorQuery().select('#page-scroll').boundingClientRect((rect) => {
  // rect.width / rect.height / rect.top ...
}).exec();
// Scroll position: read from the scroll-view bindscroll event detail instead of viewport queries.
// Style-dependent logic: drive from your own state (the value you setData'd), not from computed styles.
```

## Review Rules

- Search for `tt.` calls, `createCanvasContext`, `requestAnimationFrame`/`cancelAnimationFrame`/`createPath2D` on Canvas objects, selector queries, media-query observers, animation helpers, and computed-style reads.
- Treat `Canvas.requestAnimationFrame` and `Canvas.cancelAnimationFrame` as unsupported Canvas APIs; do not infer support from generic animation docs mentioning `requestAnimationFrame` outside the Canvas context.
- For every unsupported API, decide whether the behavior moves into declarative markup/style, a supported component structure, or project-specific JS. If it cannot be recreated, report it as an unsupported capability rather than substituting webview-only code.
- Page lifecycle APIs (`onPageScroll`, `onReachBottom`) and instance methods are framework-level — see `framework_diff.md`.

## Test Case Guidance

- If a Douyin miniapp case uses unsupported APIs, either remove the Lynx case or rewrite `test_steps` around a supported behavior (e.g. scroll assertions against the root `scroll-view`, not the page).
- If UI renders but API behavior differs, add explicit behavioral `test_steps` so the benchmark does not pass on visuals alone.
