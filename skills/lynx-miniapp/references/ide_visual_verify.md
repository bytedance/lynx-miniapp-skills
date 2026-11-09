# IDE Visual Verify

Use this workflow after generating or migrating a Lynx-rendered Douyin
miniapp page. `tt-ide-cli` is the default runtime executor; the bundled Lynx
diff references remain the compatibility authority.

## Contents

- [Visual Target Gate](#visual-target-gate)
- [Verification State Authorization](#verification-state-authorization)
- [Default Executor](#default-executor)
- [Supported Surface Gate](#supported-surface-gate)
- [IDE Mode Selection](#ide-mode-selection)
- [Execution](#execution)
- [Comparison And Optional Preview Delivery](#comparison-and-optional-preview-delivery)
- [Internal Evidence And Result](#internal-evidence-and-result)
- [Safety](#safety)

## Visual Target Gate

Generation and migration implementation both require at least one accessible
visual target before source edits begin:

- a UI design exported or rendered as an image; or
- a screenshot example showing the intended page or component state.

For migration, a screenshot of the existing WebView page may be the target when
the intended result is visual parity. Record a stable target alias, the covered
page or component, and the represented state. A text-only style description is
not a substitute for the visual target.

If the visual target is missing, ask for the UI design or screenshot and mark
generation or migration implementation `blocked`. A read-only compatibility
review or migration precheck may continue, but it must not produce or claim a
verified implementation.

## Verification State Authorization

Use existing project fixtures or runtime state whenever they can represent the
user-requested target. Do not create mock, fixture, or synthetic business data
unless the user explicitly authorizes it. If the required state is unavailable,
ask for authorization or use a developer checkpoint that prepares the state.
Never edit generated miniapp output to manufacture verification data.

## Default Executor

The pinned executor is defined in
`../assets/runtime-tools.lock.json`:

- package: `tt-ide-cli`;
- command: `tma-ide-session`;
- preview command: `tma preview`;
- protocol: IDE AI Debug Protocol v1;
- required profile: `screenshot`;
- required capability: `capture`.

Use an already installed compatible executor when available. Do not silently
install or upgrade it. If it is absent, ask for authorization before invoking
an exact-version `npx` or package install. Confirm that the resolved package
identity and version match the runtime manifest before using it. Do not claim
that the recorded package integrity was verified unless the package manager or
another retained receipt actually confirms it. If package identity or version
cannot be confirmed, or does not match, do not use that executor as the default
Verify path; report the executor check as `blocked`.

Local status and console inspection does not require `tma login`. The Douyin developer-tool simulator supports both Lynx and WebView pages; classify evidence by the renderer actually open. A simulator screenshot is valid Lynx evidence for routine layout and style only when the target page confirms `renderType=lynx`.

## Supported Surface Gate

Before capture or interaction, classify the current surface by both host and renderer:

- `lynx-simulator`: the Douyin developer-tool simulator with the target page confirmed as `renderType=lynx`;
- `webview-simulator`: the same simulator with a WebView-rendered page, useful as a labeled WebView baseline;
- `lynx-device`: an Android/iOS device or adapter with the target page confirmed as `renderType=lynx`;
- `unsupported` or `unknown`: renderer identity or required capability cannot be proven.

A `lynx-simulator` may produce a Lynx visual pass for routine layout and style, whose results are expected to align broadly with devices. It does not prove device equivalence. Escalate system components, permissions/capabilities, native-container differences, hardware, system dialogs, gesture/focus/keyboard/lifecycle paths, and any other known environment-sensitive behavior to `lynx-device`. A `webview-simulator` receipt remains useful only for the WebView surface it actually represents. Record the surface, coverage, and unverified items in every result.

## IDE Mode Selection

Open visual and interaction Verify sessions in Lite mode by default. Lite mode
supports Compile, status inspection, viewport capture, and console-summary
retrieval; use interaction controls only when they are bound to a surface that
passes the Supported Surface Gate. Computer Use is not a reason to select Full.

Use Full only when the task requires a workbench capability unavailable in
Lite, such as manual source editing or direct use of a full DevTools panel.
Record the concrete escalation reason. Do not open parallel Lite and Full
windows for the same verification target.

## Execution

Run static and build verification first, then:

1. Create a unique request ID containing only letters, digits, `.`, `_`, and
   `-`.
2. Open the exact native project or generated Douyin miniapp artifact root:

```bash
tma-ide-session open \
  --project "/absolute/project-or-artifact/path" \
  --request-id "<request-id>" \
  --mode lite
```

3. Wait for the short-lived descriptor:

```bash
tma-ide-session wait \
  --request-id "<request-id>" \
  --timeout 30000
```

4. If the Agent host needs an MCP configuration file, materialize it outside
   the miniapp project in a private temporary directory. Treat its
   Authorization header as a short-lived secret and remove the file after the
   session.
5. Call `ide_get_status`. Continue only when `stage=ready`, protocol version is
   `1`, profile is `screenshot`, and capabilities include `capture`.
6. Apply the Supported Surface Gate. Confirm the renderer actually open, then
   confirm that the current page path/query identifies the target state and
   `page.renderType` is `lynx` for Lynx evidence. The same simulator may provide
   separate WebView and Lynx receipts; never infer one renderer from the host
   alone. The current protocol has no safe arbitrary navigation tool. When the
   route is wrong and a declared safe UI navigation scenario exists, use
   `ide_interaction_verify.md`; otherwise ask the developer to open the target
   page and read status again. Never use arbitrary JavaScript to bypass this
   boundary.
7. On a `lynx-simulator` or `lynx-device` surface, call
   `miniapp_capture_screenshot`. Retain the image plus its dimensions, SHA-256,
   project session, runtime identity, route epoch when returned, surface class,
   and warnings. A `webview-simulator` capture is a separately labeled baseline.
8. Compare the candidate with the supplied visual target. Generation compares
   against the supplied design or screenshot; migration compares against the
   supplied desired-state design or labeled WebView screenshot. Do not invent a
   WebView baseline for generation. If required coverage is environment-sensitive,
   keep the simulator result and add a real-device verification item rather than
   overstating the simulator scope.
9. Call `miniapp_get_console_summary` on the same classified surface and record
   bounded errors and warnings.
10. If the generated output is confirmed fresh but the IDE has not hot-reloaded
    it, activate Compile once in the current Lite IDE, using Computer Use when
    available or a developer checkpoint otherwise. Wait for `stage=ready`, then
    repeat the route/render, screenshot, and console checks. Do not keep clicking
    Compile; if the fresh output is still absent, inspect the opened project and
    artifact paths and report `issue` or `blocked` with the retained evidence.
11. If the requested behavior includes click, scroll, swipe, input, or another
    interaction scenario, read `ide_interaction_verify.md`. When the current
    Agent exposes usable Computer Use, use it by default; otherwise use its
    developer-checkpoint fallback.
12. If edits are authorized and the result is a clear implementation issue,
    repair source, rebuild, and rerun Verify for at most two rounds. Stop with
    retained evidence when it still does not converge.

## Comparison And Optional Preview Delivery

After the final static, build, visual, and required interaction checks reach an
acceptable result:

1. Fill `../assets/ide-verify-report.template.md` as a developer-facing result
   summary. Include the target and final candidate screenshot, visible
   differences, required interaction results, problems or limitations, and any
   developer action. Do not copy routine CLI, protocol, runtime identity,
   render-gate, hash, or capability metadata into the report unless it explains
   a failure or limitation, or the developer explicitly requests it.
2. Check whether the user explicitly requested or authorized remote preview
   delivery. Existing login state, credentials, or a request for local Verify
   does not supply that authority. When preview was not requested, do not run
   `tma preview`; record preview delivery as `not-requested`.
3. When preview is authorized, confirm that the preview entry is the same
   artifact whose fingerprint is retained in the Verify evidence. Use the
   pinned package's `tma` binary to generate a preview QR. Store the QR outside
   the developer's project unless the user selected another artifact directory:

```bash
tma preview \
  --qrcode-output "/absolute/private-temp-dir/lynx-miniapp-preview.png" \
  "/absolute/project-or-artifact/path"
```

4. Do not invoke `tma login` automatically. If an authorized preview cannot run
   because credentials, network, or preview permission are unavailable, retain
   the completed local Verify evidence and report preview delivery
   `delivery-blocked`; do not claim that the requested preview was delivered.
5. When preview succeeds, add the local preview QR path or attachment and its
   matching verified artifact fingerprint to the report, and record preview
   delivery as `delivered`.

`tma preview` is the only remote preview action this workflow may use after
explicit user authority. Do not substitute upload, audit, publication, or
another project's artifact.
Treat the preview QR and its backing URL as scoped delivery artifacts: do not
commit them or expose them outside the requested report.

## Internal Evidence And Result

Keep static/build and runtime evidence separate. This technical receipt supports
the Agent's analysis and is not the default developer-facing report. A runtime
receipt should bind:

- visual target alias and target state;
- page path and query;
- expected and observed render type;
- execution surface (`lynx-simulator`, `webview-simulator`, or `lynx-device`) and observed renderer;
- coverage completed on that surface and any unverified or real-device-required items;
- IDE mode and the reason for any Full-mode escalation;
- verification-state source and any explicit authorization for synthetic data;
- generated-output or build fingerprint when available;
- whether one explicit Compile action was needed to load confirmed-fresh output;
- screenshot path or image content, dimensions, and SHA-256;
- project/runtime identity and route epoch when returned;
- console error and warning counts;
- executor package version, protocol version, and capability;
- runtime-manifest package/version match and whether integrity verification had
  a retained receipt or remained unavailable;
- Computer Use availability/mode, render gate, and required step results;
- preview delivery status and, when authorized and successful, the preview QR
  path and matching verified artifact fingerprint;
- target-versus-candidate UI comparison result;
- timestamp and redactions.

Use these visual results:

- `passed`: the visual target exists, static/build checks pass, a
  `lynx-simulator` or `lynx-device` surface and Lynx renderer are confirmed,
  the screenshot is readable and matches the target, and no blocking console
  issue exists within the recorded coverage. A simulator pass is sufficient for
  routine layout and style, but any required environment-sensitive item remains
  unverified until covered on a device.
- `issue`: evidence identifies a concrete build, route, render, screenshot,
  target mismatch, or console problem.
- `developer-confirmation-required`: evidence is insufficient or the decision
  depends on subjective polish, login, payment, privacy permission, business
  data, animation, or an interaction that this profile cannot verify.
- `blocked`: the required visual target, generated artifact, executor,
  protocol, or capture capability is unavailable and visual Verify cannot run.

Keep the final delivery status separate:

- `not-requested`: local static, build, visual, and required interaction
  evidence is complete, but the user did not request or authorize remote
  preview delivery.
- `delivered`: local verification and UI comparison are complete and an
  explicitly authorized preview QR was produced from the same verified
  artifact.
- `delivery-blocked`: the UI comparison or required interaction evidence is
  unavailable, or an explicitly authorized preview cannot be delivered because
  credentials, network, permission, or QR generation is unavailable. Preserve
  successful lower-layer evidence and state which requested output is blocked.

A screenshot alone does not prove route correctness, build identity,
interaction parity, performance, or real-device behavior. In particular, never
mark click or scroll as verified from screenshot evidence alone: execute each
interaction separately and capture its observable result (for example, a
before/after state, changed value, or reached route). A confirmed
`lynx-simulator` may pass routine interactions when that execution-and-result
evidence is complete; this rule does not reject simulator interaction evidence.
Do not claim video, tabbar, payment, permission, or business-flow verification
without the corresponding separate evidence.

## Safety

- Do not expose descriptor contents, endpoints, Authorization headers, app
  credentials, or sensitive query values in chat, logs, reports, or Git.
- Do not write screenshots or temporary MCP configuration into the developer's
  project unless they explicitly request retained artifacts there.
- Do not terminate an existing IDE process. Leave the verified page open for
  developer inspection.
- If the Agent host cannot attach to Streamable HTTP MCP with a custom
  Authorization header, report the host limitation and return
  `developer-confirmation-required` rather than claiming a runtime pass.
