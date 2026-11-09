# Lynx Miniapp Third-Party Framework Diff (Taro / uni-app)

Use this reference when a Douyin miniapp built with a third-party framework — primarily Taro (Template & JSX) and uni-app — migrates to Lynx rendering. Framework layers wrap native miniapp capabilities, so Lynx differences surface twice: in the compiled miniapp artifacts, and in framework runtime behavior that assumes webview rendering.

Official framework-specific diff enumeration is still being published. Do not invent Taro- or uni-app-specific support facts; everything checkable today reduces to the compiled output plus the four core diffs.

## Working Principle

Third-party frameworks compile to standard miniapp artifacts (TTML/TTSS/JS/JSON). Lynx compatibility is judged on the **compiled output**, then fixes are mapped back to framework source (JSX/Vue SFC/templates):

1. Identify the framework and locate its build output (e.g. `dist/`).
2. Run the four core diffs against the compiled artifacts: `component_diff.md`, `api_diff.md`, `framework_diff.md`, `css_diff.md`.
3. Map each finding back to the source file that generates it; fix at the source level, not in `dist/`.
4. Re-verify on the compiled output after rebuilding.

Style inconsistencies under a third-party framework are TTSS issues first — route them through `css_diff.md` before suspecting the framework layer.

## Framework-Layer Risk Areas to Check

These are webview assumptions commonly baked into framework runtimes, plugins, or UI libraries. Check for them; report only what the code actually uses.

- Render configuration: confirm the framework's config layer can emit `renderType: "lynx"` into the generated `app.json`/page JSON (`framework_diff.md`), and that it does not force-generate `skeleton` config for Lynx pages.
- Global scroll assumptions: framework page scaffolds and pull-to-refresh/infinite-scroll plugins built on `onPageScroll`/`onReachBottom`/`tt.pageScrollTo` — all unsupported; rework onto a root `scroll-view` (`css_diff.md` §4.1).
- Runtime API usage: framework animation helpers or responsive utilities that call `tt.createAnimation`, `tt.matchMedia`, `MediaQueryObserver`, or `SelectorQuery.selectViewport` (`api_diff.md`).
- UI library CSS: component libraries frequently rely on `::before`/`::after` (hairline borders, icons), structural pseudo-classes, and `@media` — all silent failures in Lynx (`css_diff.md` §3.7, §3.10). Audit imported library styles, not just project styles.
- Unsupported components in library wrappers: `movable-view`, `navigator`, `open-data`, `camera`, `live-preview` and the attribute-level diffs in `component_diff.md`.

## Fixing Policy

- Framework source syntax is never support evidence; the generated miniapp artifacts are the compatibility surface.
- Prefer source-level fixes (JSX/Vue SFC/template/style/config/plugin) so regenerated output stays compatible; never patch `dist/` as the durable fix unless the user explicitly asks for a temporary patch.
- When a framework plugin hard-depends on unsupported page-scroll, selector, animation, or media-query APIs, report it as blocked or requiring plugin replacement.

## Output Expectations

For third-party framework migration reports, state findings at both levels: the compiled artifact evidence (file + rule hit) and the framework-source location to change. If a framework capability cannot be adapted (e.g. a plugin hard-depends on page scroll APIs), report it as blocked rather than patching compiled output.

When repository path, safe build command, platform target confirmation, or generated output are missing, stop before auditing and do not invent compatibility claims from source guesses. Output `状态：⛔ 阻塞（blocked）` and request the safe `构建命令（build command）` and `构建产物 / 生成产物（generated output）` for `抖音小程序（Douyin miniapp）` target.
