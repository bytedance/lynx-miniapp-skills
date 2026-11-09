# Lynx Miniapp Framework Diff

Use this reference for page config, render mode, skeleton, lifecycle, component instance behavior, scrolling, selectors, and SJS. It records Lynx miniapp framework differences from webview-rendered Douyin miniapp behavior; lifecycle hooks, config fields, and instance behavior not mentioned here are preserved by default. Status markers are defined in `compatibility-model.md`.

## Render Configuration

- Page-level Lynx rendering: set `renderType` in the page JSON. Whole-miniapp: set it in `app.json`.

```json
{
  "renderType": "lynx"
}
```

- Migrate page by page (page JSON) or whole-app (`app.json`). If `app.json` already sets `renderType: "lynx"`, do not duplicate it in page JSON unless the project explicitly needs a page-level override.
- 🚫 Skeleton screens: `skeleton` config targeting Lynx pages is ineffective (`removeSkeleton` is also unsupported). Remove or rewrite skeleton usage for Lynx pages.

## Runtime Render Type Detection

`Page` and custom component instances may expose `renderType: 'lynx' | 'webview' | undefined`. Some runtime environments do not expose the field, so only treat `this.renderType === 'lynx'` as positive evidence.

```javascript
Page({
  onLoad() {
    if (this.renderType === 'lynx') {
      // Lynx rendering
    } else {
      // webview rendering (or field not exposed)
    }
  }
});
```

Branch on `renderType` only when behavior truly differs between render modes; do not split logic preemptively.

## Page Diffs

🚫 Unsupported page event handlers:

- `onReachBottom` — use root `scroll-view` `bindscrolltolower`.
- `onPageScroll` — use root `scroll-view` `bindscroll`.

🚫 Unsupported instance methods:

- `createMediaQueryObserver` (see `api_diff.md`)
- `removeSkeleton`

🔁 Behavior diffs:

- Webview pages scroll globally by default; Lynx pages need scrolling regions built with `scroll-view`. For page-level scrolling the root scroll container must be `scroll-view` with `height: 100%` (generation-constraints.md#page-scrolling; structure in `css_diff.md` §4.1).
- `selectComponent` / `selectAllComponents`: do not assume synchronous results; descendant selectors are unsupported.

```javascript
// Before: descendant selector never resolves
this.selectComponent('.list .item');
// After: address the component directly, or pass data down through parent state
this.selectComponent('#targetItem');
```

## Custom Component Diffs

🚫 Unsupported instance methods:

- `createMediaQueryObserver`
- `getRelationNodes`

🚫 Unsupported capabilities:

- External styles (`externalClasses`).
- Fragment component nodes.
- Data observers (`observers`).
- Component relations (`relations`).

🔁 Behavior diffs:

- `selectComponent` / `selectAllComponents`: same async and descendant-selector limits as pages.

## SJS Diff

- 🚫 SJS event response capability is unsupported. Keep SJS for data formatting; move event handling to page/component JS.

## Debugging Note

Use `verification-evidence.md` to classify evidence independently of execution tooling. The consumer workflow must confirm the opened route and actual renderer before claiming Lynx runtime support. Keep environment-sensitive behavior and device results separate; `map` and `web-view` require real-device coverage (`component_diff.md`).

## Review Rules

- Check `app.json` and page `.json` files for `renderType`, skeleton config, Canvas render options, and migration scope.
- Check `.js` files for unsupported page event handlers, instance methods, relation APIs, observers, and selector usage.
- Check UI behavior and tests for global-scroll assumptions; replace with a root `scroll-view` with `height: 100%`.
