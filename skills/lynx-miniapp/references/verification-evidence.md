# Verification Evidence Contract

This contract is independent of the execution tool. The consumer workflow binds an executor and the required acceptance checks. Read `compatibility-model.md` and `generation-constraints.md` for capability and generation constraints.

## Separate conclusions

Record static, build, runtime, visual, interaction, and device results separately as `passed`, `failed`, or `unverified`. A missing execution capability is an infrastructure limitation, not evidence that Lynx lacks a feature. A preview URL being ready is not a runtime pass. Compilation and browser rendering do not establish native Lynx acceptance.

## Receipt identity

Bind every runtime receipt to the artifact identity, page/route and query, actual renderer, execution provider, platform, UI state, and observed result. Keep requested renderer and observed renderer separate. An unknown renderer cannot establish Lynx acceptance. Preserve the build/source identity needed to check that receipts describe current output.

## Visual and interaction checks

A visual-parity claim needs an accessible reference image and a candidate screenshot for the same state. The consumer owns design intake; a text design may guide implementation but is not a pixel-comparison baseline. Record each declared interaction with its initial state, action, expected outcome, observed outcome, environment, and evidence. A dispatched action alone does not prove its result.

## Environment-sensitive coverage

Keep each environment's result separate. System components, permissions, hardware, system dialogs, and environment-sensitive gesture, focus, keyboard, and lifecycle behavior need evidence from the required target environment. A successful result elsewhere cannot override its failure. Read `interaction_failure_diagnosis.md` for failed hit testing or cross-environment disagreement.

## Data and external actions

Use existing authorized data or fixtures. Do not fabricate business data to make a check pass. The consumer owns authorization for new fixtures, installs, external uploads, preview, audit, and publication; verify existing authority before those operations. Missing evidence remains `unverified` and cannot be reported as completed acceptance.
