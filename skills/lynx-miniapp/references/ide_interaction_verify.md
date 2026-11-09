# IDE Interaction Verify

Use this workflow after the base checks in `ide_visual_verify.md` when the
generated or migrated page has an interaction scenario. `tt-ide-cli` remains
the runtime evidence source. Host-native Computer Use is the preferred gesture
executor when the current Agent exposes it.

This document owns IDE simulator/device execution and evidence capture. The
Douyin developer-tool simulator supports Lynx routine interaction verification
when the opened page is classified as `lynx-simulator` by
`ide_visual_verify.md`. Basic taps, scrolling, and other ordinary interactions
may pass there with complete evidence. Escalate system components,
permissions/capabilities, native-container differences, hardware, system
dialogs, gesture/focus/keyboard/lifecycle paths, and other known
environment-sensitive event chains to a `lynx-device`. If an interaction fails
or differs from a target-device result, continue through
`interaction_failure_diagnosis.md`. That shared workflow owns cross-environment
causal diagnosis; a simulator pass does not override a real-device failure.

## Contents

- [Capability Selection](#capability-selection)
- [Scenario Contract](#scenario-contract)
- [Start And Render Gate](#start-and-render-gate)
- [Execute Each Step](#execute-each-step)
- [Evidence And Results](#evidence-and-results)
- [Repair Loop](#repair-loop)

## Capability Selection

Do not hard-code a product-specific Computer Use API. Probe the current Agent
host at runtime:

1. Confirm that a Computer Use tool is exposed.
2. Confirm that it can bind or observe the classified Lynx simulator or device surface.
3. Classify the usable mode:
   - `element`: accessibility elements on the supported surface can be targeted;
   - `visual`: the supported surface can be located and controlled through screenshots
     and coordinates;
   - `manual`: a developer must perform the action;
   - `unavailable`: no usable Computer Use capability exists;
   - `blocked-permission`: the host cannot observe or control the IDE.

When `element` or `visual` is available, use Computer Use by default. Prefer
accessibility elements, then an unambiguous visual target, then coordinates
normalized to the current supported-surface viewport. Do not reuse stale accessibility
indices or absolute coordinates after the UI changes.

Keep the IDE in Lite mode for these interactions unless a concrete required
workbench capability is unavailable there. Compile, supported-surface gestures,
status, viewport capture, and console-summary retrieval do not require Full.

When Computer Use is unavailable, ambiguous, or permission-blocked, use a
developer checkpoint. Ask the developer to perform the exact action, then use
`tt-ide-cli` to verify the resulting route, render type, screenshot, and
console state. Label that evidence `developer-confirmed`; do not claim that the
Agent executed the interaction.

## Scenario Contract

Record only interactions required to accept the requested page behavior. Each
scenario needs:

- a stable scenario and step ID;
- initial route, query, and visible state;
- one action: `tap`, `double_tap`, `scroll`, `swipe`, `drag`, `input_text`,
  `press_key`, `wait`, or `developer_action`;
- an unambiguous element description or supported-surface-relative target;
- the user-declared expected observable result, route, visible state, and
  allowed console outcome;
- whether the action requires developer control.

Do not explore unrelated flows. Login, payment, privacy permission, system
permission, production submission, destructive operations, and sensitive-data
entry always use a developer checkpoint unless the user has separately and
explicitly authorized the exact action and the host policy permits it.

## Start And Render Gate

Before the first interaction:

1. Use `ide_get_status` to confirm `stage=ready`, the expected project session,
   route and query, `page.renderType=lynx`, and a `lynx-simulator` or
   `lynx-device` surface. If only a `webview-simulator` is open, its evidence is
   scoped to the WebView baseline. If the scenario includes environment-sensitive
   behavior, retain any routine simulator checks but require a device for the
   affected steps.
2. Record the miniapp start observation, surface classification, and capture an initial screenshot.
3. If a reliable render-complete or stable-view signal is available, wait for
   that signal.
4. If render completion cannot be observed, wait five seconds after the
   miniapp start observation before the first interaction.
5. Re-read `ide_get_status` and capture a fresh screenshot after the wait. If
   the project session, route, or runtime changed, restart the gate instead of
   interacting with stale state.

The five-second delay is a fallback, not proof of render completion. Record
`renderGate=signal` or `renderGate=fixed-5s-fallback` in the evidence.

## Execute Each Step

For every scenario step:

1. Observe the latest classified simulator/device UI and viewport.
2. Confirm the expected route and runtime identity through `tt-ide-cli`.
3. Capture the before screenshot and console summary.
4. Resolve the target using the selected Computer Use mode. Stop rather than
   guessing when two or more targets plausibly match.
5. Execute the action. Keep scroll and swipe inside the supported surface viewport.
6. Wait for an observable stable state. If no stable-state signal exists after
   the action, use a bounded wait appropriate to the declared expectation and
   record that limitation.
7. Re-read the UI. Call `ide_get_status`, `miniapp_capture_screenshot`, and
   `miniapp_get_console_summary` again.
8. Compare the observed result, route, and visual state with the declared step
   expectation. A successful gesture command proves only that the action was
   issued; it does not prove the requested result occurred.
9. On failure or environment disagreement, retain this IDE receipt and follow
   `interaction_failure_diagnosis.md`; do not infer a real-device root cause
   from the IDE result.

An interaction passes only when the action, expected result, observed result,
route/runtime identity, and before/after evidence form one continuous receipt.
A successful action command or a screenshot after an unobserved action is not
automatic interaction proof.

## Evidence And Results

For each step retain:

- Computer Use availability and mode;
- execution surface, observed renderer, and whether it is simulator or device;
- coverage completed on that surface and unverified or device-required steps;
- render gate and miniapp start observation time;
- action, target description, supported-surface-relative coordinates when used;
- initial state, expected observable result, and observed result;
- before and after screenshot SHA-256 values;
- expected and observed route/query;
- runtime identity and route epoch when returned;
- console error and warning counts;
- `passed`, `issue`, `developer-confirmed`, `unverified`, or `blocked`;
- limitations and redactions.

Use `passed` only for an Agent-executed interaction with complete evidence.
`developer-confirmed` means the developer performed the action and the Agent
verified the resulting state. `unverified` means a required interaction did
not run. Do not use Computer Use evidence as performance or real-device proof.

## Repair Loop

When a failed step identifies a source-owned implementation issue and edits are
authorized, retain the failed evidence, repair source, rebuild, and rerun the
scenario from its initial state. Share the two-round repair limit from
`ide_visual_verify.md`; do not add independent retries per step.
